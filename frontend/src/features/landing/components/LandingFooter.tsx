import { Link } from "react-router";

export function LandingFooter() {
  return (
    <footer className="bg-[#faf8f5] border-t border-[#e8e3dd] py-3.5 shrink-0 relative z-1">
      <div className="flex items-center justify-between flex-wrap gap-2.5 px-[clamp(18px,3vw,42px)] max-sm:flex-col max-sm:text-center">
        <p className="text-xs text-[#7a7672]">&copy; 2026 Incident Lifecycle Manager</p>
        <nav className="flex gap-4 max-sm:justify-center">
          <Link to="/privacy" className="text-xs text-[#7a7672] no-underline font-medium hover:text-[#1a1a1a] transition-colors duration-150">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-xs text-[#7a7672] no-underline font-medium hover:text-[#1a1a1a] transition-colors duration-150">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
