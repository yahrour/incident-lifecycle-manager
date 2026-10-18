import { useQuery } from "@tanstack/react-query";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { useAuth } from "@/features/auth";
import { fetchMyTeam } from "../api/team";
import { teamKeys } from "../constants";
import { ErrorState } from "@/components/ErrorState";
import { LatestMembersCard } from "./cards/LatestMembersCard";
import { ServicesCard } from "./cards/ServicesCard";
import { TeamStats } from "./stats/TeamStats";
import { TeammatesAwayCard } from "./cards/TeammatesAwayCard";
import { UpcomingShiftsCard } from "./cards/UpcomingShiftsCard";
import { YourShiftCard } from "./cards/YourShiftCard";

export function TeamOverview() {
  const { user } = useAuth();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: teamKeys.detail(user?.id ?? ""),
    queryFn: fetchMyTeam,
  });

  if (isPending) {
    return <FullPageSpinner />;
  }

  if (isError || !data.data) {
    return (
      <ErrorState
        onRetry={() => void refetch()}
        title="Unable to load your team"
        description="Something went wrong while loading your team. Please try again."
      />
    );
  }

  const { team, membersCount, members, teamUpcomingRotations, teammatesAway } =
    data.data;

  return (
    <>
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
        <main className="min-w-0 space-y-6 lg:col-span-2">
          <LatestMembersCard members={members} />
          <TeammatesAwayCard teammatesAway={teammatesAway} />
        </main>
        <div className="space-y-4 lg:sticky">
          <YourShiftCard />
          <UpcomingShiftsCard teamUpcomingRotations={teamUpcomingRotations} />
          <ServicesCard services={team.services} />
        </div>
      </div>
    </>
  );
}
