/* ============================================================
   IRONFORGE GYM — JavaScript Application
   Features: Particles, Cursor, Scroll Reveal, Modals,
             Admin Panel, WhatsApp, Counter Animations
============================================================ */

/* ===== STORAGE KEY ===== */
const STORAGE = {
  inquiries: 'ig_inquiries',
  trials: 'ig_trials',
  messages: 'ig_messages',
  photos: 'ig_photos',
};

/* ===== LOADER ===== */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 900);
    }
  }, 2000);
});

/* ===== CUSTOM CURSOR ===== */
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let cursorX = 0, cursorY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  if (dot) {
    dot.style.left = cursorX + 'px';
    dot.style.top = cursorY + 'px';
  }
});

function animateRing() {
  if (!ring) return; // Exit if ring doesn't exist
  ringX += (cursorX - ringX) * 0.12;
  ringY += (cursorY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

/* ===== PARTICLES ===== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    const width = canvas?.width || window.innerWidth;
    const height = canvas?.height || window.innerHeight;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 2.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.color = Math.random() > 0.5 ? '#F77B00' : '#848E95';
    this.life = 0;
    this.maxLife = Math.random() * 200 + 100;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life++;
    const width = canvas?.width || window.innerWidth;
    const height = canvas?.height || window.innerHeight;
    if (this.life > this.maxLife || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
    }
  }
  draw() {
    if (!ctx) return;
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

if (canvas && ctx) {
  for (let i = 0; i < 80; i++) {
    particles.push(new Particle());
  }
}

function drawLines() {
  if (!ctx) return;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.globalAlpha = (1 - dist / 100) * 0.1;
        ctx.strokeStyle = '#F77B00';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

let particleAnimationId = null;

function animateParticles() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawLines();
  particleAnimationId = requestAnimationFrame(animateParticles);
}
if (canvas && ctx) {
  animateParticles();
}

/* ===== NAVBAR ===== */
const navbar = document.getElementById('navbar');
const backTop = document.getElementById('backTop');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Navbar
  if (navbar) {
    if (scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Back to top
  if (backTop) {
    if (scrollY > 400) {
      backTop.classList.add('visible');
    } else {
      backTop.classList.remove('visible');
    }
  }

  // Reveal elements
  revealOnScroll();

  // Counter
  triggerCounters();
});

/* ===== MOBILE MENU ===== */
function toggleMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger) hamburger.classList.toggle('active');
  if (navLinks) navLinks.classList.toggle('open');
}

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger) hamburger.classList.remove('active');
    if (navLinks) navLinks.classList.remove('open');
  });
});

/* ===== SCROLL REVEAL ===== */
function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  reveals.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('visible');
    }
  });
}
revealOnScroll();

/* ===== COUNTER ANIMATION ===== */
let countersTriggered = false;

function triggerCounters() {
  if (countersTriggered) return;
  const statsSection = document.querySelector('.hero-stats');
  if (!statsSection) return;
  const rect = statsSection.getBoundingClientRect();
  if (rect.top < window.innerHeight - 50) {
    countersTriggered = true;
    document.querySelectorAll('.stat-num').forEach(el => {
      const target = parseInt(el.dataset.target);
      if (!isNaN(target)) {
        animateCounter(el, 0, target, 2000);
      }
    });
  }
}

