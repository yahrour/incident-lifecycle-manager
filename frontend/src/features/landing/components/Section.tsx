import type { ReactNode } from "react";

export function Section({
  eyebrow,
  title,
  intro,
  width = "wide",
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  width?: "wide" | "prose";
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border px-6 py-16 sm:px-8 md:py-20 lg:py-24">
      <div
        className={
          width === "prose" ? "mx-auto max-w-205" : "mx-auto max-w-270"
        }
      >
        <div className="max-w-155">
          <p className="mb-3.5 text-[13px] font-medium tracking-[0.13em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h2 className="font-heading text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          {intro && (
            <p className="mt-4 text-base leading-[1.55] text-muted-foreground sm:text-lg">
              {intro}
            </p>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}
