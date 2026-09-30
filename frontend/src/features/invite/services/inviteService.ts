import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { InviteProps } from "../types";
import type { RegisterViaInvitePayload } from "../schemas";

export async function validateInviteToken(token: string): Promise<InviteProps> {
  const { data } = await apiClient.get<ApiResponse<InviteProps>>(
    "invites/validate",
    { params: { token } }
  );
  return data.data;
}

export async function acceptInvite(token: string): Promise<void> {
  await apiClient.post("invites/accept", { token });
}

export async function registerViaInvite(
  payload: RegisterViaInvitePayload
): Promise<void> {
  await apiClient.post("invites/register", payload);
}
