-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "incident";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ingestion";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "organization";

-- CreateEnum
CREATE TYPE "auth"."role" AS ENUM ('SRE', 'ENGINEER');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "discord_id" TEXT,
    "discord_name" TEXT,
    "pending_email" TEXT,
    "password_hash" TEXT,
    "role" "auth"."role" NOT NULL,
    "google_id" TEXT,
    "specialty" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "timezone" TEXT DEFAULT 'UTC',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."invite_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "team_id" UUID NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."reset_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."email_verification_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident"."incidents" (
    "id" UUID NOT NULL,
    "team_id" UUID,
    "title" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ,
    "resolved_at" TIMESTAMPTZ,
    "mtta_seconds" INTEGER,
    "mttr_seconds" INTEGER,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident"."incident_notes" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "incident_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion"."api_keys" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" VARCHAR(12) NOT NULL,
    "key_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization"."teams" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rotation_period_days" INTEGER NOT NULL DEFAULT 7,
    "rotation_start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_rotation_index" INTEGER NOT NULL DEFAULT 0,
    "last_notified_rotation_index" INTEGER NOT NULL DEFAULT -1,
    "last_rotated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalation_timeout_minutes" INTEGER NOT NULL DEFAULT 5,
    "webhook_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization"."team_members" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization"."unavailabilities" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "unavailabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "auth"."users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "auth"."users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "auth"."refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "auth"."invite_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_key" ON "auth"."reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "auth"."email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_incidents_team" ON "incident"."incidents"("team_id");

-- CreateIndex
CREATE INDEX "idx_incidents_status" ON "incident"."incidents"("status");

-- CreateIndex
CREATE INDEX "idx_incidents_created_at" ON "incident"."incidents"("created_at");

-- CreateIndex
CREATE INDEX "idx_incident_notes_incident_created" ON "incident"."incident_notes"("incident_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "ingestion"."api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_owner_id_name_key" ON "ingestion"."api_keys"("owner_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "organization"."teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_user_id_key" ON "organization"."team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unavailabilities_member_id_start_date_end_date_key" ON "organization"."unavailabilities"("member_id", "start_date", "end_date");

-- AddForeignKey
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."reset_tokens" ADD CONSTRAINT "reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident"."incidents" ADD CONSTRAINT "incidents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "organization"."teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident"."incidents" ADD CONSTRAINT "incidents_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident"."incident_notes" ADD CONSTRAINT "incident_notes_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident"."incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident"."incident_notes" ADD CONSTRAINT "incident_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion"."api_keys" ADD CONSTRAINT "api_keys_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."teams" ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "organization"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization"."unavailabilities" ADD CONSTRAINT "unavailabilities_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "organization"."team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
