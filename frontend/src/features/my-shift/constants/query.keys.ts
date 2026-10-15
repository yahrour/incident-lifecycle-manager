export const shiftKeys = {
  all: ["shift"] as const,
  detail: (userId: string) => [...shiftKeys.all, userId],
};

export const membershipKeys = {
  all: ["membership"],
};
