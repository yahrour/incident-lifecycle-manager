import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, Filter, Unavailability } from "@/types";
import { DEFAULT_LIMIT, DEFAULT_PREVIEW_LIMIT } from "../../shared/constants";
import type { SortState } from "../types";
import type { TeamMember } from "../../shared/types";

export async function fetchUnavailabilitiesPreview(id: string) {
  const response = await apiClient.get<
    ApiResponse<(Unavailability & { teamMember: TeamMember })[]>
  >(`/teams/${id}/unavailabilities?limit=${DEFAULT_PREVIEW_LIMIT}`);
  return response.data;
}

export async function fetchTeamUnavailabilities(
  id: string,
  page: number,
  sort: SortState,
  filter: Filter
) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(DEFAULT_LIMIT),
    sortField: sort.field,
    sortOrder: sort.order,
    filterField: filter,
  });
  const response = await apiClient.get<
    ApiResponse<(Unavailability & { teamMember: TeamMember })[]>
  >(`/teams/${id}/unavailabilities?${params.toString()}`);
  return response.data;
}

export async function approveUnavailability(
  teamId: string,
  memberId: number,
  unavailabilityId: number
) {
  await apiClient.post(
    `/teams/${teamId}/members/${memberId}/unavailabilities/${unavailabilityId}/approve`
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

export async function fetchAllUnavailabilities(
  page: number,
  sort: SortState,
  filter: Filter
) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(DEFAULT_LIMIT),
    sortField: sort.field,
    sortOrder: sort.order,
    filterField: filter,
  });
  const response = await apiClient.get<
    ApiResponse<(Unavailability & { teamMember: TeamMember })[]>
  >(`/teams/unavailabilities?${params.toString()}`);
  return response.data;
}
