import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, User } from "@/types";
import type { SettingsFormValues } from "../schema";

export async function updateProfile(data: Partial<SettingsFormValues>) {
  const response = await apiClient.patch<ApiResponse<User>>("/users/me", data);
  return response.data.data;
}
