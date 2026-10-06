import { ApiKeysTable } from "../components/ApiKeysTable";
import { CreateApiKeyDialog } from "../components/create-api-key-dialog";

export function Integrations() {
  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Integrations</h1>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-medium text-sm">API keys</h2>
            <p className="text-xs text-muted-foreground">
              Monitoring tools send alerts with a key in the x-api-key header.
            </p>
          </div>
          <CreateApiKeyDialog />
        </div>

        <ApiKeysTable />
      </div>
    </div>
  );
}
