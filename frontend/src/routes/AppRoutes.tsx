import NotFoundPage from "@/components/NotFoundPage";
import { Route, Routes } from "react-router";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/about" element={<div>About</div>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
