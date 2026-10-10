import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import { DEFAULT_LIMIT } from "@/features/organization/shared/constants";
import type { Alert, AlertFilter, SortState } from "../types";

export async function fetchAlerts(
  page: number,
  sort: SortState,
  filter: AlertFilter
) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(DEFAULT_LIMIT),
    sortField: sort.field,
    sortOrder: sort.order,
    ...(filter !== "all" && { status: filter }),
  });
  const response = await apiClient.get<ApiResponse<Alert[]>>(
    `/ingestion/alerts?${params.toString()}`
  );
  return response.data;
}
