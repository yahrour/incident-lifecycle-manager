import {
  Activity,
  CalendarOff,
  KeyRound,
  Radio,
  Siren,
  Timer,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const FEATURES: Feature[] = [
  {
    icon: Siren,
    title: "Alert to incident, automatically",
    description:
      "Prometheus Alertmanager alerts are ingested, normalised and deduplicated into incidents, then assigned to the primary on-call engineer. A flapping alert stays one incident, not fifty.",
  },
  {
    icon: Activity,
    title: "Rotation and escalation",
    description:
      "Each team runs a round-robin rotation on its own period, with a primary and secondary engineer. If nobody acknowledges within the escalation timeout the incident moves to the secondary, or the team owner.",
  },
  {
    icon: Timer,
    title: "MTTA and MTTR, tracked",
    description:
      "Acknowledgement and resolution times are recorded automatically on every incident, so you can see how fast your team really responds instead of guessing.",
  },
  {
    icon: Radio,
    title: "Live incident updates",
    description:
      "Incidents stream over server-sent events, so acknowledgements, escalations and resolutions appear on open dashboards as they happen.",
  },
  {
    icon: CalendarOff,
    title: "Time off, without the gaps",
    description:
      "Request time off against the rotation and have it approved or rejected. Approved windows are skipped when the on-call chain is resolved, so nobody is paged on holiday.",
  },
  {
    icon: KeyRound,
    title: "Scoped API keys for ingestion",
    description:
      "Issue named keys with an expiry for each alert source. The raw key is shown once at creation, stored only as a hash, and can be disabled without deleting it.",
  },
];
