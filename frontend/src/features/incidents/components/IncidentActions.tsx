import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { Role } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  acknowledgeIncident,
  addIncidentNote,
  fetchIncidentTeamMembers,
  reassignIncident,
  resolveIncident,
} from "../api/incidents";
import { INCIDENT_STATUS, type IncidentDetails } from "../types";

function refreshIncident(id: string) {
  void queryClient.invalidateQueries({ queryKey: ["incident", id] });
  void queryClient.invalidateQueries({ queryKey: ["incidents"] });
}

function showError() {
  toast.add({ type: "error", title: "Something went wrong" });
}

export function IncidentActions({ incident }: { incident: IncidentDetails }) {
  const { user } = useAuth();
  const isAssignee = incident.assignedToId === user?.id;

  if (isAssignee && incident.status === INCIDENT_STATUS.OPEN) {
    return <AcknowledgeButton id={incident.id} />;
  }

  if (isAssignee && incident.status === INCIDENT_STATUS.ACKNOWLEDGED) {
    return <ResolveButton id={incident.id} />;
  }

  if (
    user?.role === Role.SRE &&
    incident.teamId &&
    incident.status !== INCIDENT_STATUS.RESOLVED
  ) {
    return <ReassignSelect incident={incident} teamId={incident.teamId} />;
  }

  return null;
}

function AcknowledgeButton({ id }: { id: string }) {
  const { mutate, isPending } = useMutation({
    mutationFn: () => acknowledgeIncident(id),
    onSuccess: () => refreshIncident(id),
    onError: showError,
  });

  return (
    <Button onClick={() => mutate()} disabled={isPending}>
      Acknowledge
    </Button>
  );
}

function ResolveButton({ id }: { id: string }) {
  const { mutate, isPending } = useMutation({
    mutationFn: () => resolveIncident(id),
    onSuccess: () => refreshIncident(id),
    onError: showError,
  });

  return (
    <Button onClick={() => mutate()} disabled={isPending}>
      Resolve
    </Button>
  );
}

function ReassignSelect({
  incident,
  teamId,
}: {
  incident: IncidentDetails;
  teamId: string;
}) {
  const { data } = useQuery({
    queryKey: ["incident-team-members", teamId],
    queryFn: () => fetchIncidentTeamMembers(teamId),
  });
  const { mutate, isPending } = useMutation({
    mutationFn: (assigneeId: string) =>
      reassignIncident(incident.id, assigneeId),
    onSuccess: () => refreshIncident(incident.id),
    onError: showError,
  });

  const members = data?.data ?? [];

  return (
    <Select
      value={incident.assignedToId}
      onValueChange={(assigneeId) => {
        if (assigneeId) mutate(assigneeId);
      }}
      disabled={isPending}
    >
      <SelectTrigger className="w-48" aria-label="Reassign incident">
        <SelectValue placeholder="Assign to..." />
      </SelectTrigger>
      <SelectContent>
        {members.map(({ user }) => (
          <SelectItem key={user.id} value={user.id}>
            {user.firstName} {user.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AddNoteForm({ incidentId }: { incidentId: string }) {
  const [content, setContent] = useState("");
  const { mutate, isPending } = useMutation({
    mutationFn: () => addIncidentNote(incidentId, content),
    onSuccess: () => {
      setContent("");
      refreshIncident(incidentId);
    },
    onError: showError,
  });

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutate();
      }}
    >
      <Textarea
        placeholder="Add a note..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
        Add note
      </Button>
    </form>
  );
}
