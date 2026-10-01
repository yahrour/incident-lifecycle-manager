import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Unavailability } from "../../shared/types";
import { DEFAULT_PREVIEW_LIMIT } from "../../shared/constants";

export async function fetchUnavailabilitiesPreview(id: string) {
  const response = await apiClient.get<ApiResponse<Unavailability[]>>(
    `/teams/${id}/unavailabilities?limit=${DEFAULT_PREVIEW_LIMIT}`
  );
  return response.data;
}

export async function fetchUnavailabilities(id: string) {
  const response = await apiClient.get<ApiResponse<Unavailability[]>>(
    `/teams/${id}/unavailabilities`
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
