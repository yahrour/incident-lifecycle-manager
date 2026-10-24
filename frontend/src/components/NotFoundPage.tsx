import { Link } from "react-router";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Role } from "@/types";

export default function NotFoundPage() {
  const { user } = useAuth();
  const homePath = user
    ? user.role === Role.SRE
      ? "/manager/overview"
      : "/engineer/my-team"
    : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">
          ERROR 404
        </span>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          This page went off-call
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          This route isn't on-call right now. It may have moved, or the link's
          gone stale.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button
            nativeButton={false}
            render={
              <Link className="flex" to={homePath}>
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            }
          ></Button>
        </div>
      </div>
    </div>
  );
}
