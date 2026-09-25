import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { OnCall, Stats, Team } from "../types";
import type { createTeamSchema, updateTeamSchema } from "../schemas";
import z from "zod";
import { DEFAULT_LIMIT } from "../constants";

export async function fetchTeams(page: number, search: string) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    search: search,
  });
  const apiEndpoint = `/teams?offset=${offset}&limit=${DEFAULT_LIMIT}${search.length > 0 ? `&${params.toString()}` : ""}`;
  const response = await apiClient.get<ApiResponse<Team[]>>(apiEndpoint);
  return response.data;
}

export async function createTeam(team: z.infer<typeof createTeamSchema>) {
  const response = await apiClient.post<ApiResponse<Team>>("/teams", team);
  return response.data;
}

export async function fetchTeam(id: string) {
  const response = await apiClient.get<ApiResponse<Team>>(`/teams/${id}`);
  return response.data;
}

export async function fetchStats(id: string) {
  const response = await apiClient.get<ApiResponse<Stats>>(
    `/teams/${id}/stats`
  );
  return response.data;
}

export async function deleteTeam(id: string) {
  await apiClient.delete(`/teams/${id}`);
}

export async function updateTeam(
  team: z.infer<typeof updateTeamSchema> & { id: string }
) {
  const { id, ...updatedTeam } = team;
  const response = await apiClient.patch<ApiResponse<Team>>(
    `/teams/${id}`,
    updatedTeam
  );
  return response.data;
}

export async function fetchOnCall(id: string) {
  const response = await apiClient.get<ApiResponse<OnCall>>(
    `/teams/${id}/oncall/current`
  );
  return response.data;
}
