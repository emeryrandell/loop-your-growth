// src/lib/coach.ts
import { supabase } from "@/integrations/supabase/client";

export type CoachAction =
  | "general"
  | "create_challenge"
  | "greeting";

type AskCoachArgs = {
  message: string;
  action?: CoachAction;
  // optional hints if you already know them (coach still honors user's text)
  payload?: { time_minutes?: number; category?: string; goal?: string };
};

export type CoachJSONChallenge = {
  title: string;
  description: string;
  category:
    | "energy"
    | "mindset"
    | "focus"
    | "relationships"
    | "home"
    | "finance"
    | "creativity"
    | "recovery";
  estimated_minutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  benefit?: string;
};

export async function askCoach({ message, action = "general", payload }: AskCoachArgs) {
  const { data, error } = await supabase.functions.invoke("ai-trainer", {
    body: { action, message, payload },
  });

  if (error) {
    throw new Error(error.message || "Coach error");
  }

  const raw = (data?.response ?? "").toString();

  // Try to detect/parse strict JSON (create mode). If not JSON, return as text.
  let parsed: CoachJSONChallenge | null = null;
  try {
    const maybe = JSON.parse(raw);
    if (maybe && typeof maybe === "object" && "title" in maybe && "estimated_minutes" in maybe) {
      parsed = maybe as CoachJSONChallenge;
    }
  } catch {
    /* not JSON, that's fine */
  }

  return { raw, parsed, success: !!data?.success };
}
