/**
 * Exercise library — clickable cards (Sheet detail) + edit/delete actions.
 * Super admins can add/edit/delete SYSTEM exercises and any studio's exercises.
 * Studio owners can add/edit/delete their studio's exercises.
 */
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, Library, ShieldAlert, ListChecks, Pencil, Trash2 } from "lucide-react";

const CATEGORIES = [
  "MAT_PILATES", "REFORMER", "CORE", "FLEXIBILITY", "BALANCE",
  "STRENGTH", "CARDIO", "WARMUP", "COOLDOWN",
];
const DIFFICULTY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const empty = () => ({
  name: "", category: "CORE", difficulty: "BEGINNER",
  instructions: "", safety_notes: "", muscle_groups: "",
});

export default function ExercisesLibrary() {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [diff, setDiff] = useState("ALL");
  const [scope, setScope] = useState("ALL");
  const [editTarget, setEditTarget] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editScope, setEditScope] = useState("studio"); // for super admin "create" flow
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (cat !== "ALL") params.category = cat;
    if (diff !== "ALL") params.difficulty = diff;
    if (scope !== "ALL") params.scope = scope.toLowerCase();
    const { data } = await api.get("/exercises/", { params });
    setItems(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, cat, diff, scope]);

  const openCreate = (s = "studio") => {
    setEditTarget({ ...empty(), _isNew: true });
    setEditScope(s);
    setEditOpen(true);
  };

  const openEdit = (ex) => {
    setEditTarget({
      ...ex,
      muscle_groups: (ex.muscle_groups || []).join(", "),
      _isNew: false,
    });
    setEditScope(ex.is_system ? "system" : "studio");
    setEditOpen(true);
  };

  const canEdit = (ex) => isAdmin || (!ex.is_system && ex.studio === user?.studio?.id);
  const canDelete = canEdit;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/exercises/${deleteTarget.id}`);
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success("Exercise deleted");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-2">Movement</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Exercise library</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-sm">
            Approved exercises power your AI class generator. The system library is shared across all studios.
            Click any card to see the full details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="outline" className="rounded-full" onClick={() => openCreate("system")} data-testid="exercises-add-system-button">
              <Plus className="size-4 mr-1" /> Add system exercise
            </Button>
          )}
          {!isAdmin && (
            <Button className="rounded-full" onClick={() => openCreate("studio")} data-testid="exercises-add-button">
              <Plus className="size-4 mr-1" /> Add studio exercise
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" className="pl-9" data-testid="exercises-search-input" />
        </div>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-40" data-testid="exercises-scope-trigger"><SelectValue placeholder="Scope" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All scopes</SelectItem>
            <SelectItem value="SYSTEM">System only</SelectItem>
            <SelectItem value="STUDIO">Studio only</SelectItem>
          </SelectContent>
        </Select>
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
            <Card key={ex.id} ex={ex} canEdit={canEdit(ex)} canDelete={canDelete(ex)}
              onOpen={() => setDetail(ex)} onEdit={() => openEdit(ex)} onDelete={() => setDeleteTarget(ex)} />
          ))}
        </div>
      )}

      <ExerciseSheet exercise={detail} onClose={() => setDetail(null)}
        canEdit={detail ? canEdit(detail) : false}
        onEdit={() => { if (detail) { openEdit(detail); setDetail(null); } }} />

      <EditExerciseDialog
        target={editTarget}
        open={editOpen}
        scope={editScope}
        isAdmin={isAdmin}
        onClose={() => { setEditOpen(false); setEditTarget(null); }}
        onSaved={() => { load(); setEditOpen(false); setEditTarget(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="exercise-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.is_system
                ? "This is a system exercise — removing it affects every studio."
                : "This studio exercise will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="exercise-delete-confirm-button">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Card({ ex, canEdit, canDelete, onOpen, onEdit, onDelete }) {
  return (
    <div className="tactile-card group" data-testid={`exercise-card-${ex.id}`}>
      <button type="button" onClick={onOpen} className="block text-left w-full">
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
      {(canEdit || canDelete) && (
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={onEdit} data-testid={`exercise-edit-button-${ex.id}`}>
              <Pencil className="size-3 mr-1" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive" data-testid={`exercise-delete-button-${ex.id}`}>
              <Trash2 className="size-3 mr-1" /> Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseSheet({ exercise, onClose, canEdit, onEdit }) {
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
                {exercise.is_system && <Badge variant="secondary" className="rounded-full">System</Badge>}
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
              {canEdit && (
                <Button variant="outline" className="rounded-full" onClick={onEdit}>
                  <Pencil className="size-4 mr-1" /> Edit exercise
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditExerciseDialog({ target, open, scope, isAdmin, onClose, onSaved }) {
  const [form, setForm] = useState(empty());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      const { name, category, difficulty, instructions, safety_notes, muscle_groups, duration_seconds } = target;
      setForm({
        name: name || "",
        category: category || "CORE",
        difficulty: difficulty || "BEGINNER",
        instructions: instructions || "",
        safety_notes: safety_notes || "",
        muscle_groups: typeof muscle_groups === "string" ? muscle_groups : (muscle_groups || []).join(", "),
        duration_seconds: duration_seconds || 45,
      });
    }
  }, [target]);

  if (!target) return null;
  const isNew = target._isNew;
  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const submit = async () => {
    setBusy(true);
    const body = {
      ...form,
      muscle_groups: typeof form.muscle_groups === "string"
        ? form.muscle_groups.split(",").map((s) => s.trim()).filter(Boolean)
        : form.muscle_groups,
    };
    try {
      if (isNew) {
        const url = isAdmin && scope === "system" ? "/exercises/?scope=system" : "/exercises/";
        await api.post(url, body);
        toast.success("Exercise added");
      } else {
        await api.patch(`/exercises/${target.id}`, body);
        toast.success("Exercise updated");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="edit-exercise-dialog">
        <DialogHeader>
          <DialogTitle>
            {isNew
              ? (scope === "system" ? "Add system exercise" : "Add studio exercise")
              : `Edit ${target.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} data-testid="edit-exercise-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger data-testid="edit-exercise-category-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={set("difficulty")}>
                <SelectTrigger data-testid="edit-exercise-difficulty-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTY.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Muscle groups (comma-separated)</Label>
            <Input value={form.muscle_groups} onChange={(e) => set("muscle_groups")(e.target.value)} placeholder="core, glutes" data-testid="edit-exercise-muscles-input" />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea rows={3} value={form.instructions} onChange={(e) => set("instructions")(e.target.value)} data-testid="edit-exercise-instructions-input" />
          </div>
          <div className="space-y-2">
            <Label>Safety notes</Label>
            <Textarea rows={2} value={form.safety_notes} onChange={(e) => set("safety_notes")(e.target.value)} data-testid="edit-exercise-safety-input" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !form.name || !form.instructions} data-testid="edit-exercise-submit-button">
            {busy ? "Saving…" : (isNew ? "Add" : "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
