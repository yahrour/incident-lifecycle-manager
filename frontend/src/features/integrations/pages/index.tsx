import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeysTable } from "../components/ApiKeysTable";
import { CreateApiKeyDialog } from "../components/create-api-key-dialog";
import type { ApiKeyFilter } from "../types";

export function Integrations() {
  const [filter, setFilter] = useState<ApiKeyFilter>("all");

  return (
    <div>
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Integrations</h1>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Tabs
            value={filter}
            onValueChange={(v: ApiKeyFilter) => setFilter(v)}
          >
            <TabsList>
              <TabsTrigger value="all" className="cursor-pointer">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="cursor-pointer">
                Active
              </TabsTrigger>
              <TabsTrigger value="disabled" className="cursor-pointer">
                Disabled
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <CreateApiKeyDialog />
        </div>

        <ApiKeysTable filter={filter} />
      </div>
    </div>
  );
}
