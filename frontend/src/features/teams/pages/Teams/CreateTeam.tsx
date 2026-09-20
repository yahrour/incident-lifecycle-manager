import { Controller, useForm } from "react-hook-form";
import { createTeamSchema } from "../../schemas";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createTeam } from "../../api/teamsApi";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import axios from "axios";
import type { ApiError } from "@/types";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import {
  DEFAULT_ESCALATION_TIMEOUT_MINUTES,
  DEFAULT_ROTATION_PERIOD_DAYS,
} from "../../constants";

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
import { ErrorSection } from "../../components/ErrorSection";

export function CreateTeam() {
  type CreateTeamInput = z.input<typeof createTeamSchema>;
  type CreateTeamOutput = z.output<typeof createTeamSchema>;

  const form = useForm<CreateTeamInput, unknown, CreateTeamOutput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      escalationTimeoutMinutes: DEFAULT_ESCALATION_TIMEOUT_MINUTES,
      timezone: "",
      rotationPeriodDays: DEFAULT_ROTATION_PERIOD_DAYS,
      webhookUrl: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createTeam,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timezones = Intl.supportedValuesOf("timeZone");

  const onSubmit = (data: z.infer<typeof createTeamSchema>) => {
    setErrors([]);
    mutate(data, {
      onSuccess: (createdTeam) => {
        form.reset();
        setOpen(false);
        toast.add({
          type: "success",
          title: "Team created",
          description: `${createdTeam.data.name} is ready to go.`,
        });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const apiError = error.response?.data as ApiError;
          setErrors(
            Array.isArray(apiError.message)
              ? [...apiError.message]
              : [apiError.message]
          );
        }
      },
    });
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
          <Button className="cursor-pointer">
            <Plus data-icon="inline-start" />
            Create team
          </Button>
        }
      ></DialogTrigger>
      <DialogContent>
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
                      items={timezones}
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
