import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import { DEFAULT_LIMIT, DEFAULT_PREVIEW_LIMIT } from "../../shared/constants";
import type { Member } from "../../shared/types";
import type { SortState } from "../types";

export async function fetchMembersPreview(id: string) {
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/${id}/members?limit=${DEFAULT_PREVIEW_LIMIT}`
  );
  return response.data;
}

export async function fetchMembers(id: string, page: number, sort: SortState) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    sortField: sort.field,
    sortOrder: sort.order,
  });
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/${id}/members?offset=${offset}&limit=${DEFAULT_LIMIT}&${params.toString()}`
  );
  return response.data;
}

export async function fetchEngineers(page: number, sort: SortState) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    sortField: sort.field,
    sortOrder: sort.order,
  });
  const response = await apiClient.get<ApiResponse<Member[]>>(
    `/teams/members?offset=${offset}&limit=${DEFAULT_LIMIT}&${params.toString()}`
  );
  return response.data;
}

export async function removeMember({
  teamId,
  memberId,
}: {
  teamId: string;
  memberId: number;
}) {
  await apiClient.delete(`/teams/${teamId}/members/${memberId}`);
}
