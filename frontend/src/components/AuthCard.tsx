import type { ReactNode } from "react";
import logo from "@/assets/favicon.ico";

type AuthCardProps = {
  children: ReactNode;
  title: ReactNode; // panel headline, wrap the accent word in <em>
  text: string; // panel paragraph under the headline
};

const timeline = [
  { label: "Created", note: "8 days ago", red: true },
  { label: "Alert received", note: "Firing", red: false },
  { label: "Escalated", note: "8 days ago", red: true },
  { label: "Note added", note: "resolved it", red: false },
];

export function AuthCard({ children, title, text }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel: hidden below lg */}
      <aside className="hidden w-1/2 flex-col justify-between gap-8 bg-[#f1ece4] p-12 lg:flex">
        <p className="font-serif text-2xl italic">
          Incident Lifecycle <span className="text-primary">Manager</span>
        </p>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Incident response
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.05] tracking-[-0.03em] xl:text-5xl [&_em]:font-serif [&_em]:font-normal [&_em]:text-primary">
            {title}
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">{text}</p>
        </div>

        <div className="w-full max-w-sm rounded-2xl border bg-white p-5 shadow-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-[#f6d9cf] px-2 py-0.5 font-mono font-semibold text-[#8a3a22]">
              High
            </span>
            <span className="size-2 rounded-full bg-[#a52a1a]" /> Open
            <span className="text-muted-foreground">cdn-edge</span>
          </div>
          <p className="mt-2 font-semibold">Elevated p99 latency on cdn-edge</p>
          <ul className="mt-3 ml-1 space-y-2 border-l-2 pl-4 text-sm">
            {timeline.map((t) => (
              <li key={t.label} className="relative">
                <span
                  className={`absolute -left-[22px] top-1.5 size-2 rounded-full ${
                    t.red ? "bg-[#a52a1a]" : "bg-[#8a8478]"
                  }`}
                />
                {t.label}{" "}
                <span className="text-muted-foreground">· {t.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          From alert to resolution.
        </p>
      </aside>

      {/* Form side */}
      <main className="bg-card flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
        <img
          src={logo}
          alt="Incident Lifecycle Manager"
          className="h-12 lg:hidden"
        />
        <div className="flex w-full max-w-md flex-col gap-6 lg:max-w-sm [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:tracking-[-0.03em] [&_input]:h-11 [&_button]:h-11">
          {children}
        </div>
      </main>
    </div>
  );
}
