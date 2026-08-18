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
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 900);
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
  dot.style.left = cursorX + 'px';
  dot.style.top = cursorY + 'px';
});

function animateRing() {
  ringX += (cursorX - ringX) * 0.12;
  ringY += (cursorY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

/* ===== PARTICLES ===== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
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
    if (this.life > this.maxLife || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < 80; i++) {
  particles.push(new Particle());
}

function drawLines() {
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

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawLines();
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ===== NAVBAR ===== */
const navbar = document.getElementById('navbar');
const backTop = document.getElementById('backTop');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Navbar
  if (scrollY > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Back to top
  if (scrollY > 400) {
    backTop.classList.add('visible');
  } else {
    backTop.classList.remove('visible');
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
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
}

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('hamburger').classList.remove('active');
    document.getElementById('navLinks').classList.remove('open');
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
      animateCounter(el, 0, target, 2000);
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
function scrollTo(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ===== MODALS ===== */
function openTrialModal() {
  document.getElementById('trialModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('trial-date').min = today;
}

function openInquiryModal(plan) {
  const modal = document.getElementById('inquiryModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (plan) {
    const planSelect = document.getElementById('inq-plan');
    for (let i = 0; i < planSelect.options.length; i++) {
      if (planSelect.options[i].text === plan) {
        planSelect.selectedIndex = i;
        break;
      }
    }
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
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
  const data = {
    id: Date.now(),
    type: 'Trial Booking',
    name: document.getElementById('trial-name').value,
    phone: document.getElementById('trial-phone').value,
    email: document.getElementById('trial-email').value,
    class: document.getElementById('trial-class').value,
    date: document.getElementById('trial-date').value,
    time: document.getElementById('trial-time').value,
    note: document.getElementById('trial-note').value,
    timestamp: new Date().toLocaleString(),
  };
  saveData(STORAGE.trials, data);
  closeModal('trialModal');
  showToast('🎯 Trial class booked! We\'ll confirm via WhatsApp/call.');
  e.target.reset();
}

function submitMembership(e) {
  e.preventDefault();
  const data = {
    id: Date.now(),
    type: 'Membership Inquiry',
    name: document.getElementById('inq-name').value,
    phone: document.getElementById('inq-phone').value,
    email: document.getElementById('inq-email').value,
    plan: document.getElementById('inq-plan').value,
    goal: document.getElementById('inq-goal').value,
    experience: document.getElementById('inq-experience').value,
    note: document.getElementById('inq-note').value,
    timestamp: new Date().toLocaleString(),
  };
  saveData(STORAGE.inquiries, data);
  closeModal('inquiryModal');
  showToast('✅ Inquiry received! Our team will contact you within 2 hours.');
  e.target.reset();
}

function submitInquiry(e) {
  e.preventDefault();
  const data = {
    id: Date.now(),
    type: 'Contact Message',
    name: document.getElementById('cf-name').value,
    phone: document.getElementById('cf-phone').value,
    email: document.getElementById('cf-email').value,
    interest: document.getElementById('cf-interest').value,
    message: document.getElementById('cf-message').value,
    timestamp: new Date().toLocaleString(),
  };
  saveData(STORAGE.messages, data);
  showToast('📩 Message sent! We\'ll get back to you shortly.');
  e.target.reset();
}

/* ===== LOCAL STORAGE ===== */
function saveData(key, data) {
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.unshift(data);
  localStorage.setItem(key, JSON.stringify(existing));
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function clearData(type) {
  if (confirm('Are you sure you want to clear all ' + type + '?')) {
    localStorage.removeItem(STORAGE[type]);
    if (type === 'inquiries') loadAdminInquiries();
    if (type === 'trials') loadAdminTrials();
    showToast('Data cleared successfully.');
  }
}

/* ===== ADMIN PANEL ===== */
function openAdminPanel() {
  document.getElementById('adminPanel').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminLogin').style.display = 'block';
}

function adminLogin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === 'ironforge2024') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminData();
    showToast('Welcome back, Admin! 🔓');
  } else {
    document.getElementById('admin-pass').style.borderColor = '#dc3545';
    setTimeout(() => document.getElementById('admin-pass').style.borderColor = '', 1500);
    showToast('❌ Incorrect password. Try: ironforge2024');
  }
}

document.getElementById('admin-pass').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adminLogin();
});

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
  document.getElementById('total-inquiries').textContent = inq.length + msg.length;
  document.getElementById('total-trials').textContent = tri.length;
  document.getElementById('total-messages').textContent = msg.length;
}

function loadAdminInquiries() {
  const inqList = document.getElementById('inquiries-list');
  const inquiries = [...getData(STORAGE.inquiries), ...getData(STORAGE.messages)];
  inquiries.sort((a, b) => b.id - a.id);
  
  if (inquiries.length === 0) {
    inqList.innerHTML = '<p style="color:var(--gray-mid);text-align:center;padding:20px;">No inquiries yet.</p>';
    return;
  }
  inqList.innerHTML = inquiries.map(item => `
    <div class="inquiry-item">
      <div class="badge">${item.type}</div>
      <h4>${item.name} — ${item.phone}</h4>
      <p>
        ${item.email ? '📧 ' + item.email + '<br>' : ''}
        ${item.plan ? '📋 Plan: ' + item.plan + '<br>' : ''}
        ${item.goal ? '🎯 Goal: ' + item.goal + '<br>' : ''}
        ${item.interest ? '💡 Interest: ' + item.interest + '<br>' : ''}
        ${item.message ? '💬 ' + item.message + '<br>' : ''}
        ${item.note ? '📝 ' + item.note + '<br>' : ''}
        <small style="color:var(--orange-light)">🕐 ${item.timestamp}</small>
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="https://wa.me/${item.phone.replace(/[^0-9]/g,'')}" target="_blank" style="color:#25D366;font-size:0.8rem;text-decoration:none;background:rgba(37,211,102,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(37,211,102,0.2);">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="tel:${item.phone}" style="color:var(--orange-light);font-size:0.8rem;text-decoration:none;background:rgba(247,123,0,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(247,123,0,0.2);">
          <i class="fas fa-phone"></i> Call
        </a>
      </div>
    </div>
  `).join('');
}

function loadAdminTrials() {
  const triList = document.getElementById('trials-list');
  const trials = getData(STORAGE.trials);
  
  if (trials.length === 0) {
    triList.innerHTML = '<p style="color:var(--gray-mid);text-align:center;padding:20px;">No trial bookings yet.</p>';
    return;
  }
  triList.innerHTML = trials.map(item => `
    <div class="inquiry-item">
      <div class="badge">Trial - ${item.class || 'Not selected'}</div>
      <h4>${item.name} — ${item.phone}</h4>
      <p>
        ${item.email ? '📧 ' + item.email + '<br>' : ''}
        📅 ${item.date || 'Date not set'} at ${item.time}<br>
        ${item.note ? '📝 ' + item.note + '<br>' : ''}
        <small style="color:var(--orange-light)">🕐 ${item.timestamp}</small>
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="https://wa.me/${item.phone.replace(/[^0-9]/g,'')}" target="_blank" style="color:#25D366;font-size:0.8rem;text-decoration:none;background:rgba(37,211,102,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(37,211,102,0.2);">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="tel:${item.phone}" style="color:var(--orange-light);font-size:0.8rem;text-decoration:none;background:rgba(247,123,0,0.1);padding:6px 12px;border-radius:6px;border:1px solid rgba(247,123,0,0.2);">
          <i class="fas fa-phone"></i> Call
        </a>
      </div>
    </div>
  `).join('');
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  
  event.target.classList.add('active');
  document.getElementById('admin-' + tab).style.display = 'block';
  
  if (tab === 'gallery') loadAdminPhotos();
}

/* ===== PHOTO UPLOAD ===== */
function uploadPhotos(e) {
  const files = Array.from(e.target.files);
  const photos = getData(STORAGE.photos);
  
  let processed = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      photos.push({ id: Date.now() + processed, src: ev.target.result, name: file.name });
      processed++;
      if (processed === files.length) {
        localStorage.setItem(STORAGE.photos, JSON.stringify(photos));
        loadAdminPhotos();
        showToast(`✅ ${files.length} photo(s) uploaded successfully!`);
      }
    };
    reader.readAsDataURL(file);
  });
}

