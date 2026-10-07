# Repository review and deployment preparation

Reviewed branch: `new-ui` (the branch referred to as the new UI).
Original GitHub commit: `a883759941fa7a611e3709ef849784dd549d4e71`.
Review date: 7 October 2026.

## Status and scope

The original branch's 80 tracked files were inspected, including all frontend,
backend, SQL, lockfile, environment templates, configuration, and documentation.
The application remains a React/Vite frontend with an Express/MariaDB backend;
its visual direction and existing data model are preserved. There is no ORM,
background worker, or automatic database migration.

**Application checks pass; deployment is gated on manual database preparation,
real credentials, infrastructure setup, and real-service staging acceptance.**
The browser suite and container build passed in GitHub Actions. These checks do
not prove that a particular live database, USDA key, TLS proxy, or hosting
environment is configured correctly.

## Major findings and implemented changes

| Area | Confirmed problem in the original branch | Implemented change |
| --- | --- | --- |
| Production startup | No complete production UI/API hosting path or documented reverse-proxy/service setup | Express serves the built UI and API on one origin; fails early if the production build is missing; Node 24 pin, start/build scripts, Caddy, systemd, and non-root Docker configuration |
| Environment | Production origin/port/proxy/TLS settings were not validated, and the frontend used a development-specific API URL | Strict secret/origin/port/proxy/TLS validation; empty secret templates; development proxy; production rejects an external `VITE_API_URL`; complete variable reference |
| Authentication/input | Insufficient type/length checks, duplicate-registration race returned a server error, no request limiting | Bounded credentials matching database/bcrypt limits, duplicate 409 handling, HS256-only JWT verification, login/signup/API/provider rate limits |
| Browser security | Missing explicit write-request protection and production security headers | Exact origin allowlist, required custom write header, HttpOnly/Secure/SameSite cookies, Helmet/CSP, no-store API responses, no framework disclosure header |
| Errors/operations | Development error logs could disclose sensitive query details; incomplete readiness/shutdown handling | Safe JSON errors, request IDs, metadata-only logs, read-only column probes, separate liveness/readiness, connection/query timeouts, graceful shutdown |
| Profile/date behavior | Browser calendar dates could differ from database/server dates; invalid observation dates and oversized IDs were insufficiently bounded | Validated local calendar date/time zone, pre-birth/future date rejection for weight, date-aware initial weight creation, integer bounds |
| Profile loading | Failed initial profile loading could resemble an empty account; background refresh disrupted the active workspace | Separate loaded/loading/error state, retries, independent profile/weight/nutrition refreshes, stale-response guards |
| Sessions | Failed logout could falsely appear successful; an old 401 could clear a newer session | Preserve the signed-in state and show a retryable logout error; session generation checks and expiry handling |
| Nutrition correctness | Household portion aliases could use the weight of a multi-unit portion as one unit; oversized/tiny quantities could overflow or round outside schema precision | Explicit portion amount conversion, unambiguous portion matching, quantity/gram/nutrient bounds, unknown nutrient preservation, clearer empty-search state |
| USDA reliability | Repeated requests and sequential recipe calls increased latency/quota use | Bounded cache, single-flight deduplication, limited concurrency/queue, process quota, request/recipe deadlines, safe provider errors |
| Weight workflow | No way to remove an incorrect entry | Confirmed, ownership-scoped deletion endpoint and UI; retained success feedback; accessible history table with incremental rows |
| Units | Health/progress/setup did not consistently honor the selected units | Shared conversion helpers and consistent kg/lb, cm/in display/input handling |
| Tasks | Existing API capabilities were missing from the UI; empty completion requests produced 500 | Task description/duration/editing, list rename, preserved unchanged timestamps, and invalid-body 400 handling |
| Reminders | A stale poll could restore an acknowledged reminder | Revision/acknowledgement guards, non-overlapping polling, retry/error state, explicit page-open behavior |
| Performance | Dashboard loaded every task list's tasks; frontend shipped one large initial bundle | Single aggregate task-summary query; lazy pages/chart chunk; memoized chart capped at 500 displayed points |
| UI resilience/accessibility | Missing render recovery, weak mobile keyboard behavior, tiny/low-contrast text and unlabeled controls | Error boundaries, mobile focus trap/Escape/focus restoration/inert background, focus outlines, readable muted text, labels and semantic table |
| Dependencies | Audit identified vulnerable transitive `shell-quote` and `source-map-js` versions | Updated the lockfile; explicit compatible `shell-quote` override; clean dependency audit and reproducible `npm ci` |
| Validation/deployment docs | No automated quality gate; README referenced nonexistent `schema.sql` and a backend ZIP patch | ESLint, API/service/frontend regression tests, browser/accessibility tests, production smoke check, CI workflow, corrected setup/deployment/manual database guides |

