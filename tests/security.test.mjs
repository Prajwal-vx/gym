/* ============================================================
   IRONFORGE GYM — Security regression tests
   Run: npm test   (node --test, no external dependencies)

   Covers the security-critical helpers in js/security-utils.js:
   output encoding, input validation, image-upload hardening,
   and the admin passcode module (hashing, lockout, no-plaintext).
   ============================================================ */
import { createRequire } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const {
  escapeHtml,
  clampText,
  isValidEmail,
  isValidPhone,
  isValidImageDataUrl,
  sniffImageType,
  timingSafeEqual,
  getMembershipStatus,
  createPaymentReminderText,
  createAdminAuth,
} = require('../js/security-utils.js');

/* ---------- in-memory storage adapter for tests ---------- */
function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _dump: () => JSON.stringify([...map.entries()]),
  };
}

const PNG_BYTES = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const GIF_BYTES = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00]);
const WEBP_BYTES = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const SVG_TEXT = Uint8Array.from(Buffer.from('<svg onload="alert(1)">'));

/* ================= Output encoding (XSS) ================= */

test('escapeHtml neutralizes script/markup injection vectors', () => {
  const vectors = [
    '<img src=x onerror=alert(1)>',
    '</textarea><script>alert(1)</script>',
    '"><svg onload=alert(1)>',
    "javascript:alert('x')",
    '&<>"\'',
  ];
  for (const v of vectors) {
    const out = escapeHtml(v);
    assert.ok(!/[<>"]/.test(out), 'no raw <, >, or " may survive: ' + out);
    assert.ok(!/[<>]/.test(out), 'escaped output must not re-introduce markup');
  }
  // Re-escaping must double-encode '&' (correct &-first behavior), never
  // decode anything back to raw markup.
  assert.equal(escapeHtml('&lt;img&gt;'), '&amp;lt;img&amp;gt;');
});

test('escapeHtml handles null/undefined/numbers safely', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(42), '42');
});

/* ================= Input validation ================= */

