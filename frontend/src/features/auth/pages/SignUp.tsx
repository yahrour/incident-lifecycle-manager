import { useState } from "react";
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

type FieldErrors = Partial<Record<keyof SignUpCredentials, string>>;

export default function SignUp() {
  const { mutate, isPending, isSuccess, error } = useSignUp();
  const [errors, setErrors] = useState<FieldErrors>({});
  const apiErrors = error ? parseApiError(error) : [];
  function submit(formData: FormData) {
    const result = signUpSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SignUpCredentials;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    mutate(result.data);
  }
  if (isSuccess) {
    return (
      <AccountCreated text="Your account has been created. Sign in to continue." />
    );
  }

  return (
    <AuthCard>
      <h1 className="font-heading tracking-tight">Create an account</h1>

      <form action={submit} className="flex flex-col gap-5">
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="firstName" className="text-foreground">
              First name
            </FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <FieldError className="flex items-center gap-1.5">
                {errors.firstName}
              </FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName" className="text-foreground">
              Last name
            </FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <FieldError className="flex items-center gap-1.5">
                {errors.lastName}
              </FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="email" className="text-foreground">
              Work email
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <FieldError className="flex items-center gap-1.5">
                {errors.email}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password" className="text-foreground">
              Password
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <FieldError className="flex items-center gap-1.5">
                {errors.password}
              </FieldError>
            )}
          </Field>
        </FieldGroup>

        {apiErrors.length > 0 && <ErrorSection errors={apiErrors} />}

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
