/**
 * Database seed script.
 *
 * Creates:
 * - 1 SRE user (with a linked Google account)
 * - 20 ENGINEER users, distributed across teams (2 per team)
 * - 10 teams, each with on-call rotation settings, owned services
 * - Unavailability windows for a handful of team members (different dates/reasons)
 * - Several API keys with different names (one disabled, to show that state too)
 * - A handful of ingested alerts from Prometheus/Grafana/Datadog (frontend/backend teams)
 * - Incidents in various states (open, acknowledged, resolved), linked to teams,
 *   assignees, and their originating alerts, with MTTA/MTTR filled in where applicable
 * - A few incident notes left by responders
 *
 * NOTE: RefreshToken and InviteToken are intentionally NOT seeded — they're
 * short-lived, runtime-generated artifacts (login sessions / invite links),
 * not reference data.
 *
 * Run with: `npm run db:seed` (see package.json)
 */

import "dotenv/config";
import { createHash, randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "Password123!";

function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Fixed IDs so alerts/incidents/notes can be upserted idempotently on rerun —
// unlike users/teams/api keys, these don't have a natural unique business key.
const ALERT_IDS = {
  checkoutCpu: "a1111111-1111-4111-8111-111111111101",
  checkoutCrash: "a1111111-1111-4111-8111-111111111102",
  authLatency: "a1111111-1111-4111-8111-111111111103",
  paymentsDbPool: "a1111111-1111-4111-8111-111111111104",
  frontendDisk: "a1111111-1111-4111-8111-111111111105",
} as const;

const INCIDENT_IDS = {
  checkoutCpu: "b2222222-2222-4222-8222-222222222201",
  paymentsLatency: "b2222222-2222-4222-8222-222222222202",
  authLatency: "b2222222-2222-4222-8222-222222222203",
  paymentsDbPool: "b2222222-2222-4222-8222-222222222204",
  frontendDisk: "b2222222-2222-4222-8222-222222222205",
} as const;

const NOTE_IDS = {
  checkoutCpu1: "c3333333-3333-4333-8333-333333333301",
  checkoutCpu2: "c3333333-3333-4333-8333-333333333302",
  paymentsDbPool1: "c3333333-3333-4333-8333-333333333303",
  frontendDisk1: "c3333333-3333-4333-8333-333333333304",
} as const;

async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  specialty?: string;
  timezone?: string;
  discordId?: string;
  discordName?: string;
  googleId?: string;
}) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: data.role,
      specialty: data.specialty,
      timezone: data.timezone,
      discordId: data.discordId,
      discordName: data.discordName,
      googleId: data.googleId,
    },
  });
}

