import axios from "axios";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthCard } from "../components/AuthCard";
import useSignIn from "../hooks/useSignIn";

function getErrorMessage(error: Error) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Sign in failed";
  }
  return "Sign in failed";
}

export default function SignIn() {
  const { mutate, isPending, error } = useSignIn();

  function submit(formData: FormData) {
    if (isPending) return;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    mutate({ email, password });
  }

  return (
    <AuthCard>
      <h1 className="font-heading text-base font-semibold tracking-tight">
        Sign in
      </h1>

      <form action={submit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
        </FieldGroup>

        {error && (
          <p className="text-xs text-destructive">{getErrorMessage(error)}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="flex gap-2">
        <Link
          to="/forgot-password"
          className="flex-1 rounded-md bg-primary/10 py-2 text-xs font-semibold text-primary"
        >
          Forgot password?
        </Link>
        <Link
          to="/register"
          className="flex-1 rounded-md border border-border py-2 text-xs font-semibold"
        >
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
}
