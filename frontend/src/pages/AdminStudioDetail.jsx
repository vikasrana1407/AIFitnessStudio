/**
 * Super-admin view of a single studio — shows members, classes, exercises.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { statusLabel, statusTone } from "@/lib/status";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function AdminStudioDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") return;
    api.get(`/admin/studios/${id}`).then((r) => setData(r.data)).catch(() => {});
  }, [id, user]);

  if (user?.role !== "SUPER_ADMIN") {
    return <div className="tactile-card"><div className="font-heading font-semibold">Access denied</div></div>;
  }
  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  const { studio, members, classes, exercises } = data;
  return (
    <div className="space-y-10">
      <Link to="/app/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="admin-detail-back-link">
        <ArrowLeft className="size-3" /> All studios
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-2">Studio</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">{studio.name}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{studio.tagline || "—"}</p>
        </div>
        <Badge variant="outline" className="rounded-full">{studio.is_active ? "Active" : "Paused"}</Badge>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Members" value={members.length} />
        <Stat label="Classes" value={classes.length} />
        <Stat label="Rendered" value={classes.filter((c) => c.status === "RENDERED").length} />
        <Stat label="Studio exercises" value={exercises.length} />
      </div>

      <section className="tactile-card">
        <h2 className="text-xl font-heading font-bold mb-4">Members</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.email}</TableCell>
                <TableCell>{[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                <TableCell><Badge variant="secondary" className="rounded-full text-xs">{m.role}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="tactile-card">
        <h2 className="text-xl font-heading font-bold mb-4">Classes</h2>
        {classes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No classes yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead><TableHead>Duration</TableHead>
                <TableHead>Focus</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id} data-testid={`admin-studio-class-row-${c.id}`}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.duration_minutes} min</TableCell>
                  <TableCell className="text-muted-foreground">{c.focus_area.replace("_", " ")}</TableCell>
                  <TableCell><Badge variant={statusTone(c.status)} className="rounded-full">{statusLabel(c.status)}</Badge></TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{c.progress_percent}%</TableCell>
                  <TableCell>
                    <Link to={`/app/classes/${c.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="tactile-card">
        <h2 className="text-xl font-heading font-bold mb-4">Studio exercises</h2>
        {exercises.length === 0 ? (
          <div className="text-sm text-muted-foreground">No studio-specific exercises (system library is shared).</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercises.map((ex) => (
              <div key={ex.id} className="rounded-md border border-border/60 p-4">
                <div className="font-medium">{ex.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{ex.category.replace("_", " ")} · {ex.difficulty}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="tactile-card">
      <div className="label-eyebrow">{label}</div>
      <div className="mt-3 text-3xl font-heading font-bold">{value}</div>
    </div>
  );
}
