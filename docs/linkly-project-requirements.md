# Linkly — URL Shortening and Link Analytics

Project vision and requirements • Updated: 6 October 2026

## 1. Project vision

**Linkly** is a portfolio project that creates short URLs, redirects visitors to their destinations, and shows how those links are used. The long-term vision is a real-time link analytics platform, developed in small, deployable stages.

The first release focuses on a working URL shortener and basic click tracking. Advanced infrastructure and analytics come later, once the core flow works end to end.

Example:

```text
Create: https://example.com/products/123
Share:  https://<linkly-api-project>.vercel.app/r/aX72k
Visit:  record a click and return a 302 redirect to the original URL
View:   click totals, recent visits, and clicks over time
```

These addresses are illustrative. Use provider subdomains initially; a purchased custom domain is optional.

## 2. Goals and constraints

- Build a useful, publicly demonstrable portfolio application.
- Target zero recurring hosting cost within free-tier allowances.
- Use TypeScript across the frontend and backend.
- Use Express for the API and MongoDB with Mongoose as the sole persistent database throughout the project.
- Make link creation, redirects, and analytics understandable and reliable before adding distributed infrastructure.
- Treat real-time delivery, queues, caching, and high-volume analytics as incremental improvements.
- Accept free-tier cold starts, quotas, and limited availability; this release has no production uptime guarantee.

This document defines planned behavior. It does not indicate that these features are already implemented.

## 3. Technology stack

| Layer | Technology | First release | Later role |
| --- | --- | --- | --- |
| Edge / CDN / security | Cloudflare | Optional; use hosting-provider delivery and HTTPS initially | DNS, edge protection, and custom-domain setup |
| Frontend | Next.js + React + TypeScript | Required | Dashboard and richer analytics UI |
| REST API | Node.js + Express + TypeScript | Required | Link management and analytics endpoints |
| Realtime | Socket.IO | Deferred; refresh analytics manually initially | Live visitor stream and dashboard updates |
| Primary database | MongoDB, accessed with Mongoose | Required; MongoDB Atlas Free for hosting | Links, click events, and future aggregates |
| Cache | Redis | Deferred | Link lookup caching and shared rate limiting |
| Queue / workers | BullMQ + Redis | Deferred | Durable asynchronous analytics processing |
| Validation | Zod | Required | Request and environment validation |
| API documentation | OpenAPI / Swagger | Basic OpenAPI contract | Interactive Swagger documentation |
| Observability | OpenTelemetry + structured logs | Structured logs initially | Traces and metrics once multiple services exist |
| Analytics storage | MongoDB aggregation pipelines and aggregate collections | Query click events initially | Store hourly/daily summaries in MongoDB as traffic grows |
| Object storage | Cloudflare R2 | Optional future addition | Generated exports or stored assets |

Only install and configure components needed for the current phase. Redis, BullMQ, and Socket.IO are part of the target architecture, rather than prerequisites for the first release.

## 4. Free-hosting plan

### Recommended first deployment

| Component | Hosting | Notes |
| --- | --- | --- |
| Next.js frontend | Vercel Hobby | Suitable for a personal, noncommercial portfolio within plan terms and quotas |
| Express API and redirect routes | Separate Vercel project using the Node.js runtime | Deploy Express as a Vercel Function; reuse database connections across warm invocations |
| MongoDB | MongoDB Atlas Free | Persist links and events; monitor storage and transfer allowances |
| Redis, workers, realtime server | None initially | Add only when the feature and its hosting requirements are justified |

