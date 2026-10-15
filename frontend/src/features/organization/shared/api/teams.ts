import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Team } from "../types";

export async function fetchTeam(id: string) {
  const response = await apiClient.get<ApiResponse<Team>>(`/teams/${id}`);
  return response.data;
}
