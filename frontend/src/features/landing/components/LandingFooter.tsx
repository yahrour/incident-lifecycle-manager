import { Link } from "react-router";

export function LandingFooter() {
  return (
    <footer className="bg-background py-[18px] shrink-0 relative z-1">
      <div className="flex items-center justify-between flex-wrap gap-2.5 px-[clamp(18px,3vw,42px)] max-sm:flex-col max-sm:text-center">
        <p className="text-xs text-muted-foreground">
          &copy; 2026 Incident Lifecycle Manager
        </p>
        <nav className="flex gap-4 max-sm:justify-center">
          <Link
            to="/privacy"
            className="text-xs text-muted-foreground no-underline font-medium hover:text-foreground transition-colors duration-150"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-xs text-muted-foreground no-underline font-medium hover:text-foreground transition-colors duration-150"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
