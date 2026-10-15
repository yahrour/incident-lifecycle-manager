import { Link } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/AuthCard";

import { useRegisterViaInvite } from "../hooks/useRegisterViaInvite";
import {
  registerViaInviteSchema,
  type RegisterViaInviteValues,
} from "../schemas";
import { parseApiError } from "@/utils/api";
import { ErrorSection } from "@/components/ErrorSection";

type RegisterViaInviteProps = {
  token: string;
  email: string;
};

export function RegisterViaInvite({ email, token }: RegisterViaInviteProps) {
  const { mutate, isPending, error, isSuccess } = useRegisterViaInvite();
  const errors = error ? parseApiError(error) : [];
  const form = useForm<RegisterViaInviteValues>({
    resolver: zodResolver(registerViaInviteSchema),
    defaultValues: { firstName: "", lastName: "", password: "", specialty: "" },
  });

  function onSubmit(values: RegisterViaInviteValues) {
    mutate({ ...values, token });
  }

  if (isSuccess) {
    return (
      <AuthCard>
        <h1 className="font-heading tracking-tight">Account created</h1>
        <p className="text-center text-sm text-muted-foreground">
          You've joined the team, sign in to continue.
        </p>
        <Link
          to="/login"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="font-heading tracking-tight">Join your team</h1>

      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FieldGroup className="gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="firstName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="firstName" className="text-foreground">
                    First name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="firstName"
                    autoComplete="given-name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError className="flex items-center gap-1.5">
                      {fieldState.error.message}
                    </FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="lastName" className="text-foreground">
                    Last name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="lastName"
                    autoComplete="family-name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError className="flex items-center gap-1.5">
                      {fieldState.error.message}
                    </FieldError>
                  )}
                </Field>
              )}
            />
          </div>

          <Field>
            <FieldLabel htmlFor="email" className="text-foreground">
              Work email
            </FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              tabIndex={-1}
              className="bg-muted text-muted-foreground"
            />
          </Field>

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password" className="text-foreground">
                  Password
                </FieldLabel>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <FieldError className="flex items-center gap-1.5">
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />

          <Controller
            name="specialty"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="specialty" className="text-foreground">
                  Specialty
                </FieldLabel>
                <Input
                  {...field}
                  id="specialty"
                  placeholder="e.g. Backend, Frontend, DevOps"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <FieldError className="flex items-center gap-1.5">
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {errors.length > 0 && (
          <div className="mt-5 w-full">
            <ErrorSection errors={errors} />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
