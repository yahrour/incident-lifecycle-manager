// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Role } from "@/types";

export function ProtectedRoute({ allowedRole }: { allowedRole: Role }) {
  const { user } = useAuth();
  if (user?.role !== allowedRole)
    return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
