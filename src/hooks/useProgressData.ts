import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProgressData() {
  const { user } = useAuth();

  // Fetch user streak data
  const { data: streakData } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Calculate total challenges completed
  const { data: totalChallenges = 0 } = useQuery({
    queryKey: ['total-challenges-completed', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });

  // Calculate completion rate
  const { data: completionRate = 0 } = useQuery({
    queryKey: ['user-completion-rate', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count: completed, error: completedError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const { count: total, error: totalError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (completedError || totalError) return 0;
      
      const completedCount = completed || 0;
      const totalCount = total || 0;
      
      return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    },
    enabled: !!user?.id
  });

  // Fetch recent challenges
  const { data: recentChallenges = [] } = useQuery({
    queryKey: ['recent-user-challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (title, category, difficulty)
        `)
        .eq('user_id', user.id)
        .order('completion_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Get user profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const streak = streakData || { current_streak: 0, longest_streak: 0 };
  const currentDay = totalChallenges + 1;
  const focusArea = userProfile?.preferred_track || "Mindset";
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || "Looper";

  return {
    streak,
    totalChallenges,
    completionRate,
    recentChallenges,
    userProfile,
    focusArea,
    currentDay,
    userName,
    isLoading: !user?.id
  };
}