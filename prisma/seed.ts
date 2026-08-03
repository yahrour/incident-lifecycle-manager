/**
 * Database seed script.
 *
 * Creates:
 * - 1 SRE user
 * - 4 ENGINEER users
 * - 2 teams ('frontend' and 'backend')
 * - 2 engineers added to 'frontend', 2 engineers added to 'backend'
 * - Unavailability windows for every team member (different dates/reasons)
 * - Several enabled API keys with different names
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

async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  specialty?: string;
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
      isVerified: true,
    },
  });
}

async function createApiKey(ownerId: string, name: string) {
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
      enabled: true,
    },
  });

  return { apiKey, rawKey };
}

async function main() {
  console.log("Seeding database...");

  // ── Users ────────────────────────────────────────────────────────────────
  const sre = await createUser({
    firstName: "Sam",
    lastName: "Reyes",
    email: "sre@example.com",
    role: Role.SRE,
    specialty: "Reliability Engineering",
  });

  const engineers = await Promise.all([
    createUser({
      firstName: "Alice",
      lastName: "Nguyen",
      email: "alice.engineer@example.com",
      role: Role.ENGINEER,
      specialty: "Frontend",
    }),
    createUser({
      firstName: "Ben",
      lastName: "Carter",
      email: "ben.engineer@example.com",
      role: Role.ENGINEER,
      specialty: "Frontend",
    }),
    createUser({
      firstName: "Chloe",
      lastName: "Dubois",
      email: "chloe.engineer@example.com",
      role: Role.ENGINEER,
      specialty: "Backend",
    }),
    createUser({
      firstName: "David",
      lastName: "Okafor",
      email: "david.engineer@example.com",
      role: Role.ENGINEER,
      specialty: "Backend",
    }),
  ]);
  const [alice, ben, chloe, david] = engineers;

  console.log(`Created 1 SRE and ${engineers.length} ENGINEER users`);

  // ── Teams ────────────────────────────────────────────────────────────────
  const frontendTeam = await prisma.team.upsert({
    where: { name: "frontend" },
    update: {},
    create: {
      name: "frontend",
      description: "Owns the customer-facing web application",
      ownerId: sre.id,
    },
  });

  const backendTeam = await prisma.team.upsert({
    where: { name: "backend" },
    update: {},
    create: {
      name: "backend",
      description: "Owns core APIs and platform services",
      ownerId: sre.id,
    },
  });

  console.log("Created 'frontend' and 'backend' teams");

  // ── Team members ─────────────────────────────────────────────────────────
  const teamMembers = await Promise.all([
    prisma.teamMember.upsert({
      where: { userId: alice.id },
      update: {},
      create: { userId: alice.id, teamId: frontendTeam.id },
    }),
    prisma.teamMember.upsert({
      where: { userId: ben.id },
      update: {},
      create: { userId: ben.id, teamId: frontendTeam.id },
    }),
    prisma.teamMember.upsert({
      where: { userId: chloe.id },
      update: {},
      create: { userId: chloe.id, teamId: backendTeam.id },
    }),
    prisma.teamMember.upsert({
      where: { userId: david.id },
      update: {},
      create: { userId: david.id, teamId: backendTeam.id },
    }),
  ]);
  const [aliceMember, benMember, chloeMember, davidMember] = teamMembers;

  console.log(
    "Added Alice & Ben to 'frontend', Chloe & David to 'backend'"
  );

  // ── Unavailabilities ─────────────────────────────────────────────────────
  // NOTE: Unavailability records are tied to a TeamMember (not a bare User),
  // so entries are created for the 4 users who belong to a team. The SRE
  // owner is not a team member and therefore has no on-call rotation to be
  // "unavailable" for.
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
    {
      member: davidMember,
      startDate: daysFromNow(20),
      endDate: daysFromNow(27),
      reason: "Parental leave",
      confirmed: false,
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

  console.log("Created unavailability windows for all team members");

  // ── API keys ─────────────────────────────────────────────────────────────
  const apiKeysToCreate: Array<{ ownerId: string; name: string }> = [
    { ownerId: sre.id, name: "Prometheus Webhook" },
    { ownerId: sre.id, name: "Grafana Alerts" },
  ];

  const createdApiKeys = await Promise.all(
    apiKeysToCreate.map(({ ownerId, name }) => createApiKey(ownerId, name))
  );

  console.log(`Created ${createdApiKeys.length} enabled API keys:`);
  for (const { apiKey, rawKey } of createdApiKeys) {
    console.log(`  - ${apiKey.name}: ${rawKey} (store this securely, shown once)`);
  }

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
