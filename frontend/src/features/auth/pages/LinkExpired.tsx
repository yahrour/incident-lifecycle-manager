import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import "../auth.css";
import { AuthCard } from "../components/AuthCard";
import { Field } from "../components/Field";

// the mutationFn — one argument in, the data you want in `data` out.
async function resendLink(email: string) {
  const response = await axios.post("/auth/resend-verification", { email });
  return response.data;
}

// plain helper, no React involved — unwraps the axios error shape
function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  return "Something went wrong. Please try again.";
}

export default function LinkExpired() {
  const { mutate, isPending, isError, isSuccess, error, reset, variables } =
    useMutation({ mutationFn: resendLink });

  function sendLink(formData: FormData) {
    if (isPending) return;
    const email = formData.get("email") as string;
    mutate(email);
  }

  return (
    <AuthCard>
      {isSuccess ? (
        <>
          <h1>Check your email</h1>
          <p>
            We sent a new verification link to <strong>{variables}</strong>. It
            expires in 30 minutes.
          </p>
          <button type="button" className="app-button" onClick={() => reset()}>
            Use a different email
          </button>
          <a href="/sign-in" className="app-button">
            Back to sign in
          </a>
        </>
      ) : (
        <>
          <h1>This link is no longer valid</h1>
          <p>
            Verification links expire after a set time and can only be used
            once. Enter your email and we'll send a new one.
          </p>

          <form action={sendLink} className="custom-form">
            <Field
              label="Work email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
            />
            {isError && <p className="form-error">{getErrorMessage(error)}</p>}

            <button type="submit" className="app-button" disabled={isPending}>
              {isPending ? "Sending..." : "Send a new link"}
            </button>
          </form>
          <a href="/sign-in" className="app-button">
            Back to sign in
          </a>
        </>
      )}
    </AuthCard>
  );
}
