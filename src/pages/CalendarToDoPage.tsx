import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  CheckCircle2,
  ListChecks,
} from "lucide-react";

/* ---------- timezone-safe date helpers (LOCAL) ---------- */
const fmtLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const monIndex = (d: Date) => (d.getDay() + 6) % 7; // Monday=0

/** Always returns 6 full weeks (42 cells) starting on Monday */
function daysInGrid(monthAnchor: Date) {
  const start = startOfMonth(monthAnchor);
  const end = endOfMonth(monthAnchor);

  const gridStart = addDays(start, -monIndex(start));
  const days: Date[] = [];
  let cur = new Date(gridStart);

  while (days.length < 42) {
    days.push(new Date(cur));
    cur = addDays(cur, 1);
  }
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

  const monthStartISO = fmtLocalDate(month);
  const monthEndPlus1ISO = fmtLocalDate(addDays(endOfMonth(month), 1));
  const selKey = fmtLocalDate(selected);
  const todayKey = fmtLocalDate(new Date());

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
    },
  });

  /* ---- fetch completed challenges for month ---- */
  const { data: monthCompletions = [] } = useQuery({
    queryKey: ["month-completions", user?.id, monthStartISO],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_challenges")
        .select(
          "id, completion_date, notes, custom_title, custom_time_minutes, challenges(title, estimated_minutes)"
        )
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .gte("completion_date", monthStartISO)
        .lt("completion_date", monthEndPlus1ISO);
      if (error) throw error;
      return data || [];
    },
  });

  /* ---- activity map for small counters in cells ---- */
  const activity = useMemo(() => {
    const map: Record<
      string,
      { todos: number; doneTodos: number; completedChallenges: number }
    > = {};
    for (const t of todos as any[]) {
      const k = t.due_date;
      if (!map[k]) map[k] = { todos: 0, doneTodos: 0, completedChallenges: 0 };
      map[k].todos++;
      if (t.is_done) map[k].doneTodos++;
    }
    for (const c of monthCompletions as any[]) {
      const k = fmtLocalDate(new Date(c.completion_date));
      if (!map[k]) map[k] = { todos: 0, doneTodos: 0, completedChallenges: 0 };
      map[k].completedChallenges++;
    }
    return map;
  }, [todos, monthCompletions]);

  /* ---- derived lists for selected day ---- */
  const dayTodos = useMemo(
    () => (todos as any[]).filter((t) => t.due_date === selKey),
    [todos, selKey]
  );
  const dayCompletions = useMemo(
    () =>
      (monthCompletions as any[]).filter(
        (c) => fmtLocalDate(new Date(c.completion_date)) === selKey
      ),
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
        due_date: selKey,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewTitle("");
      setNewNotes("");
      await qc.invalidateQueries({ queryKey: ["todos", user?.id] });
      toast({ title: "Added", description: "To-do added to this day." });
    },
    onError: (e: any) =>
      toast({
        variant: "destructive",
        title: "Couldn’t add",
        description: e.message,
      }),
  });

  const toggleTodo = useMutation({
    mutationFn: async (t: any) => {
      const next = !t.is_done;
      const { error } = await supabase
        .from("todos")
        .update({
          is_done: next,
          completed_at: next ? new Date().toISOString() : null,
        })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["todos", user?.id] });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["todos", user?.id] });
    },
  });

  /* ---- UI ---- */
  const grid = daysInGrid(month);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl md:text-4xl">Calendar & To-Do</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center font-medium">
            {month.toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const t = new Date();
              setMonth(startOfMonth(t));
              setSelected(t);
            }}
          >
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
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="p-2 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d, i) => {
                const k = fmtLocalDate(d);
                const inThisMonth = d.getMonth() === month.getMonth();
                const isSelected = k === selKey;
                const act = activity[k];

                return (
                  <button
                    key={k + "_" + i}
                    onClick={() => setSelected(d)}
                    className={[
                      "h-20 rounded-md border transition text-left",
                      isSelected
                        ? "border-primary ring-1 ring-primary bg-primary/5"
                        : "border-border",
                      inThisMonth ? "" : "opacity-40",
                      "hover:bg-accent/30",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between px-2 pt-2 text-xs">
                      <span
                        className={[
                          "inline-flex h-6 w-6 items-center justify-center rounded-full",
                          k === todayKey
                            ? "font-semibold bg-primary/10"
                            : "",
                        ].join(" ")}
                      >
                        {d.getDate()}
                      </span>

                      {!!act && (
                        <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {act.completedChallenges > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {act.completedChallenges}
                            </span>
                          )}
                          {act.doneTodos > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <ListChecks className="h-3 w-3" />
                              {act.doneTodos}
                            </span>
                          )}
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
                {selected.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
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
                  <Button
                    onClick={() => addTodo.mutate()}
                    disabled={!newTitle.trim()}
                  >
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
                {dayTodos.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No to-dos yet.
                  </div>
                )}
                <ul className="space-y-2">
                  {dayTodos.map((t: any) => (
                    <li
                      key={t.id}
                      className="flex items-start justify-between gap-2 p-2 rounded-md border"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleTodo.mutate(t)}
                          className={`mt-1 h-5 w-5 rounded border flex items-center justify-center ${
                            t.is_done
                              ? "bg-success/20 border-success"
                              : "border-border"
                          }`}
                          title="Toggle done"
                        >
                          {t.is_done && <Check className="h-4 w-4" />}
                        </button>
                        <div>
                          <div
                            className={
                              t.is_done
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {t.title}
                          </div>
                          {t.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {t.notes}
                            </div>
                          )}
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
                {dayCompletions.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    None completed.
                  </div>
                )}
                <ul className="space-y-2">
                  {dayCompletions.map((c: any) => {
                    const title =
                      c.custom_title || c.challenges?.title || "Challenge";
                    const mins =
                      c.custom_time_minutes ||
                      c.challenges?.estimated_minutes ||
                      0;
                    return (
                      <li key={c.id} className="p-2 rounded-md border">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <div className="font-medium">
                            {title}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({mins}m)
                            </span>
                          </div>
                        </div>
                        {c.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Note: {c.notes}
                          </div>
                        )}
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
