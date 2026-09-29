import { useNavigate, useSearchParams } from "react-router";
import { XCircle, Clock, Loader2, Users, CheckCircle2 } from "lucide-react";
import { useValidateInvite } from "../hooks/useInvite";
import type { ReactNode } from "react";

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

const muted = "text-center text-sm text-muted-foreground";
export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const { data, isPending, error } = useValidateInvite(token);
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

  //the is registred is flase
  //then
  // go to register page with the team alerady set
  return <h1>hi there </h1>;
}
