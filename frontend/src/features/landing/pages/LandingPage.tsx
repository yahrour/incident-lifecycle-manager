import { Link } from "react-router";
import { Footer } from "../components/Footer";
import { LandingFeatures } from "../components/LandingFeatures";
import { LandingFaq } from "../components/LandingFaq";

const HERO_CHIPS = [
  {
    label: "paging the on-call engineer",
    position: "-left-[26%] top-[26%] max-lg:hidden",
  },
  {
    label: "incident acknowledged",
    position: "-right-[24%] top-[40%] max-lg:hidden",
  },
  {
    label: "resolved in 12m",
    position: "left-[8%] -bottom-[50px] max-sm:hidden",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground [--navbar-height:3.75rem] md:[--navbar-height:4.75rem]">
      <nav className="relative z-50 flex h-(--navbar-height) items-center justify-center px-6 sm:px-8">
        <Link
          to="/"
          className="font-script text-2xl leading-none tracking-[-0.02em] text-foreground no-underline md:text-3xl"
        >
          Incident Lifecycle <span className="text-primary">Manager</span>
        </Link>
      </nav>

      <div className="relative flex min-h-[calc(100svh-var(--navbar-height))] flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:px-8 md:py-16 lg:py-20">
        <div className="relative flex w-full max-w-180 flex-col items-center">
          {HERO_CHIPS.map(({ label, position }) => (
            <span
              key={label}
              className={`absolute z-2 inline-flex items-center rounded-[14px] border border-border bg-secondary px-4.5 py-3 text-[15px] font-medium whitespace-nowrap text-secondary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05),0_5px_12px_rgba(0,0,0,0.06)] select-none ${position}`}
            >
              {label}
            </span>
          ))}

          <h1 className="mb-6 font-heading text-4xl font-semibold leading-[1.06] tracking-[-0.035em] sm:text-5xl lg:text-6xl xl:text-7xl">
            Incident response,
            <br />
            from alert to{" "}
            <span className="font-script text-[1.12em] font-normal italic tracking-[-0.01em]">
              resolution
            </span>
          </h1>

          <p className="mb-9 max-w-140 text-lg text-muted-foreground sm:text-xl">
            Incident Lifecycle Manager ingests your Prometheus alerts,
            deduplicates them into incidents and routes each one to the engineer
            on call. Escalation, rotation, time off and MTTA / MTTR tracking,
            all in one place.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-[15px] font-semibold text-white no-underline transition-colors duration-200 hover:bg-primary/90"
          >
            Log in to your dashboard
          </Link>
        </div>
      </div>

      <LandingFeatures />
      <LandingFaq />
      <Footer />
    </div>
  );
}
