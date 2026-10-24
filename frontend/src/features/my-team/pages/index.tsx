import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/features/auth";
import { useQuery } from "@tanstack/react-query";
import { teamKeys } from "../constants";
import { fetchMyTeam } from "../api/team";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { ErrorState } from "@/components/ErrorState";
import { NoMembershipState } from "../components/NoMembershipState";
import { TeamDetails } from "../components/TeamDetails";
import { Page } from "@/components/Page";

export function MyTeam() {
  const { user } = useAuth();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: teamKeys.detail(user?.id ?? ""),
    queryFn: fetchMyTeam,
  });

  return (
    <Page
      header={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-sm">
                My Team
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      {isPending ? (
        <FullPageSpinner />
      ) : isError ? (
        <ErrorState
          onRetry={() => void refetch()}
          title="Unable to load your team"
          description="Something went wrong while loading your team. Please try again."
        />
      ) : !data.data ? (
        <NoMembershipState />
      ) : (
        <TeamDetails myTeam={data.data} />
      )}
    </Page>
  );
}
