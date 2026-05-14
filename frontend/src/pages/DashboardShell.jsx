/**
 * Dashboard shell — sidebar nav on the left, top bar with profile menu on the right.
 */
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, Sparkles, Library, Palette, ShieldCheck, LogOut,
  User as UserIcon, Bot, ChevronDown,
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
  const initial = (user?.first_name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-background">
        <div className="px-6 py-6 border-b border-border/60">
          <Link to="/app" className="flex items-center gap-2 font-heading font-bold" data-testid="sidebar-brand-link">
            <span className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">FS</span>
            FitStudio AI
          </Link>
          {!isAdmin && (
            <div className="mt-4">
              <div className="label-eyebrow">Studio</div>
              <div className="mt-1 text-sm font-medium truncate" data-testid="sidebar-studio-name">
                {user?.studio?.name || "—"}
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {!isAdmin && STUDIO_NAV.map((item) => <NavItem key={item.to} {...item} />)}
          {isAdmin && (
            <>
              <NavItem to="/app/admin" label="Dashboard" icon={LayoutDashboard} end testid="nav-admin" />
              <NavItem to="/app/exercises" label="Exercise Library" icon={Library} testid="nav-exercises-admin" />
            </>
          )}
        </nav>
        <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          v0.3 · {isAdmin ? "Super Admin" : "Studio"}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar with profile dropdown (top-right) */}
        <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-end px-6 lg:px-10 gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 rounded-full hover:bg-muted px-2 py-1.5 transition-colors"
                data-testid="topbar-profile-trigger"
              >
                <Avatar user={user} initial={initial} />
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {isAdmin ? "Super Admin" : user?.role}
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium truncate">{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => nav("/app/profile")} data-testid="topbar-profile-link">
                <UserIcon className="size-4 mr-2" /> My profile
              </DropdownMenuItem>
              {!isAdmin && (
                <DropdownMenuItem onSelect={() => nav("/app/branding")}>
                  <Palette className="size-4 mr-2" /> Branding
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onSelect={() => nav("/app/admin")}>
                  <ShieldCheck className="size-4 mr-2" /> Super Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { logout(); nav("/"); }} className="text-destructive focus:text-destructive" data-testid="topbar-logout-button">
                <LogOut className="size-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Avatar({ user, initial }) {
  if (user?.profile_picture_url) {
    return (
      <img src={user.profile_picture_url} alt="Profile" className="size-9 rounded-full object-cover border border-border" />
    );
  }
  return (
    <span className="size-9 rounded-full bg-accent/20 text-accent grid place-items-center font-semibold uppercase">
      {initial}
    </span>
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
