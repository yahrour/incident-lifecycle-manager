import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { OnCallBanner } from "../components/OnCallBanner";
import { useQuery } from "@tanstack/react-query";
import { fetchUserMembership } from "../api/membership";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { NoMembershipState } from "../components/NoMembershipState";
import { membershipKeys } from "../constants";

export function MyShift() {
  const { data, isPending, isError } = useQuery({
    queryKey: membershipKeys.all,
    queryFn: fetchUserMembership,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <div>failed to fetch, click here try again</div>;
  }

  const membership = data.data;

  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Engineers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {!membership ? (
        <NoMembershipState />
      ) : (
        <div className="mt-2 p-4 space-y-4">
          <OnCallBanner />
        </div>
      )}
    </div>
  );
}
