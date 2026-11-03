import {
  Activity,
  CalendarOff,
  KeyRound,
  Siren,
  Timer,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Siren,
    title: "Alert to incident, automatically",
    description:
      "Prometheus Alertmanager alerts are ingested, normalised and deduplicated into incidents, so a flapping alert becomes one incident — not fifty.",
    tone: "bg-blue-50 text-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Escalation that doesn't wait",
    description:
      "Leave an incident unacknowledged past the team's escalation timeout and it's reassigned to the secondary — or the team owner — automatically.",
    tone: "bg-violet-50 text-violet-500",
  },
  {
    icon: KeyRound,
    title: "Scoped API keys for ingestion",
    description:
      "Issue named, expiring keys for your alert sources. Every key is hashed at rest and can be disabled the moment you need to revoke it.",
    tone: "bg-amber-50 text-amber-500",
  },
  {
    icon: Activity,
    title: "Round-robin on-call rotation",
    description:
      "Every team runs its own rotation on a configurable period. Engineers marked unavailable are skipped, so the page reaches someone who can act.",
    tone: "bg-rose-50 text-rose-500",
  },
  {
    icon: Timer,
    title: "MTTA and MTTR, tracked",
    description:
      "Acknowledgement and resolution times are recorded per incident, so you can see how fast your team really responds instead of guessing.",
    tone: "bg-sky-50 text-sky-500",
  },
  {
    icon: CalendarOff,
    title: "Time off, without the gaps",
    description:
      "Request time off against the rotation. Approved unavailabilities are factored in when the on-call chain is resolved, so nobody is paged on holiday.",
    tone: "bg-emerald-50 text-emerald-500",
  },
];

export function LandingFeatures() {
  return (
    <section className="border-t border-border bg-muted/40 px-[clamp(24px,4vw,64px)] py-[clamp(56px,7vw,104px)]">
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-[620px]">
          <p className="text-[13px] font-medium tracking-[0.13em] text-muted-foreground uppercase mb-[14px]">
            What you get
          </p>
          <h2 className="font-heading text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
            Everything an on-call team needs
          </h2>
          <p className="mt-4 text-[clamp(16px,1vw+13px,18px)] leading-[1.55] text-muted-foreground">
            Not a monitoring tool — the layer that turns your alerts into
            acknowledged, resolved incidents.
          </p>
        </div>

        <ul className="mt-[clamp(36px,4vw,60px)] grid list-none gap-[clamp(16px,1.6vw,24px)] p-0 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_28px_-20px_rgba(0,0,0,0.12)] sm:p-8"
            >
              <span
                className={`mb-7 flex size-11 items-center justify-center rounded-[14px] ${feature.tone}`}
              >
                <feature.icon className="size-5" aria-hidden="true" />
              </span>

              <h3 className="font-heading text-[17px] font-semibold tracking-[-0.01em] text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-[1.6] text-muted-foreground">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
