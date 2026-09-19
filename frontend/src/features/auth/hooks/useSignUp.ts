import { useMutation } from "@tanstack/react-query";
import { signUp } from "../services/authService";

export default function useSignUp() {
  return useMutation({ mutationFn: signUp });
}
