// supabase/functions/ai-trainer/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "greeting"
  | "feedback"
  | "create_challenge"
  | "schedule_challenge"
  | "general"
  | "send_password_reset";

/* ====== ⬇︎ Master System Prompt (multi-domain, “human”, JSON only on create) */
const COACH_SYSTEM_PROMPT = `
You are the user's personal coach (not “an AI”). Be broadly useful across life domains:
- Focus/Work & Learning (study, memory, chess tactics, language learning, skill drills)
- Energy/Movement (training, walk, mobility, cardio)
- Mindset (stress, reflection, journaling, breathing)
- Relationships (reach-out, gratitude, repair)
- Home/Environment (declutter, routines)
- Finance (budget, bill tasks)
- Creativity (writing, music, drawing, making)
- Recovery/Sleep (wind-down, light, caffeine, screens)

Voice: warm, human, encouraging, concise. No model/tech talk.

Behavior:
- Give short human replies (1–3 sentences) with a concrete next step.
- Honor any user-stated duration (exact minutes).
- If minutes not provided, choose realistic durations and VARY them: short (10–25), medium (30–45), long (60–90). Do **not** default to 15.
- Avoid repeating very recent ideas unless asked.
- Safety: no medical/clinical diagnosis or treatment instructions; suggest seeing a professional when appropriate.

Category rules:
- Learning/tactics/puzzles/chess/study → "focus"
- Movement/workout/walk/run → "energy"
- Meditation/journaling/gratitude → "mindset"
(Use these mappings if the user didn’t give a category.)

Output rules:
- ONLY when explicitly creating a challenge, return STRICT JSON (no prose, no code fences):
  {
    "title": string,
    "description": string,                
    "category": "energy"|"mindset"|"focus"|"relationships"|"home"|"finance"|"creativity"|"recovery",
    "estimated_minutes": number,          
    "difficulty": 1|2|3|4|5,              
    "benefit": string                     
  }
- For all other replies, return human text (no JSON, no lists unless helpful).
`.trim();

/* ====== Helpers */
const ALLOWED_CATEGORIES = [
  "energy","mindset","focus","relationships","home","finance","creativity","recovery",
] as const;

function clampCategory(cat?: string | null) {
  if (!cat) return null;
  const c = cat.toLowerCase().trim();
  return (ALLOWED_CATEGORIES as readonly string[]).includes(c) ? (c as typeof ALLOWED_CATEGORIES[number]) : null;
}

