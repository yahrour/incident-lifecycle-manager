import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { Shift } from "../types";

export async function fetchShift() {
  const response = await apiClient.get<ApiResponse<Shift>>("/users/me/on-call");
  return response.data;
}
