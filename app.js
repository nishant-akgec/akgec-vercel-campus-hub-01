// ── FIREBASE CONFIGURATION ─────────────────────────────────
// IMPORTANT: Replace this with your actual Firebase Project config
const firebaseConfig = {
  apiKey: "AIzaSyDpI7YDY-50cvLb8b9eEorgGwaewAT087E",
  authDomain: "akgec-campus-hub.firebaseapp.com",
  projectId: "akgec-campus-hub",
  storageBucket: "akgec-campus-hub.firebasestorage.app",
  messagingSenderId: "688751079770",
  appId: "1:688751079770:web:e5335b895ad2fd2c0a0363",
  measurementId: "G-JP0GWX64ZB"
};

// Initialize Firebase (will throw errors if config is untouched during network requests, but will load)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// ── STATE ─────────────────────────────────────────────────
let currentPage = 'home';
let selectedFilters = {};
let activeSubjectId = null;
let notesSortMode = 'latest';
let notesSearchQ = '';
const ADMIN_EMAIL = 'admin@campushub.com';
let currentUser = null;

// Listen to Firebase Auth state changes
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        currentUser = { uid: user.uid, email: user.email, ...doc.data() };
        renderNavAuth();
      }
    });
  } else {
    currentUser = null;
    renderNavAuth();
  }
});

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
            <div class="nav-avatar" style="background:${avatarColor(currentUser.initials || 'CH')}">${currentUser.initials || 'U'}</div>
            <span class="nav-username">${(currentUser.name || 'User').split(' ')[0]}</span>
        </div>
        <button class="nav-logout-btn" onclick="handleLogout()" title="Log out">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
        </button>
    `;
  } else {
    el.innerHTML = `<button class="nav-login-btn" onclick="navigateTo('auth')">Login</button>`;
  }
}

// ── SUBJECTS (Mapping for AKGEC) ─────────────────────────
const subjects = [
  // Sem 1
  { id: 'maths1', title: 'Mathematics 1', semester: 'Semester 1', icon: '📐', desc: 'Calculus, Sequences, Series & Multi-variable Calculus', color: '#8b5cf6' },
  { id: 'physics', title: 'Physics', semester: 'Semester 1', icon: '⚛️', desc: 'Wave Optics, Quantum Mechanics & Fiber Optics', color: '#3b82f6' },
  { id: 'chemistry', title: 'Chemistry', semester: 'Semester 1', icon: '🧪', desc: 'Atomic Structure, Spectroscopic Techniques & Periodic Properties', color: '#10b981' },
  { id: 'bee', title: 'Basic Electrical Eng', semester: 'Semester 1', icon: '⚡', desc: 'DC Circuits, AC Circuits, Transformers', color: '#f59e0b' },
  // Sem 2
  { id: 'maths2', title: 'Mathematics 2', semester: 'Semester 2', icon: '📉', desc: 'Linear Algebra, Differential Equations', color: '#ec4899' },
  { id: 'pps', title: 'Prog. for Problem Solving', semester: 'Semester 2', icon: '💻', desc: 'C Programming, Arrays, Functions', color: '#06b6d4' },
  // Sem 3 (CS/IT)
  { id: 'ds', title: 'Data Structures', semester: 'Semester 3', icon: '🗂️', desc: 'Arrays, Trees, Graphs, Algorithms', color: '#f43f5e' },
  { id: 'co', title: 'Computer Organization', semester: 'Semester 3', icon: '🖥️', desc: 'Architecture, Assembly, Logic Gates', color: '#84cc16' },
  { id: 'dstl', title: 'Discrete Structures', semester: 'Semester 3', icon: '🔢', desc: 'Set Theory, Graph Theory, Combinatorics', color: '#14b8a6' },
  // Sem 4 (CS/IT)
  { id: 'os', title: 'Operating Systems', semester: 'Semester 4', icon: '⚙️', desc: 'Processes, Memory, File Systems', color: '#3b82f6' },
  { id: 'tafl', title: 'Theory of Automata', semester: 'Semester 4', icon: '🤖', desc: 'DFA, NFA, Turing Machines', color: '#a855f7' }
];

// Avatar colors
const avatarColors = { RS: '#3b82f6', PR: '#8b5cf6', AM: '#f59e0b', SK: '#10b981', MT: '#ef4444', AK: '#06b6d4', NP: '#f97316', KR: '#6366f1' };
function avatarColor(initials) {
  let chars = initials || 'AB';
  return avatarColors[chars] || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
function fmtDownloads(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString(); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

// ── NAVIGATION ─────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  currentPage = page;
  const show = id => document.getElementById(id).classList.add('active');
  const nav = id => { const el = document.getElementById(id); if (el) el.classList.add('active'); };

  if (page === 'home') { show('page-home'); nav('nav-home'); }
  else if (page === 'notes') { buildSubjectsPage(); show('page-notes'); nav('nav-home'); }
  else if (page === 'subject') { show('page-subject'); nav('nav-home'); }
  else if (page === 'upload') { show('page-upload'); nav('nav-upload'); }
  else if (page === 'leaderboard') { buildLeaderboard(); show('page-leaderboard'); nav('nav-leaderboard'); }
  else if (page === 'profile') { buildProfilePage(); show('page-profile'); nav('nav-profile'); }
  else if (page === 'auth') { show('page-auth'); }
  else if (page === 'admin') { buildAdminPanel(); show('page-admin'); }

  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function guardedNavigate(page) {
  if (!currentUser) { showToast('Please login to continue 🔒'); navigateTo('auth'); return; }
  navigateTo(page);
}

// ── HOME ───────────────────────────────────────────────────
function handleExplore() {
  const branch = document.getElementById('selectBranch').value;
  const semester = document.getElementById('selectSemester').value;
  if (!branch || !semester) { showToast('Please select Branch & Semester ☝️'); return; }
  selectedFilters = { branch, semester };
  navigateTo('notes');
}

// ── SUBJECTS PAGE ──────────────────────────────────────────
function buildSubjectsPage() {
  const container = document.getElementById('subjectGrid');
  const sem = selectedFilters.semester || 'Semester 1';
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
        <div class="subject-footer"><span class="sub-notes">Click to open</span><span class="sub-sem">${s.semester}</span></div>
    </div>
  `).join('');
  document.getElementById('notesSubtitle').textContent = `${selectedFilters.branch || 'General'} · ${sem}`;
}

