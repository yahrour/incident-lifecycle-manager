import type { ReactNode } from "react";
import { useSearchParams, Navigate } from "react-router";
import { XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { AcceptInvite } from "../components/AcceptInvite";
import { useValidateInvite } from "../hooks/useValidate";
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
    <div className="flex flex-col gap-5">
      {icon}
      <h1 className="font-heading text-center tracking-tight">{title}</h1>
      {children}
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
        <p className={muted}>This invite link is missing its token.</p>
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
        <p className={muted}>This invite is invalid or has expired.</p>
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
