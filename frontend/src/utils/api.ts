import type { ApiError } from "@/types";
import axios from "axios";

export function parseApiError(error: unknown): string[] {
  if (!axios.isAxiosError(error)) {
    return ["An unexpected error occurred."];
  }
  const message = (error.response?.data as ApiError | undefined)?.message;
  if (Array.isArray(message)) return message;
  if (message) return [message];
  return ["Something went wrong. Please try again."];
}
