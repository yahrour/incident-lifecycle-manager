import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth";

export function RequireAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
