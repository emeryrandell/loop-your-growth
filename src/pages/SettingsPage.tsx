import { useState } from "react";
import { Settings, User, Bell, Palette, Shield, CreditCard, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTrainer } from "@/hooks/useTrainer";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { trainerSettings, subscription } = useTrainer();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });
  
  const [trainerPrefs, setTrainerPrefs] = useState({
    timeBudget: trainerSettings?.time_budget || 15,
    difficultyPreference: trainerSettings?.difficulty_preference || 3,
    focusAreas: trainerSettings?.focus_areas || ['mindset'],
    goals: trainerSettings?.goals || '',
    constraints: trainerSettings?.constraints || '',
  });
  
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyInsights: true,
    streakMilestones: true,
    emailUpdates: false,
  });

  const categories = [
    { id: 'energy', label: 'Energy & Movement' },
    { id: 'mindset', label: 'Mindset' }, 
    { id: 'focus', label: 'Focus & Productivity' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'home', label: 'Home & Environment' },
    { id: 'finance', label: 'Finance' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'recovery', label: 'Recovery & Sleep' },
  ];

  const toggleFocusArea = (categoryId: string) => {
    if (trainerPrefs.focusAreas.includes(categoryId)) {
      if (trainerPrefs.focusAreas.length > 1) {
        setTrainerPrefs(prev => ({
          ...prev,
          focusAreas: prev.focusAreas.filter(id => id !== categoryId)
        }));
      }
    } else {
      setTrainerPrefs(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, categoryId]
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.fullName,
          email: profileData.email
        });
      
      if (error) throw error;
      
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveTrainer = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('trainer_settings')
        .upsert({
          user_id: user.id,
          time_budget: trainerPrefs.timeBudget,
          difficulty_preference: trainerPrefs.difficultyPreference,
          focus_areas: trainerPrefs.focusAreas,
          goals: trainerPrefs.goals,
          constraints: trainerPrefs.constraints
        });
      
      if (error) throw error;
      
      toast({
        title: "Trainer updated!",
        description: "Your trainer preferences have been saved.",
      });
    } catch (error) {
      console.error('Failed to save trainer settings:', error);
      toast({
        title: "Error",
        description: "Failed to save trainer preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetProgress = async () => {
    if (!user?.id) return;
    
    if (confirm('Are you sure you want to restart your challenge journey? This will reset your streak and progress.')) {
      try {
        // Reset streak
        await supabase
          .from('streaks')
          .update({
            current_streak: 0,
            longest_streak: 0,
            last_completion_date: null
          })
          .eq('user_id', user.id);
        
        toast({
          title: "Progress reset",
          description: "Your journey has been reset. Time for a fresh start!",
        });
      } catch (error) {
        console.error('Failed to reset progress:', error);
        toast({
          title: "Error",
          description: "Failed to reset progress. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleCancelSubscription = () => {
    // Demo functionality
    toast({
      title: "Demo Mode",
      description: "This would cancel your subscription in the full version.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
      
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Customize your Looped experience and preferences
            </p>
          </div>

          <div className="space-y-8">
            {/* Profile Settings */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your email address
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            {/* Trainer Preferences */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-white">∞</span>
                  </div>
                  Your Trainer Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time Budget */}
                <div>
                  <Label className="text-base font-medium">Daily Time Budget</Label>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Minutes per day</span>
                      <Badge variant="outline">{trainerPrefs.timeBudget} minutes</Badge>
                    </div>
                    <Slider
                      value={[trainerPrefs.timeBudget]}
                      onValueChange={(value) => setTrainerPrefs(prev => ({ ...prev, timeBudget: value[0] }))}
                      max={60}
                      min={5}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5 min</span>
                      <span>60 min</span>
                    </div>
                  </div>
                </div>

                {/* Difficulty Preference */}
                <div>
                  <Label className="text-base font-medium">Challenge Difficulty</Label>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Starting difficulty level</span>
                      <Badge variant="outline">Level {trainerPrefs.difficultyPreference}</Badge>
                    </div>
                    <Slider
                      value={[trainerPrefs.difficultyPreference]}
                      onValueChange={(value) => setTrainerPrefs(prev => ({ ...prev, difficultyPreference: value[0] }))}
                      max={5}
                      min={1}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Gentle</span>
                      <span>Ambitious</span>
                    </div>
                  </div>
                </div>

                {/* Focus Areas */}
                <div>
                  <Label className="text-base font-medium">Focus Areas</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose the life areas you want to improve (select at least one)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map((category) => {
                      const isSelected = trainerPrefs.focusAreas.includes(category.id);
                      return (
                        <div
                          key={category.id}
                          onClick={() => toggleFocusArea(category.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-medium capitalize">{category.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <Label htmlFor="goals" className="text-base font-medium">Your Goals (Optional)</Label>
                  <Textarea
                    id="goals"
                    placeholder="What are you hoping to achieve with Looped?"
                    value={trainerPrefs.goals}
                    onChange={(e) => setTrainerPrefs(prev => ({ ...prev, goals: e.target.value }))}
                    rows={3}
                    className="resize-none mt-2"
                  />
                </div>

                {/* Constraints */}
                <div>
                  <Label htmlFor="constraints" className="text-base font-medium">Constraints (Optional)</Label>
                  <Textarea
                    id="constraints"
                    placeholder="Any limitations I should know about? (schedule, physical, etc.)"
                    value={trainerPrefs.constraints}
                    onChange={(e) => setTrainerPrefs(prev => ({ ...prev, constraints: e.target.value }))}
                    rows={3}
                    className="resize-none mt-2"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveTrainer}>Update Trainer</Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Current Plan</div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {subscription?.status || 'Free'} {subscription?.plan_type && `(${subscription.plan_type})`}
                    </p>
                  </div>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                    {subscription?.status === 'active' ? 'Active' : 'Free'}
                  </Badge>
                </div>
                
                {subscription?.current_period_end && (
                  <div className="text-sm text-muted-foreground">
                    {subscription.status === 'active' 
                      ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      : 'No active subscription'
                    }
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    {subscription?.status === 'active' ? 'Manage Subscription' : 'Upgrade to Premium'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="card-feature border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium">Reset Progress</div>
                  <p className="text-sm text-muted-foreground mb-3">
                    This will reset your streak, challenge history, and start your journey from Day 1. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm" onClick={handleResetProgress}>
                    Reset My Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;