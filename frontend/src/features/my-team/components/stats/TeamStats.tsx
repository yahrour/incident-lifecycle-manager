import type { MyTeam } from "../../types";
import { StatBlock } from "./StatBlock";

export function TeamStats({
  team,
  membersCount,
  awayCount,
}: Pick<MyTeam, "team" | "membersCount"> & { awayCount: number }) {
  return (
    <div className="flex w-full bg-card border border-border/50 rounded-xl divide-x divide-border/50 overflow-hidden">
      <StatBlock title="Members" value={membersCount} />
      <StatBlock title="Away" value={awayCount} />
      <StatBlock title="Rotation (day)" value={team.rotationPeriodDays} />
      <StatBlock
        title="Escalation (min)"
        value={team.escalationTimeoutMinutes}
      />
    </div>
  );
}
