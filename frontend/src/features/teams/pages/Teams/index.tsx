import { TeamsTable } from "./TeamsTable";
import { CreateTeam } from "./CreateTeam";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search, XIcon } from "lucide-react";
import { useState } from "react";

export function Teams() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Teams</h1>
        <span className="text-muted-foreground text-xs">3 teams</span>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <InputGroup className="w-1/3 bg-white">
            <InputGroupInput
              placeholder="Search..."
              value={search}
              onChange={(v) => {
                setSearch(v.currentTarget.value);
                setPage(1);
              }}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon
              align="inline-end"
              className="cursor-pointer"
              onClick={() => setSearch("")}
            >
              <XIcon />
            </InputGroupAddon>
          </InputGroup>

          <CreateTeam />
        </div>

        <TeamsTable search={search} page={page} setPage={setPage} />
      </div>
    </div>
  );
}
