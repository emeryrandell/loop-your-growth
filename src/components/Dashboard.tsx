import { useState } from "react";
import { Calendar, Trophy, Share2, User, Settings, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [currentDay, setCurrentDay] = useState(7);
  const [streak, setStreak] = useState(7);
  const [todayCompleted, setTodayCompleted] = useState(false);

  const handleCompleteChallenge = () => {
    setTodayCompleted(true);
    setStreak(prev => prev + 1);
    // Trigger confetti animation
  };

  const generateProgressCard = () => {
    // This would generate a shareable progress card
    console.log("Generating progress card...");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground mt-2">Day {currentDay} of your journey</p>
          </div>
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Streak Counter */}
            <Card className="card-gradient text-center py-8">
              <CardContent>
                <div className="streak-glow mb-4">{streak}</div>
                <p className="text-xl font-medium text-muted-foreground">Day Streak</p>
                <div className="flex justify-center mt-4">
                  <Trophy className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            {/* Today's Challenge */}
            <Card className="card-feature">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Today's Challenge</CardTitle>
                    <div className="flex items-center mt-2 space-x-2">
                     <Badge variant="outline">{todayChallenge.category}</Badge>
                      <Badge variant={todayChallenge.difficulty === 'beginner' ? 'secondary' : 'default'}>
                        {todayChallenge.difficulty}
                    </div>
                  </div>
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-medium mb-3">Complete 25-minute Focused Study Session</h3>
                <h3 className="text-xl font-medium mb-3">{todayChallenge.title}</h3>
                <p className="text-muted-foreground mb-6">{todayChallenge.description}</p>
                {!todayCompleted ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleCompleteChallenge}
                      className="btn-hero w-full"
                    >
                      Mark as Complete
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Too Easy
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Too Hard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Trophy className="h-5 w-5 text-success" />
                    </div>
                    <p className="text-success font-medium">Challenge Complete!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tomorrow's challenge will be ready at midnight
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Card Generator */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Generate a beautiful card to share your streak on social media.
                </p>
                <Button onClick={generateProgressCard} className="btn-ghost-warm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Progress Card
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Trainer */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="text-lg">Your Trainer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <p className="text-sm">
                      "Great job completing yesterday's challenge! I've noticed you prefer study-focused tasks in the morning. Tomorrow I'll give you something similar."
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Chat with Trainer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Days</span>
                  <span className="font-medium">{currentDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Best Streak</span>
                  <span className="font-medium">12 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Focus Area</span>
                  <span className="font-medium">Study</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-medium text-success">85%</span>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="card-feature">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Change Focus Area
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Subscription
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-destructive">
                  Restart Challenge
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
