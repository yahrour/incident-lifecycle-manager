import { IncidentsTable } from "../components/IncidentsTable";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { INCIDENT_STATUS, type IncidentStatus } from "../types";

export function Incidents() {
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  return (
    <>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
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
        <IncidentsTable status={status === "all" ? undefined : status} />
      </div>
    </>
  );
}
