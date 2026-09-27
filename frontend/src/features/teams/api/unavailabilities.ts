import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Unavailability } from "../types";

export async function fetchUnavailabilities(id: string, limit: number) {
  const response = await apiClient.get<ApiResponse<Unavailability[]>>(
    `/teams/${id}/unavailabilities?limit=${limit}`
  );
  return response.data;
}
