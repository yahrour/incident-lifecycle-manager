import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Incident } from "../types";

export async function fetchIncidents() {
  const response = await apiClient.get<ApiResponse<Incident[]>>("/incidents");

  return response.data;
}
