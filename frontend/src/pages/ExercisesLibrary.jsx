import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Library } from "lucide-react";

const CATEGORIES = [
  "MAT_PILATES", "REFORMER", "CORE", "FLEXIBILITY", "BALANCE",
  "STRENGTH", "CARDIO", "WARMUP", "COOLDOWN",
];
const DIFFICULTY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function ExercisesLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [diff, setDiff] = useState("ALL");
  const [open, setOpen] = useState(false);

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
          <p className="mt-2 text-muted-foreground max-w-xl text-sm">
            Approved exercises power your AI class generator. Add studio-specific moves anytime.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => setOpen(true)} data-testid="exercises-add-button">
          <Plus className="size-4 mr-1" /> Add exercise
        </Button>
      </header>

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
            <div key={ex.id} className="tactile-card" data-testid={`exercise-card-${ex.id}`}>
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
            </div>
          ))}
        </div>
      )}

      <AddExerciseDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
    </div>
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
    } catch (err) {
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
                  {["MAT_PILATES", "REFORMER", "CORE", "FLEXIBILITY", "BALANCE", "STRENGTH", "CARDIO", "WARMUP", "COOLDOWN"].map((c) => (
                    <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={set("difficulty")}>
                <SelectTrigger data-testid="add-exercise-difficulty-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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
