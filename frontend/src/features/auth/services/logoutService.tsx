import { apiClient } from "@/lib/apiClient";

export async function logout() {
  await apiClient.post("/auth/logout");
}
