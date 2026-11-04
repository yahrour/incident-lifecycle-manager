import type { ReactNode } from "react";

export type LegalSection = {
  title: string;
  content: string[];
  bullets?: ReactNode[];
};

const strong = "font-medium text-foreground";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "Information We Collect",
    content: [
      "When you use Incident Lifecycle Manager, we collect information necessary to provide and improve our service:",
    ],
    bullets: [
      <>
        <strong className={strong}>Account information</strong> — name, email
        address, and role when you sign up or are invited to a team.
      </>,
      <>
        <strong className={strong}>Incident data</strong> — alerts, incidents,
        acknowledgments, and resolution events generated through the platform.
      </>,
      <>
        <strong className={strong}>Usage data</strong> — pages visited, features
        used, and performance metrics to improve reliability.
      </>,
    ],
  },
  {
    title: "How We Use Your Information",
    content: ["We use collected information to:"],
    bullets: [
      "Operate on-call rotation, alert routing, and escalation workflows.",
      "Calculate and display MTTA and MTTR metrics for your team.",
      "Send notifications related to incidents and schedule changes.",
      "Improve platform performance and fix bugs.",
    ],
  },
  {
    title: "Data Sharing",
    content: [
      "We do not sell your personal data. Information is shared only with:",
    ],
    bullets: [
      "Team members within your organization as required by your role and permissions.",
      "Third-party services necessary to deliver notifications (email, webhooks).",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "Incident data and account information are retained for as long as your account is active. You may request deletion of your data by contacting your team administrator.",
    ],
  },
  {
    title: "Security",
    content: [
      "We use industry-standard security measures to protect your data, including encrypted connections (TLS), secure authentication via OAuth 2.0, and access controls based on user roles.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You have the right to access, correct, or delete your personal information. To exercise these rights, contact your organization's administrator or reach out to us directly.",
    ],
  },
  {
    title: "Changes",
    content: [
      "We may update this policy from time to time. Significant changes will be communicated through the platform.",
    ],
  },
];
