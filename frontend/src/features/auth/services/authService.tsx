import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types";
import { type SignInCredentials } from "../types";
import { type SignUpResponse } from "../types";
import { type SignUpCredentials } from "../schemas";

export async function getMe(): Promise<User | null> {
  const { data } = await apiClient.get<{ user: User | null }>("/auth/session");
  return data.user;
}

export async function signIn({
  email,
  password,
}: SignInCredentials): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean; message?: string }>(
    "/auth/sign-in",
    { email, password }
  );
  if (!data.success) throw new Error(data.message ?? "Invalid credentials");
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
