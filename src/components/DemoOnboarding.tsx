import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Clock, Shield } from "lucide-react";

interface DemoOnboardingProps {
  onComplete: (preferences: {
    categories: string[];
    timeMinutes: number;
    constraints: string[];
    kidMode: boolean;
    goal?: string;
  }) => void;
}

const DemoOnboarding = ({ onComplete }: DemoOnboardingProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['mindset']);
  const [selectedTime, setSelectedTime] = useState(15);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [kidMode, setKidMode] = useState(false);
  const [goal, setGoal] = useState('');

  const categories = [
    { id: 'energy', label: 'Energy & Movement', description: 'Physical vitality and activity' },
    { id: 'mindset', label: 'Mindset', description: 'Mental clarity and positivity' },
    { id: 'focus', label: 'Focus & Work', description: 'Productivity and concentration' },
    { id: 'relationships', label: 'Relationships', description: 'Connection and community' },
    { id: 'home', label: 'Home & Space', description: 'Environment and organization' },
    { id: 'creativity', label: 'Creativity', description: 'Expression and innovation' },
    { id: 'recovery', label: 'Recovery & Sleep', description: 'Rest and restoration' }
  ];

  const constraints = [
    { id: 'no-equipment', label: 'No Equipment Needed' },
    { id: 'low-impact', label: 'Low Impact Only' },
    { id: 'apartment-friendly', label: 'Apartment Friendly' },
    { id: 'kid-teen-mode', label: 'Kid/Teen Mode' }
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleConstraint = (constraintId: string) => {
    if (constraintId === 'kid-teen-mode') {
      setKidMode(!kidMode);
    } else {
      setSelectedConstraints(prev => 
        prev.includes(constraintId) 
          ? prev.filter(id => id !== constraintId)
          : [...prev, constraintId]
      );
    }
  };

  const handleSubmit = () => {
    onComplete({
      categories: selectedCategories,
      timeMinutes: selectedTime,
      constraints: selectedConstraints,
      kidMode,
      goal: goal.trim() || undefined
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-primary" />
          Let's Personalize Your 1%
        </CardTitle>
        <p className="text-muted-foreground">
          Quick setup to create your perfect Day 1 challenge
        </p>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Categories */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            What areas interest you most? <span className="text-xs text-muted-foreground">(pick any)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                className="p-3 cursor-pointer hover:bg-primary/10 justify-start"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{category.label}</div>
                  <div className="text-xs opacity-75">{category.description}</div>
                </div>
              </Badge>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            How much time do you have today?
          </h3>
          <div className="flex gap-3">
            {[5, 15, 30].map(time => (
              <Badge
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                className="p-3 cursor-pointer hover:bg-primary/10 text-center flex-1"
                onClick={() => setSelectedTime(time)}
              >
                <div>
                  <div className="font-bold text-lg">{time}m</div>
                  <div className="text-xs opacity-75">
                    {time === 5 ? 'Quick win' : time === 15 ? 'Sweet spot' : 'Deep focus'}
                  </div>
                </div>
              </Badge>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <h3 className="font-semibold mb-3">
            Any preferences? <span className="text-xs text-muted-foreground">(optional)</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {constraints.map(constraint => (
              <Badge
                key={constraint.id}
                variant={
                  (constraint.id === 'kid-teen-mode' ? kidMode : selectedConstraints.includes(constraint.id)) 
                    ? "default" : "outline"
                }
                className="p-2 cursor-pointer hover:bg-primary/10 justify-center text-xs"
                onClick={() => toggleConstraint(constraint.id)}
              >
                {constraint.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <h3 className="font-semibold mb-3">
            What would you like to improve? <span className="text-xs text-muted-foreground">(optional)</span>
          </h3>
          <Textarea
            placeholder="e.g., 'Feel more energized' or 'Better sleep habits'"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="min-h-[80px]"
            maxLength={200}
          />
          <div className="text-xs text-muted-foreground mt-1">
            This helps us choose the perfect challenge for you
          </div>
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit} 
          className="w-full btn-hero"
          disabled={selectedCategories.length === 0}
        >
          Generate My Day 1 Challenge
        </Button>
      </CardContent>
    </Card>
  );
};

export default DemoOnboarding;