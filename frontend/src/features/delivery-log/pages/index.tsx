import { useState } from "react";
import { DeliveryLogTable } from "../components/DeliveryLogTable";

export function DeliveryLog() {
  const [page, setPage] = useState(1);

  return (
    <div className="w-full">
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Delivery log</h1>
      </div>

      <div className="mt-2 p-4 space-y-4">
        <DeliveryLogTable page={page} setPage={setPage} />
      </div>
    </div>
  );
}
