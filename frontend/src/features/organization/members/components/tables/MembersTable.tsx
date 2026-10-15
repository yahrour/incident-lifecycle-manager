import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";
import { removeMember } from "../../api/members";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { formatJoined } from "../../utils/time";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Member } from "@/features/organization/shared/types";
import { Link } from "react-router";
import { TablePagination } from "@/features/organization/shared/components/TablePagination";
import {
  memberKeys,
  teamKeys,
  unavailabilityKeys,
} from "@/features/organization/shared/constants";

export function MembersTable({
  members,
  totalMembers,
  page,
  setPage,
  showOrgWide,
}: {
  members: Member[];
  totalMembers: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  showOrgWide: boolean;
}) {
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: number }) =>
      removeMember({ teamId, memberId }),
    onSuccess: (_data, { teamId }) => {
      toast.add({
        type: "success",
        title: "Team member removed",
        description: "The team member was successfully removed",
      });
      void queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      void queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: teamKeys.metrics() });
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
      void queryClient.invalidateQueries({ queryKey: unavailabilityKeys.all });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "Failed to remove team member",
        description: "We couldn't remove the team member. Please try again",
      });
    },
    onSettled: () => {
      setPendingMemberId(null);
    },
  });

  const handleRemove = (teamId: string, memberId: number) => {
    setPendingMemberId(memberId);
    mutation.mutate({ teamId, memberId });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Engineer</TableHead>
            {showOrgWide && <TableHead>Team</TableHead>}
            <TableHead>Role</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isAway = member.unavailabilities.length > 0;

            return (
              <TableRow key={member.id} className="p-0!">
                <TableCell className="font-medium text-sm flex-1">
                  {member.user.firstName + " " + member.user.lastName}
                </TableCell>
                {showOrgWide && (
                  <TableCell className="text-sm text-muted-foreground">
                    {member.team ? (
                      <Link
                        to={`/manager/teams/${member.teamId}`}
                        className="hover:underline hover:text-foreground"
                      >
                        {member.team.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground">
                  {member.user.role}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {member.user.specialty}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isAway ? "warning" : "success"}
                    className="uppercase"
                  >
                    {isAway ? "AWAY" : "AVAILABLE"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatJoined(member.joinedAt)}
                </TableCell>
                <TableCell className="p-0! m-0!">
                  <Button
                    variant="destructive"
                    className="bg-transparent"
                    onClick={() => handleRemove(member.teamId, member.id)}
                    disabled={mutation.isPending}
                    size="sm"
                  >
                    {pendingMemberId === member.id && mutation.isPending ? (
                      <Spinner />
                    ) : (
                      <Trash />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination page={page} setPage={setPage} total={totalMembers} />
    </>
  );
}
