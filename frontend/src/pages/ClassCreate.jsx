import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const FOCUS = [
  ["FULL_BODY", "Full Body"], ["CORE", "Core"], ["LOWER_BODY", "Lower Body"],
  ["UPPER_BODY", "Upper Body"], ["FLEXIBILITY", "Flexibility"],
  ["BALANCE", "Balance"], ["BACK_HEALTH", "Back Health"],
];
const DIFFICULTY = [["BEGINNER", "Beginner"], ["INTERMEDIATE", "Intermediate"], ["ADVANCED", "Advanced"]];
const DURATIONS = [15, 20, 25, 30, 45, 60];

export default function ClassCreate() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "",
    prompt: "",
    duration_minutes: 30,
    focus_area: "FULL_BODY",
    difficulty: "BEGINNER",
    music_style: "Calm Ambient",
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/classes/", form);
      toast.success("Class generation started");
      nav(`/app/classes/${data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create class");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="label-eyebrow mb-2">New class</div>
      <h1 className="text-3xl font-heading font-bold tracking-tight">Generate a class</h1>
      <p className="mt-2 text-muted-foreground max-w-xl">
        Describe what you want. We'll build the script, voiceover, avatar clips and final video.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-6" data-testid="class-create-form">
        <div className="space-y-2">
          <Label htmlFor="title">Class title</Label>
          <Input
            id="title"
            required
            placeholder='e.g. "Slow Flow — Back Care"'
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            data-testid="class-create-title-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Describe the class</Label>
          <Textarea
            id="prompt"
            required
            rows={5}
            placeholder="A calm 30-minute mat pilates session focused on lower back relief. Beginner-friendly, with mindful breathing and gentle motivation."
            value={form.prompt}
            onChange={(e) => set("prompt")(e.target.value)}
            data-testid="class-create-prompt-input"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={String(form.duration_minutes)} onValueChange={(v) => set("duration_minutes")(parseInt(v, 10))}>
              <SelectTrigger data-testid="class-create-duration-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Focus</Label>
            <Select value={form.focus_area} onValueChange={set("focus_area")}>
              <SelectTrigger data-testid="class-create-focus-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOCUS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={form.difficulty} onValueChange={set("difficulty")}>
              <SelectTrigger data-testid="class-create-difficulty-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTY.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="music">Music style</Label>
          <Input
            id="music"
            value={form.music_style}
            onChange={(e) => set("music_style")(e.target.value)}
            placeholder="Calm Ambient, Lo-Fi, Cinematic…"
            data-testid="class-create-music-input"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="submit" disabled={submitting} size="lg" className="rounded-full" data-testid="class-create-submit-button">
            <Sparkles className="size-4 mr-2" />
            {submitting ? "Starting…" : "Generate class"}
          </Button>
        </div>
      </form>
    </div>
  );
}
