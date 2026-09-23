import { Controller, useForm } from "react-hook-form";
import { updateTeamSchema } from "../../schemas";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchTeam, updateTeam } from "../../api/teamsApi";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import axios from "axios";
import type { ApiError } from "@/types";
import { Pen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorSection } from "../../components/ErrorSection";
import { queryClient } from "@/lib/queryClient";

export function EditDialog({ teamId }: { teamId: string }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const {
    data: team,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeam(teamId),
    enabled: open,
  });

  useEffect(() => {
    if (isError) {
      toast.add({
        type: "error",
        title: "failed to fetch",
        description: "team doesn't exist",
      });
    }
  }, [isError]);

  type UpdateTeamInput = z.input<typeof updateTeamSchema>;
  type UpdateTeamOutput = z.output<typeof updateTeamSchema>;

  const form = useForm<UpdateTeamInput, unknown, UpdateTeamOutput>({
    resolver: zodResolver(updateTeamSchema),
    values: team
      ? {
          name: team?.data.name,
          description: team?.data.description || "",
          escalationTimeoutMinutes: team?.data.escalationTimeoutMinutes,
          rotationPeriodDays: team?.data.rotationPeriodDays,
          webhookUrl: team?.data.webhookUrl || "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: updateTeam,
  });

  const onSubmit = (data: z.infer<typeof updateTeamSchema>) => {
    setErrors([]);
    mutation.mutate(
      { id: teamId, ...data },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["teams"] });
          void queryClient.invalidateQueries({ queryKey: ["team", teamId] });
          void queryClient.invalidateQueries({
            queryKey: ["team", teamId, "stats"],
          });
          setOpen(false);
          toast.add({
            type: "success",
            title: "Team updated",
          });
        },
        onError: (error) => {
          if (axios.isAxiosError(error)) {
            const apiError = error.response?.data as ApiError | undefined;
            const message = apiError?.message;

            if (Array.isArray(message)) {
              setErrors([...message]);
            } else if (message) {
              setErrors([message]);
            } else {
              setErrors(["Something went wrong. Please try again."]);
            }
          } else {
            setErrors(["An unexpected error occurred."]);
          }
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setErrors([]);
          form.reset();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="px-4">
            <Pen data-icon="inline-start" />
            Edit
          </Button>
        }
      ></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>
            Update the team details and save your changes.
          </DialogDescription>
        </DialogHeader>
        {isPending ? (
          <Spinner className="size-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        ) : (
          <form
            onSubmit={(event) => {
              void form.handleSubmit(onSubmit)(event);
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="teamName">Team name *</FieldLabel>
                    <Input
                      {...field}
                      id="teamName"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. Platform Infrastructure"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      id="description"
                      aria-invalid={fieldState.invalid}
                      placeholder="What does this team own or respond to?"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="rotationPeriodDays"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="rotationPeriodDays">
                        Rotation period (days)
                      </FieldLabel>
                      <Input
                        {...field}
                        id="rotationPeriodDays"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        type="number"
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="escalationTimeoutMinutes"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="escalationTimeoutMinutes">
                        Escalation timeout (minutes)
                      </FieldLabel>
                      <Input
                        {...field}
                        id="escalationTimeoutMinutes"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        type="number"
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="webhookUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="webhookurl">
                      Discord webhook URL
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="webhookurl"
                      aria-invalid={fieldState.invalid}
                      placeholder="Paste your Discord webhook URL"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Show API response errors */}
            {errors.length > 0 && <ErrorSection errors={errors} />}

            <Field orientation="horizontal" className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !form.formState.isDirty}
              >
                {mutation.isPending && <Spinner />}
                Update
              </Button>
            </Field>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
