import { BrowserRouter, Routes, Route } from "react-router";
import LinkExpired from "./features/auth/pages/LinkExpired";
import SignIn from "./features/auth/pages/SignIn";
import EmailVerified from "./features/auth/pages/EmailVerified";
import { Navigate } from "react-router";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/verify-email" element={<EmailVerified />} />
        <Route path="/link-expired" element={<LinkExpired />} />
      </Routes>
    </BrowserRouter>
  );
}
