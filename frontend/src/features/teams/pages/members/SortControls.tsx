import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SortState = { field: string; order: "asc" | "desc" } | null;

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
        value={sort?.field ?? "name"}
        onValueChange={(field) =>
          onSortChange({ field: field as string, order: sort?.order ?? "asc" })
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
            field: sort?.field ?? "name",
            order: sort?.order === "asc" ? "desc" : "asc",
          })
        }
      >
        <ArrowUpDown size={16} />
      </Button>
    </div>
  );
}
