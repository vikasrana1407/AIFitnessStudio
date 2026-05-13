import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, RefreshCw, Check, Download, Wand2, CheckCircle2, Circle, Loader2,
} from "lucide-react";
import { statusLabel, statusTone, STEP_ORDER, STEP_LABELS } from "@/lib/status";

const FINAL_STATES = ["RENDERED", "FAILED"];

export default function ClassDetail() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [regenIdx, setRegenIdx] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer = null;
    const tick = async () => {
      try {
        const { data } = await api.get(`/classes/${id}`);
        if (!alive) return;
        setCls(data);
        if (!FINAL_STATES.includes(data.status)) {
          timer = setTimeout(tick, 2500);
        }
      } catch {
        // network blip — try again later if still mounted
        if (alive) timer = setTimeout(tick, 4000);
      }
    };
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (!cls) return <div className="text-muted-foreground">Loading…</div>;

  const segments = cls.script_json?.segments || [];
  const jobsByStep = Object.fromEntries((cls.jobs || []).map((j) => [j.step, j]));

  const approve = async () => {
    try {
      const { data } = await api.post(`/classes/${id}/approve`);
      setCls(data);
      toast.success("Class approved");
    } catch {
      toast.error("Approval failed");
    }
  };

  const regenerateAll = async () => {
    try {
      const { data } = await api.post(`/classes/${id}/regenerate`);
      setCls(data);
      toast.success("Regeneration started");
    } catch {
      toast.error("Regenerate failed");
    }
  };

  const submitRegen = async () => {
    setRegenLoading(true);
    try {
      const { data } = await api.post(`/classes/${id}/regenerate-segment`, {
        segment_index: regenIdx,
        instruction,
      });
      setCls(data);
      setRegenIdx(null);
      setInstruction("");
      toast.success("Segment regenerated");
    } catch {
      toast.error("Failed to regenerate segment");
    }
    setRegenLoading(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Link to="/app/classes" className="hover:text-foreground inline-flex items-center gap-1" data-testid="class-back-link">
          <ArrowLeft className="size-3" /> All classes
        </Link>
      </div>

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="label-eyebrow mb-2">Class detail</div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">{cls.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <span>{cls.duration_minutes} min</span>
            <Dot /><span>{cls.focus_area.replace("_", " ")}</span>
            <Dot /><span>{cls.difficulty}</span>
            <Dot /><span>{cls.music_style}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusTone(cls.status)} className="rounded-full text-sm py-1.5 px-3" data-testid="class-detail-status">
            {statusLabel(cls.status)} · {cls.progress_percent}%
          </Badge>
          <Button variant="outline" size="sm" className="rounded-full" onClick={regenerateAll} data-testid="class-detail-regenerate-button">
            <RefreshCw className="size-4 mr-1" /> Regenerate all
          </Button>
          {cls.status === "RENDERED" && (
            <>
              <Button
                size="sm"
                variant={cls.is_approved ? "secondary" : "default"}
                className="rounded-full"
                onClick={approve}
                disabled={cls.is_approved}
                data-testid="class-detail-approve-button"
              >
                <Check className="size-4 mr-1" />
                {cls.is_approved ? "Approved" : "Approve"}
              </Button>
              <Button asChild size="sm" className="rounded-full" data-testid="class-detail-download-button">
                <a href={cls.video_url} target="_blank" rel="noreferrer">
                  <Download className="size-4 mr-1" /> Download MP4
                </a>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Pipeline */}
      <section className="tactile-card">
        <div className="label-eyebrow mb-4">Generation pipeline</div>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STEP_ORDER.map((step) => {
            const j = jobsByStep[step];
            const state = j?.status || "PENDING";
            const Icon =
              state === "DONE" ? CheckCircle2
              : state === "RUNNING" ? Loader2
              : state === "FAILED" ? Circle
              : Circle;
            return (
              <li
                key={step}
                className={`p-4 rounded-md border ${
                  state === "DONE" ? "border-primary/40 bg-primary/5"
                  : state === "RUNNING" ? "border-accent/60 bg-accent/5"
                  : state === "FAILED" ? "border-destructive/60 bg-destructive/5"
                  : "border-border/60"
                }`}
                data-testid={`pipeline-step-${step}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${state === "RUNNING" ? "animate-spin text-accent" : state === "DONE" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-sm font-medium">{STEP_LABELS[step]}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground capitalize">{state.toLowerCase()}</div>
                {j?.message && <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{j.message}</div>}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Script segments */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-heading font-bold">Script segments</h2>
          <div className="text-sm text-muted-foreground">{segments.length} segments</div>
        </div>

        {cls.script_json?.intro && (
          <SegmentCard
            title="Intro"
            subtitle={`${cls.script_json.intro.duration_seconds}s · welcome`}
            script={cls.script_json.intro.voice_script}
            notes={cls.script_json.intro.coaching_notes}
            testid="segment-intro"
          />
        )}

        {segments.map((s, i) => (
          <div key={i} className="tactile-card" data-testid={`segment-${i}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="md:w-44 shrink-0">
                <div className="label-eyebrow">Minute {s.minute_marker || "—"}</div>
                <div className="mt-2 font-heading font-semibold">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.duration_seconds}s</div>
                {s.exercise_name && (
                  <Badge variant="outline" className="mt-2 rounded-full text-xs">{s.exercise_name}</Badge>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <Block label="Voice script">{s.voice_script}</Block>
                <div className="grid sm:grid-cols-3 gap-3">
                  <SmallBlock label="Breath">{s.breathing_cue}</SmallBlock>
                  <SmallBlock label="Safety">{s.safety_notes}</SmallBlock>
                  <SmallBlock label="Coaching">{s.motivational_line}</SmallBlock>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setRegenIdx(i); setInstruction(""); }}
                    data-testid={`segment-regenerate-button-${i}`}
                  >
                    <Wand2 className="size-4 mr-1" /> Regenerate segment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {cls.script_json?.outro && (
          <SegmentCard
            title="Outro"
            subtitle={`${cls.script_json.outro.duration_seconds}s · close`}
            script={cls.script_json.outro.voice_script}
            testid="segment-outro"
          />
        )}

        {segments.length === 0 && (
          <div className="tactile-card text-center py-12 text-muted-foreground">
            Script is being generated…
          </div>
        )}
      </section>

      {/* regenerate dialog */}
      <Dialog open={regenIdx !== null} onOpenChange={(o) => !o && setRegenIdx(null)}>
        <DialogContent data-testid="regenerate-dialog">
          <DialogHeader>
            <DialogTitle>Regenerate segment</DialogTitle>
            <DialogDescription>
              Give the AI an optional instruction (tone, focus, length).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={4}
            placeholder='e.g. "Make it more energising and add a hip-stability cue."'
            data-testid="regenerate-instruction-input"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegenIdx(null)}>Cancel</Button>
            <Button onClick={submitRegen} disabled={regenLoading} data-testid="regenerate-submit-button">
              {regenLoading ? "Regenerating…" : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Dot() { return <span className="inline-block size-1 rounded-full bg-border" />; }

function Block({ label, children }) {
  return (
    <div>
      <div className="label-eyebrow mb-1">{label}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
function SmallBlock({ label, children }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="label-eyebrow mb-1">{label}</div>
      <div className="text-xs text-foreground/80 leading-relaxed">{children || "—"}</div>
    </div>
  );
}
function SegmentCard({ title, subtitle, script, notes, testid }) {
  return (
    <div className="tactile-card" data-testid={testid}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="md:w-44 shrink-0">
          <div className="label-eyebrow">{title}</div>
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        </div>
        <div className="flex-1 space-y-3">
          <Block label="Voice script">{script}</Block>
          {notes && <SmallBlock label="Coaching">{notes}</SmallBlock>}
        </div>
      </div>
    </div>
  );
}
