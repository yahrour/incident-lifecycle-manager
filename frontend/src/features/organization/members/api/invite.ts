import z from "zod";
import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { InviteEngineer } from "../types";
import type { inviteSchema } from "@/features/organization/shared/schemas";

export async function createInvite(invite: z.infer<typeof inviteSchema>) {
  const response = await apiClient.post<ApiResponse<InviteEngineer>>(
    "/invite/create",
    invite
  );
  return response.data;
}
