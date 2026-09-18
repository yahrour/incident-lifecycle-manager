import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types";
import { type SignInCredentials } from "../types";

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>("/users/me");
  return res.data;
}

export async function signIn({
  email,
  password,
}: SignInCredentials): Promise<void> {
  await apiClient.post("/auth/sign-in", { email, password });
}
