import type { Unavailability } from "@/features/organization/shared/types";
import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { SortState } from "../types";
import { DEFAULT_LIMIT } from "../constants";

export async function fetchMemberUnavailabilities({
  filter,
  teamId,
  memberId,
  page,
  sort,
}: {
  filter: "all" | "pending";
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
  });
  const response = await apiClient.get<ApiResponse<Unavailability[]>>(
    `/teams/${teamId}/members/${memberId}/unavailabilities${filter === "pending" ? "/pending" : ""}?${params.toString()}`
  );
  return response.data;
}

export async function confirmUnavailability(
  teamId: string,
  memberId: number,
  unavailabilityId: number
) {
  await apiClient.post(
    `/teams/${teamId}/members/${memberId}/unavailabilities/${unavailabilityId}/confirm`
  );
}

export async function rejectUnavailability(
  teamId: string,
  memberId: number,
  unavailabilityId: number
) {
  await apiClient.post(
    `/teams/${teamId}/members/${memberId}/unavailabilities/${unavailabilityId}/reject`
  );
}
