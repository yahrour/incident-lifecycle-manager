import type { ApiError } from "@/types";
import axios from "axios";

export function parseApiError(error: unknown): string[] {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as ApiError | undefined)?.message;
    if (Array.isArray(message)) return message;
    if (typeof message === "string") return [message];
    return ["Something went wrong. Please try again."];
  }
  if (error instanceof Error) {
    return [error.message];
  }
  return ["An unexpected error occurred."];
}
