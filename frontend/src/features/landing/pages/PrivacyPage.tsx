import { LandingNavbar } from "../components/LandingNavbar";
import { LandingFooter } from "../components/LandingFooter";

const sections = [
  {
    num: "01",
    title: "Information We Collect",
    content: (
      <>
        <p>When you use Incident Lifecycle Manager, we collect information necessary to provide and improve our service:</p>
        <ul>
          <li><strong>Account information</strong> — name, email address, and role when you sign up or are invited to a team.</li>
          <li><strong>Incident data</strong> — alerts, incidents, acknowledgments, and resolution events generated through the platform.</li>
          <li><strong>Usage data</strong> — pages visited, features used, and performance metrics to improve reliability.</li>
        </ul>
      </>
    ),
  },
  {
    num: "02",
    title: "How We Use Your Information",
    content: (
      <>
        <p>We use collected information to:</p>
        <ul>
          <li>Operate on-call rotation, alert routing, and escalation workflows.</li>
          <li>Calculate and display MTTA and MTTR metrics for your team.</li>
          <li>Send notifications related to incidents and schedule changes.</li>
          <li>Improve platform performance and fix bugs.</li>
        </ul>
      </>
    ),
  },
  {
    num: "03",
    title: "Data Sharing",
    content: (
      <>
        <p>We do not sell your personal data. Information is shared only with:</p>
        <ul>
          <li>Team members within your organization as required by your role and permissions.</li>
          <li>Third-party services necessary to deliver notifications (email, webhooks).</li>
        </ul>
      </>
    ),
  },
  {
    num: "04",
    title: "Data Retention",
    content: <p>Incident data and account information are retained for as long as your account is active. You may request deletion of your data by contacting your team administrator.</p>,
  },
  {
    num: "05",
    title: "Security",
    content: <p>We use industry-standard security measures to protect your data, including encrypted connections (TLS), secure authentication via OAuth 2.0, and access controls based on user roles.</p>,
  },
  {
    num: "06",
    title: "Your Rights",
    content: <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact your organization's administrator or reach out to us directly.</p>,
  },
  {
    num: "07",
    title: "Changes",
    content: <p>We may update this policy from time to time. Significant changes will be communicated through the platform.</p>,
  },
];

export function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#fefefe] text-[#1a1a1a] leading-[1.7]">
      <LandingNavbar variant="legal" />

        <div className="bg-white border-b border-[#e8e3dd] py-[60px] px-7 flex items-center justify-center gap-10 max-sm:py-10 max-sm:px-5">
        <img src="/landing/privacy-hero.gif" alt="" className="w-[120px] h-[120px] object-contain shrink-0" />
        <div className="text-left">
          <h1 className="text-[clamp(28px,4vw,38px)] font-bold tracking-[-0.03em] mb-2.5">Privacy Policy</h1>
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
