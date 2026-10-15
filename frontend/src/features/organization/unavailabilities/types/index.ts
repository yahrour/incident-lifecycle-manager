import type { SortOrder } from "@/types";

type SortField = "status" | "createdAt";
export type SortState = { field: SortField; order: SortOrder };
