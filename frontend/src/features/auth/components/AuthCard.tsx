import logo from "../../../assets/logo-full.svg";
import "../auth.css";
// AuthCard.tsx
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-5 pt-10 min-h-screen">
      <img src={logo} alt="Better Incidents" className="h-25" />
      <div className="flex w-full max-w-[450px] flex-col gap-6 rounded-xl border bg-card px-8 py-12 text-center [&_h1]:text-2xl [&_h1]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
