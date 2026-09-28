import z from "zod";
import type { inviteSchema } from "../schemas/invite.schema";
import { apiClient } from "@/lib/apiClient";

type ApiResponse = {
  success: boolean;
  inviteLink: string;
};
export async function createInvite(invite: z.infer<typeof inviteSchema>) {
  const response = await apiClient.post<ApiResponse>("/invite/create", invite);
  return response.data;
}
