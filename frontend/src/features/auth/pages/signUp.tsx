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
import { AuthCard } from "../components/AuthCard";
import useSignUp from "../hooks/useSignUp";
import { signUpSchema, type SignUpCredentials } from "../schemas";
import { CircleAlert } from "lucide-react";
type FieldErrors = Partial<Record<keyof SignUpCredentials, string>>;

export default function SignUp() {
  const { mutate, isPending, error } = useSignUp();
  const [errors, setErrors] = useState<FieldErrors>({});

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

  return (
    <AuthCard>
      <h1 className="font-heading tracking-tight">Create an account</h1>

      <form action={submit} className="flex flex-col gap-5">
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.firstName}>
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
                <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                {errors.firstName}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.lastName}>
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
                <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                {errors.lastName}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.email}>
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
                <CircleAlert className="h-3.5 w-3.5 shrink-0" />

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
                <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                {errors.password}
              </FieldError>
            )}
          </Field>
        </FieldGroup>

        {error && <p className="text-sm text-destructive">Sign up failed</p>}

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
