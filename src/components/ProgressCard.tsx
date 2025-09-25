import { Download, Copy, Share2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressCardProps {
  day: number;
  streak: number;
  userName?: string;
}

const ProgressCard = ({ day, streak, userName = "Looper" }: ProgressCardProps) => {
  const handleDownload = async () => {
    try {
      const cardElement = document.querySelector('.progress-card');
      if (!cardElement) return;

      // Create a canvas from the card element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 320;
      canvas.height = 400;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#059669');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add content
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Looped', canvas.width / 2, 60);
      
      ctx.font = '14px Arial';
      ctx.fillText('1% Better, Every Day', canvas.width / 2, 85);

      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Day ${day}`, canvas.width / 2, 160);

      ctx.font = '20px Arial';
      ctx.fillText(`Streak: ${streak} Days`, canvas.width / 2, 200);

      ctx.font = '14px Arial';
      ctx.fillText(`${userName} is building momentum`, canvas.width / 2, 280);

      ctx.font = '12px Arial';
      ctx.fillText('Join the movement at looped.app', canvas.width / 2, 320);

      // Download the image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `looped-day-${day}-progress.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const cardElement = document.querySelector('.progress-card');
      if (!cardElement) return;

      // Same canvas creation logic as download
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 320;
      canvas.height = 400;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#059669');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Looped', canvas.width / 2, 60);
      
      ctx.font = '14px Arial';
      ctx.fillText('1% Better, Every Day', canvas.width / 2, 85);

      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Day ${day}`, canvas.width / 2, 160);

      ctx.font = '20px Arial';
      ctx.fillText(`Streak: ${streak} Days`, canvas.width / 2, 200);

      ctx.font = '14px Arial';
      ctx.fillText(`${userName} is building momentum`, canvas.width / 2, 280);

      ctx.font = '12px Arial';
      ctx.fillText('Join the movement at looped.app', canvas.width / 2, 320);

      // Copy to clipboard
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        }
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Day ${day} Complete!`,
          text: `Just completed day ${day} of my 1% journey! Current streak: ${streak} days. ${userName} is building momentum!`,
          url: 'https://looped.app'
        });
      } else {
        // Fallback: copy text to clipboard
        const shareText = `Just completed day ${day} of my 1% journey! Current streak: ${streak} days. ${userName} is building momentum! Join me at https://looped.app`;
        await navigator.clipboard.writeText(shareText);
        alert('Share text copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Card Preview */}
      <div className="flex justify-center">
        <div className="progress-card w-80 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 border border-success-foreground/30 rounded-full" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border border-success-foreground/30 rounded-full" />
          </div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold mb-2">Looped</h3>
              <p className="text-success-foreground/80 text-sm">1% Better, Every Day</p>
            </div>
            
            <div className="mb-6">
              <div className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                Day {day} <Trophy className="h-8 w-8 text-accent" />
              </div>
              <div className="text-xl">Streak: {streak} Days</div>
            </div>
            
            <div className="border-t border-success-foreground/20 pt-4">
              <p className="text-success-foreground/80 text-sm">
                {userName} is building momentum
              </p>
              <p className="text-xs text-success-foreground/60 mt-1">
                Join the movement at looped.app
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleDownload} variant="outline" size="sm" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button onClick={handleCopyToClipboard} variant="outline" size="sm" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Share Progress
          </Button>
        </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Share your progress and inspire others to start their 1% journey!
        </p>
      </div>
    </div>
  );
};

export default ProgressCard;