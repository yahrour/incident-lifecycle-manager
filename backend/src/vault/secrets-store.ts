interface AppSecrets {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MAIL_USER: string;
  MAIL_PASS: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
}

let appSecrets: AppSecrets | null = null;

export function setAppSecrets(secrets: AppSecrets): void {
  appSecrets = secrets;
}

function requireSecrets(): AppSecrets {
  if (!appSecrets) {
    throw new Error(
      "[SecretsStore] Secrets requested before Vault secrets were loaded. " +
        "Ensure loadSecretsFromVault() runs before this is called."
    );
  }
  return appSecrets;
}

export function getDatabaseUrl(): string {
  return requireSecrets().DATABASE_URL;
}

export function getJwtSecrets(): {
  secret: string;
  refreshSecret: string;
} {
  const s = requireSecrets();
  return { secret: s.JWT_SECRET, refreshSecret: s.JWT_REFRESH_SECRET };
}

export function getGoogleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const s = requireSecrets();
  return { clientId: s.GOOGLE_CLIENT_ID, clientSecret: s.GOOGLE_CLIENT_SECRET };
}

export function getMailCredentials(): { user: string; pass: string } {
  const s = requireSecrets();
  return { user: s.MAIL_USER, pass: s.MAIL_PASS };
}

export function getDiscordCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const s = requireSecrets();
  return { clientId: s.DISCORD_CLIENT_ID, clientSecret: s.DISCORD_CLIENT_SECRET };
}
