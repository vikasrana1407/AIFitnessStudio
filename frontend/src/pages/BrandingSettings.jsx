import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const VOICES = [
  ["warm_female", "Warm Female"],
  ["calm_female", "Calm Female"],
  ["bright_female", "Bright Female"],
  ["warm_male", "Warm Male"],
  ["focused_male", "Focused Male"],
];
const AVATARS = [
  ["instructor_neutral", "Studio Instructor (Neutral)"],
  ["instructor_warm", "Studio Instructor (Warm)"],
  ["instructor_athletic", "Athletic Instructor"],
];

export default function BrandingSettings() {
  const { refreshUser } = useAuth();
  const [studio, setStudio] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/studios/current").then((r) => setStudio(r.data));
  }, []);

  if (!studio) return <div className="text-muted-foreground">Loading…</div>;

  const set = (k, v) => setStudio({ ...studio, [k]: v });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/studios/current", studio);
      setStudio(data);
      await refreshUser();
      toast.success("Studio settings saved");
    } catch {
      toast.error("Could not save settings");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <div className="label-eyebrow mb-2">Branding & defaults</div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Studio settings</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          These defaults flow into every class generated for {studio.name}.
        </p>
      </header>

      <form className="space-y-6" onSubmit={save} data-testid="branding-form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Studio name">
            <Input value={studio.name} onChange={(e) => set("name", e.target.value)} data-testid="branding-name-input" />
          </Field>
          <Field label="Tagline">
            <Input value={studio.tagline} onChange={(e) => set("tagline", e.target.value)} data-testid="branding-tagline-input" />
          </Field>
          <Field label="Logo URL">
            <Input value={studio.logo_url} onChange={(e) => set("logo_url", e.target.value)} data-testid="branding-logo-input" />
          </Field>
          <Field label="Brand color (hex)">
            <div className="flex items-center gap-3">
              <Input value={studio.brand_color} onChange={(e) => set("brand_color", e.target.value)} data-testid="branding-color-input" />
              <div className="size-9 rounded-md border border-border" style={{ background: studio.brand_color }} />
            </div>
          </Field>
          <Field label="Voice preference">
            <Select value={studio.voice_preference} onValueChange={(v) => set("voice_preference", v)}>
              <SelectTrigger data-testid="branding-voice-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOICES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Avatar preference">
            <Select value={studio.avatar_preference} onValueChange={(v) => set("avatar_preference", v)}>
              <SelectTrigger data-testid="branding-avatar-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVATARS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving} className="rounded-full" data-testid="branding-save-button">
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
