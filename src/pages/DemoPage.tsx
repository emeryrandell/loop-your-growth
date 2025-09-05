import { useState } from "react";
import { ArrowRight, CheckCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";

const DemoPage = () => {
  const [completed, setCompleted] = useState(false);

  const demoChallenge = {
    title: "Write Tomorrow's Top 3",
    description: "Before bed tonight, write down the 3 most important things you want to accomplish tomorrow. This simple practice helps your brain prepare and prioritize.",
    difficulty: "beginner",
    category: "Mindset"
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const handleContinue = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={false} />
      
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Welcome to Your Free Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience how Looped helps you build momentum with personalized daily challenges.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Demo Challenge */}
          <div className="lg:col-span-2">
            <Card className="card-feature">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-semibold">Day 1 Challenge</CardTitle>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant="outline">{demoChallenge.category}</Badge>
                      <Badge variant="secondary">{demoChallenge.difficulty}</Badge>
                    </div>
                  </div>
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-medium mb-3">{demoChallenge.title}</h3>
                <p className="text-muted-foreground mb-6">{demoChallenge.description}</p>
                
                {!completed ? (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleComplete}
                      className="btn-hero w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Try it out! This is just a taste of what Looped offers.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="text-success text-4xl mb-4">🎉</div>
                    <h4 className="text-xl font-semibold text-success">Demo Complete!</h4>
                    <p className="text-muted-foreground">
                      Great job! You've just experienced Day 1 of your journey.
                    </p>
                    <div className="bg-secondary/50 rounded-lg p-4 mt-6">
                      <p className="text-sm font-medium mb-2">Your Trainer says:</p>
                      <p className="text-sm text-muted-foreground">
                        "Nice work completing your first challenge! I can see you're ready for mindset-focused tasks. Tomorrow I'll give you something that builds on this momentum."
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subscription Prompt */}
          <div>
            <Card className="card-gradient sticky top-8">
              <CardHeader>
                <CardTitle className="text-center">Continue Your Journey</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-3xl font-bold text-primary">Day 2</div>
                <p className="text-sm text-muted-foreground">
                  Ready for tomorrow's personalized challenge?
                </p>
                
                <div className="space-y-3">
                  <Button 
                    onClick={handleContinue}
                    className="btn-hero w-full"
                    disabled={!completed}
                  >
                    Continue Your Journey
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {!completed && (
                  <p className="text-xs text-muted-foreground">
                    Complete Day 1 to continue your journey
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What's Next */}
        {completed && (
          <Card className="card-feature mt-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4 text-center">What happens next?</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h4 className="font-medium mb-2">Personalized Challenge</h4>
                  <p className="text-sm text-muted-foreground">
                    Your trainer creates tomorrow's challenge based on your Day 1 completion
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h4 className="font-medium mb-2">Build Your Streak</h4>
                  <p className="text-sm text-muted-foreground">
                    Track daily progress and build momentum with visual streak counters
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">∞</span>
                  </div>
                  <h4 className="font-medium mb-2">Continuous Growth</h4>
                  <p className="text-sm text-muted-foreground">
                    Challenges adapt to keep you growing 1% better every single day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DemoPage;