export function LaptopMockup() {
  return (
    <div className="relative w-[min(95vw,1600px)] mt-[clamp(40px,5vw,80px)] max-sm:w-[98vw] max-sm:mt-8">
      {/* Orange glow behind the laptop */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-[50%] pointer-events-none z-0 bg-[radial-gradient(ellipse,rgba(224,100,31,0.12)_0%,rgba(224,100,31,0.04)_40%,transparent_70%)]" />

      <div className="relative z-1">
        {/* Lid */}
        <div className="bg-[#0d0d0d] rounded-t-[24px] p-[20px] pb-0 relative shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset,0_30px_80px_rgba(0,0,0,0.15),0_10px_30px_rgba(0,0,0,0.08)] max-sm:rounded-t-[12px] max-sm:p-[8px] max-sm:pb-0">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[22px] bg-[#0d0d0d] rounded-b-[14px] z-2 flex items-center justify-center after:content-[''] after:w-[6px] after:h-[6px] after:rounded-full after:bg-[#1a1a2e] after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] max-sm:w-[80px] max-sm:h-[14px] max-sm:rounded-b-[8px] max-sm:after:w-[4px] max-sm:after:h-[4px]" />
          {/* Screen */}
          <div className="rounded-t-[8px] overflow-hidden bg-[#1a1a1a] max-sm:rounded-t-[4px]">
            <img src="/landing/screenshot.png" alt="Incident Manager dashboard" className="w-full block" />
          </div>
        </div>

        {/* Hinge */}
        <div className="h-3 bg-[linear-gradient(180deg,#2a2a2a_0%,#3a3a3a_50%,#303030_100%)] relative before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[rgba(255,255,255,0.06)] max-sm:h-1.5" />

        {/* Base */}
        <div className="mx-[-3%] h-3 bg-[linear-gradient(180deg,#333_0%,#2a2a2a_100%)] rounded-b-[8px] relative before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[rgba(255,255,255,0.04)] after:content-[''] after:block after:w-[18%] after:h-1 after:mx-auto after:bg-[#444] after:rounded-b-sm max-sm:h-1.5 max-sm:rounded-b-[4px]" />

        {/* Shadow */}
        <div className="w-[106%] ml-[-3%] h-8 mt-1 bg-[radial-gradient(ellipse,rgba(0,0,0,0.1)_0%,transparent_60%)] max-sm:h-4" />
      </div>
    </div>
  );
}
