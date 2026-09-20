import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { isAxiosError } from "axios";
import { useVerifyEmail } from "../hooks/useVerifyEmail";

export function VerifyEmailPage() {
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
      <div>
        <h1>Invalid link</h1>
        <p>This verification link is missing its token.</p>
        <Link to="/signup">Back to sign up</Link>
      </div>
    );
  }

  if (isIdle || isPending) {
    return <p>Confirming your email…</p>;
  }

  if (isSuccess) {
    return (
      <div>
        <h1>Your email is confirmed</h1>
        <Link to="/login">Log in</Link>
      </div>
    );
  }

  const expired = isAxiosError(error) && error.response?.status === 410;

  if (expired) {
    return (
      <div>
        <h1>This link has expired</h1>
        <p>Verification links are valid for 24 hours.</p>
        <Link to="/resend-verification">Send a new link</Link>
      </div>
    );
  }
  return (
    <div>
      <h1>We couldn't confirm your email</h1>
      <p>The link may be invalid, or something went wrong on our end.</p>
      {token && <button onClick={() => mutate(token)}>Try again</button>}
      <Link to="/signup">Back to sign up</Link>
    </div>
  );
}
