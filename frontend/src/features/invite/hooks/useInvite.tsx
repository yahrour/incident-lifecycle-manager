import { useQuery } from "@tanstack/react-query";
import { validateInvite } from "../services/inviteService";

export function useValidateInvite(token: string | null) {
  return useQuery({
    queryKey: ["invite", "validate", token],
    queryFn: () => validateInvite(token!),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
