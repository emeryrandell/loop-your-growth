import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CreateChallengeModalProps {
  children: React.ReactNode;
}

const CreateChallengeModal = ({ children }: CreateChallengeModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "mindset",
    timeMinutes: 15
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories = [
    { id: 'energy', label: 'Energy & Movement' },
    { id: 'mindset', label: 'Mindset' },
    { id: 'focus', label: 'Focus & Productivity' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'home', label: 'Home & Environment' },
    { id: 'finance', label: 'Finance' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'recovery', label: 'Recovery & Sleep' }
  ];

  const handleSaveChallenge = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          is_custom: true,
          custom_title: formData.title,
          custom_description: formData.description,
          custom_category: formData.category,
          custom_time_minutes: formData.timeMinutes,
          status: 'pending',
          created_by: 'user',
          scheduled_date: new Date().toISOString().split('T')[0]
        });

      toast({
        title: "Challenge created!",
        description: "Your custom challenge has been added to your queue.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "mindset",
        timeMinutes: 15
      });
      setIsOpen(false);

      // Refresh challenge queries
      queryClient.invalidateQueries({ queryKey: ['today-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['in-progress-challenges'] });
    } catch (error) {
      console.error('Failed to create challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive"
      });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Your Own Challenge
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Challenge Title</Label>
            <Input
              id="title"
              placeholder="e.g., 10-minute meditation"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you'll do and why it helps..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="capitalize">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="time">Time Needed (minutes)</Label>
            <div className="mt-2">
              <Slider
                value={[formData.timeMinutes]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timeMinutes: value[0] }))}
                max={60}
                min={5}
                step={5}
                className="mb-2"
              />
              <div className="text-sm text-muted-foreground text-center">
                {formData.timeMinutes} minutes
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChallenge} 
              disabled={!formData.title.trim() || !formData.description.trim() || isSaving}
            >
              {isSaving ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeModal;