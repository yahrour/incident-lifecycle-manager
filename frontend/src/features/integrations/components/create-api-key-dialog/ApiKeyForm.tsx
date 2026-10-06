import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { parseApiError } from "@/utils/api";
import { queryClient } from "@/lib/queryClient";

import { createApiKey } from "../../api/apiKeys";
import { createApiKeySchema } from "../../schemas";
import { ErrorSection } from "@/components/ErrorSection";

const EXPIRY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "1 year" },
];

export function ApiKeyForm({
  setCreatedKey,
  errors,
  setErrors,
}: {
  setCreatedKey: React.Dispatch<React.SetStateAction<string | null>>;
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  type CreateApiKeySchema = z.infer<typeof createApiKeySchema>;
  const form = useForm<CreateApiKeySchema>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      expiresInDays: 90,
    },
  });

  const mutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      setCreatedKey(res.data.apiKey);
    },
    onError: (error) => {
      setErrors(parseApiError(error));
    },
  });

  const onSubmit = (data: CreateApiKeySchema) => {
    setErrors([]);
    mutation.mutate(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create an API key</DialogTitle>
        <DialogDescription>
          Monitoring tools use this key to send alerts to the platform.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="apiKeyName">Name *</FieldLabel>
                <Input
                  {...field}
                  id="apiKeyName"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Prometheus production"
                  autoComplete="off"
                  autoFocus
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="expiresInDays"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="expiresInDays">Expires in</FieldLabel>
                <Select
                  items={EXPIRY_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="expiresInDays"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Show API response errors */}
        {errors.length > 0 && <ErrorSection errors={errors} />}

        <DialogFooter className="mt-6">
          <DialogClose
            render={<Button type="button" variant="outline" />}
            disabled={mutation.isPending}
          >
            Cancel
          </DialogClose>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner /> : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
