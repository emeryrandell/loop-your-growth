import { CheckCircle, Brain, Target, TrendingUp, Users, Calendar, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const FeaturesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
  {
    icon: <Brain className="h-8 w-8 text-primary" />,
    title: "Personal Trainer",
    description: "A supportive coach that adapts to your progress and preferences.",
    details: [
      "Personalized daily challenges based on your goals",
      "Difficulty adjusts with your feedback",
      "Motivational coaching that fits your style",
      "Smart recommendations for steady growth"
    ]
  },
  {
    icon: <Target className="h-8 w-8 text-success" />,
    title: "Daily 1% Challenges",
    description: "Small, achievable tasks that compound into real results.",
    details: [
      "4 tracks: Study, Fitness, Mindset, Lifestyle",
      "Scientifically-backed micro-habits",
      "Time-efficient (5–30 minutes daily)",
      "Progressive difficulty scaling"
    ]
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-accent" />,
    title: "Streak Tracking & Gamification",
    description: "Stay motivated with streaks, badges, and visible progress.",
    details: [
      "Visual streak counters with milestone rewards",
      "Bronze (7), Silver (21), Gold (41+) badges",
      "Progress analytics and insights",
      "Encouraging feedback for missed days"
    ]
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Shareable Progress Cards",
    description: "Create beautiful cards to share your wins and inspire others.",
    details: [
      "Aesthetic, minimalist design",
      "One-click sharing to social",
      "Customizable themes and styles",
      "Built-in virality for community growth"
    ]
  },
  {
    icon: <Calendar className="h-8 w-8 text-success" />,
    title: "Challenge History & Journal",
    description: "Track your journey with a complete log of your progress.",
    details: [
      "Complete history of all challenges",
      "Personal notes and reflections",
      "Success/failure tracking",
      "Growth pattern analysis"
    ]
  },
  {
    icon: <Zap className="h-8 w-8 text-accent" />,
    title: "Weekly Insights",
    description: "See patterns and areas to nudge next week.",
    details: [
      "Weekly completion rates",
      "Focus area breakdown",
      "Habit strength metrics",
      "Personalized recommendations"
    ]
  }
];

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent"> Build Better Habits</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Looped combines personalized coaching, behavioral science, and social motivation 
              to make self-improvement effortless and sustainable.
            </p>
            <Button 
              size="lg" 
              className="btn-hero text-lg px-8 py-6"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Start Your Journey"} 
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="card-feature h-full animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-secondary/30">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-4xl">
            <h2 className="font-display text-4xl font-bold text-center text-foreground mb-16">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Track</h3>
                <p className="text-muted-foreground">
                  Select from Study, Fitness, Mindset, or Lifestyle. Your personal coach personalizes challenges to your goals.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-success">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Complete Daily Challenges</h3>
                <p className="text-muted-foreground">
                  Spend 5-30 minutes daily on scientifically-designed micro-habits that build lasting change.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Track & Share Progress</h3>
                <p className="text-muted-foreground">
                  Build streaks, earn badges, and share beautiful progress cards with the community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">
              Ready to Build Your Best Self?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of people who are already seeing results with just 1% daily improvements.
            </p>
            <Button 
              size="lg" 
              className="btn-hero text-lg px-8 py-6"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Continue Your Journey" : "Start Free Today"} 
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeaturesPage;