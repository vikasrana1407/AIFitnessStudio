/**
 * Super Admin overview — KPIs, clickable studios table, users table.
 * Click a studio row → navigate to /app/admin/studios/:id (full studio dossier).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Building2, Users, Sparkles, Film, Library, ArrowRight } from "lucide-react";

const KPI_DEFS = [
  ["Studios", "total_studios", Building2],
  ["Users", "total_users", Users],
  ["Classes", "total_classes", Sparkles],
  ["Rendered", "classes_rendered", Film],
  ["In progress", "classes_in_progress", ShieldCheck],
  ["Exercises", "total_exercises", Library],
];

export default function SuperAdmin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [studios, setStudios] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") return;
    Promise.all([
      api.get("/admin/metrics"),
      api.get("/admin/studios"),
      api.get("/admin/users"),
    ]).then(([m, s, u]) => {
      setMetrics(m.data);
      setStudios(s.data || []);
      setUsers(u.data || []);
      setLoading(false);
    });
  }, [user]);

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="tactile-card">
        <div className="font-heading font-semibold">Access denied</div>
        <p className="mt-2 text-sm text-muted-foreground">This area is reserved for super admins.</p>
      </div>
    );
  }
  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-10">
      <header>
        <div className="label-eyebrow mb-2">Platform</div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Super Admin</h1>
        <p className="mt-2 text-muted-foreground text-sm">Manage all studios, users and platform health.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {KPI_DEFS.map(([label, key, Icon]) => (
          <div key={key} className="tactile-card" data-testid={`admin-kpi-${key}`}>
            <div className="flex items-center justify-between">
              <div className="label-eyebrow">{label}</div>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-heading font-bold">{metrics?.[key] ?? 0}</div>
          </div>
        ))}
      </div>

      <section className="tactile-card">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Studios</h2>
          <div className="text-sm text-muted-foreground">{studios.length} total</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studios.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => nav(`/app/admin/studios/${s.id}`)}
                  data-testid={`admin-studio-row-${s.id}`}
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                  <TableCell className="text-right">{s.member_count}</TableCell>
                  <TableCell className="text-right">{s.class_count}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "outline" : "secondary"} className="rounded-full">
                      {s.is_active ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell><ArrowRight className="size-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="tactile-card">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Users</h2>
          <div className="text-sm text-muted-foreground">{users.length} total</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Studio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} data-testid={`admin-user-row-${u.id}`}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full text-xs">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.studio ? (
                      <Link to={`/app/admin/studios/${u.studio.id}`} className="hover:text-primary hover:underline">
                        {u.studio.name}
                      </Link>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
