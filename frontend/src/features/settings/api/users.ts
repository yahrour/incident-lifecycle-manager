import type { ApiResponse, User } from "@/types";
import type { SettingsFormValues } from "../schemas";
import { apiClient } from "@/lib/apiClient";

export async function updateProfile(data: Partial<SettingsFormValues>) {
  const response = await apiClient.patch<ApiResponse<User>>("/users/me", data);
  return response.data.data;
}
