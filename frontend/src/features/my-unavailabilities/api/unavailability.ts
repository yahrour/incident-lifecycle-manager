import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { SortState, Unavailability } from "../types";
import { DEFAULT_LIMIT } from "../constants";

export async function fetchMemberUnavailabilities({
  filter,
  teamId,
  memberId,
  page,
  sort,
}: {
  filter: string;
  teamId: string;
  memberId: number;
  page: number;
  sort: SortState;
}) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(DEFAULT_LIMIT),
    sortField: sort.field,
    sortOrder: sort.order,
    filterField: filter,
  });
  const response = await apiClient.get<ApiResponse<Unavailability[]>>(
    `/teams/${teamId}/members/${memberId}/unavailabilities?${params.toString()}`
  );
  return response.data;
}
