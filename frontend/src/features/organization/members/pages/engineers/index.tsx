import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SortControls } from "../../components/SortControls";
import { useState } from "react";
import { type SortState } from "../../types";
import { EngineersTable } from "../../components/tables/EngineersTable";

export function Engineers() {
  const [sort, setSort] = useState<SortState>({
    field: "joinedAt",
    order: "asc",
  });
  const [page, setPage] = useState(1);

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

      <div className="p-6 space-y-2">
        <div className="flex justify-end items-center gap-2">
          <SortControls sort={sort} onSortChange={setSort} />
          {/* <InviteDialog team={team} /> */}
        </div>
        <EngineersTable page={page} setPage={setPage} sort={sort} />
      </div>
    </div>
  );
}
