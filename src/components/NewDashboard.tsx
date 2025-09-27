import { useState } from "react";
import { Flame, Calendar, Clock, Share2, StickyNote, TrendingUp, Zap, Award, Settings, Plus, Shuffle, Pause, User, Trophy, Target, Play, History, BarChart3, MessageSquare, MoreHorizontal, Trash2, Sparkles } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const NewDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDoItNowModal, setShowDoItNowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
      energy: 'bg-success text-success-foreground',
      mindset: 'bg-accent text-accent-foreground',
      focus: 'bg-secondary text-secondary-foreground',
      relationships: 'bg-primary text-primary-foreground',
      home: 'bg-success text-success-foreground',
      finance: 'bg-secondary text-secondary-foreground',
      creativity: 'bg-accent text-accent-foreground',
      recovery: 'bg-primary text-primary-foreground',
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Morning, ${name}`;
    if (hour < 17) return `Afternoon, ${name}`;
    return `Evening, ${name}`;
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Warm Welcome */}
          <div className="text-center py-8">
            <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-2">
              {getGreeting()}, {user?.email?.split('@')[0] || 'friend'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {format(new Date(), 'EEEE, MMMM do')} • Day {currentDay} • {streak.current_streak} day streak
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Main Focus Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Today's Focus */}
              {todayChallenge ? (
                <div className="bg-gradient-card rounded-3xl p-8 shadow-warm border border-border/50">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-3">
                      <h2 className="text-xl font-display font-bold text-foreground">
                        Today's Focus
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{todayChallenge.estimated_minutes}m</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(todayChallenge.category)}`}>
                          {todayChallenge.category}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                    {todayChallenge.title}
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                    {todayChallenge.description}
                  </p>
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => setShowDoItNowModal(true)}
                      size="lg"
                      className="flex-1 bg-gradient-warm hover:shadow-warm transition-all duration-500 rounded-xl text-lg py-6"
                    >
                      Let's do this
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFeedbackModal(true)}
                      size="lg"
                      className="rounded-xl border-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-3xl p-12 text-center border border-dashed border-border">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">All done for today</h3>
                  <p className="text-muted-foreground mb-6 text-lg">You've completed today's focus. Great work!</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-warm rounded-xl px-8"
                  >
                    Create Something New
                  </Button>
                </div>
              )}
            </div>
            
            {/* Quick Stats Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-organic">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">
                  Your Journey
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{streak.current_streak}</div>
                    <div className="text-sm text-muted-foreground">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{totalChallenges.data || 0}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl"
                    onClick={() => navigate('/progress')}
                  >
                    View Full Progress
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Button 
                  variant="outline"
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 className="w-4 h-4 mr-3" />
                  Share Progress
                </Button>
                
                <AddNoteModal>
                  <Button 
                    variant="outline"
                    className="w-full justify-start rounded-xl h-12"
                  >
                    <StickyNote className="w-4 h-4 mr-3" />
                    Add Note
                  </Button>
                </AddNoteModal>
                
                <Button 
                  variant="outline"
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => navigate('/history')}
                >
                  <History className="w-4 h-4 mr-3" />
                  View History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the challenge from your queue. You can always create a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChallenge}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CoachSidebar isOpen={isCoachOpen} onToggle={() => setIsCoachOpen(!isCoachOpen)} />
    </div>
  );
};

export default NewDashboard;