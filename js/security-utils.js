/* ============================================================
   IRONFORGE GYM — Security utilities (DOM-free, unit-testable)
   Loaded before app.js. Attaches helpers to window in the
   browser and exports via CommonJS for the Node test runner.

   IMPORTANT SECURITY NOTE
   -----------------------
   This site is fully static: there is no server, so NOTHING
   here can provide real access control. The admin passcode
   module only gates the *local dashboard UI* (the dashboard
   shows data stored in this browser's localStorage). It exists
   to stop the previous design — a plaintext password shipped to
   every visitor and logged to the console — from being reused,
   and to add friction (hashing + lockout) on shared computers.
   For genuine admin security you need a server-side backend;
   see SECURITY.md.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- Output encoding ---------- */

  // Escape user-supplied values before any HTML string interpolation.
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---------- Input validation ---------- */

  // Coerce any value to a bounded, trimmed string.
  function clampText(value, maxLen) {
    var max = typeof maxLen === 'number' && maxLen > 0 ? Math.floor(maxLen) : 200;
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  // Pragmatic email check: no whitespace/control chars, one '@',
  // local part <= 64 chars, dot-separated labels, total <= 254.
  var EMAIL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
  function isValidEmail(value) {
    var v = String(value == null ? '' : value).trim();
    if (!v || v.length > 254 || /[\s<>"']/.test(v)) return false;
    var at = v.indexOf('@');
    if (at < 1 || at > 64 || v.indexOf('@', at + 1) !== -1) return false;
    return EMAIL_RE.test(v);
  }

  // Phone: allow digits and common separators only; 7..15 digits total.
  var PHONE_ALLOWED = /^[0-9+()\-. ]+$/;
  function isValidPhone(value) {
    var v = String(value == null ? '' : value).trim();
    if (!v || v.length > 24 || !PHONE_ALLOWED.test(v)) return false;
    var digits = v.replace(/[^0-9]/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  /* ---------- Uploaded-image hardening ---------- */

  // Only raster image data URLs are accepted. SVG is deliberately
  // excluded (it can embed script when handled outside <img>).
  var DATA_URL_RE = /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
  var MAX_DATA_URL_LEN = 8 * 1024 * 1024; // ~6 MB binary as base64
  function isValidImageDataUrl(value) {
    var v = String(value == null ? '' : value);
    if (!v || v.length > MAX_DATA_URL_LEN) return false;
    return DATA_URL_RE.test(v);
  }

  // Magic-byte sniffing — never trust file.name or file.type alone.
  function sniffImageType(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : null;
    if (!b) return null;
    var len = b.length;
    if (len >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
        b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
    if (len >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
    if (len >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
       (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return 'gif';
    if (len >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
    return null;
  }

  /* ---------- Admin passcode module ---------- */
  /* PBKDF2-HMAC-SHA256 via WebCrypto (a standard primitive — not
     custom cryptography). The passcode itself is NEVER stored: only
     a random per-install salt plus the derived 256-bit verifier. */

  var PBKDF2_ITERATIONS = 310000; // OWASP guidance for PBKDF2-HMAC-SHA256
  var MIN_PASSCODE = 8;
  var MAX_PASSCODE = 128;
  var MAX_ATTEMPTS = 5;
  var BASE_LOCK_MS = 30 * 1000;
  var MAX_LOCK_MS = 15 * 60 * 1000;

  // Previously published default credential — permanently rejected
  // so the leaked secret cannot simply be re-provisioned.
  var LEGACY_LEAKED_PASSCODE = 'ironforge2024';

  function hasWebCrypto() {
    return !!(root.crypto && root.crypto.subtle &&
              root.crypto.getRandomValues && root.TextEncoder &&
              root.btoa && root.atob);
  }

  function bytesToB64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return root.btoa(s);
  }

  function b64ToBytes(b64) {
    var s = root.atob(b64);
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  // Constant-time comparison of equal-length secrets.
  function timingSafeEqual(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
    var diff = a.length ^ b.length;
    var n = Math.max(a.length, b.length);
    for (var i = 0; i < n; i++) {
      diff |= (a[i % a.length] ^ b[i % b.length]);
    }
    return diff === 0;
  }

  function getMembershipStatus(nextDueDate) {
    var due = nextDueDate == null || nextDueDate === '' ? null : new Date(nextDueDate);
    if (!(due instanceof Date) || Number.isNaN(due.getTime())) {
      return { state: 'inactive', label: 'Unknown', daysLeft: 0, message: 'Membership status unavailable.' };
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    var diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) {
      return { state: 'overdue', label: 'Overdue', daysLeft: diffDays, message: 'Payment is overdue.' };
    }
    if (diffDays <= 7) {
      return { state: 'dueSoon', label: 'Due soon', daysLeft: diffDays, message: 'Payment is due soon.' };
    }
    return { state: 'active', label: 'Active', daysLeft: diffDays, message: 'Membership is active.' };
  }

  function createPaymentReminderText(planName, amount, dueDate) {
    var plan = String(planName || 'Membership');
    var value = Number(amount);
    var amtText = Number.isFinite(value) ? '₹' + value.toLocaleString('en-IN') : 'your membership fee';
    var dateText = dueDate ? String(dueDate) : 'your next due date';
    return 'Reminder: your ' + plan + ' membership payment of ' + amtText + ' is due on ' + dateText + '. Please pay before the due date.';
  }

  function validatePasscodeFormat(passcode) {
    var p = String(passcode == null ? '' : passcode);
    if (p.length < MIN_PASSCODE) return 'Passcode must be at least ' + MIN_PASSCODE + ' characters.';
    if (p.length > MAX_PASSCODE) return 'Passcode must be at most ' + MAX_PASSCODE + ' characters.';
    if (/^\s|\s$/.test(p)) return 'Passcode must not start or end with spaces.';
    if (p === LEGACY_LEAKED_PASSCODE) return 'That passcode was previously leaked publicly — choose a new one.';
    return null;
  }

  function createAdminAuth(storage, options) {
    var store = storage;
    var opts = options || {};
    var VERIFIER_KEY = opts.verifierKey || 'ig_admin_verifier';
    var LOCK_KEY = opts.lockKey || 'ig_admin_lock';
    var iterations = opts.iterations || PBKDF2_ITERATIONS;

    function readJson(key, fallback) {
      try {
        var raw = store.getItem(key);
        if (!raw) return fallback;
        var parsed = JSON.parse(raw);
        return parsed == null ? fallback : parsed;
      } catch (err) {
        return fallback;
      }
    }

    function writeJson(key, value) {
      try {
        store.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    }

    function derive(passcode, saltBytes, iterCount) {
      var enc = new root.TextEncoder();
      return root.crypto.subtle
        .importKey('raw', enc.encode(String(passcode)), 'PBKDF2', false, ['deriveBits'])
        .then(function (key) {
          return root.crypto.subtle.deriveBits(
            { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: iterCount },
            key, 256
          );
        })
        .then(function (bits) { return new Uint8Array(bits); });
    }

    function isProvisioned() {
      var v = readJson(VERIFIER_KEY, null);
      return !!(v && v.v === 1 && v.saltB64 && v.hashB64 && typeof v.iterations === 'number');
    }

    function getVerifier() {
      return isProvisioned() ? readJson(VERIFIER_KEY, null) : null;
    }

    function provision(passcode) {
      if (!hasWebCrypto()) {
        return Promise.reject(new Error('Secure crypto is unavailable in this browser. Serve the site over HTTPS (or localhost) and use a modern browser.'));
      }
      var problem = validatePasscodeFormat(passcode);
      if (problem) return Promise.reject(new Error(problem));
      var salt = new Uint8Array(16);
      root.crypto.getRandomValues(salt);
      return derive(passcode, salt, iterations).then(function (hash) {
        var record = {
          v: 1,
          alg: 'PBKDF2-SHA256',
          iterations: iterations,
          saltB64: bytesToB64(salt),
          hashB64: bytesToB64(hash),
          created: new Date().toISOString()
        };
        if (!writeJson(VERIFIER_KEY, record)) {
          throw new Error('Could not store the passcode verifier (storage full or blocked).');
        }
        clearLock();
        return true;
      });
    }

    function getLockState() {
      var lock = readJson(LOCK_KEY, { attempts: 0, lockedUntil: 0 });
      var now = Date.now();
      if (lock && typeof lock.lockedUntil === 'number' && lock.lockedUntil > now) {
        return { locked: true, retryAfterMs: lock.lockedUntil - now, attempts: lock.attempts || 0 };
      }
      return { locked: false, retryAfterMs: 0, attempts: (lock && lock.attempts) || 0 };
    }

    function clearLock() {
      try { store.removeItem(LOCK_KEY); } catch (err) { /* ignore */ }
    }

    // Verify a passcode attempt, enforcing the lockout policy.
    function verify(passcode) {
      var state = getLockState();
      if (state.locked) {
        return Promise.resolve({ ok: false, locked: true, retryAfterMs: state.retryAfterMs });
      }
      var verifier = getVerifier();
      if (!verifier) {
        return Promise.resolve({ ok: false, provisionRequired: true });
      }
      return derive(passcode == null ? '' : passcode, b64ToBytes(verifier.saltB64), verifier.iterations)
        .then(function (hash) {
          var expected = b64ToBytes(verifier.hashB64);
          if (timingSafeEqual(hash, expected)) {
            clearLock();
            return { ok: true, locked: false };
          }
          // Record the failure and possibly escalate the lockout.
          var lock = readJson(LOCK_KEY, { attempts: 0, lockedUntil: 0 });
          var attempts = (lock.attempts || 0) + 1;
          var next = { attempts: attempts, lockedUntil: lock.lockedUntil || 0 };
          if (attempts > 0 && attempts % MAX_ATTEMPTS === 0) {
            var round = attempts / MAX_ATTEMPTS;
            var ms = Math.min(BASE_LOCK_MS * Math.pow(2, round - 1), MAX_LOCK_MS);
            next.lockedUntil = Date.now() + ms;
          }
          writeJson(LOCK_KEY, next);
          var after = getLockState();
          return { ok: false, locked: after.locked, retryAfterMs: after.retryAfterMs, attemptsRemaining: Math.max(0, MAX_ATTEMPTS - (attempts % MAX_ATTEMPTS)) };
        });
    }

    function change(current, next) {
      return verify(current).then(function (result) {
        if (!result.ok) return result;
        return provision(next).then(function () {
          return { ok: true, changed: true };
        });
      });
    }

    // Removes the verifier and lockout state only. Callers that want
    // a full "forgot passcode" reset must also wipe dashboard data.
    function reset() {
      try { store.removeItem(VERIFIER_KEY); } catch (err) { /* ignore */ }
      clearLock();
    }

    return {
      provision: provision,
      verify: verify,
      change: change,
      reset: reset,
      isProvisioned: isProvisioned,
      getVerifier: getVerifier,
      getLockState: getLockState,
      clearLock: clearLock,
      policy: {
        min: MIN_PASSCODE,
        max: MAX_PASSCODE,
        maxAttempts: MAX_ATTEMPTS,
        baseLockMs: BASE_LOCK_MS,
        maxLockMs: MAX_LOCK_MS,
        pbkdf2Iterations: iterations
      }
    };
  }

  /* ---------- Public API ---------- */

  var api = {
    escapeHtml: escapeHtml,
    clampText: clampText,
    isValidEmail: isValidEmail,
    isValidPhone: isValidPhone,
    isValidImageDataUrl: isValidImageDataUrl,
    sniffImageType: sniffImageType,
    timingSafeEqual: timingSafeEqual,
    getMembershipStatus: getMembershipStatus,
    createPaymentReminderText: createPaymentReminderText,
    hasWebCrypto: hasWebCrypto,
    createAdminAuth: createAdminAuth
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    // Browser: expose both the namespace and flat globals so app.js
    // keeps its original call style (escapeHtml(...), etc.).
    for (var k in api) {
      if (Object.prototype.hasOwnProperty.call(api, k)) root[k] = api[k];
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

