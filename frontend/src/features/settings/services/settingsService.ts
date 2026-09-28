import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { SettingFormValues } from "../schema";
import type { User } from "@/types";

export async function updateSettings(data: Partial<SettingFormValues>) {
  const response = await apiClient.patch<ApiResponse<User>>("/users/me", data);
  return response.data.data;
}
