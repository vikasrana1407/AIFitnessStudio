/**
 * Dashboard home — different content for Studio Owners vs Super Admins.
 * KPI cards link to dedicated pages.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ArrowRight, Film, Library, Mic2, Building2, Users, ShieldCheck,
} from "lucide-react";
import { statusLabel, statusTone } from "@/lib/status";

export default function DashboardHome() {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const nav = useNavigate();

  // Redirect super admin to admin overview as their primary landing.
  useEffect(() => {
    if (isAdmin) nav("/app/admin", { replace: true });
  }, [isAdmin, nav]);

  const [classes, setClasses] = useState([]);
  const [exCount, setExCount] = useState(0);

  useEffect(() => {
    if (isAdmin) return;
    api.get("/classes/").then((r) => setClasses(r.data || [])).catch(() => {});
    api.get("/exercises/").then((r) => setExCount((r.data || []).length)).catch(() => {});
  }, [isAdmin]);

  if (isAdmin) return null;

  const rendered = classes.filter((c) => c.status === "RENDERED").length;
  const inProgress = classes.filter(
    (c) => !["RENDERED", "FAILED", "DRAFT"].includes(c.status)
  ).length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="label-eyebrow mb-2">Studio dashboard</div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
            Hello, {user?.first_name || "there"}.
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Your studio overview, recent generations, and quick actions.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full" data-testid="dashboard-create-class-button">
          <Link to="/app/classes/new">
            <Sparkles className="size-4 mr-2" /> Create a class
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiLink to="/app/classes" label="Classes generated" value={classes.length} icon={Sparkles} testid="kpi-classes" />
        <KpiLink to="/app/classes?tab=ready" label="Rendered videos" value={rendered} icon={Film} testid="kpi-rendered" />
        <KpiLink to="/app/classes?tab=in-progress" label="In progress" value={inProgress} icon={Mic2} testid="kpi-in-progress" />
        <KpiLink to="/app/exercises" label="Exercises available" value={exCount} icon={Library} testid="kpi-exercises" />
      </div>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Recent classes</h2>
          <Link to="/app/classes" className="text-sm text-primary hover:underline" data-testid="dashboard-view-all-link">
            View all <ArrowRight className="inline size-3" />
          </Link>
        </div>
        {classes.length === 0 ? (
          <div className="tactile-card text-center py-14">
            <div className="text-lg font-heading font-semibold">No classes yet</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Generate your first AI-powered class — script, voice, avatar and final video — in minutes.
            </p>
            <Button asChild className="mt-6 rounded-full" data-testid="empty-create-class-button">
              <Link to="/app/classes/new"><Sparkles className="size-4 mr-2" />Create your first class</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to={`/app/classes/${c.id}`}
                className="tactile-card flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/40"
                data-testid={`class-row-${c.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {c.duration_minutes} min · {c.focus_area.replace("_", " ")} · {c.difficulty}
                  </div>
                </div>
                <Badge variant={statusTone(c.status)} className="rounded-full" data-testid={`class-status-${c.id}`}>
                  {statusLabel(c.status)}
                </Badge>
                <div className="text-xs text-muted-foreground w-24 text-right">{c.progress_percent}%</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiLink({ to, label, value, icon: Icon, testid }) {
  return (
    <Link to={to} className="tactile-card hover:border-primary/40 block group" data-testid={testid}>
      <div className="flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="mt-4 text-3xl font-heading font-bold">{value}</div>
      <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1 group-hover:text-primary">
        View <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}
