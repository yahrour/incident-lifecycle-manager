import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { signIn } from "../services/authService";
import { getSafeRedirect } from "@/lib/redirect";

function useAuthSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    await navigate(redirect ?? "/", { replace: true });
  };
}

export default function useSignIn() {
  const onSuccess = useAuthSuccess();
  return useMutation({ mutationFn: signIn, onSuccess });
}
