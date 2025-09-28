import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock3, Trash2, Plus } from "lucide-react";

/* local date helpers (no UTC weirdness) */
const fmtLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

export default function DailyPlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<Date>(() => new Date());
  const selKey = fmtLocalDate(selected);

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [notes, setNotes] = useState("");

  const { data: blocks = [] } = useQuery({
    queryKey: ["planner", user?.id, selKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("p_date", selKey)
        .order("start_minutes", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const addBlock = useMutation({
    mutationFn: async () => {
      const s = toMinutes(start);
      const e = toMinutes(end);
      if (!title.trim()) throw new Error("Title required");
      if (s == null || e == null) throw new Error("Invalid time");
      if (e <= s) throw new Error("End must be after start");

      const { error } = await supabase.from("planner_entries").insert({
        user_id: user!.id,
        p_date: selKey,
        title: title.trim(),
        start_minutes: s,
        end_minutes: e,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle(""); setNotes("");
      await qc.invalidateQueries({ queryKey: ["planner", user?.id, selKey] });
      toast({ title: "Added", description: "Block added to your day." });
    },
    onError: (e: any) =>
      toast({ variant: "destructive", title: "Couldn’t add", description: e.message }),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planner_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["planner", user?.id, selKey] });
    },
  });

  const totalMinutes = useMemo(
    () => blocks.reduce((sum: number, b: any) => sum + (b.end_minutes - b.start_minutes), 0),
    [blocks]
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h
