import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { shiftKeys } from "../constants";
import { fetchShift } from "../api/shift";

export function OnCallBanner() {
  const { data, isPending, isError } = useQuery({
    queryKey: shiftKeys.all,
    queryFn: fetchShift,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return (
      <div className="flex items-center rounded-lg border border-l-4 border-border border-l-destructive bg-card px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
            unavailable
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            Couldn't load your on-call status
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Try refreshing the page in a moment.
          </p>
        </div>
      </div>
    );
  }

  const shift = data?.data;

  if (!shift.isOnCall) {
    return (
      <div className="flex items-center rounded-lg border border-l-4 border-border border-l-muted-foreground/40 bg-card px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            off duty
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">
            You're not on call right now
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No active shift.
          </p>
        </div>
      </div>
    );
  }

  const isPrimary = shift.currentShift.position === "PRIMARY";
  const waiting =
    shift.currentShift.incidents.totalUnacknowledgedIncidents > 0
      ? `${shift.currentShift.incidents.totalUnacknowledgedIncidents} incident${shift.currentShift.incidents.totalUnacknowledgedIncidents === 1 ? "" : "s"} waiting on you`
      : "No incidents waiting on you";

  const stats = [
    {
      label: "Assigned",
      value: shift.currentShift.incidents.totalAssignedIncidents,
      warn: false,
    },
    {
      label: "Unacked",
      value: shift.currentShift.incidents.totalUnacknowledgedIncidents,
      warn: shift.currentShift.incidents.totalUnacknowledgedIncidents > 0,
    },
    {
      label: "Escalation",
      value: `${shift.currentShift.team.escalationTimeoutMinutes}m`,
      warn: false,
    },
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
          You are {shift.currentShift.position.toLowerCase()} on{" "}
          {shift.currentShift.team.name}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {waiting} · shift rotates{" "}
          {format(shift.currentShift.endsAt, "MM/dd/yyyy")}
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
