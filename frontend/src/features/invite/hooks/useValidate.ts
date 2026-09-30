import { useQuery } from "@tanstack/react-query";
import { validateInviteToken } from "../services/inviteService";
export function useValidateInvite(token: string | null) {
  return useQuery({
    queryKey: ["invite", "validate", token],
    queryFn: () => validateInviteToken(token!),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