function animateCounter(el, start, end, duration) {
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = easeOutCubic(progress);
    el.textContent = Math.floor(eased * (end - start) + start).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ===== SMOOTH SCROLL ===== */
// NOTE: this was previously named `scrollTo`, which silently overwrote the
// native `window.scrollTo`. That broke the "back to top" button — its
// onclick calls window.scrollTo({top:0,...}), which was hitting this
// function instead and throwing (querySelector doesn't accept an object).
// It's also why anchor jumps (like "Explore Programs") could look broken:
// scrollIntoView landed the section flush with the viewport top, right
// underneath the fixed navbar, hiding the heading it just scrolled to.
function smoothScrollTo(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const navbar = document.getElementById('navbar');
  const offset = (navbar ? navbar.offsetHeight : 0) + 20; // clear the fixed navbar
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ===== MODALS ===== */
function openTrialModal() {
  const modal = document.getElementById('trialModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('trial-date');
    if (dateInput) dateInput.min = today;
  }
}

function openInquiryModal(plan) {
  const modal = document.getElementById('inquiryModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (plan) {
      const planSelect = document.getElementById('inq-plan');
      if (planSelect) {
        for (let i = 0; i < planSelect.options.length; i++) {
          if (planSelect.options[i].text === plan) {
            planSelect.selectedIndex = i;
            break;
          }
        }
      }
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
  // Re-lock the admin session whenever the admin panel closes, so an
  // unattended staff browser does not stay unlocked indefinitely.
  if (id === 'adminPanel') adminUnlocked = false;
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
    closeLightbox();
  }
});

/* ===== FORM SUBMISSIONS ===== */
function submitTrial(e) {
  e.preventDefault();
  const core = validateCoreFields(field('trial-name', FIELD_LIMITS.name), field('trial-phone', FIELD_LIMITS.phone), field('trial-email', FIELD_LIMITS.email));
  if (!core.ok) return;
  const data = {
    id: Date.now(),
    type: 'Trial Booking',
    name: core.name,
    phone: core.phone,
    email: core.email,
    class: field('trial-class', FIELD_LIMITS.choice),
    date: field('trial-date', 10),
    time: field('trial-time', FIELD_LIMITS.choice),
    note: field('trial-note', FIELD_LIMITS.note),
    timestamp: new Date().toLocaleString(),
  };
  if (!saveData(STORAGE.trials, data)) return;
  closeModal('trialModal');
  showToast('🎯 Trial class booked! We\'ll confirm via WhatsApp/call.');
  e.target.reset();
}

function submitMembership(e) {
  e.preventDefault();
  const core = validateCoreFields(field('inq-name', FIELD_LIMITS.name), field('inq-phone', FIELD_LIMITS.phone), field('inq-email', FIELD_LIMITS.email));
  if (!core.ok) return;
  const data = {
    id: Date.now(),
    type: 'Membership Inquiry',
    name: core.name,
    phone: core.phone,
    email: core.email,
    plan: field('inq-plan', FIELD_LIMITS.choice),
    goal: field('inq-goal', FIELD_LIMITS.choice),
    experience: field('inq-experience', FIELD_LIMITS.choice),
    note: field('inq-note', FIELD_LIMITS.note),
    timestamp: new Date().toLocaleString(),
  };
  if (!saveData(STORAGE.inquiries, data)) return;
  closeModal('inquiryModal');
  showToast('✅ Inquiry received! Our team will contact you within 2 hours.');
  e.target.reset();
}

function submitInquiry(e) {
  e.preventDefault();
  const core = validateCoreFields(field('cf-name', FIELD_LIMITS.name), field('cf-phone', FIELD_LIMITS.phone), field('cf-email', FIELD_LIMITS.email));
  if (!core.ok) return;
  const data = {
    id: Date.now(),
    type: 'Contact Message',
    name: core.name,
    phone: core.phone,
    email: core.email,
    interest: field('cf-interest', FIELD_LIMITS.choice),
    message: field('cf-message', FIELD_LIMITS.message),
    timestamp: new Date().toLocaleString(),
  };
  if (!saveData(STORAGE.messages, data)) return;
  showToast('📩 Message sent! We\'ll get back to you shortly.');
  e.target.reset();
}

/* ===== LOCAL STORAGE ===== */
/* Safety cap: localStorage is small (~5MB); unbounded record growth
   would throw QuotaExceededError and break all form submissions. */
const MAX_RECORDS = 200;

function getData(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    // Corrupted storage must never break the whole app.
    return [];
  }
}

