import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddNoteModalProps {
  children: React.ReactNode;
}

const AddNoteModal = ({ children }: AddNoteModalProps) => {
  const [note, setNote] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSaveNote = async () => {
    if (!note.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      // Always create a note entry (not a challenge)
      await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          is_custom: true,
          custom_title: "Note",
          custom_description: note,
          custom_category: "Note",
          status: 'note',
          completion_date: new Date().toISOString(),
          created_by: 'note',
          notes: note
        });

      toast({
        title: "Note saved!",
        description: "Your note has been added to your history.",
      });

      setNote("");
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save note:', error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <StickyNote className="h-5 w-5 mr-2" />
            Add a Daily Note
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="note">How was your day? Any insights or reflections?</Label>
            <Textarea
              id="note"
              placeholder="Reflect on your progress, challenges, or wins from today..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNote} 
              disabled={!note.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;