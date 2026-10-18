import { apiClient } from "@/lib/apiClient";
import type { HealthResponse } from "../types";

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/health", {
    validateStatus: (status) => status === 200 || status === 503,
  });

  return response.data;
}
