_This project has been created as part of the 42 curriculum by asebban, yahrour, aaitabde, sait-nac._

# Incident Lifecycle Manager

## Table of Contents

1. [Description](#description)
2. [Team Information](#team-information)
3. [Project Management](#project-management)
4. [Technical Stack](#technical-stack)
5. [Instructions](#instructions)
6. [Database Schema](#database-schema)
7. [Features List](#features-list)
8. [Modules](#modules)
9. [Individual Contributions](#individual-contributions)
10. [Resources](#resources)
11. [Known Limitations](#known-limitations)

## Description

**Incident Lifecycle Manager** is a self-hosted web application that carries an incident through its entire life: an alert fires, the alert becomes an incident, the incident reaches the engineer who is actually on call, and every step from acknowledgement to resolution is recorded and measured.

### Goal

On-call work fails in predictable ways. An alert fires and nobody sees it. Two alerts for the same outage get handled twice by two different people. The person paged is on holiday. Nobody can say afterwards how long the outage lasted or how fast anyone responded.

The goal of this project is to close those gaps in one place: a single system that ingests alerts from monitoring tools, collapses repeated alerts into one incident, routes that incident to the current on-call engineer automatically, escalates when nobody acknowledges, and turns the whole timeline into response metrics (MTTA and MTTR) instead of guesswork.

### Overview

The system is a single Docker Compose deployment with a NestJS API, a React frontend and a PostgreSQL database, plus the operational layer around them.

**Alert ingestion.** Monitoring tools post alerts to the API using a hashed API key. Each alert is normalised, stored with its raw JSON payload, and turned into an incident. A SHA-256 fingerprint over provider, service and title identifies repeat alerts, and a unique constraint on the open fingerprint per team means a second alert for the same problem joins the existing incident instead of creating a duplicate. Every ingested alert stays visible in a delivery log.

**Incident handling.** Incidents carry a severity, a status, an assignee and a full timestamp history. Engineers can search and filter the list, open a detail view, add notes, reassign, acknowledge and resolve. Acknowledgement and resolution stamp the timestamps that produce MTTA and MTTR. A server-sent event stream pushes incident changes to connected clients, so the list updates without a refresh.

**On-call and escalation.** Each team has a rotation period, a rotation index and an escalation timeout. The on-call chain is computed from team membership, skipping anyone with an approved unavailability window covering the current moment, and yields a primary and a secondary engineer. A scheduled job runs every minute: an open incident with no assignee is assigned to the primary on-call, and an incident left unacknowledged past the team's timeout is escalated. Unavailability requests are submitted by members and approved or rejected by the team owner, so the rotation knows who is genuinely reachable.

**Teams and access.** Users sign up with email and password or with Google OAuth 2.0, and hold a role of `SRE` or `ENGINEER`. Team owners manage teams, members and invitations; invite tokens are single-use and expire. Refresh tokens are stored hashed.

**Operations.** The deployment ships with the surrounding production concerns rather than leaving them as an exercise: ModSecurity with the OWASP Core Rule Set in front of the stack as a WAF, HashiCorp Vault for secrets, Prometheus and Grafana for metrics and dashboards, a health endpoint and status page, scheduled PostgreSQL backups with a documented restore procedure, and an overview dashboard for incident and team metrics.

**Key features** (see [Features List](#features-list) for details and contributors):

- Email/password sign-up and sign-in, and Google sign-in.
- Incident list with search and filters, detail view, notes, assignment, acknowledge and resolve.
- Alert ingestion through hashed API keys, with fingerprint-based grouping of repeat alerts.
- Live incident updates over server-sent events.
- Teams, members, on-call rotation, automatic assignment and escalation, unavailability requests.
- Overview dashboard with incident and team metrics.
- Security and operations tooling: WAF, secrets management, monitoring, health checks and backups.

## Team Information

| Login    | Assigned role(s)                      | Responsibilities                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| asebban  | Developer                             | Owned alert ingestion (API keys, provider adapters, alert-to-incident creation, Integrations and Delivery Log pages) and the security layer of the deployment: the ModSecurity WAF with HTTPS termination and HashiCorp Vault as the source of truth for secrets. |
| yahrour  | Technical Lead / Architect, Developer | Chose the tech stack (NestJS backend, React frontend) and built the project foundation: the monorepo layout, commitlint with Husky hooks to enforce conventional commits, and the ESLint/Prettier setup for consistent code style. Defined the GitHub workflow rules: pull requests required for `main` and `dev` with at least one teammate review, and squash-and-merge to keep the history clean. |
| aaitabde | [TODO — unassigned]                   | [TODO — brief description of responsibilities]                                                                                                                                                                                                                                                                                                                                                       |
| sait-nac | [TODO — unassigned]                   | [TODO — brief description of responsibilities]                                                                                                                                                                                                                                                                                                                                                       |

<!-- Subject: each member needs assigned role(s) (PO, PM, Tech Lead, Developer) and a short responsibility description.
With 4 people, members may hold several roles (e.g. PM + Developer).
Describe the role that was *assigned*. What each person actually built goes in "Individual Contributions". -->

---

## Project Management

- **Work organization (task distribution, meetings):** [TODO — owner: unassigned — how tasks were split, meeting frequency, review process]
- **Task tracking:** GitHub, with pull requests. [TODO — owner: unassigned — add Issues/Projects/board usage if any]
- **Communication channel:** Discord.

<!-- Mention branch naming and commit conventions if the team wants to (the repo uses commitlint with conventional commits). -->

---

## Technical Stack

Versions are the ones declared in `frontend/package.json`, `backend/package.json` and `docker-compose.yml`.

| Area           | Technologies used                                                                                                                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Axios, Recharts, shadcn, lucide-react, date-fns,                                                                                                                                        |
| Backend        | NestJS (Express, TypeScript), Passport, `@nestjs/jwt`, `passport-google-oauth20`, bcrypt, class-validator + class-transformer, `@nestjs/config`, Joi, `@nestjs/schedule`, `@nestjs/terminus`, `@willsoto/nestjs-prometheus` + prom-client, csv-parse, csv-stringify, cookie-parser |
| Database       | PostgreSQL 18                                                                                                                                                                                                                                                                      |
| ORM            | Prisma                                                                                                                                                                                                                                                                             |
| Infrastructure | Docker Compose, ModSecurity + OWASP Core Rule Set on nginx (WAF, TLS termination), HashiCorp Vault, Prometheus v3.13, Grafana 13.2, postgres-exporter, scheduled PostgreSQL backups                                                                                                |
| Tooling        | ESLint, Prettier, commitlint + Husky + lint-staged                                                                                                                                                                                                                                 |

### Database

**PostgreSQL 18**, accessed through Prisma 7.9 with the `@prisma/adapter-pg` driver adapter. The schema is split across four PostgreSQL schemas that mirror the module boundaries: `auth`, `organization`, `incident` and `ingestion`.

#### Why PostgreSQL and not MySQL or SQLite

The choice was driven by what the schema and the runtime actually need, not by preference. Each requirement below is used by the current models.

| Requirement in this project                                 | PostgreSQL 18                       | MySQL 8                                                                                    | SQLite                                               |
| ----------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Timezone-aware timestamps for MTTA/MTTR (`@db.Timestamptz`) | Native `timestamptz`, stored as UTC | `TIMESTAMP` converts by session timezone and stops at 2038; `DATETIME` carries no timezone | No date type at all; stored as text or a number      |
| Native array column (`Team.services String[]`)              | `text[]`                            | Not supported; needs a join table or JSON                                                  | Not supported                                        |
| Queryable JSON payload (`Alert.payload Json`)               | `jsonb`, indexable with GIN         | `JSON`, indexable only via generated columns                                               | Stored as text; no indexing                          |
| Four namespaces in one database (`@@schema`)                | Schemas are a first-class object    | Schema _is_ the database; would need four databases or name prefixes                       | No schemas                                           |
| Native UUID primary keys (`@db.Uuid`)                       | `uuid` type                         | `CHAR(36)` or `BINARY(16)`                                                                 | No type system                                       |
| Native enums (`Role`, `UnavailabilityStatus`)               | `CREATE TYPE ... AS ENUM`           | `ENUM` (works, but altering it rewrites the table)                                         | Not supported; `CHECK` constraint only               |
| Concurrent writers                                          | MVCC, row-level locks               | InnoDB row-level locks                                                                     | **Single writer**; one write lock for the whole file |
| Runs as a separate network service in Compose               | Yes                                 | Yes                                                                                        | No; it is an embedded library                        |

### Justification of major technical choices

| Choice                  | Why                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NestJS                  | The application needs several things a plain Express setup would leave to hand-rolled middleware: role-based route guards, request validation, an interceptor for metrics, a cron scheduler for escalation, health checks and SSE streaming. NestJS provides all of these as first-class modules, and its module system maps directly onto the four bounded contexts. |
| React                   | The UI is data-dense and stateful: incident lists with filters and pagination, live updates, multi-step forms. A component model with a mature ecosystem fits that better than server-rendered templates, and sharing TypeScript with the backend keeps request and response types aligned.                                                                           |
| PostgreSQL              | Chosen for relational integrity, `timestamptz` accuracy and, above all, the ability to enforce the open-incident uniqueness rule as a constraint. Justified in full in the Database section above.                                                                                                                                                                    |
| Prisma                  | Generates a fully typed client from the schema, so query shapes are checked at compile time, and its migration workflow keeps the four schemas versioned. The schema is split into one file per module so ownership stays visible.                                                                                                                                    |
| TanStack Query          | Incident and team data is server state, not client state. Caching, background refetching and invalidation remove most manual loading and error handling from components.                                                                                                                                                                                              |
| Server-sent events      | Incident updates only travel server to client, so a full WebSocket protocol and upgrade handling would be unnecessary weight. SSE runs over ordinary HTTP, which also keeps it simple to proxy through the nginx WAF.                                                                                                                                                 |
| ModSecurity + OWASP CRS | A managed rule set covers the common attack classes without the team writing and maintaining detection rules, and nginx gives TLS termination in the same container.                                                                                                                                                                                                  |
| Vault                   | Secrets belong outside the repository and outside the Compose file. Vault also gives a single place to rotate credentials without rebuilding images.                                                                                                                                                                                                                  |
| Prometheus + Grafana    | Pull-based metrics with a query language suited to the latency and error-rate questions this project actually asks, plus dashboards that do not require custom UI work.                                                                                                                                                                                               |

<!-- Note: the reasons above are the engineering rationale visible in the code and configuration.
If a choice was also driven by team familiarity or a constraint not visible in the repository,
add that here — it is the honest answer and reviewers ask for it. -->

## Database Schema

visit https://dbdiagram.io/d/6af3602b04c7e97b1d24f9ec for database visualization

| PostgreSQL schema | Table            | Purpose                                                                         | Key relations                                                 |
| ----------------- | ---------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| auth              | users            | Accounts: email, password hash (nullable), role (`SRE` / `ENGINEER`), Google id | Referenced by teams, team members, incidents, notes, API keys |
| auth              | refresh_tokens   | Hashed refresh tokens                                                           | → users (cascade delete)                                      |
| auth              | invite_tokens    | Team invitations                                                                | team id, email, used flag, expiry                             |
| organization      | teams            | Teams, on-call rotation and escalation settings                                 | → users (owner)                                               |
| organization      | team_members     | Membership of a user in a team                                                  | → users, → teams                                              |
| organization      | unavailabilities | Unavailability windows with status                                              | → team_members                                                |
| incident          | incidents        | Incidents with severity, status, timestamps, MTTA/MTTR                          | → teams, → users (assignee)                                   |
| incident          | incident_notes   | Notes on an incident                                                            | → incidents, → users (author)                                 |
| incident          | incident_alerts  | Links alerts to incidents                                                       | → incidents                                                   |
| ingestion         | api_keys         | Hashed API keys for alert ingestion                                             | → users (owner)                                               |
| ingestion         | alerts           | Raw incoming alerts                                                             | provider, status, JSON payload                                |

## Features List

| Feature                             | Description                                                               | Contributor(s) |
| ----------------------------------- | ------------------------------------------------------------------------- | -------------- |
| Authentication                      | Email/password sign-up and sign-in, token refresh, logout                 | [TODO]         |
| Google sign-in                      | OAuth 2.0 login with Google                                               | [TODO]         |
| Invitations                         | Invite users to a team by token and accept the invite                     | [TODO]         |
| Incident management                 | List with search and filters, detail, notes, assign, acknowledge, resolve | [TODO]         |
| Live incident events                | Server-sent event stream on incidents                                     | [TODO]         |
| Alert ingestion                     | Providers post alerts using API keys; API key management                  | asebban        |
| WAF and secrets management          | ModSecurity + OWASP CRS with HTTPS in front of the stack; Vault for secrets | asebban        |
| Teams and members                   | Create, edit, delete teams; view and remove members; team stats           | [TODO]         |
| On-call and unavailability          | Current/upcoming on-call, unavailability requests with approve/reject     | [TODO]         |
| Team export / import                | Export and import team data                                               | [TODO]         |
| Overview dashboard                  | Incident and team metrics                                                 | [TODO]         |
| Health and status page              | Health endpoint and status page                                           | [TODO]         |
| Privacy Policy and Terms of Service | Pages in the frontend landing feature                                     | [TODO]         |
| Metrics and monitoring              | Prometheus metrics, Grafana dashboards and alert rules                    | [TODO]         |
| Backups                             | Scheduled database backups and a restore procedure                        | [TODO]         |

## Modules

### Chosen modules

| #   | Type  | Module                                                                                                       | Pts | Contributor(s)    |
| --- | ----- | ------------------------------------------------------------------------------------------------------------ | --- | ----------------- |
| 1   | Major | Use a framework for both the frontend and backend                                                            | 2   | all members       |
| 2   | Major | Implement real-time features using WebSockets or similar technology                                          | 2   | aaitabde          |
| 3   | Major | Advanced permissions system                                                                                  | 2   | sait-nac          |
| 4   | Major | An organization system                                                                                       | 2   | yahrour           |
| 5   | Major | Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets                                           | 2   | asebban           |
| 6   | Major | Monitoring system with Prometheus and Grafana                                                                | 2   | sait-nac          |
| 7   | Minor | Use an ORM for the database                                                                                  | 1   | all members       |
| 8   | Minor | Custom-made design system with reusable components, color palette, typography and icons (min. 10 components) | 1   | all members       |
| 9   | Minor | Advanced search functionality with filters, sorting and pagination                                           | 1   | aaitabde, yahrour |
| 10  | Minor | Remote authentication with OAuth 2.0                                                                         | 1   | sait-nac          |
| 11  | Minor | Health check and status page with automated backups and disaster recovery                                    | 1   | yahrour           |
| 12  | Minor | Data export and import functionality                                                                         | 1   | yahrour           |

The subject requires a minimum of 14 points; this selection totals **18**.

---

### 1. Framework for both frontend and backend — Major, 2 pts

- **Why we chose it:** A project of this size needs structure on both sides. On the backend we needed routing, dependency injection, guards, validation and scheduled jobs; on the frontend we needed routing, server-state caching and a component model. Using a framework on each side rather than hand-rolling gave us conventions the whole team could follow, and NestJS's module system let the backend mirror the domain boundaries.
- **How it is implemented:** NestJS 11 for the API (`backend/src/app.module.ts` composing `auth`, `incidents`, `ingestion`, `organization`, `on-call`, `invite`, `metrics`, `monitoring`, `health` and `users`), and React 19 with Vite on the frontend (`frontend/src/features/` split by feature: `auth`, `incidents`, `organization`, `my-team`, `my-unavailabilities`, `integrations`, `delivery-log`, `overview`, `status`, `settings`, `landing`). Both sides are TypeScript. NestJS supplies the DI container, `class-validator` DTO pipes, guards, interceptors and `@nestjs/schedule`; React is paired with React Router and TanStack Query.
- **Contributor(s):** yahrour set up both foundations and the monorepo; every member then built features inside them.

### 2. Real-time features — Major, 2 pts

- **Why we chose it:** An incident dashboard that only updates on refresh is actively misleading during an outage. Whoever is watching the page needs to see an incident change status, get reassigned or receive a note as it happens. The subject allows "WebSockets or similar technology", and server-sent events fit better here because incident updates only travel server to client, so a full duplex protocol and its upgrade handling would be unnecessary weight.
- **How it is implemented:** The backend exposes `@Sse("events")` on the incidents controller (`backend/src/modules/incidents/incidents.controller.ts`), which returns an RxJS observable from `IncidentsService.events()` filtered to the incidents the requesting user can access. Every mutating path (create, reassign, acknowledge, resolve, note, escalation) calls a `changed()` emitter, so the stream carries real state changes rather than polls. On the frontend, `useIncidentEvents` (`frontend/src/features/incidents/hooks/useIncidentEvents.ts`) opens an `EventSource` against `/incidents/events` and reconnects when the connection closes, invalidating the relevant TanStack Query caches.
- **Contributor(s):** aaitabde, backend stream and frontend hook.

### 3. Advanced permissions system — Major, 2 pts

- **Why we chose it:** The application has two distinct populations. An `ENGINEER` should see and act on their own team's incidents; an `SRE` has broader reach. Without enforcement in one place, every controller would re-implement its own access check and one of them would eventually get it wrong.
- **How it is implemented:** A `@Roles(...)` decorator (`backend/src/common/decorators/roles.decorator.ts`) attaches required roles as metadata, and `RolesGuard` (`backend/src/common/guards/roles.guard.ts`) reads it with `Reflector.getAllAndOverride` at both handler and controller level, rejecting with `403` when the user's role is not in the list and `401` when no user is present. `AccessTokenGuard` handles authentication, and `@Public()` opts endpoints out.
- **Contributor(s):** sait-nac built the guard, decorator and ownership checks, added role-based route redirects on the frontend.

### 4. Organization system — Major, 2 pts

- **Why we chose it:** Incidents do not belong to individuals, they belong to teams that rotate responsibility. The organization layer is what makes the rest of the product work: it defines who is on call, who is unavailable, and therefore who an incident should reach.
- **How it is implemented:** Four tables in the `organization` schema (`backend/prisma/models/organization.prisma`): `teams` (owner, services array, rotation period, rotation index, escalation timeout), `team_members`, and `unavailabilities`. Services live in `backend/src/modules/organization/` split into `teams`, `members` and `unavailability`, plus a separate `on-call` module. The on-call chain is computed in `OnCallService` by walking team members from `currentRotationIndex`, skipping anyone with an approved unavailability window covering now, and returning a primary and secondary. Unavailability requests are submitted by members and approved or rejected by the owner, with overlap and expiry validation. A cron job rotates the index when `rotationPeriodDays` elapses.
- **Contributor(s):** yahrour.

### 5. WAF/ModSecurity + HashiCorp Vault — Major, 2 pts

- **Why we chose it:** The API is internet-facing and accepts arbitrary JSON from monitoring providers, which is exactly the input an attacker probes. Separately, the stack needs database passwords, Grafana credentials and a Vault token, and those must not live in the repository or in the Compose file where anyone with read access can lift them.
- **How it is implemented:** The WAF is built on `owasp/modsecurity-crs:nginx` (`infra/waf/Dockerfile`) with `SecRuleEngine On` in `infra/waf/modsecurity.conf`, so requests are actively inspected rather than only logged. `infra/waf/default.conf` terminates TLS on 443, redirects HTTP to HTTPS, proxies `/api/v1/` to the backend, and exempts a `/healthz` endpoint from inspection so container health checks are not blocked. Vault runs as its own service with a `tmpfs` secret volume so secrets stay in memory and are rewritten on each start; the backend loads them at boot from `secret/data/incident-lifecycle-manager` via `backend/src/vault/load-secrets.ts` using a token file, and the backup service reads its Postgres credentials from `/vault/secrets/`.
- **Contributor(s):** asebban.

### 6. Monitoring system with Prometheus and Grafana — Major, 2 pts

- **Why we chose it:** The application's own health depends on things the application cannot report about itself: request latency, error rates, database connection pressure. Pull-based metrics with dashboards make those visible, and for an incident tool it would be a poor look to have no observability of its own.
- **How it is implemented:** The backend registers a metrics registry through `@willsoto/nestjs-prometheus` and instruments HTTP request durations with a histogram provider (`backend/src/modules/monitoring/monitoring.module.ts`) applied via `http-metrics.interceptor.ts`, exposed at `/api/metrics`. Prometheus scrapes three jobs: itself, the backend, and `postgres-exporter` (`infra/monitoring/prometheus/`). Grafana is provisioned as code with two dashboards (`infra/monitoring/grafana/dashboards/backend-overview.json` and `postgres.json`) and alert rules under `provisioning/alerting`.
- **Contributor(s):** sait-nac built the Prometheus container, Grafana dashboards, exporter and alert rules.

### 7. ORM for the database — Minor, 1 pt

- **Why we chose it:** Hand-written SQL across eleven tables with four schemas would mean hand-maintained types and hand-written joins. An ORM gives compile-time checked queries and a migration history, which matters when several people are changing the schema in parallel.
- **How it is implemented:** The schema is split into one file per bounded context under `backend/prisma/models/` (`auth`, `organization`, `incident`, `ingestion`) and assembled by `backend/prisma/schema.prisma`, which declares the four PostgreSQL schemas. `PrismaService` (`backend/src/common/prisma/prisma.service.ts`) wraps the client with the pg adapter, Relations declare explicit `onDelete` behaviour, and the unique index `@@unique([teamId, openFingerprint])` enforces duplicate-alert suppression at the database level.
- **Contributor(s):** yahrour, sait-nac, asebban, aaitabde.

### 8. Custom-made design system — Minor, 1 pt

- **Why we chose it:** Four people building screens independently produce four different buttons. A shared component layer with a defined palette, type scale and icon set keeps the interface coherent and stops each feature from re-inventing tables, dialogs and form fields.
- **How it is implemented:** 30 reusable components in `frontend/src/components/ui/`, and the palette is CSS custom properties in `frontend/src/index.css`. Typography uses two variable fonts, Roboto for body and Public Sans for headings, with a defined `--font-sans`, `--font-heading` and `--font-script` scale. Icons come from `lucide-react`.
- **Contributor(s):** yahrour, sait-nac, asebban, aaitabde.

### 9. Advanced search with filters, sorting and pagination — Minor, 1 pt

- **Why we chose it:** Incident lists grow without bound. Without server-side filtering and pagination the page degrades as history accumulates, and an on-call engineer cannot find the incident they need during an outage.
- **How it is implemented:** Incident search is a validated DTO (`backend/src/modules/incidents/dto/find-incidents.dto.ts`) accepting `search`, `service`, `status`, `severity`, `teamId`, `assigneeId`, `limit` and `cursor`, with `class-validator` constraining status and severity to known values and capping `limit`. Pagination is cursor-based: `IncidentsService.findAll` decodes an opaque cursor, uses Prisma's `cursor` with `skip: 1`, and returns `nextCursor` alongside `total`. Teams, members and unavailabilities use offset pagination with sortable columns, driven by per-module `SORT_FIELD` enums and a shared `OffsetPaginationSearchParams` DTO. On the frontend, filter state is held in URL search params so a filtered view is linkable, with sort toggles in table headers and a shared pagination component.
- **Contributor(s):** aaitabde, yahrour.

### 10. Remote authentication with OAuth 2.0 — Minor, 1 pt

- **Why we chose it:** Requiring a new password for a tool people check during an outage is friction that costs response time. Google sign-in lets an engineer get in with the account they already have, and it removes password handling from that path entirely.
- **How it is implemented:** `passport-google-oauth20` with `@nestjs/passport` (`backend/src/modules/auth/google/`). The `User` model stores an optional unique `googleId` alongside a nullable `passwordHash`, so an account can be created either way. The flow redirects to Google, handles the callback, issues the same JWT access token and hashed refresh token as the password path, and sets them as scoped cookies. Cancelled sign-ins redirect back to login rather than erroring, and the frontend checks the session endpoint on load.
- **Contributor(s):** sait-nac.

### 11. Health check, status page, backups and disaster recovery — Minor, 1 pt

- **Why we chose it:** An incident tool that goes down silently is worse than useless. Operators need to know whether the API and database are reachable, and the team needs a way back if the database is lost.
- **How it is implemented:** `@nestjs/terminus` with `PrismaHealthIndicator.pingCheck` behind a `@Public()` `GET /health` endpoint (`backend/src/modules/health/health.controller.ts`), reporting per-dependency status. The frontend status page (`frontend/src/features/status/`) polls it every 30 seconds and renders each dependency as operational, outage or unknown. Backups run as a dedicated Compose service (`infra/database/db-backup-service/`) that reads Postgres credentials from Vault, runs `pg_dump` to a timestamped file, and writes to a `.tmp` file first so a failed dump never leaves a truncated backup in place. `infra/database/db.restore.sh` restores from a chosen dump, and `infra/database/DISASTER_RECOVERY.md` documents the procedure.
- **Contributor(s):** yahrour built the health endpoint, status page, backup and restore scripts and the recovery documentation; asebban wired the backup service to read its credentials from Vault.

### 12. Data export and import — Minor, 1 pt

- **Why we chose it:** Team configuration is tedious to enter by hand, and teams want their data out rather than locked in. Export and import make the tool portable and make setting up a second environment practical.
- **How it is implemented:** `GET /teams/export` and `POST /teams/import` on the teams controller (`backend/src/modules/organization/teams/teams.controller.ts`). Export serialises a team and its members to JSON or CSV depending on a `format` query parameter, using `csv-stringify`. Import accepts a file upload through `FileInterceptor`, validates the extension with a custom `FileExtensionValidator` pipe restricted to `json` and `csv`, parses with `csv-parse`, and returns a summary of what was created. Filenames are derived from the `Content-Disposition` header on the client.
- **Contributor(s):** yahrour.

## Individual Contributions

<!-- Each member fills their own block. Describe actual work (features, modules, components), challenges and how they were overcome. Do not repeat the assigned role text from Team Information. -->

### asebban

**Role:** Developer

#### Contributions

**Alert ingestion.** Built the `ingestion` module from scratch. API key endpoints generate a random key, show it once, and store only its SHA-256 hash with a prefix and an expiry date; expired keys are rejected. The alert endpoint authenticates the caller by hashed key, normalises the payload through a provider adapter, stores the alert with its raw JSON payload, and creates the incident from it. Added an endpoint to list ingested alerts with pagination.

**Integrations and Delivery Log pages.** On the frontend, the Integrations page manages API keys: a table with status filter and sorting, a create dialog that shows the new key once, and a delete dialog. The Delivery Log page lists every ingested alert in a paginated table matching the incidents table.

**WAF.** Added the ModSecurity + OWASP CRS container on nginx with `SecRuleEngine On`, HTTPS termination with a redirect from HTTP, and routing of the frontend, `/api/v1/` and Grafana through it. Fixed the rules that blocked `PUT`, `PATCH` and `DELETE`, and the healthcheck port.

**Vault.** Added Vault to the Compose stack with a bootstrap script that initialises and unseals it, writes the secrets into KV v2, creates a scoped backend policy and token, and renders secret files for other containers. The backend loads its secrets from Vault at boot (`backend/src/vault/load-secrets.ts`), and Postgres, Grafana and the backup service read their credentials from Vault instead of `.env` files.

**Other.** Dockerized the frontend.

#### Challenges and solutions

**Putting a WAF in front of the application without breaking it.** Adding ModSecurity with the OWASP Core Rule Set made the stack more secure, but its default rules are strict and some legitimate requests from our own application were blocked. Disabling the WAF or switching it to detection-only would have hidden the problem, so I kept the rule engine on and changed the configuration only where our application needed it, then tested the main flows again through the WAF.

**Managing secrets with Vault.** Moving secrets out of `.env` files and into Vault meant every service had to get its credentials at startup, in the right order, before it could run. I learned how Vault works (initialisation, unsealing, policies, tokens and the KV store) and set up the stack so that Vault starts first and the other services wait for it to be ready.

### yahrour

**Roles:** Technical Lead / Architect, Developer

#### Contributions

**Project foundation.** Chose the stack (NestJS for the API, React for the frontend) and set up the monorepo with `backend/` and `frontend/` workspaces. Configured commitlint with Husky hooks to enforce conventional commits, ESLint and Prettier with `lint-staged` in both workspaces, and defined the GitHub workflow rules: pull requests required for `main` and `dev`, at least one teammate review, squash-and-merge.

**Architecture.** Started the backend as a microservices skeleton, then led the migration to a modular monolith once it became clear the domain did not justify the operational cost of separate services. Reorganised the Prisma schema into one file per bounded context and moved modules to match those boundaries, so the code structure and the database schemas describe the same four domains.

**Organization domain** (the largest single share of the codebase): team CRUD with services, rotation period, rotation index and escalation timeout; team members with pagination, sorting and search; the on-call rotation engine including the scheduled rotation job and the primary/secondary chain; unavailability requests with approval, rejection, overlap detection and expiry handling; team export and import in JSON and CSV; and the team metrics that feed the overview dashboard.

**Cross-cutting work.** The health endpoint and status page. The database backup and restore scripts with the disaster recovery documentation. Offset pagination and sortable columns across teams, members and unavailabilities. The frontend foundation: Vite and Tailwind setup, axios and TanStack Query, absolute imports, environment validation, the `Page` layout component and the colour theme.

#### Challenges and solutions

**On-call rotation drift.** The first rotation implementation advanced the index by comparing the last rotation time to the current time and then writing `now` as the new `lastRotatedAt`. Because the cron runs every minute, each rotation was recorded a little later than the moment it was actually due, and that error accumulated: after several cycles the handover drifted by hours, and eventually by a whole rotation period. The fix was to stop storing `now` and instead store the _scheduled_ handover time, computed as `baseTime + rotationPeriodDays`, so the schedule stays anchored to its original start date no matter when the cron happens to run. The update is also guarded: the `where` clause includes the expected `lastRotatedAt` and `currentRotationIndex`, so two concurrent runs cannot both advance the same rotation.

**Unavailability silently ignored by the rotation.** The on-call chain was returning engineers who had an approved unavailability covering the current moment. The query filtered unavailabilities by status but the comparison was wrong, so the filter matched nothing and every member looked available. The chain walk was rewritten to check each candidate's approved windows against the current time explicitly, and to keep walking to the next member when the current one is away rather than returning an empty chain.

**Timezone handling across rotations and unavailability windows.** Rotation periods are configured in whole days, but "a day" depends on the user's timezone, and mixing local and UTC arithmetic produced windows that started or ended at the wrong moment, and in one case a default timezone was being applied that silently shifted dates for everyone. The solution was to store every timestamp as `timestamptz`, remove the default timezone entirely, and centralise the conversion in `convertDateToUtc` and `toLocalDayValue` using Luxon, so day boundaries are computed explicitly in the team's timezone and persisted in UTC.

**Race conditions in unavailability review.** Two owners reviewing the same request, or one owner double-clicking approve, could both pass the status check and then both write. The fix was to move the expected status into the `where` clause of an `updateMany` and check the returned count: if the count is `0`, someone else already changed the row, and the caller gets a `409 Conflict` instead of a silent overwrite. The same guarded-update pattern is used for incident acknowledge and resolve.

**Duplicate alerts creating duplicate incidents.** Ingested alerts arrive concurrently and several can describe the same outage. Rather than checking for an existing incident in application code, where two requests can both read "none" before either writes, the uniqueness is enforced by a database constraint: a SHA-256 fingerprint over provider, service and title, with `@@unique([teamId, openFingerprint])`. Resolving an incident nulls `openFingerprint`, so the constraint only covers open incidents and the same problem can be raised again later.

**Keeping pagination totals correct under filters.** Offset pagination returned a `total` that ignored the active search and filter, so the page count was wrong whenever a filter was applied. The count query was rebuilt to run with the same `where` clause as the data query, and the shared offset-pagination DTO was extracted so teams, members and unavailabilities all behave identically.

### aaitabde

- **Contributions:** [TODO]
- **Challenges and solutions:** [TODO]

### sait-nac

- **Contributions:** [TODO]
- **Challenges and solutions:** [TODO]

## Instructions

### Prerequisites

Docker, Docker Compose.

### Configuration

The stack reads configuration from four `.env` files. Each has a committed `.env.example`; copy it and fill in the values. All four files are gitignored, so nothing secret is committed.

```bash
cp infra/vault/.env.example      infra/vault/.env
cp backend/.env.example          backend/.env
cp frontend/.env.example         frontend/.env
cp infra/.env.example            infra/.env
```

**`infra/vault/.env`** — the source of truth for secrets. Vault reads this on first boot and writes the values into its KV store. Required keys:

| Key                                                 | Purpose                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Database credentials, also rendered to files for the Postgres and backup containers |
| `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`      | Grafana admin account                                                               |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`                  | Token signing secrets                                                               |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`          | Google OAuth 2.0 credentials                                                        |

**`backend/.env`** — non-secret runtime configuration. The backend validates this file with a Joi schema at startup and refuses to boot if anything required is missing or malformed.

| Key                                   | Notes                                                   |
| ------------------------------------- | ------------------------------------------------------- |
| `TZ`                                  | Must be exactly `UTC`; the schema rejects anything else |
| `NODE_ENV`                            | `development` or `production`                           |
| `PORT`                                | Defaults to `3000`                                      |
| `JWT_AUDIENCE`, `JWT_ISSUER`          | Required strings                                        |
| `VAULT_ADDR`                          | `http://vault:8200` inside the Compose network          |
| `GOOGLE_CALLBACK_URL`, `FRONTEND_URL` | Full URLs; `FRONTEND_URL` is also the CORS origin       |
| `IMPORT_MAX_FILE_BYTES`               | Upload limit for team import, defaults to `1048576`     |

`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are **not** set in this file. The backend pulls them from Vault at startup and injects them into `process.env` before the application module is loaded.

**`frontend/.env`** — build-time variables, validated with Zod. Because Vite inlines `VITE_*` variables at build time, the image must be rebuilt after changing them.

| Key                          | Notes                                            |
| ---------------------------- | ------------------------------------------------ |
| `VITE_API_URL`               | backend (API) URL                                |
| `VITE_IMPORT_MAX_FILE_BYTES` | Must match the backend's `IMPORT_MAX_FILE_BYTES` |

### Build and run

Deployment is a single command from the repository root:

```bash
docker compose up --build
```

First boot takes several minutes. The services start in dependency order and each waits on the one before it:

1. **Vault** initialises itself. On first boot it runs `vault operator init`, unseals, enables KV v2 at `secret/`, writes the Postgres and Grafana secrets plus the application secrets, creates a scoped `incident-backend` policy and a 24-hour token, then renders the secret files that other containers read. It signals readiness by creating `/vault/secrets/.ready`. The unseal key and root token are written to the `vault_token` volume at `/vault/runtime/init.json`.
2. **Postgres** starts once Vault is healthy, reading its credentials from the rendered secret files.
3. **Backend** starts once Postgres and Vault are healthy. It loads secrets from Vault, then applies the schema with `prisma db push`, then boots NestJS. Its healthcheck has a 300-second start period to allow for this.
4. **Frontend** starts once the backend is healthy.
5. **WAF** starts last, in front of both.

To run it detached, add `-d`:

```bash
docker compose up --build -d
```

To stop the stack, and to wipe the database and Vault state as well:

```bash
docker compose down          # stop, keep volumes
docker compose down -v       # stop and delete all volumes (database, Vault data, secrets)
```

### Database initialization

There are no migration files in the repository. The schema is applied at every backend boot by `npx prisma db push` in `backend/src/main.ts`, which creates or updates the tables to match `backend/prisma/models/`.

### Access URLs

All traffic should go through the WAF on port 8443, which terminates TLS with a self-signed certificate. Your browser will warn about the certificate on first visit; that is expected.

| URL                               | Service                                  |
| --------------------------------- | ---------------------------------------- |
| `https://localhost:8443`          | The application, through the WAF         |
| `http://localhost:8080`           | Redirects to HTTPS on 8443               |
| `https://localhost:8443/api/v1/`  | API, proxied by the WAF to the backend   |
| `https://localhost:8443/grafana/` | Grafana, proxied by the WAF              |
| `http://localhost:9090`           | Prometheus, direct (no WAF)              |
| `http://localhost:3001`           | Grafana, direct (no WAF)                 |
| `http://localhost:8200`           | Vault UI and API                         |
| `http://localhost:3000`           | Backend, direct (no WAF)                 |
| `http://localhost:4173`           | Frontend container, direct (no WAF)      |
| `localhost:5432`                  | PostgreSQL, not meant for browser access |

### Backups and restore

The `postgres-backup` service runs `pg_dump` every minute via cron, writing timestamped `.sql` files into `./backups` on the host. Each dump is written to a `.tmp` file first and only renamed on success, so a failed dump never leaves a truncated backup in place.

The full procedure for restoring a database is in [`infra/database/DISASTER_RECOVERY.md`](infra/database/DISASTER_RECOVERY.md)

## Resources

### References

<!-- TODO (owner: unassigned): list the documentation, articles and tutorials the team actually used. -->

- [TODO — e.g. NestJS documentation]
- [TODO — e.g. Prisma documentation]
- [TODO — e.g. ModSecurity / OWASP CRS documentation]

### AI usage

<!-- TODO: each member lists what they really used AI for. The subject requires the tasks and the project areas. Do not write generic claims. -->

| Member | Task   | Project area | AI tool | What was done with the output                    |
| ------ | ------ | ------------ | ------- | ------------------------------------------------ |
| [TODO] | [TODO] | [TODO]       | [TODO]  | [TODO — e.g. reviewed and rewritten, used as-is] |

---

## Known Limitations

<!-- TODO (owner: unassigned): list only real limitations found while testing. -->

- [TODO]
