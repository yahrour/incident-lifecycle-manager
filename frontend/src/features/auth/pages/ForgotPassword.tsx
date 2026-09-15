import { FieldGroup, Field, FieldLabel } from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Spinner } from "../../../components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { AuthCard } from "../components/AuthCard";
import { Link } from "react-router";

async function requestLink(email: string) {
  const response = await apiClient.post("/auth/forgot-password", {
    email,
  });
  return response.data;
}

export default function ForgotPassword() {
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: requestLink,
  });

  function submit(formData: FormData) {
    if (isPending) return;
    mutate(formData.get("email") as string);
  }
  if (isSuccess) {
    return (
      <AuthCard>
        <h1 className="text-xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm">
          If an account exists for that address, we&apos;ve sent a reset link.
          It expires in a few hours.
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/sign-in" />}
        >
          Back to sign in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter the email on your account and we&apos;ll send a reset link.
        </p>
      </div>

      <form action={submit}>
        {/* {isError && ( */}
        {/*   <Alert variant="destructive"> */}
        {/*     <AlertDescription> */}
        {/*       Something went wrong. Please try again. */}
        {/*     </AlertDescription> */}
        {/*   </Alert> */}
        {/* )} */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Send reset link
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