function detectCategoryFromText(text: string): typeof ALLOWED_CATEGORIES[number] | null {
  const t = text.toLowerCase();
  // Learning / chess → focus
  if (/\b(chess|tactic|puzzle|lichess|chess\.com|opening|endgame|calculate|study|learn|learning|practice|flashcard|anki)\b/.test(t)) {
    return "focus";
  }
  if (/\b(run|walk|gym|lift|workout|strength|mobility|yoga|steps)\b/.test(t)) return "energy";
  if (/\b(meditate|meditation|gratitude|journal|mindset|reframe)\b/.test(t)) return "mindset";
  if (/\b(friend|family|partner|call|text|reach out|apologize|repair)\b/.test(t)) return "relationships";
  if (/\b(clean|declutter|organize|laundry|dishes|desk|room|home)\b/.test(t)) return "home";
  if (/\b(budget|spend|save|money|bill|tax|finance)\b/.test(t)) return "finance";
  if (/\b(draw|write|music|song|art|create|creative)\b/.test(t)) return "creativity";
  if (/\b(sleep|wind[- ]?down|screen|blue light|caffeine|nap|recover|recovery)\b/.test(t)) return "recovery";
  return null;
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

function pickDefaultMinutes(seed: string) {
  // lightweight variability to avoid “always 15”
  const now = new Date();
  const mix = (seed.length + now.getDate() + now.getHours()) % 7;
  const options = [12, 20, 25, 35, 40, 45, 60];
  return options[mix];
}

type ParsedIntent = { shouldCreate: boolean; category: string | null; minutes: number | null; };

function parseIntent(raw: string): ParsedIntent {
  const text = (raw || "").toLowerCase();

  const shouldCreate =
    ["new challenge","create challenge","make a challenge","give me a challenge","challenge me","start a challenge","make me","task for","i want a challenge"].some(t => text.includes(t))
    || /(^|\s)(challenge|task)(\s|$)/.test(text);

  // durations: “1h”, “45 min”, “for 30”, lone numbers with challenge context
  let minutes: number | null = null;
  const hr = text.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  const mn = text.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
  const bare = text.match(/\bfor\s+(\d+)\b/) || text.match(/\b(\d+)\s*minute\b/);
  if (hr) minutes = Number(hr[1]) * 60;
  if (mn) minutes = Number(mn[1]);
  if (!minutes && bare) minutes = Number(bare[1]);
  if (!minutes) {
    const solo = text.match(/\b(\d{1,3})\b/);
    if (solo && shouldCreate) {
      const n = Number(solo[1]);
      if (n >= 1 && n <= 1440) minutes = n;
    }
  }
  minutes = minutesOrNull(minutes);

  return { shouldCreate, category: detectCategoryFromText(text), minutes };
}

function buildCreatePrompt(userMessage: string, hints: { category: string | null; minutes: number | null; goal?: string | null }) {
  const catLine = hints.category ? `Category to use: ${hints.category}\n` : "";
  const timeLine =
    typeof hints.minutes === "number"
      ? `Exact duration to honor: ${hints.minutes} minutes (do not change)\n`
      : "Pick a realistic duration and VARY it: short (10–25), medium (30–45), long (60–90). Do not default to 15.\n";
  const goalLine = hints.goal ? `User goal/focus: ${hints.goal}\n` : "";

  return `
Create one specific challenge and return STRICT JSON per schema (no prose, no lists, no code fences).
${catLine}${timeLine}${goalLine}
User message/context (if any): ${userMessage || "(none)"}
`.trim();
}

function fallbackChallenge(userId: string, category: string | null, minutes: number | null) {
  const cat = clampCategory(category) || "mindset";
  const mins = minutesOrNull(minutes) || pickDefaultMinutes(userId);
  return {
    title: "1% Focus Sprint",
    description: "Silence notifications, clear your desk, and focus on one task without switching until the timer ends.",
    category: cat,
    estimated_minutes: mins,
    difficulty: mins <= 25 ? 2 : mins <= 60 ? 3 : 4,
    benefit: "Tiny focused reps compound and lower friction for tomorrow.",
  };
}

function extractJson(str: string): string {
  if (!str) return "";
  const cleaned = str.replace(/```json|```/gi, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  return s >= 0 && e > s ? cleaned.slice(s, e + 1) : "";
}

function isLikelyJson(str: string) {
  return /^\s*[{[].*[}\]]\s*$/s.test(str.replace(/```json|```/gi, "").trim());
}

/* ====== Main handler */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const body = await req.json().catch(() => ({} as any));
    let action: Action = (body.action ?? "general") as Action;

    /* Public: password reset generator (kept) */
    if (action === "send_password_reset") {
      const email = (body.email ?? "").toString().trim();
      const redirectTo = (body.redirectTo ?? `${Deno.env.get("PUBLIC_SITE_URL") || ""}/auth?mode=reset`) as string;
      if (!email) return json({ success: false, error: "Email required" }, 400);

      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (error) return json({ success: false, error: error.message }, 400);

      const resetUrl = data?.properties?.action_link;
      if (!resetUrl) return json({ success: false, error: "No reset URL from Supabase" }, 400);
      return json({ success: true, message: "Reset link generated", resetUrl });
    }

    /* Auth for everything else */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: authUser } = await supabase.auth.getUser(token);
    const user = authUser?.user;
    if (!user) throw new Error("Unauthorized");

    const message: string = (body.message ?? "").toString();
    const goal = typeof body.goal === "string" ? body.goal : (body?.payload?.goal ?? null);

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

    // First-time zero state
    if (!hasAnyChallenge && (!message || action === "greeting") && action !== "create_challenge") {
      const welcome = "New here. Want me to craft a tiny challenge? Tell me the area (focus/energy/etc) and your exact minutes — or tap Browse to pick one.";
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content: welcome });
      return json({ response: welcome, success: true });
    }

    // Build hints (explicit + parsed)
    let hints = {
      category: clampCategory(body.category ?? body?.payload?.category ?? null),
      minutes: minutesOrNull(body.time_minutes ?? body?.payload?.time_minutes ?? null),
      goal: goal || null,
    };
    if (action !== "create_challenge") {
      const parsed = parseIntent(message);
      if (parsed.shouldCreate) {
        action = "create_challenge";
        if (!hints.category) hints.category = clampCategory(parsed.category) || detectCategoryFromText(message);
        if (!hints.minutes) hints.minutes = parsed.minutes;
      }
    }

    if (message) {
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "user", content: message });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped");
    if (!apiKey) {
      const txt = "Coach can’t think right now (missing API key). Add OPENAI_API_KEY in project secrets.";
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content: txt });
      return json({ response: txt, success: false }, 500);
    }

    // LLM call
    const context = { settings, memories, recentMessages, user_id: user.id, hints };
    const msgs: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      { role: "system", content: `User Context:\n${JSON.stringify(context, null, 2)}` },
      {
        role: "user",
        content: action === "create_challenge" ? buildCreatePrompt(message, hints) : (message || "Hello"),
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const payload: Record<string, unknown> = {
      model: "gpt-4o",                            // strong general model
      messages: msgs,
      temperature: action === "create_challenge" ? 0.5 : 0.7,
      max_tokens: action === "create_challenge" ? 500 : 350,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.0,
    };
    if (action === "create_challenge") payload["response_format"] = { type: "json_object" };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(`LLM error ${resp.status}: ${t}`);
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";

    /* ====== CREATE MODE: strict JSON → DB insert → human confirmation */
    if (action === "create_challenge") {
      let challenge: any | null = null;
      try {
        challenge = JSON.parse(extractJson(raw));
      } catch { challenge = null; }
      if (!challenge) challenge = fallbackChallenge(user.id, hints.category, hints.minutes);

      // normalize
      const cat =
        clampCategory(challenge?.category) ||
        clampCategory(hints.category) ||
        detectCategoryFromText(message || "") ||
        "mindset";

      let mins = minutesOrNull(challenge?.estimated_minutes) || hints.minutes || pickDefaultMinutes(user.id);
      if (!hints.minutes && mins === 15) mins = pickDefaultMinutes(user.id); // anti-15 default

      const difficulty = [1,2,3,4,5].includes(challenge?.difficulty) ? challenge.difficulty : (mins <= 25 ? 2 : mins <= 60 ? 3 : 4);

      await supabase.from("user_challenges").insert({
        user_id: user.id,
        is_custom: true,
        created_by: "trainer",
        custom_title: toStringSafe(challenge?.title, "Custom Challenge"),
        custom_description: toStringSafe(challenge?.description, "A small, specific step for today."),
        custom_category: cat,
        custom_time_minutes: mins,
        scheduled_date: new Date().toISOString().slice(0,10),
        status: "pending",
        trainer_response: toStringSafe(challenge?.benefit, null),
      });

      const human = `Added “${toStringSafe(challenge?.title, "Challenge")}” — ${mins}m in ${cat}.`;
      await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content: human });
      return json({ success: true, response: human });
    }

    /* ====== NORMAL CHAT: ensure human text (never JSON) */
    let text = raw?.trim() || "Noted.";
    if (isLikelyJson(text)) {
      // Convert accidental JSON into a short human message
      try {
        const j = JSON.parse(extractJson(text));
        const title = toStringSafe(j?.title, "challenge");
        const mins = j?.estimated_minutes ?? "";
        const cat = clampCategory(j?.category) || "focus";
        text = `Try “${title}” — ${mins ? `${mins}m ` : ""}in ${cat}. Want me to add it? Say “create challenge”.`;
      } catch {
        text = "Got an idea. Want me to turn it into a challenge? Tell me the area and minutes.";
      }
    }

    await supabase.from("trainer_messages").insert({ user_id: user.id, message_type: "trainer", content: text });
    return json({ success: true, response: text });

  } catch (err: any) {
    console.error("ai-trainer error:", err);
    return json({ success: false, error: err?.message || "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
