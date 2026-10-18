import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { TeamOverview } from "../components/TeamOverview";
import { useQuery } from "@tanstack/react-query";
import { fetchUserMembership } from "../api/membership";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { NoMembershipState } from "../components/NoMembershipState";
import { ErrorState } from "@/components/ErrorState";
import { membershipKeys } from "../constants";

export function MyTeam() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: membershipKeys.all,
    queryFn: fetchUserMembership,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return (
      <ErrorState
        onRetry={() => void refetch()}
        title="Unable to load your team"
        description="We couldn't load your team membership. Please try again."
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
              <BreadcrumbPage className="font-medium text-sm">
                My Team
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {!membership ? (
        <NoMembershipState />
      ) : (
        <div className="p-6 space-y-6">
          <TeamOverview />
        </div>
      )}
    </div>
  );
}
