import { TeamsTable } from "../../components/tables/TeamsTable";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateTeamDialog } from "../../components/dialogs/CreateTeamDialog";
import { SortControls } from "@/components/SortControls";
import type { SortState } from "../../types";

export function Teams() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    order: "asc",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Teams</h1>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <InputGroup className="w-1/3 max-w-sm bg-card">
            <InputGroupInput
              placeholder="Search"
              value={search}
              onChange={(v) => setSearch(v.currentTarget.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>

            {search.length > 0 && (
              <InputGroupAddon
                align="inline-end"
                className="cursor-pointer"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                <XIcon />
              </InputGroupAddon>
            )}
          </InputGroup>

          <div className="flex items-center gap-4">
            <SortControls
              sort={sort}
              onChange={(s) => {
                setSort(s);
                setPage(1);
              }}
              options={[
                { value: "name", label: "Name" },
                { value: "createdAt", label: "Created at" },
                { value: "rotationPeriodDays", label: "Rotation period" },
              ]}
            />
            <CreateTeamDialog />
          </div>
        </div>

        <TeamsTable
          search={debouncedSearch}
          sort={sort}
          page={page}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
