import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Save, Calendar } from "lucide-react";

/* local date helpers */
const fmtLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<Date>(() => new Date());
  const [content, setContent] = useState("");
  const selKey = fmtLocalDate(selected);

  const { data: entry } = useQuery({
    queryKey: ["journal", user?.id, selKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("entry_date", selKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Update content when entry changes
  useEffect(() => {
    if (entry?.content !== undefined) {
      setContent(entry.content || "");
    } else {
      setContent("");
    }
  }, [entry]);

  const saveEntry = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("journal_entries")
        .upsert({
          user_id: user.id,
          entry_date: selKey,
          content: content.trim(),
        });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["journal", user?.id, selKey] });
      toast({ title: "Saved", description: "Journal entry saved successfully." });
    },
    onError: (e: any) =>
      toast({ variant: "destructive", title: "Save failed", description: e.message }),
  });

  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Journal
        </h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelected(addDays(selected, -1))}
            size="sm"
          >
            Previous Day
          </Button>
          <span className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {selected.toLocaleDateString()}
          </span>
          <Button
            variant="outline"
            onClick={() => setSelected(addDays(selected, 1))}
            size="sm"
          >
            Next Day
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            How was your day on {selected.toLocaleDateString()}?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your thoughts, experiences, goals, or anything on your mind..."
            className="min-h-[400px] resize-none"
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {content.length} characters
            </div>
            <Button
              onClick={() => saveEntry.mutate()}
              disabled={saveEntry.isPending || !content.trim()}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saveEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}