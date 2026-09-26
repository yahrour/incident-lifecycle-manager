import { Controller, useForm } from "react-hook-form";
import { servicesSchema, updateTeamSchema } from "../../schemas";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { updateTeam } from "../../api/teams";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import axios from "axios";
import type { ApiError } from "@/types";
import { Info, Pen, Plus, XIcon } from "lucide-react";
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
  FieldDescription,
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
import type { Team } from "../../types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function EditDialog({ team }: { team: Team }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [service, setService] = useState("");

  type UpdateTeamInput = z.input<typeof updateTeamSchema>;
  type UpdateTeamOutput = z.output<typeof updateTeamSchema>;

  const form = useForm<UpdateTeamInput, unknown, UpdateTeamOutput>({
    resolver: zodResolver(updateTeamSchema),
    values: {
      name: team.name,
      description: team.description || "",
      services: team.services,
      escalationTimeoutMinutes: team.escalationTimeoutMinutes,
      rotationPeriodDays: team.rotationPeriodDays,
      webhookUrl: team.webhookUrl || "",
    },
  });

  const mutation = useMutation({
    mutationFn: updateTeam,
  });

  const onSubmit = (data: z.infer<typeof updateTeamSchema>) => {
    const dirtyFields = form.formState.dirtyFields;
    const changedData: Record<string, unknown> = {};

    // Extract changed fields
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      changedData[key] = dirtyFields[key] ? data[key] : undefined;
    }

    setErrors([]);
    mutation.mutate(
      { id: team.id, ...(changedData as typeof data) },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["teams"] });
          void queryClient.invalidateQueries({ queryKey: ["team", team.id] });
          void queryClient.invalidateQueries({ queryKey: ["oncall", team.id] });
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

  const handleAddService = () => {
    const candidate = [...(form.getValues("services") || []), service.trim()];

    const { data, success, error } = servicesSchema.safeParse(candidate);

    if (!success) {
      form.setError("services", {
        message: error.issues[0].message,
      });
      return;
    }

    form.clearErrors("services");
    form.setValue("services", data, { shouldDirty: true });
    setService("");
  };

  const handleRemove = (service: string) => {
    const services = form.getValues("services") || [];
    if (services.length === 0) {
      return;
    }
    const newServices = services.filter((s) => s !== service);
    form.setValue("services", newServices, {
      shouldDirty: true,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setErrors([]);
          setService("");
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
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>
            Update the team details and save your changes.
          </DialogDescription>
        </DialogHeader>
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

            <Controller
              name="services"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="services">Services</FieldLabel>
                    <FieldDescription>
                      Alerts for this service will route to the team.
                    </FieldDescription>
                    <div className="flex items-center gap-2">
                      <Input
                        {...field}
                        id="services"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g. payments-api, checkout-service"
                        value={service}
                        onChange={(v) => setService(v.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddService();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddService}
                      >
                        <Plus />
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                  <div className="flex items-center flex-wrap gap-1">
                    {field.value?.map((s) => (
                      <Badge
                        variant="secondary"
                        key={s}
                        onClick={() => handleRemove(s)}
                        className="cursor-pointer hover:opacity-80"
                      >
                        {s}
                        <XIcon />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="rotationPeriodDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="rotationPeriodDays">
                        Rotation period (days)
                      </FieldLabel>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={16} className="cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            Changing this will restart the rotation from the
                            beginning.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      {...field}
                      id="rotationPeriodDays"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        field.onChange(Number.isNaN(value) ? undefined : value);
                      }}
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
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        field.onChange(Number.isNaN(value) ? undefined : value);
                      }}
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
                  <FieldDescription>
                    Notifies this Discord channel when a shift starts. Create
                    one under{" "}
                    <span className="font-medium">
                      Server Settings → Integrations → Webhooks
                    </span>
                    .
                  </FieldDescription>
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
                setService("");
                setErrors([]);
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
      </DialogContent>
    </Dialog>
  );
}
