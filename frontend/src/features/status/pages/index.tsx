import { useQuery } from "@tanstack/react-query";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { fetchHealth } from "../api/health";
import { StatusRow } from "../components/StatusRow";
import type { Status } from "../types";

export function StatusPage() {
  const { data, isError, isPending } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  const apiStatus: Status = isError ? "outage" : "operational";
  const database = data?.details.database;
  const dbStatus: Status =
    isError || !database
      ? "unknown"
      : database.status === "up"
        ? "operational"
        : "outage";

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-8">
        <h1 className="text-4xl font-medium uppercase">status</h1>
        <div className="rounded-lg border">
          <StatusRow name="API" status={apiStatus} />
          <StatusRow name="Database" status={dbStatus} />
        </div>
      </div>
    </div>
  );
}
