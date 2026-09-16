import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types";
export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>("/auth/me");
  return res.data;
}
