import { Page } from "@/components/Page";
import { IncidentsOverview } from "@/features/incidents";

export function Overview() {
  return (
    <Page header={<h1 className="font-medium text-sm">Overview</h1>}>
      <IncidentsOverview />
    </Page>
  );
}