function saveData(key, data) {
  const existing = getData(key);
  existing.unshift(data);
  if (existing.length > MAX_RECORDS) existing.length = MAX_RECORDS;
  try {
    localStorage.setItem(key, JSON.stringify(existing));
    return true;
  } catch (err) {
    showToast('⚠️ Could not save — browser storage is full. Free up space or clear old data.');
    return false;
  }
}

/* ===== INPUT VALIDATION (see js/security-utils.js) ===== */
const FIELD_LIMITS = { name: 80, phone: 24, email: 254, choice: 60, message: 1000, note: 500 };

function field(id, limit) {
  const el = document.getElementById(id);
  return clampText(el ? el.value : '', limit);
}

// Validates a form's core fields. Returns {ok, name, phone, email}
// or {ok:false} after showing a toast explaining why.
function validateCoreFields(name, phone, email) {
  if (!name) {
    showToast('⚠️ Please enter your name.');
    return { ok: false };
  }
  if (!phone || !isValidPhone(phone)) {
    showToast('⚠️ Please enter a valid phone number.');
    return { ok: false };
  }
  if (email && !isValidEmail(email)) {
    showToast('⚠️ Please enter a valid email address (or leave it empty).');
    return { ok: false };
  }
  return { ok: true, name: name, phone: phone, email: email };
}

/* ===== WHATSAPP HANDOFF ===== */
/* The static site has no backend, so localStorage alone never delivers
   a lead to the gym. These helpers open a prefilled WhatsApp chat to
   the gym's number so submissions actually reach a human. */
const GYM_WHATSAPP = '919876543210';

function waHandoff(title, lines) {
  const body = lines.filter(function (l) { return l && l.value; })
    .map(function (l) { return '* ' + l.label + ': ' + l.value; })
    .join('\n');
  const text = encodeURIComponent(title + '\n' + body);
  window.open('https://wa.me/' + GYM_WHATSAPP + '?text=' + text, '_blank', 'noopener');
}

function trialHandoffFromForm() {
  const core = validateCoreFields(field('trial-name', FIELD_LIMITS.name), field('trial-phone', FIELD_LIMITS.phone), field('trial-email', FIELD_LIMITS.email));
  if (!core.ok) return;
  waHandoff('IRONFORGE — Free trial class booking', [
    { label: 'Name', value: core.name },
    { label: 'Phone', value: core.phone },
    { label: 'Email', value: core.email },
    { label: 'Class', value: field('trial-class', FIELD_LIMITS.choice) },
    { label: 'Preferred date', value: field('trial-date', 10) },
    { label: 'Preferred time', value: field('trial-time', FIELD_LIMITS.choice) },
    { label: 'Notes', value: field('trial-note', FIELD_LIMITS.note) },
  ]);
}

function inquiryHandoffFromForm() {
  const core = validateCoreFields(field('inq-name', FIELD_LIMITS.name), field('inq-phone', FIELD_LIMITS.phone), field('inq-email', FIELD_LIMITS.email));
  if (!core.ok) return;
  waHandoff('IRONFORGE — Membership inquiry', [
    { label: 'Name', value: core.name },
    { label: 'Phone', value: core.phone },
    { label: 'Email', value: core.email },
    { label: 'Interested plan', value: field('inq-plan', FIELD_LIMITS.choice) },
    { label: 'Goal', value: field('inq-goal', FIELD_LIMITS.choice) },
    { label: 'Experience', value: field('inq-experience', FIELD_LIMITS.choice) },
    { label: 'Notes', value: field('inq-note', FIELD_LIMITS.note) },
  ]);
}

function contactHandoffFromForm() {
  const core = validateCoreFields(field('cf-name', FIELD_LIMITS.name), field('cf-phone', FIELD_LIMITS.phone), field('cf-email', FIELD_LIMITS.email));
  if (!core.ok) return;
  waHandoff('IRONFORGE — Contact message', [
    { label: 'Name', value: core.name },
    { label: 'Phone', value: core.phone },
    { label: 'Email', value: core.email },
    { label: 'Interest', value: field('cf-interest', FIELD_LIMITS.choice) },
    { label: 'Message', value: field('cf-message', FIELD_LIMITS.message) },
  ]);
}

