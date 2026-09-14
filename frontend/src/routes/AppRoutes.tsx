import NotFoundPage from "@/components/NotFoundPage";
import { Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<NotFoundPage />} />

      {/* Routes that only the manager can access */}
      <Route element={<ProtectedRoute allowedRole="manager" />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/about" element={<div>About</div>} />
        </Route>
      </Route>

      {/* Routes that only the engineer can access */}
      <Route element={<ProtectedRoute allowedRole="engineer" />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/about" element={<div>About</div>} />
        </Route>
      </Route>
    </Routes>
  );
}
