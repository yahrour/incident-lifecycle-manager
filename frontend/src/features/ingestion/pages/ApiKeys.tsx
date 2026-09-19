import { useState, type FormEvent } from "react";
import {
  Check,
  Clipboard,
  Copy,
  KeyRound,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useApiKeys } from "../hooks/useApiKeys";
import {
  expiryOptions,
  getErrorMessage,
  isApiKeyActive,
  type ApiKey,
  type ExpiryDays,
} from "../services/apiKeyService";

const DEFAULT_EXPIRY: ExpiryDays = 90;

const fieldClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy };
}

export default function ApiKeys() {
  const {
    apiKeys,
    isLoading,
    isError,
    refetch,
    createMutation,
    actionMutation,
  } = useApiKeys();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] =
    useState<ExpiryDays>(DEFAULT_EXPIRY);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);

  const keyCopy = useCopyToClipboard();

  const activeCount = apiKeys.filter(isApiKeyActive).length;

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setName("");
      setExpiresInDays(DEFAULT_EXPIRY);
      setCreatedKey(null);
      createMutation.reset();
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    createMutation.mutate(
      { name: trimmed, expiresInDays },
      { onSuccess: (result) => setCreatedKey(result.apiKey) }
    );
  }

  function openDeleteDialog(apiKey: ApiKey) {
    actionMutation.reset();
    setKeyToDelete(apiKey);
  }

  function confirmDelete() {
    if (!keyToDelete) return;
    actionMutation.mutate(
      { action: "delete", id: keyToDelete.id },
      { onSuccess: () => setKeyToDelete(null) }
    );
  }

  const actionError = actionMutation.isError
    ? (getErrorMessage(actionMutation.error) ??
      "Something went wrong. Try again.")
    : null;

  return (
    <div className="min-h-full bg-[#faf7f4]">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2a2521]">
              Integrations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your monitoring tools with API keys.
            </p>
          </div>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus /> Create API key
          </Button>

          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {createdKey ? "Copy your API key" : "Create API key"}
                </DialogTitle>
                <DialogDescription>
                  {createdKey
                    ? "This is the only time the full key is shown. Store it somewhere safe."
                    : "Give the key a name so you can tell which tool uses it."}
                </DialogDescription>
              </DialogHeader>

              {createdKey ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                    <code className="min-w-0 flex-1 break-all text-xs">
                      {createdKey}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void keyCopy.copy(createdKey)}
                      aria-label="Copy API key"
                      title="Copy API key"
                    >
                      {keyCopy.copied ? <Check /> : <Copy />}
                    </Button>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleDialogChange(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleCreate}>
                  <label className="block space-y-2 text-sm font-medium">
                    Name
                    <input
                      className={fieldClass}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Production Prometheus"
                      maxLength={80}
                      required
                      autoFocus
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-medium">
                    Expires in
                    <select
                      className={fieldClass}
                      value={expiresInDays}
                      onChange={(event) =>
                        setExpiresInDays(
                          Number(event.target.value) as ExpiryDays
                        )
                      }
                    >
                      {expiryOptions.map((days) => (
                        <option key={days} value={days}>
                          {days} days
                        </option>
                      ))}
                    </select>
                  </label>

                  {createMutation.error && (
                    <p className="text-sm text-destructive">
                      {getErrorMessage(createMutation.error) ??
                        "Could not create API key"}
                    </p>
                  )}

                  <Button
                    className="w-full"
                    type="submit"
                    disabled={createMutation.isPending || !name.trim()}
                  >
                    {createMutation.isPending
                      ? "Creating..."
                      : "Create API key"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Summary */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 md:col-span-2">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-[#fff1e7] p-3 text-orange-700">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-[#2a2521]">
                  Alert ingestion
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  API keys authenticate alert sources such as monitoring tools
                  and deployment systems. Keep them private and rotate them
                  regularly.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-[#2a2521] p-5 text-white">
            <ShieldCheck className="size-5 text-orange-300" />
            <p className="mt-5 text-2xl font-semibold">{activeCount}</p>
            <p className="text-sm text-white/65">active keys</p>
          </div>
        </section>

        {/* Keys list */}
        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#2a2521]">API keys</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {apiKeys.length} configured{" "}
                {apiKeys.length === 1 ? "key" : "keys"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void refetch()}
              aria-label="Refresh API keys"
              title="Refresh API keys"
            >
              <RefreshCw />
            </Button>
          </div>

          {actionError && !keyToDelete && (
            <p className="border-b bg-red-50 px-5 py-3 text-sm text-destructive">
              {actionError}
            </p>
          )}

          {isLoading ? (
            <p className="p-8 text-sm text-muted-foreground">
              Loading API keys...
            </p>
          ) : isError ? (
            <div className="flex flex-col items-start gap-3 p-8">
              <p className="text-sm text-destructive">
                Could not load API keys.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <Clipboard className="size-8 text-muted-foreground/50" />
              <p className="font-medium">No API keys yet</p>
              <p className="text-sm text-muted-foreground">
                Create one to connect an alert source.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {apiKeys.map((apiKey) => {
                const expired = apiKey.isExpired;
                const active = isApiKeyActive(apiKey);
                const toggleLabel = apiKey.enabled
                  ? "Disable API key"
                  : "Enable API key";

                return (
                  <div
                    key={apiKey.id}
                    className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-[#2a2521]">
                          {apiKey.name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {expired
                            ? "Expired"
                            : apiKey.enabled
                              ? "Active"
                              : "Disabled"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {apiKey.keyPrefix}********
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      <span>Created {formatDate(apiKey.createdAt)}</span>
                      <span>Expires {formatDate(apiKey.expiresAt)}</span>

                      {/* Expired keys can't be re-enabled, so no toggle for them. */}
                      {!expired && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({
                              action: apiKey.enabled ? "disable" : "enable",
                              id: apiKey.id,
                            })
                          }
                          aria-label={toggleLabel}
                          title={toggleLabel}
                        >
                          {apiKey.enabled ? <PowerOff /> : <Power />}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={actionMutation.isPending}
                        onClick={() => openDeleteDialog(apiKey)}
                        aria-label="Delete API key"
                        title="Delete API key"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Delete confirmation */}
      <Dialog
        open={keyToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setKeyToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API key?</DialogTitle>
            <DialogDescription>
              Anything using{" "}
              <span className="font-medium">{keyToDelete?.name}</span> will stop
              being able to send alerts. This can't be undone.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionMutation.isPending}
              onClick={confirmDelete}
            >
              {actionMutation.isPending ? "Deleting..." : "Delete key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
