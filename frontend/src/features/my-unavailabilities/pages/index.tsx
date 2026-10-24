import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnavailabilitiesTable } from "../components/tables/UnavailabilitiesTable";
import { useQuery } from "@tanstack/react-query";
import { fetchUserMembership } from "../api/membership";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { NoMembershipState } from "../components/empty-states/NoMembershipState";
import { ErrorUnavailabilitiesState } from "../components/error-states/ErrorUnavailabilitiesState";
import { RequestUnavailabilityDialog } from "../components/dialogs/RequestUnavailabilityDialog";
import { membershipKeys } from "../constants";
import type { UnavailabilityFilter } from "@/types";

export function MyUnavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<UnavailabilityFilter>("all");

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: membershipKeys.all,
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
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
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
              onValueChange={(v: UnavailabilityFilter) => {
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
            <RequestUnavailabilityDialog
              teamId={membership.team.id}
              memberId={membership.memberId}
            />
          </div>
          <UnavailabilitiesTable
            membership={membership}
            filter={filter}
            page={page}
            setPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
