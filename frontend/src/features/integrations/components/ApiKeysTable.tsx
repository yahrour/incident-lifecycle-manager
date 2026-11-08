import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Lock, LockOpen } from "lucide-react";
import { StatusDot } from "@/components/StatusDot";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { queryClient } from "@/lib/queryClient";
import { disableApiKey, enableApiKey, fetchApiKeys } from "../api/apiKeys";
import type { ApiKey, ApiKeyFilter } from "../types";
import { DeleteApiKeyDialog } from "./DeleteApiKeyDialog";

function StatusBadge({ apiKey }: { apiKey: ApiKey }) {
  if (apiKey.isExpired)
    return <StatusDot variant="destructive">Expired</StatusDot>;
  if (!apiKey.enabled) return <StatusDot variant="warning">Disabled</StatusDot>;
  return <StatusDot variant="success">Active</StatusDot>;
}

export function ApiKeysTable({ filter }: { filter: ApiKeyFilter }) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: fetchApiKeys,
  });

  const toggleMutation = useMutation({
    mutationFn: (apiKey: ApiKey) =>
      apiKey.enabled ? disableApiKey(apiKey.id) : enableApiKey(apiKey.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "Couldn't update API key",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  useErrorToast(isError, "something went wrong fetching API keys");

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const apiKeys = data?.data;

  if (!apiKeys || apiKeys.length === 0) {
    return (
      <div className="mt-4 text-muted-foreground uppercase text-center font-medium text-sm w-full!">
        No API keys yet
      </div>
    );
  }

  const visibleKeys = apiKeys.filter((apiKey: ApiKey) => {
    if (filter === "active") return apiKey.enabled && !apiKey.isExpired;
    if (filter === "disabled") return !apiKey.enabled;
    return true;
  });

  if (visibleKeys.length === 0) {
    return (
      <div className="mt-4 text-muted-foreground uppercase text-center font-medium text-sm w-full!">
        No {filter} API keys
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="uppercase hover:bg-transparent">
          <TableHead className="w-1/4">name</TableHead>
          <TableHead>key</TableHead>
          <TableHead>status</TableHead>
          <TableHead>created</TableHead>
          <TableHead>expires</TableHead>
          <TableHead className="text-right">actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleKeys.map((apiKey) => {
          const isToggling =
            toggleMutation.isPending &&
            toggleMutation.variables.id === apiKey.id;
          return (
            <TableRow key={apiKey.id}>
              <TableCell className="font-medium text-sm">
                {apiKey.name}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {apiKey.keyPrefix}…
              </TableCell>
              <TableCell>
                <StatusBadge apiKey={apiKey} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(apiKey.createdAt, "PP")}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(apiKey.expiresAt, "PP")}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isToggling}
                    onClick={() => toggleMutation.mutate(apiKey)}
                  >
                    {isToggling ? (
                      <Spinner />
                    ) : apiKey.enabled ? (
                      <Lock />
                    ) : (
                      <LockOpen />
                    )}
                  </Button>
                  <DeleteApiKeyDialog id={apiKey.id} name={apiKey.name} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
