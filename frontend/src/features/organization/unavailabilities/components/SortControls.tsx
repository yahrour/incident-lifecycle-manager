import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SortState } from "../types";
import { SortOrder } from "../../shared/types";

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
    <Button
      variant="outline"
      onClick={() => {
        onSortChange({
          field: sort.field,
          order: sort.order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
        });
        setPage(1);
      }}
    >
      {sort.order === SortOrder.DESC ? "Newest first" : "Oldest first"}
      <ArrowUpDown size={16} />
    </Button>
  );
}
