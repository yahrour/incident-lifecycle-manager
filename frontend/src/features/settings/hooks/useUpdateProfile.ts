import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../api/users";

export default function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}
