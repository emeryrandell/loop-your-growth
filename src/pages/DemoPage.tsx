import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Target, 
  Users, 
  Timer,
  Flame,
  Share2,
  ArrowRight
} from "lucide-react";
import Navigation from "@/components/Navigation";
import DemoOnboarding from "@/components/DemoOnboarding";
import DemoUpgradeWall from "@/components/DemoUpgradeWall";
import DoItNowModal from "@/components/DoItNowModal";
import ShareCardGenerator from "@/components/ShareCardGenerator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DemoChallenge {
  id: string;
  category: string;
  title: string;
  description: string;
  benefit?: string;
  difficulty: number;
  estimated_minutes: number;
  demoMessage?: string;
  trainerNote?: string;
}

interface DemoSession {
  sessionId: string;
  preferences: any;
  challenge: DemoChallenge | null;
  completed: boolean;
  completedAt?: string;
  feedback?: string;
  notes?: string;
}

const DemoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [demoSession, setDemoSession] = useState<DemoSession>({
    sessionId: '',
    preferences: null,
    challenge: null,
    completed: false
  });
  
  const [currentStep, setCurrentStep] = useState<'hero' | 'onboarding' | 'challenge' | 'complete' | 'upgrade'>('hero');
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [doItNowOpen, setDoItNowOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [timeSelected, setTimeSelected] = useState(15);

  // Check for existing demo session or redirect authenticated paid users
  useEffect(() => {
    // Redirect paid users to dashboard
    if (user) {
      // In a real implementation, you'd check their subscription status
      // For now, assume they should go to dashboard
      navigate('/dashboard');
      return;
    }

    // Check for existing demo session
    const existingSession = localStorage.getItem('looped_demo_session');
    if (existingSession) {
      try {
        const session = JSON.parse(existingSession);
        const now = Date.now();
        const sessionAge = now - new Date(session.createdAt).getTime();
        
        // Demo sessions expire after 48 hours
        if (sessionAge < 48 * 60 * 60 * 1000) {
          setDemoSession(session);
          if (session.completed) {
            setCurrentStep('upgrade');
          } else if (session.challenge) {
            setCurrentStep('challenge');
          } else if (session.preferences) {
            setCurrentStep('onboarding');
          }
        } else {
          localStorage.removeItem('looped_demo_session');
        }
      } catch (error) {
        localStorage.removeItem('looped_demo_session');
      }
    }
  }, [user, navigate]);

  const generateDemoChallenge = async (preferences: any) => {
    setIsGeneratingChallenge(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('demo-challenge', {
        body: {
          categories: preferences.categories,
          timeMinutes: preferences.timeMinutes,
          constraints: preferences.constraints,
          kidMode: preferences.kidMode,
          goal: preferences.goal
        }
      });

      if (error) throw error;

      const newSession: DemoSession = {
        sessionId: crypto.randomUUID(),
        preferences,
        challenge: data.challenge,
        completed: false,
        completedAt: undefined
      };

      // Save to localStorage
      localStorage.setItem('looped_demo_session', JSON.stringify({
        ...newSession,
        createdAt: new Date().toISOString()
      }));

      setDemoSession(newSession);
      setTimeSelected(preferences.timeMinutes);
      setCurrentStep('challenge');
      
      toast.success('Your personalized challenge is ready! 🎯');
    } catch (error) {
      console.error('Demo challenge generation error:', error);
      toast.error('Unable to create your challenge. Please try again.');
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

  const handleChallengeComplete = (notes?: string) => {
    const completedSession = {
      ...demoSession,
      completed: true,
      completedAt: new Date().toISOString(),
      notes
    };

    localStorage.setItem('looped_demo_session', JSON.stringify({
      ...completedSession,
      createdAt: new Date().toISOString()
    }));

    setDemoSession(completedSession);
    setCurrentStep('complete');
    
    // Show completion celebration
    setTimeout(() => {
      setCurrentStep('upgrade');
    }, 3000);
  };

  const startOnboarding = () => {
    const sessionId = crypto.randomUUID();
    setDemoSession(prev => ({ ...prev, sessionId }));
    setCurrentStep('onboarding');
  };

  if (currentStep === 'hero') {
    return (
      <div className="min-h-screen bg-paper">
        <Navigation isAuthenticated={false} />
        
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center space-y-8">
            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="font-display text-5xl md:text-6xl font-bold text-ink">
                Your First 1% Today
              </h1>
              <p className="text-xl md:text-2xl text-muted max-w-3xl mx-auto font-light">
                One small step, perfectly chosen for you. Takes just a few minutes to transform your day.
              </p>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Loved by students, creators & parents</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>Just 5-30 minutes</span>
              </div>
            </div>

            {/* CTA */}
            <Button 
              onClick={startOnboarding}
              size="lg"
              className="btn-hero text-lg px-8 py-4"
            >
              Personalize & Begin Your 1%
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {/* What You'll Experience */}
            <Card className="max-w-2xl mx-auto mt-12">
              <CardHeader>
                <CardTitle className="text-xl">What you'll experience today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Perfect Task</h4>
                    <p className="text-sm text-muted-foreground">
                      Personalized challenge based on your goals and time
                    </p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Guided Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      Built-in timer, breathing guide, and gentle coaching
                    </p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Share Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Create your first progress card to celebrate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'onboarding') {
    return (
      <div className="min-h-screen bg-paper">
        <Navigation isAuthenticated={false} />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {isGeneratingChallenge ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center space-y-4">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <h3 className="font-semibold">Creating your perfect Day 1...</h3>
                <p className="text-sm text-muted-foreground">
                  Choosing the ideal challenge based on your preferences
                </p>
              </CardContent>
            </Card>
          ) : (
            <DemoOnboarding onComplete={generateDemoChallenge} />
          )}
        </div>
      </div>
    );
  }

  if (currentStep === 'challenge' && demoSession.challenge) {
    return (
      <div className="min-h-screen bg-paper">
        <Navigation isAuthenticated={false} />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="px-4 py-2">
                Demo Day 1
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-sprout" />
                <span>Streak: 0 → 1</span>
              </div>
            </div>

            {/* Challenge Card */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-12 bg-primary rounded-full" />
                    <div>
                      <CardTitle className="text-2xl">Your Personalized 1%</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {demoSession.challenge.demoMessage}
                      </p>
                    </div>
                  </div>
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Challenge Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{demoSession.challenge.category}</Badge>
                    <Badge variant="secondary">{timeSelected}m</Badge>
                    <Badge variant="outline">Day 1</Badge>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">
                    {demoSession.challenge.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {demoSession.challenge.description}
                  </p>

                  {demoSession.challenge.benefit && (
                    <div className="bg-sprout/10 rounded-lg p-4 border border-sprout/20">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-sprout mt-0.5" />
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold text-sprout">Why this works:</span> {demoSession.challenge.benefit}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                <div>
                  <h4 className="font-semibold mb-3">Choose your time commitment:</h4>
                  <div className="flex gap-2">
                    {[5, 15, 30].map(time => (
                      <Badge
                        key={time}
                        variant={timeSelected === time ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 hover:bg-primary/10"
                        onClick={() => setTimeSelected(time)}
                      >
                        {time}m
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setDoItNowOpen(true)}
                    className="btn-hero flex-1"
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Do It Now
                  </Button>
                  <Button 
                    onClick={() => setShareCardOpen(true)}
                    variant="outline"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Share Card Modal */}
            {shareCardOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <ShareCardGenerator
                  type="daily"
                  challengeTitle={demoSession.challenge.title}
                  category={demoSession.challenge.category}
                  onClose={() => setShareCardOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Do It Now Modal */}
        <DoItNowModal
          open={doItNowOpen}
          onOpenChange={setDoItNowOpen}
          challenge={demoSession.challenge}
          timeSelected={timeSelected}
          onComplete={handleChallengeComplete}
        />
      </div>
    );
  }

  if (currentStep === 'complete' && demoSession.challenge) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Day 1 Complete!</h2>
              <p className="text-muted-foreground">
                You just took your first 1% step with <span className="font-semibold">{demoSession.challenge.title}</span>
              </p>
            </div>
            
            <div className="bg-sprout/10 rounded-lg p-4 border border-sprout/20">
              <p className="text-sm font-medium mb-2">Your Trainer says:</p>
              <p className="text-sm text-muted-foreground">
                {demoSession.challenge.trainerNote}
              </p>
            </div>

            <Progress value={100} className="w-full h-3" />
            <p className="text-sm text-muted-foreground">
              Preparing your personalized journey...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'upgrade' && demoSession.challenge) {
    return (
      <div className="min-h-screen bg-paper">
        <Navigation isAuthenticated={false} />
        
        <div className="px-4 py-8">
          <DemoUpgradeWall
            streakCount={1}
            challengeTitle={demoSession.challenge.title}
            category={demoSession.challenge.category}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default DemoPage;