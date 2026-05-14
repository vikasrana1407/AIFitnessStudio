/**
 * Profile settings — edit name/email/profile-picture + change password + theme.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, LogOut, KeyRound, Upload, X } from "lucide-react";
import { applyMode } from "@/lib/theme";

const THEMES = [["light", "Light"], ["dark", "Dark"], ["system", "Match system"]];

export default function ProfileSettings() {
  const { user, setUser, refreshUser, logout } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
    });
  }, [user]);

  if (!user) return null;
  const initial = (user.first_name || user.email || "?").slice(0, 1).toUpperCase();

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      setUser(data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    }
    setSavingProfile(false);
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await api.post("/auth/password", {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      toast.success("Password updated");
      setPw({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    }
    setSavingPw(false);
  };

  const uploadPic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads/profile-picture", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Optimistic; backend also persists
      await refreshUser();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    }
    setUploading(false);
  };

  const removePic = async () => {
    try {
      const { data } = await api.patch("/auth/profile", { profile_picture_url: "" });
      setUser(data);
      toast.success("Profile picture removed");
    } catch { toast.error("Failed to remove"); }
  };

  const setTheme = async (mode) => {
    applyMode(mode);
    try {
      const { data } = await api.patch("/auth/profile", { theme_preference: mode });
      setUser(data);
      toast.success(`Theme: ${mode}`);
    } catch { /* keep local change */ }
  };

  return (
    <div className="space-y-10 max-w-2xl">
      <header className="flex items-start justify-between">
        <div>
          <div className="label-eyebrow mb-2">Account</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">My profile</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Update your personal details, photo, theme and password.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">{user.role}</Badge>
      </header>

      <div className="tactile-card flex items-center gap-4">
        {user.profile_picture_url ? (
          <img src={user.profile_picture_url} alt="Profile" className="size-16 rounded-full object-cover border border-border" />
        ) : (
          <div className="size-16 rounded-full bg-accent/20 text-accent grid place-items-center text-2xl font-bold uppercase">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-heading font-semibold truncate">
            {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {user.studio?.name ? `${user.studio.name} · ${user.email}` : user.email}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPic} data-testid="profile-pic-file-input" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full" data-testid="profile-pic-upload-button">
              <Upload className="size-3 mr-1" /> {uploading ? "Uploading…" : "Change photo"}
            </Button>
            {user.profile_picture_url && (
              <Button type="button" variant="ghost" size="sm" onClick={removePic} className="text-destructive hover:text-destructive">
                <X className="size-3 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="tactile-card space-y-5" data-testid="profile-form">
        <h2 className="font-heading font-semibold text-lg">Personal details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} data-testid="profile-first-name-input" />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} data-testid="profile-last-name-input" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="profile-email-input" />
        </div>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={user.theme_preference || "light"} onValueChange={setTheme}>
            <SelectTrigger className="max-w-xs" data-testid="profile-theme-trigger"><SelectValue /></SelectTrigger>
            <SelectContent>
              {THEMES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={savingProfile} className="rounded-full" data-testid="profile-save-button">
          <Save className="size-4 mr-1" />
          {savingProfile ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form onSubmit={changePw} className="tactile-card space-y-5" data-testid="password-form">
        <h2 className="font-heading font-semibold text-lg inline-flex items-center gap-2"><KeyRound className="size-5" /> Change password</h2>
        <div className="space-y-2">
          <Label>Current password</Label>
          <Input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} required data-testid="password-current-input" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} minLength={6} required data-testid="password-new-input" />
          </div>
          <div className="space-y-2">
            <Label>Confirm</Label>
            <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} minLength={6} required data-testid="password-confirm-input" />
          </div>
        </div>
        <Button type="submit" disabled={savingPw} className="rounded-full" data-testid="password-save-button">
          {savingPw ? "Updating…" : "Update password"}
        </Button>
      </form>

      <Button variant="outline" onClick={() => { logout(); nav("/"); }} className="rounded-full text-destructive border-destructive/40 hover:bg-destructive/10" data-testid="profile-logout-button">
        <LogOut className="size-4 mr-1" /> Sign out
      </Button>
    </div>
  );
}