/* Escape user-supplied values before injecting them with innerHTML.
   Without this, a visitor could submit e.g. "<img src=x onerror=...>"
   as their name and execute script inside the admin dashboard (stored XSS). */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clearData(type) {
  if (confirm('Are you sure you want to clear all ' + type + '?')) {
    localStorage.removeItem(STORAGE[type]);
    if (type === 'inquiries') loadAdminInquiries();
    if (type === 'trials') loadAdminTrials();
    updateAdminStats(); // keep stat counters in sync after clearing
    showToast('Data cleared successfully.');
  }
}

/* ===== ADMIN PANEL ===== */
/* SECURITY MODEL (important): this site has no backend, so the admin
   panel is a LOCAL dashboard — it only shows records stored in this
   browser's localStorage. The passcode below is verified client-side
   with PBKDF2 (js/security-utils.js) purely as UI gating + friction;
   it is NOT a security boundary and contains no secrets.
   - The passcode is provisioned on first use and stored ONLY as a
     salted PBKDF2 hash — no default password ships in the source.
   - 5 failed attempts lock attempts with exponential backoff.
   See SECURITY.md for how to add a real, server-side backend. */

const AdminAuth = createAdminAuth(typeof localStorage !== 'undefined' ? localStorage : undefined);
let adminUnlocked = false;

function showAdminView(view) {
  const setup = document.getElementById('adminSetup');
  const login = document.getElementById('adminLogin');
  const dash = document.getElementById('adminDashboard');
  if (!setup || !login || !dash) return;
  setup.style.display = view === 'setup' ? 'block' : 'none';
  login.style.display = view === 'login' ? 'block' : 'none';
  dash.style.display = view === 'dashboard' ? 'block' : 'none';
}

function openAdminPanel() {
  const panel = document.getElementById('adminPanel');
  if (panel) {
    panel.classList.add('active');
  }
  document.body.style.overflow = 'hidden';
  adminUnlocked = false;
  if (!AdminAuth.isProvisioned()) {
    showAdminView('setup');
  } else {
    showAdminView('login');
    updateLockMessage();
  }
}

function adminSetBusy(busy) {
  ['admin-pass', 'admin-pass-new', 'admin-pass-confirm'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.disabled = busy;
  });
  document.querySelectorAll('#adminLogin button, #adminSetup button').forEach(function (b) {
    b.disabled = busy;
  });
}

function updateLockMessage() {
  const msg = document.getElementById('admin-lock-msg');
  if (!msg) return;
  const state = AdminAuth.getLockState();
  if (state.locked) {
    const secs = Math.ceil(state.retryAfterMs / 1000);
    msg.textContent = 'Too many failed attempts. Locked for ' + secs + 's.';
    msg.style.display = 'block';
  } else if (state.attempts > 0) {
    msg.textContent = state.attempts + ' failed attempt(s) so far.';
    msg.style.display = 'block';
  } else {
    msg.style.display = 'none';
  }
}

// First run on this browser: create the passcode (stored as PBKDF2 hash only).
function adminProvision() {
  const passNew = document.getElementById('admin-pass-new');
  const passConfirm = document.getElementById('admin-pass-confirm');
  if (!passNew || !passConfirm) return;
  const a = passNew.value;
  const b = passConfirm.value;
  if (a !== b) {
    showToast('⚠️ Passcodes do not match.');
    return;
  }
  adminSetBusy(true);
  AdminAuth.provision(a).then(function () {
    passNew.value = '';
    passConfirm.value = '';
    unlockAdminDashboard();
  }).catch(function (err) {
    showToast('⚠️ ' + err.message);
  }).then(function () { adminSetBusy(false); });
}

