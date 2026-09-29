import { getMe } from "@/features/auth";
import { useQuery } from "@tanstack/react-query";

export function useUserSettings() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
}
