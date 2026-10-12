/* ============================================================
   IRONFORGE GYM — Member account feature
   Member session, registration, membership state, and dashboard actions.
============================================================ */

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function ensureMemberSeedData() {
  const members = getData(STORAGE.members);
  if (members.length > 0) return members;

  const now = new Date();
  // Hash the demo password for security
  let passwordHash = null;
  try {
    passwordHash = await hashMemberPassword('ironforge123');
  } catch (err) {
    console.error('Failed to hash demo password:', err);
    // Fallback to plaintext if crypto fails (should not happen in modern browsers)
    passwordHash = { v: 0, plaintext: 'ironforge123' };
  }

  const sample = {
    id: Date.now(),
    name: 'Aarav Sharma',
    email: 'member@ironforge.in',
    phone: '+91 98765 43210',
    plan: 'Elite',
    password: passwordHash,
    amount: 2999,
    lastPaymentDate: new Date(now.getTime() - 20 * 86400000).toISOString().slice(0, 10),
    nextDueDate: addDays(now, 4),
    createdAt: now.toISOString(),
    notifications: [
      { id: Date.now() + 1, type: 'payment', message: createPaymentReminderText('Elite', 2999, addDays(now, 4)), createdAt: now.toISOString() },
    ],
  };

  localStorage.setItem(STORAGE.members, JSON.stringify([sample]));
  return [sample];
}

function getCurrentMember() {
  try {
    const raw = localStorage.getItem(STORAGE.memberSession);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && session.id ? session : null;
  } catch (err) {
    return null;
  }
}

function setCurrentMember(member) {
  if (!member) {
    localStorage.removeItem(STORAGE.memberSession);
    return;
  }
  localStorage.setItem(STORAGE.memberSession, JSON.stringify(member));
}

function getMemberStatus(member) {
  const dueDate = member && member.nextDueDate ? member.nextDueDate : null;
  return getMembershipStatus(dueDate);
}

async function getMemberByCredentials(email, phone, password) {
  const memberEmail = String(email || '').trim().toLowerCase();
  const memberPhone = String(phone || '').trim();
  const memberPassword = String(password || '').trim();
  const members = getData(STORAGE.members);
  const candidate = members.find(member => {
    const matchesEmail = member.email && member.email.toLowerCase() === memberEmail;
    const matchesPhone = member.phone && member.phone.replace(/[^0-9]/g, '') === memberPhone.replace(/[^0-9]/g, '');
    return (matchesEmail || matchesPhone);
  });
  if (!candidate) return null;

  // Check password - handle both hashed (v1) and legacy plaintext (v0)
  if (candidate.password && typeof candidate.password === 'object' && candidate.password.v === 1) {
    const isValid = await verifyMemberPassword(memberPassword, candidate.password);
    return isValid ? candidate : null;
  } else if (candidate.password && typeof candidate.password === 'object' && candidate.password.v === 0) {
    // Legacy plaintext - should be migrated, but accept for now
    return candidate.password.plaintext === memberPassword ? candidate : null;
  } else if (typeof candidate.password === 'string') {
    // Very old plaintext - accept for migration
    return candidate.password === memberPassword ? candidate : null;
  }
  return null;
}

function saveMemberRecord(member) {
  const members = getData(STORAGE.members);
  const idx = members.findIndex(item => item.id === member.id);
  if (idx >= 0) {
    members[idx] = member;
  } else {
    members.unshift(member);
  }
  localStorage.setItem(STORAGE.members, JSON.stringify(members));
  return member;
}

function renderMemberNotifications(member) {
  const list = document.getElementById('member-notifications');
  if (!list) return;
  const notifications = Array.isArray(member.notifications) ? member.notifications : [];
  if (!notifications.length) {
    list.innerHTML = '<div class="member-empty">No payment reminders yet.</div>';
    return;
  }
  list.innerHTML = notifications.slice(0, 5).map(item => `
    <div class="member-notice">
      <span class="notice-pill ${item.type === 'payment' ? 'payment' : 'info'}">${item.type === 'payment' ? 'Payment' : 'Info'}</span>
      <p>${escapeHtml(item.message || 'Membership update')}</p>
      <small>${new Date(item.createdAt || Date.now()).toLocaleDateString()}</small>
    </div>
  `).join('');
}

