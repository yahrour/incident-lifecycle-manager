import { env } from "@/config/env";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

// NOTE: soufian need to review this
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.href = "/login";
    }
    if (axios.isAxiosError(error)) {
      return Promise.reject(new Error(error.message));
    }
    if (error instanceof Error) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error(String(error)));
  }
);
