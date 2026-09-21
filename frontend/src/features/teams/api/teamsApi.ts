import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Team } from "../types";
import type { createTeamSchema } from "../schemas";
import z from "zod";
import { DEFAULT_LIMIT } from "../constants";

export async function fetchTeams(page: number, search: string) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    search: search.trim(),
  });
  const apiEndpoint = `/teams?offset=${offset}&limit=${DEFAULT_LIMIT}${search.length > 0 ? `&${params.toString()}` : ""}`;
  const response = await apiClient.get<ApiResponse<Team[]>>(apiEndpoint);
  return response.data;
}

export async function createTeam(team: z.infer<typeof createTeamSchema>) {
  const response = await apiClient.post<ApiResponse<Team>>("/teams", team);
  return response.data;
}
