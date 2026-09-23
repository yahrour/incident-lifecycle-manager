import { createHash } from "crypto";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function createIncidentFingerprint(
  provider: string,
  service: string,
  title: string
): string {
  const identity = JSON.stringify([
    normalize(provider),
    normalize(service),
    normalize(title),
  ]);

  return createHash("sha256").update(identity).digest("hex");
}
