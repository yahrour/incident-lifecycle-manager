import type { MyTeam } from "../types";
import { LatestMembersCard } from "./cards/LatestMembersCard";
import { ServicesCard } from "./cards/ServicesCard";
import { TeammatesAwayCard } from "./cards/TeammatesAwayCard";
import { UpcomingShiftsCard } from "./cards/UpcomingShiftsCard";
import { YourShiftCard } from "./cards/YourShiftCard";
import { TeamStats } from "./stats/TeamStats";

export function TeamDetails({ myTeam }: { myTeam: MyTeam }) {
  const { team, membersCount, members, teamUpcomingRotations, teammatesAway } =
    myTeam;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight capitalize text-foreground">
          {team.name}
        </h1>
        {team.description && (
          <p className="text-sm text-muted-foreground">{team.description}</p>
        )}
      </div>

      <TeamStats
        team={team}
        membersCount={membersCount}
        awayCount={teammatesAway.length}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:sticky lg:top-6 lg:order-last">
          <YourShiftCard />
          <UpcomingShiftsCard teamUpcomingRotations={teamUpcomingRotations} />
          <ServicesCard services={team.services} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <LatestMembersCard members={members} />
          <TeammatesAwayCard teammatesAway={teammatesAway} />
        </div>
      </div>
    </div>
  );
}
