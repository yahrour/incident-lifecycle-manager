import { IncidentsTable } from "../components/IncidentsTable";

export function Incidents() {
  return (
    <>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Incidents</h1>
      </div>
      <div className="p-6 space-y-6">
        <IncidentsTable />
      </div>
    </>
  );
}
