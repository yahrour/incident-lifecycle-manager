import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Team } from "../types";
import type { createTeamSchema } from "../schemas";
import z from "zod";
import { DEFAULT_LIMIT } from "../constants";

export async function fetchTeams(page: number) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const response = await apiClient.get<ApiResponse<Team[]>>(
    `/teams?offset=${offset}&limit=${DEFAULT_LIMIT}`
  );
  return response.data;
}

export async function createTeam(team: z.infer<typeof createTeamSchema>) {
  const response = await apiClient.post<ApiResponse<Team>>("/teams", team);
  return response.data;
}
