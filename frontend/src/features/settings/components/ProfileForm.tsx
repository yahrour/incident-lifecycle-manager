import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldError,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { settingSchema, type SettingFormValues } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProfileFormProps } from "../types";

export function ProfileForm({ user }: ProfileFormProps) {
  const timezones = Intl.supportedValuesOf("timeZone");

  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      timezone: user.timezone ?? "",
      specialty: user.specialty ?? "",
    },
  });

  function onSubmit(data: SettingFormValues) {
    console.log("submitting", data);
  }
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account preferences.</CardDescription>
      </CardHeader>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="firstName">First name</FieldLabel>
                      <Input
                        {...field}
                        id="firstName"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                      <Input
                        {...field}
                        id="lastName"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="specialty"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="specialty">Specialty</FieldLabel>
                      <Input
                        {...field}
                        id="specialty"
                        aria-invalid={fieldState.invalid}
                      />
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
                          id="timezone"
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
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldLegend>Work email</FieldLegend>
              <Field className="md:w-1/2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" value={user.email} disabled />
                <FieldDescription>
                  Your email can't be changed.
                </FieldDescription>
              </Field>
            </FieldSet>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!form.formState.isDirty}>
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
