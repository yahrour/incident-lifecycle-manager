import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllUnavailabilitiesTable } from "../../components/tables/AllUnavailabilitiesTable";
import type { UnavailabilityFilter } from "@/types";
import { Page } from "@/components/Page";

export function AllUnavailabilities() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<UnavailabilityFilter>("all");

  return (
    <Page
      header={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Unavailabilities</BreadcrumbPage>
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
      <AllUnavailabilitiesTable page={page} setPage={setPage} filter={filter} />
    </Page>
  );
}
