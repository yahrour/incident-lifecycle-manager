import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Member } from "../types";

export async function fetchMembers(id: string) {
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/${id}/members?limit=5`
  );
  return response.data;
}