function filterSubjects() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.subject-card');
  cards.forEach(card => {
    const title = card.querySelector('.subject-title').textContent.toLowerCase();
    const desc = card.querySelector('.subject-desc').textContent.toLowerCase();
    if (title.includes(q) || desc.includes(q)) card.style.display = 'flex';
    else card.style.display = 'none';
  });
}

// ── SUBJECT / NOTES DETAIL PAGE ────────────────────────────
function openSubject(id) {
  const subj = subjects.find(s => s.id === id);
  if (!subj) return;
  activeSubjectId = id;
  notesSortMode = 'latest';
  notesSearchQ = '';

  document.getElementById('subjectTitle').textContent = `${subj.icon} ${subj.title}`;
  document.getElementById('subjectMeta').textContent = `${subj.semester} · AKGEC`;
  document.getElementById('noteSearchInput').value = '';
  document.getElementById('sortSelect').value = 'latest';

  renderNoteCards();
  navigateTo('subject');
}

async function renderNoteCards() {
  const container = document.getElementById('noteCards');
  container.innerHTML = `<div class="empty-state">Loading notes...</div>`;

  try {
    let querySnapshot = await db.collection('notes')
      .where('subject', '==', activeSubjectId)
      .get(); // temporarily removed .where('status', '==', 'approved') for testing

    let allNotes = [];
    querySnapshot.forEach(doc => allNotes.push({ id: doc.id, ...doc.data() }));

    const q = notesSearchQ.toLowerCase();
    let filtered = allNotes.filter(n => n.title.toLowerCase().includes(q) || n.chapter.toLowerCase().includes(q));

    if (notesSortMode === 'top-rated') filtered.sort((a, b) => b.rating - a.rating);
    else if (notesSortMode === 'most-downloaded') filtered.sort((a, b) => b.downloads - a.downloads);
    else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    document.getElementById('noteResultCount').textContent = `${filtered.length} note${filtered.length !== 1 ? 's' : ''} found`;

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No notes available yet. Be the first to upload.</p></div>`;
      return;
    }

    container.innerHTML = filtered.map(n => {
      const fullS = Math.floor(n.rating);
      const halfS = n.rating % 1 >= 0.5 ? 1 : 0;
      const emptyS = 5 - fullS - halfS;
      const starsHTML = '<span class="star full">★</span>'.repeat(fullS) + (halfS ? '<span class="star half">⯨</span>' : '') + '<span class="star empty">☆</span>'.repeat(emptyS);

      const tagBadges = (n.tags || []).map(t => `<span class="note-tag">${t}</span>`).join('');

      return `
        <div class="note-card">
          <div class="note-card-left"><div class="note-card-icon">📄</div></div>
          <div class="note-card-body">
            <div class="note-card-top">
              <div><div class="note-card-title">${n.title}</div><div class="note-card-chapter">${n.chapter}</div></div>
              ${tagBadges ? `<div class="note-tags">${tagBadges}</div>` : ''}
            </div>
            <div class="note-card-meta">
              <div class="note-rating"><span class="stars-row">${starsHTML}</span><span class="rating-num">${(n.rating || 0).toFixed(1)}</span></div>
              <span class="note-dot">·</span><span class="note-info-item">⬇ ${fmtDownloads(n.downloads)} dls</span>
              <span class="note-dot">·</span><span class="note-info-item">📄 ${n.pages || 10} pages</span>
            </div>
            <div class="note-card-footer">
              <div class="note-by">
                <div class="note-avatar" style="background:${avatarColor(n.avatar)}">${n.avatar}</div>
                <span>${n.by}</span><span class="note-date">· ${fmtDate(n.createdAt)}</span>
              </div>
              <div class="note-actions-row">
                <button class="btn-view-pdf" onclick="window.open('${n.pdfLink}', '_blank'); event.stopPropagation()"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> View</button>
                <button class="btn-download-note" onclick="downloadNote('${n.id}'); event.stopPropagation()" title="Download"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Error loading notes. Did you configure Firebase?</div>`;
  }
}

function onNotesSort() { notesSortMode = document.getElementById('sortSelect').value; renderNoteCards(); }
function onNotesSearch() { notesSearchQ = document.getElementById('noteSearchInput').value; renderNoteCards(); }

async function downloadNote(id) {
  try {
    const docRef = db.collection('notes').doc(id);
    await docRef.update({ downloads: firebase.firestore.FieldValue.increment(1) });
    showToast(`⬇ Download metric registered.`);
  } catch (e) { /* ignore */ }
}

// ── PROFILE ────────────────────────────────────────────────
async function buildProfilePage() {
  if (!currentUser) return navigateTo('auth');
  const container = document.getElementById('page-profile');
  if (!container) return;

  container.innerHTML = `<div class="container profile-container"><div class="empty-state">Loading Profile...</div></div>`;

  try {
    const snaps = await db.collection('notes').where('userId', '==', currentUser.uid).get();
    let userNotes = [];
    snaps.forEach(d => userNotes.push({ id: d.id, ...d.data() }));

    const approved = userNotes.filter(n => n.status === 'approved').length;
    const pending = userNotes.filter(n => n.status === 'pending').length;

    container.innerHTML = `
      <div class="container profile-container">
          <div class="profile-hero">
              <div class="profile-avatar-lg" style="background:${avatarColor(currentUser.initials)}">${currentUser.initials}</div>
              <h2 class="profile-name">${currentUser.name}</h2>
              <p class="profile-college">${currentUser.college || currentUser.email}</p>
          </div>
          <div class="profile-stats">
              <div class="pstat"><span class="pstat-n">${userNotes.length}</span><span class="pstat-l">Total Uploads</span></div>
              <div class="pstat"><span class="pstat-n">${approved}</span><span class="pstat-l">Approved</span></div>
              <div class="pstat"><span class="pstat-n">${currentUser.points || 0}</span><span class="pstat-l">Points</span></div>
          </div>
          <div class="profile-section">
              <h3>Recent Uploads</h3>
              <div class="recent-list">
                  ${userNotes.length === 0 ? `<div class="empty-state">No uploads yet.</div>` : ''}
                  ${userNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(n => `
                      <div class="recent-item">
                          <span class="ri-icon">📄</span><div style="flex-grow:1"><p class="ri-title">${n.title}</p><p class="ri-meta">${n.chapter} · ${(n.createdAt || '').substring(0, 10)}</p></div>
                          <span class="status-chip ${n.status || 'approved'}">${n.status || 'approved'}</span>
                      </div>
                  `).join('')}
              </div>
          </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="container profile-container"><div class="empty-state">Error Loading Profile. Check Firebase configuration.</div></div>`;
  }
}

// ── LEADERBOARD ────────────────────────────────────────────
async function buildLeaderboard() {
  document.getElementById('lbList').innerHTML = `<div class="empty-state">Loading Leaderboard...</div>`;
  try {
    const snaps = await db.collection('users').orderBy('points', 'desc').limit(10).get();
    let lb = [];
    snaps.forEach(d => lb.push(d.data()));

    document.getElementById('lbList').innerHTML = lb.map((u, i) => `
      <div class="lb-item">
        <div class="lb-rank">#${i + 1}</div>
        <div class="lb-avatar" style="background:${avatarColor(u.initials)}">${u.initials}</div>
        <div class="lb-info"><div class="lb-name">${u.name}</div><div class="lb-college">${u.college || 'AKGEC'}</div></div>
        <div class="lb-pts">${u.points || 0} pts</div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('lbList').innerHTML = `<div class="empty-state">Please connect Firebase to see real users.</div>`;
  }
}

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

window.addEventListener('scroll', () => { document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10); });

// ── AUTH LOGIC ────────────────────────────────────────────
function switchAuthTab(type) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`tab-${type}`).classList.add('active');
  document.getElementById(`form-${type}`).classList.add('active');
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🔒'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const pw = document.getElementById('signupPassword').value;
  const college = document.getElementById('signupCollege').value;
  const errorEl = document.getElementById('signupError');
  errorEl.textContent = '';

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    const initials = getInitials(name);
    await db.collection('users').doc(cred.user.uid).set({
      name, email, college, initials, points: 0, uploads: 0
    });
    showToast(`Welcome, ${name.split(' ')[0]}! 🎉`);
    document.getElementById('form-signup').reset();
    navigateTo('home');
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pw = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  try {
    await auth.signInWithEmailAndPassword(email, pw);
    showToast(`Welcome back!`);
    document.getElementById('form-login').reset();
    navigateTo('home');
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleLogout() {
  await auth.signOut();
  showToast('Logged out successfully 👋');
  navigateTo('home');
}

// ── UPLOAD LOGIC ──────────────────────────────────────────
async function handleUpload(e) {
  e.preventDefault();
  if (!currentUser) return showToast('Please login to upload 🔒');

  const title = document.getElementById('upTitle').value;
  const subjectId = document.getElementById('upSubject').value;
  const chapter = document.getElementById('upChapter').value;
  let pdfLink = document.getElementById('upDriveLink').value.trim();
  const fileInput = document.getElementById('upPdfFile');
  const file = fileInput.files ? fileInput.files[0] : null;

  if (!file && !pdfLink) {
    return showToast('Please upload a file OR paste a link 📂');
  }

  const uploadBtn = document.querySelector('#uploadForm button[type="submit"]');
  const originalText = uploadBtn.textContent;
  uploadBtn.textContent = 'Submitting note... ⏳';
  uploadBtn.disabled = true;

  try {
    let sizeMb = 'Unknown';
    if (file) {
      uploadBtn.textContent = 'Uploading file... ⏳';
      const storageRef = storage.ref(`notes/${Date.now()}_${file.name}`);
      await storageRef.put(file);
      pdfLink = await storageRef.getDownloadURL();
      sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    } else if (pdfLink && !pdfLink.includes('http')) {
      throw new Error('Please enter a valid HTTP link!');
    }

    // Save note entry inside Firestore
    await db.collection('notes').add({
      title, subject: subjectId, chapter, pdfLink,
      userId: currentUser.uid,
      by: currentUser.name,
      avatar: currentUser.initials,
      downloads: 0, rating: 0, pages: 10, size: sizeMb,
      tags: ['New'],
      createdAt: new Date().toISOString(),
      status: 'pending' // Admin must approve (temporarily showing all notes)
    });

    console.log('Upload Success!', { title, subjectId, pdfLink });
    document.getElementById('uploadForm').reset();
    showToast('Note uploaded successfully ✅');
    navigateTo('home');
  } catch (err) {
    console.error('Upload Error:', err);
    showToast('Upload failed: ' + err.message);
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

// ── ADMIN LOGIC ──────────────────────────────────────────
async function buildAdminPanel() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) { navigateTo('home'); return; }
  const container = document.getElementById('adminPendingList');
  container.innerHTML = `<div class="empty-state">Loading queue...</div>`;

  try {
    const snaps = await db.collection('notes').orderBy('createdAt', 'desc').get();
    let allNotes = [];
    snaps.forEach(d => allNotes.push({ id: d.id, ...d.data() }));

    if (allNotes.length === 0) {
      container.innerHTML = `<div class="empty-state">🎉 No notes found in database.</div>`;
    } else {
      container.innerHTML = allNotes.map(n => {
        const subj = subjects.find(s => s.id === n.subject) || { title: 'Unknown', color: '#000' };
        const isAppr = n.status === 'approved';
        return `
          <div class="admin-note-card">
              <div class="admin-note-header">
                  <div>
                      <span class="admin-subj-badge" style="background:${subj.color}20; color:${subj.color}">${subj.title}</span>
                      <span class="status-chip ${n.status}" style="margin-left:8px;">${n.status}</span>
                      <div class="admin-note-title">${n.title}</div>
                      <div class="admin-note-sub">${n.chapter} · By ${n.by} · ${fmtDate(n.createdAt)}</div>
                  </div>
                  <div class="admin-note-actions">
                      <button class="btn-approve" style="background:#f0f9ff; color:#0369a1; border-color:#bae6fd;" onclick="window.open('${n.pdfLink}', '_blank')">View</button>
                      ${!isAppr ? `<button class="btn-approve" onclick="approveNote('${n.id}', '${n.userId}')">Approve</button>` : ''}
                      <button class="btn-reject" onclick="rejectNote('${n.id}')">Delete</button>
                  </div>
              </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Error fetching moderation queue.</div>`;
  }
}

async function approveNote(noteId, userId) {
  try {
    await db.collection('notes').doc(noteId).update({ status: 'approved' });
    // Give user 10 points
    await db.collection('users').doc(userId).update({
      points: firebase.firestore.FieldValue.increment(10),
      uploads: firebase.firestore.FieldValue.increment(1)
    });
    showToast('Note approved! User earned 10 points ✅');
    buildAdminPanel();
  } catch (err) { showToast('Error: ' + err.message); }
}

async function rejectNote(noteId) {
  try {
    await db.collection('notes').doc(noteId).delete();
    showToast('Note rejected and deleted permanently. 🗑️');
    buildAdminPanel();
  } catch (err) { showToast('Error: ' + err.message); }
}

// ── DARK MODE ───────────────────────────────────────────
function toggleDarkMode() {
  const lamp = document.getElementById('lampToggle');
  if (lamp) {
    lamp.classList.add('pulling');
    setTimeout(() => lamp.classList.remove('pulling'), 300);
  }

  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('campushub_dark_mode', isDark);
}

// Init dark mode (default to true as requested)
if (localStorage.getItem('campushub_dark_mode') !== 'false') {
  document.body.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => { navigateTo('home'); });
