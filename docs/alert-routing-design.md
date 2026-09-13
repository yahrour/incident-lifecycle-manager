# Alert → Team Routing: Design

Status: **proposal, not implemented**. No feature code has been written for this yet.

## Step 1 — Current state of the code

### Prisma schema (relevant models)

`backend/prisma/models/organization.prisma`:
```prisma
model Team {
  id      String @id @default(uuid()) @db.Uuid
  ownerId String @map("owner_id") @db.Uuid
  name    String @unique
  ...
  teamMembers TeamMember[]
  incidents   Incident[]
}
```
`Team` has **no notion of which services it owns** — no `services String[]`, no join table, nothing. `TeamMember` links a `User` to a `Team` (used for on-call rotation), and `Unavailability` tracks time off.

`backend/prisma/models/incident.prisma`:
```prisma
model Incident {
  teamId       String?  @map("team_id") @db.Uuid   // nullable, SetNull on delete
  team         Team?    @relation(...)
  service      String                              // free text, whatever the alert said
  severity     String                              // free text ("low"|"medium"|"high"|"critical" enforced only at DTO level)
  assignedToId String?  @map("assigned_to") @db.Uuid
  ...
}
```
`service` is a bare string column on `Incident` — it's stored, never resolved to anything. `teamId` is nullable in the schema (so "no team yet" is a representable state), but the write path doesn't currently exploit that (see below).

`backend/prisma/models/ingestion.prisma` only has `ApiKey` (used to authenticate the ingestion endpoint, scoped to an owning user, hashed with sha256). No alert/event table exists — alerts are not persisted at all today.

**There is no service→team ownership concept anywhere in the schema, code, or seed data.** This is greenfield.

### Where alerts are received, validated, parsed

`backend/src/modules/ingestion/alert/`:
- `alert.controller.ts` — `POST /api/v1/ingestion/alerts/:provider`, `@Public()` (bypasses the global `AccessTokenGuard`), authenticated instead via `x-api-key` header checked against the hashed `ApiKey` table.
- `alert.service.ts` — `verifyApiKey()` then `normalizeAlert(provider, payload)`, which switches on `provider.toLowerCase()`:
  ```ts
  switch (provider.toLowerCase()) {
    case "datadog": return this.datadogAdapter.normalize(payload as DatadogWebhookPayload);
    default: throw new NotFoundException(`Unsupported alert provider: ${provider}`);
  }
  ```
  **Only `datadog` is implemented.** Anything else (including `prometheus`/`alertmanager`) 404s today.
- `common/common-alert.ts` — the normalized shape every adapter must produce:
  ```ts
  export interface CommonAlert {
    provider: string;
    serviceName?: string;
    title: string;
    message?: string;
    severity: "critical" | "warning" | "info";
    occurredAt: Date;
  }
  ```
  **There is no `labels` field, no `team` field, nothing generic.** Any label/tag data an adapter doesn't explicitly map is dropped on the floor.
- `providers/datadog/datadog.adapter.ts` + `dto/datadog-webhook.dto.ts` — expects a payload shaped like `{ title, text?, date?, priority?, serviceName? }`. This is **not** the real shape of a Datadog webhook body (see Step 2) — it only matches if someone configures a custom Datadog webhook payload template to emit exactly those field names.
- **The controller's return value is the normalized `CommonAlert` — full stop.** `normalizeAlert()` is never wired to `IncidentsService`, nothing is persisted, no incident is created, and consequently no one is ever paged from this path today. This is confirmed by grepping for `AlertService`/`IncidentsService` usage — they're never referenced from each other or from a shared module.

### How incidents are created, and whether anything assigns them today

