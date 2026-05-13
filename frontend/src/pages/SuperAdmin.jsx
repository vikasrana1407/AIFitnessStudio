import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function SuperAdmin() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [studios, setStudios] = useState([]);
  const [users, setUsers] = useState([]);

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

  return (
    <div className="space-y-10">
      <header>
        <div className="label-eyebrow mb-2">Platform</div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Super Admin</h1>
        <p className="mt-2 text-muted-foreground text-sm">Manage all studios, users and platform health.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics && [
          ["Studios", metrics.total_studios],
          ["Users", metrics.total_users],
          ["Classes", metrics.total_classes],
          ["Rendered", metrics.classes_rendered],
          ["In progress", metrics.classes_in_progress],
        ].map(([k, v]) => (
          <div key={k} className="tactile-card" data-testid={`admin-kpi-${k.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="label-eyebrow">{k}</div>
            <div className="mt-3 text-3xl font-heading font-bold">{v}</div>
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
                <TableHead>Members</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studios.map((s) => (
                <TableRow key={s.id} data-testid={`admin-studio-row-${s.id}`}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                  <TableCell>{s.member_count}</TableCell>
                  <TableCell>{s.class_count}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "outline" : "secondary"} className="rounded-full">
                      {s.is_active ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
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
                  <TableCell className="text-muted-foreground">{u.studio?.name || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
