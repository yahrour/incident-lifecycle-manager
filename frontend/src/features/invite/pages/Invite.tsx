import type { ReactNode } from "react";
import { useSearchParams, Navigate, Link } from "react-router";
import { XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { AcceptInvite } from "../components/AcceptInvite";
import { useValidateInvite } from "../hooks/useValidateInvite";
import { RegisterViaInvite } from "../components/RegisterViaInvite";

const muted = "text-center text-sm text-muted-foreground";

function StatusScreen({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-background flex flex-col items-center justify-center  min-h-dvh gap-8">
      <p className="font-serif text-base italic leading-relaxed text-center text-foreground text-foreground md:text-3xl">
        Incident Lifecycle <span className="text-primary">Manager</span>
      </p>
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border bg-white p-8 text-center">
        {icon}
        <div>
          <h1 className="font-heading text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-foreground">
            {title}
          </h1>
        </div>
        {children}
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-[15px] font-semibold text-white no-underline transition-colors duration-200 hover:bg-primary/90"
        >
          Log in to your dashboard
        </Link>
      </div>
    </div>
  );
}

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, isLoading: authLoading } = useAuth();
  const { data, isPending, isError } = useValidateInvite(token);

  if (!token) {
    return (
      <StatusScreen
        icon={<XCircle className="mx-auto size-12 text-destructive" />}
        title="Invalid invite link"
      >
        <p className={muted}>
          This invite link is incomplete. Ask your team admin to send a new one.
        </p>
      </StatusScreen>
    );
  }

  if (authLoading || isPending) {
    return (
      <StatusScreen
        icon={
          <Loader2 className="mx-auto size-12 animate-spin text-muted-foreground" />
        }
        title="Checking your invite"
      >
        <p className={muted}>This will only take a moment.</p>
      </StatusScreen>
    );
  }

  if (isError) {
    return (
      <StatusScreen
        icon={<XCircle className="mx-auto size-12 text-destructive" />}
        title="Invalid invite link"
      >
        <p className={muted}>
          This invite is invalid or has expired. Ask your team admin to send a
          nwe one.
        </p>
      </StatusScreen>
    );
  }

  if (user) {
    return <AcceptInvite token={token} email={data.email} />;
  }

  if (data.isAlreadyRegistered) {
    const back = `/invite?token=${encodeURIComponent(token)}`;
    return (
      <Navigate to={`/login?redirect=${encodeURIComponent(back)}`} replace />
    );
  }

  return <RegisterViaInvite token={token} email={data.email} />;
}
