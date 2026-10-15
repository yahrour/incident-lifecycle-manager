import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../services/logoutService";
import { useNavigate } from "react-router";
import { shiftKeys } from "@/features/my-shift/constants";
import { useAuth } from "../context/AuthContext";

export default function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(["session"], null);
      void queryClient.invalidateQueries({
        queryKey: shiftKeys.detail(user?.id ?? ""),
      });
      void navigate("/login", { replace: true });
    },
  });
}
