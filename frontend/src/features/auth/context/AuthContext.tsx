import { createContext, useContext } from "react";
import type { User } from "@/types";

export const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
}>({
  user: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}
