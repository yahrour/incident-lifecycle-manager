import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/ErrorState";
import { useAuth } from "@/features/auth";
import { fetchShift } from "../../api/shift";
import { shiftKeys } from "../../constants";

export function YourShiftCard() {
  const { user } = useAuth();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: shiftKeys.detail(user?.id ?? ""),
    queryFn: fetchShift,
    refetchInterval: 600_000,
  });

  if (isPending) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border/50 bg-card">
        <ErrorState
          className="h-auto mt-0 py-6"
          onRetry={() => void refetch()}
          title="Unable to load your shift"
          description="We couldn't load your on-call status."
        />
      </div>
    );
  }

  const shift = data?.data?.currentShift;

  if (!shift) {
    return (
      <div className="rounded-lg border border-border/50 border-l-4 border-l-muted-foreground/40 bg-card px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Off duty
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          You're not on call right now
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">No active shift.</p>
      </div>
    );
  }

  const isPrimary = shift.position === "PRIMARY";
  const { totalAssignedIncidents, totalUnacknowledgedIncidents } =
    shift.incidents;

  return (
    <div
      className={`rounded-lg border border-l-4 ${
        isPrimary
          ? "border-destructive/25 border-l-destructive bg-card"
          : "border-border/50 border-l-warning bg-card"
      }`}
    >
      <div
        className={`space-y-3 px-4 py-3 ${isPrimary ? "bg-destructive/5" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            {isPrimary && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
            )}
            <span
              className={`relative inline-flex size-2 rounded-full ${isPrimary ? "bg-destructive" : "bg-warning"}`}
            />
          </span>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${isPrimary ? "text-destructive" : "text-warning"}`}
          >
            {isPrimary ? "On call now" : "Fallback on-call"}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            {isPrimary ? "You're the primary" : "You're the secondary"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            on <span className="font-medium">{shift.team.name}</span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {isPrimary ? "Rotates" : "Starts"}{" "}
          {format(isPrimary ? shift.endsAt : shift.startsAt, "MMM d")}
        </p>

        <p
          className={`text-sm ${totalUnacknowledgedIncidents > 0 ? "font-medium text-destructive" : "text-muted-foreground"}`}
        >
          {totalUnacknowledgedIncidents > 0
            ? `${totalUnacknowledgedIncidents} incident${totalUnacknowledgedIncidents === 1 ? "" : "s"} waiting on you`
            : "No incidents waiting on you"}
        </p>

        <div
          className={`grid grid-cols-3 divide-x rounded-md border bg-card ${isPrimary ? "divide-destructive/20 border-destructive/25" : "divide-border/50 border-border/50"}`}
        >
          <Stat label="Assigned" value={totalAssignedIncidents} />
          <Stat
            label="Unacked"
            value={totalUnacknowledgedIncidents}
            warn={totalUnacknowledgedIncidents > 0}
          />
          <Stat
            label="Escalation"
            value={`${shift.team.escalationTimeoutMinutes}m`}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div className="px-3 py-2 text-center">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`block font-mono text-base leading-tight ${warn ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
