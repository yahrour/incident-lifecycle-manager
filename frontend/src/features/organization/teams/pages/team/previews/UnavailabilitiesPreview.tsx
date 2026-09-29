import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import { fetchUnavailabilitiesPreview } from "../../../api/unavailabilities";
import { DEFAULT_PREVIEW_LIMIT } from "@/features/organization/shared/constants";

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
    queryKey: ["unavailabilities", teamId],
    queryFn: () => fetchUnavailabilitiesPreview(teamId, DEFAULT_PREVIEW_LIMIT),
  });

  // sort by the soonest first
  const items = [...(data?.data ?? [])].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <section className="flex-1 rounded-lg border border-border/50  bg-white">
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
            <div key={i} className="h-10 animate-pulse rounded bg-[#f1ece4]" />
          ))}
        </div>
      ) : isError ? (
        <p className="px-4 py-6 text-center text-sm text-[#2a2320]">
          Couldn't load unavailability.{" "}
          <button
            onClick={() => void refetch()}
            className="text-[#e8742c] hover:underline"
          >
            Try again
          </button>
        </p>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
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
                    item.confirmed ? "bg-success" : "bg-warning"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#2a2320]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-[#8a8178]">
                    {item.reason ?? "No reason given"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <Badge
                    variant={item.confirmed ? "success" : "warning"}
                    className={`rounded px-1.5 py-px font-mono text-[10px] uppercase tracking-wide cursor-default`}
                  >
                    {item.confirmed ? "Approved" : "Pending"}
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
