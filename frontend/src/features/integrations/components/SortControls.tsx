import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortField, SortState } from "../types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "createdAt", label: "Created at" },
  { value: "expiresAt", label: "Expires at" },
  { value: "name", label: "Name" },
];

export function SortControls({ sort, onSortChange, }: { sort: SortState; onSortChange: React.Dispatch<React.SetStateAction<SortState>>; }) {
  return (
    <div className="flex items-center gap-2">
      <Select items={SORT_OPTIONS} value={sort.field} onValueChange={(field) => { if (field) onSortChange({ field, order: sort.order }); }} >
        <SelectTrigger className="w-40" aria-label="Sort by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        aria-label={`Sort ${sort.order === "asc" ? "descending" : "ascending"}`}
        onClick={() =>
          onSortChange({
            field: sort.field,
            order: sort.order === "asc" ? "desc" : "asc",
          })
        }
      >
        <ArrowUpDown size={16} />
      </Button>
    </div>
  );
}
