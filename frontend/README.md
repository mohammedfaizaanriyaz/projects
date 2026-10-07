# VYRA frontend

React 19/Vite 8 interface for the Express/MariaDB application in this repository.
It uses hash routes (`/#/dashboard`, `/#/weight`, and the other navigation pages),
so the production server only needs to serve the application at `/`.

Run dependency installation and release commands from the repository root:

```bash
npm ci
npm run dev
npm run build
npm run test -w frontend
```

Development uses a Vite proxy for `/api` to `http://127.0.0.1:5000`. Set
`DEV_BACKEND_URL` only when your local backend uses another address. Keep
`VITE_API_URL` empty; production builds reject an external API base because
Express serves both UI and API on the same HTTPS origin. Never put a secret in
`VITE_*` variables: they are browser-visible.

The API client sends cookies and the write-protection header, handles timeouts
and session expiry, and rejects unreadable success responses. AppContext owns
account/profile selection, weight data, and the selected nutrition date. Pages
load lazily; stale responses cannot replace data for a newer selection.

No external backend ZIP patch is required. Database preparation is manual:
read [Manual database preparation](../docs/MANUAL_DATABASE.md), then follow the
[root README](../README.md) and [Deployment](../docs/DEPLOYMENT.md).
