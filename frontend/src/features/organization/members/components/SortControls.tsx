import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SortOrder, type SortState } from "../types";

export function SortControls({
  sort,
  onSortChange,
}: {
  sort: SortState;
  onSortChange: React.Dispatch<React.SetStateAction<SortState>>;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={sort.field}
        onValueChange={(field) =>
          onSortChange({
            field: field as string,
            order: sort.order,
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="specialty">Specialty</SelectItem>
          <SelectItem value="joinedAt">Date joined</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          onSortChange({
            field: sort.field,
            order:
              sort.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
          })
        }
      >
        <ArrowUpDown size={16} />
      </Button>
    </div>
  );
}
