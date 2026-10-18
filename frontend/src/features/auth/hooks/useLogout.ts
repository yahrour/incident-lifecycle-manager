import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../services/logoutService";
import { useNavigate } from "react-router";

export default function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(["session"], null);
      queryClient.clear();
      void navigate("/login", { replace: true });
    },
  });
}
