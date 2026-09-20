import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
export function GuestOnly() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />; // renders SignIn or SignUp here
}
