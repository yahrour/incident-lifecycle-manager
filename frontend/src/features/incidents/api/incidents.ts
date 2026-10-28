import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Incident, IncidentDetails, IncidentStatus } from "../types";

export async function fetchIncidents(status?: IncidentStatus, cursor?: string) {
  const response = await apiClient.get<ApiResponse<Incident[]>>("/incidents", {
    params: { status, cursor, limit: 10 },
  });

  return response.data;
}

export async function fetchIncident(id: string | undefined) {
  if (!id) return null;
  const response = await apiClient.get<ApiResponse<IncidentDetails>>(
    `/incidents/${id}`
  );
  return response.data;
}
