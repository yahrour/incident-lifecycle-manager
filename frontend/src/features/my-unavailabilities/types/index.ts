import type { SortOrder } from "@/types";

type SortField = "createdAt";
export type SortState = { field: SortField; order: SortOrder };

export type Membership = {
  memberId: number;
  team: {
    id: string;
    name: string;
  };
};
