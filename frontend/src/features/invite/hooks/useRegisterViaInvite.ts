import { useMutation } from "@tanstack/react-query";
import { registerViaInvite } from "../services/inviteService";

export function useRegisterViaInvite() {
  return useMutation({ mutationFn: registerViaInvite });
}
