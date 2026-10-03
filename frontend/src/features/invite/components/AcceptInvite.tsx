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
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-10">
      <UserPlus className="mx-auto size-12 text-muted-foreground" />
      <h1 className="font-heading text-center tracking-tight">
        You've been invited to a team
      </h1>

      <p className="text-center text-sm text-muted-foreground">
        This invite was sent to {email}.
      </p>
      {error && (
        <p className="text-center text-sm text-destructive">
          {getAcceptErrorMessage(error)}
        </p>
      )}
      <Button
        className="w-full"
        disabled={isPending || !canRetry}
        onClick={() => mutate(token)}
      >
        {isPending ? "Accepting..." : "Accept"}
      </Button>
      <Link
        to="/engineer/my-shift"
        className="text-center text-sm font-medium text-primary hover:underline"
      >
        Not now
      </Link>
    </div>
  );
}
