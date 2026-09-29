export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export type SortState = { field: string; order: SortOrder };

export type InviteEngineer = { inviteLink: string };
