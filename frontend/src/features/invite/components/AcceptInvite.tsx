import { Link } from "react-router";
import { UserPlus } from "lucide-react";
import { useAcceptInvite } from "../hooks/useAcceptInvite";
import { Button } from "@/components/ui/button";
import { isAxiosError } from "axios";

type AcceptInviteProps = {
  token: string;
  email: string;
};

function getAcceptErrorMessage(error: unknown): string {
  if (!isAxiosError<{ message?: string }>(error)) {
    return "Something went wrong. Try again.";
  }
  switch (error.response?.status) {
    case 403:
      return (
        error.response?.data?.message ??
        "You don't have permission to accept this invite."
      );
    case 409:
      return (
        error.response?.data?.message ?? "You can't join this team right now."
      );
    case 410:
      return "This invite has expired. Ask your team admin for a new one.";
    case 404:
      return "This invite is no longer valid.";
    default:
      return "We couldn't add you to the team. Try again.";
  }
}

export function AcceptInvite({ token, email }: AcceptInviteProps) {
  const { mutate, isPending, error } = useAcceptInvite();

  const status = isAxiosError(error) ? error.response?.status : undefined;
  const canRetry = !status || status >= 500;

  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <UserPlus className="size-6 text-primary" />
        </div>

        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Join your team
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          You've been invited to join a team with
        </p>

        <p className="mt-1 font-medium">{email}</p>

        {error && (
          <div className="mt-5 w-full rounded-md bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              {getAcceptErrorMessage(error)}
            </p>
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            className="w-full"
            disabled={isPending || !canRetry}
            onClick={() => mutate(token)}
          >
            {isPending ? "Joining team..." : "Accept invitation"}
          </Button>

          <Link
            to="/"
            className="inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Not now
          </Link>
        </div>
      </div>
    </div>
  );
}
