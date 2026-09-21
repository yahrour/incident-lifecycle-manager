export type Team = {
  id: string;
  name: string;
  description: string | null;
  rotationPeriodDays: number;
  rotationStartDate: Date;
  escalationTimeoutMinutes: number;
  webhookUrl: string | null;
};

export type Metrics = {
  organization: {
    totalTeams: number;
    teamsMembersCounts: {
      id: string;
      name: string;
      count: number;
    }[];
    teamsCurrentOnCall: {
      id: string;
      name: string;
      onCall: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        specialty: string | null;
        role: string;
      }[];
    }[];
    totalUnavailabilities: number;
    activeUnavailabilities: number;
  };
};
