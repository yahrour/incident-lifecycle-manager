import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { signUp } from "../services/authService";

export default function useSignUp() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signUp,
    onSuccess: async (data) => {
      await navigate("/login", {
        replace: true,
        state: { message: data.message },
      });
    },
  });
}
