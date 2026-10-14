import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SortControls } from "../../components/SortControls";
import { useState } from "react";
import type { Filter, SortState } from "../../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllUnavailabilitiesTable } from "../../components/tables/AllUnavailabilitiesTable";

export function AllUnavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Unavailabilities</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between">
          <Tabs
            value={filter}
            onValueChange={(v: "all" | "pending") => {
              setFilter(v);
              setPage(1);
              if (v === "pending") {
                setSort({
                  field: "createdAt",
                  order: "desc",
                });
              }
            }}
          >
            <TabsList>
                <TabsTrigger value="all" className="cursor-pointer">
                  All
                </TabsTrigger>
                <TabsTrigger value="approved" className="cursor-pointer">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="pending" className="cursor-pointer">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="rejected" className="cursor-pointer">
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="expired" className="cursor-pointer">
                  Expired
                </TabsTrigger>
              </TabsList>
          </Tabs>
          <SortControls
            sort={sort}
            onSortChange={setSort}
            setPage={setPage}
          />
        </div>
        <AllUnavailabilitiesTable
          sort={sort}
          page={page}
          setPage={setPage}
          filter={filter}
        />
      </div>
    </div>
  );
}
