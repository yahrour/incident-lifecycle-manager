import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, User } from "@/types";
import type {
  Incident,
  IncidentDetails,
  IncidentSeverity,
  IncidentStatus,
} from "../types";

export async function fetchIncidents(
  status?: IncidentStatus,
  cursor?: string,
  limit = 10,
  severity?: IncidentSeverity
) {
  const response = await apiClient.get<ApiResponse<Incident[]>>("/incidents", {
    params: { status, cursor, limit, severity },
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

export async function acknowledgeIncident(id: string) {
  const response = await apiClient.post<ApiResponse<Incident>>(
    `/incidents/${id}/acknowledge`
  );
  return response.data;
}

export async function resolveIncident(id: string) {
  const response = await apiClient.post<ApiResponse<Incident>>(
    `/incidents/${id}/resolve`
  );
  return response.data;
}

export async function addIncidentNote(id: string, content: string) {
  const response = await apiClient.post<ApiResponse<unknown>>(
    `/incidents/${id}/notes`,
    { content }
  );
  return response.data;
}

export async function reassignIncident(id: string, assigneeId: string) {
  const response = await apiClient.patch<ApiResponse<Incident>>(
    `/incidents/${id}/assignee`,
    { assigneeId }
  );
  return response.data;
}

export async function fetchIncidentTeamMembers(teamId: string) {
  const response = await apiClient.get<ApiResponse<{ user: User }[]>>(
    `/teams/${teamId}/members?limit=100`
  );
  return response.data;
}
