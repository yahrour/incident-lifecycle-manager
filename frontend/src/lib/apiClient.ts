import { env } from "@/config/env";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url ?? "";
      const onLoginPage = window.location.pathname === "/login";
      const isSessionCheck = url.includes("/auth/me");

      // Only force a redirect when an already-logged-in user's session expires
      if (status === 401 && !isSessionCheck && !onLoginPage) {
        window.location.href = "/login";
      }

      // Keep the AxiosError so callers can still read error.response.status
      return Promise.reject(error);
    }

    return Promise.reject(
      error instanceof Error ? error : new Error(String(error))
    );
  }
);
