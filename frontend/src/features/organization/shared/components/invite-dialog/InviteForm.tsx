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
import { createInvite } from "@/features/organization/members/api/invite";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { parseApiError } from "@/utils/api";
import type { Team } from "@/features/organization/shared/types";
import { inviteSchema } from "../../schemas";
import { ErrorSection } from "@/components/ErrorSection";

const EXPIRY_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
];

export function InviteForm({
  team,
  setInviteUrl,
  errors,
  setErrors,
}: {
  team: Team;
  setInviteUrl: React.Dispatch<React.SetStateAction<string | null>>;
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const inviteSchemaWithoutTeamId = inviteSchema.omit({ teamId: true });
  type InviteSchema = z.infer<typeof inviteSchemaWithoutTeamId>;
  const form = useForm<InviteSchema>({
    resolver: zodResolver(inviteSchemaWithoutTeamId),
    defaultValues: {
      inviteEmail: "",
      expiresIn: 72,
    },
  });

  const mutation = useMutation({
    mutationFn: createInvite,
    onSuccess: (res) => {
      setInviteUrl(res.data.inviteLink);
    },
    onError: (error) => {
      setErrors(parseApiError(error));
    },
  });

  const onSubmit = (data: InviteSchema) => {
    setErrors([]);
    mutation.mutate({
      ...data,
      teamId: team.id,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite an engineer to {team.name}</DialogTitle>
        <DialogDescription>
          Creates an invite link you can share. They set their own password when
          they open it.
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
            name="inviteEmail"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email *</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. alex@acme.com"
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
            name="expiresIn"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="expiresIn">Link expires in</FieldLabel>
                <Select
                  items={EXPIRY_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="expiresIn"
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
