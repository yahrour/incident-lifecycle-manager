import { TeamsTable } from "./TeamsTable";
import { CreateTeam } from "./CreateTeam";

export function Teams() {
  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Teams</h1>
        <span className="text-muted-foreground text-xs">3 teams</span>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs opacity-50">
            Organize engineers into teams to manage on-call rotations
          </p>
          <CreateTeam />
        </div>
        <TeamsTable />
      </div>
    </div>
  );
}
