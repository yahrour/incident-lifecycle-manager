import axios from "axios";
import { setPostgresCredentials } from "@/vault/secrets-store";

interface VaultKvV2Response<T> {
  data: {
    data: T;
    metadata: Record<string, unknown>;
  };
}

interface PostgresSecret {
  username: string;
  password: string;
  db: string;
}


export async function loadSecretsFromVault(): Promise<void> {
  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN;

  if (!vaultAddr || !vaultToken){
    throw new Error(
      "[Vault] VAULT_ADDR or VAULT_TOKEN not set!!"
    );
  }

  try {
    const { data } = await axios.get<VaultKvV2Response<PostgresSecret>>(
      `${vaultAddr}/v1/secret/data/postgres`,
      { headers: { "X-Vault-Token": vaultToken } }
    );

    const { username, password, db } = data.data.data;

    setPostgresCredentials({
      username,
      password,
      db,
      host: process.env.POSTGRES_HOST ?? "localhost",
      port: Number(process.env.POSTGRES_PORT ?? 5432),
    });

    console.log("[Vault] Database credentials loaded into memory.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Vault] Failed to load secrets: ${message}`);
    throw new Error(
      "Vault secret loading failed"
    );
  }
}
