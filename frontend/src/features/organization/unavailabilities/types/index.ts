import type { SortOrder } from "../../shared/types";

type SortField = "status" | "createdAt";
export type SortState = { field: SortField; order: SortOrder };
