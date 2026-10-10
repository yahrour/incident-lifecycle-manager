import { Fragment } from "react";
import { cn } from "@/lib/utils";

type OnCallBannerProps = {
  teamName: string;
  position: "PRIMARY" | "SECONDARY";
  assigned: number;
  unacked: number;
  escalationMinutes: number;
  shiftEndsAt: string; // ISO UTC
};

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `in ${plural(days, "day")}`;
  if (hours >= 1) return `in ${plural(hours, "hour")}`;
  return `in ${plural(Math.max(minutes, 1), "minute")}`;
}

export function OnCallBanner({
  teamName,
  position,
  assigned,
  unacked,
  escalationMinutes,
  shiftEndsAt,
}: OnCallBannerProps) {
  const subtitle = [
    unacked > 0
      ? `${plural(unacked, "incident")} waiting on you`
      : "No incidents waiting on you",
    `shift rotates ${timeUntil(shiftEndsAt)}`,
  ].join(" · ");

  const stats = [
    { label: "Assigned", value: assigned, warn: false },
    { label: "Unacked", value: unacked, warn: unacked > 0 },
    { label: "Escalation", value: `${escalationMinutes}m`, warn: false },
  ];

  const isPrimary = position === "PRIMARY";

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-l-4 md:flex-row md:items-stretch ${isPrimary ? "border-red-200 border-l-red-600 bg-red-50" : "border-border border-l-warning bg-card"}`}
    >
      <div className="flex-1 px-4 py-3">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider ${isPrimary ? "text-destructive" : "text-warning"}`}
        >
          On call
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          You are {position.toLowerCase()} on {teamName}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <dl className="flex items-center border-t px-2 md:border-l md:border-t-0 border-red-200">
        {stats.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 && <div aria-hidden className="h-1/2 w-px bg-red-200" />}
            <div className="min-w-24 px-5 py-3 text-right">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <span
                className={cn(
                  "block font-mono text-lg leading-tight",
                  s.warn ? "text-primary" : "text-foreground"
                )}
              >
                {s.value}
              </span>
            </div>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
