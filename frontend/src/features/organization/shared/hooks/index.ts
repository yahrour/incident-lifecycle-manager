import { useEffect } from "react";

export function usePreviousPageWhenEmpty(
  items: readonly unknown[] | undefined,
  page: number,
  setPage: React.Dispatch<React.SetStateAction<number>>
) {
  useEffect(() => {
    if (items && items.length === 0 && page > 1) {
      setPage(page - 1);
    }
  }, [items, page, setPage]);
}
