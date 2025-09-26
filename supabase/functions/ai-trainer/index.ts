// supabase/functions/ai-trainer/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Challenge = {
  title: string;
  description: string;
  category?: string;
  estimated_minutes?: number;
  difficulty?: number;
  benefit?: string;
};

const CATEGORIES = [
  "energy",
  "mindset",
  "focus",
  "relationships",
  "home",
  "finance",
  "creativity",
  "recovery",
] as const;

function extractJson(text: string): any | null {
  try {
    // if it's already pure json
    return JSON.parse(text);
  } catch {
    // try to pull the first {...} block
    const match = text.match(/\{[\s\S]*\}$/m) || text.match(/\{[\s\S]*?\}/m);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeChallenge(raw: any): Challenge {
  const title = String(raw?.title || "").trim();
  const description = String(raw?.description || "").trim();

  // category
  const cat = String(raw?.category || "").toLowerCase().trim();
  const category = (CATEGORIES as readonly string[]).includes(cat) ? cat : "mindset";

  // estimated_minutes: allow 1–1440 (customizable to the minute)
  let estimated_minutes = Number(raw?.estimated_minutes ?? raw?.time_minutes ?? 15);
  if (!Number.isFinite(estimated_minutes)) estimated_minutes = 15;
  estimated_minutes = Math.max(1, Math.min(1440, Math.round(estimated_minutes)));

  // difficulty 1–5
  let difficulty = Number(raw?.difficulty ?? 2);
  if (!Number.isFinite(difficulty)) difficulty = 2;
  difficulty = Math.max(1, Math.min(5, Math.round(difficulty)));

  const benefit = raw?.benefit ? String(raw.benefit).trim() : undefined;

  if (!title || !description) {
    throw new Error("Invalid challenge JSON (missing title/description).");
  }

  return { title, description, category, estimated_minutes, difficulty, benefit };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { message = "", action = "greeting" } = body;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // settings/memory/recent (optional context; no catalog reads)
    const [settingsResult, memoryResult, messagesResult] = await Promise.all([
      supabaseClient.from("trainer_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabaseClient.from("trainer_memory").select("*").eq("user_id", user.id),
      supabaseClient
        .from("trainer_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const context = {
      settings: settingsResult?.data ?? null,
      memory: Object.fromEntries(
        (memoryResult.data ?? []).map((m: any) => [m.key, m.value]),
      ),
      recentMessages: (messagesResult.data ?? []).reverse(),
    };

    const systemPrompt = `
You are a warm, brief, human-sounding personal coach focused on tiny daily improvements.
Never reference being an AI. Keep messages short and actionable.

User Context:
${JSON.stringify(context, null, 2)}

Categories (use one): ${CATEGORIES.join(", ")}

${
  action === "create_challenge"
    ? `CRITICAL: RESPOND ONLY WITH JSON. NO EXTRA WORDS.
Valid JSON keys: "title", "description", "category", "estimated_minutes", "difficulty", "benefit".
- "category": one of [${CATEGORIES.join(", ")}]
- "estimated_minutes": integer minutes (1–1440).`
    : action === "feedback"
    ? "Give one or two short encouraging sentences."
    : "Greet briefly and ask one helpful question."
}
    `.trim();

    // log user message
    if (message) {
      await supabaseClient.from("trainer_messages").insert({
        user_id: user.id,
        message_type: "user",
        content: message,
      });
    }

    const openaiKey =
      Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped") || "";

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing OPENAI_API_KEY",
          response:
            "Configuration issue: missing AI credentials. Please set OPENAI_API_KEY.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // call OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message || "Create a challenge." },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("OpenAI error", aiRes.status, t);
      throw new Error("AI service unavailable");
    }

    const data = await aiRes.json();
    const rawAssistant = data?.choices?.[0]?.message?.content ?? "";

    // default visible response (non-creation paths)
    let trainerVisible = rawAssistant;

    // create-challenge: extract + normalize JSON, save custom-only, return JSON to UI
    if (action === "create_challenge") {
      const rawJson = extractJson(rawAssistant);
      if (!rawJson) throw new Error("Challenge JSON not found in AI output.");

      const ch = normalizeChallenge(rawJson);

      // save as custom user challenge only
      await supabaseClient.from("user_challenges").insert({
        user_id: user.id,
        is_custom: true,
        created_by: "trainer",
        custom_title: ch.title,
        custom_description: ch.description,
        custom_category: ch.category,
        custom_time_minutes: ch.estimated_minutes,
        status: "pending",
        scheduled_date: new Date().toISOString().slice(0, 10),
      });

      // for the chat log, store JSON only (no chatty wrapper)
      trainerVisible = JSON.stringify(ch, null, 2);

      // also return the JSON payload so the client can render without parsing chat text
      await supabaseClient.from("trainer_messages").insert({
        user_id: user.id,
        message_type: "trainer",
        content: trainerVisible,
      });

      return new Response(
        JSON.stringify({ response: ch, success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // non-creation paths: save trainer message as-is (short/coachy)
    await supabaseClient.from("trainer_messages").insert({
      user_id: user.id,
      message_type: "trainer",
      content: trainerVisible,
    });

    // simple memory drop (optional)
    if (message) {
      await supabaseClient.from("trainer_memory").upsert({
        user_id: user.id,
        memory_type: "pattern",
        key: `conversation_${Date.now()}`,
        value: `User said: ${message}. Context: ${action}`,
      });
    }

    return new Response(
      JSON.stringify({ response: trainerVisible, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("ai-trainer failure", err?.message || err);
    return new Response(
      JSON.stringify({
        error: err?.message || "Unknown error",
        response:
          "I hit a snag processing that. Please try again in a moment.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
