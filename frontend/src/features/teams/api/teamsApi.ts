import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Team } from "../types";
import type { createTeamSchema } from "../schemas";
import z from "zod";

export async function fetchTeams() {
  const response = await apiClient.get<ApiResponse<Team[]>>("/teams");
  return response.data;
}

export async function createTeam(team: z.infer<typeof createTeamSchema>) {
  const response = await apiClient.post<ApiResponse<Team>>("/teams", team);
  return response.data;
}
