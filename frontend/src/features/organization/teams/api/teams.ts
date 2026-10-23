import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { OnCall, SortState, Stats, UpcomingRotation } from "../types";
import type { createTeamSchema, updateTeamSchema } from "../schemas";
import z from "zod";
import { format } from "date-fns";
import type { Team } from "../../shared/types";
import { DEFAULT_LIMIT } from "../../shared/constants";

export async function fetchTeams(
  page: number,
  search: string,
  sort: SortState
) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    ...(search.length > 0 && { search: search }),
    offset: String(offset),
    limit: String(DEFAULT_LIMIT),
    sortField: sort.field,
    sortOrder: sort.order,
  });
  const apiEndpoint = `/teams?${params.toString()}`;
  const response = await apiClient.get<ApiResponse<Team[]>>(apiEndpoint);
  return response.data;
}

export async function createTeam(team: z.infer<typeof createTeamSchema>) {
  const body = {
    ...team,
    rotationStartDate:
      team.rotationStartDate && format(team.rotationStartDate, "yyyy-MM-dd"),
  };
  const response = await apiClient.post<ApiResponse<Team>>("/teams", body);
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
    `/teams/${id}/on-call/current`
  );
  return response.data;
}

export async function fetchUpcomingRotations(id: string) {
  const response = await apiClient.get<ApiResponse<UpcomingRotation[]>>(
    `/teams/${id}/on-call/upcoming`
  );
  return response.data;
}
