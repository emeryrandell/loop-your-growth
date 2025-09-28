import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import FAQPage from "./pages/FAQPage";
import DashboardPage from "./pages/DashboardPage";
import ProgressPage from "./pages/ProgressPage";
import HistoryPage from "./pages/HistoryPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import CalendarTodoPage from "./pages/CalendarToDoPage";
import DailyPlannerPage from "./pages/DailyPlannerPage";
import JournalPage from "./pages/JournalPage";

/** DB types (expanded for custom entries) */
export interface Challenge {
  id: string;
  category: string;
  day_number: number;
  title: string;
  description: string;
  benefit?: string;
  difficulty: string;
  estimated_minutes: number;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  // legacy relation-based
  challenge_id?: string | null;
  challenge?: Challenge | null;

  // NEW: custom/template/trainer fields
  is_custom?: boolean;
  created_by?: "trainer" | "template" | "user" | string;

  custom_title?: string | null;
  custom_description?: string | null;
  custom_category?: string | null;
  custom_time_minutes?: number | null;

  // common
  status: "pending" | "completed" | "snoozed" | "skipped" | "active";
  scheduled_date?: string | null;
  completion_date?: string | null;
  feedback?: string | null;
  trainer_response?: string | null;
  notes?: string | null;

  // metadata
  created_at?: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_completion_date?: string;
  streak_start_date?: string;
}

export function useChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /** Helper to refresh everything challenge-related */
  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["today-challenge", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-history", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["streak", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["current-day", user?.id] }),
    ]);
  };

  /** Current day (kept for compatibility with any UI that still uses it) */
  const { data: currentDay = 1 } = useQuery({
    queryKey: ["current-day", user?.id],
    queryFn: async () => {
      if (!user) return 1;

      const { data, error } = await supabase
        .from("user_challenges")
        .select("challenge_id, challenges(day_number)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completion_date", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastCompletedDay = (data[0] as any).challenges?.day_number || 0;
        return lastCompletedDay + 1;
      }
      return 1;
    },
    enabled: !!user,
  });

  /** Streak (existing table-based approach kept) */
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      if (!user) return { current_streak: 0, longest_streak: 0 };

      const { data, error } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || { current_streak: 0, longest_streak: 0 };
    },
    enabled: !!user,
  });

  /** Profile (unchanged) */
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  /**
   * TODAY/PENDING: no more auto-creating random challenges.
   * We just fetch the most recent pending/active user_challenges (custom or linked).
   */
  const {
    data: todayChallenge,
    isLoading: todayChallengeLoading,
    error: todayErr,
  } = useQuery({
    queryKey: ["today-challenge", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_challenges")
        .select(`*, challenges(*)`)
        .eq("user_id", user.id)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!user,
  });

  if (todayErr) {
    console.error("today-challenge error:", todayErr);
  }

  /** History list (shows both custom and linked) */
  const { data: challengeHistory = [] } = useQuery({
    queryKey: ["challenge-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_challenges")
        .select(`*, challenges(*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  /**
   * CREATE via Coach (Edge Function ai-trainer).
   * Server does the insert; we just invalidate + show toast.
   */
  const createChallengeFromCoach = async (
    message: string,
    payload?: { time_minutes?: number; category?: string; goal?: string }
  ) => {
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("ai-trainer", {
      body: { action: "general", message, payload },
    });

    if (error) {
      throw new Error(error.message || "Coach error");
    }

    // If the coach returned human text, fine; if it created a challenge,
    // the server already inserted. We just refresh the queries.
    await refetchAll();

    // Return the raw response in case the UI wants to show it.
    return data?.response as string | undefined;
  };

  /** Complete challenge */
  const completeChallenge = useMutation({
    mutationFn: async ({
      challengeId,
      feedback,
      notes,
    }: {
      challengeId: string;
      feedback?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("user_challenges")
        .update({
          status: "completed",
          completion_date: new Date().toISOString(),
          feedback,
          notes,
        })
        .eq("id", challengeId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Streak maintenance (unchanged)
      const today = new Date().toISOString().split("T")[0];
      const { data: existingStreak, error: streakError } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (streakError && streakError.code !== "PGRST116") throw streakError;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      let newLongestStreak = 1;

      if (existingStreak) {
        const lastDate = existingStreak.last_completion_date;
        if (lastDate === yesterdayStr) {
          newStreak = existingStreak.current_streak + 1;
        } else if (lastDate === today) {
          // Already completed today — no change
          return;
        } else {
          newStreak = 1;
        }

        newLongestStreak = Math.max(newStreak, existingStreak.longest_streak);

        const { error: updateStreakError } = await supabase
          .from("streaks")
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_completion_date: today,
            streak_start_date:
              newStreak === 1 ? today : existingStreak.streak_start_date,
          })
          .eq("user_id", user.id);

        if (updateStreakError) throw updateStreakError;
      } else {
        const { error: createStreakError } = await supabase.from("streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_completion_date: today,
          streak_start_date: today,
        });
        if (createStreakError) throw createStreakError;
      }
    },
    onSuccess: async () => {
      toast({
        title: "Challenge Completed!",
        description: "Great job! Your streak has been updated.",
      });
      await refetchAll();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
      console.error("Complete challenge error:", error);
    },
  });

  /** Snooze */
  const snoozeChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_challenges")
        .update({ status: "snoozed" })
        .eq("id", challengeId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      toast({
        title: "Challenge Snoozed",
        description: "No worries! Try again tomorrow.",
      });
      await refetchAll();
    },
  });

  return {
    /** data */
    currentDay,
    streak,
    profile,
    todayChallenge,
    todayChallengeLoading,
    challengeHistory,

    /** actions */
    createChallengeFromCoach,
    completeChallenge,
    snoozeChallenge,
    refetchAll,
  };
}


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/features" element={<FeaturesPage />} />
  <Route path="/pricing" element={<PricingPage />} />
  <Route path="/faq" element={<FAQPage />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/progress" element={<ProgressPage />} />
  <Route path="/history" element={<HistoryPage />} />
  <Route path="/insights" element={<InsightsPage />} />
  <Route path="/settings" element={<SettingsPage />} />
  <Route path="/calendar-todo" element={<CalendarTodoPage />} />
  <Route path="/planner" element={<DailyPlannerPage />} />
  <Route path="/daily-planner" element={<DailyPlannerPage />} />  {/* alias */}
  <Route path="/journal" element={<JournalPage />} />
  <Route path="*" element={<NotFound />} />
            </Routes>

          </div>
</BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
