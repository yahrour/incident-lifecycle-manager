import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { fetchTeam } from "../../../shared/api/teams";
import { useErrorToast } from "@/hooks/use-error-toast";
import { TeamNotFound } from "../../../shared/components/empty-states/TeamNotFound";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamUnavailabilitiesTable } from "../../components/tables/TeamUnavailabilitiesTable";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { teamKeys } from "@/features/organization/shared/constants";
import type { UnavailabilityFilter } from "@/types";
import { Page } from "@/components/Page";

export function TeamUnavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<UnavailabilityFilter>("all");
  const { id: teamId } = useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: teamKeys.detail(teamId as string),
    queryFn: () => fetchTeam(teamId as string),
  });

  useErrorToast(isError, "team doesn't exist");

  if (isPending) {
    return <FullPageSpinner />;
  }

  const team = data?.data;

  if (!team) {
    return <TeamNotFound />;
  }

  return (
    <Page
      header={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/manager/teams" />}>
                Teams
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to={`/manager/teams/${team.id}`} />}
              >
                {team.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>unavailabilities</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
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
      </div>
      <TeamUnavailabilitiesTable
        teamId={team.id}
        page={page}
        setPage={setPage}
        filter={filter}
      />
    </Page>
  );
}
