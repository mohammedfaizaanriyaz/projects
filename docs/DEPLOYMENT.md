# Deploy VYRA

The supported production topology is one Node 24 application serving the built
React UI and `/api` on the **same HTTPS origin**, with MariaDB on a private
connection and Caddy terminating TLS. Hash routes such as `/#/weight` do not
require a separate SPA rewrite rule. Do not use Vite's development or preview
server as the production server.

## Release checks

Install a supported Node 24 release, npm, Git, and (for the native option) Caddy
on the deployment/build host. The repository is private; use your own authorized
GitHub authentication. Run as your normal deployment user:

```bash
git clone --branch new-ui --single-branch https://github.com/mohammedfaizaanriyaz/projects.git vyra
cd vyra
node --version
npm ci
npm run check
npm run smoke:production
npm audit --audit-level=high
npx playwright install --with-deps chromium
npm run test:e2e
```

`check` runs lint, backend tests, frontend tests, and the production build. E2E
tests start the real Express routes with **test-only in-memory storage** and
mock USDA responses, not your database. They exercise API/cookie/UI integration,
all main page routes, mobile navigation, accessibility, weight, tasks, and
nutrition. Also complete the real-service staging checks below. CI runs the same
checks and builds the container; require it to pass for the release commit.

## Configure secrets and prepare MariaDB

Follow [MANUAL_DATABASE.md](MANUAL_DATABASE.md) first. Do not blindly execute the
existing SQL initialization script. No application command performs a migration.

```bash
cp backend/.env.example backend/.env
chmod 600 backend/.env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
${EDITOR:-nano} backend/.env
```

