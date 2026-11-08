import { StatBlock } from "./StatBlock";

export function RowStats({
  openIncidents,
  acknowledgedIncidents,
  resolvedIncidents,
  totalTeam,
  awayNowCount,
}: {
  openIncidents: number | string;
  acknowledgedIncidents: number | string;
  resolvedIncidents: number | string;
  totalTeam: number;
  awayNowCount: number;
}) {
  return (
    <div className="flex flex-wrap w-full gap-px bg-border/50 border border-border/50 rounded-xl overflow-hidden *:basis-40 *:bg-card">
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
