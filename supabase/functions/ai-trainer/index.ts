// ai-trainer/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "greeting" | "feedback" | "create_challenge" | "schedule_challenge" | "general";

const ALLOWED_CATEGORIES = [
  "energy",
  "mindset",
  "focus",
  "relationships",
  "home",
  "finance",
  "creativity",
  "recovery",
] as const;

const COACH_SYSTEM_PROMPT = `
You are the user's personal coach (not “an AI”). Help them improve 1% daily with tiny, realistic actions.
Voice: warm, human, encouraging, concise. No model/tech talk.

Domains you’re fluent in:
Energy/Movement, Mindset, Focus/Work, Relationships, Home/Environment, Finance, Creativity, Recovery/Sleep.
Behavior change, habit formation, graded exposure, timeboxing, reflection prompts, gentle accountability.

Principles:
- Specific, doable, measurable.
- Honor any user-stated duration (exact minutes).
- Celebrate small wins; nudge, don’t nag.
- Avoid repeating very recent challenges unless requested.
- No medical/clinical diagnosis.

Output rules:
- When creating a challenge, return STRICT JSON ONLY (no prose):
  {
    "title": string,
    "description": string,                // 1–2 sentences
    "category": "energy"|"mindset"|"focus"|"relationships"|"home"|"finance"|"creativity"|"recovery",
    "estimated_minutes": number,          // integer minutes; honor provided time if present
    "difficulty": 1|2|3|4|5,              // 1 easiest → 5 hardest
    "benefit": string                     // one sentence on why it matters
  }

- For all other replies, return short human text (1–3 sentences) with a concrete next step when useful.
`.trim();

/* ---------------- intent & parsing helpers ---------------- */

function clampCategory(cat?: string | null) {
  if (!cat) return null;
  const c = cat.toLowerCase().trim();
  return (ALLOWED_CATEGORIES as readonly string[]).includes(c) ? (c as typeof ALLOWED_CATEGORIES[number]) : null;
}

function minutesOrNull(n?: number | null) {
  if (typeof n !== "number") return null;
  if (!Number.isFinite(n)) return null;
  const clamped = Math.max(1, Math.min(24 * 60, Math.round(n)));
  return clamped;
}

function toStringSafe(v: unknown, fallback: string | null) {
  if (typeof v === "string" && v.trim()) return v.trim();
  return fallback ?? "";
}

type ParsedIntent = {
  shouldCreate: boolean;
  category: string | null;
  minutes: number | null;
};

function parseIntent(raw: string): ParsedIntent {
  const text = (raw || "").toLowerCase();

  // Detect creation intent
  const createTriggers = [
    "new challenge", "create challenge", "make a challenge", "give me a challenge",
    "task for", "give me a", "plan a task", "challenge me", "start a challenge",
  ];
  const shouldCreate = createTriggers.some((t) => text.includes(t)) ||
    /(^|\s)(challenge|task)(\s|$)/.test(text);

  // Extract duration
  // examples: "20 min", "45 minutes", "1h", "1 hour", "90m", "for 25"
  let minutes: number | null = null;
  const hrMatch = text.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  const minMatch = text.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
  const bareMinMatch = text.match(/\bfor\s+(\d+)\b/) || text.match(/\b(\d+)\s*minute\b/);

  if (hrMatch) {
    minutes = Number(hrMatch[1]) * 60;
  }
  if (minMatch) {
    minutes = Number(minMatch[1]);
  }
  if (!minutes && bareMinMatch) {
    minutes = Number(bareMinMatch[1]);
  }
  // If they wrote “90” alone with “task”, treat as minutes (avoid if it looks like a day number)
  if (!minutes) {
    const solo = text.match(/\b(\d{1,3})\b/);
    if (solo && shouldCreate) {
      const n = Number(solo[1]);
      if (n >= 1 && n <= 1440) minutes = n;
    }
  }
  minutes = minutesOrNull(minutes);

  // Extract category via synonyms
  const catMap: Record<string, typeof ALLOWED_CATEGORIES[number]> = {
    // energy
    exercise: "energy", workout: "energy", run: "energy", walk: "energy", movement: "energy", fitness: "energy",
    // mindset
    mindset: "mindset", meditate: "mindset", gratitude: "mindset", journal: "mindset", reframing: "mindset",
    // focus
    focus: "focus", work: "focus", study: "focus", productivity: "focus", deepwork: "focus",
    // relationships
    relationships: "relationships", social: "relationships", friend: "relationships", family: "relationships", connect: "relationships",
    // home
    home: "home", environment: "home", declutter: "home", clean: "home", organize: "home",
    // finance
    finance: "finance", money: "finance", budget: "finance", spend: "finance", save: "finance",
    // creativity
    creativity: "creativity", create: "creativity", art: "creativity", draw: "creativity", write: "creativity", music: "creativity",
    // recovery
    recovery: "recovery", sleep: "recovery", rest: "recovery", wind: "recovery", winddown: "recovery",
  };

  let detected: string | null = null;
  for (const key in catMap) {
    if (text.includes(key)) {
      detected = catMap[key];
      break;
    }
  }

  return {
    shouldCreate,
    category: detected,
    minutes,
  };
}

function buildCreatePrompt(userMessage: string, hints: { category: string | null; minutes: number | null; goal?: string | null }) {
  const catLine = hints.category ? `Category to use: ${hints.category}\n` : "";
  const timeLine =
    typeof hints.minutes === "number"
      ? `Exact duration to honor: ${hints.minutes} minutes (do not change)\n`
      : "Pick a realistic duration (1–1440 minutes).\n";
  const goalLine = hints.goal ? `User goal/focus: ${hints.goal}\n` : "";

  return `
Create one specific challenge and return STRICT JSON per schema (no extra text).
${catLine}${timeLine}${goalLine}
User message/context (if any): ${userMessage || "(none)"}
`.trim();
}

