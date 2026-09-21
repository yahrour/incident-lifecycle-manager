import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { isAxiosError } from "axios";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyEmail } from "../hooks/useVerifyEmail";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { mutate, isIdle, isPending, isSuccess, error } = useVerifyEmail();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    mutate(token);
  }, [token, mutate]);

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <XCircle className="mx-auto size-12 text-destructive" />
        <h1 className="font-heading text-center tracking-tight">
          Invalid link
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          This verification link is missing its token.
        </p>
        <Link
          to="/signup"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Back to sign up
        </Link>
      </div>
    );
  }

  if (isIdle || isPending) {
    return (
      <div className="flex flex-col gap-5">
        <Loader2 className="mx-auto size-12 animate-spin text-muted-foreground" />
        <h1 className="font-heading text-center tracking-tight">
          Confirming your email
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          This will only take a moment.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-5">
        <CheckCircle2 className="mx-auto size-12 text-green-600 dark:text-green-500" />
        <h1 className="font-heading text-center tracking-tight">
          Your email is confirmed
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Your account is ready. You can sign in now.
        </p>
        <Link
          to="/login"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const expired = isAxiosError(error) && error.response?.status === 410;

  if (expired) {
    return (
      <div className="flex flex-col gap-5">
        <Clock className="mx-auto size-12 text-muted-foreground" />
        <h1 className="font-heading text-center tracking-tight">
          This link has expired
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Verification links are valid for 24 hours. Request a new one to
          continue.
        </p>
        <Link
          to="/resend-verification"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Send a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <XCircle className="mx-auto size-12 text-destructive" />
      <h1 className="font-heading text-center tracking-tight">
        We couldn't confirm your email
      </h1>
      <p className="text-center text-sm text-muted-foreground">
        The link may be invalid, or something went wrong on our end.
      </p>
      <Button onClick={() => mutate(token)} className="w-full">
        Try again
      </Button>
      <Link
        to="/signup"
        className="text-center text-sm font-medium text-primary hover:underline"
      >
        Back to sign up
      </Link>
    </div>
  );
}
