import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DashboardShell from "@/pages/DashboardShell";
import DashboardHome from "@/pages/DashboardHome";
import ClassesList from "@/pages/ClassesList";
import ClassCreate from "@/pages/ClassCreate";
import ClassDetail from "@/pages/ClassDetail";
import ExercisesLibrary from "@/pages/ExercisesLibrary";
import BrandingSettings from "@/pages/BrandingSettings";
import SuperAdmin from "@/pages/SuperAdmin";

import "@/App.css";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<RequireAuth><DashboardShell /></RequireAuth>}>
            <Route index element={<DashboardHome />} />
            <Route path="classes" element={<ClassesList />} />
            <Route path="classes/new" element={<ClassCreate />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="exercises" element={<ExercisesLibrary />} />
            <Route path="branding" element={<BrandingSettings />} />
            <Route path="admin" element={<SuperAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
