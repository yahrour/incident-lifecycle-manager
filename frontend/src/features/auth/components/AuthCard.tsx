import logo from "../../../assets/logo-full.svg";
import "../auth.css";
// AuthCard.tsx
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <img src={logo} alt="Better Incidents" className="app-logo" />
      <div className="auth-card">{children}</div>
    </div>
  );
}
