import type { SortOrder } from "../../shared/types";

type SortField = "confirmed" | "createdAt";
export type SortState = { field: SortField; order: SortOrder };
