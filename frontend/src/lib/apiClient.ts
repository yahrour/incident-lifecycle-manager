import { env } from "@/config/env";
import { queryClient } from "@/lib/queryClient";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

// Refresh rotates the token, so concurrent 401s must share one call
let refreshPromise: Promise<unknown> | null = null;
const refreshSession = () =>
  (refreshPromise ??= apiClient
    .post("/auth/refresh-tokens")
    .finally(() => (refreshPromise = null)));

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as RetryableConfig | undefined;

  if (
    error.response?.status !== 401 ||
    !original ||
    original._retried ||
    original.url === "/auth/refresh-tokens"
  ) {
    return Promise.reject(error);
  }

  original._retried = true;
  try {
    await refreshSession();
    return apiClient(original);
  } catch {
    // Session is over: re-check it, RequireAuth will redirect to /login
    void queryClient.invalidateQueries({ queryKey: ["session"] });
    return Promise.reject(error);
  }
});
