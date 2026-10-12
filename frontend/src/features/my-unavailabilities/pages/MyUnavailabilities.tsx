import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnavailabilitiesTable } from "../components/UnavailabilitiesTable";
import { SortControls } from "../components/SortControls";
import type { SortState } from "../types";
import { useQuery } from "@tanstack/react-query";
import { fetchUserMembership } from "../api/membership";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function MyUnavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });

  const { data, isPending, isError } = useQuery({
    queryKey: ["membership"],
    queryFn: fetchUserMembership,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <div>failed to fetch, click here try again </div>;
  }

  const membership = data.data;

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>My unavailabilities</BreadcrumbPage>
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
              <TabsTrigger value="pending" className="cursor-pointer">
                Pending
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <SortControls
            sort={sort}
            onSortChange={setSort}
            setPage={setPage}
            filter={filter}
          />
        </div>
        <UnavailabilitiesTable
          membership={membership}
          page={page}
          setPage={setPage}
          sort={sort}
        />
      </div>
    </div>
  );
}
