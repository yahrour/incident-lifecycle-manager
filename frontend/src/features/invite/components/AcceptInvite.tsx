import { Link } from "react-router";
import { UserPlus } from "lucide-react";
import { useAcceptInvite } from "../hooks/useAcceptInvite";
import { Button } from "@/components/ui/button";
import { isAxiosError } from "axios";
import { parseApiError } from "@/utils/api";
import { ErrorSection } from "@/components/ErrorSection";
import { getDashboardPath } from "@/lib/redirect";
import { useAuth } from "@/features/auth";

type AcceptInviteProps = {
  token: string;
  email: string;
};

export function AcceptInvite({ token, email }: AcceptInviteProps) {
  const { mutate, isPending, error } = useAcceptInvite();
  const { user } = useAuth();
  const errors = error ? parseApiError(error) : [];
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const canRetry = !status || status >= 500;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-8">
      <p className="text-center font-serif text-base italic leading-relaxed text-foreground md:text-3xl">
        Incident Lifecycle <span className="text-primary">Manager</span>
      </p>

      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border bg-white p-8 text-center">
        <UserPlus className="size-12 text-primary" />

        <h1 className="font-heading text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-foreground">
          Join your team
        </h1>

        <div className="w-full">
          <p className="text-sm leading-relaxed text-muted-foreground">
            You've been invited to join a team with
          </p>
          <p className="mt-2 break-words font-medium text-foreground">
            {email}
          </p>
        </div>

        {errors.length > 0 && (
          <div className="w-full">
            <ErrorSection errors={errors} />
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-3">
          <Button
            className="h-auto w-full whitespace-normal rounded-full bg-primary px-8 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary/90"
            disabled={isPending || !canRetry}
            onClick={() => mutate(token)}
          >
            {isPending ? "Joining team..." : "Accept invitation"}
          </Button>

          <Link
            to={user ? getDashboardPath(user.role) : "/login"}
            className="rounded-full px-6 py-2 text-sm font-medium text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground"
          >
            Not now
          </Link>
        </div>
      </div>
    </div>
  );
}
