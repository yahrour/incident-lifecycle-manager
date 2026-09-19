import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiKeyService,
  type ApiKey,
  type ApiKeyActionInput,
  type CreateApiKeyInput,
} from "../services/apiKeyService";

export const apiKeysQueryKey = ["ingestion", "api-keys"] as const;

const EMPTY_KEYS: ApiKey[] = [];

export function useApiKeys() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: apiKeysQueryKey });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: apiKeysQueryKey,
    queryFn: apiKeyService.list,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateApiKeyInput) => apiKeyService.create(input),
    onSuccess: invalidate,
  });

  const actionMutation = useMutation({
    mutationFn: (input: ApiKeyActionInput) => apiKeyService.runAction(input),
    onSuccess: invalidate,
  });

  return {
    apiKeys: data ?? EMPTY_KEYS,
    isLoading,
    isError,
    refetch,
    createMutation,
    actionMutation,
  };
}