function adminLogin() {
  const state = AdminAuth.getLockState();
  if (state.locked) {
    updateLockMessage();
    showToast('⚠️ Admin access is temporarily locked. Try again in ' + Math.ceil(state.retryAfterMs / 1000) + 's.');
    return;
  }
  const passInput = document.getElementById('admin-pass');
  const pass = passInput ? passInput.value : '';
  if (!pass) {
    showToast('⚠️ Enter the admin passcode.');
    return;
  }
  adminSetBusy(true);
  AdminAuth.verify(pass).then(function (result) {
    if (result.ok) {
      if (passInput) passInput.value = '';
      unlockAdminDashboard();
    } else if (result.locked) {
      showToast('⚠️ Too many failed attempts. Locked for ' + Math.ceil(result.retryAfterMs / 1000) + 's.');
      updateLockMessage();
    } else if (result.provisionRequired) {
      showAdminView('setup');
    } else {
      showToast('❌ Incorrect passcode.');
      updateLockMessage();
    }
  }).catch(function (err) {
    showToast('⚠️ ' + err.message);
  }).then(function () { adminSetBusy(false); });
}

function unlockAdminDashboard() {
  adminUnlocked = true;
  showAdminView('dashboard');
  loadAdminData();
  showToast('Welcome back, Admin! 🔓');
}

// Change passcode: requires the current one.
function adminChangePasscode() {
  const current = window.prompt('Enter the CURRENT admin passcode:');
  if (current == null) return;
  const next = window.prompt('Enter the NEW passcode (min 8 characters):');
  if (next == null) return;
  AdminAuth.change(current, next).then(function (result) {
    if (result.ok) {
      showToast('✅ Passcode changed.');
    } else if (result.locked) {
      showToast('⚠️ Locked — try again in ' + Math.ceil(result.retryAfterMs / 1000) + 's.');
    } else {
      showToast('❌ Current passcode is incorrect, or the new one violates policy.');
    }
  }).catch(function (err) {
    showToast('⚠️ ' + err.message);
  });
}

// Forgot passcode: fail-safe reset. Because the dashboard is local-only,
// wiping the verifier + local records is safe; there is no backdoor.
function adminResetAccess() {
  if (!window.confirm('Reset admin access?\n\nThis deletes the passcode AND all locally stored inquiries, trials, messages and photos in THIS browser. This cannot be undone.')) {
    return;
  }
  AdminAuth.reset();
  Object.keys(STORAGE).forEach(function (k) {
    try { localStorage.removeItem(STORAGE[k]); } catch (err) { /* ignore */ }
  });
  showToast('Admin access reset. Set a new passcode.');
  showAdminView('setup');
}

const adminPassInput = document.getElementById('admin-pass');
if (adminPassInput) {
  adminPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adminLogin();
  });
}
const adminPassConfirmInput = document.getElementById('admin-pass-confirm');
if (adminPassConfirmInput) {
  adminPassConfirmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adminProvision();
  });
}

function loadAdminData() {
  loadAdminInquiries();
  loadAdminTrials();
  loadAdminPhotos();
  updateAdminStats();
}

function updateAdminStats() {
  const inq = getData(STORAGE.inquiries);
  const tri = getData(STORAGE.trials);
  const msg = getData(STORAGE.messages);
  const totalInqEl = document.getElementById('total-inquiries');
  const totalTriEl = document.getElementById('total-trials');
  const totalMsgEl = document.getElementById('total-messages');
  
  if (totalInqEl) totalInqEl.textContent = inq.length + msg.length;
  if (totalTriEl) totalTriEl.textContent = tri.length;
  if (totalMsgEl) totalMsgEl.textContent = msg.length;
}

