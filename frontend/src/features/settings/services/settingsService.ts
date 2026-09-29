import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, User } from "@/types";
import type { SettingFormValues } from "../schema";

export async function updateProfile(data: Partial<SettingFormValues>) {
  const response = await apiClient.patch<ApiResponse<User>>("/users/me", data);
  return response.data.data;
}
