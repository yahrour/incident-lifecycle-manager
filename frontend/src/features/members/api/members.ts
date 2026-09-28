import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Member } from "../types";

export async function fetchMembers(id: string, limit: number) {
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/${id}/members?limit=${limit}`
  );
  return response.data;
}
