export const expiryOptions = [30, 60, 90, 180, 365] as const;
export type ExpiryDays = (typeof expiryOptions)[number];

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  enabled: boolean;
  isExpired: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface CreateApiKeyInput {
  name: string;
  expiresInDays: ExpiryDays;
}

export interface CreateApiKeyResult {
  apiKey: string;
  prefix: string;
  expiresAt: string;
}

export type ApiKeyAction = "enable" | "disable" | "delete";

export interface ApiKeyActionInput {
  action: ApiKeyAction;
  id: string;
}

interface DataEnvelope<T> {
  data: T;
}

export const isApiKeyActive = (apiKey: ApiKey) =>
  apiKey.enabled && !apiKey.isExpired;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

const API_KEYS_PATH = "/api/v1/ingestion/api-keys";

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;

  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null) return fallback;

  const { message, detail } = body as { message?: unknown; detail?: unknown };
  const text = message ?? detail;

  if (typeof text === "string") return text;

  if (Array.isArray(text)) {
    const lines = text.filter(
      (line): line is string => typeof line === "string"
    );
    return lines.length > 0 ? lines.join(". ") : fallback;
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_KEYS_PATH}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const listApiKeys = async () =>
  (await request<DataEnvelope<ApiKey[]>>("")).data;

const createApiKey = async (input: CreateApiKeyInput) =>
  (
    await request<DataEnvelope<CreateApiKeyResult>>("/create", {
      method: "POST",
      body: JSON.stringify(input),
    })
  ).data;

const enableApiKey = (id: string) =>
  request<void>(`/enable/${id}`, { method: "POST" });

const disableApiKey = (id: string) =>
  request<void>(`/disable/${id}`, { method: "POST" });

const deleteApiKey = (id: string) =>
  request<void>(`/delete/${id}`, { method: "DELETE" });

export const apiKeyService = {
  list: listApiKeys,
  create: createApiKey,
  enable: enableApiKey,
  disable: disableApiKey,
  remove: deleteApiKey,

  runAction: ({ action, id }: ApiKeyActionInput): Promise<void> => {
    switch (action) {
      case "enable":
        return enableApiKey(id);
      case "disable":
        return disableApiKey(id);
      case "delete":
        return deleteApiKey(id);
    }
  },
};
