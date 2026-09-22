import { TeamsTable } from "./TeamsTable";
import { CreateTeam } from "./CreateTeam";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function Teams() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Teams</h1>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <InputGroup className="w-1/3 max-w-sm bg-white">
            <InputGroupInput
              placeholder="Search"
              value={search}
              onChange={(v) => setSearch(v.currentTarget.value.trim())}
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

          <CreateTeam />
        </div>

        <TeamsTable search={debouncedSearch} page={page} setPage={setPage} />
      </div>
    </div>
  );
}
