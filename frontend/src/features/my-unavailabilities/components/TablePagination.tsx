import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DEFAULT_LIMIT } from "../constants";
import type { SetStateAction } from "react";

export function TablePagination({
  page,
  setPage,
  total,
}: {
  page: number;
  setPage: React.Dispatch<SetStateAction<number>>;
  total: number;
}) {
  const isFirstPage = page === 1;
  const isLastPage = page * DEFAULT_LIMIT >= total;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem
          className={isFirstPage ? "pointer-events-none opacity-50" : undefined}
          aria-disabled={isFirstPage}
        >
          <PaginationPrevious onClick={() => setPage(page - 1)} />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink isActive>{page}</PaginationLink>
        </PaginationItem>

        <PaginationItem
          className={isLastPage ? "pointer-events-none opacity-50" : undefined}
          aria-disabled={isLastPage}
        >
          <PaginationNext onClick={() => setPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
