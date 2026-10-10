import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import { DEFAULT_LIMIT } from "@/features/organization/shared/constants";
import type { Alert } from "../types";

export async function fetchAlerts(page: number) {
  const offset = (page - 1) * DEFAULT_LIMIT;
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(DEFAULT_LIMIT),
  });
  const response = await apiClient.get<ApiResponse<Alert[]>>(
    `/ingestion/alerts?${params.toString()}`
  );
  return response.data;
}
