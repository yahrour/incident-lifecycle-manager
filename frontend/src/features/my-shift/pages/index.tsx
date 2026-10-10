import { useQuery } from "@tanstack/react-query";
import { fetchShift } from "../api/shift";
import { shiftKeys } from "../constants";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useErrorToast } from "@/hooks/use-error-toast";
import { OnCallBanner } from "../components/OnCallBanner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export function MyShift() {
  const { data, isPending, isError } = useQuery({
    queryKey: shiftKeys.all,
    queryFn: fetchShift,
  });

  useErrorToast(isError, "Failed to fetch on call status");

  if (isPending) {
    return <FullPageSpinner />;
  }

  const shift = data.data;

  console.log("shift: ", shift);

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

      <div className="mt-2 p-4 space-y-4">
        <OnCallBanner
          teamName={"frontend"}
          position="SECONDARY"
          assigned={123}
          unacked={21}
          escalationMinutes={5}
          shiftEndsAt={new Date().toISOString()}
        />
      </div>
    </div>
  );
}