async function createApiKey(ownerId: string, name: string, enabled = true) {
  const rawKey = `alert_${randomBytes(32).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);

  const apiKey = await prisma.apiKey.upsert({
    where: { unique_owner_name: { ownerId, name } },
    update: {},
    create: {
      ownerId,
      name,
      keyPrefix,
      keyHash,
      enabled,
      expiresAt: daysFromNow(365),
    },
  });

  return { apiKey, rawKey };
}

// ── Team definitions ─────────────────────────────────────────────────────
// 10 teams. "frontend" and "backend" are kept (alerts/incidents below still
// reference them by name); the other 8 are new and only get members +
// rotation settings, to keep this file from ballooning in size.
const TEAM_DEFINITIONS = [
  {
    name: "frontend",
    description: "Owns the customer-facing web application",
    services: ["frontend-app", "web-app"],
    rotationPeriodDays: 7,
    rotationStartDaysAgo: 14,
    currentRotationIndex: 0,
    escalationTimeoutMinutes: 5,
  },
  {
    name: "backend",
    description: "Owns core APIs and platform services",
    services: ["checkout-service", "payments-api", "auth-service"],
    rotationPeriodDays: 14,
    rotationStartDaysAgo: 30,
    currentRotationIndex: 1,
    escalationTimeoutMinutes: 10,
  },
  {
    name: "mobile",
    description: "Owns the iOS and Android apps",
    services: ["mobile-ios", "mobile-android"],
    rotationPeriodDays: 7,
    rotationStartDaysAgo: 10,
    currentRotationIndex: 0,
    escalationTimeoutMinutes: 5,
  },
  {
    name: "platform",
    description: "Owns internal developer tooling and CI/CD",
    services: ["ci-pipeline", "artifact-registry"],
    rotationPeriodDays: 14,
    rotationStartDaysAgo: 20,
    currentRotationIndex: 0,
    escalationTimeoutMinutes: 15,
  },
  {
    name: "data",
    description: "Owns the data warehouse and ETL pipelines",
    services: ["etl-pipeline", "warehouse-sync"],
    rotationPeriodDays: 7,
    rotationStartDaysAgo: 7,
    currentRotationIndex: 1,
    escalationTimeoutMinutes: 10,
  },
  {
    name: "security",
    description: "Owns identity, access control, and vulnerability response",
    services: ["auth-service", "vault-service"],
    rotationPeriodDays: 7,
    rotationStartDaysAgo: 3,
    currentRotationIndex: 0,
    escalationTimeoutMinutes: 5,
  },
  {
    name: "infrastructure",
    description: "Owns cloud infrastructure and networking",
    services: ["network-gateway", "load-balancer"],
    rotationPeriodDays: 14,
    rotationStartDaysAgo: 25,
    currentRotationIndex: 1,
    escalationTimeoutMinutes: 10,
  },
  {
    name: "growth",
    description: "Owns experimentation, onboarding, and referral flows",
    services: ["onboarding-service", "experiments-api"],
    rotationPeriodDays: 7,
    rotationStartDaysAgo: 5,
    currentRotationIndex: 0,
    escalationTimeoutMinutes: 15,
  },
  {
    name: "billing",
    description: "Owns subscriptions, invoicing, and billing integrations",
    services: ["billing-service", "invoicing-api"],
    rotationPeriodDays: 14,
    rotationStartDaysAgo: 18,
    currentRotationIndex: 0,
    escalationTimeoutMinutes: 5,
  },
  {
    name: "support-tools",
    description: "Owns internal tools used by customer support",
    services: ["support-console", "ticketing-api"],
    rotationPeriodDays: 7,
    rotationStartDaysAgo: 9,
    currentRotationIndex: 1,
    escalationTimeoutMinutes: 10,
  },
] as const;

// ── Engineer pool ─────────────────────────────────────────────────────────
// 2 engineers per team (20 total, matching TEAM_DEFINITIONS in order). Only
// the first two (assigned to "frontend") keep Discord accounts + explicit
// timezones from the original seed; the rest rotate through a timezone pool.
const ENGINEER_NAMES: Array<{ firstName: string; lastName: string; specialty: string }> = [
  { firstName: "Alice", lastName: "Nguyen", specialty: "Frontend" },
  { firstName: "Ben", lastName: "Carter", specialty: "Frontend" },
  { firstName: "Chloe", lastName: "Dubois", specialty: "Backend" },
  { firstName: "Emma", lastName: "Silva", specialty: "Mobile" },
  { firstName: "Felix", lastName: "Wagner", specialty: "Mobile" },
  { firstName: "Grace", lastName: "Kim", specialty: "Platform" },
  { firstName: "Hassan", lastName: "Ali", specialty: "Platform" },
  { firstName: "Ivy", lastName: "Chen", specialty: "Data" },
  { firstName: "Jack", lastName: "Murphy", specialty: "Data" },
  { firstName: "Karla", lastName: "Rossi", specialty: "Security" },
  { firstName: "Liam", lastName: "Byrne", specialty: "Security" },
  { firstName: "Maya", lastName: "Patel", specialty: "Infrastructure" },
  { firstName: "Noah", lastName: "Larsen", specialty: "Infrastructure" },
  { firstName: "Olivia", lastName: "Santos", specialty: "Growth" },
  { firstName: "Priya", lastName: "Rao", specialty: "Growth" },
  { firstName: "Quinn", lastName: "Walsh", specialty: "Billing" },
  { firstName: "Ravi", lastName: "Kumar", specialty: "Billing" },
  { firstName: "Sofia", lastName: "Costa", specialty: "Support Tools" },
  { firstName: "Tom", lastName: "Becker", specialty: "Support Tools" },
];

const TIMEZONE_POOL = [
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
  "Europe/Paris",
  "Europe/London",
  "Africa/Lagos",
  "Asia/Singapore",
  "Australia/Sydney",
];

async function main() {
  console.log("Seeding database...");

  // ── Users ────────────────────────────────────────────────────────────────
  const sre = await createUser({
    firstName: "Sam",
    lastName: "Reyes",
    email: "sre@example.com",
    role: Role.SRE,
    specialty: "Reliability Engineering",
    timezone: "America/New_York",
    googleId: "108234871239876543210",
  });

  const engineers = await Promise.all(
    ENGINEER_NAMES.map((engineer, index) => {
      const email = `${engineer.firstName.toLowerCase()}.engineer@example.com`;
      // Keep the first two engineers' Discord accounts, matching the original seed data.
      const discord =
        index === 0
          ? { discordId: "111122223333444401", discordName: "alice.nguyen" }
          : index === 1
            ? { discordId: "111122223333444402", discordName: "bcarter" }
            : {};

      return createUser({
        firstName: engineer.firstName,
        lastName: engineer.lastName,
        email,
        role: Role.ENGINEER,
        specialty: engineer.specialty,
        timezone: TIMEZONE_POOL[index % TIMEZONE_POOL.length],
        ...discord,
      });
    })
  );

  console.log(`Created 1 SRE and ${engineers.length} ENGINEER users`);

  // ── Teams ────────────────────────────────────────────────────────────────
  const teams = await Promise.all(
    TEAM_DEFINITIONS.map((def) =>
      prisma.team.upsert({
        where: { name: def.name },
        update: {},
        create: {
          name: def.name,
          description: def.description,
          ownerId: sre.id,
          services: [...def.services],
          rotationPeriodDays: def.rotationPeriodDays,
          rotationStartDate: daysFromNow(-def.rotationStartDaysAgo),
          currentRotationIndex: def.currentRotationIndex,
          escalationTimeoutMinutes: def.escalationTimeoutMinutes,
        },
      })
    )
  );

  const teamsByName = new Map(teams.map((team) => [team.name, team]));
  const frontendTeam = teamsByName.get("frontend")!;
  const backendTeam = teamsByName.get("backend")!;

  console.log(`Created ${teams.length} teams`);

  // ── Team members ─────────────────────────────────────────────────────────
  // 2 engineers per team, in order: engineers[0] & [1] -> teams[0],
  // engineers[2] & [3] -> teams[1], and so on.
  const teamMembers = await Promise.all(
    TEAM_DEFINITIONS.flatMap((def, teamIndex) => {
      const team = teamsByName.get(def.name)!;
      const [engineerA, engineerB] = [
        engineers[teamIndex * 2],
        engineers[teamIndex * 2 + 1],
      ];

      return [engineerA, engineerB].map((engineer) =>
        prisma.teamMember.upsert({
          where: { userId: engineer.id },
          update: {},
          create: { userId: engineer.id, teamId: team.id },
        })
      );
    })
  );

  const membersByUserId = new Map(teamMembers.map((member) => [member.userId, member]));
  const aliceMember = membersByUserId.get(engineers[0].id)!;
  const benMember = membersByUserId.get(engineers[1].id)!;
  const chloeMember = membersByUserId.get(engineers[2].id)!;
  const [alice, ben, chloe] = engineers;

  console.log(
    `Added ${teamMembers.length} team members (2 per team, ${TEAM_DEFINITIONS.length} teams)`
  );

  // ── Unavailabilities ─────────────────────────────────────────────────────
  // Kept to the original 4 members so this stays readable; extend the same
  // pattern to more members if you want fuller coverage.
  const unavailabilityData = [
    {
      member: aliceMember,
      startDate: daysFromNow(1),
      endDate: daysFromNow(4),
      reason: "Annual vacation",
      confirmed: true,
    },
    {
      member: benMember,
      startDate: daysFromNow(10),
      endDate: daysFromNow(12),
      reason: "Attending a conference",
      confirmed: false,
    },
    {
      member: chloeMember,
      startDate: daysFromNow(3),
      endDate: daysFromNow(5),
      reason: "Medical leave",
      confirmed: true,
    },
  ];

  await Promise.all(
    unavailabilityData.map(({ member, startDate, endDate, reason, confirmed }) =>
      prisma.unavailability.upsert({
        where: {
          unique_unavailability_window: {
            memberId: member.id,
            startDate,
            endDate,
          },
        },
        update: {},
        create: {
          memberId: member.id,
          startDate,
          endDate,
          reason,
          confirmed,
        },
      })
    )
  );

  console.log("Created unavailability windows for 4 team members");

  // ── API keys ─────────────────────────────────────────────────────────────
  const apiKeysToCreate: Array<{ ownerId: string; name: string; enabled?: boolean }> = [
    { ownerId: sre.id, name: "Prometheus Webhook" },
    { ownerId: sre.id, name: "Grafana Alerts" },
    { ownerId: sre.id, name: "Datadog Integration", enabled: false },
  ];

  const createdApiKeys = await Promise.all(
    apiKeysToCreate.map(({ ownerId, name, enabled }) => createApiKey(ownerId, name, enabled))
  );

  console.log(`Created ${createdApiKeys.length} API keys:`);
  for (const { apiKey, rawKey } of createdApiKeys) {
    console.log(
      `  - ${apiKey.name} (${apiKey.enabled ? "enabled" : "disabled"}): ${rawKey} (store this securely, shown once)`
    );
  }

  // ── Alerts ───────────────────────────────────────────────────────────────
  const alertsToCreate = [
    {
      id: ALERT_IDS.checkoutCpu,
      provider: "prometheus",
      title: "High CPU usage on checkout-service",
      service: "checkout-service",
      message: "CPU usage above 90% for 5 minutes",
      severity: "critical",
      status: "firing",
      occurredAt: minutesFromNow(-125),
      payload: { alertname: "HighCPUUsage", labels: { service: "checkout-service" } },
    },
    {
      id: ALERT_IDS.checkoutCrash,
      provider: "prometheus",
      title: "Pod CrashLoopBackOff",
      service: "checkout-service",
      message: "checkout-service-7d9f pod restarting repeatedly",
      severity: "critical",
      status: "firing",
      occurredAt: minutesFromNow(-118),
    },
    {
      id: ALERT_IDS.authLatency,
      provider: "grafana",
      title: "Elevated p99 latency on auth-service",
      service: "auth-service",
      message: "p99 latency above 800ms",
      severity: "warning",
      status: "firing",
      occurredAt: minutesFromNow(-32),
    },
    {
      id: ALERT_IDS.paymentsDbPool,
      provider: "grafana",
      title: "Database connection pool exhausted",
      service: "payments-api",
      message: "Connection pool at 100% capacity",
      severity: "critical",
      status: "resolved",
      occurredAt: daysFromNow(-5),
    },
    {
      id: ALERT_IDS.frontendDisk,
      provider: "datadog",
      title: "Disk usage above 90%",
      service: "frontend-app",
      message: "Root volume at 92% capacity",
      severity: "warning",
      status: "resolved",
      occurredAt: daysFromNow(-3),
    },
  ];

  const alerts = await Promise.all(
    alertsToCreate.map(({ id, ...data }) =>
      prisma.alert.upsert({
        where: { id },
        update: {},
        create: { id, ...data },
      })
    )
  );

  console.log(`Created ${alerts.length} alerts`);

  // ── Incidents ────────────────────────────────────────────────────────────
  const checkoutCpuCreatedAt = minutesFromNow(-120);
  const paymentsLatencyCreatedAt = minutesFromNow(-60);
  const authLatencyCreatedAt = minutesFromNow(-30);
  const paymentsDbPoolCreatedAt = daysFromNow(-5);
  const frontendDiskCreatedAt = daysFromNow(-3);

  const incidentsToCreate = [
    {
      id: INCIDENT_IDS.checkoutCpu,
      teamId: backendTeam.id,
      title: "Checkout service CPU spike",
      service: "checkout-service",
      fingerprint: "checkout-cpu-spike",
      openFingerprint: "checkout-cpu-spike", // still unresolved
      severity: "critical",
      status: "acknowledged",
      assignedToId: chloe.id,
      createdAt: checkoutCpuCreatedAt,
      acknowledgedAt: addMinutes(checkoutCpuCreatedAt, 10),
      mttaSeconds: 600,
    },
    {
      id: INCIDENT_IDS.paymentsLatency,
      teamId: backendTeam.id,
      title: "Payments API latency degradation",
      service: "payments-api",
      fingerprint: "payments-latency",
      openFingerprint: "payments-latency", // still unresolved, not yet acknowledged
      severity: "high",
      status: "open",
      assignedToId: null, // unassigned, awaiting pickup
      createdAt: paymentsLatencyCreatedAt,
    },
    {
      id: INCIDENT_IDS.authLatency,
      teamId: frontendTeam.id,
      title: "Auth service latency alert",
      service: "auth-service",
      fingerprint: "auth-latency",
      openFingerprint: "auth-latency", // still unresolved
      severity: "warning",
      status: "acknowledged",
      assignedToId: ben.id,
      createdAt: authLatencyCreatedAt,
      acknowledgedAt: addMinutes(authLatencyCreatedAt, 10),
      mttaSeconds: 600,
    },
    {
      id: INCIDENT_IDS.paymentsDbPool,
      teamId: backendTeam.id,
      title: "Payments DB connection pool exhausted",
      service: "payments-api",
      fingerprint: "payments-db-pool",
      // openFingerprint left unset (null) — incident is resolved
      severity: "critical",
      status: "resolved",
      assignedToId: chloe.id,
      createdAt: paymentsDbPoolCreatedAt,
      acknowledgedAt: addMinutes(paymentsDbPoolCreatedAt, 2),
      resolvedAt: addMinutes(paymentsDbPoolCreatedAt, 30),
      mttaSeconds: 120,
      mttrSeconds: 1800,
    },
    {
      id: INCIDENT_IDS.frontendDisk,
      teamId: frontendTeam.id,
      title: "Frontend disk usage warning",
      service: "frontend-app",
      fingerprint: "frontend-disk",
      // openFingerprint left unset (null) — incident is resolved
      severity: "warning",
      status: "resolved",
      assignedToId: alice.id,
      createdAt: frontendDiskCreatedAt,
      acknowledgedAt: addMinutes(frontendDiskCreatedAt, 5),
      resolvedAt: addMinutes(frontendDiskCreatedAt, 45),
      mttaSeconds: 300,
      mttrSeconds: 2700,
    },
  ];

  const incidents = await Promise.all(
    incidentsToCreate.map(({ id, teamId, assignedToId, ...data }) =>
      prisma.incident.upsert({
        where: { id },
        update: {},
        create: {
          id,
          ...data,
          // team/assignedTo are optional relations with onDelete: SetNull —
          // this Prisma version requires connect{} for those rather than a
          // raw teamId/assignedToId scalar, unlike the required relations
          // (TeamMember, ApiKey, Team.owner) used earlier in this script.
          ...(teamId ? { team: { connect: { id: teamId } } } : {}),
          ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {}),
        },
      })
    )
  );

  console.log(`Created ${incidents.length} incidents`);

  // ── Incident <-> Alert links ─────────────────────────────────────────────
  const incidentAlertLinks = [
    { alertId: ALERT_IDS.checkoutCpu, incidentId: INCIDENT_IDS.checkoutCpu },
    { alertId: ALERT_IDS.checkoutCrash, incidentId: INCIDENT_IDS.checkoutCpu },
    { alertId: ALERT_IDS.authLatency, incidentId: INCIDENT_IDS.authLatency },
    { alertId: ALERT_IDS.paymentsDbPool, incidentId: INCIDENT_IDS.paymentsDbPool },
    { alertId: ALERT_IDS.frontendDisk, incidentId: INCIDENT_IDS.frontendDisk },
  ];

  await Promise.all(
    incidentAlertLinks.map(({ alertId, incidentId }) =>
      prisma.incidentAlert.upsert({
        where: { alertId },
        update: {},
        create: { alertId, incidentId },
      })
    )
  );

  console.log(`Linked ${incidentAlertLinks.length} alerts to their incidents`);

  // ── Incident notes ───────────────────────────────────────────────────────
  const notesToCreate = [
    {
      id: NOTE_IDS.checkoutCpu1,
      incidentId: INCIDENT_IDS.checkoutCpu,
      authorId: chloe.id,
      content: "Scaling checkout-service replicas from 3 to 6 while we investigate.",
    },
    {
      id: NOTE_IDS.checkoutCpu2,
      incidentId: INCIDENT_IDS.checkoutCpu,
      authorId: sre.id,
      content: "Confirmed the traffic spike correlates with the new promo campaign, not a regression.",
    },
    {
      id: NOTE_IDS.paymentsDbPool1,
      incidentId: INCIDENT_IDS.paymentsDbPool,
      authorId: chloe.id,
      content: "Root cause was a leaked connection in the reporting job; fix deployed and pool recovered.",
    },
    {
      id: NOTE_IDS.frontendDisk1,
      incidentId: INCIDENT_IDS.frontendDisk,
      authorId: alice.id,
      content: "Cleared old build artifacts and rotated logs; added a cron job to prevent recurrence.",
    },
  ];

  const notes = await Promise.all(
    notesToCreate.map(({ id, ...data }) =>
      prisma.incidentNote.upsert({
        where: { id },
        update: {},
        create: { id, ...data },
      })
    )
  );

  console.log(`Created ${notes.length} incident notes`);

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
