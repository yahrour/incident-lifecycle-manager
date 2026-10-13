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
import type { Filter, SortState } from "../types";
import { useQuery } from "@tanstack/react-query";
import { fetchUserMembership } from "../api/membership";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { NoMembershipState } from "../components/NoMembershipState";
import { ErrorUnavailabilitiesState } from "../components/ErrorUnavailabilitiesState";

export function MyUnavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["membership"],
    queryFn: fetchUserMembership,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return (
      <ErrorUnavailabilitiesState
        onRetry={() => void refetch()}
        description="We couldn't load your team. Please try again."
      />
    );
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
      {!membership ? (
        <NoMembershipState />
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex justify-between">
            <Tabs
              value={filter}
              onValueChange={(v: Filter) => {
                setFilter(v);
                setPage(1);
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
          <UnavailabilitiesTable
            membership={membership}
            filter={filter}
            page={page}
            setPage={setPage}
            sort={sort}
          />
        </div>
      )}
    </div>
  );
}
