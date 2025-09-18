import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Wind,
  Focus,
  Sparkles 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DoItNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: number;
    estimated_minutes: number;
    benefit?: string;
  };
  timeSelected: number;
  onComplete: (note?: string) => void;
}

const DoItNowModal = ({ 
  open, 
  onOpenChange, 
  challenge, 
  timeSelected, 
  onComplete 
}: DoItNowModalProps) => {
  const [timerState, setTimerState] = useState<'ready' | 'running' | 'paused' | 'completed'>('ready');
  const [timeRemaining, setTimeRemaining] = useState(timeSelected * 60);
  const [note, setNote] = useState('');
  const [showBreathPacer, setShowBreathPacer] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalTime = timeSelected * 60;

  // Reset timer when timeSelected changes
  useEffect(() => {
    setTimeRemaining(timeSelected * 60);
    setTimerState('ready');
  }, [timeSelected]);

  // Timer logic
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerState('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

  const startTimer = () => {
    setTimerState('running');
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const resetTimer = () => {
    setTimerState('ready');
    setTimeRemaining(originalTime);
  };

  const completeChallenge = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onComplete(note.trim() || undefined);
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((originalTime - timeRemaining) / originalTime) * 100;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      energy: 'bg-green-500',
      mindset: 'bg-purple-500',
      focus: 'bg-blue-500',
      relationships: 'bg-pink-500',
      home: 'bg-orange-500',
      finance: 'bg-emerald-500',
      creativity: 'bg-yellow-500',
      recovery: 'bg-indigo-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  // Breathing pacer animation
  const BreathPacer = () => {
    const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    
    useEffect(() => {
      if (!showBreathPacer) return;
      
      const cycle = () => {
        // 4-4-4 breathing pattern (4 sec inhale, 4 sec hold, 4 sec exhale)
        setBreathPhase('inhale');
        setTimeout(() => setBreathPhase('hold'), 4000);
        setTimeout(() => setBreathPhase('exhale'), 8000);
      };
      
      cycle();
      const interval = setInterval(cycle, 12000);
      
      return () => clearInterval(interval);
    }, [showBreathPacer]);

    if (!showBreathPacer) return null;

    return (
      <div className="flex flex-col items-center space-y-4 py-8">
        <div className="relative">
          <div 
            className={`w-24 h-24 rounded-full border-4 border-primary/20 transition-all duration-4000 ease-in-out ${
              breathPhase === 'inhale' ? 'scale-110 border-success' :
              breathPhase === 'hold' ? 'scale-110 border-warning' :
              'scale-90 border-primary'
            }`}
            style={{
              background: `radial-gradient(circle, ${
                breathPhase === 'inhale' ? 'rgba(56, 161, 105, 0.2)' :
                breathPhase === 'hold' ? 'rgba(251, 191, 36, 0.2)' :
                'rgba(255, 120, 73, 0.2)'
              }, transparent)`
            }}
          />
          <Wind className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <div className="text-lg font-medium capitalize">{breathPhase}</div>
          <div className="text-sm text-muted-foreground">
            {breathPhase === 'inhale' ? 'Breathe in slowly...' :
             breathPhase === 'hold' ? 'Hold gently...' :
             'Release slowly...'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Focus className="h-5 w-5 text-primary" />
            Time for Your 1%
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-1 h-full ${getCategoryColor(challenge.category)} rounded-full`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {challenge.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {timeSelected}m
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  
                  {challenge.benefit && (
                    <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-success mt-0.5" />
                        <p className="text-sm">
                          <span className="font-medium text-success">Why this works:</span> {challenge.benefit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="text-6xl font-bold font-mono text-primary">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {timerState === 'completed' ? 'Time\'s up!' : 
                 timerState === 'running' ? 'Focus time' :
                 timerState === 'paused' ? 'Paused' : 'Ready to start'}
              </div>
            </div>
            
            <Progress 
              value={getProgress()} 
              className="w-full h-3"
            />
          </div>

          {/* Breathing Pacer */}
          {(timerState === 'running' || timerState === 'paused') && showBreathPacer && (
            <BreathPacer />
          )}

          {/* Timer Controls */}
          <div className="flex justify-center gap-3">
            {timerState === 'ready' && (
              <Button onClick={startTimer} className="btn-hero">
                <Play className="h-4 w-4 mr-2" />
                Start Focus Session
              </Button>
            )}
            
            {timerState === 'running' && (
              <>
                <Button onClick={pauseTimer} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  onClick={() => setShowBreathPacer(!showBreathPacer)} 
                  variant="ghost"
                  size="sm"
                >
                  <Wind className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {timerState === 'paused' && (
              <>
                <Button onClick={startTimer} variant="default">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button onClick={resetTimer} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
            
            {timerState === 'completed' && (
              <div className="text-center space-y-3">
                <div className="text-success">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <div className="font-semibold">Great work!</div>
                  <div className="text-sm text-muted-foreground">You've completed your 1% for today</div>
                </div>
              </div>
            )}
          </div>

          {/* Early Completion Option */}
          {(timerState === 'running' || timerState === 'paused') && (
            <div className="text-center">
              <Button 
                onClick={() => setTimerState('completed')} 
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Complete Early
              </Button>
            </div>
          )}

          {/* Completion Note */}
          {(timerState === 'completed' || getProgress() > 50) && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                How did it go? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                placeholder="Jot down a quick reflection..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Complete Button */}
          {timerState === 'completed' && (
            <Button onClick={completeChallenge} className="btn-hero w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Challenge
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoItNowModal;