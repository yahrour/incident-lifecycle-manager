import { apiClient } from "@/lib/apiClient";
import type { ValidateInviteResponse } from "../types";

export async function validateInvite(
  token: string
): Promise<ValidateInviteResponse> {
  const { data } = await apiClient.get<ValidateInviteResponse>(
    "/invite/validate",
    { params: { token } }
  );
  return data;
}
