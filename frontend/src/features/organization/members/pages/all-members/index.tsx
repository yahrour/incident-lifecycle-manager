import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { type SortState } from "../../types";
import { AllMembersTable } from "../../components/tables/AllMembersTable";
import { SortOrderToggle } from "@/components/SortOrderToggle";

export function AllMembers() {
  const [sort, setSort] = useState<SortState>({
    field: "joinedAt",
    order: "asc",
  });
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
        <div className="flex justify-end items-center gap-2">
          <SortOrderToggle
            order={sort.order}
            onChange={(order) => {
              setSort({ ...sort, order });
              setPage(1);
            }}
          />
        </div>
        <AllMembersTable page={page} setPage={setPage} sort={sort} />
      </div>
    </div>
  );
}
