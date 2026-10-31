import { Link } from "react-router";
import { LandingNavbar } from "../components/LandingNavbar";
import { LandingFooter } from "../components/LandingFooter";
import { LaptopMockup } from "../components/LaptopMockup";

export function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col overflow-hidden bg-[#fefefe] text-[#1a1a1a]">
      <LandingNavbar />

      <div className="flex-1 flex flex-col items-center justify-center px-[clamp(24px,4vw,64px)] text-center overflow-hidden relative z-1">
        <h1 className="text-[clamp(44px,5.5vw,84px)] font-bold leading-[1.12] tracking-[-0.03em] mb-5 whitespace-nowrap max-sm:whitespace-normal max-sm:text-[32px]">
          Reliable incident response starts here
        </h1>

        <p className="text-[clamp(20px,1.2vw+16px,28px)] text-[#7a7672] max-w-[min(900px,80vw)] mb-10 leading-relaxed">
          Manage incidents end-to-end — from alert to resolution — with automated on-call rotation, smart escalation, and real-time MTTA &amp; MTTR tracking.
        </p>

        <div className="flex gap-3.5 max-sm:flex-col">
          <Link to="/signup" className="inline-flex items-center px-10 py-4 rounded-xl text-base font-semibold no-underline bg-[#E0641F] text-white hover:bg-[#c9561a] hover:-translate-y-px transition-all duration-200">
            Get started
          </Link>
          <Link to="/login" className="inline-flex items-center px-10 py-4 rounded-xl text-base font-semibold no-underline border-[1.5px] border-[#e8e3dd] bg-transparent text-[#1a1a1a] hover:bg-[#faf8f5] transition-all duration-200">
            Log in
          </Link>
        </div>

        <LaptopMockup />
      </div>

      <LandingFooter />
    </div>
  );
}
