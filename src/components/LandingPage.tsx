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
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-accent/10 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight">
              Your life is about to get{' '}
              <span className="relative">
                <span className="bg-gradient-warm bg-clip-text text-transparent">
                  intentional
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-warm rounded-full transform scale-x-0 animate-[scale-x_1s_ease-out_0.5s_forwards] origin-left"></div>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Small daily actions compound into extraordinary transformations. Start where you are, use what you have, do what you can.
            </p>
          </div>

          <div className="pt-8">
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 h-auto bg-gradient-warm hover:shadow-warm transition-all duration-500 transform hover:scale-105 rounded-xl font-semibold"
              onClick={() => window.location.href = '/auth'}
            >
              Begin Your Transformation
            </Button>
          </div>

          <div className="pt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Start free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>No commitment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Proven results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
              Designed for{' '}
              <span className="bg-gradient-warm bg-clip-text text-transparent">
                real people
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              No overwhelming dashboards or complex systems. Just simple, effective tools that actually help you grow.
            </p>
          </div>
          
          <div className="grid gap-8 md:gap-12">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 py-8`}
              >
                <div className="flex-1 space-y-6">
                  <div className="w-14 h-14 bg-gradient-warm rounded-2xl flex items-center justify-center shadow-warm">
                    <feature.icon className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>
                <div className="flex-1 h-64 bg-gradient-soft rounded-3xl shadow-organic flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
                    <feature.icon className="w-16 h-16 text-primary" />
                  </div>
                </div>
              </div>
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