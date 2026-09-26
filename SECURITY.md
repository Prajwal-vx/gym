# SECURITY.md

Security model, audit decisions, and remaining risks for this site.

## 1. Application model & trust boundaries

Fully static site — no server, no database, no runtime dependencies. Every
"attack surface" that requires a backend (SQLi, SSRF, CSRF, IDOR, command
injection, webhooks, payments) is structurally absent. The real boundaries are:

```
Visitor input → localStorage → rendered back into the admin dashboard
Uploaded file → FileReader data URL → <img> in admin photo grid
Third-party CDNs (fonts, icons, stock photos) → page integrity
```

All three are treated as untrusted (see fixes below).

## 2. Security decisions & rationale

### 2.1 The removed default admin password (was CRITICAL)
The original code shipped a plaintext password in `app.js`, compared
client-side, printed it to the browser console for every visitor, **and**
revealed it in the failure toast. Anyone could "become admin" instantly, and
the credential risked reuse elsewhere.

**Fix:** no credential ships in source anymore. The admin passcode is
provisioned on first use in a given browser and stored only as a
random-salted PBKDF2-SHA256 verifier (310k iterations, WebCrypto — no custom
crypto). Wrong attempts trigger exponential lockout. The previously leaked
default is on a permanent denylist.

**Honest limits:** client-side gating is *not* access control. The dashboard
only ever shows the current browser's `localStorage`, so there is nothing
cross-user to protect. Treat the passcode as anti-shoulder-surfing friction on
shared staff machines, nothing more.

### 2.2 Stored XSS via the admin photo grid (was HIGH)
Uploaded filenames were interpolated unescaped into `alt="${p.name}"` inside
an `innerHTML` template — a file named `"><img src=x onerror=...>.png`
executed attacker script in the dashboard. `p.src` was also unvalidated.

**Fix:** the photo grid is rebuilt exclusively with DOM APIs
(`createElement`/`textContent`/`setAttribute`) so attribute injection is
structurally impossible; `src` must pass a raster-image data-URL allowlist
(SVG deliberately excluded); uploads are verified by magic bytes (not
name/MIME), capped at 5 MB and 20 photos; quota errors are surfaced instead of
silently failing. Inquiries/trials were already escaped via `escapeHtml()` —
covered by regression tests.

### 2.3 Deceptive submission flow (business-logic finding)
Forms claimed "our team will contact you within 2 hours" while the data never
left the visitor's browser — the gym received nothing. Sensitive answers
(health conditions) also sat in `localStorage` indefinitely.

**Fix (within static constraints):** every form gained an explicit
"Send via WhatsApp" action that hands the validated submission to the gym's
number, so the promise is actually fulfillable. Local storage is capped (200
records/form) and "Reset local admin data" wipes it on request.
**Proper fix:** add a backend (see §4).

### 2.4 Hardening added
- **CSP** via `<meta>`: `default-src 'self'`, no `object`, no frames,
  `base-uri 'self'`, `form-action 'self'`, tight `img-src`
  (`self`, `data:`, Unsplash). Inline script/style remain allowed because the
  site's UI relies on inline event handlers; header-based CSP on the proxy
  should additionally set `frame-ancestors 'none'` (impossible in `<meta>`).
- **SRI** on the Font Awesome CDN asset (Google Fonts CSS cannot be pinned —
  dynamic per-UA response; acceptable: it is style/font only under CSP).
- **Input validation**: bounded lengths, email/phone allowlists (CRLF-safe),
  clamped every stored field, corrupted-`localStorage` fail-safe.
- **Cookie/session/sessionStorage**: N/A — the site holds no credentials.

## 3. Verified attack paths (regression-tested)

`npm test` covers: XSS payload escaping, email/phone injection
(including CRLF header-injection shapes), data-URL/SVG/JS-URI rejections,
magic-byte sniffing (PNG/JPEG/GIF/WebP accept, SVG/EXE reject), PBKDF2
provisioning (no plaintext at rest, unique salts, policy enforcement
including the leaked default), lockout semantics (correct passcode refused
while locked), change-passcode authorization, reset fail-safety, and
corrupted-storage resilience.

## 4. Remaining risks / manual actions

1. **No backend** — the structural limitation. For real lead capture and real
   admin security, add a small server-side endpoint (hosted form service,
   serverless function, or your own API) with server-side validation, rate
   limiting, spam protection (honeypot + delay), and an access-controlled
   admin area. The WhatsApp handoff is a stopgap, not a system of record.
2. **PII/health data in localStorage** — if the gym keeps using the local
   flow, disclose it on the page (privacy notice) and honor deletion requests
   (the "Reset local admin data" and browser clearing are the mechanisms).
3. **Rotate anything the old password touched.** The default was public in
   page source and git history — treat it as burned wherever it was reused.
4. **Deployment hardening** — apply `deploy/nginx.conf.example` (TLS, HSTS,
   header CSP with `frame-ancestors`, `nosniff`, `Permissions-Policy`), keep
   the origin private, and enable backups/monitoring at the host.
5. **Third-party availability** — fonts/icons/Unsplash load from CDNs;
   if availability matters, self-host these assets.