function loadAdminInquiries() {
  const inqList = document.getElementById('inquiries-list');
  if (!inqList) return;
  
  const inquiries = [...getData(STORAGE.inquiries), ...getData(STORAGE.messages)];
  inquiries.sort((a, b) => b.id - a.id);
  
  if (inquiries.length === 0) {
    inqList.innerHTML = '<p style="color:var(--gray-mid);text-align:center;padding:20px;">No inquiries yet.</p>';
    return;
  }
  inqList.innerHTML = inquiries.map(item => {
    const phoneDigits = String(item.phone || '').replace(/[^0-9]/g, '');
    return `
    <div class="inquiry-item">
      <div class="badge">${escapeHtml(item.type)}</div>
      <h4>${escapeHtml(item.name)} — ${escapeHtml(item.phone)}</h4>
      <p>
        ${item.email ? '📧 ' + escapeHtml(item.email) + '<br>' : ''}
        ${item.plan ? '📋 Plan: ' + escapeHtml(item.plan) + '<br>' : ''}
        ${item.goal ? '🎯 Goal: ' + escapeHtml(item.goal) + '<br>' : ''}
        ${item.interest ? '💡 Interest: ' + escapeHtml(item.interest) + '<br>' : ''}
        ${item.message ? '💬 ' + escapeHtml(item.message) + '<br>' : ''}
        ${item.note ? '📝 ' + escapeHtml(item.note) + '<br>' : ''}
        <small style="color:var(--orange-light)">🕐 ${escapeHtml(item.timestamp)}</small>
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="https://wa.me/${phoneDigits}" target="_blank" rel="noopener noreferrer" style="color:#25D366;font-size:0.8rem;text-decoration:none;background:rgba(37,211,102,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(37,211,102,0.2);">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="tel:${escapeHtml(item.phone)}" style="color:var(--orange-light);font-size:0.8rem;text-decoration:none;background:rgba(247,123,0,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(247,123,0,0.2);">
          <i class="fas fa-phone"></i> Call
        </a>
      </div>
    </div>
  `;
  }).join('');
}

function loadAdminTrials() {
  const triList = document.getElementById('trials-list');
  if (!triList) return;
  
  const trials = getData(STORAGE.trials);
  
  if (trials.length === 0) {
    triList.innerHTML = '<p style="color:var(--gray-mid);text-align:center;padding:20px;">No trial bookings yet.</p>';
    return;
  }
  triList.innerHTML = trials.map(item => {
    const phoneDigits = String(item.phone || '').replace(/[^0-9]/g, '');
    return `
    <div class="inquiry-item">
      <div class="badge">Trial - ${escapeHtml(item.class || 'Not selected')}</div>
      <h4>${escapeHtml(item.name)} — ${escapeHtml(item.phone)}</h4>
      <p>
        ${item.email ? '📧 ' + escapeHtml(item.email) + '<br>' : ''}
        📅 ${escapeHtml(item.date || 'Date not set')} at ${escapeHtml(item.time)}<br>
        ${item.note ? '📝 ' + escapeHtml(item.note) + '<br>' : ''}
        <small style="color:var(--orange-light)">🕐 ${escapeHtml(item.timestamp)}</small>
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="https://wa.me/${phoneDigits}" target="_blank" rel="noopener noreferrer" style="color:#25D366;font-size:0.8rem;text-decoration:none;background:rgba(37,211,102,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(37,211,102,0.2);">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="tel:${escapeHtml(item.phone)}" style="color:var(--orange-light);font-size:0.8rem;text-decoration:none;background:rgba(247,123,0,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(247,123,0,0.2);">
          <i class="fas fa-phone"></i> Call
        </a>
      </div>
    </div>
  `;
  }).join('');
}

function switchAdminTab(tab, element) {
  // Defensive: accept either the clicked button element or the event object.
  // The inline handlers used to pass `event` (an Event instance, which has no
  // classList) — that threw a TypeError after all sections were already
  // hidden, blanking out the dashboard. Passing `this` from the HTML is best.
  const btn = element instanceof Event ? element.currentTarget : element;

  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');

  if (btn) btn.classList.add('active');
  const section = document.getElementById('admin-' + tab);
  if (section) section.style.display = 'block';

  if (tab === 'gallery') loadAdminPhotos();
}

/* ===== PHOTO UPLOAD ===== */
/* Upload hardening (client-side; the browser is the only "server"):
   - Never trust file.name or file.type: verify magic bytes.
   - Reject non-raster images (SVG can carry script).
   - Cap per-file size and total count (localStorage is ~5MB).
   - Render the grid with DOM APIs (textContent/setAttribute) so a
     crafted filename can never inject HTML/attributes (stored XSS). */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB per photo
