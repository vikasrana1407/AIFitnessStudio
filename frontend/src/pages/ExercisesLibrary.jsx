/**
 * Exercise library — clickable cards open a detail Sheet with full instructions,
 * safety notes, and an "About the library" explainer.
 */
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Library, Info, ShieldAlert, ListChecks } from "lucide-react";

const CATEGORIES = [
  "MAT_PILATES", "REFORMER", "CORE", "FLEXIBILITY", "BALANCE",
  "STRENGTH", "CARDIO", "WARMUP", "COOLDOWN",
];
const DIFFICULTY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function ExercisesLibrary() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [diff, setDiff] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (cat !== "ALL") params.category = cat;
    if (diff !== "ALL") params.difficulty = diff;
    const { data } = await api.get("/exercises/", { params });
    setItems(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, cat, diff]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-2">Movement</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Exercise library</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-sm">
            Approved exercises power your AI class generator. Add studio-specific moves anytime.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setOpen(true)} data-testid="exercises-add-button">
          <Plus className="size-4 mr-1" /> Add exercise
        </Button>
      </header>

      <div className="tactile-card bg-muted/40">
        <div className="flex items-start gap-4">
          <div className="size-10 shrink-0 rounded-md bg-primary/10 text-primary grid place-items-center">
            <Info className="size-5" />
          </div>
          <div className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground font-semibold">Why a library?</span> The AI class generator
            chooses movements <em>only</em> from approved exercises — never inventing unsafe ones. Each
            entry carries instructions, safety notes, and difficulty so the resulting script always
            matches your studio's standard. Click any card to see the full details.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" className="pl-9" data-testid="exercises-search-input" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48" data-testid="exercises-category-trigger"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={diff} onValueChange={setDiff}>
          <SelectTrigger className="w-44" data-testid="exercises-difficulty-trigger"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All levels</SelectItem>
            {DIFFICULTY.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="tactile-card text-center py-14 text-muted-foreground">
          <Library className="size-6 mx-auto mb-3 opacity-60" /> No exercises match these filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelected(ex)}
              className="tactile-card text-left hover:border-primary/40 transition-colors cursor-pointer"
              data-testid={`exercise-card-${ex.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-heading font-semibold">{ex.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{ex.category.replace("_", " ")} · {ex.difficulty}</div>
                </div>
                {ex.is_system && <Badge variant="secondary" className="rounded-full text-xs">System</Badge>}
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{ex.instructions}</p>
              {ex.muscle_groups?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ex.muscle_groups.slice(0, 4).map((m) => (
                    <span key={m} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{m}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <ExerciseSheet exercise={selected} onClose={() => setSelected(null)} />
      <AddExerciseDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
  );
}

function ExerciseSheet({ exercise, onClose }) {
  return (
    <Sheet open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg" data-testid="exercise-detail-sheet">
        {exercise && (
          <>
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl">{exercise.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="rounded-full">{exercise.category.replace("_", " ")}</Badge>
                <Badge variant="outline" className="rounded-full">{exercise.difficulty}</Badge>
                {exercise.is_system && <Badge variant="secondary" className="rounded-full">System library</Badge>}
                <span className="text-xs">~{exercise.duration_seconds}s</span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {exercise.muscle_groups?.length > 0 && (
                <div>
                  <div className="label-eyebrow mb-2">Target muscles</div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.muscle_groups.map((m) => (
                      <span key={m} className="text-xs uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="label-eyebrow mb-2 flex items-center gap-1"><ListChecks className="size-3" /> Instructions</div>
                <p className="text-sm leading-relaxed">{exercise.instructions}</p>
              </div>

              {exercise.safety_notes && (
                <div>
                  <div className="label-eyebrow mb-2 flex items-center gap-1"><ShieldAlert className="size-3" /> Safety notes</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{exercise.safety_notes}</p>
                </div>
              )}

              {exercise.demo_video_url && (
                <div>
                  <div className="label-eyebrow mb-2">Demo</div>
                  <a href={exercise.demo_video_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    Open demo video →
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AddExerciseDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", category: "CORE", difficulty: "BEGINNER",
    instructions: "", safety_notes: "", muscle_groups: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/exercises/", {
        ...form,
        muscle_groups: form.muscle_groups.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Exercise added");
      onCreated();
      onClose();
      setForm({ name: "", category: "CORE", difficulty: "BEGINNER", instructions: "", safety_notes: "", muscle_groups: "" });
    } catch {
      toast.error("Failed to add exercise");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="add-exercise-dialog">
        <DialogHeader>
          <DialogTitle>Add a studio exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} data-testid="add-exercise-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger data-testid="add-exercise-category-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={set("difficulty")}>
                <SelectTrigger data-testid="add-exercise-difficulty-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTY.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Muscle groups (comma-separated)</Label>
            <Input value={form.muscle_groups} onChange={(e) => set("muscle_groups")(e.target.value)} placeholder="core, glutes" data-testid="add-exercise-muscles-input" />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea rows={3} value={form.instructions} onChange={(e) => set("instructions")(e.target.value)} data-testid="add-exercise-instructions-input" />
          </div>
          <div className="space-y-2">
            <Label>Safety notes</Label>
            <Textarea rows={2} value={form.safety_notes} onChange={(e) => set("safety_notes")(e.target.value)} data-testid="add-exercise-safety-input" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !form.name || !form.instructions} data-testid="add-exercise-submit-button">
            {busy ? "Adding…" : "Add exercise"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
