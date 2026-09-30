import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import { DEFAULT_LIMIT, DEFAULT_PREVIEW_LIMIT } from "../../shared/constants";
import type { Member } from "../../shared/types";

export async function fetchMembersPreview(id: string) {
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/${id}/members?limit=${DEFAULT_PREVIEW_LIMIT}`
  );
  return response.data;
}

export async function fetchMembers(id: string, page: number) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/${id}/members?offset=${offset}&limit=${DEFAULT_LIMIT}`
  );
  return response.data;
}
