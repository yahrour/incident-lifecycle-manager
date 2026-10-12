import { UsersIcon } from "lucide-react";

export function NoMembershipState() {
  return (
    <div className="h-56 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <UsersIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">You're not part of a team yet</h3>
        <p className="text-sm text-muted-foreground">
          Once you join a team, you'll be able to see your on-call rotation
          here. Ask your SRE for an invite.
        </p>
      </div>
    </div>
  );
}
