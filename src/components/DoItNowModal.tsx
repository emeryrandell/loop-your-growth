import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";

interface Challenge {
  id: string;
  title?: string;
  description?: string;
  difficulty?: number;
  category?: string;
  estimated_minutes?: number;
  challenge_id?: string;
  benefit?: string;
  status?: string;
  user_challenge_id?: string;
  is_custom?: boolean;
  created_by?: string;
}

interface DoItNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge?: Challenge;
  timeSelected?: number;
  onComplete?: (note?: string) => void;
  onSnooze?: () => void;
}

const DoItNowModal = ({ open, onOpenChange, challenge, timeSelected, onComplete, onSnooze }: DoItNowModalProps) => {
  if (!challenge) return null;

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return "bg-muted";
    if (difficulty <= 2) return "bg-green-500";
    if (difficulty <= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ready to Take Action?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">{challenge.title}</h3>
            {challenge.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {challenge.description}
              </p>
            )}
            
            <div className="flex items-center gap-2">
              {challenge.difficulty && (
                <Badge 
                  variant="secondary" 
                  className={`text-white ${getDifficultyColor(challenge.difficulty)}`}
                >
                  Difficulty: {challenge.difficulty}/5
                </Badge>
              )}
              
              {challenge.estimated_minutes && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {challenge.estimated_minutes} min
                </Badge>
              )}
              
              {challenge.category && (
                <Badge variant="secondary">
                  {challenge.category}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onComplete?.()}
              className="flex-1"
            >
              Complete Challenge
            </Button>
            
            <Button 
              variant="outline"
              onClick={onSnooze}
              className="flex-1"
            >
              Snooze for Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoItNowModal;