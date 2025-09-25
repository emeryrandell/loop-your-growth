import { Calendar, TrendingUp, Award, Share2, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import ProgressCard from "@/components/ProgressCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ProgressPage = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || "Looper";
  
  // Fetch user streak data
  const { data: streakData } = useQuery({
    queryKey: ['user-streak'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Calculate total challenges completed (excluding notes)
  const { data: totalChallenges = 0 } = useQuery({
    queryKey: ['total-challenges-completed'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .neq('status', 'note'); // Exclude notes
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  // Calculate completion rate (excluding notes)
  const { data: completionRate = 0 } = useQuery({
    queryKey: ['user-completion-rate'],
    queryFn: async () => {
      const { count: completed, error: completedError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .neq('status', 'note'); // Exclude notes

      const { count: total, error: totalError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .neq('status', 'note'); // Exclude notes from total count too
      
      if (completedError || totalError) return 0;
      
      const completedCount = completed || 0;
      const totalCount = total || 0;
      
      return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    },
    enabled: !!user
  });

  // Fetch recent completed challenges (excluding notes)
  const { data: recentChallenges = [] } = useQuery({
    queryKey: ['recent-user-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (title, category, difficulty)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .neq('status', 'note') // Exclude notes
        .not('completion_date', 'is', null) // Only challenges with completion dates
        .order('completion_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Get user profile for focus area
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const streak = streakData || { current_streak: 0, longest_streak: 0 };
  const currentDay = totalChallenges + 1;
  const focusArea = userProfile?.preferred_track || "Mindset";

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {userName}'s Progress
          </h1>
          <p className="text-muted-foreground">
            Track your journey and celebrate your wins
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card-gradient">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-success" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success mb-1">
                    {streak.current_streak} days
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep it going! You're building great momentum
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    Best Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {streak.longest_streak} days
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Personal record to beat
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-accent" />
                    Total Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-1">
                    {currentDay}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Days on your journey
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {completionRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Challenges completed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Challenges */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle>Recent Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentChallenges.map((challenge, index) => (
                    <div
                      key={challenge.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {totalChallenges - index}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {challenge.custom_title || challenge.challenges?.title || "Challenge"}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant={challenge.challenges?.difficulty === '1' || challenge.challenges?.difficulty === '2' ? 'secondary' : 'default'}
                              className="text-xs capitalize"
                            >
                              {challenge.challenges?.category || challenge.custom_category || "General"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-xl flex items-center gap-2">
                        {challenge.status === 'completed' ? (
                          <Trophy className="h-5 w-5 text-success" />
                        ) : challenge.status === 'snoozed' ? (
                          <Clock className="h-5 w-5 text-accent" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-destructive/20"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Card Generator */}
          <div className="space-y-6">
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressCard 
                  day={currentDay}
                  streak={streak.current_streak}
                  userName={userName}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;