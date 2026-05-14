/**
 * Profile settings — works for both Studio Owner and Super Admin.
 * Edit name + email; change password; logout.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, LogOut, KeyRound } from "lucide-react";

export default function ProfileSettings() {
  const { user, refreshUser, logout } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
    });
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch("/auth/profile", form);
      await refreshUser();
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

  if (!user) return null;

  return (
    <div className="space-y-10 max-w-2xl">
      <header className="flex items-start justify-between">
        <div>
          <div className="label-eyebrow mb-2">Account</div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">My profile</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Update your personal details and password.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">{user.role}</Badge>
      </header>

      <div className="tactile-card flex items-center gap-4">
        <div className="size-14 rounded-full bg-accent/20 text-accent grid place-items-center text-xl font-bold uppercase">
          {(user.first_name || user.email || "?").slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="font-heading font-semibold truncate">
            {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {user.studio?.name ? `${user.studio.name} · ${user.email}` : user.email}
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
