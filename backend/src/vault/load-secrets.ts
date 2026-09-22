import axios from "axios";
import { setAppSecrets } from "@/vault/secrets-store";

interface VaultKvV2Response<T> {
  data: {
    data: T;
  };
}

interface AppSecrets
{
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

export async function loadSecretsFromVault(): Promise<void> {
  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN;

  if (!vaultAddr || !vaultToken) {
    throw new Error("[Vault] VAULT_ADDR or VAULT_TOKEN not set!!");
  }

  try {
    const { data } = await axios.get<VaultKvV2Response<AppSecrets>>(
      `${vaultAddr}/v1/secret/data/incident-lifecycle-manager`,
      { headers: { "X-Vault-Token": vaultToken } }
    );

    setAppSecrets(data.data.data);

    console.log("[Vault] App secrets loaded into memory.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Vault] Failed to load secrets: ${message}`);
    throw new Error("[Vault] Secret loading failed — aborting startup.");
  }
}
