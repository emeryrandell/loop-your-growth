import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, Timer, Clock, Shuffle, Moon, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: any;
  onComplete: (note?: string) => void;
  onSwap: () => void;
  onSnooze: (minutes: number) => void;
}

const ChallengeActionModal = ({ 
  open, 
  onOpenChange, 
  challenge, 
  onComplete, 
  onSwap, 
  onSnooze 
}: ChallengeActionModalProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(15);
  const [showBreather, setShowBreather] = useState(false);
  const [note, setNote] = useState("");
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const intervalRef = useRef<NodeJS.Timeout>();

  const timeOptions = [5, 15, 30];

  useEffect(() => {
    if (challenge?.challenges?.estimated_minutes) {
      setSelectedTime(challenge.challenges.estimated_minutes);
      setTimeLeft(challenge.challenges.estimated_minutes * 60);
    }
  }, [challenge]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play completion sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAg==');
            audio.play().catch(() => {}); // Ignore audio errors
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Breathing animation effect
  useEffect(() => {
    if (showBreather) {
      const breathingInterval = setInterval(() => {
        setBreathPhase(prev => {
          if (prev === 'inhale') return 'hold';
          if (prev === 'hold') return 'exhale';
          return 'inhale';
        });
      }, 4000);

      return () => clearInterval(breathingInterval);
    }
  }, [showBreather]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimeLeft(selectedTime * 60);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedTime * 60);
  };

  const handleComplete = () => {
    // Show confetti effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Create confetti effect (simplified version)
      const confettiContainer = document.createElement('div');
      confettiContainer.className = 'fixed inset-0 pointer-events-none z-50';
      document.body.appendChild(confettiContainer);
      
      setTimeout(() => {
        document.body.removeChild(confettiContainer);
      }, 3000);
    }, 250);

    // Play completion sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAjqK0fLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAg==');
    audio.play().catch(() => {});

    onComplete(note || undefined);
    onOpenChange(false);
  };

  if (!challenge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Do It Now</span>
            <Badge variant="outline" className="capitalize">
              {challenge.challenges?.category}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Summary */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              {challenge.challenges?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {challenge.challenges?.description}
            </p>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">Choose your time:</span>
            </div>
            <div className="flex justify-center space-x-2">
              {timeOptions.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedTime(time);
                    setTimeLeft(time * 60);
                    setIsRunning(false);
                  }}
                >
                  {time}m
                </Button>
              ))}
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex justify-center space-x-2">
              {!isRunning ? (
                <Button onClick={startTimer} className="btn-hero">
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={resetTimer} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Breath Pacer */}
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBreather(!showBreather)}
              >
                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                {showBreather ? 'Hide' : 'Show'} Breath Pacer
              </Button>
            </div>
            
            {showBreather && (
              <div className="flex flex-col items-center space-y-2">
                <div 
                  className={cn(
                    "w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow transition-all duration-4000 ease-in-out",
                    breathPhase === 'inhale' && "scale-125",
                    breathPhase === 'hold' && "scale-125",
                    breathPhase === 'exhale' && "scale-75"
                  )}
                />
                <p className="text-sm text-muted-foreground capitalize">
                  {breathPhase === 'hold' ? 'Hold' : breathPhase}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick note (optional):</label>
            <Textarea
              placeholder="How did it go? Any thoughts..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Button
                onClick={handleComplete}
                className="btn-hero w-full flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                Complete
              </Button>
              <div className="flex space-x-1">
                <Button
                  onClick={() => onSwap()}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Shuffle className="h-3 w-3 mr-1" />
                  Swap
                </Button>
                <Button
                  onClick={() => onSnooze(60)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  1h
                </Button>
                <Button
                  onClick={() => onSnooze(30)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Moon className="h-3 w-3 mr-1" />
                  30m
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeActionModal;