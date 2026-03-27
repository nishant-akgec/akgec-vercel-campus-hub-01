// ── STATE ─────────────────────────────────────────────────
let currentPage = 'home';
let selectedFilters = {};
let activeSubjectId = null;
let notesSortMode = 'latest';  // 'latest' | 'top-rated' | 'most-downloaded'
let notesSearchQ = '';

// ── ADMIN SETTINGS ────────────────────────────────────────
const ADMIN_EMAIL = 'admin@campushub.com';

// ── AUTH STATE ────────────────────────────────────────────
let currentUser = null;

function loadSession() {
  const saved = localStorage.getItem('campushub_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    renderNavAuth();
  }
}

function saveSession(user) {
  currentUser = user;
  localStorage.setItem('campushub_user', JSON.stringify(user));
  renderNavAuth();
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem('campushub_user');
  renderNavAuth();
}

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

// ── RENDER NAVBAR AUTH AREA ─────────────────────────────
function renderNavAuth() {
  const el = document.getElementById('navAuth');
  if (!el) return;

  if (currentUser) {
    const isAdmin = currentUser.email === ADMIN_EMAIL;
    el.innerHTML = `
            ${isAdmin ? `<button class="nav-admin-link" onclick="navigateTo('admin')">Admin</button>` : ''}
            <div class="nav-user-chip">
                <div class="nav-avatar" style="background:${avatarColor(currentUser.initials)}">${currentUser.initials}</div>
                <span class="nav-username">${currentUser.name.split(' ')[0]}</span>
            </div>
            <button class="nav-logout-btn" onclick="handleLogout()" title="Log out">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
            </button>
        `;
  } else {
    el.innerHTML = `
            <button class="nav-login-btn" onclick="navigateTo('auth')">
                Login
            </button>
        `;
  }
}

// ── SUBJECTS (Mapping for AKGEC) ─────────────────────────
const subjects = [
  // Semester 1
  { id: 'maths1', title: 'Mathematics 1', semester: 'Semester 1', icon: '📐', desc: 'Calculus, Sequences, Series & Multi-variable Calculus', color: '#8b5cf6' },
  { id: 'physics', title: 'Physics', semester: 'Semester 1', icon: '⚛️', desc: 'Wave Optics, Quantum Mechanics & Fiber Optics', color: '#3b82f6' },
  { id: 'chemistry', title: 'Chemistry', semester: 'Semester 1', icon: '🧪', desc: 'Atomic Structure, Spectroscopic Techniques & Periodic Properties', color: '#10b981' },
  { id: 'bee', title: 'Basic Electrical Engineering', semester: 'Semester 1', icon: '⚡', desc: 'DC Circuits, AC Circuits, Transformers & Electrical Machines', color: '#f59e0b' },
  { id: 'eng-mech', title: 'Engineering Mechanics', semester: 'Semester 1', icon: '🏗️', desc: 'Force Systems, Equilibrium, Friction & Truss Analysis', color: '#ef4444' },

  // Semester 2 (Example)
  { id: 'maths2', title: 'Mathematics 2', semester: 'Semester 2', icon: '📉', desc: 'Linear Algebra, Differential Equations & Laplace Transforms', color: '#ec4899' },
  { id: 'pps', title: 'Programming for Problem Solving', semester: 'Semester 2', icon: '💻', desc: 'C Programming, Arrays, Functions & Pointers', color: '#06b6d4' },
];

/**
 * ── RICH NOTES DATA (Starting Fresh for MVP) ──
 * All pre-existing sample notes removed as per request.
 * User uploads will populate this object.
 */
let notesBySubject = {
  maths1: [],
  physics: [],
  chemistry: [],
  bee: [],
  'eng-mech': [],
  maths2: [],
  pps: []
};

