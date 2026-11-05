import { IncidentsOverview } from "@/features/incidents";

export function Overview() {
  return (
    <>
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Overview</h1>
      </div>
      <div className="p-6">
        <IncidentsOverview />
      </div>
    </>
  );
}
