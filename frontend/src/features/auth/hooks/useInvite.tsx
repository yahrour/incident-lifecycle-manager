import { useQuery } from "@tanstack/react-query";
import { validateInvite } from "../services/authService.tsx";

export function useValidateInvite(token: string | null) {
  return useQuery({
    queryKey: ["invite", "validate", token],
    queryFn: () => validateInvite(token!),
    enabled: !!token, // don't call the API if there's no token
    retry: false, // 404/409/410 won't change by retrying
    refetchOnWindowFocus: false, // avoid showing "already used" after accepting
  });
}