test('clampText bounds length and trims', () => {
  assert.equal(clampText('   hi  ', 10), 'hi');

test('isValidEmail accepts legitimate addresses', () => {
  for (const good of ['a@b.co', 'user.name+tag@example.com', 'first_last@sub.domain.org']) {
    assert.equal(isValidEmail(good), true, good);
  }
});

test('isValidEmail rejects malicious/malformed input', () => {
  for (const bad of [
    '',
    'plain',
    'a@',
    '@b.com',
    'a@@b.com',
    'a b@c.com',           // whitespace
    'a@b c.com',           // whitespace in domain
    'a@b\nCc:victim@x.com',// header injection attempt
    'a@b\r\nBcc:x@y.z',    // CRLF injection
    '<script>@x.com',
    `a@${'x'.repeat(300)}.com`,
  ]) {
    assert.equal(isValidEmail(bad), false, JSON.stringify(bad));
  }
});

test('isValidPhone accepts realistic numbers', () => {
  for (const good of ['+91 98765 43210', '(555) 123-4567', '555-0100', '07700900461']) {
    assert.equal(isValidPhone(good), true, good);
  }
});

test('isValidPhone rejects injection and junk', () => {
  for (const bad of [
    '',
    '12345',                 // too few digits
    '"><img src=x onerror=alert(1)>',
    'phone\n<script>',
    'call me maybe',
    '+'.repeat(30),
    '9'.repeat(20),          // >15 digits
  ]) {
    assert.equal(isValidPhone(bad), false, JSON.stringify(bad));
  }
});

/* ================= Image upload hardening ================= */

test('isValidImageDataUrl allowlists raster images only', () => {
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
  const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  assert.equal(isValidImageDataUrl(png), true);
  assert.equal(isValidImageDataUrl(jpeg), true);
});

test('isValidImageDataUrl rejects XSS/HTML carriers', () => {
  for (const bad of [
    'data:image/svg+xml;base64,PHN2Zy8+',          // SVG (script-capable)
    'data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4=',
    'javascript:alert(1)',
    '"><img src=x onerror=alert(1)>',
    'https://evil.example/payload.png',             // remote URL
    'data:image/png,',                              // not base64
    '',
    null,
  ]) {
    assert.equal(isValidImageDataUrl(bad), false, JSON.stringify(bad));
  }
});

test('isValidImageDataUrl rejects oversized payloads', () => {
  const huge = 'data:image/png;base64,' + 'A'.repeat(9 * 1024 * 1024);
  assert.equal(isValidImageDataUrl(huge), false);
});

test('sniffImageType detects formats by magic bytes, not names', () => {
  assert.equal(sniffImageType(PNG_BYTES), 'png');
  assert.equal(sniffImageType(JPEG_BYTES), 'jpeg');
  assert.equal(sniffImageType(GIF_BYTES), 'gif');
  assert.equal(sniffImageType(WEBP_BYTES), 'webp');
});

test('sniffImageType rejects non-images even with image names/extensions', () => {
  assert.equal(sniffImageType(SVG_TEXT), null);
  assert.equal(sniffImageType(new TextEncoder().encode('<script>alert(1)</script>')), null);
  assert.equal(sniffImageType(null), null);
  assert.equal(sniffImageType(new Uint8Array(0)), null);
});

/* ================= timingSafeEqual ================= */

test('timingSafeEqual compares secrets correctly', () => {
  const a = new Uint8Array([1, 2, 3, 4]);
  assert.equal(timingSafeEqual(a, new Uint8Array([1, 2, 3, 4])), true);
  assert.equal(timingSafeEqual(a, new Uint8Array([1, 2, 3, 5])), false);
  assert.equal(timingSafeEqual(a, new Uint8Array([1, 2, 3])), false);
  assert.equal(timingSafeEqual(null, a), false);
});

test('membership status flags active, due soon, and overdue correctly', () => {
  const today = new Date();
  const dueSoon = new Date(today.getTime() + 4 * 86400000).toISOString().slice(0, 10);
  const overdue = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const active = new Date(today.getTime() + 20 * 86400000).toISOString().slice(0, 10);

  assert.equal(getMembershipStatus(dueSoon).state, 'dueSoon');
  assert.equal(getMembershipStatus(overdue).state, 'overdue');
  assert.equal(getMembershipStatus(active).state, 'active');
});

test('payment reminder text is useful and short', () => {
  const message = createPaymentReminderText('Elite', 2999, '2026-10-08');
  assert.match(message, /Elite/i);
  assert.match(message, /2999|₹/i);
  assert.ok(message.length < 220);
});

test('clampText bounds length and trims', () => {
  assert.equal(clampText('x'.repeat(500), 80).length, 80);
  assert.equal(clampText(null, 10), '');
});

/* ================= Admin passcode module ================= */

test('provision stores a salted PBKDF2 verifier — never the passcode', async () => {
  const storage = memoryStorage();
  const auth = createAdminAuth(storage, { iterations: 1000 }); // fast for tests
  await auth.provision('correct horse battery');
  assert.equal(auth.isProvisioned(), true);
  const dump = storage._dump();
  assert.ok(!dump.includes('correct horse battery'), 'passcode must never be stored');
  const verifier = auth.getVerifier();
  assert.equal(verifier.alg, 'PBKDF2-SHA256');
  assert.equal(verifier.iterations, 1000);
  const salt = Buffer.from(verifier.saltB64, 'base64');
  assert.equal(salt.length, 16, 'salt must be 16 random bytes');
  const hash = Buffer.from(verifier.hashB64, 'base64');
  assert.equal(hash.length, 32, 'verifier must be 256 bits');
});

test('provision generates a unique salt per install (no shared verifier)', async () => {
  const a = memoryStorage();
  const b = memoryStorage();
  await createAdminAuth(a, { iterations: 1000 }).provision('same-passcode-1');
  await createAdminAuth(b, { iterations: 1000 }).provision('same-passcode-1');
  assert.notEqual(a.getItem('ig_admin_verifier'), b.getItem('ig_admin_verifier'));
});

test('provision enforces policy (length, spaces, previously leaked default)', async () => {
  const auth = createAdminAuth(memoryStorage(), { iterations: 1000 });
  await assert.rejects(() => auth.provision('short'), /at least 8/);
  await assert.rejects(() => auth.provision('x'.repeat(200)), /at most 128/);
  await assert.rejects(() => auth.provision(' leading'), /spaces/);
  await assert.rejects(() => auth.provision('ironforge2024'), /leaked/);
});

test('verify accepts the correct passcode and rejects wrong ones', async () => {
  const auth = createAdminAuth(memoryStorage(), { iterations: 1000 });
  await auth.provision('S7rong-Passcode!');
  const ok = await auth.verify('S7rong-Passcode!');
  assert.equal(ok.ok, true);
  const bad = await auth.verify('wrong-passcode');
  assert.equal(bad.ok, false);
});

test('lockout: repeated failures lock the dashboard, correct passcode refused while locked', async () => {
  const auth = createAdminAuth(memoryStorage(), { iterations: 1000 });
  await auth.provision('S7rong-Passcode!');
  let last;
  for (let i = 0; i < 5; i++) {
    last = await auth.verify('totally-wrong');
  }
  assert.equal(last.ok, false);
  const state = auth.getLockState();
  assert.equal(state.locked, true, '5 failures must trigger lockout');
  assert.ok(state.retryAfterMs > 0);
  // Even the correct passcode must be refused while locked (throttling).
  const blocked = await auth.verify('S7rong-Passcode!');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.locked, true);
});

test('successful verification clears lockout state', async () => {
  const auth = createAdminAuth(memoryStorage(), { iterations: 1000 });
  await auth.provision('S7rong-Passcode!');
  await auth.verify('nope-1');
  await auth.verify('nope-2');
  const ok = await auth.verify('S7rong-Passcode!');
  assert.equal(ok.ok, true);
  assert.equal(auth.getLockState().locked, false);
  assert.equal(auth.getLockState().attempts, 0);
});

test('change() requires the current passcode', async () => {
  const auth = createAdminAuth(memoryStorage(), { iterations: 1000 });
  await auth.provision('old-passcode-9');
  const denied = await auth.change('wrong-current', 'new-passcode-1');
  assert.equal(denied.ok, false);
  const granted = await auth.change('old-passcode-9', 'new-passcode-1');
  assert.equal(granted.ok, true);
  assert.equal((await auth.verify('new-passcode-1')).ok, true);
  assert.equal((await auth.verify('old-passcode-9')).ok, false);
});

test('reset() removes the verifier (forgot-passcode path, fail-safe not backdoor)', async () => {
  const auth = createAdminAuth(memoryStorage(), { iterations: 1000 });
  await auth.provision('S7rong-Passcode!');
  auth.reset();
  assert.equal(auth.isProvisioned(), false);
  const result = await auth.verify('S7rong-Passcode!');
  assert.equal(result.ok, false);
  assert.equal(result.provisionRequired, true, 'site must require fresh provisioning after reset');
});

test('corrupted or tampered verifier storage fails safely', async () => {
  const storage = memoryStorage();
  storage.setItem('ig_admin_verifier', '{not json!!');
  const auth = createAdminAuth(storage, { iterations: 1000 });
  assert.equal(auth.isProvisioned(), false);
  const result = await auth.verify('anything');
  assert.equal(result.ok, false);
  assert.equal(result.provisionRequired, true);
});

  assert.equal(clampText(undefined, 10), '');
});
