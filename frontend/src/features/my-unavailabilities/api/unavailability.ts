import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, Unavailability } from "@/types";
import type { SortState } from "../types";
import { DEFAULT_LIMIT } from "../constants";
import z from "zod";
import type { requestUnavailabilitySchema } from "../schemas";
import { format } from "date-fns";

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

export async function removeUnavailability({
  teamId,
  memberId,
  unavailabilityId,
}: {
  teamId: string;
  memberId: number;
  unavailabilityId: number;
}) {
  await apiClient.delete(
    `/teams/${teamId}/members/${memberId}/unavailabilities/${unavailabilityId}`
  );
}

type RequestUnavailabilitySchema = z.input<typeof requestUnavailabilitySchema>;
export async function requestUnavailability(
  data: RequestUnavailabilitySchema,
  teamId: string,
  memberId: number
) {
  const body = {
    ...data,
    startDate: format(data.startDate, "yyyy-MM-dd"),
    endDate: format(data.endDate, "yyyy-MM-dd"),
  };
  await apiClient.post(
    `/teams/${teamId}/members/${memberId}/unavailabilities`,
    body
  );
}
