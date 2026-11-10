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

---

## Description

**Incident Lifecycle Manager** is a web application for tracking incidents from detection to resolution. Alerts from monitoring tools are ingested, grouped into incidents, assigned to on-call engineers and followed until they are resolved.

<!-- TODO (owner: unassigned): confirm the goal statement above matches what the team wants to present, and add 2-3 sentences on the target users. -->

**Key features** (see [Features List](#features-list) for details and contributors):

- Email/password sign-up and sign-in, and Google sign-in.
- Incident list, detail, notes, assignment, acknowledge and resolve.
- Alert ingestion through API keys.
- Teams, members, on-call rotation and unavailability requests.
- Security and operations tooling: WAF, secrets management, monitoring, health checks and backups.

<!-- Keep this list to what is really implemented. Remove anything that is not demoable. -->

---

## Team Information

| Login    | Assigned role(s)    | Responsibilities                               |
| -------- | ------------------- | ---------------------------------------------- |
| asebban  | [TODO — unassigned] | [TODO — brief description of responsibilities] |
| yahrour  | [TODO — unassigned] | [TODO — brief description of responsibilities] |
| aaitabde | [TODO — unassigned] | [TODO — brief description of responsibilities] |
| sait-nac | [TODO — unassigned] | [TODO — brief description of responsibilities] |

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

Listed from the repository's `package.json` files and `docker-compose.yml`.

| Area           | Technology                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, React Hook Form, Recharts                       |
| Backend        | NestJS 11 (Node.js, TypeScript), Passport (JWT, Google OAuth 2.0), class-validator, bcrypt                                |
| Database       | PostgreSQL 18                                                                                                             |
| ORM            | Prisma 7                                                                                                                  |
| Infrastructure | Docker Compose, ModSecurity (OWASP CRS, nginx) as WAF, HashiCorp Vault, Prometheus, Grafana, scheduled PostgreSQL backups |

**Justification of major technical choices**

<!-- TODO (owner: unassigned — suggest the Tech Lead): for each row, say why it was chosen (framework, PostgreSQL, Prisma, WAF/Vault, monitoring). Write real reasons only. -->

| Choice                   | Why                                                               |
| ------------------------ | ----------------------------------------------------------------- |
| [TODO — e.g. NestJS]     | [TODO]                                                            |
| [TODO — e.g. PostgreSQL] | [TODO — the subject requires the database choice to be justified] |

---

## Instructions

<!-- TODO (owner: unassigned — another teammate is writing this part): this section is required and must be verified on a fresh clone.
Required by the subject: prerequisites (software, tools, versions), .env setup, step-by-step run instructions. Deployment must run with a single command. -->

### Prerequisites

[TODO — owner: unassigned — software and exact versions (e.g. Docker / Docker Compose)]

### Configuration

- Copy `.env.example` to `.env`. Never commit real values.
- [TODO — owner: unassigned — list required variables; note that `infra/vault/.env` also exists, and how it is created]

### Build and run

[TODO — owner: unassigned — the supported single command and any first-run steps (Vault initialization, TLS certificates for HTTPS)]

### Database initialization

[TODO — owner: unassigned — migrations and seed (the backend has a `db:seed` script; confirm whether it runs automatically)]

### Access URLs

Host ports published in `docker-compose.yml` (verify what each serves before keeping):

| Port        | Service (from compose)      | Verified URL                 |
| ----------- | --------------------------- | ---------------------------- |
| 8443 / 8080 | WAF (HTTPS / HTTP redirect) | [TODO]                       |
| 4173        | Frontend container          | [TODO]                       |
| 3001        | Grafana                     | [TODO]                       |
| 9090        | Prometheus                  | [TODO]                       |
| 8200        | Vault                       | [TODO]                       |
| 5432        | PostgreSQL                  | not meant for browser access |

Backups and restore: see [`infra/database/DISASTER_RECOVERY.md`](infra/database/DISASTER_RECOVERY.md).

---

## Database Schema

PostgreSQL, accessed through Prisma. The model files are in `backend/prisma/models/`.

**Diagram:** [TODO — owner: unassigned — add the schema diagram (image or link to its source)]

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

<!-- TODO (owner: unassigned): add key fields and data types per table once the diagram is added. Types are in backend/prisma/models/*.prisma. -->

---

## Features List

<!-- Verified present in code (routes/controllers). The "Contributor(s)" column must be filled by the team, and "Status" confirmed by a demo. -->

| Feature                             | Description                                                               | Contributor(s) |
| ----------------------------------- | ------------------------------------------------------------------------- | -------------- |
| Authentication                      | Email/password sign-up and sign-in, token refresh, logout                 | [TODO]         |
| Google sign-in                      | OAuth 2.0 login with Google                                               | [TODO]         |
| Invitations                         | Invite users to a team by token and accept the invite                     | [TODO]         |
| Incident management                 | List with search and filters, detail, notes, assign, acknowledge, resolve | [TODO]         |
| Live incident events                | Server-sent event stream on incidents                                     | [TODO]         |
| Alert ingestion                     | Providers post alerts using API keys; API key management                  | [TODO]         |
| Teams and members                   | Create, edit, delete teams; view and remove members; team stats           | [TODO]         |
| On-call and unavailability          | Current/upcoming on-call, unavailability requests with approve/reject     | [TODO]         |
| Team export / import                | Export and import team data                                               | [TODO]         |
| Overview dashboard                  | Incident and team metrics                                                 | [TODO]         |
| Health and status page              | Health endpoint and status page                                           | [TODO]         |
| Privacy Policy and Terms of Service | Pages in the frontend landing feature                                     | [TODO]         |
| Metrics and monitoring              | Prometheus metrics, Grafana dashboards and alert rules                    | [TODO]         |
| Backups                             | Scheduled database backups and a restore procedure                        | [TODO]         |

---

## Modules

Point rule: Major = 2 pts, Minor = 1 pt. The project needs at least 14 points.

<!-- TODO (owner: unassigned): a separate review of module eligibility is in progress. Do NOT fill "Points counted" until each module has been demoed and checked against the subject bullets. A module that is not fully functional counts for 0. -->

| Module                                                                    | Type  | Pts | Status           | Contributor(s) |
| ------------------------------------------------------------------------- | ----- | --- | ---------------- | -------------- |
| Use a framework for both frontend and backend                             | Major | 2   | [TODO — confirm] | [TODO]         |
| Real-time features using WebSockets or similar technology                 | Major | 2   | [TODO — confirm] | [TODO]         |
| Advanced permissions system                                               | Major | 2   | [TODO — confirm] | [TODO]         |
| Organization system                                                       | Major | 2   | [TODO — confirm] | [TODO]         |
| WAF/ModSecurity (hardened) + HashiCorp Vault                              | Major | 2   | [TODO — confirm] | [TODO]         |
| Monitoring system with Prometheus and Grafana                             | Major | 2   | [TODO — confirm] | [TODO]         |
| Use an ORM for the database                                               | Minor | 1   | [TODO — confirm] | [TODO]         |
| Custom-made design system (min. 10 reusable components)                   | Minor | 1   | [TODO — confirm] | [TODO]         |
| Advanced search with filters, sorting and pagination                      | Minor | 1   | [TODO — confirm] | [TODO]         |
| Remote authentication with OAuth 2.0                                      | Minor | 1   | [TODO — confirm] | [TODO]         |
| Health check and status page with automated backups and disaster recovery | Minor | 1   | [TODO — confirm] | [TODO]         |
| Data export and import                                                    | Minor | 1   | [TODO — confirm] | [TODO]         |

**Points total:** [TODO — compute only from validated modules: Majors × 2 + Minors × 1]

<!-- Modules of choice (custom modules): none are listed so far. If one is added, copy the template below and answer all four questions the subject requires. -->

### Module implementation details

<!-- TODO: repeat this block once per module. -->

#### [Module name] — [Major/Minor], [points] pt(s)

- **Why we chose it:** [TODO]
- **How it is implemented:** [TODO — key files, libraries, behavior]
- **Technical challenges it addresses:** [TODO]
- **Contributor(s):** [TODO]

#### Custom module template (only if a "Module of choice" is claimed)

- **Why we chose it:** [TODO]
- **What technical challenges it addresses:** [TODO]
- **How it adds value to the project:** [TODO]
- **Why it deserves Major (2 pts) / Minor (1 pt) status:** [TODO]

---

## Individual Contributions

<!-- Each member fills their own block. Describe actual work (features, modules, components), challenges and how they were overcome. Do not repeat the assigned role text from Team Information. -->

### asebban

- **Contributions:** [TODO]
- **Challenges and solutions:** [TODO]

### yahrour

- **Contributions:** [TODO]
- **Challenges and solutions:** [TODO]

### aaitabde

- **Contributions:** [TODO]
- **Challenges and solutions:** [TODO]

### sait-nac

- **Contributions:** [TODO]
- **Challenges and solutions:** [TODO]

---

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