function renderMemberDashboard() {
  const member = getCurrentMember();
  const panel = document.getElementById('memberDashboard');
  if (!panel) return;
  if (!member) {
    panel.style.display = 'none';
    return;
  }
  const status = getMemberStatus(member);
  const summaryStatus = document.getElementById('member-status');
  const nameEl = document.getElementById('member-name');
  const planEl = document.getElementById('member-plan');
  const dueEl = document.getElementById('member-next-due');
  const amountEl = document.getElementById('member-amount');
  const balanceEl = document.getElementById('member-balance');
  if (summaryStatus) {
    summaryStatus.textContent = status.label;
    summaryStatus.className = 'member-badge ' + status.state;
  }
  if (nameEl) nameEl.textContent = member.name;
  if (planEl) planEl.textContent = member.plan;
  if (dueEl) dueEl.textContent = member.nextDueDate;
  if (amountEl) amountEl.textContent = formatCurrency(member.amount);
  if (balanceEl) balanceEl.textContent = status.state === 'overdue' ? 'Needs attention. Please settle the outstanding payment.' : status.message;
  renderMemberNotifications(member);
  panel.style.display = 'block';
}

function refreshAdminMemberList() {
  const members = getData(STORAGE.members);
  const list = document.getElementById('admin-members-list');
  if (!list) return;
  if (!members.length) {
    list.innerHTML = '<div class="member-empty">No members yet.</div>';
    return;
  }

  list.innerHTML = members.map(member => {
    const status = getMemberStatus(member);
    return `
      <div class="member-admin-row">
        <div class="member-admin-main">
          <h4>${escapeHtml(member.name)}</h4>
          <p>${escapeHtml(member.email)} • ${escapeHtml(member.plan)}</p>
          <small class="member-status-badge ${status.state}">${status.label}</small>
        </div>
        <div class="member-meta">
          <span>Due: ${escapeHtml(member.nextDueDate || 'No date')}</span>
          <span>Amount: ${formatCurrency(member.amount)}</span>
          <span>Phone: ${escapeHtml(member.phone || 'N/A')}</span>
        </div>
        <div class="member-admin-actions">
          <button type="button" data-member-action="remind" data-member-id="${member.id}">Send reminder</button>
          <button type="button" data-member-action="pay" data-member-id="${member.id}">Mark paid</button>
        </div>
      </div>
    `;
  }).join('');
}

function refreshAdminMemberStats() {
  const members = getData(STORAGE.members);
  const totalEl = document.getElementById('total-members');
  const dueSoonEl = document.getElementById('due-soon-members');
  const overdueEl = document.getElementById('overdue-members');
  if (totalEl) totalEl.textContent = String(members.length);
  if (dueSoonEl) dueSoonEl.textContent = String(members.filter(m => getMemberStatus(m).state === 'dueSoon').length);
  if (overdueEl) overdueEl.textContent = String(members.filter(m => getMemberStatus(m).state === 'overdue').length);
}

function refreshAllMemberData() {
  renderMemberDashboard();
  refreshAdminMemberList();
  refreshAdminMemberStats();
}

function openMemberLoginModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function toggleMemberAuth(mode) {
  const loginPanel = document.getElementById('member-login-panel');
  const registerPanel = document.getElementById('member-register-panel');
  if (loginPanel) loginPanel.style.display = mode === 'login' ? 'block' : 'none';
  if (registerPanel) registerPanel.style.display = mode === 'register' ? 'block' : 'none';
}

async function handleMemberLogin(event) {
  event.preventDefault();
  const email = document.getElementById('member-email')?.value || '';
  const phone = document.getElementById('member-phone')?.value || '';
  const password = document.getElementById('member-password')?.value || '';
  const member = await getMemberByCredentials(email, phone, password);
  if (!member) {
    showToast('❌ Invalid member login. Try the demo account or sign up.');
    return;
  }
  setCurrentMember(member);
  closeModal('authModal');
  renderMemberDashboard();
  showToast('✅ Welcome back, ' + member.name + '!');
}

