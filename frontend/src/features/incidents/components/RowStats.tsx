import { StatBlock } from "./StatBlock";

export function RowStats({
  openIncidents,
  acknowledgedIncidents,
  resolvedIncidents,
  totalTeam,
  awayNowCount,
}: {
  openIncidents: number;
  acknowledgedIncidents: number;
  resolvedIncidents: number;
  totalTeam: number;
  awayNowCount: number;
}) {
  return (
    <div className="flex w-full bg-card border border-border/50 rounded-xl divide-x divide-border/50 overflow-hidden">
      <StatBlock title="Incidents (Open)" value={openIncidents} />
      <StatBlock
        title="Incidents (Acknowledged)"
        value={acknowledgedIncidents}
      />
      <StatBlock title="Incidents (Resolved)" value={resolvedIncidents} />
      <StatBlock title="Teams (Total)" value={totalTeam} />
      <StatBlock title="Away (Now)" value={awayNowCount} />
    </div>
  );
}
