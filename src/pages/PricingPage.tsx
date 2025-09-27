import { Check, Star, Crown, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = {
    monthly: [
      {
        name: "Monthly Premium",
        price: "$14.99",
        period: "month",
        description: "Full access to transform your life",
        icon: <Star className="h-6 w-6" />,
        features: [
          "Unlimited daily challenges across all 4 tracks",
          "Full AI trainer with personalized coaching",
          "Streak tracking with milestone rewards", 
          "Shareable progress cards",
          "Complete challenge history & journal",
          "Weekly insights and analytics",
          "Priority customer support",
          "Early access to new features"
        ],
        limitations: [],
        buttonText: "Start Premium",
        buttonVariant: "default" as const,
        popular: true
      },
      {
        name: "Yearly Premium",
        price: "$149.99",
        period: "year",
        originalPrice: "$179.88",
        savings: "Save $29.89",
        description: "Best value for serious self-improvement",
        icon: <Crown className="h-6 w-6" />,
        features: [
          "Everything in Monthly Premium",
          "17% discount",
          "Exclusive yearly challenges",
          "Advanced analytics dashboard",
          "Goal-setting workshops",
          "1-on-1 coaching session (quarterly)",
          "Lifetime access to community",
          "Custom habit creation tools"
        ],
        limitations: [],
        buttonText: "Get Yearly Premium",
        buttonVariant: "default" as const,
        popular: false,
        bestValue: true
      }
    ],
    yearly: [
      {
        name: "Yearly Premium",
        price: "$149.99",
        period: "year",
        originalPrice: "$179.88",
        savings: "Save $29.89",
        description: "Best value for transforming your life",
        icon: <Crown className="h-6 w-6" />,
        features: [
          "Everything in monthly Premium",
          "17% discount",
          "Exclusive yearly challenges",
          "Advanced analytics dashboard",
          "Goal-setting workshops",
          "1-on-1 coaching session (quarterly)",
          "Lifetime access to community",
          "Custom habit creation tools"
        ],
        limitations: [],
        buttonText: "Get Yearly Premium",
        buttonVariant: "default" as const,
        popular: true,
        bestValue: true
      },
      {
        name: "Monthly Premium",
        price: "$14.99",
        period: "month", 
        description: "Full access, billed monthly",
        icon: <Star className="h-6 w-6" />,
        features: [
          "Unlimited daily challenges across all 4 tracks",
          "Full AI trainer with personalized coaching",
          "Streak tracking with milestone rewards",
          "Shareable progress cards",
          "Complete challenge history & journal", 
          "Weekly insights and analytics",
          "Priority customer support",
          "Early access to new features"
        ],
        limitations: [],
        buttonText: "Start Monthly",
        buttonVariant: "outline" as const,
        popular: false
      }
    ]
  };

  const currentPlans = plans[billingCycle];

  const handlePlanSelect = (planName: string) => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} userName={user?.user_metadata?.full_name} />
      
      <div className="pt-16">
        {/* Mobile App Coming Soon Banner */}
        <section className="py-4 px-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 border-b border-primary/20">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Smartphone className="h-5 w-5" />
              <p className="text-sm font-medium">
                Coming Soon: Free Mobile App with basic features - full web experience requires subscription
              </p>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
              Simple, Transparent
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent"> Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Choose your plan and unlock your full potential with personalized daily challenges and AI coaching.
            </p>
            
            {/* Billing Toggle */}
            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")} className="w-fit mx-auto mb-12">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly (Save 17%)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentPlans.map((plan, index) => (
                <Card 
                  key={plan.name} 
                  className={`relative card-feature h-full animate-fade-in-up ${
                    plan.popular ? "ring-2 ring-primary shadow-glow" : ""
                  } ${plan.bestValue ? "ring-2 ring-success shadow-success" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  {plan.bestValue && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-success-foreground">
                      Best Value
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${
                        plan.popular ? "bg-primary/10" : 
                        plan.bestValue ? "bg-success/10" : "bg-secondary/30"
                      }`}>
                        <div className={
                          plan.popular ? "text-primary" : 
                          plan.bestValue ? "text-success" : "text-muted-foreground"
                        }>
                          {plan.icon}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center mt-4">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">/{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="text-center mt-2">
                        <span className="text-muted-foreground line-through text-sm">{plan.originalPrice}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">{plan.savings}</Badge>
                      </div>
                    )}
                    <CardDescription className="text-base text-muted-foreground mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-success mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className={`w-full ${
                        plan.buttonVariant === "default" ? "btn-hero" : ""
                      }`}
                      variant={plan.buttonVariant}
                      size="lg"
                      onClick={() => handlePlanSelect(plan.name)}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-bold text-center text-foreground mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg">What about the mobile app?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We're working on a mobile app with basic free features! The full experience with AI coaching and unlimited challenges will remain on the web platform with your subscription.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Absolutely! You can cancel your subscription at any time. You'll continue to have access to Premium features until the end of your billing period.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg">What makes the yearly plan worth it?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The yearly plan saves you 17% compared to monthly billing, plus includes exclusive features like quarterly coaching sessions, advanced analytics, and custom habit creation tools.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-feature">
                <CardHeader>
                  <CardTitle className="text-lg">How does the AI trainer work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI trainer analyzes your progress, preferences, and feedback to personalize your daily challenges. It adapts difficulty levels and provides motivational coaching tailored to your unique journey.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">
              Start Your Transformation Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join the community of high-achievers who use Looped to build better habits and reach their goals.
            </p>
            <Button 
              size="lg" 
              className="btn-hero text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;