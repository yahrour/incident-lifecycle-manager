import { apiClient } from "@/lib/apiClient";
import type { Membership } from "../types";
import type { ApiResponse } from "@/types";

export async function fetchUserMembership() {
  const response =
    await apiClient.get<ApiResponse<Membership | null>>(`/users/me/membership`);
  return response.data;
}