Put the generated value in `JWT_SECRET`; keep it private. Set real database
credentials and your own USDA FoodData Central API key. Obtain the key through
[USDA's official signup](https://fdc.nal.usda.gov/api-key-signup.html). Do not use
a demo key for production. No secret belongs in a `VITE_*` variable or Git.

For a native app behind exactly one local Caddy proxy, use:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=5000
FRONTEND_ORIGIN=https://app.example.com
TRUST_PROXY_HOPS=1
```

Replace `app.example.com` with your real domain. Set `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, and `DB_NAME` to your manually prepared MariaDB
connection. Remote databases should use `DB_SSL=true` with the correct CA.

Leave frontend `VITE_API_URL` unset or empty; remove an old non-empty value from
any frontend environment file before building. There is no production frontend
secret configuration. Then check the database without writing to it:

```bash
npm run check:db -w backend
```

## Option A: native Linux service

The supplied service expects `/usr/bin/node` to be Node 24. Check that path, or
update the service to the absolute path of your system-wide Node installation;
the hardened service cannot use a Node binary in your home directory.

These are **first-install** commands. If the `vyra` service user already exists,
skip `useradd`; if `/srv/vyra` already holds a release, use your normal reviewed
release/rollback procedure instead of copying over a running installation.

```bash
sudo useradd --system --user-group --home-dir /srv/vyra --shell /usr/sbin/nologin vyra
sudo install -d -o root -g vyra -m 750 /srv/vyra
sudo cp -a package.json package-lock.json node_modules backend frontend /srv/vyra/
sudo chown -R root:vyra /srv/vyra
sudo chmod -R g+rX,o-rwx /srv/vyra
sudo chmod 640 /srv/vyra/backend/.env
sudo install -m 644 deploy/vyra.service /etc/systemd/system/vyra.service
sudo systemctl daemon-reload
sudo systemctl enable --now vyra
sudo systemctl status vyra --no-pager
curl --fail http://127.0.0.1:5000/api/live
curl --fail http://127.0.0.1:5000/api/health
```

Point the domain's DNS to the host and allow inbound TCP 80/443 for Caddy. Keep
5000 and 3306 private. Edit `deploy/Caddyfile` to your domain. The install command
below is for a **dedicated host**; if Caddy already serves other sites, merge this
site block into its existing configuration rather than overwriting it.

```bash
${EDITOR:-nano} deploy/Caddyfile
sudo caddy validate --config deploy/Caddyfile --adapter caddyfile
sudo install -m 644 deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl --fail https://app.example.com/api/health
```

Caddy obtains/renews TLS certificates when DNS and network access are correct.
Use the HTTPS URL for login; production cookies are `Secure`. Do not loosen that
setting to test login over plain HTTP. Logs: `sudo journalctl -u vyra -f`.

## Option B: Docker application, Caddy on the host

Prepare the same `backend/.env`, but set `HOST=0.0.0.0`, `PORT=5000`, and a database
host reachable **from the container**. Keep `TRUST_PROXY_HOPS=1` when the only
proxy is the host Caddy. TLS CA paths must exist inside the container; bind-mount
the certificate read-only if needed. Docker's env file syntax is literal: do not
wrap values in quotes as you might in a shell.

```bash
docker build -t vyra:new-ui .
docker run -d --name vyra --restart unless-stopped --init \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --cap-drop ALL --security-opt no-new-privileges \
  --env-file backend/.env \
  -p 127.0.0.1:5000:5000 \
  vyra:new-ui
docker logs --tail 100 vyra
docker inspect --format '{{.State.Health.Status}}' vyra
curl --fail http://127.0.0.1:5000/api/health
```

Then configure host Caddy as above. The image runs as the unprivileged `node`
user, excludes environment files/SQL/tests, and serves the production frontend.
It does not contain or initialize MariaDB. Choose this option or the native
service; do not bind both to port 5000. An unhealthy container needs investigation;
Docker's restart policy alone does not restart a still-running unhealthy process.

## Required staging acceptance and operation

On the actual HTTPS staging deployment, using a dedicated test account:

1. Register, log out, log in, and refresh. Confirm secure cookies, clear errors
   on invalid input, and no browser console/network errors.
2. Create a profile, update measurements, add/delete a weight, switch profiles,
   and verify that another account cannot access those records.
3. Create/rename/delete a task list; create/edit/complete tasks; verify reminders
   and acknowledgement. A reminder is an in-app item, not a push/email alert.
4. Search with the real USDA key; calculate a known portion; add/delete a daily
   food log; confirm date, quantity, unknown nutrients, and totals.
5. Test mobile navigation, units, all major routes, error/retry states, and
   reconnect behavior. Confirm `/api/health` is 200 and no secrets are served.
6. Verify backup restoration, database connection/TLS, DNS/TLS renewal,
   monitoring/alerts, and service restart/graceful shutdown before inviting users.

Keep request logs and backups access-controlled. Logs contain request metadata,
not bodies, cookies, passwords, API keys, or SQL parameters. Rate limits and USDA
cache/quota are per process; run a single instance initially. Multiple replicas
need a shared limiter/cache or equivalent gateway controls and a reviewed total
database connection budget. The code does not provide a password-reset or email
verification service; if those become product requirements, design the identity
flow and its database/email infrastructure before advertising those capabilities.

## Environment reference

The server and `check:db` load `backend/.env` regardless of the working directory;
already-set process variables take precedence. The templates contain no usable
credentials. Test-only flags do not configure production.

| Variable | Requirement/default | Used by |
| --- | --- | --- |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Required, no fallback credentials | Validation and MariaDB pool |
| `DB_PORT` | Optional, `3306` | MariaDB TCP connection |
| `DB_CONNECTION_LIMIT` | Optional, `5`; range 1–100 | MariaDB pool size |
| `DB_SSL` | Optional, `false`; set `true` for remote TLS | MariaDB certificate-verified TLS |
| `DB_SSL_CA` | Optional certificate file path; requires SSL | MariaDB CA trust |
| `JWT_SECRET` | Required, random, at least 32 bytes | HS256 token signing/verification |
| `USDA_API_KEY` | Required, server-only | FoodData Central requests |
| `NODE_ENV` | Optional `development`; production must be `production` | Validation, cookies, security headers, static build requirement |
| `FRONTEND_ORIGIN` | Development default `http://localhost:5173`; production requires exact HTTPS origin | Browser origin allowlist |
| `HOST` | Default `0.0.0.0`; template uses `127.0.0.1` | Server listener |
| `PORT` | Optional `5000` | Server listener and container healthcheck |
| `TRUST_PROXY_HOPS` | Optional `0`; exactly `1` behind the documented Caddy setup | Express client IP and rate limiting |
| `VITE_API_URL` | Empty/unset in production; browser-visible if used in development | Frontend API base and build guard |
| `DEV_BACKEND_URL` | Optional `http://127.0.0.1:5000`; development only | Vite `/api` proxy |
| `VYRA_E2E` | Test-only `1`, set by Playwright with `NODE_ENV=test` | Isolated HTTP test fixture |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Optional test-only browser override | Playwright launch configuration |
