import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";

/* ---------- tiny date helpers ---------- */
const toKey = (d: Date) => d.toISOString().slice(0,10);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth()+1, 0);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

function daysInGrid(month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const firstWd = (start.getDay() + 6) % 7; // make Monday=0
  const days: Date[] = [];
  for (let i = 0; i < firstWd; i++) days.push(addDays(start, i - firstWd));
  for (let d = 1; d <= end.getDate(); d++) days.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (days.length % 7 !== 0) days.push(addDays(end, days.length % 7 === 0 ? 0 : (days.length % 7) * -1)); // pad end
  while (days.length < 42) days.push(addDays(days[days.length-1], 1)); // ensure 6 weeks grid
  return days;
}

/* ---------- page ---------- */
export default function CalendarTodoPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthStartISO = toKey(monthStart);
  const monthEndPlus1ISO = toKey(addDays(monthEnd, 1));

  /* ---- fetch todos for month ---- */
  const { data: todos = [] } = useQuery({
    queryKey: ["todos", user?.id, monthStartISO],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user!.id)
        .gte("due_date", monthStartISO)
        .lt("due_date", monthEndPlus1ISO)
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  /* ---- fetch completed challenges for month ---- */
  const { data: monthCompletions = [] } = useQuery({
    queryKey: ["month-completions", user?.id, monthStartISO],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_challenges")
        .select("id, completion_date, notes, custom_title, custom_time_minutes, challenges(title, estimated_minutes)")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .gte("completion_date", monthStartISO)
        .lt("completion_date", monthEndPlus1ISO);
      if (error) throw error;
      return data || [];
    }
  });

  /* ---- derived maps for calendar dots ---- */
  const activity = useMemo(() => {
    const map: Record<string, { todos: number; doneTodos: number; completedChallenges: number }> = {};
    for (const t of todos) {
      const k = t.due_date;
      if (!map[k]) map[k] = { todos: 0, doneTodos: 0, completedChallenges: 0 };
      map[k].todos++;
      if (t.is_done) map[k].doneTodos++;
    }
    for (const c of monthCompletions) {
      const k = toKey(new Date(c.completion_date));
      if (!map[k]) map[k] = { todos: 0, doneTodos: 0, completedChallenges: 0 };
      map[k].completedChallenges++;
    }
    return map;
  }, [todos, monthCompletions]);

  /* ---- selected-day derived lists ---- */
  const selKey = toKey(selected);
  const dayTodos = useMemo(() => todos.filter((t: any) => t.due_date === selKey), [todos, selKey]);
  const dayCompletions = useMemo(
    () => monthCompletions.filter((c: any) => toKey(new Date(c.completion_date)) === selKey),
    [monthCompletions, selKey]
  );

  /* ---- mutations ---- */
  const addTodo = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error("Title required");
      const { error } = await supabase.from("todos").insert({
        user_id: user!.id,
        title: newTitle.trim(),
        notes: newNotes.trim() || null,
        due_date: selKey
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewTitle(""); setNewNotes("");
      await qc.invalidateQueries({ queryKey: ["todos", user?.id] });
      toast({ title: "Added", description: "To-do added to this day." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Couldn’t add", description: e.message })
  });

  const toggleTodo = useMutation({
    mutationFn: async (t: any) => {
      const next = !t.is_done;
      const { error } = await supabase
        .from("todos")
        .update({ is_done: next, completed_at: next ? new Date().toISOString() : null })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["todos", user?.id] }); },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["todos", user?.id] }); },
  });

  /* ---- UI ---- */
  const grid = daysInGrid(month);
  const todayKey = toKey(new Date());

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl md:text-4xl">Calendar & To-Do</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMonth(startOfMonth(addDays(month, -1)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center font-medium">
            {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          <Button variant="outline" onClick={() => setMonth(startOfMonth(addDays(month, +31)))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => { const t = new Date(); setMonth(startOfMonth(t)); setSelected(t); }}>
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {/* Calendar grid */}
        <Card className="md:col-span-4 card-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                <div key={d} className="p-2 text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d, i) => {
                const k = toKey(d);
                const isOther = d.getMonth() !== month.getMonth();
                const isSelected = k === selKey;
                const act = activity[k];
                return (
                  <button
                    key={k + i}
                    onClick={() => setSelected(d)}
                    className={[
                      "h-20 rounded-md border transition",
                      isSelected ? "border-primary ring-1 ring-primary" : "border-border",
                      isOther ? "opacity-40" : "",
                      "hover:bg-accent/30"
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between px-2 pt-2 text-xs">
                      <span className={k === todayKey ? "font-semibold" : ""}>{d.getDate()}</span>
                      {!!act && (
                        <span className="text-[10px] text-muted-foreground">
                          {act.completedChallenges > 0 && <span className="mr-1">✅{act.completedChallenges}</span>}
                          {act.doneTodos > 0 && <span>☑️{act.doneTodos}</span>}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day panel */}
        <div className="md:col-span-3 space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-lg">
                {selected.toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add To-Do */}
              <div className="space-y-2">
                <Label>Add a to-do</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="What will you do?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <Button onClick={() => addTodo.mutate()} disabled={!newTitle.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <Textarea
                  placeholder="Notes (optional)"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* To-Do list */}
              <div className="space-y-2">
                <div className="font-medium">To-Dos</div>
                {dayTodos.length === 0 && <div className="text-sm text-muted-foreground">No to-dos yet.</div>}
                <ul className="space-y-2">
                  {dayTodos.map((t: any) => (
                    <li key={t.id} className="flex items-start justify-between gap-2 p-2 rounded-md border">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleTodo.mutate(t)}
                          className={`mt-1 h-5 w-5 rounded border flex items-center justify-center ${
                            t.is_done ? "bg-success/20 border-success" : "border-border"
                          }`}
                          title="Toggle done"
                        >
                          {t.is_done && <Check className="h-4 w-4" />}
                        </button>
                        <div>
                          <div className={t.is_done ? "line-through text-muted-foreground" : ""}>{t.title}</div>
                          {t.notes && <div className="text-xs text-muted-foreground mt-1">{t.notes}</div>}
                        </div>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTodo.mutate(t.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Completed challenges */}
              <div className="space-y-2">
                <div className="font-medium">Completed challenges</div>
                {dayCompletions.length === 0 && <div className="text-sm text-muted-foreground">None completed.</div>}
                <ul className="space-y-2">
                  {dayCompletions.map((c: any) => {
                    const title = c.custom_title || c.challenges?.title || "Challenge";
                    const mins = c.custom_time_minutes || c.challenges?.estimated_minutes || 0;
                    return (
                      <li key={c.id} className="p-2 rounded-md border">
                        <div className="font-medium">✅ {title} <span className="text-xs text-muted-foreground">({mins}m)</span></div>
                        {c.notes && <div className="text-xs text-muted-foreground mt-1">Note: {c.notes}</div>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
