// supabase/functions/ai-trainer/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

/**
 * Changes in this version:
 * - Stronger, more human coaching persona + clearer output contracts
 * - Fix: systemPrompt now `let` (previous code tried to mutate a `const`)
 * - Model upgrade with env override + safe fallback
 * - Strict JSON mode for create_challenge (with resilient fallback parser)
 * - Better context: includes name + streak + recent messages summary
 * - Lightweight memory capture for preferences/goals without new tables
 * - Friendlier error handling
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "create_challenge" | "schedule_challenge" | "feedback" | "greeting" | undefined;

function firstName(full?: string | null) {
  if (!full) return null;
  const n = full.trim().split(/\s+/)[0];
  return n || null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Extract the first JSON object from a string (handles code fences) */
function extractJSONObject(text: string): any | null {
  try {
    // Quick path
    return JSON.parse(text);
  } catch (_) {
    // Strip code fences if present
    const cleaned = text
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try direct parse again
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // Find first balanced {...}
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const candidate = cleaned.slice(start, end + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}

function buildSystemPrompt(ctx: {
  name?: string | null;
  settings?: any;
  memory: Record<string, string>;
  recentSummaries: string[];
  streak?: { current_streak?: number | null; longest_streak?: number | null } | null;
  action?: Action;
}) {
  const name = ctx.name || "friend";
  const currentStreak = ctx.streak?.current_streak ?? 0;
  const longestStreak = ctx.streak?.longest_streak ?? 0;

  const memoryPreview =
    Object.keys(ctx.memory || {}).length > 0
      ? JSON.stringify(ctx.memory, null, 2)
      : "{}";

  const recent = ctx.recentSummaries.length > 0
    ? ctx.recentSummaries.map((r) => `• ${r}`).join("\n")
    : "• (no recent messages)";

  let sys = `
You are a personal "1% each day" coach. You sound like a calm, encouraging human—warm, concise, and practical.

# Voice & Vibe
- Friendly, supportive, never cheesy. Talk like a thoughtful friend.
- Short paragraphs. Where useful, use a tiny list (max 3 bullets).
- One clear next step. Avoid rambling.
- Use the user's name "${name}" naturally, not every sentence.
- Celebrate *tiny wins*. Normalize slips.

# What to reference
- Current streak: ${currentStreak} days (best: ${longestStreak}).
- Known preferences/memory (key→value):
${memoryPreview}

# Recent context (most recent last)
${recent}

# Challenge Categories (exact values to use)
- energy (movement/hydration/mobility)
- mindset (gratitude/reframe/breath)
- focus (single-tasking/priorities/workspace)
- relationships (connection/kindness/convo)
- home (declutter/organize/digital tidy)
- finance (micro-savings/awareness/subs)
- creativity (write/sketch/music/photo)
- recovery (wind-down/rest/stress relief)

# Output style by action
- greeting/feedback: 1–3 short lines. End with one kind question to move them forward.
- schedule_challenge: Give a realistic, optimistic plan. Keep it brief (5–8 lines, max 1 short bullet list).
- create_challenge: **Output JSON only** (see schema).
`;

  if (ctx.action === "create_challenge") {
    sys += `
# JSON schema (output **only** this JSON)
{
  "title": "specific actionable task (imperative)",
  "description": "2 clear, human sentences—what to do + how",
  "category": "one of: energy|mindset|focus|relationships|home|finance|creativity|recovery",
  "difficulty": 1-5,
  "estimated_minutes": 5-30,
  "benefit": "why this 1% matters, 1 sentence"
}

Rules:
- Reflect their preferences/time.
- Vary from recent tasks; avoid repetition.
- Make it doable but not trivial.
- No extra keys, no trailing commentary—JSON object only.
`;
  }

  return sys.trim();
}

async function maybeCaptureLightweightMemory(supabaseClient: any, userId: string, message?: string | null) {
  if (!message) return;

  // Very lightweight heuristic capture (no extra LLM call)
  const ideas: Array<{ key: string; value: string }> = [];
  const lower = message.toLowerCase();

  // Goal / intention
  const goalMatch = message.match(/(?:goal|aim|want to)\s*[:\-]?\s*(.+)/i);
  if (goalMatch) ideas.push({ key: "goal", value: goalMatch[1].slice(0, 200) });

  // Time budget
  const timeMatch = message.match(/(\d{1,3})\s*(?:min|minutes|m)\b/i);
  if (timeMatch) ideas.push({ key: "time_budget_hint", value: `${timeMatch[1]}m` });

  // Likes / dislikes
  if (lower.includes("i like ")) {
    const like = message.split(/i like /i)[1]?.split(/[.!?]/)[0]?.trim();
    if (like) ideas.push({ key: `like_${Date.now()}`, value: like.slice(0, 120) });
  }
  if (lower.includes("i dislike ") || lower.includes("i hate ") || lower.includes("please no ")) {
    const dis = message.split(/(?:i dislike|i hate|please no)\s+/i)[1]?.split(/[.!?]/)[0]?.trim();
    if (dis) ideas.push({ key: `avoid_${Date.now()}`, value: dis.slice(0, 120) });
  }

  // Persist
  for (const item of ideas) {
    await supabaseClient.from("trainer_memory").upsert({
      user_id: userId,
      memory_type: "preference",
      key: item.key,
      value: item.value,
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, action }: { message?: string; action?: Action } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Auth
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

    // Context
    const [settingsResult, memoryResult, messagesResult, streakResult, profileResult] = await Promise.all([
      supabaseClient.from("trainer_settings").select("*").eq("user_id", user.id).single(),
      supabaseClient.from("trainer_memory").select("*").eq("user_id", user.id),
      supabaseClient.from("trainer_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabaseClient.from("streaks").select("current_streak,longest_streak").eq("user_id", user.id).single(),
      supabaseClient.from("profiles").select("full_name").eq("user_id", user.id).single(),
    ]);

    const settings = settingsResult.data;
    const memoryRows = memoryResult.data || [];
    const streak = streakResult.data || null;
    const fullName = profileResult.data?.full_name ?? user.user_metadata?.full_name ?? null;
    const name = firstName(fullName);

    // Compress recent messages into short bullets to keep prompt tight
    const recentMessages = (messagesResult.data || []).reverse();
    const recentSummaries = recentMessages.map((m: any) => {
      const who = m.message_type === "trainer" ? "Coach" : "You";
      const snippet = (m.content || "").replace(/\s+/g, " ").trim().slice(0, 160);
      return `${who}: ${snippet}`;
    });

    const memory: Record<string, string> = memoryRows.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    let systemPrompt = buildSystemPrompt({
      name,
      settings,
      memory,
      recentSummaries,
      streak,
      action,
    });

    // Save user message first (so it appears in history)
    if (message) {
      await supabaseClient.from("trainer_messages").insert({
        user_id: user.id,
        message_type: "user",
        content: message,
      });
    }

    // Model selection (stronger by default; safe fallback if not set/available)
    const model =
      Deno.env.get("OPENAI_TRAINER_MODEL") /* optional override */ ||
      "gpt-4o"; // stronger & more natural. Falls back below if error.

    // Action-specific nudge (kept small; main rules live inside system prompt)
    let userInstruction = message || "Hello!";
    if (action === "create_challenge") {
      userInstruction =
        `${message || ""}\n\nPlease create a *single* JSON challenge object as specified in the schema.`;
    } else if (action === "schedule_challenge") {
      userInstruction =
        `${message || ""}\n\nHelp me plan a few small steps this week across 2–3 categories, matching my time.`;
    } else if (action === "feedback") {
      userInstruction =
        `${message || ""}\n\nAcknowledge my feedback, encourage me, and suggest the tiniest next step.`;
    }

    // Build chat
    const chatBodyBase: any = {
      model,
      temperature: action === "create_challenge" ? 0.7 : 0.8,
      max_tokens: 700,
      messages: [
        { role: "system", content: systemPrompt },
        // A tiny style few-shot to humanize tone without bloating tokens
        {
          role: "assistant",
          content:
            `Hey ${name || "there"} — proud of the tiny steps you’re taking. What feels like a 1% nudge today?`,
        },
        { role: "user", content: userInstruction },
      ],
    };

    // For JSON-only ask, enable JSON mode and also keep our manual fallback parser
    if (action === "create_challenge") {
      chatBodyBase.response_format = { type: "json_object" };
    }

    async function callOpenAI(body: any) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped");
      if (!openaiApiKey) throw new Error("OpenAI API key not configured");

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${text}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    let trainerResponse = "";
    try {
      trainerResponse = await callOpenAI(chatBodyBase);
    } catch (err) {
      // Retry once with a lighter fallback model if available
      try {
        const fallbackBody = { ...chatBodyBase, model: "gpt-4o-mini" };
        trainerResponse = await callOpenAI(fallbackBody);
      } catch (err2) {
        console.error("OpenAI API error:", err, "\nFallback error:", err2);
        trainerResponse =
          "I'm having trouble with my AI brain right now—mind trying again in a bit?";
      }
    }

    // Persist trainer response (raw)
    await supabaseClient.from("trainer_messages").insert({
      user_id: user.id,
      message_type: "trainer",
      content: trainerResponse,
    });

    // Special handling: create_challenge ⇒ try to parse/validate & insert
    if (action === "create_challenge") {
      const obj = extractJSONObject(trainerResponse);
      if (obj && obj.title && obj.description) {
        const categoryAllow = new Set([
          "energy",
          "mindset",
          "focus",
          "relationships",
          "home",
          "finance",
          "creativity",
          "recovery",
        ]);
        const cat = typeof obj.category === "string" ? obj.category.toLowerCase() : "mindset";
        const safeCategory = categoryAllow.has(cat) ? cat : "mindset";
        const safeMinutes =
          typeof obj.estimated_minutes === "number"
            ? clamp(Math.round(obj.estimated_minutes), 5, 60)
            : 15;
        const safeDifficulty =
          typeof obj.difficulty === "number" ? clamp(Math.round(obj.difficulty), 1, 5) : 2;

        await supabaseClient.from("user_challenges").insert({
          user_id: user.id,
          is_custom: true,
          custom_title: String(obj.title).slice(0, 120),
          custom_description: String(obj.description).slice(0, 500),
          custom_category: safeCategory,
          custom_time_minutes: safeMinutes,
          created_by: "trainer",
          scheduled_date: new Date().toISOString().split("T")[0],
          status: "pending",
          // optional extras if you want to surface later:
          feedback: null,
          trainer_response: obj.benefit ? String(obj.benefit).slice(0, 240) : null,
        });
      }
    }

    // On any user message, capture small preference hints (no extra LLM call)
    await maybeCaptureLightweightMemory(supabaseClient, user.id, message);

    return new Response(JSON.stringify({ response: trainerResponse, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-trainer function:", error);
    const friendly =
      error?.message === "OpenAI API key not configured"
        ? "I need an OpenAI API key to work properly. Please add one in your project settings under Secrets."
        : "I'm having trouble connecting right now. Please try again in a moment!";
    return new Response(JSON.stringify({ error: error.message, response: friendly }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
