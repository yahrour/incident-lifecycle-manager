import { Controller, useForm } from "react-hook-form";
import { createTeamSchema, servicesSchema } from "../../../schemas";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createTeam } from "../../../api/teams";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { CalendarIcon, Plus, XIcon } from "lucide-react";
import { format } from "date-fns";
import {
  DEFAULT_ESCALATION_TIMEOUT_MINUTES,
  DEFAULT_ROTATION_PERIOD_DAYS,
} from "../../../constants";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorSection } from "../../../components/ErrorSection";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { parseApiError } from "../../../utils";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

export function CreateTeamDialog() {
  type CreateTeamInput = z.input<typeof createTeamSchema>;
  type CreateTeamOutput = z.output<typeof createTeamSchema>;

  const form = useForm<CreateTeamInput, unknown, CreateTeamOutput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      services: [],
      timezone: "",
      webhookUrl: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createTeam,
  });

  const [service, setService] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const resetForm = () => {
    form.reset();
    setErrors([]);
    setService("");
  };

  const onSubmit = (data: z.infer<typeof createTeamSchema>) => {
    setErrors([]);
    mutate(data, {
      onSuccess: (createdTeam) => {
        void queryClient.invalidateQueries({
          queryKey: ["teams"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["teamsMetrics"],
        });
        resetForm();
        setOpen(false);
        toast.add({
          type: "success",
          title: "Team created",
          description: `${createdTeam.data.name} is ready to go.`,
        });
      },

      onError: (error) => {
        setErrors(parseApiError(error));
      },
    });
  };

  const handleAddService = () => {
    const candidate = [...form.getValues("services"), service.trim()];

    const { data, success, error } = servicesSchema.safeParse(candidate);

    if (!success) {
      form.setError("services", {
        message: error.issues[0].message,
      });
      return;
    }

    form.clearErrors("services");
    form.setValue("services", data);
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
          resetForm();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="cursor-pointer" variant="secondary">
            <Plus data-icon="inline-start" />
            Create team
          </Button>
        }
      ></DialogTrigger>
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            A team owns services and a single on-call rotation.
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
                    {field.value.map((s) => (
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
                name="rotationStartDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rotationStartDate">
                      Rotation start date
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            data-empty={!field.value}
                            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                          />
                        }
                      >
                        <CalendarIcon />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="timezone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                    <Combobox
                      items={TIMEZONES}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <ComboboxInput
                        placeholder="Select timezone"
                        className="w-full"
                      />

                      <ComboboxContent>
                        <ComboboxEmpty>No timezone found.</ComboboxEmpty>

                        <ComboboxList>
                          {(tz: string) => (
                            <ComboboxItem key={tz} value={tz}>
                              {tz.replaceAll("_", " ")}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="rotationPeriodDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rotationPeriodDays">
                      Rotation period (days)
                    </FieldLabel>
                    <FieldDescription>
                      Defaults to {DEFAULT_ROTATION_PERIOD_DAYS} day(s) if left
                      blank.
                    </FieldDescription>
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
                    <FieldDescription>
                      Defaults to {DEFAULT_ESCALATION_TIMEOUT_MINUTES} minute(s)
                      if left blank.
                    </FieldDescription>
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
                setErrors([]);
                setService("");
                setOpen(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              Create
            </Button>
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
