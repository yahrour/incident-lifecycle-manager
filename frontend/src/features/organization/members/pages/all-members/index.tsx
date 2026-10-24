import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { AllMembersTable } from "../../components/tables/AllMembersTable";

export function AllMembers() {
  const [page, setPage] = useState(1);

  return (
    <div className="w-full">
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Engineers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mt-2 p-4 space-y-4">
        <AllMembersTable page={page} setPage={setPage} />
      </div>
    </div>
  );
}
