import { FEATURES } from "../content/features";
import { Section } from "./Section";

export function LandingFeatures() {
  return (
    <Section
      eyebrow="What you get"
      title="Everything an on-call team needs"
      intro="Not a monitoring tool — the layer that turns your alerts into acknowledged, resolved incidents."
    >
      <ul className="mt-10 grid list-none gap-x-8 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-14">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex flex-col">
            <span className="mb-7 flex size-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="font-heading text-[17px] font-semibold tracking-[-0.01em] text-foreground">
              {title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-muted-foreground">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
