import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Metrics } from "../types";

export async function fetchMetrics() {
  const response = await apiClient.get<ApiResponse<Metrics>>("/metrics");
  return response.data;
}
