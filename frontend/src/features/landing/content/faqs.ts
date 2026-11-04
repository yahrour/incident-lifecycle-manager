export const FAQS = [
  {
    question: "What exactly is Incident Lifecycle Manager?",
    answer:
      "The layer between your monitoring and your team. Prometheus alerts come in, get normalised and deduplicated into incidents, and are assigned to whoever is on call — with acknowledgement, escalation and resolution tracked along the way.",
  },
  {
    question: "Which alert sources can I connect?",
    answer:
      "Prometheus Alertmanager. You create a scoped API key on the Integrations page and point an Alertmanager webhook receiver at it.",
  },
  {
    question: "How does deduplication work?",
    answer:
      "Each alert is fingerprinted from its provider, service and title. While an incident with that fingerprint is still open, repeat alerts are attached to it instead of creating a new one — so a flapping alert stays a single incident rather than flooding your queue. Resolving an incident clears the fingerprint, so a later recurrence opens a fresh one.",
  },
  {
    question: "How is the on-call engineer chosen?",
    answer:
      "Every team has its own rotation period and start date. The next engineer in the round-robin becomes primary, the one after becomes secondary. Engineers with approved time off covering the current moment are skipped, and the search wraps around the team.",
  },
  {
    question: "What happens if nobody acknowledges an incident?",
    answer:
      "Once an incident is past the team's escalation timeout without acknowledgement, it is reassigned to the secondary on-call engineer automatically. When there is no secondary, it goes to the team owner. The escalation is recorded on the incident timeline.",
  },
  {
    question: "Do incidents update live?",
    answer:
      "Yes. Changes are streamed over server-sent events, so open dashboards pick up new incidents, acknowledgements, escalations and resolutions without a manual refresh.",
  },
  {
    question: "Who can acknowledge or resolve an incident?",
    answer:
      "Only the engineer it is currently assigned to — that is what keeps ownership unambiguous during an incident. If it needs to move, an SRE can reassign it to another member of the team.",
  },
  {
    question: "What are MTTA and MTTR here?",
    answer:
      "Mean time to acknowledge and mean time to resolve. MTTA is measured from creation to acknowledgement, MTTR from creation to resolution. Both are recorded per incident and shown on the incident and in the incidents table.",
  },
  {
    question: "Can I discuss an incident with my team?",
    answer:
      "Yes. Every incident has a timeline of what happened and a notes thread for what you tried. Notes are attributed to their author, so you have a written record once the incident is resolved.",
  },
  {
    question: "Will I get paged while I'm on holiday?",
    answer:
      "Not if your time off is approved. Only approved unavailability windows are honoured when the on-call chain is resolved, so the rotation steps over you for the duration. Requests start as pending until an SRE approves them.",
  },
  {
    question: "How are API keys handled?",
    answer:
      "The raw key is shown once when you create it and never again — only a SHA-256 hash is stored. Each key is named, carries an expiry, and can be disabled without deleting it.",
  },
  {
    question: "What roles exist, and what can each do?",
    answer:
      "Two. SREs run the organisation in one place: teams, engineers, unavailabilities, integrations, and raising incidents manually. Engineers work the incidents they are assigned — acknowledging, resolving and adding notes.",
  },
  {
    question: "Can a team own more than one service?",
    answer:
      "Yes. Services belong to a team, and alerts routing to a service land on that team's rotation. You can add or remove them at any time from the team's settings.",
  },
  {
    question: "Who can see my incidents?",
    answer:
      "Incidents are visible to the engineer they are assigned to, the team owner, and members of the owning team. Every endpoint is role-guarded on top of that. We do not sell your data — see the privacy policy for the full picture.",
  },
];
