import logo from "../../../assets/logo-full.svg";
import "../auth.css";
// AuthCard.tsx
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-5 pt-10 min-h-screen">
      <img src={logo} alt="Better Incidents" className="h-25" />
      <div className="flex flex-col gap-6 w-full max-w-[450px] py-12 px-8 bg-(--card) border border-(--border) rounded-xl text-center">
        {children}
      </div>
    </div>
  );
}
