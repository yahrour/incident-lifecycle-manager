export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
type SortField = "status" | "createdAt";
export type SortState = { field: SortField; order: SortOrder };

export type Membership = {
  memberId: number;
  team: {
    id: string;
    name: string;
  };
};

export type Filter = "ALL" | "PENDING" | "REJECTED" | "APPROVED" | "EXPIRED";
