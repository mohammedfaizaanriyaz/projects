# VYRA — health and routines

VYRA combines account-scoped task lists and reminders with multiple health
profiles, body measurements, weight history, and daily USDA nutrition logs.
The `new-ui` branch contains the connected React interface.

## Architecture

- React 19, Vite 8, Lucide icons, and Recharts; hash-based page navigation.
- Express 5 on Node 24, parameterized MariaDB queries, and explicit ownership
  checks on user/profile data. There is no ORM or automatic migration system.
- bcrypt password hashes and seven-day HS256 JWT sessions in HttpOnly cookies.
  Production cookies require HTTPS. API writes require `X-Vyra-Request: 1`
  and browser origins are restricted to the configured UI origin.
- USDA FoodData Central calls run only on the backend, with bounded caching,
  concurrency, timeouts, and request quotas. Missing nutrients remain unknown.
- Production serves the built frontend and API from one Express process behind
  an HTTPS reverse proxy. Local development uses Vite's `/api` proxy.

A user signs in, selects a profile, and requests its measurements, weight
history, and daily nutrition. Express validates the session and ownership before
reading or updating MariaDB. Nutrition search/calculation additionally queries
USDA. Task lists belong to the signed-in account, independently of the selected
health profile. The UI keeps profile/date requests separate and ignores stale
responses after a selection or account change.

## Local development

Use Node 24 and run dependency commands from the repository root:

```bash
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
chmod 600 backend/.env
```

Fill in your real database credentials, a newly generated random `JWT_SECRET`,
and your own USDA key in `backend/.env`. See the complete environment reference
in [Deployment](docs/DEPLOYMENT.md). Keep frontend `VITE_API_URL` empty.

**Prepare MariaDB manually first:** follow
[Manual database preparation](docs/MANUAL_DATABASE.md). The original SQL contains
an unsafe account-provisioning block; do not blindly import it. No SQL file was
modified by the application preparation work, and startup never migrates data.

```bash
npm run check:db -w backend
npm run dev
```

Open `http://localhost:5173`. If Vite chooses another port or hostname, update
`FRONTEND_ORIGIN` to that exact origin and restart the backend. The backend uses
port 5000 by default. Do not put database passwords or API keys in frontend files.

## Verification

```bash
npm run check
npm run smoke:production
npm audit --audit-level=high
npx playwright install --with-deps chromium
npm run test:e2e
```

`check` runs ESLint, backend API/validation tests, frontend regression tests, and
the production build. API tests mock storage; browser tests run real Express
routes with test-only memory storage and mock USDA data. They never migrate or
seed a database. Live MariaDB/USDA staging acceptance is a separate deployment
requirement. JavaScript is used throughout; there is no TypeScript check.

## Production

```bash
npm run build
npm start
```

Those commands require the documented production environment, a prepared
MariaDB database, and the built frontend. They do not configure HTTPS or the
host. Follow [Deployment](docs/DEPLOYMENT.md) for complete native Linux/Caddy and
Docker instructions, environment settings, release gates, and staging checks.
`/api/live` is process liveness; `/api/health` also checks database/schema readiness.

See [Production review](docs/PRODUCTION_REVIEW.md) for findings, implemented
changes, verification evidence, and remaining manual work.

## Feature boundaries

- Measurements edits the current profile; historical measurements are not shown.
- Weight history supports adding and deleting records, with date and unit checks.
- Meal Builder calculates meals; it does not persist saved recipes.
- Reminders poll while their page is open; no background email/push worker exists.
- Unit preferences are local to this browser; authentication is never a stored
  user ID in localStorage.
