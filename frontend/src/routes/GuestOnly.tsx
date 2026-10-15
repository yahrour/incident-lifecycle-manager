import { Navigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "@/features/auth";
import { getSafeRedirect } from "@/lib/redirect";
import { FullPageSpinner } from "@/components/FullPageSpinner";
export function GuestOnly() {
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (user) {
    return <Navigate to={redirect ?? "/"} replace />;
  }
  return <Outlet />;
}
