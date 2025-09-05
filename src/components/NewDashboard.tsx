import { useState } from "react";
import { Flame, Calendar, Share2, Settings, History, BarChart3, User, Trophy, Target, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTrainer } from "@/hooks/useTrainer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TrainerOnboarding from "./TrainerOnboarding";
import ProgressCard from "./ProgressCard";
import ChallengeActionModal from "./ChallengeActionModal";
import { useToast } from "@/hooks/use-toast";

const NewDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    trainerSettings, 
    todayChallenge, 
    challengeLoading, 
    completeOnboarding, 
    completeChallenge, 
    isOnboardingComplete,
    canAccessPaidFeatures
  } = useTrainer();
  
  const showOnboarding = false;
  const [feedback, setFeedback] = useState<'too_easy' | 'just_right' | 'too_hard' | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [timeToggle, setTimeToggle] = useState(15);

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
        <TrainerOnboarding onComplete={(data) => completeOnboarding.mutate(data)} />
      </div>
    );
  }

  const handleCompleteChallenge = (note?: string) => {
    if (todayChallenge) {
      completeChallenge.mutate({
        challengeId: todayChallenge.id,
        feedback: feedback || undefined,
        notes: note,
      }, {
        onSuccess: () => {
          toast({
            title: "Challenge Complete! 🎉",
            description: "Great work! Your streak continues to grow.",
          });
        }
      });
    }
  };

  const handleSwapChallenge = () => {
    toast({
      title: "Challenge swapped",
      description: "Your trainer is finding a similar alternative...",
    });
    // TODO: Implement challenge swap logic
  };

  const handleSnoozeChallenge = (minutes: number) => {
    toast({
      title: `Challenge snoozed for ${minutes} minutes`,
      description: "We'll remind you when it's time!",
    });
    // TODO: Implement challenge snooze logic
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
            {/* Welcome Strip */}
            <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-6 text-center">
              <h2 className="text-xl md:text-2xl font-semibold mb-2">
                Hey {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} — Day {currentDay}. Ready for today's 1%?
              </h2>
              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-success" />
                  <span>{streak.current_streak} day streak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-warning" />
                  <span>Best: {streak.longest_streak} days</span>
                </div>
              </div>
            </div>

            {/* Today's Challenge - Centerpiece */}
            {todayChallenge && todayChallenge.challenges && (
              <Card className="card-feature relative border-2 border-primary/20 shadow-glow">
                <div className={`absolute top-0 left-0 w-2 h-full ${getCategoryColor(todayChallenge.challenges.category)} rounded-l-lg`}></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge 
                          variant="outline" 
                          className={`capitalize text-white border-white ${getCategoryColor(todayChallenge.challenges.category)}`}
                        >
                          {todayChallenge.challenges.category}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          {[5, 15, 30].map((time) => (
                            <Button
                              key={time}
                              variant={timeToggle === time ? "default" : "outline"}
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setTimeToggle(time)}
                            >
                              {time}m
                            </Button>
                          ))}
                        </div>
                      </div>
                      <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                        {todayChallenge.challenges.title}
                      </CardTitle>
                      <p className="text-muted-foreground leading-relaxed">
                        {todayChallenge.challenges.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Level {todayChallenge.challenges.difficulty}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {todayChallenge.challenges.benefit && (
                    <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-lg p-4 mb-6 border border-success/20">
                      <div className="flex items-start space-x-2">
                        <span className="text-success text-sm">💡</span>
                        <p className="text-sm font-medium">
                          <span className="text-success">Why this works:</span> {todayChallenge.challenges.benefit}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {todayChallenge.status === 'completed' ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-3xl">✅</span>
                      </div>
                      <h4 className="text-xl font-semibold text-success">Challenge Complete!</h4>
                      <p className="text-muted-foreground">
                        Excellent work! Your Trainer is preparing tomorrow's challenge.
                      </p>
                      <div className="flex justify-center space-x-2 mt-4">
                        <Button variant="outline" size="sm">Add Note</Button>
                        <Button variant="outline" size="sm">Share Win</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        onClick={() => setShowActionModal(true)}
                        className="btn-hero w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Do It Now
                      </Button>
                      
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Can't do this right now?",
                              description: "No worries! Your trainer will suggest an alternative or you can snooze it.",
                            });
                          }}
                        >
                          Can't do this?
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <Button 
                          variant={feedback === 'too_easy' ? 'default' : 'ghost'} 
                          size="sm"
                          onClick={() => setFeedback('too_easy')}
                          className="text-xs"
                        >
                          Too Easy
                        </Button>
                        <Button 
                          variant={feedback === 'just_right' ? 'default' : 'ghost'} 
                          size="sm"
                          onClick={() => setFeedback('just_right')}
                          className="text-xs"
                        >
                          Just Right
                        </Button>
                        <Button 
                          variant={feedback === 'too_hard' ? 'default' : 'ghost'} 
                          size="sm"
                          onClick={() => setFeedback('too_hard')}
                          className="text-xs"
                        >
                          Too Hard
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="card-feature hover:shadow-soft transition-all duration-200 cursor-pointer" onClick={() => navigate('/progress')}>
                <CardContent className="p-4 text-center">
                  <Share2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Generate Share Card</h3>
                  <p className="text-xs text-muted-foreground">Show off your progress</p>
                </CardContent>
              </Card>
              
              <Card className="card-feature hover:shadow-soft transition-all duration-200 cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Add a Note</h3>
                  <p className="text-xs text-muted-foreground">Reflect on your day</p>
                </CardContent>
              </Card>
              
              <Card className="card-feature hover:shadow-soft transition-all duration-200 cursor-pointer" onClick={() => navigate('/history')}>
                <CardContent className="p-4 text-center">
                  <History className="h-8 w-8 text-success mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">See History</h3>
                  <p className="text-xs text-muted-foreground">Track your journey</p>
                </CardContent>
              </Card>
            </div>

            {/* Momentum Bar + Progress */}
            <Card className="card-feature">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Your Momentum</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success">{streak.current_streak}</div>
                    <div className="text-xs text-muted-foreground">day streak</div>
                  </div>
                </div>
                
                {/* Momentum Bar */}
                <div className="w-full bg-secondary rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-success to-success-glow h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((streak.current_streak / 21) * 100, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>7 days</span>
                  <span>21 days</span>
                </div>
                
                <p className="text-sm text-center mt-3 text-muted-foreground">
                  {streak.current_streak < 7 
                    ? `${7 - streak.current_streak} days until your first milestone!`
                    : streak.current_streak < 21 
                    ? `${21 - streak.current_streak} days until your 21-day badge!`
                    : "You're a habit champion! 🏆"
                  }
                </p>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/history')}
                >
                  <History className="h-4 w-4 mr-2" />
                  Challenge History
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/insights')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Weekly Insights
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Challenge Action Modal */}
      <ChallengeActionModal
        open={showActionModal}
        onOpenChange={setShowActionModal}
        challenge={todayChallenge}
        onComplete={handleCompleteChallenge}
        onSwap={handleSwapChallenge}
        onSnooze={handleSnoozeChallenge}
      />
    </div>
  );
};

export default NewDashboard;