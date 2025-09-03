import { Download, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressCardProps {
  day: number;
  streak: number;
  userName?: string;
}

const ProgressCard = ({ day, streak, userName = "Looper" }: ProgressCardProps) => {
  const handleDownload = () => {
    // TODO: Implement PNG download functionality
    console.log("Downloading progress card...");
  };

  const handleCopyToClipboard = () => {
    // TODO: Implement copy to clipboard functionality
    console.log("Copying to clipboard...");
  };

  const handleShare = () => {
    // TODO: Implement native share functionality
    console.log("Opening share menu...");
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
              <div className="text-4xl font-bold mb-2">Day {day} ✅</div>
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        
        <Button onClick={handleCopyToClipboard} variant="outline" className="flex-1 sm:flex-none">
          <Copy className="h-4 w-4 mr-2" />
          Copy to Clipboard
        </Button>
        
        <Button onClick={handleShare} className="btn-hero flex-1 sm:flex-none">
          <Share2 className="h-4 w-4 mr-2" />
          Share
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