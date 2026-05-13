import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Search } from "lucide-react";
import { statusLabel, statusTone } from "@/lib/status";

export default function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/classes/").then((r) => { setClasses(r.data || []); setLoading(false); });
  }, []);

  const filtered = classes.filter((c) =>
    c.title.toLowerCase().includes(q.toLowerCase()) ||
    c.prompt.toLowerCase().includes(q.toLowerCase())
  );

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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search classes…" className="pl-9" data-testid="classes-search-input" />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="tactile-card text-center py-14">
          <div className="font-heading font-semibold text-lg">No classes match</div>
          <p className="text-sm text-muted-foreground mt-2">Try a different search or create a new class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/app/classes/${c.id}`}
              className="tactile-card hover:border-primary/40 block"
              data-testid={`classes-card-${c.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
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
          ))}
        </div>
      )}
    </div>
  );
}