function loadAdminPhotos() {
  const photos = getData(STORAGE.photos);
  const grid = document.getElementById('admin-photos');
  if (photos.length === 0) {
    grid.innerHTML = '<p style="color:var(--gray-mid);font-size:0.875rem;">No photos uploaded yet.</p>';
    return;
  }
  grid.innerHTML = photos.map(p => `
    <div class="admin-photo-item">
      <img src="${p.src}" alt="${p.name}" />
      <button onclick="deletePhoto(${p.id})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
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
  window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
}

/* ===== GALLERY LIGHTBOX ===== */
function openLightbox(el) {
  const img = el.querySelector('img');
  const caption = el.querySelector('.gallery-overlay span');
  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-caption').textContent = caption ? caption.textContent : '';
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}

/* ===== TOAST ===== */
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
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

/* ===== TYPING EFFECT IN HERO ===== */
// Already handled via CSS animation

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
    if (target.length > 1 && document.querySelector(target)) {
      e.preventDefault();
      document.querySelector(target).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ===== NEWSLETTER FORM ===== */
const newsletterBtn = document.querySelector('.newsletter-form button');
if (newsletterBtn) {
  newsletterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.querySelector('.newsletter-form input');
    if (input.value && input.value.includes('@')) {
      showToast('🎉 Subscribed! Check your inbox for exclusive offers.');
      input.value = '';
    } else {
      showToast('⚠️ Please enter a valid email address.');
    }
  });
}

/* ===== DYNAMIC YEAR ===== */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.querySelector('.footer-bottom p');
  if (yearEl) {
    yearEl.textContent = yearEl.textContent.replace('2024', new Date().getFullYear());
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
console.log('%cAdmin Panel: Click "Admin" link in footer | Password: ironforge2024', 'color:#848E95');