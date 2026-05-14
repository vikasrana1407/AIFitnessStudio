import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@lumen.studio");
  const [password, setPassword] = useState("Owner@12345");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    }
    setSubmitting(false);
  };

  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block relative overflow-hidden bg-primary">
        <img
          src="https://images.unsplash.com/photo-1667400104789-f50a4cb393cf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Studio"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <div className="label-eyebrow text-primary-foreground/70">FitStudio AI</div>
          <h2 className="mt-3 text-3xl font-heading font-bold leading-tight max-w-md">
            Welcome back. Your next class is one prompt away.
          </h2>
        </div>
      </div>

      <div className="h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20">
        <Link to="/" className="font-heading font-bold tracking-tight absolute top-6 left-6 lg:left-auto lg:right-10" data-testid="login-brand-link">
          FitStudio AI
        </Link>
        <div className="max-w-md w-full">
          <div className="label-eyebrow mb-3">Sign in</div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Sign in to your studio</h1>
          <p className="mt-2 text-muted-foreground text-sm">Use your studio credentials below.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="login-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="login-password-input" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-full" data-testid="login-submit-button">
              {submitting ? "Signing in…" : "Sign in"} <ArrowRight className="ml-1 size-4" />
            </Button>
          </form>

          <div className="mt-4 text-sm text-muted-foreground">
            No studio yet? <Link to="/register" className="text-primary font-medium hover:underline" data-testid="login-register-link">Start a free trial →</Link>
          </div>
          <div className="mt-4 rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">Demo logins</div>
            <div>Owner — owner@lumen.studio / Owner@12345</div>
            <div>Super Admin — admin@fitstudio.ai / Admin@12345</div>
          </div>
        </div>
      </div>
    </div>
  );
}
