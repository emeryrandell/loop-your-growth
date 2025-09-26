import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function tryParseJSONBlock(text: string) {
  // 1) direct parse
  try { return JSON.parse(text); } catch (_) {}
  // 2) extract first {...} block and parse
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (_) {}
  }
  return null;
}

function sanitizeMinutes(v: unknown, fallback = 15) {
  const n = Number(v);
  if (Number.isFinite(n) && n > 0 && n < 24 * 60) return Math.round(n);
  return fallback;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, action } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- Auth
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Pull context (optional; safe if missing)
    const [settingsResult, memoryResult, messagesResult] = await Promise.all([
      supabase.from("trainer_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("trainer_memory").select("*").eq("user_id", user.id),
      supabase
        .from("trainer_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const settings = settingsResult.data ?? null;
    const memoryRows = memoryResult.data ?? [];
    const recentMessages = (messagesResult.data ?? []).reverse();

    const memory: Record<string, string> = {};
    for (const it of memoryRows) memory[it.key] = it.value;

    // --- SYSTEM PROMPT
    let systemPrompt = `
You are their personal 1% coach—warm, encouraging, short, practical. Keep answers concrete and supportive.

User Context (stringified):
${JSON.stringify(
  {
    settings,
    memory,
    recentMessages,
  },
  null,
  2
)}

Behavior:
- If NOT creating a challenge, reply in 1–2 sentences like a human coach. Do NOT output JSON.
- Encourage tiny steps, reflect their preferences, and be kind.
`;

    if (action === "create_challenge") {
      systemPrompt += `
When action=create_challenge:
- Respond ONLY with a SINGLE JSON object, nothing else (no prose, no markdown).
- Schema:
  {
    "title": "specific actionable task",
    "description": "2 short sentences with clear instructions",
    "category": "energy|mindset|focus|relationships|home|finance|creativity|recovery",
    "estimated_minutes": <number>,   // 1..1439
    "difficulty": <1-5>,
    "benefit": "why this 1% matters - 1 sentence"
  }
- Meet any user-given duration if they provided one. Never invent a fixed 10/15/30 cap.
`;
    } else {
      systemPrompt += `
IMPORTANT: For this action, NEVER return JSON. Speak like a supportive human in plain text.`;
    }

    // --- Save user message for history
    if (message) {
      await supabase.from("trainer_messages").insert({
        user_id: user.id,
        message_type: "user",
        content: message,
      });
    }

    // --- OpenAI call
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped");
    let trainerResponse = "";

    if (!openaiApiKey) {
      trainerResponse =
        "I'm having trouble accessing coaching right now (missing API key). Please add OPENAI_API_KEY.";
    } else {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message || "Hello!" },
            ],
            max_tokens: 450,
            temperature: 0.6,
          }),
        });

        if (!resp.ok) {
          const t = await resp.text();
          console.error("OpenAI error:", resp.status, t);
          trainerResponse =
            resp.status === 401
              ? "There’s an issue with the AI credentials. Please verify the API key."
              : "I'm experiencing technical issues. Try again in a moment.";
        } else {
          const data = await resp.json();
          trainerResponse = data.choices?.[0]?.message?.content ?? "";
        }
      } catch (e) {
        console.error("OpenAI fetch failed:", e);
        trainerResponse = "I couldn't connect to AI services just now. Please try again.";
      }
    }

    // --- If create_challenge: parse JSON, insert custom challenge, and replace reply with human text
    if (action === "create_challenge") {
      const parsed = tryParseJSONBlock(trainerResponse);
      if (parsed && parsed.title && parsed.description) {
        const title = String(parsed.title).slice(0, 140);
        const description = String(parsed.description).slice(0, 2000);
        const category = String(parsed.category || "mindset").toLowerCase();
        const minutes = sanitizeMinutes(parsed.estimated_minutes ?? parsed.time_minutes ?? parsed.timeMinutes, 15);
        const benefit = parsed.benefit ? String(parsed.benefit).slice(0, 300) : null;

        // Insert as a CUSTOM challenge row for this user
        const { error: insertErr } = await supabase.from("user_challenges").insert({
          user_id: user.id,
          is_custom: true,
          custom_title: title,
          custom_description: description,
          custom_category: category,
          custom_time_minutes: minutes,
          created_by: "trainer",
          scheduled_date: new Date().toISOString().split("T")[0],
          status: "pending",
          feedback: null,
          trainer_response: null,
          notes: null,
        });

        if (insertErr) {
          console.error("Insert custom challenge failed:", insertErr);
          // Fall back: don't expose JSON blob—send neutral human text
          trainerResponse =
            "I drafted a challenge for you, but saving it had an issue. Please try again.";
        } else {
          // Replace the raw JSON with a clean human message
          trainerResponse = `Added “${title}” (${minutes} min) in ${category}. Want to start it now or edit the time?`;
        }
      } else {
        // Model didn't return valid JSON—send human fallback, not the blob
        trainerResponse =
          "I tried to create a challenge but the details were unclear. Tell me the category and minutes you want.";
      }
    }

    // --- Save trainer message (always human-readable at this point)
    await supabase.from("trainer_messages").insert({
      user_id: user.id,
      message_type: "trainer",
      content: trainerResponse,
    });

    // --- Optional: lightweight memory drop
    if (message && message.length > 0) {
      const memoryKey = `conversation_${Date.now()}`;
      await supabase.from("trainer_memory").upsert({
        user_id: user.id,
        memory_type: "pattern",
        key: memoryKey,
        value: `User said: ${message}. Context: ${action || "general"}`,
      });
    }

    return new Response(JSON.stringify({ success: true, response: trainerResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-trainer fatal:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(err instanceof Error ? err.message : err),
        response: "I'm having trouble right now. Please try again shortly.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
