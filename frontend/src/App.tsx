import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { queryClient } from "./lib/queryClient";

import SignIn from "./features/auth/pages/SignIn";
import EmailVerified from "./features/auth/pages/EmailVerified";
import LinkExpired from "./features/auth/pages/LinkExpired";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/sign-in" replace />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/verify-email" element={<EmailVerified />} />
            <Route path="/link-expired" element={<LinkExpired />} />
          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
