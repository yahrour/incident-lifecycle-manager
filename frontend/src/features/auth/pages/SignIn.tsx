import { FieldGroup, Field, FieldLabel } from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { GoogleLogin } from "@react-oauth/google";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router";
import { apiClient } from "@/lib/apiClient";

import { AuthCard } from "../components/AuthCard";

type SignInCredentials = {
  email: string;
  password: string;
};

async function signIn({ email, password }: SignInCredentials) {
  const response = await apiClient.post("/auth/sign-in", { email, password });
  return response.data;
}

export default function SignIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const onAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["me"] });
    navigate("/", { replace: true });
  };

  const googleMutation = useMutation({
    mutationFn: (token: string) =>
      apiClient.post("/authentication/google", { token }),
    onSuccess: onAuthSuccess,
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: signIn,
    onSuccess: onAuthSuccess,
  });

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
        <Button type="submit">Sign in</Button>
      </form>
      <div className="flex items-center gap-2.5">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              googleMutation.mutate(credentialResponse.credential);
            }
          }}
          onError={() => console.error("Google sign-in failed")}
          width="400"
        />
      </div>
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
