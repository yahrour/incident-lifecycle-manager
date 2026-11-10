import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, isSameDay, subDays } from "date-fns";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { fetchIncidents } from "../api/incidents";
import { INCIDENT_SEVERITIES, INCIDENT_STATUS } from "../types";
import { IncidentsTable } from "./IncidentsTable";
import { RowStats } from "./RowStats";
import { teamKeys } from "@/features/organization";
import { fetchMetrics } from "@/features/organization/teams";

const createdConfig = {
  count: { label: "Incidents", color: "var(--chart-1)" },
} satisfies ChartConfig;

function IncidentsCreatedChart() {
  const { data } = useQuery({
    queryKey: ["incidents", "latest", 100],
    queryFn: () => fetchIncidents(undefined, undefined, 100),
  });
  const incidents = data?.data ?? [];
  const days = Array.from({ length: 14 }, (_, i) =>
    subDays(new Date(), 13 - i)
  );
  const chartData = days.map((day) => ({
    day: format(day, "MMM d"),
    count: incidents.filter((incident) =>
      isSameDay(new Date(incident.createdAt), day)
    ).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Incidents created</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={createdConfig} className="h-48 w-full">
          <AreaChart data={chartData}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis allowDecimals={false} width={24} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="count"
              type="monotone"
              stroke="var(--color-count)"
              fill="var(--color-count)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function OpenBySeverityChart() {
  const counts = useQueries({
    queries: INCIDENT_SEVERITIES.map((severity) => ({
      queryKey: ["incidents", INCIDENT_STATUS.OPEN, severity, "count"],
      queryFn: () =>
        fetchIncidents(INCIDENT_STATUS.OPEN, undefined, 1, severity),
    })),
  });
  const rows = INCIDENT_SEVERITIES.map((severity, i) => ({
    severity,
    count: counts[i]?.data?.meta?.total ?? 0,
  })).reverse();
  const total = rows.reduce((sum, { count }) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Open by severity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ severity, count }) => (
          <Progress
            key={severity}
            value={total ? (count / total) * 100 : 0}
            className="gap-1.5 [&_[data-slot=progress-indicator]]:bg-(--bar)"
            style={
              { "--bar": `var(--severity-${severity}-fg)` } as CSSProperties
            }
          >
            <ProgressLabel className="text-xs capitalize">
              {severity}
            </ProgressLabel>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {count}
            </span>
          </Progress>
        ))}
      </CardContent>
    </Card>
  );
}

export function IncidentsOverview() {
  const { data } = useQuery({
    queryKey: teamKeys.metrics(),
    queryFn: fetchMetrics,
  });
  const [open, acknowledged, resolved] = useQueries({
    queries: Object.values(INCIDENT_STATUS).map((status) => ({
      queryKey: ["incidents", status, "count"],
      queryFn: () => fetchIncidents(status, undefined, 1),
    })),
  });

  const total = open?.data?.meta?.total;
  const teamsMetrics = data?.data?.organization;
  return (
    <div className="space-y-4">
      <RowStats
        openIncidents={total ?? "–"}
        acknowledgedIncidents={acknowledged?.data?.meta?.total ?? "–"}
        resolvedIncidents={resolved?.data?.meta?.total ?? "–"}
        totalTeam={teamsMetrics?.totalTeams ?? "-"}
        awayNowCount={teamsMetrics?.activeUnavailabilities ?? "-"}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr] *:min-w-0">
        <IncidentsCreatedChart />
        <OpenBySeverityChart />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {total === 0 ? "Nothing needs attention" : "Needs attention"}
          </CardTitle>
        </CardHeader>
        {total !== 0 && (
          <CardContent>
            <IncidentsTable status={INCIDENT_STATUS.OPEN} compact />
          </CardContent>
        )}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Latest incidents</CardTitle>
          <CardAction>
            <Link
              to="../incidents"
              relative="path"
              className="text-xs text-muted-foreground hover:underline"
            >
              All {"→"}
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <IncidentsTable compact />
        </CardContent>
      </Card>
    </div>
  );
}
