import { Link } from "react-router";
import { LogoSvg } from "./LogoSvg";

export function LandingNavbar({ variant = "landing" }: { variant?: "landing" | "legal" }) {
  return (
    <nav className="relative z-50 border-b border-[#e8e3dd] bg-[rgba(254,254,254,0.8)] backdrop-blur-[14px]">
      <div className="flex items-center justify-between h-[clamp(56px,3.2vw,72px)] px-[clamp(18px,3vw,42px)]">
        <Link to="/" className="flex items-center gap-2.5 no-underline font-bold text-[15px] text-[#1a1a1a]">
          <LogoSvg className="w-[30px] h-[30px] shrink-0" />
          Better Incidents
        </Link>
        {variant === "landing" ? (
          <div className="flex items-center gap-2">
            <Link to="/login" className="inline-flex items-center px-[17px] py-[9px] rounded-[10px] text-[clamp(13px,calc(0.25vw+12px),15px)] font-semibold no-underline border-[1.5px] border-[#e8e3dd] bg-transparent text-[#1a1a1a] hover:bg-[#faf8f5] transition-all duration-200">
              Log in
            </Link>
            <Link to="/signup" className="inline-flex items-center px-[17px] py-[9px] rounded-[10px] text-[clamp(13px,calc(0.25vw+12px),15px)] font-semibold no-underline bg-[#E0641F] text-white hover:bg-[#c9561a] hover:-translate-y-px transition-all duration-200">
              Sign up
            </Link>
          </div>
        ) : (
          <Link to="/" className="text-[13px] font-semibold text-[#7a7672] no-underline hover:text-[#1a1a1a] transition-colors duration-150">
            ← Back to home
          </Link>
        )}
      </div>
    </nav>
  );
}
