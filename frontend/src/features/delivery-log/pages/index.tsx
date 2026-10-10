import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryLogTable } from "../components/DeliveryLogTable";
import { SortControls } from "../components/SortControls";
import type { AlertFilter, SortState } from "../types";

export function DeliveryLog() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [sort, setSort] = useState<SortState>({
    field: "receivedAt",
    order: "desc",
  });

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Delivery log</h1>
      </div>

      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Tabs
            value={filter}
            onValueChange={(v: AlertFilter) => {
              setFilter(v);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all" className="cursor-pointer">
                All
              </TabsTrigger>
              <TabsTrigger value="firing" className="cursor-pointer">
                Firing
              </TabsTrigger>
              <TabsTrigger value="resolved" className="cursor-pointer">
                Resolved
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <SortControls sort={sort} onSortChange={setSort} setPage={setPage} />
        </div>
        <DeliveryLogTable
          sort={sort}
          page={page}
          setPage={setPage}
          filter={filter}
        />
      </div>
    </div>
  );
}
