import { useState } from "react";
import { DeliveryLogTable } from "../components/DeliveryLogTable";
import { Page } from "@/components/Page";

export function DeliveryLog() {
  const [page, setPage] = useState(1);

  return (
    <Page header={<h1 className="font-medium text-sm">Delivery log</h1>}>
      <DeliveryLogTable page={page} setPage={setPage} />
    </Page>
  );
}
