export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
type SortField = "createdAt";
export type SortState = { field: SortField; order: SortOrder };

export type Membership = {
  memberId: number;
  team: {
    id: string;
    name: string;
  };
};

export type Filter = "all" | "pending" | "rejected" | "approved" | "expired";
