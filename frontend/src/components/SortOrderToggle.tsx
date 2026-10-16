import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortOrder } from "@/types";

export function SortOrderToggle({
  order,
  onChange,
}: {
  order: SortOrder;
  onChange: (order: SortOrder) => void;
}) {
  const labels = { desc: "Newest first", asc: "Oldest first" };
  return (
    <Button
      variant="outline"
      onClick={() =>
        onChange(order === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
      }
    >
      {order === SortOrder.DESC ? labels.desc : labels.asc}
      <ArrowUpDown size={16} />
    </Button>
  );
}
