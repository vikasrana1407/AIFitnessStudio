import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Mic2, Film, ShieldCheck, Zap, Library } from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1717500252709-05a73fc4f1da?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";
const FEAT1 =
  "https://images.unsplash.com/photo-1754257319723-6a775bedb0fc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const FEAT2 =
  "https://images.unsplash.com/photo-1770012905139-713758ded6ec?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold tracking-tight" data-testid="brand-link">
            <span className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">FS</span>
            <span className="text-lg">FitStudio AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground" data-testid="nav-login-link">Sign in</Link>
            <Button asChild className="rounded-full" data-testid="nav-cta-button">
              <Link to="/register">Start free trial <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="label-eyebrow mb-5">AI Class Studio · Pilates First</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight font-bold leading-[1.05]">
              Studio-quality classes,
              <span className="block text-primary"> generated in minutes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Describe a class. We script it, voice it, render an avatar instructor, and stitch the final
              workout video — using your approved exercise library, your voice, your brand.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7" data-testid="hero-cta-primary">
                <Link to="/register">Start building classes <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-7 border-foreground/15" data-testid="hero-cta-secondary">
                <Link to="/login">Sign in to demo studio</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[["12×", "Faster prep"], ["45s", "From idea → script"], ["100%", "On-brand"]].map(([k, v]) => (
                <div key={v}>
                  <div className="text-3xl font-heading font-bold">{k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-border/60 relative">
              <img src={HERO_IMG} alt="Pilates studio" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 backdrop-blur-xl bg-background/80 rounded-lg p-4 border border-border/60">
                <div className="label-eyebrow">Live generation</div>
                <div className="mt-2 text-sm font-medium">"Slow Flow — Back Care · 30 min"</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex size-2 rounded-full bg-accent animate-pulse-soft" />
                  <span className="text-xs text-muted-foreground">Avatar render · 78%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features bento */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <div className="label-eyebrow mb-3">The platform</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight max-w-xl">
                Eight production-grade modules. One coherent workflow.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md">
              Built as a true multi-tenant SaaS so onboarding the 50th studio takes the same effort as your first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Feature className="md:col-span-7" icon={Sparkles} title="AI class structure & scripts"
              body="Plain-text brief → minute-by-minute plan, spoken script, breathing cues, and motivational lines — drawing only from your approved exercise library." />
            <Feature className="md:col-span-5" icon={Library} title="Exercise library + approvals"
              body="Curate, tag and approve safe movements. Map alternative options for accessibility." />
            <Feature className="md:col-span-5" icon={Mic2} title="Studio voice & avatar"
              body="Per-segment voiceovers and talking avatar clips, with your studio's preferred voice and instructor style." />
            <Feature className="md:col-span-7 row-span-1 relative overflow-hidden" icon={Film} title="Full MP4 render"
              body="Intro/outro, branded overlays, exercise demos, music ducking. Export ready to play."
              image={FEAT1} />
            <Feature className="md:col-span-7" icon={Zap} title="Realtime job tracker"
              body="Watch each step — scripting · voice · avatar · render — and regenerate a single segment without redoing the entire class." />
            <Feature className="md:col-span-5" icon={ShieldCheck} title="Multi-tenant & roles"
              body="Studio owners, trainers, and super admins. Strict tenant isolation and granular permissions." />
          </div>
        </div>
      </section>

      {/* workflow */}
      <section id="workflow" className="py-20 lg:py-28 bg-muted/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="label-eyebrow mb-3">From brief to playback</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Four steps. Zero post-production.
            </h2>
            <p className="mt-5 text-muted-foreground max-w-md">
              You stay in creative control. The platform handles every tedious step in between.
            </p>
            <div className="mt-10 rounded-2xl overflow-hidden border border-border/60 aspect-[4/3]">
              <img src={FEAT2} alt="Instructor demo" className="w-full h-full object-cover" />
            </div>
          </div>
          <ol className="lg:col-span-7 space-y-6">
            {[
              ["01", "Describe the class", "30-min beginner mat pilates focused on lower back. Calm tone."],
              ["02", "Review the AI script", "Approve segments, edit phrasing, or regenerate a single block."],
              ["03", "Generate voice + avatar", "Per-segment voiceovers and talking avatar clips render in parallel."],
              ["04", "Download your MP4", "Branded intro/outro, timers, music ducking, exercise demos — done."],
            ].map(([n, t, d]) => (
              <li key={n} className="tactile-card flex gap-6">
                <div className="text-3xl font-heading font-bold text-accent">{n}</div>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* pricing teaser */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="label-eyebrow mb-3">Pilot pricing</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Onboard your studio today.
          </h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
            Pilot studios get full platform access while we co-build the avatar and render pipeline.
            No credit card required.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-8" data-testid="pricing-cta-button">
              <Link to="/register">Claim your studio <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row gap-4 items-center justify-between text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} FitStudio AI · Built for boutique studios.</div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground">Platform</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ className = "", icon: Icon, title, body, image }) {
  return (
    <div className={`tactile-card ${className} relative`}>
      <Icon className="size-6 text-primary" />
      <div className="mt-5 font-heading font-semibold text-lg">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">{body}</p>
      {image && (
        <div className="mt-6 rounded-md overflow-hidden border border-border/60 aspect-[16/9]">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
