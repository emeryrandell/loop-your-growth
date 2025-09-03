import { Calendar, TrendingUp, Award, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import ProgressCard from "@/components/ProgressCard";

const ProgressPage = () => {
  const isAuthenticated = true;
  const userName = "Alex";
  
  const progressData = {
    currentDay: 7,
    currentStreak: 7,
    bestStreak: 12,
    totalChallenges: 7,
    completionRate: 85,
    focusArea: "Study"
  };

  const recentChallenges = [
    { day: 7, title: "Active Recall Session", completed: true, difficulty: "beginner" },
    { day: 6, title: "Morning Pages", completed: true, difficulty: "beginner" },
    { day: 5, title: "Deep Work Block", completed: true, difficulty: "intermediate" },
    { day: 4, title: "Digital Detox Hour", completed: false, difficulty: "beginner" },
    { day: 3, title: "Learning Review", completed: true, difficulty: "beginner" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={isAuthenticated} userName={userName} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Your Progress
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
                    {progressData.currentStreak} days
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep it going! You're on fire 🔥
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
                    {progressData.bestStreak} days
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
                    {progressData.currentDay}
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
                    {progressData.completionRate}%
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
                  {recentChallenges.map((challenge) => (
                    <div
                      key={challenge.day}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {challenge.day}
                        </div>
                        <div>
                          <h4 className="font-medium">{challenge.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant={challenge.difficulty === 'beginner' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {challenge.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-xl">
                        {challenge.completed ? "✅" : "⏸️"}
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
                  day={progressData.currentDay}
                  streak={progressData.currentStreak}
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