import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TrainerSettings {
  id: string;
  user_id: string;
  time_budget: number;
  focus_areas: string[];
  goals?: string;
  constraints?: string;
  onboarding_completed: boolean;
  difficulty_preference: number;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  category: 'energy' | 'mindset' | 'focus' | 'relationships' | 'home' | 'finance' | 'creativity' | 'recovery';
  day_number: number;
  title: string;
  description: string;
  benefit?: string;
  difficulty: '1' | '2' | '3' | '4' | '5';
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

export function useTrainer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get trainer settings
  const { data: trainerSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['trainer-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('trainer_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get subscription status
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get today's challenge based on user's preferences and progress
  const { data: todayChallenge, isLoading: challengeLoading } = useQuery({
    queryKey: ['today-challenge'],
    queryFn: async () => {
      if (!user?.id) return null;

      // Check if user has a pending challenge for today
      const today = new Date().toISOString().split('T')[0];
      
      // First check for custom/scheduled challenges
      const { data: customChallenge } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .or(`scheduled_date.eq.${today},created_at.gte.${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (customChallenge) {
        // Format custom challenge to match expected structure
        return {
          id: customChallenge.id,
          challenge_id: customChallenge.challenge_id,
          title: customChallenge.custom_title || customChallenge.challenges?.title,
          description: customChallenge.custom_description || customChallenge.challenges?.description,
          category: customChallenge.custom_category || customChallenge.challenges?.category,
          estimated_minutes: customChallenge.custom_time_minutes || customChallenge.challenges?.estimated_minutes || 15,
          difficulty: customChallenge.challenges?.difficulty || 'medium',
          benefit: customChallenge.challenges?.benefit || 'Builds consistency',
          status: customChallenge.status,
          user_challenge_id: customChallenge.id,
          is_custom: customChallenge.is_custom,
          created_by: customChallenge.created_by
        };
      }

      // No custom challenges found - return null to show empty state
      return null;
    },
    enabled: !!user && !!trainerSettings && !settingsLoading
  });

  // Complete trainer onboarding
  const completeOnboarding = useMutation({
    mutationFn: async (onboardingData: {
      time_budget: number;
      focus_areas: string[];
      goals?: string;
      constraints?: string;
      difficulty_preference: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('trainer_settings')
        .upsert({
          user_id: user.id,
          ...onboardingData,
          onboarding_completed: true
        }, { 
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Looped!",
        description: "Your Trainer is now ready to create personalized challenges for you.",
      });
      queryClient.invalidateQueries({ queryKey: ['trainer-settings'] });
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
    },
  });

  // Complete challenge with feedback
  const completeChallenge = useMutation({
    mutationFn: async ({ challengeId, feedback, notes }: { 
      challengeId: string; 
      feedback?: 'too_easy' | 'just_right' | 'too_hard'; 
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_challenges')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          feedback,
          notes
        })
        .eq('id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      let newLongestStreak = 1;

      if (existingStreak) {
        const lastDate = existingStreak.last_completion_date;
        if (lastDate === yesterdayStr) {
          newStreak = existingStreak.current_streak + 1;
        } else if (lastDate === today) {
          return; // Already completed today
        }
        newLongestStreak = Math.max(newStreak, existingStreak.longest_streak);

        await supabase
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            last_completion_date: today
          })
          .eq('user_id', user.id);
      }

      // Adjust trainer settings based on feedback
      if (feedback && trainerSettings) {
        let newDifficulty = trainerSettings.difficulty_preference;
        if (feedback === 'too_easy' && newDifficulty < 5) {
          newDifficulty += 1;
        } else if (feedback === 'too_hard' && newDifficulty > 1) {
          newDifficulty -= 1;
        }

        if (newDifficulty !== trainerSettings.difficulty_preference) {
          await supabase
            .from('trainer_settings')
            .update({ difficulty_preference: newDifficulty })
            .eq('user_id', user.id);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Challenge Complete!",
        description: "Great job! Your Trainer is preparing tomorrow's challenge.",
      });
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-settings'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });

  return {
    trainerSettings,
    subscription,
    todayChallenge,
    settingsLoading,
    challengeLoading,
    completeOnboarding,
    completeChallenge,
    isOnboardingComplete: trainerSettings?.onboarding_completed || false,
    canAccessPaidFeatures: subscription?.status === 'active' || subscription?.plan_type !== 'free'
  };
}