import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Sparkles, Library, Palette, ShieldCheck, LogOut,
} from "lucide-react";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/app/classes", label: "Classes", icon: Sparkles, testid: "nav-classes" },
  { to: "/app/exercises", label: "Exercise Library", icon: Library, testid: "nav-exercises" },
  { to: "/app/branding", label: "Branding", icon: Palette, testid: "nav-branding" },
];

export default function DashboardShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-background">
        <div className="px-6 py-6 border-b border-border/60">
          <div className="flex items-center gap-2 font-heading font-bold">
            <span className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">FS</span>
            FitStudio AI
          </div>
          <div className="mt-4">
            <div className="label-eyebrow">Studio</div>
            <div className="mt-1 text-sm font-medium truncate" data-testid="sidebar-studio-name">
              {user?.studio?.name || "—"}
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/app/admin"
              data-testid="nav-admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <ShieldCheck className="size-4" />
              Super Admin
            </NavLink>
          )}
        </nav>
        <div className="border-t border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-accent/20 text-accent grid place-items-center font-semibold uppercase">
              {(user?.first_name || user?.email || "?").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { logout(); nav("/"); }}
              data-testid="sidebar-logout-button"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
