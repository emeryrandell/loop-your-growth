import { useState } from "react";
import { Flame, Calendar, Clock, Share2, StickyNote, TrendingUp, Zap, Award, Settings, Plus, Shuffle, Pause, User, Trophy, Target, Play, History, BarChart3 } from "lucide-react";
import CoachSidebar from "./CoachSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTrainer } from "@/hooks/useTrainer";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TrainerOnboarding from "./TrainerOnboarding";
import ProgressCard from "./ProgressCard";
import ChallengeActionModal from "./ChallengeActionModal";
import { useToast } from "@/hooks/use-toast";
import AddNoteModal from "./AddNoteModal";
import CreateChallengeModal from "./CreateChallengeModal";
import ShareCardGenerator from "./ShareCardGenerator";
import DoItNowModal from "./DoItNowModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import InProgressChallenges from "./InProgressChallenges";
import { useNavigate, Link } from "react-router-dom";
import { StickyNote } from "lucide-react";

const NewDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
  const [doItNowOpen, setDoItNowOpen] = useState(false);
  const [feedback, setFeedback] = useState<'too_easy' | 'just_right' | 'too_hard' | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

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

  // Fetch progress data for today
  const { data: todayProgress } = useQuery({
    queryKey: ['today-progress'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .gte('completion_date', `${today}T00:00:00`)
        .lte('completion_date', `${today}T23:59:59`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Fetch recent completed challenges
  const { data: recentChallenges = [] } = useQuery({
    queryKey: ['recent-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenges (title, category, difficulty)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('completion_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Calculate stats
  const totalChallenges = useQuery({
    queryKey: ['total-challenges'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  const completionRate = useQuery({
    queryKey: ['completion-rate'],
    queryFn: async () => {
      const { count: completed, error: completedError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      const { count: total, error: totalError } = await supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      if (completedError || totalError) return 0;
      
      const completedCount = completed || 0;
      const totalCount = total || 0;
      
      return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    },
    enabled: !!user
  });

  // Get current day and streak data
  const { data: currentDay = 1 } = useQuery({
    queryKey: ['current-day'],
    queryFn: async () => (totalChallenges.data || 0) + 1,
    enabled: !!user
  });

  const streak = streakData || { current_streak: 0, longest_streak: 0 };

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
            title: "Challenge Complete!",
            description: "Great work! Your streak continues to grow.",
          });
        }
      });
    }
  };

  const handleDeleteChallenge = async () => {
    if (!todayChallenge?.user_challenge_id) return;
    
    try {
      const { error } = await supabase
        .from('user_challenges')
        .delete()
        .eq('id', todayChallenge.user_challenge_id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Challenge deleted",
        description: "Challenge removed from your queue.",
      });
      
      // Refresh the challenge data
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete challenge. Please try again.",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Morning, ${name}`;
    if (hour < 17) return `Afternoon, ${name}`;
    return `Evening, ${name}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={`max-w-7xl mx-auto px-4 py-8 transition-all duration-300 ${
        isCoachOpen ? 'lg:mr-80' : ''
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-foreground">
              {getGreeting()} — ready for your 1%?
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
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calm Welcome Strip */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center border border-primary/10">
              <h2 className="font-display text-2xl md:text-3xl font-medium mb-3 text-foreground">
                1% Better, Today
              </h2>
              <p className="text-muted-foreground mb-4 text-lg">
                Small wins, zero shame. Day {currentDay} of your journey.
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 bg-success/10 px-3 py-1 rounded-full">
                  <Flame className="h-4 w-4 text-success" />
                  <span className="font-medium">{streak.current_streak} day streak</span>
                </div>
                <div className="flex items-center space-x-2 bg-accent/10 px-3 py-1 rounded-full">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span className="font-medium">Best: {streak.longest_streak}</span>
                </div>
              </div>
            </div>

            {/* Today's Challenge - Centerpiece */}
            {todayChallenge ? (
              <Card className="card-feature relative border-2 border-primary/20 shadow-glow">
                <div className={`absolute top-0 left-0 w-2 h-full ${getCategoryColor(todayChallenge.category)} rounded-l-lg`}></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${getCategoryColor(todayChallenge.category)} text-white border-transparent`}
                        >
                          {todayChallenge.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                        {todayChallenge.title}
                      </CardTitle>
                      <p className="text-muted-foreground leading-relaxed">
                        {todayChallenge.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {todayChallenge.benefit && (
                      <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-lg p-4 mb-6 border border-success/20">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="w-2 h-2 bg-success rounded-full"></span>
                        </div>
                        <p className="text-sm font-medium">
                          <span className="text-success">Why this works:</span> {todayChallenge.benefit}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {todayChallenge.status === 'completed' ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                        <Trophy className="h-8 w-8 text-success" />
                      </div>
                      <h4 className="text-xl font-semibold text-success">Challenge Complete!</h4>
                      <p className="text-muted-foreground">
                        Excellent work! Your coach is preparing tomorrow's challenge.
                      </p>
                      <div className="flex justify-center space-x-2 mt-4">
                        <AddNoteModal>
                          <Button variant="outline" size="sm">Add Note</Button>
                        </AddNoteModal>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowShareCard(true)}
                        >
                          Share Win
                        </Button>
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
                          onClick={() => setShowDeleteDialog(true)}
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
            ) : (
              <Card className="card-feature border-2 border-dashed border-muted-foreground/30">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Challenges Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first custom challenge to get started on your 1% improvement journey.
                  </p>
                  <CreateChallengeModal>
                    <Button className="btn-hero">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challenge
                    </Button>
                  </CreateChallengeModal>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card 
                className="card-feature hover:shadow-soft transition-all duration-200 cursor-pointer" 
                onClick={() => setShowShareCard(true)}
              >
                <CardContent className="p-4 text-center">
                  <Share2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Generate Share Card</h3>
                  <p className="text-xs text-muted-foreground">Show off your progress</p>
                </CardContent>
              </Card>
              
              <AddNoteModal>
                <Card className="card-feature hover:shadow-soft transition-all duration-200 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <StickyNote className="h-8 w-8 text-accent mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Add a Note</h3>
                    <p className="text-xs text-muted-foreground">Reflect on your day</p>
                  </CardContent>
                </Card>
              </AddNoteModal>
              
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
                <div className="w-full bg-muted/30 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-success to-primary h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((streak.current_streak / 21) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  {streak.current_streak < 21 
                    ? `${21 - streak.current_streak} days to your next milestone`
                    : "Incredible consistency!"
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}  
          <div className="lg:col-span-1 space-y-6">
            {/* In Progress Challenges */}
            <InProgressChallenges />
            
            {/* Quick Stats */}
            <Card className="card-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{totalChallenges.data || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{completionRate.data || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Streak</span>
                  <span className="font-medium">{streak.longest_streak}</span>
                </div>
              </CardContent>
            </Card>

            {/* Create Challenge */}
            <CreateChallengeModal>
              <Card className="card-soft hover:shadow-soft transition-all duration-200 cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Create Challenge</h3>
                  <p className="text-xs text-muted-foreground">Add your own task</p>
                </CardContent>
              </Card>
            </CreateChallengeModal>
            
            {/* Navigation */}
            <Card className="card-soft">
              <CardContent className="p-2">
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/insights')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Insights
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/calendar-todo')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar & Tasks
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/history')}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Coach Sidebar */}
      <CoachSidebar 
        isOpen={isCoachOpen}
        onToggle={() => setIsCoachOpen(!isCoachOpen)}
      />

      {/* Modals */}
      <DoItNowModal
        open={showActionModal}
        onOpenChange={setShowActionModal}
        challenge={todayChallenge ? {
          ...todayChallenge,
          difficulty: typeof todayChallenge.difficulty === 'string' ? 
            parseInt(todayChallenge.difficulty) || 3 : 
            todayChallenge.difficulty
        } : {
          id: '',
          title: 'Create a Challenge',
          description: 'Add a custom challenge to get started',
          category: 'mindset',
          difficulty: 3,
          estimated_minutes: 15,
        }}
        timeSelected={15}
        onComplete={handleCompleteChallenge}
      />

      {/* Delete Challenge Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this challenge? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Challenge</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChallenge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Card Dialog */}
      <Dialog open={showShareCard} onOpenChange={setShowShareCard}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Your Progress</DialogTitle>
          </DialogHeader>
          <ShareCardGenerator
            type="daily"
            challengeTitle={todayChallenge?.title}
            category={todayChallenge?.category}
            onClose={() => setShowShareCard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewDashboard;