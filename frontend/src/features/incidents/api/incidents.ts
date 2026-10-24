import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Incident, IncidentStatus } from "../types";

export async function fetchIncidents(status?: IncidentStatus, cursor?: string) {
  const response = await apiClient.get<ApiResponse<Incident[]>>("/incidents", {
    params: { status, cursor, limit: 10 },
  });

  return response.data;
}
