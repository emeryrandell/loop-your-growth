import { BarChart3, TrendingUp, Calendar, Target, Award, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const InsightsPage = () => {
  const { user } = useAuth();

  // Get weekly insights data
  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ['weekly-insights', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get challenges from the past week
      const { data: weekChallenges, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString());
      
      if (error) throw error;
      
      // Get all-time stats
      const { data: allChallenges } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', user.id);
      
      // Get streak data
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return {
        weekChallenges: weekChallenges || [],
        allChallenges: allChallenges || [],
        streak: streak || { current_streak: 0, longest_streak: 0 }
      };
    },
    enabled: !!user,
  });

  if (isLoading || !weeklyData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading your insights...</p>
          </div>
        </div>
      </div>
    );
  }

  const { weekChallenges, allChallenges, streak } = weeklyData;

  // Calculate weekly stats
  const weekCompleted = weekChallenges.filter(c => c.status === 'completed').length;
  const weekTotal = weekChallenges.length;
  const weekCompletionRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  // Calculate category distribution for the week
  const categoryStats = weekChallenges.reduce((acc, challenge) => {
    const category = challenge.challenges?.category || 'unknown';
    if (!acc[category]) {
      acc[category] = { total: 0, completed: 0 };
    }
    acc[category].total++;
    if (challenge.status === 'completed') {
      acc[category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // Find most active category
  const mostActiveCategory = Object.entries(categoryStats)
    .sort((a, b) => b[1].completed - a[1].completed)[0];

  // Calculate average completion time (estimated)
  const completedChallenges = weekChallenges.filter(c => c.status === 'completed' && c.challenges);
  const avgTime = completedChallenges.length > 0 
    ? Math.round(completedChallenges.reduce((sum, c) => sum + (c.challenges?.estimated_minutes || 0), 0) / completedChallenges.length)
    : 0;

  // All-time stats
  const totalCompleted = allChallenges.filter(c => c.status === 'completed').length;
  const overallCompletionRate = allChallenges.length > 0 
    ? Math.round((totalCompleted / allChallenges.length) * 100) 
    : 0;

  const getCategoryColor = (category: string) => {
    const colors = {
      energy: 'bg-success',
      mindset: 'bg-accent',
      focus: 'bg-secondary',
      relationships: 'bg-primary',
      home: 'bg-success',
      finance: 'bg-secondary',
      creativity: 'bg-accent',
      recovery: 'bg-primary',
    };
    return colors[category as keyof typeof colors] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
      
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Weekly Insights
            </h1>
            <p className="text-muted-foreground">
              Your growth patterns and achievements from the past week
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Insights */}
            <div className="lg:col-span-2 space-y-6">
              {/* Week Summary */}
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    This Week's Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-success mb-1">{weekCompleted}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">{weekCompletionRate}%</div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent mb-1">{avgTime}</div>
                      <p className="text-sm text-muted-foreground">Avg. Minutes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-warning mb-1">{streak.current_streak}</div>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                    </div>
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Weekly Summary:</strong>
                    </p>
                    <p className="text-sm">
                      {weekCompletionRate >= 80 ? 
                        "🔥 Outstanding week! You're building incredible momentum and consistency." :
                        weekCompletionRate >= 60 ?
                        "🌟 Solid week! You're making great progress on your growth journey." :
                        weekCompletionRate >= 40 ?
                        "💪 Good effort! Remember, progress isn't always linear - keep going!" :
                        "🌱 Every step counts! Focus on small wins and building consistency."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(categoryStats).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No challenges completed this week. Start your next challenge to see insights here!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(categoryStats).map(([category, stats]) => {
                        const rate = Math.round((stats.completed / stats.total) * 100);
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded ${getCategoryColor(category)}`}></div>
                                <span className="font-medium capitalize">{category}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {stats.completed}/{stats.total} ({rate}%)
                              </div>
                            </div>
                            <Progress value={rate} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trends & Recommendations */}
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Insights & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {mostActiveCategory && (
                      <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-success" />
                          <span className="font-medium text-success">Strongest Area</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You're excelling in <strong className="capitalize">{mostActiveCategory[0]}</strong> challenges. 
                          Great consistency in this area!
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Time Investment</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You've invested approximately <strong>{weekCompleted * avgTime} minutes</strong> in personal growth this week. 
                        {weekCompleted * avgTime >= 100 ? ' Impressive dedication!' : ' Every minute counts!'}
                      </p>
                    </div>

                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="h-4 w-4 text-accent" />
                        <span className="font-medium text-accent">Next Week Focus</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {weekCompletionRate >= 80 ?
                          "You're ready for slightly more challenging goals. Your Trainer will adjust accordingly." :
                          weekCompletionRate >= 60 ?
                          "Maintain this momentum! Focus on consistency over intensity." :
                          "Let's start with smaller, more achievable goals to build your confidence."
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* All-Time Stats */}
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg">All-Time Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-1">
                      {totalCompleted}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Challenges</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Overall Rate</span>
                      <span className="font-medium">{overallCompletionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Streak</span>
                      <span className="font-medium text-success">{streak.current_streak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Best Streak</span>
                      <span className="font-medium text-primary">{streak.longest_streak} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={streak.current_streak >= 7 ? "default" : "secondary"}>
                        🔥 Week Warrior
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {streak.current_streak >= 7 ? 'Unlocked' : `${7 - streak.current_streak} days`}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={streak.longest_streak >= 21 ? "default" : "secondary"}>
                        🏆 Habit Master
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {streak.longest_streak >= 21 ? 'Unlocked' : `${21 - streak.longest_streak} days`}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={totalCompleted >= 100 ? "default" : "secondary"}>
                        💯 Century Club
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {totalCompleted >= 100 ? 'Unlocked' : `${100 - totalCompleted} left`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;