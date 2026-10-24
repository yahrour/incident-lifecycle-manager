/**
 * Database seed script — makes the app feel lived-in.
 *
 * Creates (deterministic: same data every run, safe to re-run):
 *  - 4 SRE users (team owners) + 50 ENGINEER users, 5 per team
 *  - 10 teams with services, rotation settings and escalation timeouts
 *  - Unavailability windows (past / current / future; approved / pending / rejected),
 *    plus a bulk set of 24 for Amelia Martin (engineer@example.com)
 *  - Demo scenario: Amelia is the primary on-call right now, and three of her
 *    teammates are away (two now, one starting in 5 days)
 *  - API keys per SRE (one disabled)
 *  - ~120 incidents over the last 30 days (open / acknowledged / resolved)
 *    with assignees, MTTA/MTTR, linked alerts and responder notes
 *  - ~60 extra "noise" alerts that never became incidents
 *
 * Demo logins (password: Password123!):
 *   SRE:      sre@example.com
 *   ENGINEER: engineer@example.com
 *
 * Not seeded on purpose: RefreshToken, InviteToken (runtime artifacts).
 * Run with: `npm run db:seed`
 */

import "dotenv/config";
import { createHash } from "crypto";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient, Role } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PASSWORD = "Password123!";
const PER_TEAM = 5;
const INCIDENT_COUNT = 120;
const NOISE_ALERT_COUNT = 60;

