import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types";
import { type SignInCredentials } from "../types";
import { type SignUpResponse } from "../types";
import { type SignUpCredentials } from "../types";

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

export async function signUp(
  credentials: SignUpCredentials
): Promise<SignUpResponse> {
  const { data } = await apiClient.post<SignUpResponse>("/auth/sign-up", {
    ...credentials,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return data;
}
