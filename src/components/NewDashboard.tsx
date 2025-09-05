import { useState, useEffect } from "react";
import { Flame, Calendar, Share2, Settings, History, BarChart3, User, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTrainer } from "@/hooks/useTrainer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TrainerOnboarding from "./TrainerOnboarding";
import ProgressCard from "./ProgressCard";

const NewDashboard = () => {
  const { user } = useAuth();
  const { 
    trainerSettings, 
    todayChallenge, 
    challengeLoading, 
    completeOnboarding, 
    completeChallenge, 
    isOnboardingComplete,
    canAccessPaidFeatures
  } = useTrainer();
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  useEffect(() => {
    setShowOnboarding(!isOnboardingComplete);
  }, [isOnboardingComplete]);
  const [feedback, setFeedback] = useState<'too_easy' | 'just_right' | 'too_hard' | null>(null);

  // Get user's streak
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      if (!user) return { current_streak: 0, longest_streak: 0 };
      
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || { current_streak: 0, longest_streak: 0 };
    },
    enabled: !!user,
  });

  // Get current day
  const { data: currentDay = 1 } = useQuery({
    queryKey: ['current-day', user?.id],
    queryFn: async () => {
      if (!user) return 1;
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      return (data?.length || 0) + 1;
    },
    enabled: !!user,
  });

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <TrainerOnboarding onComplete={(data) => completeOnboarding.mutate(data, { onSuccess: () => setShowOnboarding(false) })} />
      </div>
    );
  }

  const handleCompleteChallenge = () => {
    if (todayChallenge) {
      completeChallenge.mutate({
        challengeId: todayChallenge.id,
        feedback: feedback || undefined,
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      energy: 'bg-green-500',
      mindset: 'bg-purple-500',
      focus: 'bg-blue-500',
      relationships: 'bg-pink-500',
      home: 'bg-orange-500',
      finance: 'bg-emerald-500',
      creativity: 'bg-yellow-500',
      recovery: 'bg-indigo-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Morning, ${name} 👋`;
    if (hour < 17) return `Afternoon, ${name} 👋`;
    return `Evening, ${name} 👋`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()} — here's your 1% for today.
            </h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Day {currentDay} of your journey
              </span>
              <span className="flex items-center">
                <Flame className="h-4 w-4 mr-1" />
                {streak.current_streak} day streak
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Streak Display */}
            <Card className="card-gradient text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20"></div>
              <CardContent className="relative z-10 py-12">
                <div className="streak-glow mb-4 text-6xl md:text-8xl font-bold bg-gradient-to-br from-primary to-success bg-clip-text text-transparent">
                  {streak.current_streak}
                </div>
                <h3 className="text-2xl font-semibold mb-2">Day Streak</h3>
                <p className="text-muted-foreground">
                  {streak.current_streak === 0 ? "Ready to start your first day?" : 
                   streak.current_streak >= 7 ? "Incredible momentum! 🔥" : 
                   "Building great habits! 🌟"}
                </p>
                <div className="flex justify-center mt-6">
                  <Trophy className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            {/* Today's Challenge */}
            {todayChallenge && todayChallenge.challenges && (
              <Card className="card-feature relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${getCategoryColor(todayChallenge.challenges.category)}`}></div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold mb-2">Today's Challenge</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {todayChallenge.challenges.category}
                        </Badge>
                        <Badge variant="secondary">
                          Level {todayChallenge.challenges.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {todayChallenge.challenges.estimated_minutes} min
                        </Badge>
                      </div>
                    </div>
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {todayChallenge.challenges.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {todayChallenge.challenges.description}
                  </p>
                  {todayChallenge.challenges.benefit && (
                    <div className="bg-secondary/30 rounded-lg p-4 mb-6">
                      <p className="text-sm font-medium text-success">
                        💡 Why this matters: {todayChallenge.challenges.benefit}
                      </p>
                    </div>
                  )}
                  
                  {todayChallenge.status === 'completed' ? (
                    <div className="text-center py-6 space-y-4">
                      <div className="text-success text-4xl">✅</div>
                      <h4 className="text-xl font-semibold text-success">Challenge Complete!</h4>
                      <p className="text-muted-foreground">
                        Excellent work! Your Trainer is preparing tomorrow's challenge.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        onClick={handleCompleteChallenge}
                        className="btn-hero w-full text-lg py-6"
                        disabled={completeChallenge.isPending}
                      >
                        ✅ Mark as Complete
                      </Button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={feedback === 'too_easy' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setFeedback('too_easy')}
                        >
                          Too Easy
                        </Button>
                        <Button 
                          variant={feedback === 'just_right' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setFeedback('just_right')}
                        >
                          Just Right
                        </Button>
                        <Button 
                          variant={feedback === 'too_hard' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setFeedback('too_hard')}
                        >
                          Too Hard
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Progress Card Generator */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Today's Win
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Celebrate your progress and inspire others with a beautiful share card.
                </p>
                <ProgressCard 
                  day={currentDay}
                  streak={streak.current_streak}
                  userName={user?.user_metadata?.full_name?.split(' ')[0] || 'Anonymous'}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Trainer */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-white">∞</span>
                  </div>
                  Your Trainer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm">
                      {streak.current_streak === 0 
                        ? "Ready for your first challenge? I've picked something perfect to get you started!"
                        : streak.current_streak < 3
                        ? `Great start! I can see you're building momentum. Let's keep this energy going.`
                        : streak.current_streak < 7
                        ? `You're finding your rhythm! I'm adjusting challenges based on your feedback.`
                        : `Amazing consistency! I'm impressed with your dedication. Ready for the next level?`
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Adjust Focus
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Give Feedback
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <span className="font-semibold text-success">{streak.current_streak} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Best Streak</span>
                  <span className="font-semibold text-primary">{streak.longest_streak} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Days</span>
                  <span className="font-semibold">{currentDay - 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Focus Areas</span>
                  <span className="font-semibold capitalize">
                    {trainerSettings?.focus_areas?.join(', ') || 'Mindset'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  Challenge History
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Weekly Insights
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;