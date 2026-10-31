import { Navigate } from "react-router";
import { useAuth } from "@/features/auth";
import { getDashboardPath } from "@/lib/redirect";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { LandingPage } from "@/features/landing";

export function LandingOrDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;
  return <LandingPage />;
}
