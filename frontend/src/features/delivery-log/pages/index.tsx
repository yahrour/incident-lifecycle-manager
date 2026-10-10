import { NoAlertsState } from "../components/empty-states/NoAlertsState";

export function DeliveryLog() {
  return (
    <div className="w-full">
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Delivery log</h1>
      </div>

      <div className="mt-2 p-4 space-y-4">
        <NoAlertsState />
      </div>
    </div>
  );
}
