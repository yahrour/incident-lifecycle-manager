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
import { fetchTeam } from "../../shared/api/teams";
import { useErrorToast } from "@/hooks/use-error-toast";
import { Spinner } from "@/components/ui/spinner";
import { TeamNotFound } from "../../shared/components/TeamNotFound";
import { SortControls } from "../components/SortControls";
import { useState } from "react";
import type { SortState } from "../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnavailabilitiesTable } from "../components/tables/UnavailabilitiesTable";

export function Unavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "desc",
  });
  const { id: teamId } = useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeam(teamId as string),
  });

  useErrorToast(isError, "team doesn't exist");

  if (isPending) {
    return (
      <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
    );
  }

  const team = data?.data;

  if (!team) {
    return <TeamNotFound />;
  }

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
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
      </div>

      <div className="p-6 space-y-4">
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
          teamId={team.id}
          sort={sort}
          page={page}
          setPage={setPage}
          filter={filter}
        />
      </div>
    </div>
  );
}
