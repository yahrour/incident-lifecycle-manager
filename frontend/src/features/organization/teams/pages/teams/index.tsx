import { TeamsTable } from "../../components/tables/TeamsTable";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateTeamDialog } from "../../components/dialogs/CreateTeamDialog";
import { Page } from "@/components/Page";

export function Teams() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Page header={<h1 className="font-medium text-sm">Teams</h1>}>
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

        <CreateTeamDialog />
      </div>

      <TeamsTable search={debouncedSearch} page={page} setPage={setPage} />
    </Page>
  );
}
