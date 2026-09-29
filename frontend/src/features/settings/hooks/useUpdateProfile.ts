import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../services/settingsService";

export default function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
