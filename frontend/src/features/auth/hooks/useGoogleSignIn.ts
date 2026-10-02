import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { googleLogin } from "../services/googleAuthService";

export default function useGoogleSignIn() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useMutation({
    mutationFn: googleLogin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });

      const redirect = searchParams.get("redirect");
      const target =
        redirect?.startsWith("/") && !redirect.startsWith("//")
          ? redirect
          : "/";
      void navigate(target, { replace: true });
    },
  });
}
