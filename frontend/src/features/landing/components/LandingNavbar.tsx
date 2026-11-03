import { Link } from "react-router";
import { Wordmark } from "./Wordmark";

export function LandingNavbar({
  variant = "landing",
}: {
  variant?: "landing" | "legal";
}) {
  return (
    <nav className="relative z-50">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center h-[clamp(64px,4vw,88px)] px-[clamp(18px,3vw,42px)] max-md:flex max-md:justify-between">
        <div className="max-md:hidden" />

        <Link to="/" className="no-underline justify-self-center">
          <Wordmark />
          <span className="sr-only">Incident Lifecycle Manager — home</span>
        </Link>

        {variant === "landing" ? (
          <div className="flex items-center justify-end">
            <Link
              to="/login"
              className="inline-flex items-center rounded-full text-[13px] font-semibold no-underline px-[15px] py-[7px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
            >
              Log in
            </Link>
          </div>
        ) : (
          <Link
            to="/"
            className="justify-self-end text-[13px] font-semibold text-muted-foreground no-underline hover:text-foreground transition-colors duration-150"
          >
            ← Back to home
          </Link>
        )}
      </div>
    </nav>
  );
}
