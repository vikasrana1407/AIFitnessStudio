/**
 * Classes list with tabs (All / In Progress / Ready) and per-card delete.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Sparkles, Search, Trash2, ExternalLink } from "lucide-react";
import { statusLabel, statusTone } from "@/lib/status";

const TAB_ALL = "all";
const TAB_PROGRESS = "in-progress";
const TAB_READY = "ready";

const READY = ["RENDERED"];
const PROGRESS = ["SCRIPTING", "SCRIPT_READY", "VOICING", "AVATAR_RENDERING", "RENDERING"];

export default function ClassesList() {
  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") || TAB_ALL;
  const [tab, setTab] = useState(initialTab);
  const [classes, setClasses] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/classes/").then((r) => {
      setClasses(r.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const setTabAndUrl = (t) => {
    setTab(t);
    if (t === TAB_ALL) setParams({});
    else setParams({ tab: t });
  };

  const filtered = useMemo(() => {
    let list = classes;
    if (tab === TAB_PROGRESS) list = list.filter((c) => PROGRESS.includes(c.status));
    if (tab === TAB_READY) list = list.filter((c) => READY.includes(c.status));
    if (q) list = list.filter(
      (c) => c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.prompt.toLowerCase().includes(q.toLowerCase())
    );
    return list;
  }, [classes, q, tab]);

  const counts = useMemo(() => ({
    all: classes.length,
    progress: classes.filter((c) => PROGRESS.includes(c.status)).length,
    ready: classes.filter((c) => READY.includes(c.status)).length,
  }), [classes]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/classes/${toDelete.id}`);
      setClasses((prev) => prev.filter((c) => c.id !== toDelete.id));
      toast.success("Class deleted");
    } catch {
      toast.error("Delete failed");
    }
    setToDelete(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-2">Classes</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">All classes</h1>
        </div>
        <Button asChild className="rounded-full" data-testid="classes-create-button">
          <Link to="/app/classes/new"><Sparkles className="size-4 mr-2" /> New class</Link>
        </Button>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={tab} onValueChange={setTabAndUrl} data-testid="classes-tabs">
          <TabsList>
            <TabsTrigger value={TAB_ALL} data-testid="tab-all">All <span className="ml-2 text-xs opacity-70">{counts.all}</span></TabsTrigger>
            <TabsTrigger value={TAB_PROGRESS} data-testid="tab-in-progress">In progress <span className="ml-2 text-xs opacity-70">{counts.progress}</span></TabsTrigger>
            <TabsTrigger value={TAB_READY} data-testid="tab-ready">Ready <span className="ml-2 text-xs opacity-70">{counts.ready}</span></TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-md w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search classes…" className="pl-9" data-testid="classes-search-input" />
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="tactile-card text-center py-14">
          <div className="font-heading font-semibold text-lg">No classes here</div>
          <p className="text-sm text-muted-foreground mt-2">
            {tab === TAB_READY ? "Render a class to see it here."
              : tab === TAB_PROGRESS ? "No classes currently being generated."
              : "Generate your first class to begin."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ClassCard key={c.id} c={c} onDelete={() => setToDelete(c)} />
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent data-testid="class-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="class-delete-confirm-button">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClassCard({ c, onDelete }) {
  return (
    <div className="tactile-card relative group" data-testid={`classes-card-${c.id}`}>
      <Link to={`/app/classes/${c.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-10">
            <div className="font-heading font-semibold truncate">{c.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {c.duration_minutes} min · {c.focus_area.replace("_", " ")} · {c.difficulty}
            </div>
          </div>
          <Badge variant={statusTone(c.status)} className="rounded-full shrink-0">{statusLabel(c.status)}</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.prompt}</p>
        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${c.progress_percent}%` }} />
        </div>
      </Link>
      <div className="mt-4 flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to={`/app/classes/${c.id}`} data-testid={`class-view-button-${c.id}`}>
            <ExternalLink className="size-3 mr-1" /> Open
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full text-destructive hover:text-destructive"
          onClick={onDelete}
          data-testid={`class-delete-button-${c.id}`}
        >
          <Trash2 className="size-3 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}
