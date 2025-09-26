// supabase/functions/ai-trainer/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "create_challenge" | "schedule_challenge" | "feedback" | "greeting" | "message";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function safeExtractJsonObject(s: string) {
  try { return JSON.parse(s); } catch {}
  const fence = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch {}
  }
  return null;
}

const allowedCategories = new Set([
  "energy","mindset","focus","relationships","home","finance","creativity","recovery"
]);

const clampDifficulty = (n: unknown) => {
  const x = Math.round(Number(n ?? 2));
  return Number.isFinite(x) ? Math.min(5, Math.max(1, x)) : 2;
};

const clampMinutes = (n: unknown) => {
  const x = Math.round(Number(n ?? 15));
  // let people choose anything reasonable, 1–600 minutes (10 hours)
  return Number.isFinite(x) ? Math.min(600, Math.max(1, x)) : 15;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const message: string = body?.message ?? "";
    const action: Action = (body?.action as Action) ?? "message";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const [settingsRes, memoryRes, msgsRes] = await Promise.all([
      supabase.from("trainer_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("trainer_memory").select("*").eq("user_id", user.id),
      supabase.from("trainer_messages").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(10),
    ]);

    const settings = settingsRes.data ?? null;
    const memory = (memoryRes.data ?? []).reduce((acc: Record<string,string>, m: any) => {
      acc[m.key] = m.value; return acc;
    }, {});
    const recentMessages = (msgsRes.data ?? []).reverse();

    if (message) {
      await supabase.from("trainer_messages").insert({
        user_id: user.id,
        message_type: "user",
        content: message,
      });
    }

    let systemPrompt = `
You are a personal improvement coach. Encourage tiny daily wins (1% better).
Tone: warm, grounded, brief, practical. Avoid technical/AI talk.

USER CONTEXT (JSON):
${JSON.stringify({ settings, memory, recentMessages }, null, 2)}
`.trim();

    if (action === "create_challenge") {
      systemPrompt += `

When asked to create a challenge:
- RESPOND **ONLY** with a JSON object (no text outside JSON).
- Use this schema exactly:
{
  "title": "specific actionable task",
  "description": "two short sentences max",
  "category": "energy|mindset|focus|relationships|home|finance|creativity|recovery",
  "difficulty": 1,
  "estimated_minutes": 25
}
Rules:
- "estimated_minutes" may be ANY positive integer minutes (1–600). Choose what truly fits the task and the user.
- Keep it concrete, doable, and non-repetitive with recent tasks.
- Prefer what fits user time_budget, difficulty_preference, and goals if present.
`.trim();
    } else if (action === "schedule_challenge") {
      systemPrompt += `
Help plan a simple week map with varied categories and realistic time. Keep replies short, encouraging, and practical.
`.trim();
    } else {
      systemPrompt += `
Be supportive and concise (1–2 sentences). Reference streak/progress if helpful. Offer one small next step.
`.trim();
    }

    const openaiApiKey =
      Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped") || "";

    if (!openaiApiKey) {
      const fallback = "I'm having trouble generating ideas right now. Try again shortly.";
      await supabase.from("trainer_messages").insert({
        user_id: user.id, message_type: "trainer", content: fallback,
      });
      return json({ response: fallback, success: false });
    }

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message || "Hello" },
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: action === "create_challenge"
          ? { type: "json_object" }
          : { type: "text" },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text().catch(() => "");
      console.error("OpenAI error:", aiResp.status, text);
      const fallback = aiResp.status === 401
        ? "There’s an issue with the coach configuration. Please check the API key."
        : "I hit a snag. Please try again.";
      await supabase.from("trainer_messages").insert({
        user_id: user.id, message_type: "trainer", content: fallback,
      });
      return json({ response: fallback, success: false }, 500);
    }

    const aiJson = await aiResp.json();
    let trainerResponse: string = aiJson?.choices?.[0]?.message?.content ?? "";

    if (action === "create_challenge") {
      let obj = safeExtractJsonObject(trainerResponse) ?? {};

      const minutes = clampMinutes(
        (obj as any).estimated_minutes ??
        (obj as any).time_minutes ??
        (obj as any).time
      );

      const rawCategory = String((obj as any).category ?? "mindset").toLowerCase();
      const category = allowedCategories.has(rawCategory) ? rawCategory : "mindset";

      const title = String((obj as any).title ?? "Two-minute reset").slice(0, 140);
      const description = String(
        (obj as any).description ??
        "Stand up, breathe deeply, and clear your space. A tiny reset to regain momentum."
      ).slice(0, 600);
      const difficulty = clampDifficulty((obj as any).difficulty);

      await supabase.from("user_challenges").insert({
        user_id: user.id,
        is_custom: true,
        custom_title: title,
        custom_description: description,
        custom_category: category,
        custom_time_minutes: minutes,
        created_by: "trainer",
        scheduled_date: todayISO(),
        status: "pending",
      });

      trainerResponse = JSON.stringify({
        title, description, category, difficulty, estimated_minutes: minutes
      }, null, 2);
    }

    await supabase.from("trainer_messages").insert({
      user_id: user.id,
      message_type: "trainer",
      content: trainerResponse,
    });

    if (message) {
      await supabase.from("trainer_memory").upsert({
        user_id: user.id,
        memory_type: "pattern",
        key: `msg_${Date.now()}`,
        value: message.slice(0, 300),
      });
    }

    return json({ response: trainerResponse, success: true });
  } catch (e) {
    console.error("ai-trainer fatal:", e);
    return json({ error: String(e?.message ?? e), response: "Something went wrong." }, 500);
  }
});
