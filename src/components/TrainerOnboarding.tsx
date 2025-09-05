import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, Brain, Target, Clock, Zap } from "lucide-react";

interface TrainerOnboardingProps {
  onComplete: (data: {
    time_budget: number;
    focus_areas: string[];
    goals?: string;
    constraints?: string;
    difficulty_preference: number;
  }) => void;
}

const categories = [
  { id: 'energy', label: 'Energy & Movement', icon: Zap, description: 'Physical wellness and vitality' },
  { id: 'mindset', label: 'Mindset', icon: Brain, description: 'Mental wellness and positivity' },
  { id: 'focus', label: 'Focus & Productivity', icon: Target, description: 'Work efficiency and concentration' },
  { id: 'relationships', label: 'Relationships', icon: CheckCircle, description: 'Connection and communication' },
  { id: 'home', label: 'Home & Environment', icon: CheckCircle, description: 'Organization and space' },
  { id: 'finance', label: 'Finance', icon: CheckCircle, description: 'Money habits and awareness' },
  { id: 'creativity', label: 'Creativity', icon: CheckCircle, description: 'Self-expression and innovation' },
  { id: 'recovery', label: 'Recovery & Sleep', icon: CheckCircle, description: 'Rest and restoration' },
];

const TrainerOnboarding = ({ onComplete }: TrainerOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['mindset']);
  const [timeBudget, setTimeBudget] = useState([15]);
  const [difficulty, setDifficulty] = useState([3]);
  const [goals, setGoals] = useState('');
  const [constraints, setConstraints] = useState('');

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      }
    } else {
      setSelectedCategories(prev => [...prev, categoryId]);
    }
  };

  const handleComplete = () => {
    onComplete({
      time_budget: timeBudget[0],
      focus_areas: selectedCategories,
      goals: goals || undefined,
      constraints: constraints || undefined,
      difficulty_preference: difficulty[0],
    });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Meet Your Personal Trainer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          I'm here to help you grow 1% better every day. Let me learn about you so I can create perfect challenges for your journey.
        </p>
        
        {/* Progress indicator */}
        <div className="flex justify-center mt-8 mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNumber <= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-12 h-1 mx-2 ${
                  stepNumber < step ? 'bg-primary' : 'bg-secondary'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="card-feature">
        <CardContent className="p-8">
          {step === 1 && (
            <div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">What areas of life do you want to improve?</CardTitle>
                <p className="text-muted-foreground">Choose the areas that matter most to you right now. You can always adjust these later.</p>
              </CardHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  
                  return (
                    <div
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{category.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-sm text-muted-foreground text-center mb-6">
                Selected: {selectedCategories.length} {selectedCategories.length === 1 ? 'area' : 'areas'}
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">How much time can you dedicate daily?</CardTitle>
                <p className="text-muted-foreground">I'll make sure your challenges fit comfortably in your schedule.</p>
              </CardHeader>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-6 h-6 text-primary" />
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {timeBudget[0]} minutes
                    </Badge>
                  </div>
                  
                  <Slider
                    value={timeBudget}
                    onValueChange={setTimeBudget}
                    max={60}
                    min={5}
                    step={5}
                    className="mb-4"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>5 min</span>
                    <span>30 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Perfect!</strong> I'll create challenges that take around {timeBudget[0]} minutes. 
                    Remember, consistency beats intensity - even small daily actions create massive results over time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">How challenging should we start?</CardTitle>
                <p className="text-muted-foreground">I'll adjust based on your feedback, but let's find the right starting point.</p>
              </CardHeader>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Target className="w-6 h-6 text-primary" />
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      Level {difficulty[0]}
                    </Badge>
                  </div>
                  
                  <Slider
                    value={difficulty}
                    onValueChange={setDifficulty}
                    max={5}
                    min={1}
                    step={1}
                    className="mb-4"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Gentle</span>
                    <span>Moderate</span>
                    <span>Ambitious</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className={`p-4 rounded-lg border ${difficulty[0] <= 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-success">Gentle Start</h4>
                    <p className="text-sm text-muted-foreground mt-1">Easy wins to build momentum</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${difficulty[0] === 3 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-warning">Balanced Growth</h4>
                    <p className="text-sm text-muted-foreground mt-1">Moderate challenges with room to stretch</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${difficulty[0] >= 4 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-destructive">Ambitious Push</h4>
                    <p className="text-sm text-muted-foreground mt-1">Challenging goals for faster growth</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">Tell me more about your goals</CardTitle>
                <p className="text-muted-foreground">This helps me understand your why and create more meaningful challenges. (Optional)</p>
              </CardHeader>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What are you hoping to achieve? What's driving you to grow?
                  </label>
                  <Textarea
                    placeholder="e.g., I want to feel more energized, build better habits, be more productive at work..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Any constraints I should know about? (Schedule, physical limitations, etc.)
                  </label>
                  <Textarea
                    placeholder="e.g., I travel frequently, I have small children, I work night shifts..."
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium text-primary mb-1">Ready to start your journey!</h4>
                      <p className="text-sm text-muted-foreground">
                        I'll create personalized challenges for your selected areas: {selectedCategories.join(', ')}. 
                        Each challenge will be designed to fit in {timeBudget[0]} minutes and match your preferred difficulty level.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 4 ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button onClick={handleComplete} className="btn-hero">
                Start My Journey
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerOnboarding;