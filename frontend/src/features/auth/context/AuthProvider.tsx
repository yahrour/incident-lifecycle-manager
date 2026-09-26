import { useQuery } from "@tanstack/react-query";
import { getMe } from "../services/authService";
import { type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { hasSessionHint } from "@/lib/hasSessionHint";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: hasSessionHint(),
  });

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
