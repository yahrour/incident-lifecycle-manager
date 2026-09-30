import { Link } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { useRegisterViaInvite } from "../hooks/useAccpetInvite";
import {
  registerViaInviteSchema,
  type RegisterViaInviteValues,
} from "../schemas";

type RegisterViaInviteProps = {
  token: string;
  email: string;
};

function getRegisterErrorMessage(error: unknown): string {
  if (!isAxiosError<{ message?: string }>(error)) {
    return "Something went wrong. Try again.";
  }
  switch (error.response?.status) {
    case 409:
      return (
        error.response?.data?.message ?? "This invite can't be used anymore."
      );
    case 410:
      return "This invite has expired. Ask your team admin for a new one.";
    case 404:
      return "This invite is no longer valid.";
    default:
      return "We couldn't create your account. Try again.";
  }
}

export function RegisterViaInvite({ email, token }: RegisterViaInviteProps) {
  const { mutate, isPending, error, isSuccess } = useRegisterViaInvite();

  const form = useForm<RegisterViaInviteValues>({
    resolver: zodResolver(registerViaInviteSchema),
    defaultValues: { firstName: "", lastName: "", password: "", specialty: "" },
  });

  function onSubmit(values: RegisterViaInviteValues) {
    mutate({ ...values, token });
  }

  if (isSuccess) {
    return <div>Succes</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>You have been invited to join a team.</CardDescription>
      </CardHeader>

      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} noValidate>
        <CardContent>
          <FieldGroup>
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
                      autoComplete="given-name"
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
                      autoComplete="family-name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </Field>

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="new-password"
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
                    placeholder="e.g. Backend, Frontend, DevOps"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive">
              {getRegisterErrorMessage(error)}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
