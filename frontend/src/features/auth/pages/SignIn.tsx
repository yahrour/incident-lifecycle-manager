import axios from "axios";
import { Link, Navigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthCard } from "../components/AuthCard";
import { useAuth } from "../context/AuthContext";
import useSignIn from "../hooks/useSignIn";

function getErrorMessage(error: Error) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Sign in failed";
  }
  return "Sign in failed";
}

export default function SignIn() {
  const { user, isLoading } = useAuth();
  const { mutate, isPending, error } = useSignIn();

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

  function submit(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    mutate({ email, password });
  }

  return (
    <AuthCard>
      <h1 className="font-heading tracking-tight">Sign in</h1>

      <form action={submit} className="flex flex-col gap-5">
        <FieldGroup className="gap-5">
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
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
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
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
