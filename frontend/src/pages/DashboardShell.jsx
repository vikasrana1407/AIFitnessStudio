import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Sparkles, Library, Palette, ShieldCheck, LogOut,
  User as UserIcon, Bot,
} from "lucide-react";

const STUDIO_NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/app/classes", label: "Classes", icon: Sparkles, testid: "nav-classes" },
  { to: "/app/exercises", label: "Exercise Library", icon: Library, testid: "nav-exercises" },
  { to: "/app/avatar", label: "Avatar Studio", icon: Bot, testid: "nav-avatar" },
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
          <Link to="/app" className="flex items-center gap-2 font-heading font-bold" data-testid="sidebar-brand-link">
            <span className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">FS</span>
            FitStudio AI
          </Link>
          <div className="mt-4">
            <div className="label-eyebrow">{isAdmin ? "Platform" : "Studio"}</div>
            <div className="mt-1 text-sm font-medium truncate" data-testid="sidebar-studio-name">
              {isAdmin ? "All studios" : (user?.studio?.name || "—")}
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {!isAdmin && STUDIO_NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          {isAdmin && (
            <>
              <NavItem to="/app/admin" label="Super Admin" icon={ShieldCheck} end testid="nav-admin" />
              <NavItem to="/app/exercises" label="Exercise Library" icon={Library} testid="nav-exercises-admin" />
            </>
          )}
          <NavItem to="/app/profile" label="My profile" icon={UserIcon} testid="nav-profile" />
        </nav>
        <div className="border-t border-border/60 p-4">
          <Link to="/app/profile" className="flex items-center gap-3 hover:bg-muted rounded-md px-2 py-2 -mx-2" data-testid="sidebar-profile-link">
            <div className="size-9 rounded-full bg-accent/20 text-accent grid place-items-center font-semibold uppercase">
              {(user?.first_name || user?.email || "?").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.preventDefault(); logout(); nav("/"); }}
              data-testid="sidebar-logout-button"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </Link>
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

function NavItem({ to, label, icon: Icon, end, testid }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={testid}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  );
}