## SQL and database work deliberately left manual

**No `.sql` file was modified or executed.** No live database was migrated,
seeded, reset, or provisioned. The three project SQL files remain byte-identical
to the original branch. Their SHA-256 checksums are:

| File | SHA-256 |
| --- | --- |
| `db/db-init/init.sql` | `c6bcbb36c3cd591c0ccba76c87645bd27add3eb06a8c32f03966fe4d51c51f62` |
| `db/db-init/001_update_database.sql` | `b3a3f4f2fa4eeff3f956d6d239590974a0db0086056f82b3ecd1509e139b15f0` |
| `db/db-init/002_add_nutrition_logs.sql` | `d5dcfdf8dd6908a4facba74be84044d8d1da6a0345f16fd2b68c41129f423387` |

The original initialization SQL still contains a committed credential and broad
wildcard-host account provisioning. Its existence is confirmed; whether that
credential is active in any database is unknown. Before deployment, manually
replace/remove that provisioning block, rotate any used/exposed credential,
provision a least-privilege app account, and review/apply missing schema changes.
Also review redundant email uniqueness and legacy rows without valid login
credentials. Exact steps and model limitations are in
[MANUAL_DATABASE.md](MANUAL_DATABASE.md). No secret values appear in this report.

## Verification evidence

Run all checks from the repository root. Results below distinguish local/CI
verification from external services that were unavailable. The full pipeline
passed for application commit `925e94a03a4993e96e7cad9781657eba5878ede4` in
[GitHub Actions run 37672592173](https://github.com/mohammedfaizaanriyaz/projects/actions/runs/37672592173).
Require the same workflow to pass for the final release commit, including the
subsequent small menu-closing and record-label corrections.

| Check | Command | Result and limits |
| --- | --- | --- |
| Reproducible dependencies | `npm ci --no-fund` | Passed; lockfile and manifests resolve together |
| Installed dependency graph | `npm ls --depth=0` | Passed; no missing/conflicting direct packages reported |
| Dependency advisories | `npm audit --json` | Zero vulnerabilities reported at verification time; not a guarantee against undisclosed issues |
| Lint | `npm run lint` | Passed with zero warnings |
| Backend tests | `npm run test -w backend` | 21 tests passed: API/auth/ownership/errors/dates, schema-column compatibility, provider handling/cache/portions, transaction commit/rollback; storage and USDA are mocked |
| Frontend tests | `npm run test -w frontend` | 9 tests passed: selection/date races, refresh continuity, failed logout, stale 401s, request contract/timestamps, reminder acknowledgement races |
| Production build | `npm run build` | Passed; lazy chunks replace the original oversized single bundle; initial entry approximately 262 kB before compression |
| Production process/HTTP | `npm run smoke:production` | Passed: actual server entry point, HTML/assets, API errors, security headers, readiness 503 when DB is unavailable, liveness 200, graceful SIGTERM; uses deliberately unreachable test-only DB settings |
| Browser flows/accessibility | `npm run test:e2e` | All 7 tests passed in Chromium on GitHub Actions: session refresh/logout, all 14 routes at desktop/mobile widths, mobile keyboard focus/Escape, weight save/delete, unit preferences, task editing/list renaming, and nutrition calculation/logging. All 14 desktop routes passed automated WCAG 2 A/AA and 2.1 AA axe checks. Database/USDA adapters are test-only mocks |
| Visual review | CI screenshots at 1440 px and 375 px | Reviewed dashboard, tasks, nutrition, mobile menu, and settings. No horizontal overflow in the tested routes. Menu focus and closing transitions were corrected; existing design preserved. This is not a substitute for real-device/staging acceptance |
| Whitespace/diff | `git diff --check` | Passed |
| SQL preservation | SHA-256 comparison against original snapshot | All three project SQL files unchanged |
| Live database | `npm run check:db -w backend` | Not run against a real database: no authorized runtime credentials/instance available. Read-only schema probes were tested against the committed SQL definitions |
| Live USDA | Staging search/calculation | Not verified with a real API key; no key was available |
| Docker image | `docker build -t vyra:ci .` | Passed in GitHub Actions, including production-only backend dependency installation and frontend build; no local Docker daemon was available |
| Hosting | HTTPS staging acceptance | Not performed: no production host, domain/TLS setup, or runtime secrets were supplied |

An npm warning about the execution environment's `http-proxy` setting is not a
repository configuration error. The local Chromium binary terminated with
SIGTRAP/SIGSEGV before page creation, so browser evidence comes from the working
GitHub Actions runner. There is no TypeScript project, so no separate type-check
result is claimed. No real MariaDB transaction, real USDA, load test, or
deployed-infrastructure success is implied by the mocked checks.

## Security, performance, and maintainability

The existing parameterized SQL, server-side ownership checks, bcrypt hashing,
transactional profile creation/update, health calculation guards, and unknown
nutrition coverage were retained. Account/profile data stays behind cookie
authentication. React escapes user-visible text; there are no dynamic HTML
injection features or file-upload endpoints. CORS does not accept arbitrary
origins; write requests require browser preflight protection. Only server code
uses database/JWT/USDA secrets. TLS to a remote database verifies certificates.

The application does not implement server-side JWT revocation/password recovery,
email verification, scheduled push/email delivery, or persisted recipes. These
are explicit product/infrastructure boundaries, not features silently promised
by the UI. Stateless session tokens expire after seven days; signing-key rotation
invalidates them. If stronger identity lifecycle requirements are adopted, plan
the corresponding database and external-service work before rollout.

Rate limits, USDA cache, and quota are bounded but per process. Horizontal scaling
needs shared controls and a connection budget. Weight history is still fetched
in full, although table rendering is incremental and the chart displays at most
500 recent records. Review server pagination/aggregation if real usage produces
large histories; no large-dataset benchmark was available. Google Fonts are an
optional external asset request with system-font fallbacks. The app requires a
modern browser for features including `inert` and abort signals.

The app/service split, explicit error status handling, smaller API client boundary,
shared unit/date helpers, focused tests, and reproducible build make the existing
code easier to maintain. Broad formatting-only rewrites and a framework/ORM
migration were intentionally avoided.

## Release order and remaining manual gates

1. Review the final code and passing CI results; the automated browser suite and
   screenshot review are complete. Retain the workflow as a release gate.
2. Rotate any used committed/shared credentials and prepare MariaDB manually
   using the database guide, including a restore-tested backup.
3. Supply real server-only secrets, verify `check:db`, and configure the chosen
   native or container runtime with a private database connection.
4. Configure the exact HTTPS origin, Caddy/proxy trust, DNS, and firewall.
5. Exercise registration/login, profile and record CRUD, tasks/reminders, and
   real USDA nutrition end to end on staging; confirm isolation between accounts.
6. Verify monitoring, backup restoration, restart/health behavior, then deploy
   the reviewed release. No production deployment was performed by this work.

Use [DEPLOYMENT.md](DEPLOYMENT.md) for exact build/start/native/Docker commands,
the full environment table, and the staging checklist.
