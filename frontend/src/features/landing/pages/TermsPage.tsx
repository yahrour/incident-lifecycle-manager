import { LandingNavbar } from "../components/LandingNavbar";
import { LandingFooter } from "../components/LandingFooter";

const sections = [
  { num: "01", title: "Acceptance of Terms", content: <p>By accessing or using Incident Lifecycle Manager ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p> },
  {
    num: "02", title: "Description of Service", content: (
      <>
        <p>Incident Lifecycle Manager is an incident management platform that provides:</p>
        <ul>
          <li>Alert ingestion and deduplication from monitoring tools (Prometheus).</li>
          <li>On-call rotation management with round-robin scheduling.</li>
          <li>Automatic escalation of unacknowledged incidents.</li>
          <li>Incident lifecycle tracking with MTTA and MTTR metrics.</li>
          <li>Team and engineer management with role-based access.</li>
        </ul>
      </>
    ),
  },
  { num: "03", title: "User Accounts", content: <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify your team administrator immediately of any unauthorized access. Accounts are created via invitation or sign-up and are subject to role-based permissions (SRE Manager or Engineer).</p> },
  {
    num: "04", title: "Acceptable Use", content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose.</li>
          <li>Attempt to gain unauthorized access to other users' accounts or data.</li>
          <li>Interfere with or disrupt the Service or its infrastructure.</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
        </ul>
      </>
    ),
  },
  { num: "05", title: "Data Ownership", content: <p>You retain ownership of all incident data, team configurations, and content you create within the Service. We do not claim ownership of your data and will not use it for purposes other than providing the Service.</p> },
  { num: "06", title: "Service Availability", content: <p>We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.</p> },
  { num: "07", title: "Limitation of Liability", content: <p>The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including missed alerts or delayed notifications.</p> },
  { num: "08", title: "Termination", content: <p>We may suspend or terminate your access to the Service if you violate these terms. You may stop using the Service at any time by contacting your team administrator.</p> },
  { num: "09", title: "Changes to Terms", content: <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p> },
];

export function TermsPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#fefefe] text-[#1a1a1a] leading-[1.7]">
      <LandingNavbar variant="legal" />

        <div className="bg-white border-b border-[#e8e3dd] py-[60px] px-7 flex items-center justify-center gap-10 max-sm:py-10 max-sm:px-5">
        <img src="/landing/terms-hero.gif" alt="" className="w-[120px] h-[120px] object-contain shrink-0" />
        <div className="text-left">
          <h1 className="text-[clamp(28px,4vw,38px)] font-bold tracking-[-0.03em] mb-2.5">Terms of Service</h1>
          <p className="text-sm text-[#7a7672]">Last updated: October 29, 2026</p>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-7 pt-12 pb-20 max-sm:px-5 max-sm:pt-8 max-sm:pb-15">
        {sections.map((s, i) => (
          <div key={s.num} className={`mb-10 pb-10 ${i < sections.length - 1 ? "border-b border-[#e8e3dd]" : ""}`}>
            <div className="flex items-baseline gap-3.5 mb-3.5 max-sm:flex-col max-sm:gap-1.5">
              <span className="text-[28px] font-bold text-[rgba(224,100,31,0.15)] shrink-0 tabular-nums leading-none tracking-[-0.02em]">{s.num}</span>
              <h2 className="text-lg font-bold tracking-[-0.01em]">{s.title}</h2>
            </div>
            <div className="[&_p]:text-[15px] [&_p]:text-[#444] [&_p]:mb-3.5 [&_ul]:mb-3.5 [&_ul]:pl-0 [&_ul]:list-none [&_li]:text-[15px] [&_li]:text-[#444] [&_li]:py-2 [&_li]:pl-5 [&_li]:relative [&_li]:border-b [&_li]:border-[rgba(0,0,0,0.04)] [&_li:last-child]:border-b-0 [&_li_strong]:text-[#1a1a1a]">
              {s.content}
            </div>
          </div>
        ))}
      </div>

      <LandingFooter />
    </div>
  );
}
