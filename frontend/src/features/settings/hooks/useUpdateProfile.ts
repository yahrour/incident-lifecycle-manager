import { useMutation } from "@tanstack/react-query";
import { updateSettings } from "../services/settingsService";

export default function useUpdateProfile() {
  return useMutation({ mutationFn: updateSettings });
}
