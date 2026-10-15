export type UnavailabilityFilter =
  "all" | "pending" | "rejected" | "approved" | "expired";

export type UnavailabilityStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type Unavailability = {
  id: number;
  memberId: number;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  createdAt: Date;
  status: UnavailabilityStatus;
};
