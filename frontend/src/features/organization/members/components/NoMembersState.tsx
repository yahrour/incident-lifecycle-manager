import { UsersIcon } from "lucide-react";

export function NoMembersState() {
  return (
    <div className="h-32 mt-2 p-4 text-center space-y-4 flex flex-col justify-center items-center">
      <UsersIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium text-sm">No members yet</h3>
        <p className="text-sm text-muted-foreground">
          Invite someone to this team to get started.
        </p>
      </div>
    </div>
  );
}
