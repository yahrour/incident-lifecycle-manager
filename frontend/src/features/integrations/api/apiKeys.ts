import z from "zod";
import { apiClient } from "@/lib/apiClient";
import type { ApiResponse } from "@/types";
import type { createApiKeySchema } from "../schemas";
import type { ApiKey, CreatedApiKey } from "../types";

export async function fetchApiKeys() {
  const response = await apiClient.get<ApiResponse<ApiKey[]>>(
    "/ingestion/api-keys"
  );
  return response.data;
}

export async function createApiKey(apiKey: z.infer<typeof createApiKeySchema>) {
  const response = await apiClient.post<ApiResponse<CreatedApiKey>>(
    "/ingestion/api-keys/create",
    apiKey
  );
  return response.data;
}

export async function enableApiKey(id: string) {
  await apiClient.post(`/ingestion/api-keys/enable/${id}`);
}

export async function disableApiKey(id: string) {
  await apiClient.post(`/ingestion/api-keys/disable/${id}`);
}

export async function deleteApiKey(id: string) {
  await apiClient.delete(`/ingestion/api-keys/delete/${id}`);
}
