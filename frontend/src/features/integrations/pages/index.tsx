import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeysTable } from "../components/ApiKeysTable";
import { CreateApiKeyDialog } from "../components/create-api-key-dialog";
import { SortControls } from "../components/SortControls";
import type { ApiKeyFilter, SortState } from "../types";

export function Integrations() {
  const [filter, setFilter] = useState<ApiKeyFilter>("all");
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });

  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Integrations</h1>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-medium text-sm">API keys</h2>
            <p className="text-xs text-muted-foreground">
              Monitoring tools send alerts with a key in the x-api-key header.
            </p>
          </div>
          <CreateApiKeyDialog />
        </div>

        <div className="flex justify-between">
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
          <SortControls sort={sort} onSortChange={setSort} />
        </div>

        <ApiKeysTable filter={filter} sort={sort} />
      </div>
    </div>
  );
}
