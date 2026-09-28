import z from "zod";
import type { inviteSchema } from "../schemas/invite.schema";
import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { InviteEngineer } from "../types";

export async function createInvite(invite: z.infer<typeof inviteSchema>) {
  const response = await apiClient.post<ApiResponse<InviteEngineer>>(
    "/invite/create",
    invite
  );
  return response.data;
}
