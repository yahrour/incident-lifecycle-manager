export type Shift = {
  isOnCall: boolean;
  currentShift: {
    team?: {
      id: string;
      name: string;
      escalationTimeoutMinutes: number;
    };
    position?: "PRIMARY" | "SECONDARY";
    startsAt?: Date;
    endsAt?: Date;
    incidents?: {
      totalAssignedIncidents: number;
      totalUnacknowledgedIncidents: number;
    };
  };
};
