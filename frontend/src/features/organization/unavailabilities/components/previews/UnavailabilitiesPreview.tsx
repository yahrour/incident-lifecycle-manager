import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import { fetchUnavailabilitiesPreview } from "../../api/unavailabilities";
import { teamKeys } from "@/features/organization/shared/constants";
import { InlineErrorState } from "@/components/InlineErrorState";

const formatDay = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    // only show the year when it's not the current one
    ...(d.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
};

export function UnavailabilitiesPreview({ teamId }: { teamId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: teamKeys.unavailabilities(teamId),
    queryFn: () => fetchUnavailabilitiesPreview(teamId),
  });

  // sort by the soonest first
  const items = [...(data?.data ?? [])].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <section className="flex-1 rounded-lg border border-border/50  bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 text-sm font-medium">
        <h2>Unavailabilities</h2>
        <Link
          to={`/manager/teams/${teamId}/unavailabilities`}
          className="hover:underline hover:underline-offset-4"
        >
          Manage
        </Link>
      </div>

      {isPending ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <InlineErrorState
          message="Couldn't load unavailability"
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <p className="px-4 py-3 text-center text-sm text-muted-foreground">
          No time off logged for this team.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item) => {
            const { user } = item.teamMember;

            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`h-8 w-0.5 shrink-0 rounded-full ${
                    item.status === "APPROVED"
                      ? "bg-success"
                      : item.status === "PENDING"
                        ? "bg-warning"
                        : "bg-destructive"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.reason ?? "No reason given"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <Badge
                    variant={
                      item.status === "APPROVED"
                        ? "success"
                        : item.status === "PENDING"
                          ? "warning"
                          : "destructive"
                    }
                    className="uppercase"
                  >
                    {item.status}
                  </Badge>
                  <p className="mt-1 text-xs">
                    {formatDay(item.startDate)} - {formatDay(item.endDate)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
