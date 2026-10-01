import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInvite } from "../services/inviteService";
import { useNavigate } from "react-router";

export function useAccept() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await navigate("/team");
    },
  });
}
