import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NoMembersState } from "../NoMembersState";
import type { Member } from "@/features/organization/shared/types";

export function MembersTable({ members }: { members: Member[] | undefined }) {
  if (!members) {
    return <NoMembersState />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Engineer</TableHead>
          <TableHead>Specialty</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead>Open</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>$250.00</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>Paid</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
