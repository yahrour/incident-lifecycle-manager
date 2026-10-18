import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { MyTeam } from "../types";

export async function fetchMyTeam() {
  const response =
    await apiClient.get<ApiResponse<MyTeam | null>>("/users/me/team");
  return response.data;
}
