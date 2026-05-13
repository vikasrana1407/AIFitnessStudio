import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    studio_name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      toast.success("Studio created");
      nav("/app");
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.email?.[0] || data?.password?.[0] || data?.detail || "Registration failed";
      toast.error(msg);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden bg-primary">
        <img
          src="https://images.unsplash.com/photo-1754257319723-6a775bedb0fc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Studio"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <div className="label-eyebrow text-primary-foreground/70">Start your studio</div>
          <h2 className="mt-3 text-3xl font-heading font-bold leading-tight max-w-md">
            Spin up a multi-tenant studio in less than a minute.
          </h2>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <Link to="/" className="font-heading font-bold tracking-tight mb-12" data-testid="register-brand-link">FitStudio AI</Link>
        <div className="max-w-md w-full">
          <div className="label-eyebrow mb-3">Free trial</div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Create your studio</h1>

          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="register-form">
            <div className="space-y-2">
              <Label htmlFor="studio">Studio name</Label>
              <Input id="studio" required value={form.studio_name} onChange={change("studio_name")} placeholder="e.g. Lumen Pilates" data-testid="register-studio-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" required value={form.full_name} onChange={change("full_name")} data-testid="register-name-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={change("email")} data-testid="register-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" required minLength={6} value={form.password} onChange={change("password")} data-testid="register-password-input" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-full" data-testid="register-submit-button">
              {submitting ? "Creating studio…" : "Create studio"} <ArrowRight className="ml-1 size-4" />
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            Already have a studio? <Link to="/login" className="text-primary font-medium hover:underline" data-testid="register-login-link">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
