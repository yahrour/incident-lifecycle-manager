import type { ReactNode } from "react";
import logo from "@/assets/favicon.ico";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <img src={logo} alt="Better Incidents" className="h-20" />
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl border bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10 [&_h1]:text-center [&_h1]:text-2xl [&_h1]:font-semibold [&_input]:h-11 [&_button]:h-11">
        {children}
      </div>
    </div>
  );
}