const MAX_PHOTOS = 20;                   // total photos kept

function readMagicBytes(file) {
  return file.slice(0, 16).arrayBuffer().then(function (buf) {
    return new Uint8Array(buf);
  });
}

function readFileAsDataURL(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(reader.error || new Error('Read failed')); };
    reader.readAsDataURL(file);
  });
}

async function uploadPhotos(e) {
  const input = e.target;
  const files = Array.from(input.files || []);
  input.value = ''; // allow re-selecting the same file later
  if (files.length === 0) return;

  const photos = getData(STORAGE.photos);
  const rejected = [];
  let accepted = 0;

  for (const file of files) {
    if (photos.length + accepted >= MAX_PHOTOS) {
      rejected.push(file.name + ': storage limit (' + MAX_PHOTOS + ' photos)');
      continue;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      rejected.push(file.name + ': too large (max 5 MB)');
      continue;
    }
    try {
      const magic = await readMagicBytes(file);
      const type = sniffImageType(magic);
      if (!type) {
        rejected.push(file.name + ': not a supported image (png/jpg/gif/webp)');
        continue;
      }
      const dataUrl = await readFileAsDataURL(file);
      if (!isValidImageDataUrl(dataUrl)) {
        rejected.push(file.name + ': invalid image data');
        continue;
      }
      photos.push({ id: Date.now() + accepted, src: dataUrl, name: clampText(file.name, 120) });
      accepted++;
    } catch (err) {
      rejected.push(file.name + ': could not be read');
    }
  }

  if (accepted > 0) {
    try {
      localStorage.setItem(STORAGE.photos, JSON.stringify(photos));
      loadAdminPhotos();
      showToast('✅ ' + accepted + ' photo(s) added' + (rejected.length ? ' — ' + rejected.length + ' skipped.' : '!'));
    } catch (err) {
      showToast('⚠️ Storage full — upload fewer or smaller photos.');
      loadAdminPhotos();
    }
  } else {
    showToast('⚠️ ' + rejected.join(' · '));
  }
}

function loadAdminPhotos() {
  const photos = getData(STORAGE.photos);
  const grid = document.getElementById('admin-photos');
  if (!grid) return;

  // Rebuild exclusively with DOM APIs — no innerHTML with dynamic data.
  grid.textContent = '';

  const visible = photos.filter(function (p) {
    // Skip entries with tampered or legacy-invalid sources.
    return p && isValidImageDataUrl(p.src);
  });

  if (visible.length === 0) {
    const p = document.createElement('p');
    p.style.color = 'var(--gray-mid)';
    p.style.fontSize = '0.875rem';
    p.textContent = photos.length
      ? 'No displayable photos (invalid or corrupted entries were skipped).'
      : 'No photos uploaded yet.';
    grid.appendChild(p);
    return;
  }

  visible.forEach(function (p) {
    const item = document.createElement('div');
    item.className = 'admin-photo-item';

    const img = document.createElement('img');
    img.setAttribute('src', p.src); // allowlisted data: URL only
    img.setAttribute('alt', clampText(p.name, 120)); // text-safe alt
    img.setAttribute('loading', 'lazy');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Delete photo';
    btn.setAttribute('aria-label', 'Delete photo');
    const icon = document.createElement('i');
    icon.className = 'fas fa-times';
    btn.appendChild(icon);
    btn.addEventListener('click', function () { deletePhoto(p.id); });

    item.appendChild(img);
    item.appendChild(btn);
    grid.appendChild(item);
  });
}

function deletePhoto(id) {
  const photos = getData(STORAGE.photos).filter(p => p.id !== id);
  localStorage.setItem(STORAGE.photos, JSON.stringify(photos));
  loadAdminPhotos();
  showToast('Photo deleted.');
}

