import { Navigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "@/features/auth";
import { getSafeRedirect } from "@/lib/redirect";
export function GuestOnly() {
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    return <Navigate to={redirect ?? "/engineer/my-shift"} replace />;
  }
  return <Outlet />;
}
