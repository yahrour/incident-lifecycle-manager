import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Teams() {
  const teams = [
    {
      team: "platform",
      services: ["api-gateway", "auth", "payments"],
      members: 8,
      rotation: "7",
      onCallNow: "Sarah Chen",
      escalates: "Platform Lead",
    },
    {
      team: "frontend",
      services: ["web-app", "mobile-app"],
      members: 6,
      rotation: "Daily",
      onCallNow: "James Wilson",
      escalates: "Frontend Lead",
    },
    {
      team: "data",
      services: ["data-pipeline", "analytics", "warehouse"],
      members: 5,
      rotation: 9,
      onCallNow: "Maya Patel",
      escalates: "Data Lead",
    },
  ];

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
          <Button className="cursor-pointer">
            <Plus data-icon="inline-start" />
            Create team
          </Button>
        </div>
        <Table>
          <TableHeader className="uppercase">
            <TableHead className="w-2/5">team</TableHead>
            <TableHead>services</TableHead>
            <TableHead className="w-[60px]">members</TableHead>
            <TableHead>roation</TableHead>
            <TableHead>on-call now</TableHead>
            <TableHead>escalates</TableHead>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow
                className="w-full cursor-pointer"
                onClick={() => (window.location.href = `/teams/${team.team}`)}
              >
                <TableCell className="font-medium text-sm flex-1">
                  {team.team}
                </TableCell>
                <TableCell className="text-xs text-left text-muted-foreground">
                  {team.services.join(" • ")}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {team.members}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  every {team.rotation} days
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {team.onCallNow}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {team.escalates}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