function fallbackChallenge(category: string | null, minutes: number | null) {
  const cat = clampCategory(category) || "mindset";
  const mins = minutesOrNull(minutes) || 10;
  return {
    title: "1% Focus Sprint",
    description: "Silence notifications, clear your desk, and focus on one task without switching until the timer ends.",
    category: cat,
    estimated_minutes: mins,
    difficulty: mins <= 10 ? 1 : mins <= 30 ? 2 : 3,
    benefit: "Tiny focused reps reduce friction and build momentum for tomorrow.",
  };
}

/* ---------------- main handler ---------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: authUser } = await supabase.auth.getUser(token);
    const user = authUser?.user;
    if (!user) throw new Error("Unauthorized");

    // Input
    const body = await req.json().catch(() => ({}));
    let action: Action = (body.action ?? "general") as Action;
    const message: string = (body.message ?? "").toString();
    const goal = typeof body.goal === "string" ? body.goal : (body?.payload?.goal ?? null);

    // Load context (for smarter replies)
    const [settingsRes, memoryRes, recentMsgsRes, challengesCountRes] = await Promise.all([
      supabase.from("trainer_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("trainer_memory").select("*").eq("user_id", user.id),
      supabase.from("trainer_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      supabase.from("user_challenges").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const settings = settingsRes.data ?? null;
    const memories = (memoryRes.data ?? []).reduce((acc: Record<string, string>, m: any) => {
      acc[m.key] = m.value;
      return acc;
    }, {});
    const recentMessages = (recentMsgsRes.data ?? []).reverse();
    const hasAnyChallenge = (challengesCountRes.count ?? 0) > 0;

    // If user is brand-new and this is a greeting / empty message → prompt plainly (no buttons needed)
    if (!hasAnyChallenge && (!message || action === "greeting") && action !== "create_challenge") {
      const welcome = "Welcome—let’s start with a tiny win. Tell me the area (e.g., focus, energy, mindset) and your exact minutes (e.g., 17), and I’ll create a challenge.";
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content: welcome });
      return json({ response: welcome, success: true });
    }

    // No buttons: auto-detect “make me a challenge … 20 min … focus …”
    let hints = {
      category: clampCategory(body.category ?? body?.payload?.category ?? null),
      minutes: minutesOrNull(body.time_minutes ?? body?.payload?.time_minutes ?? null),
      goal: goal || null,
    };

    if (action !== "create_challenge") {
      const parsed = parseIntent(message);
      if (parsed.shouldCreate) {
        action = "create_challenge";
        if (!hints.category) hints.category = clampCategory(parsed.category);
        if (!hints.minutes) hints.minutes = parsed.minutes;
      }
    }

    // Save user message
    if (message) {
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "user", content: message });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped");
    if (!openaiApiKey) {
      const txt = "Coach can’t think right now (missing API key). Add OPENAI_API_KEY in project secrets.";
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content: txt });
      return json({ response: txt, success: false }, 500);
    }

    // Build LLM messages
    const context = { settings, memories, recentMessages, user_id: user.id, hints };
    const msgs: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      { role: "system", content: `User Context:\n${JSON.stringify(context, null, 2)}` },
      {
        role: "user",
        content:
          action === "create_challenge"
            ? buildCreatePrompt(message, hints)
            : (message || "Hello"),
      },
    ];

    // Fast timeout to keep UI responsive
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const payload: Record<string, unknown> = {
      model: "gpt-4o-mini",
      messages: msgs,
      temperature: action === "create_challenge" ? 0.5 : 0.7,
      max_tokens: action === "create_challenge" ? 450 : 250,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.0,
    };
    if (action === "create_challenge") payload["response_format"] = { type: "json_object" };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(`LLM error ${resp.status}: ${t}`);
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    // Save trainer reply
    await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content });

    if (action === "create_challenge") {
      // Parse JSON or fallback
      let challenge: any | null = null;
      try {
        challenge = JSON.parse(content);
      } catch {
        challenge = fallbackChallenge(hints.category, hints.minutes);
      }

      // Normalize category & minutes
      const cat = clampCategory(challenge?.category) || hints.category || "mindset";
      const mins = minutesOrNull(challenge?.estimated_minutes) || hints.minutes || 10;
      const difficulty = [1, 2, 3, 4, 5].includes(challenge?.difficulty) ? challenge.difficulty : 2;

      // Persist as custom challenge (no random database picks)
      await supabase.from("user_challenges").insert({
        user_id: user.id,
        is_custom: true,
        custom_title: toStringSafe(challenge?.title, "Custom Challenge"),
        custom_description: toStringSafe(challenge?.description, "A small, specific step for today."),
        custom_category: cat,
        custom_time_minutes: mins,
        created_by: "trainer",
        scheduled_date: new Date().toISOString().slice(0, 10),
        status: "pending",
        feedback: null,
        trainer_response: toStringSafe(challenge?.benefit, null),
      });

      return json({ response: content, success: true });
    }

    // Non-create → human text
    return json({ response: content, success: true });
  } catch (err: any) {
    console.error("ai-trainer error:", err);
    return json({ success: false, error: err?.message || "Unknown error" }, 500);
  }
});

/* ---------------- tiny utils ---------------- */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
