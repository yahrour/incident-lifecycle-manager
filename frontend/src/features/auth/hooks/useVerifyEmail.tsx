import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../services/authService";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });
}
