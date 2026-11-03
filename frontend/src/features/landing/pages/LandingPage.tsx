import { Link } from "react-router";
import { LandingNavbar } from "../components/LandingNavbar";
import { LandingFooter } from "../components/LandingFooter";
import { LandingFeatures } from "../components/LandingFeatures";
import { LandingFaq } from "../components/LandingFaq";
import { FloatingChip } from "../components/FloatingChip";

export function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <LandingNavbar />

      <div className="flex-1 flex flex-col items-center justify-center px-[clamp(24px,4vw,64px)] py-[clamp(48px,6vw,96px)] text-center relative z-1">
        <div className="relative flex w-full max-w-[720px] flex-col items-center">
          <FloatingChip className="-left-[26%] top-[26%] max-lg:hidden">
            paging the on-call engineer
          </FloatingChip>
          <FloatingChip className="-right-[24%] top-[40%] max-lg:hidden">
            incident acknowledged
          </FloatingChip>
          <FloatingChip className="right-[8%] -bottom-[10px] max-sm:hidden">
            resolved in 12m
          </FloatingChip>

          <p className="text-[13px] font-medium tracking-[0.13em] text-muted-foreground uppercase mb-[18px]">
            Currently in early testing
          </p>

          <h1 className="font-heading text-[clamp(44px,6.4vw,76px)] font-semibold leading-[1.06] tracking-[-0.035em] mb-6">
            Incident response,
            <br />
            from alert to{" "}
            <em className="font-script font-normal italic text-[1.12em] tracking-[-0.01em]">
              postmortem
            </em>
          </h1>

          <p className="text-[clamp(17px,1vw+14px,21px)] leading-[1.5] text-muted-foreground max-w-[560px] mb-9">
            Incident Lifecycle Manager takes your Prometheus alerts,
            deduplicates them into incidents and pages the right on-call
            engineer automatically — escalation included. On-call rotation,
            time-off and MTTA / MTTR tracking, all in one place.
          </p>

          <div className="flex flex-wrap gap-3 justify-center max-sm:w-full max-sm:flex-col">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full text-[15px] font-semibold no-underline px-[30px] py-[14px] border-[1.5px] border-border bg-background text-foreground hover:bg-muted transition-all duration-200"
            >
              Log in to your dashboard
            </Link>
          </div>
        </div>
      </div>

      <LandingFeatures />

      <LandingFaq />

      <LandingFooter />
    </div>
  );
}