// ── Deterministic randomness (mulberry32) so every run produces the same data
let seed = 20240601;
function rnd(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

// ── Time helpers
const NOW = Date.now();
const SEC = 1000;
const HOUR = 3600 * SEC;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW - ms);
function dayOffset(offset: number): Date {
  const d = new Date(NOW);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

// Fixed, valid UUIDs so re-running never duplicates
const uuid = (prefix: "a" | "b" | "c", n: number) =>
  `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Reference data ───────────────────────────────────────────────────────
const FIRST = [
  "Amelia", "Noah", "Liam", "Sofia", "Chloe", "Lucas",
  "Fatima", "Ethan", "Ingrid", "Diego", "Hana", "Marcus", "Leila", "Oscar", "Zara", "Kenji",
  "Nadia", "Tomas", "Aisha", "Felix", "Elena",
];
const LAST = [
  "Martin", "Okafor", "Nguyen", "Garcia", "Tanaka", "Patel", "Haddad", "Kowalski", "Silva", "Johansson",
  "Rossi", "Mensah", "Dubois", "Kim", "Novak", "Ali", "Moreau",
];
const TIMEZONES = [
  "UTC", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Tokyo",
  "Europe/London", "Asia/Kolkata", "Africa/Casablanca",
];
const SPECIALTIES = [
  "Kubernetes", "Databases", "Networking", "Observability", "Frontend", "Backend",
  "Security", "Mobile", "Data pipelines", "CI/CD",
];

const SRES = [
  { firstName: "Sarah", lastName: "Connor", email: "sre@example.com" },
  { firstName: "Victor", lastName: "Hale", email: "victor.hale@example.com" },
  { firstName: "Mina", lastName: "Park", email: "mina.park@example.com" },
  { firstName: "Daniel", lastName: "Reyes", email: "daniel.reyes@example.com" },
];

const TEAMS = [
  { name: "frontend", description: "Customer-facing web application", services: ["frontend-app", "web-app", "cdn-edge"], period: 7, escalation: 5 },
  { name: "backend", description: "Core APIs and platform services", services: ["checkout-service", "payments-api", "auth-service"], period: 14, escalation: 10 },
  { name: "mobile", description: "iOS and Android apps", services: ["mobile-ios", "mobile-android", "push-gateway"], period: 7, escalation: 5 },
  { name: "platform", description: "Internal developer tooling", services: ["ci-pipeline", "artifact-registry", "build-cache"], period: 14, escalation: 15 },
  { name: "data", description: "Data warehouse and ETL pipelines", services: ["etl-pipeline", "warehouse-sync", "kafka-cluster"], period: 7, escalation: 10 },
  { name: "security", description: "Identity, access control, and vulnerability response", services: ["vault-service", "sso-gateway", "waf"], period: 7, escalation: 5 },
  { name: "infrastructure", description: "Cloud infrastructure and networking", services: ["network-gateway", "load-balancer", "dns-resolver"], period: 14, escalation: 10 },
  { name: "payments", description: "Billing, invoicing, and payment processing", services: ["billing-service", "invoice-worker", "stripe-bridge"], period: 7, escalation: 5 },
  { name: "search", description: "Search and recommendations", services: ["search-api", "indexer", "recommendation-engine"], period: 14, escalation: 15 },
  { name: "notifications", description: "Email, SMS, and push notifications", services: ["email-sender", "sms-gateway", "notification-hub"], period: 7, escalation: 10 },
] as const;

const INCIDENT_TEMPLATES = [
  "High error rate on {s}", "Elevated p99 latency on {s}", "{s} pods crash looping",
  "CPU saturation on {s}", "Memory usage above 85% on {s}",
  "Connection pool exhausted on {s}", "5xx spike on {s}", "{s} health check failing",
  "Queue backlog growing on {s}", "Certificate expiration approaching on {s}",
];
const NOTE_TEXTS = [
  "Acknowledged, looking into it now.",
  "Checked recent deploys — nothing obviously related.",
  "Seeing the spike correlate with a traffic surge from one region.",
  "Rolled back the latest release, watching the metrics.",
  "Scaled the deployment up by 2 replicas as a stopgap.",
  "Root cause looks like a slow query after last migration.",
  "Restarted the affected pods, error rate is dropping.",
  "Upstream provider confirmed degraded performance on their end.",
  "Added a follow-up ticket to tune the alert threshold.",
  "Monitoring for 30 more minutes before resolving.",
  "Fix deployed and verified, closing out.",
  "Escalating to the team owner, this needs a second pair of eyes.",
];
const UNAVAILABILITY_REASONS = [
  "Vacation", "Public holiday", "Conference", "Medical appointment", "Family event", "Training day", "Moving house",
];
const PROVIDERS = ["prometheus", "grafana", "datadog"];

// Hand-written, non-overlapping unavailability windows for Amelia Martin
// (engineer@example.com). Offsets are days from today; `len` extends the end date.
// Spans roughly 4 months back to 3 months ahead, with every status represented.
const AMELIA_UNAVAILABILITIES = [
  // past
  { offset: -110, len: 3, reason: "Vacation", status: "APPROVED" },
  { offset: -98, len: 1, reason: "Medical appointment", status: "APPROVED" },
  { offset: -90, len: 5, reason: "Conference", status: "APPROVED" },
  { offset: -78, len: 2, reason: "Family event", status: "REJECTED" },
  { offset: -70, len: 1, reason: "Public holiday", status: "APPROVED" },
  { offset: -62, len: 4, reason: "Vacation", status: "APPROVED" },
  { offset: -50, len: 1, reason: "Training day", status: "APPROVED" },
  { offset: -44, len: 2, reason: "Moving house", status: "REJECTED" },
  { offset: -36, len: 3, reason: "Conference", status: "APPROVED" },
  { offset: -28, len: 1, reason: "Medical appointment", status: "APPROVED" },
  { offset: -21, len: 2, reason: "Family event", status: "APPROVED" },
  { offset: -14, len: 1, reason: "Training day", status: "REJECTED" },
  { offset: -7, len: 1, reason: "Public holiday", status: "APPROVED" },
  // (nothing current on purpose: she is on call right now, see "Demo scenario")
  { offset: -4, len: 2, reason: "Vacation", status: "APPROVED" },
  // future
  { offset: 8, len: 2, reason: "Medical appointment", status: "PENDING" },
  { offset: 15, len: 6, reason: "Vacation", status: "PENDING" },
  { offset: 27, len: 1, reason: "Public holiday", status: "APPROVED" },
  { offset: 34, len: 3, reason: "Conference", status: "PENDING" },
  { offset: 45, len: 2, reason: "Family event", status: "PENDING" },
  { offset: 52, len: 1, reason: "Training day", status: "REJECTED" },
  { offset: 60, len: 5, reason: "Vacation", status: "PENDING" },
  { offset: 71, len: 1, reason: "Medical appointment", status: "PENDING" },
  { offset: 80, len: 3, reason: "Moving house", status: "PENDING" },
  { offset: 90, len: 2, reason: "Public holiday", status: "PENDING" },
] as const;

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log("Seeding…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 1. Users ---------------------------------------------------------------
  const engineerCount = TEAMS.length * PER_TEAM;
  const userRows: Prisma.UserCreateManyInput[] = [
    ...SRES.map((s, i) => ({
      ...s,
      passwordHash,
      role: Role.SRE,
      specialty: "Reliability engineering",
      timezone: TIMEZONES[i % TIMEZONES.length],
    })),
    ...Array.from({ length: engineerCount }, (_, i) => {
      const firstName = FIRST[i % FIRST.length];
      const lastName = LAST[i % LAST.length];
      return {
        firstName,
        lastName,
        email:
          i === 0
            ? "engineer@example.com"
            : `${firstName}.${lastName}.${i}@example.com`.toLowerCase(),
        passwordHash,
        role: Role.ENGINEER,
        specialty: pick(SPECIALTIES),
        timezone: pick(TIMEZONES),
      };
    }),
  ];
  await prisma.user.createMany({ data: userRows, skipDuplicates: true });

  const users = await prisma.user.findMany({
    where: { email: { in: userRows.map((u) => u.email) } },
  });
  const byEmail = new Map(users.map((u) => [u.email, u]));
  const sres = SRES.map((s) => byEmail.get(s.email)!);
  const engineers = userRows
    .filter((u) => u.role === Role.ENGINEER)
    .map((u) => byEmail.get(u.email)!);

  // 2. Teams + members -----------------------------------------------------
  type Team = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    ownerId: string;
    description: string | null;
    services: string[];
    rotationPeriodDays: number;
    rotationStartDate: Date;
    currentRotationIndex: number;
    lastRotatedAt: Date;
    escalationTimeoutMinutes: number;
  };
  const teams: Team[] = [];
  for (const [i, t] of TEAMS.entries()) {
    const startDaysAgo = int(3, 30);

    // Distinct createdAt per team, oldest first (frontend is the oldest).
    // 430+ days ago so every team predates its members' joinedAt (max 400 days ago).
    // Teams are 21 days apart and the time-of-day offset is under 24h, so values never collide.
    const createdAt = ago(
      (430 + (TEAMS.length - 1 - i) * 21) * DAY + ((i * 7919) % 86_400) * SEC
    );

    const ownerId = sres[i % sres.length].id;

    const team = await prisma.team.upsert({
      where: { ownerId_name: { ownerId, name: t.name } },
      update: { createdAt }, // also fixes teams that already exist
      create: {
        name: t.name,
        description: t.description,
        services: [...t.services],
        ownerId,
        rotationPeriodDays: t.period,
        rotationStartDate: ago(startDaysAgo * DAY),
        currentRotationIndex: Math.floor(startDaysAgo / t.period) % PER_TEAM,
        lastRotatedAt: ago((startDaysAgo % t.period) * DAY),
        escalationTimeoutMinutes: t.escalation,
        createdAt,
      },
    });
    teams.push(team);
  }

  await prisma.teamMember.createMany({
    data: engineers.map((u, i) => ({
      userId: u.id,
      teamId: teams[Math.floor(i / PER_TEAM)].id,
      joinedAt: ago(int(10, 400) * DAY),
    })),
    skipDuplicates: true,
  });
  const members = await prisma.teamMember.findMany({ orderBy: { id: "asc" } });
  const membersByTeam = new Map<string, typeof members>();
  for (const m of members) {
    membersByTeam.set(m.teamId, [...(membersByTeam.get(m.teamId) ?? []), m]);
  }

  // 3. Unavailabilities ----------------------------------------------------
  const windows: Prisma.UnavailabilityCreateManyInput[] = [];
  for (const m of members) {
    if (!chance(0.4)) continue;
    const kinds = chance(0.5) ? ["past", "current", "future"] : ["past", "future"];
    for (const kind of kinds.sort(() => rnd() - 0.5)) {
      const [offset, len] =
        kind === "past"
          ? [-int(5, 25), int(1, 5)]
          : kind === "current"
            ? [-int(0, 2), int(3, 6)]
            : [int(2, 25), int(1, 7)];
      const status =
        kind === "current"
          ? "APPROVED"
          : kind === "past"
            ? chance(0.8) ? "APPROVED" : "REJECTED"
            : pick(["PENDING", "PENDING", "PENDING", "REJECTED"] as const);
      windows.push({
        memberId: m.id,
        startDate: dayOffset(offset),
        endDate: new Date(dayOffset(offset + len).getTime() + (23 * HOUR + 59 * 60 * SEC)),
        reason: pick(UNAVAILABILITY_REASONS),
        status,
      });
    }
  }
  // Amelia Martin (engineer@example.com) gets a hand-written bulk set instead of
  // the random ones above. The random ones are dropped *after* generation so the
  // random sequence (and therefore all other seeded data) stays unchanged.
  const amelia = byEmail.get("engineer@example.com")!;
  const ameliaMember = members.find((m) => m.userId === amelia.id)!;
  for (let i = windows.length - 1; i >= 0; i--) {
    if (windows[i].memberId === ameliaMember.id) windows.splice(i, 1);
  }
  windows.push(
    ...AMELIA_UNAVAILABILITIES.map((u) => ({
      memberId: ameliaMember.id,
      startDate: dayOffset(u.offset),
      endDate: new Date(dayOffset(u.offset + u.len).getTime() + (23 * HOUR + 59 * 60 * SEC)),
      reason: u.reason,
      status: u.status,
    }))
  );

  // Demo scenario: Amelia is the primary on-call right now, and a few of her
  // teammates are away. No rnd() calls here, so the rest of the seed is unchanged.
  const ameliaTeamId = ameliaMember.teamId;
  const teamMembers = members.filter((m) => m.teamId === ameliaTeamId);
  // getCurrentOnCall walks members ordered by joinedAt, starting at currentRotationIndex
  const rotationOrder = [...teamMembers].sort(
    (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
  );
  await prisma.team.update({
    where: { id: ameliaTeamId },
    data: {
      currentRotationIndex: rotationOrder.findIndex((m) => m.id === ameliaMember.id),
      lastRotatedAt: ago(DAY), // rotation is not due for another period - 1 days
    },
  });

  const awayTeammates = teamMembers.filter((m) => m.id !== ameliaMember.id).slice(0, 3);
  const awayIds = new Set(awayTeammates.map((m) => m.id));
  for (let i = windows.length - 1; i >= 0; i--) {
    if (awayIds.has(windows[i].memberId)) windows.splice(i, 1);
  }
  const usedCreatedAt = new Set<number>();
    windows.forEach((w, i) => {
      const lead = (2 + (i % 5)) * DAY + ((i * 7919) % 86_400) * SEC;
      let t = Math.min(new Date(w.startDate).getTime() - lead, NOW - HOUR);
      while (usedCreatedAt.has(t)) t += 1;
      usedCreatedAt.add(t);
      w.createdAt = new Date(t);
    });


  // Clear their existing rows first so re-running doesn't duplicate them
  await prisma.unavailability.deleteMany({
    where: { memberId: { in: [ameliaMember.id, ...awayIds] } },
  });
  await prisma.unavailability.createMany({ data: windows, skipDuplicates: true });

  // 4. API keys (deterministic raw keys so reruns don't pile up) ------------
  const keyNames = ["grafana-prod", "prometheus-webhook", "staging-test"];
  const keys: Prisma.ApiKeyCreateManyInput[] = sres.flatMap((owner, i) =>
    keyNames.slice(0, i === 0 ? keyNames.length : 2).map((name) => {
      const raw = "alert_" + createHash("sha256").update(`seed:${owner.id}:${name}`).digest("hex");
      return {
        ownerId: owner.id,
        name,
        keyPrefix: raw.slice(0, 12),
        keyHash: createHash("sha256").update(raw).digest("hex"),
        enabled: name !== "staging-test",
        expiresAt: new Date(NOW + 365 * DAY),
        createdAt: ago(int(5, 120) * DAY),
      };
    })
  );
  await prisma.apiKey.createMany({ data: keys, skipDuplicates: true });

  // 5. Incidents, alerts, notes ---------------------------------------------
  const alerts: Prisma.AlertCreateManyInput[] = [];
  const links: Prisma.IncidentAlertCreateManyInput[] = [];
  const incidents: Prisma.IncidentCreateManyInput[] = [];
  const notes: Prisma.IncidentNoteCreateManyInput[] = [];
  const openFingerprints = new Set<string>();
  let alertN = 0;
  let noteN = 0;

  const alertSeverity = { critical: "critical", high: "warning", medium: "warning", low: "info" } as const;

  for (let i = 0; i < INCIDENT_COUNT; i++) {
    const team = pick(teams);
    const teamMembers = membersByTeam.get(team.id) ?? [];
    const service = pick(team.services);
    const title = pick(INCIDENT_TEMPLATES).replace("{s}", service);
    const severity = pick(["critical", "high", "high", "medium", "medium", "low", "low"] as const);

    const hoursAgo = chance(0.2) ? int(1, 36) : int(2, 30 * 24);
    const createdAt = ago(hoursAgo * HOUR);
    const status: "open" | "acknowledged" | "resolved" =
      hoursAgo < 10
        ? chance(0.5) ? "open" : "acknowledged"
        : hoursAgo < 48
          ? pick(["open", "acknowledged", "resolved", "resolved"] as const)
          : chance(0.93) ? "resolved" : "acknowledged";

    let fingerprint = `${service}-${slug(title)}`;
    if (status !== "resolved") {
      // the DB allows only one open incident per team+fingerprint
      while (openFingerprints.has(`${team.id}|${fingerprint}`)) fingerprint += `-${i}`;
      openFingerprints.add(`${team.id}|${fingerprint}`);
    }

    const ageSec = (hoursAgo * HOUR) / SEC;
    const mtta =
      status === "open"
        ? null
        : Math.min(severity === "critical" ? 600 : 1800, Math.floor(ageSec / 2));
    const resolveAfter = status === "resolved" ? int(600, 8 * 3600) : 0;
    const acknowledgedAt = mtta === null ? null : new Date(createdAt.getTime() + mtta * SEC);
    const resolvedAt =
      status === "resolved" ? new Date(acknowledgedAt!.getTime() + resolveAfter * SEC) : null;
    const assignee = status === "open" && !chance(0.6) ? undefined : pick(teamMembers);
    const incidentId = uuid("b", i + 1);

    incidents.push({
      id: incidentId,
      teamId: team.id,
      title,
      service,
      fingerprint,
      openFingerprint: status === "resolved" ? null : fingerprint,
      severity,
      status,
      assignedToId: assignee?.userId ?? null,
      createdAt,
      acknowledgedAt,
      resolvedAt,
      mttaSeconds: mtta,
      mttrSeconds: resolvedAt ? Math.round((resolvedAt.getTime() - createdAt.getTime()) / SEC) : null,
      updatedAt: resolvedAt ?? acknowledgedAt ?? createdAt,
    });

    // 1–4 alerts grouped into this incident
    for (let a = 0; a < int(1, 4); a++) {
      const occurredAt = new Date(createdAt.getTime() + a * int(30, 900) * SEC);
      const alertId = uuid("a", ++alertN);
      alerts.push({
        id: alertId,
        provider: pick(PROVIDERS),
        title,
        service,
        message: `${title} (instance ${service}-${a + 1})`,
        severity: alertSeverity[severity],
        status: status === "resolved" ? "resolved" : "firing",
        occurredAt,
        receivedAt: new Date(occurredAt.getTime() + int(1, 10) * SEC),
        payload: { labels: { team: team.name, service }, annotations: { summary: title } },
      });
      links.push({ alertId, incidentId });
    }

    // responder notes
    if (status !== "open") {
      const end = (resolvedAt ?? new Date(NOW)).getTime();
      for (let n = 0; n < int(1, 4); n++) {
        const at = new Date(acknowledgedAt!.getTime() + rnd() * (end - acknowledgedAt!.getTime()));
        notes.push({
          id: uuid("c", ++noteN),
          incidentId,
          authorId: pick(teamMembers).userId,
          content: pick(NOTE_TEXTS),
          createdAt: at,
          updatedAt: at,
        });
      }
    }
  }

  // alerts that never became incidents (mostly info/warning noise)
  for (let i = 0; i < NOISE_ALERT_COUNT; i++) {
    const team = pick(teams);
    const service = pick(team.services);
    const title = pick(INCIDENT_TEMPLATES).replace("{s}", service);
    const occurredAt = ago(int(1, 30 * 24) * HOUR);
    alerts.push({
      id: uuid("a", ++alertN),
      provider: pick(PROVIDERS),
      title,
      service,
      message: `${title} (auto-resolved)`,
      severity: pick(["info", "info", "warning"] as const),
      status: chance(0.85) ? "resolved" : "firing",
      occurredAt,
      receivedAt: new Date(occurredAt.getTime() + int(1, 10) * SEC),
      payload: { labels: { team: team.name, service } },
    });
  }

  await prisma.incident.createMany({ data: incidents, skipDuplicates: true });
  await prisma.alert.createMany({ data: alerts, skipDuplicates: true });
  await prisma.incidentAlert.createMany({ data: links, skipDuplicates: true });
  await prisma.incidentNote.createMany({ data: notes, skipDuplicates: true });

  console.log(
    `Done: ${users.length} users, ${teams.length} teams, ${members.length} members, ` +
      `${windows.length} unavailabilities, ${incidents.length} incidents, ` +
      `${alerts.length} alerts, ${notes.length} notes.`
  );
  console.log(`Log in as sre@example.com or engineer@example.com / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
