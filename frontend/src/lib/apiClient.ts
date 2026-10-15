import { env } from "@/config/env";
import axios, { type InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

// Holds the refresh in progress, so it runs only once at a time
let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post("/auth/refresh-tokens")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(
        error instanceof Error ? error : new Error(String(error))
      );
    }

    const status = error.response?.status;
    const original = error.config as RetryableConfig | undefined;
    const isAuthRoute = original?.url?.startsWith("/auth/") ?? false;

    // 1. Access token expired: try to refresh once, then retry the request
    if (status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        await refreshSession();
        return apiClient(original);
      } catch {
        // refresh failed: the session is really over (handled below)
      }
    }

    // 2. Still unauthorized: send the user to the login page
    const onLoginPage = window.location.pathname === "/login";
    if (status === 401 && !isAuthRoute && !onLoginPage) {
      window.location.href = "/login";
    }

    // Keep the AxiosError so callers can still read error.response.status
    return Promise.reject(error);
  }
);
