import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortOrder, type SortState } from "../types";

export function SortControls({
  sort,
  onSortChange,
  setPage,
}: {
  sort: SortState;
  onSortChange: React.Dispatch<React.SetStateAction<SortState>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline">{sort.field}</Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          onSortChange({
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
