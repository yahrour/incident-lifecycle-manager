import { StatusDot } from "@/components/StatusDot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, isSameDay, subDays } from "date-fns";
import { Link } from "react-router";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from "recharts";
import { fetchIncidents } from "../api/incidents";
import { statusColor } from "../constants";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUS,
  type IncidentStatus,
} from "../types";
import { IncidentsTable } from "./IncidentsTable";

const createdConfig = {
  count: { label: "Incidents", color: "var(--chart-1)" },
} satisfies ChartConfig;

const severityConfig = {
  count: { label: "Open" },
} satisfies ChartConfig;

function StatusCount({ status }: { status: IncidentStatus }) {
  const { data, isError } = useQuery({
    queryKey: ["incidents", status, "count"],
    queryFn: () => fetchIncidents(status, undefined, 1),
  });

  return (
    <Card>
      <CardHeader>
        <StatusDot className={statusColor[status]}>{status}</StatusDot>
        {isError ? (
          <p className="text-xs text-destructive">Couldn't load</p>
        ) : (
          <CardTitle className="text-2xl">{data?.meta?.total ?? "–"}</CardTitle>
        )}
      </CardHeader>
    </Card>
  );
}

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
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
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
  const chartData = INCIDENT_SEVERITIES.map((severity, i) => ({
    severity,
    count: counts[i]?.data?.meta?.total ?? 0,
    fill: `var(--severity-${severity}-fg)`,
  })).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Open by severity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={severityConfig} className="h-48 w-full">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              dataKey="severity"
              type="category"
              tickLine={false}
              axisLine={false}
              className="capitalize"
              width={64}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function IncidentsOverview() {
  const { data } = useQuery({
    queryKey: ["incidents", INCIDENT_STATUS.OPEN, "count"],
    queryFn: () => fetchIncidents(INCIDENT_STATUS.OPEN, undefined, 1),
  });
  const total = data?.meta?.total;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.values(INCIDENT_STATUS).map((status) => (
          <StatusCount key={status} status={status} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <IncidentsCreatedChart />
        <OpenBySeverityChart />
      </div>
      <div className="space-y-3">
        {total === 0 ? (
          <h2 className="font-medium text-sm">Nothing needs attention</h2>
        ) : (
          <>
            <h2 className="font-medium text-sm">Needs attention</h2>
            <IncidentsTable status={INCIDENT_STATUS.OPEN} />
          </>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">Latest incidents</h2>
          <Link
            to="../incidents"
            relative="path"
            className="text-xs text-muted-foreground hover:underline"
          >
            All {"→"}
          </Link>
        </div>
        <IncidentsTable />
      </div>
    </div>
  );
}
