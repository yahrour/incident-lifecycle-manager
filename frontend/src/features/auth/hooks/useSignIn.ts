import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { signIn } from "../services/authService";
function useAuthSucces() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    await navigate("/", { replace: true });
  };
}

export default function useSignIn() {
  const onSuccess = useAuthSucces();
  return useMutation({ mutationFn: signIn, onSuccess });
}