`backend/src/modules/incidents/incidents.service.ts`, `create()`:
```ts
async create(ownerId: string, createIncidentDto: CreateIncidentDto) {
  const onCall = await this.onCallService.getCurrentOnCall(createIncidentDto.teamId, ownerId);
  const assigneeUserId = onCall?.chain.find(({ role }) => role === "PRIMARY")?.id;
  if (!assigneeUserId) throw new ConflictException("No on-call engineer available");
  return this.prisma.incident.create({ data: { ...createIncidentDto, assignedToId: assigneeUserId } });
}
```
- `CreateIncidentDto.teamId` is **`@IsUUID()` — required, not optional.** So today the only way to create an incident is via `POST /api/v1/incidents` (role: `SRE`), and the caller must already know the `teamId`. Assignment to a specific engineer *is* automatic (via `OnCallService`), but **team resolution is entirely the caller's job** — a human picks the team in the request body.
- `ownerId` here is `user.sub` from the JWT of whoever calls the endpoint. This matters a lot for Step 4: an alert-ingestion pipeline has no logged-in user, so it can't produce an `ownerId` the same way.

### On-call lookup endpoint — exact signature

`backend/src/modules/oncall/oncall.controller.ts`:
```
GET /api/v1/teams/:id/oncall/current   [Roles: SRE]
```
→ `OnCallService.getCurrentOnCall(teamId: string, ownerId: string)` in `oncall.service.ts`:
```ts
const team = await this.prisma.team.findUnique({ where: { id: teamId, ownerId }, ... });
```
**This query is scoped by `ownerId`** — it only finds the team if `ownerId` is that team's owner. That's fine for a human SRE looking up their own team, but it means **neither this endpoint nor `IncidentsService.create()` can be called by an unattended alert-ingestion job as-is** — there's no "system" caller with a matching `ownerId`. Whatever routes alerts to teams will also need a variant of this lookup that isn't owner-scoped (e.g. `team.findUnique({ where: { id: teamId } })`), or the pipeline must borrow the team's own `ownerId`. This is an existing-code constraint the routing design has to work around, not something Step 3/4 need to re-solve, but it's called out here because it affects setup cost.

Rotation itself (`processRotations()`, `@Cron(EVERY_SECOND)`) is unrelated to routing — it just advances `currentRotationIndex` and notifies via Discord webhook.

### Anything resembling service→team ownership today

None. `grep -rniE "ownership|serviceName|service_name"` across `modules/` and `common/` only turns up the `serviceName` field on the Datadog DTO/adapter — a pass-through string, never looked up against anything.

---

## Step 2 — Real payload shapes

### Prometheus Alertmanager webhook