/* ===== WHATSAPP ===== */
function openWhatsApp(number) {
  const msg = encodeURIComponent("Hello IRONFORGE! I'm interested in your gym services. Can you help me?");
  window.open(`https://wa.me/${number}?text=${msg}`, '_blank', 'noopener,noreferrer');
}

/* ===== GALLERY LIGHTBOX ===== */
function openLightbox(el) {
  const img = el.querySelector('img');
  const caption = el.querySelector('.gallery-overlay span');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightbox = document.getElementById('lightbox');
  
  if (img && lightboxImg) lightboxImg.src = img.src;
  if (caption && lightboxCaption) lightboxCaption.textContent = caption.textContent;
  if (lightbox) {
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ===== TOAST ===== */
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (toastMsg) toastMsg.textContent = msg;
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }
}

/* ===== PARALLAX HERO BG TEXT ===== */
window.addEventListener('scroll', () => {
  const bgText = document.querySelector('.hero-bg-text');
  if (bgText) {
    const scrollY = window.scrollY;
    bgText.style.transform = `translate(-50%, calc(-50% + ${scrollY * 0.3}px))`;
    bgText.style.opacity = Math.max(0, 1 - scrollY / 500);
  }
});

/* ===== TILT EFFECT ON CARDS ===== */
document.querySelectorAll('.program-card, .trainer-card, .feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s ease';
    setTimeout(() => { card.style.transition = ''; }, 500);
  });
});

/* ===== ACTIVE NAV LINK ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 150;
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');
    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active-link');
        if (link.getAttribute('href') === '#' + sectionId) {
          link.classList.add('active-link');
        }
      });
    }
  });
});

/* ===== PROGRAM HOVER GLOW ===== */
document.querySelectorAll('.program-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.boxShadow = '0 30px 60px rgba(247,123,0,0.15)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.boxShadow = '';
  });
});

/* ===== SMOOTH SCROLL FOR ALL ANCHOR LINKS ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = anchor.getAttribute('href');
    if (target && target.length > 1 && document.querySelector(target)) {
      e.preventDefault();
      smoothScrollTo(target);
    }
  });
});

/* ===== NEWSLETTER FORM ===== */
const newsletterBtn = document.querySelector('.newsletter-form button');
if (newsletterBtn) {
  newsletterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.querySelector('.newsletter-form input');
    if (!input) return;
    const email = clampText(input.value, 254);
    if (isValidEmail(email)) {
      showToast('🎉 Subscribed! Check your inbox for exclusive offers.');
      input.value = '';
    } else {
      showToast('⚠️ Please enter a valid email address.');
    }
  });
}

/* ===== DYNAMIC YEAR ===== */
document.addEventListener('DOMContentLoaded', () => {
  const yearEls = document.querySelectorAll('.footer-bottom p');
  if (yearEls.length > 0) {
    const currentYear = new Date().getFullYear();
    yearEls[0].textContent = yearEls[0].textContent.replace(/2024/g, currentYear);
  }
});

/* ===== MAGNETIC BUTTON EFFECT ===== */
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    btn.style.transform = `translateY(-3px) translate(${x}px, ${y}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* ===== INITIAL LOAD ===== */
window.addEventListener('DOMContentLoaded', () => {
  revealOnScroll();
  // Add active-link style
  const style = document.createElement('style');
  style.textContent = `.nav-links a.active-link { color: var(--orange) !important; }
  .nav-links a.active-link::after { transform: scaleX(1) !important; }`;
  document.head.appendChild(style);
  
  // Hamburger animation styles
  const hamStyle = document.createElement('style');
  hamStyle.textContent = `
    .hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .hamburger.active span:nth-child(2) { opacity: 0; }
    .hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
  `;
  document.head.appendChild(hamStyle);
});

console.log('%cIRONFORGE GYM', 'color:#F77B00;font-size:2em;font-weight:bold;font-family:monospace');
console.log('%cInfo: form submissions and the admin dashboard are stored locally in THIS browser only (static site, no backend).', 'color:#848E95');
