import { useEffect, useState } from "react";
import z from "zod";
import { updateUnavailabilitySchema } from "../../schemas";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toast";
import { parseApiError } from "@/utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Pen } from "lucide-react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ErrorSection } from "@/components/ErrorSection";
import { Spinner } from "@/components/ui/spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { updateUnavailability } from "../../api/unavailability";
import { useMutation } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { unavailabilityKeys } from "../../constants";
import { toZonedTime } from "date-fns-tz";
import type { Unavailability } from "@/types";

type UpdateUnavailabilitySchema = z.input<typeof updateUnavailabilitySchema>;
const TIMEZONES = Intl.supportedValuesOf("timeZone");

const toDefaults = (u: Unavailability) => ({
  startDate: new Date(u.startDate),
  endDate: new Date(u.endDate),
  reason: u.reason ?? "",
});

export function UpdateUnavailabilityDialog({
  teamId,
  memberId,
  unavailability,
}: {
  teamId: string;
  memberId: number;
  unavailability: Unavailability;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateUnavailabilitySchema>({
    resolver: zodResolver(updateUnavailabilitySchema),
    defaultValues: toDefaults(unavailability),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaults(unavailability));
      setErrors([]);
    }
  }, [open, unavailability, form]);

  const mutation = useMutation({
    mutationFn: (data: UpdateUnavailabilitySchema) =>
      updateUnavailability(data, teamId, memberId, unavailability.id),
  });

  const onSubmit = (data: UpdateUnavailabilitySchema) => {
    setErrors([]);
    mutation.mutate(data, {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: unavailabilityKeys.all,
        });
        setOpen(false);
        toast.add({
          type: "success",
          title: "Unavailability updated successfully",
        });
      },
      onError: (error) => {
        setErrors(parseApiError(error));
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={mutation.isPending || unavailability.status !== "PENDING"}
          >
            <Pen />
          </Button>
        }
      />
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <DialogTitle>Update unavailability</DialogTitle>
          <DialogDescription>Update your unavailability.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event);
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="startDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="startDate">Start date</FieldLabel>
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
                          disabled={{
                            before: toZonedTime(
                              new Date(),
                              form.watch("timezone")
                            ),
                          }}
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
                name="endDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="endDate">End date</FieldLabel>
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
                          disabled={{
                            before: toZonedTime(
                              form.watch("startDate"),
                              form.watch("timezone")
                            ),
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

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

            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reason">Reason</FieldLabel>
                  <Textarea
                    {...field}
                    id="reason"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Doctor's appointment, family event..."
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
