import { apiClient } from "@/lib/apiClient";

export async function googleLogin(token: string): Promise<void> {
  await apiClient.post("/auth/google", { token });
}
