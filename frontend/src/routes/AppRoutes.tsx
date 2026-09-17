import NotFoundPage from "@/components/NotFoundPage";
import { Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { RequireAuth } from "./RequireAuth";
import { ProtectedRoute } from "./ProtectedRoute";
import SignIn from "@/features/auth/pages/SignIn";
import SignUp from "@/features/auth/pages/signUp";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public — must stay outside RequireAuth */}
      <Route path="/login" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/unauthorized" element={<div>Not allowed</div>} />

      {/* Everything below requires being logged in */}
      <Route element={<RequireAuth />}>
        {/* Manager only */}
        <Route element={<ProtectedRoute allowedRole="SRE" />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/manager/teams" element={<div>manage teams</div>} />
            <Route
              path="/manager/engineers"
              element={<div>manage engineers</div>}
            />
            <Route
              path="/manager/availability"
              element={<div>manage availability</div>}
            />
            <Route
              path="/manager/time-off"
              element={<div>manage time-off</div>}
            />
          </Route>
        </Route>

        {/* Engineer only */}
        <Route element={<ProtectedRoute allowedRole="ENGINEER" />}>
          <Route element={<AppLayout />}>
            <Route path="/engineer/my-shift" element={<div>my shift</div>} />
            <Route
              path="/engineer/time-off"
              element={<div>manage time-off</div>}
            />
            <Route path="/engineer/team" element={<div>manage team</div>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
