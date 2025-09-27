import { ArrowRight, CheckCircle, Users, Target, Brain, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";


const LandingPage = () => {
  const features = [
    {
      icon: Target,
      title: "Daily micro-challenges",
      description: "One personalized challenge each day. Small steps that compound into big results."
    },
    {
      icon: CheckCircle,
      title: "Track your streaks & progress",
      description: "Visual streak counter and progress tracking to keep you motivated every day."
    },
    {
      icon: Brain,
      title: "Your Personal Trainer",
      description: "Adapts to your needs as you grow. Gets smarter about what works for you."
    }
  ];

  const faqs = [
    {
      question: "Is this an app?",
      answer: "It's a clean web app you can add to your homescreen. We're also building a mobile app with free features coming soon!"
    },
    {
      question: "How personalized is it?",
      answer: "Your trainer learns from your habits and challenges to keep you growing 1% every day."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, no lock-in. Refund available if you hate it."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Mobile App Coming Soon Banner */}
      <section className="py-3 px-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 border-b border-primary/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-primary text-sm">
            <Smartphone className="h-4 w-4" />
            <p className="font-medium">
              Coming Soon: Mobile App with Free Features
            </p>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-background" />
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in-up">
            1% Better, Every Day.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in-up [animation-delay:0.2s]">
            Your personalized trainer learns from you and gives you one challenge each day to build momentum.
          </p>
          <Link to="/auth">
            <Button size="lg" className="btn-hero text-lg px-8 py-6 animate-fade-in-up [animation-delay:0.4s]">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple. Personal. Effective.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three core features that make lasting change inevitable.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-feature">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Start Your 1% Journey
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose your plan and begin transforming your life, one day at a time.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Monthly Plan */}
            <Card className="card-gradient border-2 border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-2">Monthly</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$14.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Button className="w-full btn-ghost-warm" onClick={() => window.location.href = "/pricing"}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
            
            {/* Yearly Plan */}
            <Card className="card-gradient border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg">
                Best Value
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-2">Yearly</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">$149.99</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-success font-medium mb-6">Save $29.89 annually</p>
                <Button className="w-full btn-hero" onClick={() => window.location.href = "/pricing"}>
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground font-medium">
            Seen on <span className="font-semibold">TikTok</span> • <span className="font-semibold">Reddit</span> • <span className="font-semibold">YouTube Shorts</span>
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <Card key={index} className="card-feature">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-accent text-accent-foreground">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="font-display text-3xl font-bold mb-2">Looped</h3>
            <p className="text-accent-foreground/70">1% Better, Every Day.</p>
          </div>
          <div className="flex justify-center space-x-8 text-sm">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;