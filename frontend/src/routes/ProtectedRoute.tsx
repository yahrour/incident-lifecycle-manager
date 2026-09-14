import type { Role } from "@/types";
import { Navigate, Outlet, useLocation } from "react-router";

export function ProtectedRoute({ allowedRole }: { allowedRole: Role }) {
  const user = {
    id: "#1",
    name: "Tobi",
    email: "tobi@acme.com",
    role: "manager" as "manager" | "engineer",
    team: "Acme Cloud",
  };

  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role != allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
