import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { AllMembersTable } from "../../components/tables/AllMembersTable";
import { Page } from "@/components/Page";

export function AllMembers() {
  const [page, setPage] = useState(1);

  return (
    <Page
      header={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Engineers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <AllMembersTable page={page} setPage={setPage} />
    </Page>
  );
}
