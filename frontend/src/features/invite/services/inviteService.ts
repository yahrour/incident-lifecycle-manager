import { apiClient } from "@/lib/apiClient";

import type { ApiResponse } from "@/types";
import type { InvalidateOptions } from "@tanstack/react-query";
export async function validateInviteToken(token: string) {
  const { data } = await apiClient.get<ApiResponse<InvalidateOptions>>(
    "invites/validate",
    { params: { token } }
  );
  return data.data;
}
