import { Link } from "react-router";

const FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

export function Footer() {
  return (
    <footer className="relative z-1 shrink-0 py-4.5 flex flex-wrap items-center justify-between gap-2.5 px-4.5 max-sm:flex-col max-sm:text-center">
      <p className="text-xs text-muted-foreground">
        &copy; 2026 Incident Lifecycle Manager
      </p>
      <nav className="flex gap-4 max-sm:justify-center">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-xs font-medium text-muted-foreground no-underline transition-colors duration-150 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
