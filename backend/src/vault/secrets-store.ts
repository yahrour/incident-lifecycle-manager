interface PostgresCredentials
{
  username: string;
  password: string;
  db: string;
  host: string;
  port: number;
}

let postgresCredentials: PostgresCredentials | null = null;

export function setPostgresCredentials(creds: PostgresCredentials): void {
  postgresCredentials = creds;
}

export function getPostgresCredentials(): PostgresCredentials {
  if (!postgresCredentials) {
    throw new Error(
      "Error!"
    );
  }
  return postgresCredentials;
}
