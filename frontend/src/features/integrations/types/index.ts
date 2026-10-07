export type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  enabled: boolean;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
};

export type CreatedApiKey = {
  apiKey: string;
  prefix: string;
  expiresAt: string;
};

export type ApiKeyFilter = "all" | "active" | "disabled";
export type SortField = "createdAt" | "expiresAt" | "name";
export type SortState = { field: SortField; order: "asc" | "desc" };
