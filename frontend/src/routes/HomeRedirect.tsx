import { Navigate } from "react-router";
import { useAuth } from "@/features/auth";

export function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "SRE":
      return <Navigate to="/manager/teams" replace />;

    case "ENGINEER":
      return <Navigate to="/engineer/my-shift" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}
