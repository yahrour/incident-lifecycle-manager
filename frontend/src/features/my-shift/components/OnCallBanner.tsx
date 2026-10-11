import { format } from "date-fns";

type OnCallBannerProps = {
  teamName: string;
  position: "PRIMARY" | "SECONDARY";
  assigned: number;
  unacked: number;
  escalationMinutes: number;
  shiftEndsAt: string;
};

export function OnCallBanner({
  teamName,
  position,
  assigned,
  unacked,
  escalationMinutes,
  shiftEndsAt,
}: OnCallBannerProps) {
  const isPrimary = position === "PRIMARY";
  const waiting =
    unacked > 0
      ? `${unacked} incident${unacked === 1 ? "" : "s"} waiting on you`
      : "No incidents waiting on you";

  const stats = [
    { label: "Assigned", value: assigned, warn: false },
    { label: "Unacked", value: unacked, warn: unacked > 0 },
    { label: "Escalation", value: `${escalationMinutes}m`, warn: false },
  ];

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-l-4 md:flex-row md:items-stretch ${
        isPrimary
          ? "border-red-200 border-l-red-600 bg-red-50"
          : "border-border border-l-warning bg-card"
      }`}
    >
      <div className="flex-1 px-4 py-3">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider ${isPrimary ? "text-destructive" : "text-warning"}`}
        >
          {isPrimary ? "on call" : "fallback"}
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          You are {position.toLowerCase()} on {teamName}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {waiting} · shift rotates {format(shiftEndsAt, "MM/dd/yyyy")}
        </p>
      </div>

      <div
        className={`flex items-center divide-x px-2 md:border-l border-t md:border-t-0 ${isPrimary ? "divide-red-200 border-red-200" : "divide-border"}`}
      >
        {stats.map((s) => (
          <div key={s.label} className="min-w-24 px-5 py-3 text-right">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </span>
            <span
              className={`block font-mono text-lg leading-tight ${s.warn ? "text-primary" : "text-foreground"}`}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
