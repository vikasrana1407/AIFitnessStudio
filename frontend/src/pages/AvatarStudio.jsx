/**
 * Avatar Studio — generate and preview AI avatar talking clips.
 * Phase 1: MOCKED preview render after a brief delay. Once a real avatar API
 * (HeyGen / Synthesia / Tavus / D-ID) key is provided, swap the mock URL
 * for the real call inside `runSample`.
 */
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Sparkles, Save } from "lucide-react";

const TEMPLATES = [
  { key: "instructor_neutral", label: "Studio Instructor — Neutral", desc: "Calm tone, neutral wardrobe, soft studio backdrop." },
  { key: "instructor_warm", label: "Studio Instructor — Warm", desc: "Friendly delivery, warm lighting, soft smile." },
  { key: "instructor_athletic", label: "Athletic Instructor", desc: "Energising tone, sport attire, gym backdrop." },
];
const VOICES = [
  ["warm_female", "Warm Female"], ["calm_female", "Calm Female"],
  ["bright_female", "Bright Female"], ["warm_male", "Warm Male"], ["focused_male", "Focused Male"],
];
const SAMPLE_LINE = "Welcome back. Take a deep breath, find your center, and let's begin.";

export default function AvatarStudio() {
  const { user, refreshUser } = useAuth();
  const [studio, setStudio] = useState(null);
  const [template, setTemplate] = useState("instructor_neutral");
  const [voice, setVoice] = useState("warm_female");
  const [sampleScript, setSampleScript] = useState(SAMPLE_LINE);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/studios/current").then((r) => {
      setStudio(r.data);
      setTemplate(r.data.avatar_preference || "instructor_neutral");
      setVoice(r.data.voice_preference || "warm_female");
    });
  }, []);

  const runSample = async () => {
    setGenerating(true);
    setPreviewUrl("");
    /* MOCKED: simulate latency. Replace with real HeyGen/Tavus/D-ID call when keys are provided. */
    await new Promise((r) => setTimeout(r, 2000));
    setPreviewUrl(`https://mock.fitstudio.ai/avatar-preview/${template}-${voice}.mp4`);
    setGenerating(false);
    toast.success("Sample render ready (MOCKED)");
  };

  const saveDefaults = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/studios/current", {
        avatar_preference: template,
        voice_preference: voice,
      });
      setStudio(data);
      await refreshUser();
      toast.success("Avatar defaults saved");
    } catch {
      toast.error("Could not save defaults");
    }
    setSaving(false);
  };

  if (!studio) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-10 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-2">AI instructor</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight inline-flex items-center gap-3">
            <Bot className="size-7 text-primary" /> Avatar Studio
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-sm">
            Pick a studio instructor avatar, match it with a voice, and render a sample line.
            These defaults will be used whenever you generate a new class video.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">MOCKED · phase 2 unmocks</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="avatar-templates">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTemplate(t.key)}
            className={`tactile-card text-left transition-all ${
              template === t.key ? "border-primary ring-2 ring-primary/40" : "hover:border-primary/40"
            }`}
            data-testid={`avatar-template-${t.key}`}
          >
            <div className="aspect-[4/5] rounded-md bg-gradient-to-br from-primary/15 via-secondary/40 to-accent/20 mb-4 grid place-items-center">
              <Bot className="size-14 text-primary/60" />
            </div>
            <div className="font-heading font-semibold">{t.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
          </button>
        ))}
      </div>

      <section className="tactile-card space-y-5">
        <div className="label-eyebrow">Sample render</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger data-testid="avatar-voice-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOICES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Selected template</Label>
            <Input value={TEMPLATES.find((t) => t.key === template)?.label || template} readOnly />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Script line</Label>
          <Textarea value={sampleScript} onChange={(e) => setSampleScript(e.target.value)} rows={3} data-testid="avatar-script-input" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={runSample} disabled={generating} className="rounded-full" data-testid="avatar-render-button">
            <Sparkles className="size-4 mr-1" />
            {generating ? "Rendering…" : "Render sample"}
          </Button>
          <Button variant="outline" onClick={saveDefaults} disabled={saving} className="rounded-full" data-testid="avatar-save-defaults-button">
            <Save className="size-4 mr-1" />
            {saving ? "Saving…" : "Save as studio default"}
          </Button>
        </div>

        {previewUrl && (
          <div className="rounded-md border border-dashed border-border p-6 bg-muted/30" data-testid="avatar-preview">
            <div className="label-eyebrow mb-2">Sample (MOCKED)</div>
            <div className="aspect-video rounded-md bg-gradient-to-br from-primary/30 to-accent/30 grid place-items-center text-primary-foreground">
              <Bot className="size-12 opacity-80" />
            </div>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary hover:underline">
              {previewUrl}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
