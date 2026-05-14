/**
 * Branding settings — logo upload (multipart), live brand color, theme picker.
 */
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { applyBrandColor, applyMode } from "@/lib/theme";
import { Upload, X } from "lucide-react";

const VOICES = [
  ["warm_female", "Warm Female"], ["calm_female", "Calm Female"],
  ["bright_female", "Bright Female"], ["warm_male", "Warm Male"], ["focused_male", "Focused Male"],
];
const AVATARS = [
  ["instructor_neutral", "Studio Instructor (Neutral)"],
  ["instructor_warm", "Studio Instructor (Warm)"],
  ["instructor_athletic", "Athletic Instructor"],
];
const COLOR_PRESETS = ["#264D3B", "#1E3A8A", "#7C2D12", "#1F2937", "#4A044E", "#0F766E"];
const THEMES = [["light", "Light"], ["dark", "Dark"], ["system", "Match system"]];

export default function BrandingSettings() {
  const { refreshUser, applyTheme, user, setUser } = useAuth();
  const [studio, setStudio] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get("/studios/current").then((r) => setStudio(r.data)).catch(() => setStudio(null));
  }, []);

  if (!studio) {
    return (
      <div className="tactile-card text-center py-14 max-w-xl">
        <div className="font-heading font-semibold text-lg">No studio attached</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Super admins manage all studios from the admin panel.
        </p>
      </div>
    );
  }

  const set = (k, v) => {
    const next = { ...studio, [k]: v };
    setStudio(next);
    if (k === "brand_color") applyBrandColor(v);
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/studio-logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("logo_url", data.url);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Logo upload failed");
    }
    setUploading(false);
  };

  const removeLogo = () => set("logo_url", "");

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/studios/current", studio);
      setStudio(data);
      await refreshUser();
      applyTheme({ ...user, studio: data });
      toast.success("Studio settings saved · theme applied");
    } catch {
      toast.error("Could not save settings");
    }
    setSaving(false);
  };

  const setTheme = async (mode) => {
    applyMode(mode);
    try {
      const { data } = await api.patch("/auth/profile", { theme_preference: mode });
      setUser(data);
      toast.success(`Theme: ${mode}`);
    } catch { /* keep local change even if persist fails */ }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <div className="label-eyebrow mb-2">Branding & defaults</div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Studio settings</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          These defaults flow into every class generated for {studio.name}. Brand color updates the entire app live.
        </p>
      </header>

      <form className="space-y-6" onSubmit={save} data-testid="branding-form">
        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Studio logo</Label>
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-md border border-border bg-muted/40 grid place-items-center overflow-hidden">
              {studio.logo_url ? (
                <img src={studio.logo_url} alt="Studio logo" className="size-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            <div className="space-y-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} data-testid="branding-logo-file-input" />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full" data-testid="branding-logo-upload-button">
                <Upload className="size-4 mr-2" />{uploading ? "Uploading…" : "Upload logo"}
              </Button>
              {studio.logo_url && (
                <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="text-destructive hover:text-destructive">
                  <X className="size-3 mr-1" /> Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG / JPG / WEBP up to 4 MB.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Studio name">
            <Input value={studio.name} onChange={(e) => set("name", e.target.value)} data-testid="branding-name-input" />
          </Field>
          <Field label="Tagline">
            <Input value={studio.tagline} onChange={(e) => set("tagline", e.target.value)} data-testid="branding-tagline-input" />
          </Field>

          <Field label="Brand color">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input value={studio.brand_color} onChange={(e) => set("brand_color", e.target.value)} data-testid="branding-color-input" />
                <input
                  type="color"
                  value={studio.brand_color}
                  onChange={(e) => set("brand_color", e.target.value)}
                  className="h-9 w-12 rounded-md border border-border cursor-pointer"
                  data-testid="branding-color-picker"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => set("brand_color", c)}
                    className="size-7 rounded-full border-2 border-border hover:scale-110 transition-transform"
                    style={{ background: c }}
                    aria-label={`Use preset ${c}`}
                    data-testid={`branding-preset-${c.slice(1)}`}
                  />
                ))}
              </div>
            </div>
          </Field>

          <Field label="Theme mode">
            <Select value={user?.theme_preference || "light"} onValueChange={setTheme}>
              <SelectTrigger data-testid="branding-theme-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                {THEMES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
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
