import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  Shield,
  Check,
  ArrowRight,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DemoUpgradeWallProps {
  streakCount: number;
  challengeTitle: string;
  category: string;
}

const DemoUpgradeWall = ({ streakCount, challengeTitle, category }: DemoUpgradeWallProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);

  const features = [
    {
      icon: Target,
      title: 'Personalized Daily Coaching',
      description: 'Your trainer learns your preferences and adapts challenges across all life areas'
    },
    {
      icon: Zap,
      title: 'One-Tap Execution',
      description: 'Built-in timers, breathing guides, and micro-steps make every challenge effortless'
    },
    {
      icon: TrendingUp,
      title: 'Momentum Mechanics',
      description: 'Streaks, badges, comeback days, and visual progress keep you motivated'
    },
    {
      icon: Sparkles,
      title: 'Weekly Insights & Export',
      description: 'Beautiful progress summaries and shareable cards to celebrate your growth'
    }
  ];

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    // Store demo completion in localStorage
    const demoData = {
      completed: true,
      completedAt: new Date().toISOString(),
      challengeTitle,
      category,
      email: email.trim() || undefined
    };
    localStorage.setItem('looped_demo_data', JSON.stringify(demoData));

    // Navigate to auth with plan parameter
    navigate(`/auth?plan=${plan}&from=demo`);
  };

  const handleRemindLater = () => {
    if (!email.trim()) {
      toast.error('Please enter your email to get reminded');
      return;
    }

    // In a real app, you'd save this email for follow-up
    setEmailSaved(true);
    toast.success('Got it! We\'ll send you a gentle reminder in a few days 📧');
  };

  const handleCreateAccount = () => {
    const demoData = {
      completed: true,
      completedAt: new Date().toISOString(),
      challengeTitle,
      category,
      email: email.trim() || undefined
    };
    localStorage.setItem('looped_demo_data', JSON.stringify(demoData));
    navigate('/auth?from=demo');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Celebration Header */}
      <Card className="text-center bg-gradient-to-br from-sprout/10 to-calm/10 border-sprout/20">
        <CardContent className="p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-4">
            Amazing work completing Day {streakCount}!
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            You've just experienced the power of 1% daily improvement with <span className="font-semibold">{challengeTitle}</span> in {category}.
          </p>
          <Badge variant="outline" className="text-sm px-4 py-2">
            Your journey to better starts here ✨
          </Badge>
        </CardContent>
      </Card>

      {/* Value Proposition */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-6">Continue Your Transformation</h3>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="space-y-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-sprout text-white px-3 py-1 text-xs font-semibold">
              BEST VALUE
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span>Yearly Plan</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">$99</div>
                  <div className="text-sm text-muted-foreground line-through">$119</div>
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                $8.25/month • Save $20
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleUpgrade('yearly')}
                className="w-full btn-hero"
              >
                Start Year of Growth
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span>Monthly Plan</span>
                <div className="text-2xl font-bold">$9.99</div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Per month • Cancel anytime
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleUpgrade('monthly')}
                variant="outline"
                className="w-full"
              >
                Continue Monthly
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust & Alternative Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Secure Checkout</h4>
              <p className="text-sm text-muted-foreground">
                256-bit SSL encryption • Cancel anytime
              </p>
            </div>

            <div>
              <div className="space-y-3">
                <h4 className="font-semibold">Save Progress First</h4>
                <Button 
                  onClick={handleCreateAccount}
                  variant="ghost"
                  className="w-full"
                >
                  Create Free Account
                </Button>
              </div>
            </div>

            <div>
              <div className="space-y-3">
                <h4 className="font-semibold">Remind Me Later</h4>
                {!emailSaved ? (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleRemindLater}
                      variant="ghost"
                      size="sm"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-sprout">
                    <Check className="h-4 w-4" />
                    We'll be in touch!
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoUpgradeWall;