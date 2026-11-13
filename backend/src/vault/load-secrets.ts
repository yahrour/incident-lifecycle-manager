import axios from "axios";
import { readFileSync } from "node:fs";

interface VaultKvV2Response<T> {
  data: { data: T };
}

interface AppSecrets {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

const SECRET_KEYS: (keyof AppSecrets)[] = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const TOKEN_FILE = process.env.VAULT_TOKEN_FILE ?? "/vault/token/token";
const RETRY_MAX = 60;
const RETRY_DELAY_MS = 1000;

function tryReadToken(): string | null {
  try {
    const t = readFileSync(TOKEN_FILE, "utf8").trim();
    return t || null;
  } catch {
    return null;
  }
}

export async function loadSecretsFromVault(): Promise<void> {
  const vaultAddr = process.env.VAULT_ADDR;
  if (!vaultAddr) throw new Error("[Vault] VAULT_ADDR not set");

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    const token = tryReadToken();
    if (token) {
      try {
        const { data } = await axios.get<VaultKvV2Response<AppSecrets>>(
          `${vaultAddr}/v1/secret/data/incident-lifecycle-manager`,
          { headers: { "X-Vault-Token": token }, timeout: 3000 }
        );
        const missing: string[] = [];
        for (const key of SECRET_KEYS) {
          const value = data.data.data[key];
          if (value) process.env[key] = value;
          else missing.push(key);
        }
        if (missing.length > 0) {
          throw new Error(
            `[Vault] Secret payload is missing: ${missing.join(", ")}`
          );
        }
        console.log("[Vault] App secrets loaded into process.env.");
        return;

      } catch (err) {
        if (attempt === RETRY_MAX) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new Error(`[Vault] Read failed after ${RETRY_MAX}s: ${msg}`);
        }
      }
    } else if (attempt === RETRY_MAX) {
      throw new Error(
        `[Vault] Backend token never appeared at ${TOKEN_FILE} after ${RETRY_MAX}s`
      );
    }
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
}
