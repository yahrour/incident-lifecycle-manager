import type { LegalSection } from "./privacy";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "Acceptance of Terms",
    content: [
      'By accessing or using Incident Lifecycle Manager ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.',
    ],
  },
  {
    title: "Description of Service",
    content: [
      "Incident Lifecycle Manager is an incident management platform that provides:",
    ],
    bullets: [
      "Alert ingestion and deduplication from monitoring tools (Prometheus).",
      "On-call rotation management with round-robin scheduling.",
      "Automatic escalation of unacknowledged incidents.",
      "Incident lifecycle tracking with MTTA and MTTR metrics.",
      "Team and engineer management with role-based access.",
    ],
  },
  {
    title: "User Accounts",
    content: [
      "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify your team administrator immediately of any unauthorized access. Accounts are created via invitation or sign-up and are subject to role-based permissions (SRE Manager or Engineer).",
    ],
  },
  {
    title: "Acceptable Use",
    content: ["You agree not to:"],
    bullets: [
      "Use the Service for any unlawful purpose.",
      "Attempt to gain unauthorized access to other users' accounts or data.",
      "Interfere with or disrupt the Service or its infrastructure.",
      "Reverse engineer, decompile, or disassemble any part of the Service.",
    ],
  },
  {
    title: "Data Ownership",
    content: [
      "You retain ownership of all incident data, team configurations, and content you create within the Service. We do not claim ownership of your data and will not use it for purposes other than providing the Service.",
    ],
  },
  {
    title: "Service Availability",
    content: [
      "We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      'The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including missed alerts or delayed notifications.',
    ],
  },
  {
    title: "Termination",
    content: [
      "We may suspend or terminate your access to the Service if you violate these terms. You may stop using the Service at any time by contacting your team administrator.",
    ],
  },
  {
    title: "Changes to Terms",
    content: [
      "We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.",
    ],
  },
];
