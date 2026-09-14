import NotFoundPage from "@/components/NotFoundPage";
import { Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<NotFoundPage />} />

      {/* Routes that only the manager can access */}
      <Route element={<ProtectedRoute allowedRole={"manager"} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/manager/teams" element={<div>manage teams</div>} />
          <Route
            path="/manager/engineers"
            element={<div>manage engineers</div>}
          />
          <Route
            path="/manager/availability"
            element={<div>manage availabiliy</div>}
          />
          <Route
            path="/manager/time-off"
            element={<div>manage time-off</div>}
          />
        </Route>
      </Route>

      {/* Routes that only the engineer can access */}
      <Route element={<ProtectedRoute allowedRole={"engineer"} />}>
        <Route element={<AppLayout />}>
          <Route path="/engineer/my-shift" element={<div>my shify</div>} />
          <Route
            path="/engineer/time-off"
            element={<div>manage time-off</div>}
          />
          <Route path="/engineer/team" element={<div>manage team</div>} />
        </Route>
      </Route>
    </Routes>
  );
}
