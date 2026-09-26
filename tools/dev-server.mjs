#!/usr/bin/env node
/* Minimal static file server for local development / manual testing.
 *
 * Security properties (do not weaken):
 *   - Binds to 127.0.0.1 only — never expose a dev server to a network.
 *   - Serves ONLY whitelisted project files; no directory listing,
 *     no path traversal (any request for an unlisted file => 404).
 *   - Explicit Content-Type map; unknown types are never served.
 *   - Basic security headers to mirror a hardened deployment.
 *
 * Usage: npm run serve   (then open http://127.0.0.1:8080)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const HOST = '127.0.0.1'; // loopback only

const ALLOWED_FILES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/js/security-utils.js', [join('js', 'security-utils.js'), 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    // Exact-match lookup against the whitelist. Convert decoded backslashes
    // to forward slashes so crafted "\..\..\" paths can never confuse the
    // lookup — anything not exactly whitelisted is a 404.
    const requested = decodeURIComponent(url.pathname).replace(/\\/g, '/');
    const entry = ALLOWED_FILES.get(requested);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      res.end('Not found');
      return;
    }
    const [relPath, contentType] = entry;
    const absPath = normalize(join(ROOT, relPath));
    if (!absPath.startsWith(ROOT)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      res.end('Forbidden');
      return;
    }
    const body = await readFile(absPath);
    res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': body.length, ...SECURITY_HEADERS });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
    res.end('Internal error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`IRONFORGE dev server: http://${HOST}:${PORT} (loopback only — do not expose)`);
});
