import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { fetchIncident } from "../api/incidents";
import { IncidentsTable } from "../components/IncidentsTable";
import { AddNoteForm, IncidentActions } from "../components/IncidentActions";
import { INCIDENT_STATUS, type IncidentStatus } from "../types";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { StatusDot } from "@/components/StatusDot";
import { severityColor, statusColor, timelineColor } from "../constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { formatMetricDuration } from "../utils";

export function Incidents() {
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  return (
    <>
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Incidents</h1>
      </div>
      <div className="p-6 space-y-6">
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(value as IncidentStatus | "all")}
        >
          <TabsList aria-label="Filter incidents by status">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.values(INCIDENT_STATUS).map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="capitalize cursor-pointer"
              >
                {value}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <IncidentsTable
          key={status}
          status={status === "all" ? undefined : status}
        />
      </div>
    </>
  );
}

export function IncidentsDetails() {
  const { id } = useParams();

  const { data, isError, isPending } = useQuery({
    queryKey: ["incident", id],
    queryFn: () => fetchIncident(id),
    enabled: !!id,
  });
  const incident = data?.data;

  if (isError) return <p className="p-6">Couldn't load this incident</p>;

  if (!id) return <p>Incident not found</p>;

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (!incident) return <p className="p-6">Incident not found</p>;

  return (
    <div className="lg:flex lg:h-svh lg:flex-col">
      <div className="shrink-0 bg-card px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to=".." relative="path" />}>
                Incidents
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{incident.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* severity / status / title */}
      <div className="space-y-6 p-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${severityColor[incident.severity]} capitalize`}>
              {incident.severity}
            </Badge>
            <StatusDot className={statusColor[incident.status]}>
              {incident.status}
            </StatusDot>
            <span className="text-sm text-muted-foreground">
              {incident.service}
            </span>
            <span className="text-sm text-muted-foreground">
              {incident.team?.name ?? "No team"}
            </span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {incident.title}
            </h1>
            <IncidentActions incident={incident} />
          </div>
        </div>
        <dl className="grid shrink-0 gap-px overflow-hidden rounded-lg border bg-border/50 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-card p-4">
            <dt className="text-muted-foreground">Assignee</dt>
            <dd>
              {incident.assignedTo
                ? `${incident.assignedTo.firstName} ${incident.assignedTo.lastName}`
                : "Unassigned"}
            </dd>
          </div>
          <div className="bg-card p-4">
            <dt className="text-muted-foreground">Age</dt>
            <dd>{formatDistanceToNow(incident.createdAt)}</dd>
          </div>
          <div className="bg-card p-4">
            <dt className="text-muted-foreground">MTTA</dt>
            <dd>
              {incident.mttaSeconds != null
                ? formatMetricDuration(incident.mttaSeconds)
                : "—"}
            </dd>
          </div>
          <div className="bg-card p-4">
            <dt className="text-muted-foreground">MTTR</dt>
            <dd>
              {incident.mttrSeconds != null
                ? formatMetricDuration(incident.mttrSeconds)
                : "—"}
            </dd>
          </div>
          <div className="bg-card p-4 sm:col-span-2 lg:col-span-1">
            <dt className="text-muted-foreground">Alerts</dt>
            <dd>{incident.alerts.length}</dd>
          </div>
        </dl>
        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 px-4 lg:col-span-2 lg:overflow-y-auto">
            <section className="space-y-4 border-t pt-6">
              <h2 className="font-semibold justify-between">Timeline</h2>
              <ol className="relative space-y-5 border-l pl-6 text-sm">
                {incident.timeline.map((event) => (
                  <li
                    key={`${event.type}-${event.at}-${event.noteId ?? event.alertId ?? ""}`}
                    className="relative"
                  >
                    <span
                      className={`absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-current ring-4 ring-background ${timelineColor[event.type] ?? "text-muted-foreground"}`}
                    />
                    <p className="font-medium capitalize">
                      {event.type.replaceAll("_", " ")}
                      {event.status && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {event.status}
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground">
                      {event.actor &&
                        `by ${event.actor.firstName} ${event.actor.lastName} · `}
                      <time
                        dateTime={event.at}
                        title={format(event.at, "dd/MM/yyyy HH:mm")}
                      >
                        {formatDistanceToNow(event.at, { addSuffix: true })}
                      </time>
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="space-y-4 border-t pt-6">
              <h2 className="font-semibold">
                Notes{" "}
                <span className="font-normal text-muted-foreground">
                  {incident.notes.length}
                </span>
              </h2>
              {incident.notes.length === 0 && (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
              {incident.notes.map((note) => (
                <article key={note.id} className="flex gap-3 text-sm">
                  <Avatar size="sm">
                    <AvatarFallback>
                      {note.author.firstName[0]}
                      {note.author.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1 rounded-lg border bg-card p-3">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <p className="font-medium">
                        {note.author.firstName} {note.author.lastName}
                      </p>
                      <time
                        dateTime={note.createdAt}
                        title={format(note.createdAt, "dd/MM/yyyy HH:mm")}
                        className="text-xs text-muted-foreground"
                      >
                        {formatDistanceToNow(note.createdAt, {
                          addSuffix: true,
                        })}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap">{note.content}</p>
                  </div>
                </article>
              ))}
              <AddNoteForm incidentId={incident.id} />
            </section>
          </div>
          <div className="min-w-0 space-y-6 px-4 lg:overflow-y-auto">
            <section className="space-y-4 border-t pt-6">
              <h2 className="font-semibold">Dates</h2>
              <dl className="divide-y rounded-lg border bg-card text-sm">
                {(
                  [
                    ["Created", incident.createdAt],
                    ["Updated", incident.updatedAt],
                    ["Acknowledged", incident.acknowledgedAt],
                    ["Escalated", incident.escalatedAt],
                    ["Resolved", incident.resolvedAt],
                  ] as const
                ).map(([label, date]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right tabular-nums">
                      {date ? format(date, "dd/MM/yyyy HH:mm") : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="space-y-3 border-t pt-6">
              <h2 className="font-semibold">Linked alerts</h2>
              {incident.alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No linked alerts.
                </p>
              )}
              {incident.alerts.map((alert) => (
                <div key={alert.id} className="space-y-1 text-sm">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-muted-foreground">
                    {alert.provider} · {alert.severity} · {alert.status}
                  </p>
                  <p className="text-muted-foreground">
                    Occurred {format(alert.occurredAt, "dd/MM/yyyy HH:mm")} ·
                    Received {format(alert.receivedAt, "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
