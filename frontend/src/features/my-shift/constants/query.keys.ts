export const shiftKeys = {
  all: ["shift"] as const,
  detail: (userId: string) => [...shiftKeys.all, userId],
};
