import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOrderToggle } from "./SortOrderToggle";
import type { SortState } from "@/types";

export function SortControls<F extends string>({
  sort,
  onChange,
  options,
}: {
  sort: SortState<F>;
  onChange: (sort: SortState<F>) => void;
  options: { value: F; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={sort.field}
        onValueChange={(field) => onChange({ ...sort, field: field as F })}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <SortOrderToggle
        order={sort.order}
        onChange={(order) => onChange({ ...sort, order })}
      />
    </div>
  );
}
