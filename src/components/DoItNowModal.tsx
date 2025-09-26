import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Wind,
  Focus,
  Sparkles 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

type TimerState = 'ready' | 'running' | 'paused' | 'completed';

const APP_CATEGORIES = [
  "energy","mindset","focus","relationships","home","finance","creativity","recovery",
] as const;

interface ChallengeLike {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  estimated_minutes: number;
  benefit?: string;
}

interface DoItNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: ChallengeLike | null | undefined;
  timeSelected: number; // still supported for backwards compat
  onComplete: (note?: string) => void;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseDurationToMinutes(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  // hh:mm
  if (s.includes(":")) {
    const [h, m] = s.split(":");
    const hh = Number(h);
    const mm = Number(m);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    const total = hh * 60 + mm;
    return clamp(Math.round(total), 1, 1440);
  }
  // plain minutes
  const mins = Number(s);
  if (!Number.isFinite(mins)) return null;
  return clamp(Math.round(mins), 1, 1440);
}

const DoItNowModal = ({ 
  open, 
  onOpenChange, 
  challenge: incomingChallenge, 
  timeSelected, 
  onComplete 
}: DoItNowModalProps) => {
  // --- MODE: create vs play ---
  const isCreateModeInitial = !incomingChallenge;
  const [isCreateMode, setIsCreateMode] = useState(isCreateModeInitial);

  // local challenge when created inside the modal
  const [localChallenge, setLocalChallenge] = useState<ChallengeLike | null>(null);

  // unified challenge source
  const challenge = useMemo<ChallengeLike | null>(() => {
    if (localChallenge) return localChallenge;
    return incomingChallenge ?? null;
  }, [localChallenge, incomingChallenge]);

  // ---- Timer state ----
  // sessionMinutes is the single source for the timer length
  const initialMinutes = challenge?.estimated_minutes ?? timeSelected ?? 15;
  const [sessionMinutes, setSessionMinutes] = useState<number>(initialMinutes);
  const [timerState, setTimerState] = useState<TimerState>('ready');
  const [timeRemaining, setTimeRemaining] = useState<number>(initialMinutes * 60);
  const [note, setNote] = useState('');
  const [showBreathPacer, setShowBreathPacer] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // keep session minutes in sync when props change (or when we create a new one)
  useEffect(() => {
    const minutes = challenge?.estimated_minutes ?? timeSelected ?? 15;
    setSessionMinutes(minutes);
    setTimeRemaining(minutes * 60);
    setTimerState('ready');
  }, [challenge?.id, challenge?.estimated_minutes, timeSelected]);

  // Timer loop
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  const startTimer = () => setTimerState('running');
  const pauseTimer = () => setTimerState('paused');
  const resetTimer = () => {
    setTimerState('ready');
    setTimeRemaining(sessionMinutes * 60);
  };
  const completeChallenge = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onComplete(note.trim() || undefined);
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const progressValue = useMemo(() => {
    const total = Math.max(1, sessionMinutes * 60);
    return ((total - timeRemaining) / total) * 100;
  }, [sessionMinutes, timeRemaining]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string,string> = {
      energy: 'bg-success',
      mindset: 'bg-accent',
      focus: 'bg-secondary',
      relationships: 'bg-primary',
      home: 'bg-success',
      finance: 'bg-secondary',
      creativity: 'bg-accent',
      recovery: 'bg-primary',
    };
    return colors[category] || 'bg-muted';
  };

  // ---------- CREATE MODE UI STATE ----------
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState<(typeof APP_CATEGORIES)[number]>("mindset");
  const [durationInput, setDurationInput] = useState("15"); // accepts "20" or "0:20" or "1:15"
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  useEffect(() => {
    if (!isCreateMode) return;
    // Auto-suggest title/desc from goal
    if (!titleDraft && goal) {
      setTitleDraft(goal.length > 60 ? goal.slice(0, 57) + "..." : goal);
    }
    if (!descDraft && goal) {
      setDescDraft(`Spend focused time improving: ${goal}. Keep it simple and do what moves the needle.`);
    }
  }, [goal, isCreateMode]); // eslint-disable-line

  async function handleCreateChallenge() {
    const minutes = parseDurationToMinutes(durationInput);
    if (!minutes) {
      alert("Please enter a valid duration (e.g. 20 or 0:20 or 1:15).");
      return;
    }
    const safeMinutes = clamp(minutes, 1, 1440);

    const title = (titleDraft || goal || "Custom Challenge").trim();
    const description = (descDraft || `Work on: ${goal || "your chosen goal"}`).trim();
    const difficulty = 2;

    // Save to user_challenges as custom
    const { data, error } = await supabase
      .from("user_challenges")
      .insert({
        is_custom: true,
        created_by: "user",
        custom_title: title,
        custom_description: description,
        custom_category: category,
        custom_time_minutes: safeMinutes,
        status: "pending",
        // optional: scheduled for today by default
        scheduled_date: new Date().toISOString().slice(0, 10),
      })
      .select("*")
      .single();

    if (error) {
      console.error("create challenge error", error);
      alert("Could not create the challenge. Please try again.");
      return;
    }

    // Make a local challenge object the timer can run with immediately
    const created: ChallengeLike = {
      id: data.id,
      title,
      description,
      category,
      difficulty,
      estimated_minutes: safeMinutes,
    };

    setLocalChallenge(created);
    setIsCreateMode(false);
    setSessionMinutes(safeMinutes);
    setTimeRemaining(safeMinutes * 60);
    setTimerState('ready');
  }

  // Breathing pacer animation
  const BreathPacer = () => {
    const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    useEffect(() => {
      if (!showBreathPacer) return;
      const cycle = () => {
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
            className={`w-24 h-24 rounded-full border-4 border-primary/20 transition-all duration-1000 ease-in-out ${
              breathPhase === 'inhale' ? 'scale-110 border-success' :
              breathPhase === 'hold' ? 'scale-110 border-yellow-500' :
              'scale-90 border-primary'
            }`}
            style={{
              background: `radial-gradient(circle, ${
                breathPhase === 'inhale' ? 'rgba(56, 161, 105, 0.2)' :
                breathPhase === 'hold' ? 'rgba(251, 191, 36, 0.2)' :
                'rgba(59,130,246,0.15)'
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
            {isCreateMode ? "Create a New Challenge" : "Time for Your 1%"}
          </DialogTitle>
        </DialogHeader>

        {/* -------- CREATE MODE -------- */}
        {isCreateMode ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="goal">What do you want this challenge to improve?</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., improve focus on exam prep"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Pick a category</Label>
                  <select
                    id="category"
                    className="mt-1 w-full border rounded-md h-10 px-3 bg-background"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as typeof APP_CATEGORIES[number])}
                  >
                    {APP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="duration">How long? (mm or hh:mm)</Label>
                  <Input
                    id="duration"
                    placeholder="20  or  0:20  or  1:15"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Any length from 1 to 1440 minutes.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="Short title"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="desc">Description (optional)</Label>
                    <Textarea
                      id="desc"
                      placeholder="What specifically will you do?"
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="btn-hero flex-1" onClick={handleCreateChallenge}>
                    Create Challenge
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
        /* -------- TIMER / PLAY MODE -------- */
          <div className="space-y-6">
            {/* Challenge Info */}
            {challenge && (
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
                          {sessionMinutes}m
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
            )}

            {/* Timer Display */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="text-6xl font-bold font-mono text-primary">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {timerState === 'completed' ? "Time's up!" : 
                   timerState === 'running' ? 'Focus time' :
                   timerState === 'paused' ? 'Paused' : 'Ready to start'}
                </div>
              </div>
              <Progress value={progressValue} className="w-full h-3" />
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
            {(timerState === 'completed' || progressValue > 50) && (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DoItNowModal;
