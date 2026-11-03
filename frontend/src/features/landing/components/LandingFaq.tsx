import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What exactly is Incident Lifecycle Manager?",
    answer:
      "The layer between your monitoring and your team. Prometheus alerts come in, get normalised and deduplicated into incidents, and are paged to whoever is on call — with acknowledgement, escalation and resolution tracked along the way.",
  },
  {
    question: "Which alert sources can I connect?",
    answer:
      "Prometheus Alertmanager is the supported integration today. You generate a scoped API key from the Integrations page and point Alertmanager's webhook receiver at it. Other providers are on the roadmap.",
  },
  {
    question: "How does deduplication actually work?",
    answer:
      "Each alert is fingerprinted from its provider, service and title. While an incident with that fingerprint is still open, repeat alerts are attached to it rather than creating a new incident — so a flapping alert stays one incident instead of flooding your queue.",
  },
  {
    question: "What happens if nobody acknowledges an incident?",
    answer:
      "Once an incident sits unacknowledged past your team's escalation timeout, it is reassigned to the secondary on-call engineer automatically. If there is no secondary, it goes to the team owner. Escalation is recorded on the incident timeline.",
  },
  {
    question: "How is on-call rotation decided?",
    answer:
      "Every team has its own rotation period and start date. The next engineer in the round-robin becomes primary, and the one after becomes secondary. Engineers with approved time off covering the current moment are skipped.",
  },
  {
    question: "Will I get paged while I'm on holiday?",
    answer:
      "Not if your time off is approved. Unavailability windows with an approved status are filtered out when the on-call chain is resolved, so the rotation steps over you for the duration.",
  },
  {
    question: "What are MTTA and MTTR here?",
    answer:
      "Mean time to acknowledge and mean time to resolve. Both are recorded per incident — MTTA from creation to acknowledgement, MTTR from creation to resolution — and shown on each incident and in the incidents table.",
  },
  {
    question: "Can I discuss an incident with my team?",
    answer:
      "Yes. Incidents have both a timeline and a notes thread. Notes are attributed to their author, so after an incident resolves you have a written record of what was tried, in order.",
  },
  {
    question: "How are API keys handled?",
    answer:
      "Keys are hashed with SHA-256 before being stored, so the raw value is only ever shown once at creation. Each key is named, can carry an expiry, and can be disabled without deleting it.",
  },
  {
    question: "What roles exist, and what can each do?",
    answer:
      "Two: SRE and engineer. SREs own the organisation side — teams, engineers, unavailabilities, integrations and manual incident creation. Engineers see their incidents and can acknowledge, resolve and add notes.",
  },
  {
    question: "Can a team own more than one service?",
    answer:
      "Yes. Services are attached to a team, so alerts routed to a given service land on that team's rotation. You can edit the list at any time from the team's settings.",
  },
  {
    question: "Is my incident data private?",
    answer:
      "Incidents are scoped to the team and organisation that owns them, and every endpoint is role-guarded. We do not sell your data — see the privacy policy for the full picture.",
  },
];

export function LandingFaq() {
  return (
    <section className="border-t border-border bg-background px-[clamp(24px,4vw,64px)] py-[clamp(56px,7vw,104px)]">
      <div className="mx-auto max-w-[820px]">
        <p className="text-[13px] font-medium tracking-[0.13em] text-muted-foreground uppercase mb-[14px]">
          FAQ
        </p>
        <h2 className="font-heading text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground mb-[clamp(36px,4vw,56px)]">
          Common questions
        </h2>

        <Accordion className="border-t border-border">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={index}
              className="border-b border-border"
            >
              <AccordionTrigger className="items-center py-5 text-[15px] font-medium text-foreground hover:no-underline sm:text-[16px]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 pr-8 text-[15px] text-muted-foreground">
                <p className="leading-[1.65]">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
