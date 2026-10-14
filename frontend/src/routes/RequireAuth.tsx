import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function RequireAuth() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
