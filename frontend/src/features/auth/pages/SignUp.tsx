import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/AuthCard";
import useSignUp from "../hooks/useSignUp";
import { signUpSchema, type SignUpCredentials } from "../schemas";
import { GoogleButton } from "../components/GoogleButton";
import { parseApiError } from "@/utils/api";
import { ErrorSection } from "@/components/ErrorSection";
import { AccountCreated } from "@/components/AccountCreated";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SignUp() {
  const { mutate, isPending, isSuccess, error } = useSignUp();
  const errors = error ? parseApiError(error) : [];
  const form = useForm<SignUpCredentials>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", password: "", email: "" },
  });

  function onSubmit(value: SignUpCredentials) {
    mutate(value);
  }

  if (isSuccess) {
    return (
      <AccountCreated text="Your account has been created. Sign in to continue." />
    );
  }

  return (
    <AuthCard
      title={
        <>
          Every alert gets an <em>owner.</em>
        </>
      }
      text="Create your account and join the rotation in under a minute."
    >
      <h1 className="font-heading tracking-tight">Create an account</h1>

      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        noValidate
        className="flex flex-col gap-5"
      >
        <FieldGroup className="gap-5">
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

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email" className="text-foreground">
                  Work email
                </FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="email"
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
        </FieldGroup>

        {errors.length > 0 && <ErrorSection errors={errors} />}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleButton text="Sign up with Google" />
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