Alertmanager POSTs **one JSON object per notification, containing an array of alerts** (it groups firing/resolved alerts together, not one alert per HTTP call). Verified against the [Alertmanager webhook_config docs](https://prometheus.io/docs/alerting/latest/configuration/#webhook_config):

```json
{
  "version": "4",
  "groupKey": "{}:{alertname=\"HighErrorRate\"}",
  "truncatedAlerts": 0,
  "status": "firing",
  "receiver": "default",
  "groupLabels": { "alertname": "HighErrorRate" },
  "commonLabels": { "alertname": "HighErrorRate", "severity": "high", "service": "frontend-api" },
  "commonAnnotations": { "summary": "Error rate above threshold" },
  "externalURL": "http://alertmanager:9093",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HighErrorRate",
        "service": "frontend-api",
        "severity": "high",
        "team": "frontend"
      },
      "annotations": { "summary": "5xx rate > 5% for 5m" },
      "startsAt": "2026-09-13T10:00:00Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://prometheus:9090/graph?...",
      "fingerprint": "abcd1234"
    }
  ]
}
```

**Who defines the labels:** *we* do, entirely. `labels` on an alert = the time series' own labels (from the scrape target / exporter, e.g. `instance`, `job`) **plus** whatever the alerting rule's own `labels:` block adds. Since we author every Prometheus rule ourselves (per the prompt), any label — including a `team` label — is 100% under our control. `annotations` are also author-defined but are meant for human-readable text (summary/description), not machine routing. There is no label Prometheus injects on our behalf that names an owning team; it would always be something we add.

### Datadog webhook

Datadog does not send a fixed schema — the body is whatever you type into the monitor's webhook payload template, using `$VARIABLE` placeholders that Datadog substitutes at send time. Key variables (per [Datadog's webhook/notification docs](https://docs.datadoghq.com/integrations/webhooks/) and variable reference):

| Variable | Meaning |
|---|---|
| `$EVENT_TITLE` | Monitor name + status, e.g. `[Triggered] High CPU on prod-server-01` |
| `$TEXT_ONLY_MSG` / `$EVENT_MSG` | The monitor's message body (markdown stripped / raw) |
| `$ALERT_STATUS` | `Alert`, `Warn`, `Recovered`, `No Data` |
| `$PRIORITY` | `P1`–`P5` |
| `$HOSTNAME` | affected host, if host-scoped |
| `$TAGS` | **comma-separated string** of all tags on the monitor/event, e.g. `"env:production,team:frontend,service:checkout"` — not a JSON object, not individually addressable per-key by Datadog itself |
| `$LINK` | link back to Datadog |
| `$DATE` | event timestamp |

The default webhook integration payload (when you don't customize it) looks like:
```json
{
  "id": "...",
  "title": "$EVENT_TITLE",
  "text": "$EVENT_MSG",
  "date": "$DATE",
  "priority": "$PRIORITY",
  "tags": "$TAGS",
  "alert_type": "$ALERT_TYPE",
  "host": "$HOSTNAME"
}
```
**Who defines the tags:** whoever authors the monitor — tags are either auto-attached (host, container, cloud metadata) or hand-added custom tags (`team:frontend`, `env:production`). There's no first-class "service" or "team" field in the Datadog event model; those are just conventionally-named tags someone chose to attach, extracted client-side by splitting `$TAGS` on commas and colons.

### What our current parser could ingest today, and what breaks

- **Prometheus/Alertmanager: nothing works.** `AlertService.normalizeAlert` only has a `"datadog"` case; any other provider string 404s. Even if we added a case, `CommonAlert` has no `labels` field to carry `team`/`service` through, and the payload shape is a *batch* of alerts, not a single alert — the existing adapter contract (`normalize(payload): CommonAlert`, singular) doesn't fit an array without a rewrite.
- **Datadog: only ingests if the customer hand-shapes the payload to match our DTO exactly.** `DatadogWebhookPayload` expects literal field names `title`, `text`, `date`, `priority`, `serviceName`. Datadog's actual default webhook body uses `tags` (comma string), not `serviceName`; someone would have to configure a custom payload template with `"serviceName": "$SOME_TAG_VALUE"` — and Datadog has no built-in `$SOME_TAG_VALUE`-style single-tag extractor, so even that requires string-parsing `$TAGS` on our side or hardcoding one tag key as its own template variable (Datadog does support this only for a few blessed keys like `$HOSTNAME`/`$SERVICE`* — see caveat below).
- **Even a perfectly-shaped payload creates nothing.** `normalizeAlert()` returns the `CommonAlert` to the HTTP response and stops. No `Incident` row, no on-call page, regardless of provider. This is the biggest gap, independent of team routing.

*Caveat: some newer Datadog monitor types do expose `$SERVICE`/`$ENV` as denormalized template variables when APM service tagging is used, but this isn't guaranteed across all monitor types and wasn't confirmed as reliable in current docs — treat `$TAGS` parsing as the general-purpose mechanism.

### "We write the Prometheus rules ourselves — can we just put team in the rule labels?"

Yes, mechanically — nothing stops us from adding `labels: { team: frontend }` to every alerting rule, and Alertmanager will forward it verbatim in `alerts[].labels.team`. Failure modes of trusting it as the *only* mechanism:

1. **No enforcement.** It's a convention, not a constraint — a copy-pasted rule can carry a stale/wrong team label forever, or a new rule can simply omit it. Nothing fails loudly when this happens; the alert just silently routes wrong (or not at all).
2. **Label collisions.** If the underlying metric/target already has a label named `team` (e.g. injected by an exporter or a Kubernetes `team` label on the pod), the rule's own `labels:` block and the series' own labels merge — a mismatch there is a real, confusing failure mode to debug.
3. **Doesn't generalize.** It only covers alerts from rules *we* write. Datadog monitors, or any future vendor/webhook we don't author the rule for, get nothing from this mechanism.
4. **No single audit point.** "Which team owns which service" is scattered across every rule file instead of living in one place a reviewer (or a dashboard) can query.

None of this means "don't do it" — it means it's a good **first, cheap signal**, not a complete answer on its own. See the recommendation in Step 4.

---

## Step 3 — Comparison of approaches

| # | Approach | How it works | Setup cost | Unknown service | Offline? | How a reviewer verifies it | Failure modes |
|---|---|---|---|---|---|---|---|
| A | **Sender-provided label** (Prometheus rule `labels.team`, Datadog monitor tag `team:x`) | Adapter reads `labels.team` (Prometheus) or parses `team:` out of `$TAGS` (Datadog) directly into the resolved team | Very low — one label per rule we already write | Silently absent → must fall through to another mechanism | Yes, zero runtime deps | Open the alerting rule / monitor config, read the label | Typos/omissions routed wrong with no signal; doesn't cover alerts we don't author; label collisions with scrape-target labels (Prometheus) |
| B | **Ownership table in DB** (`service_ownership(service, teamId)`) | New Prisma model + small CRUD (same shape as `TeamsModule`/seed pattern), alert pipeline does an exact-match lookup on `CommonAlert.serviceName` | Medium — one migration, one module, seed data | Explicit `null` on lookup miss — easy to branch on | Yes — Postgres is already in `docker-compose.yml` | `SELECT * FROM service_ownership` or a `GET` endpoint returns the exact row | Exact-string match is brittle across naming variants (`checkout-api` vs `checkout_api`); needs to be kept in sync manually when services are added/renamed |
| C | **Pattern/regex on service or monitor name** (`^frontend-.* → frontend`) | Ordered list of `{pattern, team}` rules evaluated against the raw service string | Low — a handful of regexes, matches the `frontend-api`-style naming convention already implied by the example payload | Falls through if nothing matches — same as B | Yes, pure string logic | Reviewer runs the string against the regex list; log which pattern matched | Naming-convention drift breaks it silently (e.g. `backend-for-frontend` matches the wrong prefix); ordering-dependent bugs |
| D | **Ownership-as-code** (`config/service-ownership.yaml`, loaded at boot) | Same mapping as B, but as a committed file loaded into memory on startup instead of a DB table | Low — no migration, just a file + loader, code-reviewed like any other change | Explicit miss, same as B | Yes, in-memory, no DB roundtrip even | `git show`/`git blame` the one file directly — arguably the single most inspectable option | Requires a redeploy/restart to pick up edits; can drift from the DB's `Team` table (typo'd team name that doesn't match any real `Team.name`/id) |
| E | **LLM classification of message** (fallback classifier over title/message) | Send alert text + team descriptions to a model, parse back a team name | High — needs either an internet-connected API (violates the offline constraint) or a locally-hosted model added to the compose stack (extra image, RAM, cold-start time) | Best at guessing something for totally novel text, but **never says "I don't know"** — always produces an answer, right or wrong | **No**, unless self-hosted, and even then adds latency + non-determinism | Hardest to justify — "the model said so" isn't an inspectable rule, it's a black box call | Silent misrouting with false confidence; added latency on the ingest→page path; disqualified outright by the no-internet constraint unless self-hosted, which is its own project |
| F | **Hybrid chain** | Try A → then B → then C → else land in an explicit "unrouted" state (`teamId = null`, flagged for triage) instead of a fourth guess | Sum of the above, but each piece is small and reused | Terminal, visible "unrouted" bucket rather than a wrong guess | Yes, fully | Log/trace which stage resolved (or failed to resolve) each alert | Requires implementing 3 small things instead of 1 — the only real cost — but each stage degrades gracefully into the next |

---

## Step 4 — Recommendation

**Primary: Option B (DB-backed `ServiceOwnership` table), inside a hybrid chain (Option F): A → B → C → explicit "unrouted".**

Why B as the backbone, not A or D alone:
- **Provider-agnostic by construction.** Resolution happens *after* normalization, against `CommonAlert.serviceName` — it works identically whether the alert came from Datadog today or a Prometheus adapter we still need to build, without needing every alert source to cooperate (unlike A, which only works for rules we author).
- **Matches the existing architecture exactly.** The app's source of truth for `Team`/`TeamMember`/on-call is already Postgres, already in `docker-compose.yml`, already seeded via `backend/prisma/seed.ts`. A `ServiceOwnership` table is one more small model following the same pattern as `ApiKey`/`Team` — lowest new-concept cost, not a second parallel source of truth (as a YAML file in D would be, sitting next to but separate from the DB that already defines what a valid team even is).
- **Most inspectable for "how does it know?"** A reviewer can hit `GET /api/v1/service-ownership` (or query the table directly) and see the exact row that produced the routing decision — no need to go spelunking through rule files (A) or trust a redeployed file's current contents (D).

Why it's not A or D alone: A only covers self-authored Prometheus rules and has no audit trail; D works but introduces a second, harder-to-query source of truth that must stay consistent with the DB's `Team` rows anyway (the YAML would still need valid team names/ids). B keeps everything in one place.

**Fallback chain underneath B, not instead of it:**
1. **A first, when present** — if the normalized alert already carries a `labels.team` (Prometheus) or a parsed `team:` tag (Datadog) that matches a real `Team.name`, trust it immediately and skip the DB lookup. It's free (no query), and for rules we author ourselves it's the most direct signal — the rule author already knows the answer at write time.
2. **B (the ownership table)** for everything else — covers alerts from monitors we didn't hand-label, and is the mechanism that has to exist anyway for auditability.
3. **C (naming-convention regex)** as a last deterministic guess for services that haven't been added to the ownership table yet — cheap insurance against a new service going completely unrouted just because nobody has run the admin step, using the `<team>-<component>` convention already visible in the example payload (`frontend-api`).
4. **No match → explicit unrouted state, not a guess.** `Incident.teamId` is already nullable in the schema — use that: create the incident with `teamId: null` and a distinguishable status/flag for manual triage, rather than defaulting to some team or blocking ingestion entirely. This also means `IncidentsService.create()`'s `teamId` needs to become optional for the alert-ingestion path (it's currently `@IsUUID()` required — that DTO is used for the human-driven `POST /incidents` endpoint and shouldn't have to change its contract; alert-ingestion should get its own creation path/DTO rather than reusing `CreateIncidentDto` as-is).

**No LLM stage**, now or as an automatic fallback: it fails the no-internet/docker-compose constraint outright unless self-hosted, and even self-hosted it's non-deterministic and cannot produce the "how does it know?" answer a reviewer can inspect — a wrong-but-explainable "unrouted" beats a confident-but-opaque guess for this use case. If desired later, it could sit as an *optional, explicitly-invoked* suggestion tool for humans triaging the "unrouted" bucket — never in the automatic paging path.

**Two existing-code changes this recommendation depends on regardless of routing mechanism** (called out in Step 1, restated here because they gate the demo, not because they're part of "the design" the user is choosing between):
- `CommonAlert` needs a `labels?: Record<string, string>` (or similar) field so any adapter can carry a sender-provided team hint through — right now it's structurally impossible to pass one.
- `OnCallService.getCurrentOnCall` / `IncidentsService.create` are owner-scoped (`ownerId` from a logged-in user's JWT). An automated alert pipeline has no such user; it needs a system-context lookup path (query by `teamId` alone, or resolve via the team's own `ownerId`) independent of which of A/B/C resolves the team.

This has not been implemented. Waiting for approval before writing any code.
