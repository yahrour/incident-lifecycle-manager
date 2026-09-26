import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types";
import { type SignInCredentials } from "../types";
import { type SignUpResponse } from "../types";
import { type SignUpCredentials } from "../schemas";
import axios from "axios";

export async function getMe(): Promise<User | null> {
  try {
    const res = await apiClient.get<User>("/users/me");
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return null;
    throw err;
  }
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