async function handleMemberRegister(event) {
  event.preventDefault();
  const name = document.getElementById('new-member-name')?.value || '';
  const email = document.getElementById('new-member-email')?.value || '';
  const phone = document.getElementById('new-member-phone')?.value || '';
  const plan = document.getElementById('new-member-plan')?.value || 'Starter';
  const password = document.getElementById('new-member-password')?.value || '';
  if (!name || !email || !phone || !password) {
    showToast('⚠️ Please enter full member details.');
    return;
  }

  const members = getData(STORAGE.members);
  const exists = members.find(member => member.email.toLowerCase() === email.toLowerCase() || member.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''));
  if (exists) {
    showToast('⚠️ This member already exists. Please log in instead.');
    toggleMemberAuth('login');
    return;
  }

  // Hash the password before storing
  let passwordHash = null;
  try {
    passwordHash = await hashMemberPassword(password.trim());
  } catch (err) {
    console.error('Failed to hash password:', err);
    showToast('⚠️ Security error: could not secure password. Please try a modern browser.');
    return;
  }

  const amount = plan === 'Elite' ? 2999 : plan === 'Champion' ? 4999 : 1499;
  const member = {
    id: Date.now(),
    name,
    email: email.trim(),
    phone: phone.trim(),
    plan,
    password: passwordHash,
    amount,
    lastPaymentDate: new Date().toISOString().slice(0, 10),
    nextDueDate: addDays(new Date(), 30),
    createdAt: new Date().toISOString(),
    notifications: [{ id: Date.now(), type: 'info', message: 'Welcome to IRONFORGE! Your membership is active and your profile is ready.', createdAt: new Date().toISOString() }],
  };

  saveMemberRecord(member);
  setCurrentMember(member);
  document.getElementById('member-register-form')?.reset();
  closeModal('authModal');
  renderMemberDashboard();
  showToast('✅ Membership created successfully.');
}

function sendMemberReminder(memberId) {
  const members = getData(STORAGE.members);
  const member = members.find(item => item.id === Number(memberId));
  if (!member) return;
  const message = createPaymentReminderText(member.plan, member.amount, member.nextDueDate);
  member.notifications = [{ id: Date.now(), type: 'payment', message, createdAt: new Date().toISOString() }, ...(member.notifications || [])].slice(0, 6);
  localStorage.setItem(STORAGE.members, JSON.stringify(members));
  renderMemberDashboard();
  refreshAdminMemberList();
  showToast('📣 Reminder sent to ' + member.name + '.');
}

function markMemberPaid(memberId) {
  const members = getData(STORAGE.members);
  const member = members.find(item => item.id === Number(memberId));
  if (!member) return;
  const today = new Date().toISOString().slice(0, 10);
  member.lastPaymentDate = today;
  member.nextDueDate = addDays(today, 30);
  member.notifications = [{ id: Date.now(), type: 'info', message: 'Payment received. Your membership is active until ' + member.nextDueDate + '.', createdAt: new Date().toISOString() }, ...(member.notifications || [])].slice(0, 6);
  localStorage.setItem(STORAGE.members, JSON.stringify(members));
  renderMemberDashboard();
  refreshAdminMemberList();
  showToast('✅ Payment recorded for ' + member.name + '.');
}

function handleMemberDashboardAction(event) {
  const item = event.target.closest('[data-member-action]');
  if (!item) return;
  const id = Number(item.dataset.memberId);
  const action = item.dataset.memberAction;
  if (action === 'remind') sendMemberReminder(id);
  if (action === 'pay') markMemberPaid(id);
}

function logoutMember() {
  setCurrentMember(null);
  renderMemberDashboard();
  showToast('👋 Member session ended.');
}

window.addEventListener('load', async () => {
  await ensureMemberSeedData();
  refreshAllMemberData();
  toggleMemberAuth('login');
  setInterval(refreshAllMemberData, 15000);
});

