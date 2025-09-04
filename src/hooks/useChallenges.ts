import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Challenge {
  id: string;
  track: 'study' | 'fitness' | 'mindset' | 'lifestyle';
  day_number: number;
  title: string;
  description: string;
  benefit?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_minutes: number;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'pending' | 'completed' | 'snoozed' | 'skipped';
  completion_date?: string;
  feedback?: string;
  trainer_response?: string;
  notes?: string;
  challenge?: Challenge;
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

  // Get user's current day based on their challenge history
  const { data: currentDay = 1 } = useQuery({
    queryKey: ['current-day', user?.id],
    queryFn: async () => {
      if (!user) return 1;
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select('challenge_id, challenges(day_number)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completion_date', { ascending: false })
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

  // Get user's streak
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      if (!user) return { current_streak: 0, longest_streak: 0 };
      
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data || { current_streak: 0, longest_streak: 0 };
    },
    enabled: !!user,
  });

  // Get user's profile for preferred track
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get today's challenge
  const { data: todayChallenge, isLoading: todayChallengeLoading } = useQuery({
    queryKey: ['today-challenge', user?.id, currentDay, profile?.preferred_track],
    queryFn: async () => {
      if (!user) return null;
      
      const track = profile?.preferred_track || 'mindset';
      
      // First, try to get an existing user challenge for today
      const { data: existingChallenge, error: existingError } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1)
        .single();
      
      if (!existingError && existingChallenge) {
        return existingChallenge;
      }
      
      // If no existing challenge, create a new one
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('track', track)
        .eq('day_number', currentDay)
        .limit(1)
        .single();
      
      if (challengesError || !challenges) {
        // Fallback to day 1 if current day doesn't exist
        const { data: fallbackChallenge, error: fallbackError } = await supabase
          .from('challenges')
          .select('*')
          .eq('track', track)
          .eq('day_number', 1)
          .limit(1)
          .single();
        
        if (fallbackError) throw fallbackError;
        
        if (fallbackChallenge) {
          // Create user challenge entry
          const { data: newUserChallenge, error: createError } = await supabase
            .from('user_challenges')
            .insert({
              user_id: user.id,
              challenge_id: fallbackChallenge.id,
              status: 'pending'
            })
            .select(`
              *,
              challenges (*)
            `)
            .single();
          
          if (createError) throw createError;
          return newUserChallenge;
        }
      } else {
        // Create user challenge entry for the found challenge
        const { data: newUserChallenge, error: createError } = await supabase
          .from('user_challenges')
          .insert({
            user_id: user.id,
            challenge_id: challenges.id,
            status: 'pending'
          })
          .select(`
            *,
            challenges (*)
          `)
          .single();
        
        if (createError) throw createError;
        return newUserChallenge;
      }
      
      return null;
    },
    enabled: !!user && !!profile,
  });

  // Get challenge history
  const { data: challengeHistory = [] } = useQuery({
    queryKey: ['challenge-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Complete challenge mutation
  const completeChallenge = useMutation({
    mutationFn: async ({ challengeId, feedback, notes }: { 
      challengeId: string; 
      feedback?: string; 
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Update the user challenge
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          feedback,
          notes
        })
        .eq('id', challengeId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStreak, error: streakError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') throw streakError;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      let newLongestStreak = 1;

      if (existingStreak) {
        const lastDate = existingStreak.last_completion_date;
        if (lastDate === yesterdayStr) {
          // Continue streak
          newStreak = existingStreak.current_streak + 1;
        } else if (lastDate === today) {
          // Already completed today, don't update
          return;
        } else {
          // Streak broken, restart
          newStreak = 1;
        }
        newLongestStreak = Math.max(newStreak, existingStreak.longest_streak);

        const { error: updateStreakError } = await supabase
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_completion_date: today,
            streak_start_date: newStreak === 1 ? today : existingStreak.streak_start_date
          })
          .eq('user_id', user.id);

        if (updateStreakError) throw updateStreakError;
      } else {
        // Create new streak
        const { error: createStreakError } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_completion_date: today,
            streak_start_date: today
          });

        if (createStreakError) throw createStreakError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Challenge Completed! 🎉",
        description: "Great job! Your streak has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-history'] });
      queryClient.invalidateQueries({ queryKey: ['current-day'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
      console.error('Complete challenge error:', error);
    },
  });

  // Snooze challenge mutation
  const snoozeChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_challenges')
        .update({ status: 'snoozed' })
        .eq('id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Challenge Snoozed",
        description: "No worries! Try again tomorrow.",
      });
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
    },
  });

  return {
    currentDay,
    streak,
    profile,
    todayChallenge,
    todayChallengeLoading,
    challengeHistory,
    completeChallenge,
    snoozeChallenge,
  };
}