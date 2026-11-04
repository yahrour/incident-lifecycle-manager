import type { LegalSection } from "../content/privacy";

export function LegalArticle({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <header className="border-b border-border px-6 py-6 sm:px-8 md:py-8">
        <div className="mx-auto max-w-180">
          <h1 className="font-heading text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {updated}
          </p>
        </div>
      </header>

      <div className="flex-1 px-6 pt-10 pb-16 sm:px-8 md:pt-12 md:pb-20">
        <div className="mx-auto max-w-180">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className={
                index < sections.length - 1
                  ? "mb-10 border-b border-border pb-10"
                  : ""
              }
            >
              <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-foreground">
                {section.title}
              </h2>

              {section.content.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-[15px] text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li
                      key={bulletIndex}
                      className="text-[15px] text-muted-foreground"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
