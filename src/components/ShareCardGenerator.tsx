import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Sparkles, Flame, Trophy, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgressData } from "@/hooks/useProgressData";
import { toast } from "sonner";

interface ShareCardGeneratorProps {
  type?: 'daily' | 'weekly' | 'milestone';
  challengeTitle?: string;
  category?: string;
  onClose?: () => void;
}

const ShareCardGenerator = ({ type = 'daily', challengeTitle, category, onClose }: ShareCardGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { streak, totalChallenges, completionRate, currentDay } = useProgressData();

  const generateShareCard = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for social media (1080x1080)
    canvas.width = 1080;
    canvas.height = 1080;

    try {
      // Background gradient using the new color scheme
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#10B981'); // sprout
      gradient.addColorStop(1, '#5B8DEF'); // calm
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(250, 250, 247, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Main content area
      ctx.fillStyle = '#FAFAF7'; // paper
      ctx.roundRect(60, 150, canvas.width - 120, canvas.height - 300, 20);
      ctx.fill();

      // Header section
      ctx.fillStyle = '#111827'; // ink
      ctx.font = 'bold 72px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      
      if (type === 'daily') {
        const dayText = currentDay > 0 ? `Day ${currentDay}` : 'Demo Day 1';
        ctx.fillText(dayText, canvas.width / 2, 280);
        ctx.font = '48px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#9CA3AF'; // muted
        ctx.fillText('1% Better Today', canvas.width / 2, 340);
      } else if (type === 'weekly') {
        ctx.fillText('Week Complete', canvas.width / 2, 280);
        ctx.font = '48px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText(`${completionRate}% Success Rate`, canvas.width / 2, 340);
      } else if (type === 'milestone') {
        ctx.fillText('Milestone!', canvas.width / 2, 280);
        ctx.font = '48px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText(`${streak?.current_streak} Day Streak`, canvas.width / 2, 340);
      }

      // Challenge info (for daily cards)
      if (type === 'daily' && challengeTitle) {
        ctx.font = 'bold 36px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#111827'; // ink
        ctx.fillText(challengeTitle, canvas.width / 2, 450);
        
        if (category) {
          ctx.font = '32px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillStyle = '#10B981'; // sprout
          ctx.fillText(category.toUpperCase(), canvas.width / 2, 500);
        }
      }

      // Stats section
      const statY = type === 'daily' ? 600 : 450;
      
      // Streak or demo indicator
      ctx.font = 'bold 64px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#10B981'; // sprout
      const streakValue = currentDay > 0 ? (streak?.current_streak || 0) : 1;
      ctx.fillText(`${streakValue}`, canvas.width / 2, statY);
      ctx.font = '36px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9CA3AF'; // muted
      const streakLabel = currentDay > 0 ? 'Day Streak' : 'Demo Complete';
      ctx.fillText(streakLabel, canvas.width / 2, statY + 50);

      // Total challenges (smaller text)
      if (type !== 'daily' && currentDay > 0) {
        ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText(`${totalChallenges} Challenges Completed`, canvas.width / 2, statY + 120);
      }

      // Footer
      ctx.font = 'bold 32px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#10B981'; // sprout
      ctx.fillText('#LoopedLife', canvas.width / 2, canvas.height - 180);
      
      ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9CA3AF'; // muted
      ctx.fillText('1% better every day', canvas.width / 2, canvas.height - 140);

      // User name or demo indicator
      const userName = user?.user_metadata?.full_name?.split(' ')[0];
      const footerText = currentDay > 0 && userName ? `${userName}'s Progress` : 'Try Looped Today';
      ctx.font = '24px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(footerText, canvas.width / 2, canvas.height - 100);

      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating share card:', error);
      toast.error('Failed to generate share card');
      setIsGenerating(false);
    }
  };

  const downloadCard = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `looped-${type}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    toast.success('Share card downloaded!');
  };

  const shareCard = async () => {
    if (!canvasRef.current) return;
    
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `looped-${type}.png`, { type: 'image/png' });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Looped Progress',
              text: '1% better every day!'
            });
          } else {
            // Fallback to copying image data
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Share card copied to clipboard!');
          }
        }
      });
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Unable to share. Try downloading instead.');
    }
  };

  const copyLink = () => {
    const text = `Just completed day ${currentDay} of my 1% improvement journey! Current streak: ${streak?.current_streak} days. #LoopedLife`;
    navigator.clipboard.writeText(text);
    toast.success('Caption copied!');
  };

  useEffect(() => {
    generateShareCard();
  }, [type, challengeTitle, category, currentDay, streak]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Share Your Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            Show the world your 1% improvement journey
          </p>
        </div>

        {/* Canvas Preview */}
        <div className="bg-gradient-to-br from-primary/10 to-success/10 rounded-lg p-4 flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-border/20 rounded-lg shadow-soft"
              style={{ width: '200px', height: '200px' }}
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Card Type Selector */}
        <div className="flex gap-2">
          {['daily', 'weekly', 'milestone'].map((cardType) => (
            <Button
              key={cardType}
              variant={type === cardType ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (type !== cardType) {
                  // This would trigger a re-render with the new type
                  generateShareCard();
                }
              }}
              className="flex-1 text-xs"
            >
              {cardType === 'daily' && <Target className="h-3 w-3 mr-1" />}
              {cardType === 'weekly' && <Trophy className="h-3 w-3 mr-1" />}
              {cardType === 'milestone' && <Flame className="h-3 w-3 mr-1" />}
              {cardType.charAt(0).toUpperCase() + cardType.slice(1)}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={downloadCard} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={shareCard} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Copy Caption */}
        <Button 
          onClick={copyLink} 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy Caption
        </Button>

        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm" className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Helper to add rounded rectangle support to canvas
declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, width: number, height: number, radius: number): void;
  }
}

if (typeof CanvasRenderingContext2D !== 'undefined') {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

export default ShareCardGenerator;