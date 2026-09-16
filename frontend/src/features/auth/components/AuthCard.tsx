import type { ReactNode } from "react";
import logo from "@/assets/logo-full.svg";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-5 pt-10">
      <img src={logo} alt="Better Incidents" className="h-25" />
      <div className="flex w-full max-w-lg min-h-[500px] flex-col justify-center gap-8 rounded-xl border bg-card px-8 py-12 text-center [&_h1]:text-2xl [&_h1]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground [&_input]:h-11 [&_button]:h-11">
        {children}
      </div>
    </div>
  );
}
