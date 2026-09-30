import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { signIn } from "../services/authService";

function useAuthSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    await navigate("/", { replace: true });
  };
}

export default function useSignIn() {
  const onSuccess = useAuthSuccess();
  return useMutation({ mutationFn: signIn, onSuccess });
}
