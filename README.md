# IRONFORGE GYM — Static Site

Single-page marketing site for a gym. **Pure static**: vanilla HTML/CSS/JS, no backend, no database, no runtime dependencies.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (no framework, no build step) |
| Backend | None (static hosting only) |
| Database | None — "submissions" are stored in each visitor's browser `localStorage` |
| Auth | None server-side; admin dashboard is a local UI gate (see SECURITY.md) |
| Tests | Node built-in test runner (`node --test`), no test dependencies |

## Layout

```
index.html               Single-page markup, metadata, and CSP
404.html                 Custom not-found page
css/site.css             Responsive site and component styles
assets/favicon.svg       Site icon
js/app.js                Site UI, forms, modals, animation, and dashboard rendering
js/data-store.js         Browser persistence adapter and bounded record store
js/config.js             Public contact and WhatsApp settings
js/members.js            Member account and membership dashboard feature
js/security-utils.js     DOM-free security core (validation, image checks,
                         PBKDF2 admin passcode, member password hashing) — unit-tested
tests/security.test.mjs  Security regression tests
tools/dev-server.mjs     Loopback-only static server for local testing
deploy/nginx.conf.example Hardened reverse-proxy/TLS config for real deployment
SECURITY.md              Threat model, security decisions, remaining risks
```

## Run

```bash
npm run serve     # local server at http://127.0.0.1:8080 (loopback only)
```

or open `index.html` directly (all features work; `file://` is treated as a secure context by Chrome/Firefox, so WebCrypto is available).

## Test / check

```bash
npm test          # 22 security regression tests (node --test)
npm run check     # syntax-check both JS files
```

Dependency audit: the project declares **zero runtime/dev dependencies** (see `package.json`) — there is no supply-chain surface to audit. (`npm audit` on this machine fails with an environment-level `EALLOWSCRIPTS` policy error from the local npm configuration; it is unrelated to this project.)

## Forms & where submissions go

Because the site is static, **form data never leaves the visitor's browser by itself** — it is saved in that browser's `localStorage` (visible only in the admin dashboard of that same browser, capped at 200 records per form). Each form therefore also offers **"Send via WhatsApp"**, which opens a prefilled chat to the gym's public number. Update the public contact values in `js/config.js` for the live gym.

For real lead capture, replace `js/data-store.js` with an API adapter and point form
submissions at server routes. Keep route handlers, validation, and persistence on
the server; never put credentials in `js/config.js`. A scalable API can begin with
`POST /api/v1/inquiries`, `POST /api/v1/trials`, `POST /api/v1/messages`, and
`GET /api/v1/admin/...` routes behind server-side authentication and rate limits.

## Admin dashboard

The "Admin" link in the footer opens a **local dashboard** (inquiries, trial bookings, photos) that shows only the current browser's stored records:

- On first use it asks you to **create a passcode** (min 8 chars). The passcode is never stored — only a random-salted PBKDF2-SHA256 verifier (310,000 iterations) in that browser's `localStorage`.
- 5 wrong attempts lock access with exponential backoff (30s → 15 min max).
- "Change passcode" (requires current one) and "Forgot passcode" (wipes local admin data — there is deliberately no backdoor) are built in.
- The dashboard re-locks whenever the panel is closed.

> **This passcode is UI friction, not a security boundary.** There is no server to protect. Do not store real secrets behind it. See SECURITY.md.

## Deployment checklist

Use HTTPS + hardened reverse-proxy headers (see `deploy/nginx.conf.example`):

- TLS 1.2+ only, HTTP→HTTPS redirect, HSTS
- Header-based CSP (adds `frame-ancestors`, which `<meta>` cannot express)
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- No directory listing, no indexes, large-body limits
- Update the public contact values in `js/config.js`
