export const SortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export type SortState<F extends string = string> = {
  field: F;
  order: SortOrder;
};
