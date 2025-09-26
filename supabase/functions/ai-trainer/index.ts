import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Challenge = {
  title: string;
  description: string;
  category: string;
  estimated_minutes: number;
  difficulty: number;
  benefit?: string;
};

const CATEGORIES = [
  "energy","mindset","focus","relationships","home","finance","creativity","recovery",
] as const;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function normalize(raw: any): Challenge {
  const title = String(raw?.title || "").trim();
  const description = String(raw?.description || "").trim();
  const cat = String(raw?.category || "mindset").toLowerCase().trim();
  const category = (CATEGORIES as readonly string[]).includes(cat) ? cat : "mindset";
  let minutes = Number(raw?.estimated_minutes ?? raw?.time_minutes ?? 15);
  minutes = clamp(Math.round(Number.isFinite(minutes) ? minutes : 15), 1, 1440);
  let difficulty = clamp(Math.round(Number(raw?.difficulty ?? 2) || 2), 1, 5);
  const benefit = raw?.benefit ? String(raw.benefit).trim() : undefined;

  if (!title || !description) throw new Error("invalid JSON (title/description)");
  return { title, description, category, estimated_minutes: minutes, difficulty, benefit };
}

async function callOpenAIJSON(system: string, user: string, signal: AbortSignal) {
  const key = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("Looped");
  if (!key) throw new Error("missing OPENAI_API_KEY");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 250,
      response_format: { type: "json_object" }, // enforce pure JSON
      messages: [
        { role: "system", content: system },
        { role: "user", content: user || "Create a challenge." },
      ],
    }),
    signal,
  });

  if (!r.ok) throw new Error(`openai ${r.status}`);
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "greeting", message = "" } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // auth
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await supabase.auth.getUser(token);
    const user = u?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    // fast path for creation: no extra DB reads, tiny prompt
    if (action === "create_challenge") {
      // write user message in background (don’t block)
      supabase.from("trainer_messages").insert({
        user_id: user.id, message_type: "user", content: message || "(create_challenge)",
      }).catch(() => {});

      const system = `
You are a warm, human-sounding personal coach. Do not mention AI.
Respond with JSON only (no markdown, no preface) with keys:
"title","description","category","estimated_minutes","difficulty","benefit".
- "category" in [${CATEGORIES.join(", ")}]
- "estimated_minutes" is an integer 1–1440 (minutes)
- Keep title/description clear and specific.
      `.trim();

      // timeout guard (6.5s). On timeout, we fall back.
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6500);

      let payload: any;
      try {
        payload = await callOpenAIJSON(system, message, ctrl.signal);
      } catch {
        // fallback: quick deterministic task based on any minutes found in the message
        const hinted = Number((message.match(/\b(\d{1,3})\s*min/) || [])[1] || (message.match(/\b(\d{1,2})\b/) || [])[1] || 10);
        payload = {
          title: "Quick Focus Sprint",
          description: "Pick one small task and work on it with full attention until your timer ends.",
          category: "focus",
          estimated_minutes: clamp(Math.round(hinted), 1, 1440),
          difficulty: 2,
          benefit: "Deep, time-boxed focus builds momentum and reduces avoidance.",
        };
      } finally {
        clearTimeout(t);
      }

      const ch = normalize(payload);

      // save as custom-only entry
      await Promise.all([
        supabase.from("user_challenges").insert({
          user_id: user.id,
          is_custom: true,
          created_by: "trainer",
          custom_title: ch.title,
          custom_description: ch.description,
          custom_category: ch.category,
          custom_time_minutes: ch.estimated_minutes,
          status: "pending",
          scheduled_date: new Date().toISOString().slice(0, 10),
        }),
        supabase.from("trainer_messages").insert({
          user_id: user.id, message_type: "trainer", content: JSON.stringify(ch, null, 2),
        }),
      ]);

      return new Response(JSON.stringify({ success: true, response: ch }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // simple lightweight non-create replies (kept short)
    const reply = "Got it. Tell me what you want to work on and how many minutes.";
    await supabase.from("trainer_messages").insert({
      user_id: user.id, message_type: "trainer", content: reply,
    });

    return new Response(JSON.stringify({ success: true, response: reply }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
