import { useMutation } from "@tanstack/react-query";
import { acceptInvite } from "../services/inviteService";
import { useNavigate } from "react-router";

export default function useAccept() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: async () => {
      await navigate("/team");
    },
  });
}