Vercel documents [Express deployment as a Vercel Function](https://vercel.com/docs/frameworks/backend/express). Check the [Hobby plan terms](https://vercel.com/docs/plans/hobby) and [Atlas Free limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/) before deploying. Free hosting is a budget target, not a promise of unlimited usage.

The frontend calls the separate API over HTTPS. Configure an explicit CORS allowlist for development and deployed frontend origins. Construct short URLs from the configured public API origin, because redirects live on the API project in this first setup.

Vercel already provides delivery infrastructure. Cloudflare is optional initially and does not need to sit in front of a provider-owned `vercel.app` address. A custom domain can be considered later.

### MongoDB database plan

MongoDB is the database for every phase of Linkly. Use MongoDB Atlas Free for the hosted portfolio application and either a local MongoDB instance or a separate Atlas development database during development. Access it through Mongoose in the Express API.

Store links, click events, future user accounts, campaigns, and analytics summaries in MongoDB collections. Use MongoDB aggregation pipelines for dashboard breakdowns and time-based queries; add hourly and daily aggregate collections when querying raw events becomes expensive. Redis remains an optional cache and queue dependency, while MongoDB remains the source of truth for persistent application data.

### Hosting future realtime and workers

Do not assume the request-based Express deployment can also operate a continuously running Socket.IO server or BullMQ worker. Before adding them, verify current Vercel realtime support, connection lifetime, Socket.IO transport compatibility, and plan eligibility against [Vercel's current documentation](https://vercel.com/docs/functions).

A persistent Node.js service is another option for Socket.IO. Render provides a [free web-service option](https://render.com/docs/free), but idle spin-down and quotas affect availability. It should not be treated as an always-on worker solution. Dedicated worker hosting and compatible Redis must be evaluated separately; keep these features local or deferred if they cannot fit the zero-cost budget.

BullMQ needs a compatible Redis connection and a worker runtime. An HTTP-only Redis endpoint is insufficient for its normal Redis client. Verify provider command support, connection limits, eviction policy, and free allowances before selecting a service.

## 5. MVP functional requirements

### Create a short link

- Provide a form accepting a destination URL.
- Validate on both the client and server using Zod.
- Accept only absolute HTTP or HTTPS URLs; reject embedded credentials and invalid schemes.
- Generate a random, case-sensitive, URL-safe short code, initially 7–8 characters.
- Enforce code uniqueness with a database unique index and retry collisions.
- Return the link ID, code, destination, short URL, and creation timestamp.
- Provide a copy-to-clipboard action and clear success/error states.
- Different submissions may create different short links for the same destination.

### Redirect visitors

- Resolve `GET /r/:code` from MongoDB and send `302 Found` with a `Location` header.
- Return `404` for an unknown code.
- Return `410` for a disabled link.
- Set `Cache-Control: no-store` so browser/CDN caching does not bypass tracking.
- Count qualifying GET requests; HEAD requests must not create click events.
- Do not fetch the destination page during link creation or redirection.
- Reject obvious self-referential Linkly redirect destinations to prevent redirect loops.

### Track link usage

For each qualifying redirect request, store a click event with:

- Event ID and link ID.
- Timestamp in UTC.
- Referrer hostname when available, otherwise `direct/unknown`.
- Device category, browser family, and operating-system family inferred from the user agent; use `unknown` when parsing is inconclusive.

First-release click totals represent tracked requests, including bots and preview crawlers. They do not represent confirmed people or unique visitors. Referrer headers can be absent, and messaging apps cannot reliably be identified from a missing header.

### View and manage links

- An owner can list their links with pagination, destination, short URL, creation date, status, and tracked click total.
- An owner can view recent events and daily click counts for a selected link.
- Include total clicks and clicks today; optionally show device, browser, and referrer breakdowns from the same event data.
- An owner can disable a link.
- Provide loading, empty, unavailable-service, and error states.
- Start with manual refresh. If periodic refresh is added, run it only while the dashboard is visible and keep requests within hosting allowances.

### Access model for the portfolio demo

The proposed MVP is a single-owner demonstration: redirects are public, while creation, listing, disabling, and analytics require an authenticated owner session. A signed, HTTP-only cookie can support the small initial login flow; keep credentials and signing secrets on the server. Protect cookie-authenticated mutations against CSRF.

Recruiters can inspect seeded examples through a read-only demo dashboard containing synthetic data. Do not expose private event history, owner credentials, or unrestricted anonymous link creation. Multi-user registration and per-user ownership are a later phase.

## 6. Initial API contract

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Start owner session | Public, rate limited |
| POST | `/api/auth/logout` | End session | Owner |
| POST | `/api/links` | Create a short link | Owner |
| GET | `/api/links` | Paginated link list | Owner |
| GET | `/api/links/:id` | Link details | Owner |
| PATCH | `/api/links/:id` | Change active/disabled status | Owner |
| GET | `/api/links/:id/analytics` | Totals and daily counts for a date range | Owner |
| GET | `/api/links/:id/events` | Paginated recent click events | Owner |
| GET | `/r/:code` | Track and redirect | Public |
| GET | `/api/health` | Minimal service health response | Public |

Creation example:

```json
{ "originalUrl": "https://example.com/products/123" }
```

Successful response: `201 Created`.

```json
{
  "id": "<link-id>",
  "code": "aX72k9Q",
  "originalUrl": "https://example.com/products/123",
  "shortUrl": "https://<linkly-api-project>.vercel.app/r/aX72k9Q",
  "createdAt": "2026-10-06T10:00:00.000Z"
}
```

Use consistent JSON errors with an error code, message, and request ID. Distinguish `400` invalid input, `401` unauthenticated, `403` forbidden, `404` missing resource, `410` unavailable link, `429` rate limited, and `503` temporary service failure. Validate date ranges, cap analytics queries to retained history, and enforce pagination limits.

## 7. Initial MongoDB data model

### `links`

| Field | Purpose |
| --- | --- |
| `_id` | Internal link ID |
| `code` | Unique short code |
| `originalUrl` | Validated destination |
| `ownerId` | Single owner initially; supports later user ownership |
| `status` | `active` or `disabled` |
| `createdAt`, `updatedAt` | UTC timestamps |

Indexes: unique `{ code: 1 }`; `{ ownerId: 1, createdAt: -1 }` for the dashboard.

### `click_events`

| Field | Purpose |
| --- | --- |
| `_id` | Unique event ID |
| `linkId` | Reference to the link |
| `timestamp` | UTC visit timestamp |
| `referrerHost` | Hostname or `direct/unknown` |
| `device`, `browser`, `os` | Parsed categories |

Indexes: `{ linkId: 1, timestamp: -1 }`; TTL index on `timestamp` for the proposed 30-day raw-event retention window. TTL deletion is eventual, so analytics queries must explicitly enforce the retention cutoff.

Initially derive totals from events, avoiding an independently updated counter that can diverge from event history. Label these as **tracked clicks in the last 30 days**; clicks today use UTC day boundaries. Daily chart buckets also use UTC, while the UI may display individual timestamps in the viewer's timezone. All-time totals require separate durable aggregates in a later phase.

Do not store raw IP addresses or full user-agent strings in the initial schema. Country and city are deferred until a trusted geolocation source exists. Any future hashed visitor identifier needs a defined purpose and retention policy; hashing alone does not make visitor data anonymous.

## 8. Request flow and reliability

### First release

```text
Next.js dashboard -> Express REST API -> MongoDB Atlas

Visitor -> GET /r/:code -> link lookup
                         -> bounded click-event insert
                         -> 302 redirect
```

For low portfolio traffic, await one small event insert with a short database-operation timeout before returning the redirect. Do not calculate aggregates in the redirect handler. If event storage fails after a destination is resolved, log the failure and still redirect; if link lookup fails, return a service-unavailable response.

This consciously adds a small write delay in exchange for a simple deployable MVP. Tracking is best effort, and failed event writes can make totals incomplete. Do not launch an unawaited promise after returning a serverless response and assume it will finish.

### Later queue-based flow

```text
Visitor -> API -> Redis cache / MongoDB lookup
              -> enqueue click event -> 302 redirect

BullMQ worker -> persist event -> update aggregates
              -> publish update -> Socket.IO -> authorized dashboard
```

Await queue acknowledgement before redirecting when possible, with a bounded failure policy. Use stable event IDs, idempotent processing, retries with backoff, and failed-job visibility. Queue acknowledgement and event persistence are distinct states. Cache invalidation must accompany destination or status changes. Reconnecting dashboards must reload persisted analytics rather than depend on receiving every socket message.

## 9. Quality, security, and operational requirements

- Keep database access server-side and validate environment configuration at startup.
- Reuse MongoDB connection pools; cap pool size for a small free deployment.
- Keep API secrets out of client bundles and source control.
- Bound request bodies, URL length, page size, and analytics date ranges.
- Apply login and creation rate limits. In-memory limits are useful locally but do not provide a global limit across serverless instances; use a shared store or verified platform protection for deployment.
- Validate proxy trust before using forwarded IP or geographic headers.
- Log request IDs, route, status, duration, and operational failures; redact cookies, credentials, and destination query strings.
- Disable caching for redirects and private dashboard/API responses.
- Monitor free-tier usage and prevent raw event history from growing without bounds.
- Provide a short tracking notice, and keep synthetic demo analytics separate from real visitor data.
- Keep OpenAPI documentation aligned with implemented endpoints.

Redirect latency is a measurement to collect, not an advertised guarantee. Measure warm and cold requests separately, especially on free hosting.

## 10. Suggested repository layout

```text
apps/
  web/                 # Next.js frontend
  api/                 # Express API and redirect handling
packages/
  shared/              # Shared Zod schemas and TypeScript types, when useful
docs/
  linkly-project-requirements.md
```

Use pnpm, which is already configured in this repository. This is a proposed structure for implementation; the documentation task does not create application scaffolding.

Suggested configuration: `MONGODB_URI`, `APP_ORIGIN`, `SHORT_BASE_URL`, session-signing secret, and owner-login configuration. Only a public API base URL belongs in a frontend `NEXT_PUBLIC_` variable. Add Redis and telemetry configuration in their respective phases.

## 11. Delivery milestones and acceptance criteria

### Phase 1 — Basic URL shortener

- Set up the TypeScript Express API and MongoDB connection.
- Implement validated creation, unique codes, link resolution, and redirects.
- Build the Next.js form and copy action.
- Confirm a created link survives a process restart and redirects correctly.
- Verify invalid URLs, code collisions, missing links, and disabled links.

### Phase 2 — Basic tracking and portfolio MVP

- Add click events, retained-history totals, recent visits, and a daily chart.
- Add owner login, protected management, and read-only seeded demo data.
- Deploy the frontend/API to Vercel and MongoDB to Atlas.
- Confirm a tracked GET appears in analytics, HEAD does not count, and analytics failure still allows a resolved redirect.
- Verify unauthenticated requests cannot read private analytics or mutate links.
- Document local setup, environment variables, API behavior, and known free-hosting limits.

**The basic portfolio release is complete when Phase 1 and Phase 2 work end to end on the deployed environment.**

### Phase 3 — Link management and richer analytics

Custom aliases, destination editing, expiry, QR codes, UTM campaign generation, device/browser/referrer charts, trusted country-level data, and basic bot classification.

### Phase 4 — Real-time backend engineering

Redis caching, shared rate limiting, BullMQ workers, hourly/daily aggregates, Socket.IO live updates, reconnect recovery, OpenTelemetry tracing, and a justified hosting plan for persistent services.

### Phase 5 — Optional advanced vision

Preserve these ideas from the original vision as future possibilities:

- Approximate unique/returning visitors with explicit measurement limits.
- Live visitor stream and approximate visitor map.
- Password protection and maximum click limits.
- Bot filtering, anomaly detection, and traffic-spike alerts.
- Destination safety scanning and guarded metadata previews.
- Device/geography routing and A/B destination testing.
- Custom domains, campaigns, multi-user accounts, organizations, and roles.
- API keys, public API access, webhooks, and delivery retries.
- Analytics exports and optional R2 storage; retain analytics events and summaries in MongoDB.
- Horizontal scaling, more advanced aggregation, and an AI analytics assistant.

Conversion analytics require explicit instrumentation on destination sites; redirect counts alone cannot establish conversions or an A/B winner. Destination scanning and previews introduce server-side fetching and need SSRF defenses before implementation. Advanced features are optional and must justify their complexity and hosting cost.

## 12. Immediate implementation priority

Build this sequence first:

**Create a link -> open its short URL -> redirect successfully -> persist a click -> view that click in the dashboard.**

Expand the platform only after that loop is working and deployed.
