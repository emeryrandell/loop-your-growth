import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const FAQPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: "Getting Started",
      faqs: [
        {
          question: "What is Looped and how does it work?",
          answer: "Looped helps you get 1% better every day through personalized micro-challenges. Your personal Trainer creates daily tasks tailored to your goals across 8 life areas: Energy/Movement, Mindset, Focus/Work, Relationships, Home/Environment, Finance, Creativity, and Recovery/Sleep. Each challenge takes just 5-30 minutes."
        },
        {
          question: "How do I get started?",
          answer: "As of right now, we apologise as our free demo is not working. Please go our social media @getlooped.app on Instagram or @getloopedapp on Youtube to leanr more our product before purchasing a subscription."
        },
        {
          question: "What are the 8 challenge categories?",
          answer: "Energy/Movement (physical wellness), Mindset (mental health), Focus/Work (productivity), Relationships (connections), Home/Environment (organization), Finance (money habits), Creativity (self-expression), and Recovery/Sleep (rest). Each area helps you grow holistically."
        }
      ]
    },
    {
      title: "Your Personal Trainer",
      faqs: [
        {
          question: "How does my personal Trainer customize challenges?",
          answer: "Your Trainer learns from your feedback and completion patterns to create perfect-fit challenges. It remembers what you enjoy, adjusts difficulty based on your responses, and respects your time preferences to keep you motivated and growing."
        },
        {
          question: "What if I miss a day?",
          answer: "No guilt! Looped is designed with a supportive approach. Missing a day resets your streak, but your personal coach provides encouraging feedback and helps you get back on track. Consistency beats perfection."
        },
        {
          question: "Can I switch between tracks?",
          answer: "Absolutely! Premium users can change their primary tracks anytime in settings. Your personal coach will adapt to provide challenges for your new focus area while maintaining your overall progress history."
        }
      ]
    },
    {
      title: "Features & Premium",
      faqs: [
        {
          question: "What's included in the free demo?",
          answer: "The free demo includes one day of challenges, basic progress tracking, limited coaching interaction, and community access. It's designed to give you a real taste of the Looped experience. (As of right the demo is not working and will be back within the next week.)"
        },
        {
          question: "What additional features do I get with Premium?",
          answer: "Premium includes unlimited daily challenges, full personal coaching, streak tracking with badges, shareable progress cards, complete challenge history, weekly insights, priority support, and early access to new features. As of right now we do not have a free option."
        },
        {
          question: "How do progress cards work?",
          answer: "Progress cards are beautiful, shareable graphics that showcase your daily wins and streak count. They're designed for social media sharing and help inspire others while celebrating your achievements."
        }
      ]
    },
    {
      title: "Billing & Account",
      faqs: [
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Yes! You can cancel your subscription at any time from your account settings. You'll continue to have Premium access until the end of your current billing period."
        },
        {
          question: "What's the difference between monthly and yearly plans?",
          answer: "The yearly plan offers 17% savings plus new exclusive feature that are coming soon!"
        },
        {
          question: "Do you offer refunds?",
          answer: "We don't offer refunds, but we believe you'll love the transformation that comes from consistent daily growth. Try our free demo first to see if Looped is right for you!"
        }
      ]
    },
    {
      title: "Technical & Support",
      faqs: [
        {
          question: "What devices can I use Looped on?",
          answer: "Looped works on any device with a web browser - desktop, laptop, tablet, or smartphone. We're also working on native mobile apps for an even better experience."
        },
        {
          question: "Is my data secure?",
          answer: "Absolutely. We use enterprise-grade encryption to protect your data and never share personal information with third parties. Your privacy and security are our top priorities."
        },
        {
          question: "How do I contact support?",
          answer: "You can reach us at getloopedsocialmedia@gmail.com for any questions or support. Response times may vary, but we do our best to help everyone on their growth journey!"
        }
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
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <HelpCircle className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground mb-6">
              Frequently Asked
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent"> Questions</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Got questions about Looped? We've got answers. Find everything you need to know about getting started, using features, and making the most of your self-improvement journey.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-primary">{categoryIndex + 1}</span>
                  </div>
                  {category.title}
                </h2>
                
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 100 + faqIndex;
                    const isOpen = openItems.includes(globalIndex);
                    
                    return (
                      <Card key={faqIndex} className="card-feature">
                        <Collapsible 
                          open={isOpen} 
                          onOpenChange={() => toggleItem(globalIndex)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="text-left hover:bg-secondary/20 transition-colors rounded-lg">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold pr-4">
                                  {faq.question}
                                </CardTitle>
                                {isOpen ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <p className="text-muted-foreground leading-relaxed">
                                {faq.answer}
                              </p>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-20 px-4 bg-secondary/20">
          <div className="container mx-auto max-w-4xl">
            <h2 className="font-display text-3xl font-bold text-center text-foreground mb-12">
              Still Need Help?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="card-feature text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Try the Free Demo</CardTitle>
                  <CardDescription>
                    Experience Looped firsthand with our no-commitment free demo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full btn-hero"
                    onClick={() => navigate("/demo")}
                  >
                    Start Free Demo
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="card-feature text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-success/10">
                      <Mail className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Get personalized help from our friendly support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = "mailto:contactloopedpro@gmail.com"}
                  >
                    Email Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of people who are already transforming their lives with daily 1% improvements.
            </p>
            <Button 
              size="lg" 
              className="btn-hero text-lg px-8 py-6"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Get Started Free"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
