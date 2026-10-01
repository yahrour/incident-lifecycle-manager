import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type SortState } from "../types";
import { SortOrder } from "../../shared/types";

export function SortControls({
  sort,
  setSort,
  setPage,
}: {
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={sort.field}
        onValueChange={(field) => {
          if (field) {
            setSort({ field, order: sort.order });
            setPage(1);
          }
        }}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="createdAt">Created at</SelectItem>
          <SelectItem value="rotationPeriodDays">Rotation period</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setSort({
            field: sort.field,
            order:
              sort.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
          });
          setPage(1);
        }}
      >
        <ArrowUpDown size={16} />
      </Button>
    </div>
  );
}