// ── LEADERBOARD DATA ───────────────────────────────────────
const leaderboardFull = [
  { rank: 4, initials: 'MT', name: 'Meera T.', college: 'NIT Trichy · CSE', pts: '610 pts' },
  { rank: 5, initials: 'RS', name: 'Rahul S.', college: 'IIT Bombay · CSE', pts: '590 pts' },
  { rank: 6, initials: 'AK', name: 'Aditya K.', college: 'BITS Pilani · EE', pts: '524 pts' },
  { rank: 7, initials: 'NP', name: 'Nisha P.', college: 'VIT Vellore · IT', pts: '487 pts' },
  { rank: 8, initials: 'KR', name: 'Kiran R.', college: 'Anna University · Mech', pts: '430 pts' },
];

// ── HELPERS ────────────────────────────────────────────────
function starHTML(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function fmtDownloads(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Avatar color palette based on initials
const avatarColors = {
  RS: '#3b82f6', PR: '#8b5cf6', AM: '#f59e0b', SK: '#10b981',
  MT: '#ef4444', AK: '#06b6d4', NP: '#f97316', KR: '#6366f1',
};
function avatarColor(initials) {
  return avatarColors[initials] || '#3b82f6';
}

// ── NAVIGATION ─────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  currentPage = page;

  const show = id => document.getElementById(id).classList.add('active');
  const nav = id => document.getElementById(id).classList.add('active');

  if (page === 'home') { show('page-home'); nav('nav-home'); }
  else if (page === 'notes') { buildSubjectsPage(); show('page-notes'); nav('nav-home'); }
  else if (page === 'subject') { /* built by openSubject */ show('page-subject'); nav('nav-home'); }
  else if (page === 'upload') { show('page-upload'); nav('nav-upload'); }
  else if (page === 'leaderboard') { buildLeaderboard(); show('page-leaderboard'); nav('nav-leaderboard'); }
  else if (page === 'profile') { buildProfilePage(); show('page-profile'); nav('nav-profile'); }
  else if (page === 'auth') { show('page-auth'); }
  else if (page === 'admin') { buildAdminPanel(); show('page-admin'); }

  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function guardedNavigate(page) {
  if (!currentUser) {
    showToast('Please login to continue 🔒');
    navigateTo('auth');
    return;
  }
  navigateTo(page);
}

// ── HOME ───────────────────────────────────────────────────
function handleExplore() {
  const branch = document.getElementById('selectBranch').value;
  const semester = document.getElementById('selectSemester').value;

  if (!branch || !semester) {
    showToast('Please select Branch & Semester ☝️');
    return;
  }
  selectedFilters = { branch, semester };
  navigateTo('notes');
}

function shakeCard() {
  const card = document.getElementById('filterCard');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'shake .4s ease';
}

// ── SUBJECTS PAGE ──────────────────────────────────────────
function buildSubjectsPage() {
  const container = document.getElementById('subjectGrid');
  const sem = selectedFilters.semester || 'Semester 1';

  // Filter subjects based on selected semester from home page
  const filteredSubjects = subjects.filter(s => s.semester === sem);

  if (filteredSubjects.length === 0) {
    container.innerHTML = `<div class="empty-state">No subjects listed for ${sem} yet.</div>`;
    return;
  }

  container.innerHTML = filteredSubjects.map(s => `
    <div class="subject-card" onclick="openSubject('${s.id}')">
        <div class="subject-icon" style="background:${s.color}15; color:${s.color}">${s.icon}</div>
        <div class="subject-title">${s.title}</div>
        <p class="subject-desc">${s.desc}</p>
        <div class="subject-footer">
            <span class="sub-notes">Click to open</span>
            <span class="sub-sem">${s.semester}</span>
        </div>
    </div>
  `).join('');

  document.getElementById('notesSubtitle').textContent =
    `${selectedFilters.branch || 'General'} · ${sem}`;
}

// ── SUBJECT / NOTES DETAIL PAGE ────────────────────────────
function openSubject(id) {
  const subj = subjects.find(s => s.id === id);
  if (!subj) return;

  activeSubjectId = id;
  notesSortMode = 'latest';
  notesSearchQ = '';

  // Populate header
  document.getElementById('subjectTitle').textContent = `${subj.icon} ${subj.title}`;
  document.getElementById('subjectMeta').textContent = `${subj.semester} · AKGEC`;

  // Reset controls
  document.getElementById('noteSearchInput').value = '';
  document.getElementById('sortSelect').value = 'latest';

  renderNoteCards();
  navigateTo('subject');
}

function renderNoteCards() {
  const allNotes = notesBySubject[activeSubjectId] || [];
  const q = notesSearchQ.toLowerCase();

  // 1. Filter by search + status (if not admin/profile context)
  let filtered = allNotes.filter(n => {
    // Only show approved notes in the subject list
    if (n.status && n.status !== 'approved') return false;

    return n.title.toLowerCase().includes(q) ||
      n.chapter.toLowerCase().includes(q);
  });

  // 2. Sort
  if (notesSortMode === 'top-rated') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (notesSortMode === 'most-downloaded') filtered = [...filtered].sort((a, b) => b.downloads - a.downloads);
  else /* latest */                         filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const container = document.getElementById('noteCards');

  // Result count
  document.getElementById('noteResultCount').textContent =
    `${filtered.length} note${filtered.length !== 1 ? 's' : ''} found`;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No notes available yet. Be the first to upload.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(n => {
    const stars = n.rating;
    const fullS = Math.floor(stars);
    const halfS = stars % 1 >= 0.5 ? 1 : 0;
    const emptyS = 5 - fullS - halfS;

    const starsHTML =
      '<span class="star full">★</span>'.repeat(fullS) +
      (halfS ? '<span class="star half">⯨</span>' : '') +
      '<span class="star empty">☆</span>'.repeat(emptyS);

    const tagBadges = n.tags.map(t => {
      const cls = t === 'Top Rated' ? 'tag-rated' : t === 'Most Downloaded' ? 'tag-dl' : '';
      return `<span class="note-tag ${cls}">${t}</span>`;
    }).join('');

    return `
      <div class="note-card" id="note-${n.id}">
        <div class="note-card-left">
          <div class="note-card-icon" style="background:var(--subj-color,#3b82f6)">
            📄
          </div>
        </div>
        <div class="note-card-body">
          <div class="note-card-top">
            <div>
              <div class="note-card-title">${n.title}</div>
              <div class="note-card-chapter">${n.chapter}</div>
            </div>
            ${tagBadges ? `<div class="note-tags">${tagBadges}</div>` : ''}
          </div>

          <div class="note-card-meta">
            <div class="note-rating" title="${n.rating} / 5">
              <span class="stars-row">${starsHTML}</span>
              <span class="rating-num">${n.rating.toFixed(1)}</span>
            </div>
            <span class="note-dot">·</span>
            <span class="note-info-item">⬇ ${fmtDownloads(n.downloads)} downloads</span>
            <span class="note-dot">·</span>
            <span class="note-info-item">📄 ${n.pages} pages</span>
            <span class="note-dot">·</span>
            <span class="note-info-item">💾 ${n.size}</span>
          </div>

          <div class="note-card-footer">
            <div class="note-by">
              <div class="note-avatar" style="background:${avatarColor(n.avatar)}">${n.avatar}</div>
              <span>${n.by}</span>
              <span class="note-date">· ${fmtDate(n.date)}</span>
            </div>
            <div class="note-actions-row">
              <button class="btn-view-pdf" onclick="viewPDF('${n.id}'); event.stopPropagation()">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                View PDF
              </button>
              <button class="btn-download-note" onclick="downloadNote('${n.id}'); event.stopPropagation()" title="Download">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Sort & search handlers (called from HTML)
function onNotesSort() {
  notesSortMode = document.getElementById('sortSelect').value;
  renderNoteCards();
}

function onNotesSearch() {
  notesSearchQ = document.getElementById('noteSearchInput').value;
  renderNoteCards();
}

function viewPDF(id) {
  const subj = subjects.find(s => s.id === activeSubjectId);
  const notes = notesBySubject[activeSubjectId] || [];
  const note = notes.find(n => n.id === id);
  if (!note) return;
  showToast(`📖 Opening "${note.title}"…`);
}

function downloadNote(id) {
  const notes = notesBySubject[activeSubjectId] || [];
  const note = notes.find(n => n.id === id);
  if (!note) return;
  // Simulate download count bump
  note.downloads++;
  showToast(`⬇ Downloading "${note.title}"…`);
  renderNoteCards();
}

// ── PROFILE ────────────────────────────────────────────────
function buildProfilePage() {
  if (!currentUser) return navigateTo('auth');

  const container = document.getElementById('page-profile');
  if (!container) return;

  // Gathering all user notes
  let userNotes = [];
  for (const sid in notesBySubject) {
    const list = notesBySubject[sid];
    list.forEach(n => {
      // Small trick: user name might be different but email is key?
      // For MVP, we match by 'by' field which is current name
      if (n.by === currentUser.name) {
        userNotes.push({ ...n, subjectId: sid });
      }
    });
  }

  const approved = userNotes.filter(n => n.status === 'approved').length;
  const pending = userNotes.filter(n => n.status === 'pending').length;

  container.innerHTML = `
    <div class="container profile-container">
        <div class="profile-hero">
            <div class="profile-avatar-lg" style="background:${avatarColor(currentUser.initials)}">${currentUser.initials}</div>
            <h2 class="profile-name">${currentUser.name}</h2>
            <p class="profile-college">${currentUser.email}</p>
            <div class="profile-badges">
                ${approved > 0 ? `<span class="badge" style="background:#f0fdf4; color:#16a34a; border-color:#bbf7d0">Contributor</span>` : ''}
                ${pending > 0 ? `<span class="badge" style="background:#fffbeb; color:#d97706; border-color:#fef3c7">Pending Review</span>` : ''}
                <span class="badge">AKGEC Student</span>
            </div>
        </div>

        <div class="profile-stats">
            <div class="pstat"><span class="pstat-n">${userNotes.length}</span><span class="pstat-l">Total Uploads</span></div>
            <div class="pstat"><span class="pstat-n">${approved}</span><span class="pstat-l">Approved</span></div>
            <div class="pstat"><span class="pstat-n">${pending}</span><span class="pstat-l">In Review</span></div>
        </div>

        <div class="profile-section">
            <h3>Recent Uploads</h3>
            <div class="recent-list">
                ${userNotes.length === 0 ? `<div class="empty-state">No uploads yet. Your contributions will appear here.</div>` : ''}
                ${userNotes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(n => `
                    <div class="recent-item">
                        <span class="ri-icon">📄</span>
                        <div style="flex-grow:1">
                            <p class="ri-title">${n.title}</p>
                            <p class="ri-meta">${n.chapter} · ${n.date}</p>
                        </div>
                        <span class="status-chip ${n.status || 'approved'}">${n.status || 'approved'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
  `;
}

// ── LEADERBOARD ────────────────────────────────────────────
function buildLeaderboard() {
  document.getElementById('lbList').innerHTML = leaderboardFull.map(u => `
    <div class="lb-item">
      <div class="lb-rank">#${u.rank}</div>
      <div class="lb-avatar" style="background:${avatarColor(u.initials)}">${u.initials}</div>
      <div class="lb-info">
        <div class="lb-name">${u.name}</div>
        <div class="lb-college">${u.college}</div>
      </div>
      <div class="lb-pts">${u.pts}</div>
    </div>
  `).join('');
}

// ── HAMBURGER ──────────────────────────────────────────────
function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }

// ── TOAST ──────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── NAVBAR SCROLL ──────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

// ── EXTRA ANIMATIONS ───────────────────────────────────────
const extraStyle = document.createElement('style');
extraStyle.textContent = `
@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
}`;
document.head.appendChild(extraStyle);

// ── AUTH LOGIC ────────────────────────────────────────────

function handleLogin(e) {
  e.preventDefault();
  const name = document.getElementById('authName').value;
  const email = document.getElementById('authEmail').value;
  const initials = getInitials(name);

  saveSession({ name, email, initials });
  showToast(`Welcome back, ${name.split(' ')[0]}! 🎉`);
  navigateTo('home');
}

function handleLogout() {
  clearSession();
  showToast('Logged out successfully 👋');
  navigateTo('home');
}

// ── UPLOAD LOGIC ──────────────────────────────────────────
function handleUpload(e) {
  e.preventDefault();
  if (!currentUser) return showToast('Please login to upload 🔒');

  const title = document.getElementById('upTitle').value;
  const subjectId = document.getElementById('upSubject').value;
  const chapter = document.getElementById('upChapter').value;
  const pdfLink = document.getElementById('upPdfLink').value;

  const newNote = {
    id: 'u' + Date.now(),
    title: title,
    chapter: chapter,
    by: currentUser.name,
    avatar: currentUser.initials,
    pages: Math.floor(Math.random() * 20) + 5,
    downloads: 0,
    rating: 0,
    date: new Date().toISOString().split('T')[0],
    size: '1.5 MB',
    tags: ['New'],
    link: pdfLink,
    status: 'pending' // Moderation system
  };

  if (notesBySubject[subjectId]) {
    notesBySubject[subjectId].unshift(newNote);
  }

  document.getElementById('uploadForm').reset();
  showToast('Notes submitted for moderation! ⏳');

  // Navigate to home since it's pending and won't show in the subject list yet
  navigateTo('home');
}

// ── ADMIN LOGIC ──────────────────────────────────────────
function buildAdminPanel() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    navigateTo('home');
    return;
  }

  const container = document.getElementById('adminPendingList');
  let html = '';
  let pendingCount = 0;

  for (const sid in notesBySubject) {
    const subj = subjects.find(s => s.id === sid);
    const pending = notesBySubject[sid].filter(n => n.status === 'pending');

    pending.forEach(n => {
      pendingCount++;
      html += `
                <div class="admin-note-card">
                    <div class="admin-note-header">
                        <div>
                            <span class="admin-subj-badge" style="background:${subj.color}20; color:${subj.color}">${subj.title}</span>
                            <div class="admin-note-title">${n.title}</div>
                            <div class="admin-note-sub">${n.chapter} · By ${n.by}</div>
                        </div>
                        <div class="admin-note-actions">
                            <button class="btn-approve" style="background:#f0f9ff; color:#0369a1; border-color:#bae6fd;" onclick="window.open('${n.link}', '_blank')">View</button>
                            <button class="btn-approve" onclick="approveNote('${sid}', '${n.id}')">Approve</button>
                            <button class="btn-reject" onclick="rejectNote('${sid}', '${n.id}')">Reject</button>
                        </div>
                    </div>
                </div>
            `;
    });
  }

  if (pendingCount === 0) {
    html = `<div class="empty-state">🎉 All caught up! No pending notes.</div>`;
  }

  container.innerHTML = html;
}

function approveNote(sid, nid) {
  const note = notesBySubject[sid].find(n => n.id === nid);
  if (note) {
    note.status = 'approved';
    showToast('Note approved! ✅');

    // Bump notes count for subject
    const subj = subjects.find(s => s.id === sid);
    if (subj) subj.notes++;

    buildAdminPanel();
  }
}

function rejectNote(sid, nid) {
  const note = notesBySubject[sid].find(n => n.id === nid);
  if (note) {
    note.status = 'rejected';
    showToast('Note rejected. ❌');
    buildAdminPanel();
  }
}

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  navigateTo('home');
  buildLeaderboard();
});
