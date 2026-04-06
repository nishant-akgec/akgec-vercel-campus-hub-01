// ── FIREBASE CONFIG ─────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDpI7YDY-50cvLb8b9eEorgGwaewAT087E",
  authDomain: "akgec-campus-hub.firebaseapp.com",
  projectId: "akgec-campus-hub",
  storageBucket: "akgec-campus-hub.firebasestorage.app",
  messagingSenderId: "688751079770",
  appId: "1:688751079770:web:e5335b895ad2fd2c0a0363"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ── CONSTANTS ───────────────────────────────────────────
const ADMIN_EMAIL = 'nishantsingh2206@gmail.com';
const ADMIN_UID   = ''; // set this to your Firebase UID

// ── STATE ───────────────────────────────────────────────
let currentUser = null;
let currentPage = 'home';
let selState = { college: '', course: '', branch: '', semester: '' };
let activeSubject = null;
let notesSearchQ = '';
let notesSortMode = 'latest';
let adminFilterMode = 'all';
let allAdminNotes = [];
let communityPosts = [];

// ── DATA: AKTU COLLEGES ────────────────────────────────
const aktuColleges = [
  "AKGEC – Ajay Kumar Garg Engineering College, Ghaziabad",
  "ABES Engineering College, Ghaziabad",
  "GL Bajaj Institute of Technology, Greater Noida",
  "Galgotias College of Engineering, Greater Noida",
  "IMS Engineering College, Ghaziabad",
  "JSS Academy of Technical Education, Noida",
  "Sharda University, Greater Noida",
  "Amity University, Noida",
  "KIET Group of Institutions, Ghaziabad",
  "Raj Kumar Goel Institute of Technology, Ghaziabad",
  "GLA University, Mathura",
  "Bundelkhand University, Jhansi",
  "Dr. A.P.J. Abdul Kalam Technical University, Lucknow",
  "Harcourt Butler Technical University, Kanpur",
  "Madan Mohan Malaviya University of Technology, Gorakhpur",
  "Lucknow University – Engineering",
  "BBDU – Babu Banarasi Das University, Lucknow",
  "Invertis University, Bareilly",
  "Teerthanker Mahaveer University, Moradabad",
  "IET – Institute of Engineering & Technology, Lucknow",
  "Rama University, Kanpur",
  "NIET – Noida Institute of Engineering & Technology",
  "HMR Institute of Technology, Delhi",
  "IIMT Engineering College, Meerut",
  "Other College (Type manually)"
];

const courses = ['B.Tech', 'BCA', 'MCA', 'B.Sc (CS)', 'MBA', 'Diploma'];

const branches = {
  'B.Tech': ['CSE','CSE (AI & ML)','CSE (Data Science)','IT','ECE','EE','ME','Civil','Chemical','Bio-Tech'],
  'BCA': ['BCA'],
  'MCA': ['MCA'],
  'B.Sc (CS)': ['Computer Science','IT'],
  'MBA': ['MBA (Tech)', 'MBA (Finance)'],
  'Diploma': ['CSE','ME','Civil','ECE']
};

// Subjects per sem per branch (AKTU pattern)
const subjectMap = {
  'CSE': {
    'Semester 1': ['Mathematics-I','Physics','Basic Electrical Engg','Programming for Problem Solving','English & Soft Skills'],
    'Semester 2': ['Mathematics-II','Chemistry','Basic Electronics','Data Structures','Engineering Graphics'],
    'Semester 3': ['Discrete Structures','Computer Organization','OOPS w/ JAVA','Operating Systems','Economics for Engg'],
    'Semester 4': ['Theory of Automata','DBMS','Computer Networks','Software Engineering','Design & Analysis of Algos'],
    'Semester 5': ['Compiler Design','AI','Web Technologies','CN-II','Industrial Training'],
    'Semester 6': ['Machine Learning','Cloud Computing','Mobile Computing','Information Security','Elective-I'],
    'Semester 7': ['Deep Learning','NLP','IoT','Project-I','Elective-II'],
    'Semester 8': ['Major Project','Seminar','Elective-III','Industrial Training-II','Placement Training']
  },
  'IT': {
    'Semester 1': ['Mathematics-I','Physics','Basic Electrical Engg','Programming for Problem Solving','English & Soft Skills'],
    'Semester 2': ['Mathematics-II','Chemistry','Data Structures','Digital Electronics','Engineering Graphics'],
    'Semester 3': ['Discrete Math','Computer Architecture','OOP with C++','Operating Systems','Microprocessors'],
    'Semester 4': ['DBMS','Software Engineering','Computer Networks','DAA','Unix Programming'],
    'Semester 5': ['Web Technology','Compiler Design','AI','Mobile Applications','Seminar'],
    'Semester 6': ['Information Security','Cloud Computing','ML','Elective-I','Mini Project'],
    'Semester 7': ['Big Data','Deep Learning','IoT','Elective-II','Project-I'],
    'Semester 8': ['Major Project','Elective-III','Industrial Training','Seminar','Placement Training']
  },
  'ECE': {
    'Semester 1': ['Mathematics-I','Physics','Basic Electrical Engg','EG','English'],
    'Semester 2': ['Mathematics-II','Chemistry','Digital Electronics','Network Theory','EMT'],
    'Semester 3': ['Signals & Systems','Electronic Devices','Analog Circuits','Communication Engg-I','Microprocessors'],
    'Semester 4': ['VLSI Design','DSP','Communication Engg-II','Control Systems','PCM'],
    'Semester 5': ['Microwave Engineering','Fiber Optics','Embedded Systems','Information Theory','Mini Project'],
    'Semester 6': ['Wireless Communication','OFDM','Mobile Communication','Elective-I','Project'],
    'Semester 7': ['5G Networks','RADAR','Satellite Communication','Elective-II','Project-I'],
    'Semester 8': ['Major Project','Seminar','Elective-III','Training','Placement']
  }
};

const subjectIcons = ['📐','⚛️','🧪','💻','📊','🗂️','🖥️','🔢','🤖','⚙️','🌐','🔐','📱','🧠','📡'];

function getSubjects(branch, semester) {
  const clean = branch.replace(/\s*\(.*\)/, '').trim();
  const map = subjectMap[clean] || subjectMap['CSE'];
  return map[semester] || ['Subject 1','Subject 2','Subject 3','Subject 4','Subject 5'];
}

// ── DARK MODE ───────────────────────────────────────────
function toggleDarkMode() {
  const lamp = document.getElementById('lampToggle');
  lamp.classList.add('pulled');
  setTimeout(() => lamp.classList.remove('pulled'), 350);

  const isDark = document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode', !isDark);
  localStorage.setItem('campx_dark', isDark);
}

function initTheme() {
  const saved = localStorage.getItem('campx_dark');
  if (saved === null || saved === 'true') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }
}
initTheme();

// ── PARTICLES ──────────────────────────────────────────
function initParticles() {
  const p = document.getElementById('heroParticles');
  if (!p) return;
  p.innerHTML = '';
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = Math.random() * 5 + 3;
    const colors = ['#7c3aed','#3b82f6','#a78bfa','#60a5fa','#10b981'];
    el.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*12+8}s;
      animation-delay:${Math.random()*8}s;
    `;
    p.appendChild(el);
  }
}

// ── AUTH STATE ──────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        currentUser = { uid: user.uid, email: user.email, ...doc.data() };
      } else {
        currentUser = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          initials: getInitials(user.displayName || user.email),
          college: '', points: 0, uploads: 0
        };
        db.collection('users').doc(user.uid).set({ ...currentUser });
      }
      renderNavAuth();
      loadStats();
      loadRecentNotes();
    });
  } else {
    currentUser = null;
    renderNavAuth();
    loadRecentNotes();
    loadStats();
  }
});

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

function renderNavAuth() {
  const el = document.getElementById('navAuth');
  if (!el) return;
  if (currentUser) {
    const isAdmin = currentUser.email === ADMIN_EMAIL;
    el.innerHTML = `
      ${isAdmin ? `<button class="nav-admin-btn" onclick="navigateTo('admin')">🛡️ Admin</button>` : ''}
      <div class="nav-user-chip" onclick="navigateTo('profile')" style="cursor:pointer" title="My Profile">
        <div class="nav-avatar">${currentUser.initials || '👤'}</div>
        <span class="nav-username">${(currentUser.name || 'User').split(' ')[0]}</span>
      </div>
      <button class="nav-logout-btn" onclick="handleLogout()">Logout</button>
    `;
  } else {
    el.innerHTML = `<button class="nav-login-btn" onclick="navigateTo('auth')">Login / Sign Up</button>`;
  }
}

// ── NAVIGATION ─────────────────────────────────────────
function navigateTo(page) {
  // Check premium eligibility (100+ pts = premium, or explicit isPremium flag)
  const isUserPremium = currentUser && (currentUser.isPremium || (currentUser.points || 0) >= 100);

  if (page === 'community' && !isUserPremium) {
    showToast('Community 💬 is for Premium members only! (Get 100 pts for free access)');
    navigateTo('premium');
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const pg = document.getElementById(`page-${page}`);
  if (pg) pg.classList.add('active');
  const nl = document.getElementById(`nav-${page}`);
  if (nl) nl.classList.add('active');

  currentPage = page;

  if (page === 'home') { initParticles(); loadRecentNotes(); loadStats(); }
  if (page === 'leaderboard') loadLeaderboard();
  if (page === 'profile') buildProfile();
  if (page === 'admin') buildAdmin();
  if (page === 'explore') buildExplore();
  if (page === 'community') loadCommunity();
  if (page === 'upload') prefillUploadForm();

  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prefillUploadForm() {
  if (!currentUser) return;
  const fields = {
    'upCollege': currentUser.college || '',
    'upCourse': currentUser.course || '',
    'upBranch': currentUser.branch || ''
  };
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el && val && !el.value) el.value = val;
  }
}

function guardedNavigate(page) {
  if (!currentUser) {
    showToast('Please login to continue 🔒');
    navigateTo('auth');
    return;
  }
  navigateTo(page);
}

// ── STATS ───────────────────────────────────────────────
async function loadStats() {
  try {
    const snap = await db.collection('notes').where('status', '==', 'approved').get();
    const el = document.getElementById('statNotes');
    if (el) el.textContent = (snap.size || 0) + '+';

    const usnap = await db.collection('users').get();
    const uel = document.getElementById('statUsers');
    if (uel) uel.textContent = (usnap.size || 0) + '+';
  } catch (e) { /* silent */ }
}

// ── RECENT NOTES (client-side filter/sort – no composite index needed) ───
async function loadRecentNotes() {
  const grid = document.getElementById('recentNotesGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="notes-loading">⏳ Loading recent notes...</div>';
  try {
    const snap = await db.collection('notes').limit(60).get();
    let notes = [];
    snap.forEach(d => notes.push({ id: d.id, ...d.data() }));
    notes = notes.filter(n => n.status === 'approved')
                 .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                 .slice(0, 6);

    if (!notes.length) {
      grid.innerHTML = '<div class="notes-loading">📦 No notes approved yet. Upload &amp; get admin approval!</div>';
      return;
    }

    grid.innerHTML = notes.map(n => `
      <div class="recent-note-card" onclick="quickViewNote('${n.id}','${n.pdfLink}')">
        <div class="rnc-icon">📄</div>
        <div class="rnc-body">
          <div class="rnc-title">${n.title || 'Untitled'}</div>
          <div class="rnc-meta">${n.branch || ''} · ${n.semester || ''} · ${n.subject || ''}</div>
          <span class="rnc-badge approved">✓ Approved</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Recent notes error:', e);
    grid.innerHTML = '<div class="notes-loading">⚠️ Could not load notes.</div>';
  }
}

function quickViewNote(id, pdfLink) {
  if (!pdfLink) {
    showToast('Error: This note has no valid link! ❌');
    return;
  }
  
  // Track download/view in DB
  downloadNote(id);

  // If it's a Google Drive link, ensure it opens correctly
  let finalLink = pdfLink;
  if (pdfLink.includes('drive.google.com') && pdfLink.includes('/view')) {
    finalLink = pdfLink.replace('/view', '/preview'); // Better for embedding/viewing
  }

  window.open(finalLink, '_blank');
}

// ── HERO SEARCH ─────────────────────────────────────────
function handleHeroSearch() {
  const q = document.getElementById('heroSearch').value.toLowerCase();
  const dd = document.getElementById('searchDropdown');
  if (!q || q.length < 2) { dd.classList.remove('visible'); return; }

  const results = aktuColleges.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
  if (!results.length) { dd.classList.remove('visible'); return; }

  dd.innerHTML = results.map(c => `
    <div class="sdrop-item" onclick="selectCollegeFromSearch('${c.replace(/'/g,"\\'")}')">🏫 ${c}</div>
  `).join('');
  dd.classList.add('visible');
}

function selectCollegeFromSearch(college) {
  const dd = document.getElementById('searchDropdown');
  dd.classList.remove('visible');
  document.getElementById('heroSearch').value = college;
  selState.college = college;
  navigateTo('explore');
  setTimeout(() => {
    goSelStep(2);
    document.getElementById('sstep-1').classList.add('done');
    renderCourses();
  }, 400);
}

// ── EXPLORE / SELECTOR ──────────────────────────────────
function buildExplore() {
  goSelStep(1);
  renderColleges();
}

function goSelStep(n) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`sel-${i}`)?.classList.toggle('active', i === n);
    document.getElementById(`sstep-${i}`)?.classList.toggle('active', i === n);
  }
}

function renderColleges() {
  const list = document.getElementById('collegeList');
  const q = (document.getElementById('collegeSearch')?.value || '').toLowerCase();
  const filtered = aktuColleges.filter(c => !q || c.toLowerCase().includes(q));
  list.innerHTML = filtered.map(c => `
    <div class="college-item ${selState.college === c ? 'selected' : ''}" onclick="selectCollege('${c.replace(/'/g,"\\'")}')">
      🏫 ${c}
    </div>
  `).join('');
}

function filterColleges() { renderColleges(); }

function selectCollege(college) {
  selState.college = college;
  document.getElementById('sstep-1').classList.add('done');
  goSelStep(2);
  renderCourses();
}

function renderCourses() {
  document.getElementById('courseList').innerHTML = courses.map(c => `
    <button class="option-btn ${selState.course === c ? 'selected' : ''}" onclick="selectCourse('${c}')">${c}</button>
  `).join('');
}

function selectCourse(course) {
  selState.course = course;
  document.getElementById('sstep-2').classList.add('done');
  goSelStep(3);
  renderBranches();
}

function renderBranches() {
  const brList = branches[selState.course] || branches['B.Tech'];
  document.getElementById('branchList').innerHTML = brList.map(b => `
    <button class="option-btn ${selState.branch === b ? 'selected' : ''}" onclick="selectBranch('${b}')">${b}</button>
  `).join('');
}

function selectBranch(branch) {
  selState.branch = branch;
  document.getElementById('sstep-3').classList.add('done');
  goSelStep(4);
  renderSemesters();
}

function renderSemesters() {
  document.getElementById('semGrid').innerHTML = Array.from({ length: 8 }, (_, i) => `
    <button class="sem-btn" onclick="selectSemester('Semester ${i+1}')">
      <span class="sem-num">${i+1}</span>
      <span class="sem-label">Sem</span>
    </button>
  `).join('');
}

function selectSemester(sem) {
  selState.semester = sem;
  buildSubjectsPage();
}

// ── SUBJECTS ───────────────────────────────────────────
function buildSubjectsPage() {
  const subjects = getSubjects(selState.branch, selState.semester);

  document.getElementById('subjectsPageTitle').textContent = `📚 Subjects`;
  document.getElementById('subjectsPageMeta').textContent =
    `${selState.college.split('–')[0].trim()} · ${selState.course} ${selState.branch} · ${selState.semester}`;

  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = subjects.map((s, i) => {
    const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    const color = colors[i % colors.length];
    return `
      <div class="subj-card" onclick="openSubject('${s.replace(/'/g,"\\'")}')">
        <div class="subj-icon-wrap" style="background:${color}22">${subjectIcons[i % subjectIcons.length]}</div>
        <div class="subj-name">${s}</div>
        <div class="subj-meta">${selState.semester} · ${selState.branch}</div>
        <div class="subj-arrow">→</div>
      </div>
    `;
  }).join('');

  navigateTo('subjects');
}

// ── NOTES PAGE ─────────────────────────────────────────
function openSubject(subject) {
  activeSubject = subject;
  notesSearchQ = '';
  notesSortMode = 'latest';

  document.getElementById('notesPageTitle').textContent = `📄 ${subject}`;
  document.getElementById('notesPageMeta').textContent =
    `${selState.college.split('–')[0].trim()} · ${selState.course} ${selState.branch} · ${selState.semester}`;

  document.getElementById('noteSearchInput').value = '';
  document.getElementById('notesSortSelect').value = 'latest';

  navigateTo('notes');
  renderNotes();
}

async function renderNotes() {
  const list = document.getElementById('notesList');
  const countEl = document.getElementById('noteResultCount');
  list.innerHTML = '<div class="empty-state"><div class="es-icon">⏳</div><p>Loading notes...</p></div>';
  countEl.textContent = '';

  try {
    // Only show approved notes – client-side filter (no composite index needed)
    const snap = await db.collection('notes')
      .where('subject', '==', activeSubject)
      .get();

    let notes = [];
    snap.forEach(d => notes.push({ id: d.id, ...d.data() }));
    // Filter approved only on client
    notes = notes.filter(n => n.status === 'approved');
    console.log('Fetched approved notes:', notes.length);

    // Filter by search
    if (notesSearchQ) {
      const q = notesSearchQ.toLowerCase();
      notes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.chapter || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (notesSortMode === 'top') notes.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else if (notesSortMode === 'downloads') notes.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    else notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    countEl.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''} found`;

    if (!notes.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="es-icon">📭</div>
          <p>No notes yet for ${activeSubject}.<br>Be the first to upload!</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notes.map(n => {
      const liked = (currentUser && (n.likedBy || []).includes(currentUser.uid));
      return `
        <div class="note-card">
          <div class="nc-icon">📄</div>
          <div class="nc-body">
            <div class="nc-title">${n.title || 'Untitled'}</div>
            <div class="nc-meta">
              <span>By ${n.by || 'Anonymous'}</span>
              <span class="nc-dot">·</span>
              <span>${n.chapter || 'General'}</span>
              <span class="nc-dot">·</span>
              <span>⬇ ${n.downloads || 0}</span>
              <span class="nc-dot">·</span>
              <span>❤️ ${n.likes || 0}</span>
            </div>
          </div>
          <div class="nc-actions">
            <button class="like-btn ${liked ? 'liked' : ''}" onclick="likeNote('${n.id}')">❤️ ${n.likes || 0}</button>
            <button class="btn-view" onclick="quickViewNote('${n.id}', '${n.pdfLink}')">👁 View</button>
            <button class="btn-dl" onclick="quickViewNote('${n.id}', '${n.pdfLink}')">⬇ Save</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Notes fetch error:', err);
    list.innerHTML = '<div class="empty-state"><div class="es-icon">⚠️</div><p>Error loading notes. Check your connection.</p></div>';
  }
}

function onNotesSearch() { notesSearchQ = document.getElementById('noteSearchInput').value; renderNotes(); }
function onNotesSort() { notesSortMode = document.getElementById('notesSortSelect').value; renderNotes(); }

async function likeNote(id) {
  if (!currentUser) { showToast('Login to like notes!'); return; }
  try {
    const ref = db.collection('notes').doc(id);
    const doc = await ref.get();
    const data = doc.data();
    const likedBy = data.likedBy || [];
    if (likedBy.includes(currentUser.uid)) {
      await ref.update({ likes: (data.likes || 1) - 1, likedBy: likedBy.filter(u => u !== currentUser.uid) });
    } else {
      await ref.update({ likes: (data.likes || 0) + 1, likedBy: [...likedBy, currentUser.uid] });
    }
    renderNotes();
  } catch (e) { showToast('Error: ' + e.message); }
}

async function downloadNote(id) {
  try {
    await db.collection('notes').doc(id).update({ downloads: firebase.firestore.FieldValue.increment(1) });
    showToast('Download counted ✅');
  } catch (e) { /* silent */ }
}

// ── UPLOAD ─────────────────────────────────────────────
const MAX_FILE_MB = 20;

function onFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const sizeMb = file.size / 1024 / 1024;
  if (sizeMb > MAX_FILE_MB) {
    showToast(`File too large! Max ${MAX_FILE_MB}MB allowed ❌`);
    input.value = '';
    document.getElementById('fileChosen').textContent = '';
    return;
  }
  document.getElementById('fileChosen').textContent = `✅ ${file.name} (${sizeMb.toFixed(1)} MB)`;
}

function showUploadSuccess(title) {
  // Replace the form with a success panel
  const card = document.querySelector('.upload-card');
  card.innerHTML = `
    <div class="upload-success-panel">
      <div class="usp-icon">🎉</div>
      <h3 class="usp-title">Upload Successful!</h3>
      <p class="usp-msg">"${title}" has been submitted for review.<br>It will appear once approved by admin.</p>
      <p class="usp-pts">⏳ +10 points will be awarded after approval</p>
      <div class="usp-actions">
        <button class="btn-primary" onclick="resetUploadForm()">🔄 Re-upload</button>
        <button class="btn-done" onclick="navigateTo('home')">✅ Done</button>
      </div>
    </div>
  `;
}

function resetUploadForm() {
  // Rebuild the form
  const card = document.querySelector('.upload-card');
  card.innerHTML = `
    <form id="uploadForm" onsubmit="handleUpload(event)">
      <div class="form-grid">
        <div class="form-group"><label>Note Title *</label><input type="text" id="upTitle" class="form-input" placeholder="e.g. OS Unit 2 – Process Scheduling" required /></div>
        <div class="form-group"><label>College *</label><input type="text" id="upCollege" class="form-input" placeholder="e.g. AKGEC Ghaziabad" required /></div>
        <div class="form-group"><label>Course *</label><select id="upCourse" class="form-input" required><option value="">Select Course</option><option>B.Tech</option><option>BCA</option><option>MCA</option><option>B.Sc</option><option>MBA</option><option>Diploma</option></select></div>
        <div class="form-group"><label>Branch *</label><select id="upBranch" class="form-input" required><option value="">Select Branch</option><option>CSE</option><option>CSE (AI & ML)</option><option>CSE (Data Science)</option><option>IT</option><option>ECE</option><option>ME</option><option>Civil</option><option>EE</option><option>Chemical</option></select></div>
        <div class="form-group"><label>Semester *</label><select id="upSemester" class="form-input" required><option value="">Select Semester</option><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option><option>Semester 4</option><option>Semester 5</option><option>Semester 6</option><option>Semester 7</option><option>Semester 8</option></select></div>
        <div class="form-group"><label>Subject *</label><input type="text" id="upSubject" class="form-input" placeholder="e.g. Operating Systems" required /></div>
        <div class="form-group full"><label>Chapter / Topic</label><input type="text" id="upChapter" class="form-input" placeholder="e.g. Chapter 3 – Memory Management" /></div>
        <div class="form-group full">
          <label>Upload PDF / Image File <span style="color:var(--text3);font-weight:400">(max 20MB)</span></label>
          <div class="file-drop-patches" style="background:rgba(124,58,237,.05);padding:1rem;border-radius:12px;border:1px dashed var(--purple);text-align:center;cursor:pointer" id="fileDropZone" onclick="document.getElementById('upFile').click()">
            <div class="fdz-icon">📁</div>
            <p class="fdz-text">Click to upload or drag & drop</p>
            <p class="fdz-sub" style="font-size:.75rem;color:var(--text3)">PDF, PNG, JPG (max 20MB)</p>
            <input type="file" id="upFile" accept=".pdf,.png,.jpg,.jpeg" style="display:none" onchange="onFileSelect(this)" />
          </div>
          <div class="file-chosen" id="fileChosen" style="margin-top:.6rem;font-size:.85rem;color:var(--green);font-weight:700"></div>
        </div>
        <div class="form-group full"><label>OR Paste Link (Google Drive / PDF URL)</label><input type="url" id="upLink" class="form-input" placeholder="https://drive.google.com/..." /></div>
      </div>
      <button type="submit" class="btn-primary full-w" id="uploadBtn">Upload Notes</button>
    </form>
  `;
  prefillUploadForm();
  // Re-attach drag drop
  const dz = document.getElementById('fileDropZone');
  if (dz) attachDropZone(dz);
}

function attachDropZone(dz) {
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = '#7c3aed'; });
  dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.style.borderColor = '';
    const f = e.dataTransfer.files[0];
    if (f) { document.getElementById('upFile').files = e.dataTransfer.files; onFileSelect({ files: e.dataTransfer.files }); }
  });
}

async function handleUpload(e) {
  e.preventDefault();
  if (!currentUser) { showToast('Please login to upload 🔒'); navigateTo('auth'); return; }

  const title     = document.getElementById('upTitle').value.trim();
  const college   = document.getElementById('upCollege').value.trim();
  const course    = document.getElementById('upCourse').value;
  const branch    = document.getElementById('upBranch').value;
  const semester  = document.getElementById('upSemester').value;
  const subject   = document.getElementById('upSubject').value.trim();
  const chapter   = document.getElementById('upChapter').value.trim();
  const linkInput = document.getElementById('upLink').value.trim();
  const fileInput = document.getElementById('upFile');
  const file      = fileInput.files?.[0];

  if (!file && !linkInput) { showToast('Upload a file OR paste a link 📂'); return; }

  // 20MB check
  if (file && file.size / 1024 / 1024 > MAX_FILE_MB) {
    showToast(`File too large! Max ${MAX_FILE_MB}MB ❌`);
    return;
  }

  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Preparing...';

  try {
    let pdfLink = linkInput;
    let fileSize = 'Unknown';

    if (file) {
      console.log('Starting file upload to Storage...', file.name);
      btn.textContent = 'Uploading: 0%';
      const storageRef = storage.ref(`notes/${Date.now()}_${file.name}`);
      const uploadTask = storageRef.put(file);

      // Use progress tracking
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            btn.textContent = `Uploading: ${pct}% ⏳`;
          },
          (err) => {
            console.error('Storage error:', err);
            reject(err);
          },
          async () => {
            pdfLink = await storageRef.getDownloadURL();
            fileSize = (file.size / 1024 / 1024).toFixed(1) + ' MB';
            console.log('File upload complete!', pdfLink);
            resolve();
          }
        );
      });
    }

    btn.textContent = 'Saving to Database... 💾';
    const noteData = {
      title, college, course, branch, semester, subject, chapter, pdfLink,
      userId: currentUser.uid,
      by: currentUser.name || 'Anonymous',
      avatar: currentUser.initials || '👤',
      downloads: 0, likes: 0, likedBy: [],
      size: fileSize,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    console.log('Adding to Firestore:', noteData);
    await db.collection('notes').add(noteData);

    // Save profile details if empty
    let profileUpdate = {};
    if (!currentUser.college || currentUser.college !== college) profileUpdate.college = college;
    if (!currentUser.course || currentUser.course !== course) profileUpdate.course = course;
    if (!currentUser.branch || currentUser.branch !== branch) profileUpdate.branch = branch;

    if (Object.keys(profileUpdate).length > 0) {
      await db.collection('users').doc(currentUser.uid).update(profileUpdate);
      Object.assign(currentUser, profileUpdate);
    }

    // Increment upload count
    await db.collection('users').doc(currentUser.uid).update({
      uploads: firebase.firestore.FieldValue.increment(1)
    });
    if (currentUser) currentUser.uploads = (currentUser.uploads || 0) + 1;

    showUploadSuccess(title);
    showToast('Success! Sent for approval ✅');
  } catch (err) {
    console.error('Upload error details:', err);
    let msg = 'Upload failed: ' + err.message;
    if (err.code === 'storage/unauthorized') msg = 'Storage blocked by Firebase rules/CORS ❌';
    if (err.code === 'storage/retry-limit-exceeded') msg = 'Upload took too long. Try a Link instead 📂';
    
    showToast(msg);
    btn.textContent = 'Try Again (Use Link if file fails)';
    btn.disabled = false;
  }
}

// ── AUTH ────────────────────────────────────────────────
function switchTab(type) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`tab-${type}`).classList.add('active');
  document.getElementById(`form-${type}`).classList.add('active');
  document.getElementById('loginError').textContent = '';
  document.getElementById('signupError').textContent = '';
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🔒'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pw    = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    showToast('Welcome back! 👋');
    navigateTo('home');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name    = document.getElementById('signupName').value;
  const email   = document.getElementById('signupEmail').value;
  const pw      = document.getElementById('signupPassword').value;
  const college = document.getElementById('signupCollege').value;
  const errEl   = document.getElementById('signupError');
  errEl.textContent = '';
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pw);
    const initials = getInitials(name);
    await db.collection('users').doc(cred.user.uid).set({
      name, email, college, initials, points: 0, uploads: 0,
      createdAt: new Date().toISOString()
    });
    showToast(`Welcome, ${name.split(' ')[0]}! 🎉`);
    navigateTo('home');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleGoogleLogin() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    // Check if user doc exists
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) {
      await db.collection('users').doc(user.uid).set({
        name: user.displayName || 'Student',
        email: user.email,
        college: '',
        initials: getInitials(user.displayName || user.email),
        points: 0, uploads: 0,
        createdAt: new Date().toISOString()
      });
    }
    showToast(`Welcome, ${user.displayName?.split(' ')[0] || 'Student'}! 🎉`);
    navigateTo('home');
  } catch (err) {
    showToast('Google login failed: ' + err.message);
  }
}

async function handleLogout() {
  await auth.signOut();
  currentUser = null;
  showToast('Logged out 👋');
  navigateTo('home');
}

// ── LEADERBOARD ───────────────────────────────────────────
async function loadLeaderboard() {
  const list = document.getElementById('lbList');
  list.innerHTML = '<div class="notes-loading">Loading...</div>';
  try {
    const snap = await db.collection('users').get();
    const users = [];
    snap.forEach(d => users.push(d.data()));
    users.sort((a, b) => (b.points || 0) - (a.points || 0));
    const top = users.slice(0, 15);
    if (!top.length) { list.innerHTML = '<div class="notes-loading">No users yet.</div>'; return; }
    const rankClass = ['top-1','top-2','top-3'];
    list.innerHTML = top.map((u, i) => `
      <div class="lb-item">
        <div class="lb-rank ${rankClass[i] || ''}">#${i+1}</div>
        <div class="lb-avatar">${u.initials || '👤'}</div>
        <div class="lb-info">
          <div class="lb-name">${u.name || 'Student'}</div>
          <div class="lb-college">${u.college || 'India'}</div>
        </div>
        <div class="lb-pts">${u.points || 0} pts</div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<div class="notes-loading">Error loading leaderboard.</div>';
  }
}

// ── PROFILE ─────────────────────────────────────────
async function buildProfile() {
  if (!currentUser) { navigateTo('auth'); return; }
  const container = document.getElementById('profileContainer');
  container.innerHTML = '<div class="notes-loading">⏳ Loading profile...</div>';

  try {
    // Reload user data to get fresh points
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (userDoc.exists) Object.assign(currentUser, userDoc.data());

    const snap = await db.collection('notes').where('userId', '==', currentUser.uid).get();
    const notes = [];
    snap.forEach(d => notes.push({ id: d.id, ...d.data() }));
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const approved = notes.filter(n => n.status === 'approved').length;
    const pts = currentUser.points || 0;
    const pct = Math.min(Math.round((pts / 100) * 100), 100);
    const isEligible = pts >= 100;

    const isPremium = currentUser.isPremium || pts >= 100;

    container.innerHTML = `
      <div class="profile-hero">
        <div class="profile-avatar-lg">${currentUser.initials || '👤'}</div>
        <div class="profile-name">${currentUser.name || 'Student'}</div>
        <div class="profile-email">${currentUser.email || ''}</div>
        <div class="profile-email" style="margin-top:.3rem">
          ${currentUser.college ? `🏥 ${currentUser.college}` : ''}
          ${currentUser.branch ? ` · 💻 ${currentUser.branch}` : ''}
          ${currentUser.course ? ` · 🎓 ${currentUser.course}` : ''}
        </div>
        
        <div class="profile-premium-status ${isPremium ? 'is-premium' : ''}">
          ${isPremium ? '⚡ Premium Member' : '<button class="btn-upgrade-mini" onclick="navigateTo(\'premium\')">Upgrade to Premium</button>'}
        </div>

        ${isEligible ? `<div class="premium-earned-badge">🎉 You unlocked 1 Free Month!</div>` : ''}
      </div>

      <!-- Points + Progress -->
      <div class="pts-progress-card">
        <div class="ppc-top">
          <div>
            <div class="ppc-pts">${pts} <span>pts</span></div>
            <div class="ppc-label">Toward Free Premium (100 pts)</div>
          </div>
          <div class="ppc-pct">${pct}%</div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="ppc-hint">${isEligible
          ? '✅ You have unlocked 1 free month of Premium! Contact admin to activate.'
          : `👉 ${100 - pts} more points = 1 FREE month of Premium!`
        }</div>
      </div>

      <div class="profile-stats">
        <div class="pst"><div class="pst-n">${notes.length}</div><div class="pst-l">Uploads</div></div>
        <div class="pst"><div class="pst-n">${approved}</div><div class="pst-l">Approved</div></div>
        <div class="pst"><div class="pst-n">${pts}</div><div class="pst-l">Points</div></div>
      </div>

      <div class="profile-section">
        <h3>My Uploads</h3>
        <div class="profile-uploads-list">
          ${notes.length === 0 ? '<div class="empty-state"><div class="es-icon">📫</div><p>No uploads yet. Upload notes to earn points!</p></div>' : ''}
          ${notes.map(n => `
            <div class="pu-item">
              <div class="pu-icon">📄</div>
              <div class="pu-body">
                <div class="pu-title">${n.title || 'Untitled'}</div>
                <div class="pu-meta">${n.subject} · ${n.semester} · ⬇${n.downloads || 0}</div>
              </div>
              <span class="pu-status ${n.status}">${n.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><p>Error loading profile.</p></div>';
  }
}

// ── ADMIN ────────────────────────────────────────────────
async function buildAdmin() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) { navigateTo('home'); return; }
  const list = document.getElementById('adminList');
  list.innerHTML = '<div class="notes-loading">⏳ Loading all submissions...</div>';

  try {
    // Fetch without orderBy to avoid needing indexes
    const snap = await db.collection('notes').get();
    allAdminNotes = [];
    snap.forEach(d => allAdminNotes.push({ id: d.id, ...d.data() }));
    // Sort by date client-side
    allAdminNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pending = allAdminNotes.filter(n => n.status === 'pending').length;
    const approved = allAdminNotes.filter(n => n.status === 'approved').length;
    const sumEl = document.getElementById('adminSummary');
    if (sumEl) sumEl.textContent =
      `📄 Total: ${allAdminNotes.length} · ⏳ Pending: ${pending} · ✅ Approved: ${approved}`;

    renderAdminNotes();
  } catch (err) {
    console.error('Admin load error:', err);
    list.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

function adminFilter(mode, btn) {
  adminFilterMode = mode;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdminNotes();
}

function renderAdminNotes() {
  const list = document.getElementById('adminList');
  let notes = allAdminNotes;
  if (adminFilterMode !== 'all') notes = notes.filter(n => n.status === adminFilterMode);

  if (!notes.length) {
    list.innerHTML = '<div class="empty-state"><div class="es-icon">🎉</div><p>Nothing to show here!</p></div>';
    return;
  }

  list.innerHTML = notes.map(n => `
    <div class="admin-note-card">
      <div class="nc-icon" style="background:linear-gradient(135deg,#7c3aed,#3b82f6);flex-shrink:0">📄</div>
      <div class="anc-body">
        <div class="anc-title">${n.title || 'Untitled'}</div>
        <div class="anc-meta">
          <strong>By: ${n.by || 'Unknown'}</strong> · ${n.college || 'Unknown College'}
          · ${n.branch || ''} · ${n.semester || ''} · ${n.subject || ''}
        </div>
        <div class="anc-badges">
          <span class="status-badge ${n.status || 'pending'}">${n.status || 'pending'}</span>
          ${n.size !== 'Unknown' && n.size ? `<span class="status-badge" style="background:rgba(16,185,129,.1);color:#10b981">📦 ${n.size}</span>` : ''}
          <span style="font-size:.72rem;color:var(--text3)">${n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN') : ''}</span>
        </div>
      </div>
      <div class="anc-actions">
        ${n.pdfLink ? `<button class="anc-btn view" onclick="quickViewNote('${n.id}','${n.pdfLink}')">👁 Preview</button>` : ''}
        ${n.status !== 'approved' ? `<button class="anc-btn approve" onclick="approveNote('${n.id}','${n.userId}')">✅ Approve</button>` : ''}
        <button class="anc-btn del" onclick="declineNote('${n.id}')">❌ Decline</button>
      </div>
    </div>
  `).join('');
}

async function approveNote(id, userId) {
  try {
    await db.collection('notes').doc(id).update({ status: 'approved' });
    // Give +10 points on approval
    if (userId) {
      await db.collection('users').doc(userId).update({
        points: firebase.firestore.FieldValue.increment(10)
      });
    }
    showToast('✅ Approved! User earned +10 points');
    // Update local state
    const note = allAdminNotes.find(n => n.id === id);
    if (note) note.status = 'approved';
    // Update summary
    const pending = allAdminNotes.filter(n => n.status === 'pending').length;
    const approved = allAdminNotes.filter(n => n.status === 'approved').length;
    const sumEl = document.getElementById('adminSummary');
    if (sumEl) sumEl.textContent = `Total: ${allAdminNotes.length} · Pending: ${pending} · Approved: ${approved}`;
    renderAdminNotes();
  } catch (err) { showToast('Error: ' + err.message); }
}

async function declineNote(id) {
  if (!confirm('Decline and delete this note permanently?')) return;
  try {
    await db.collection('notes').doc(id).delete();
    allAdminNotes = allAdminNotes.filter(n => n.id !== id);
    const pending = allAdminNotes.filter(n => n.status === 'pending').length;
    const approved = allAdminNotes.filter(n => n.status === 'approved').length;
    const sumEl = document.getElementById('adminSummary');
    if (sumEl) sumEl.textContent = `Total: ${allAdminNotes.length} · Pending: ${pending} · Approved: ${approved}`;
    showToast('🗑️ Note declined and removed');
    renderAdminNotes();
  } catch (err) { showToast('Error: ' + err.message); }
}

async function deleteNoteAdmin(id) {
  if (!confirm('Delete this note permanently?')) return;
  try {
    await db.collection('notes').doc(id).delete();
    allAdminNotes = allAdminNotes.filter(n => n.id !== id);
    showToast('🗑️ Note deleted');
    renderAdminNotes();
  } catch (err) { showToast('Error: ' + err.message); }
}

// ── TOAST ────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── NAV SCROLL ──────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 10);
});

// ── HAMBURGER ───────────────────────────────────────────
function toggleMenu() {
  document.getElementById('navLinks')?.classList.toggle('open');
}

// ── DRAG & DROP FILE ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navigateTo('home');

  const dz = document.getElementById('fileDropZone');
  if (dz) {
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = '#7c3aed'; });
    dz.addEventListener('dragleave', () => { dz.style.borderColor = ''; });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.style.borderColor = '';
      const f = e.dataTransfer.files[0];
      if (f) {
        document.getElementById('upFile').files = e.dataTransfer.files;
        onFileSelect({ files: e.dataTransfer.files });
      }
    });
  }

  // Close search dropdown on click outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.hero-search-wrap')) {
      document.getElementById('searchDropdown')?.classList.remove('visible');
    }
  });

  initParticles();
});

// ── COMMUNITY SECTION ────────────────────────────────────
async function loadCommunity() {
  const feed = document.getElementById('commFeed');
  if (!feed) return;
  feed.innerHTML = '<div class="notes-loading">⏳ Loading community posts...</div>';
  try {
    const snap = await db.collection('community').get();
    const posts = [];
    snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!posts.length) {
      feed.innerHTML = '<div class="empty-state"><div class="es-icon">💬</div><p>No posts yet. Be the first to ask!</p></div>';
      return;
    }
    feed.innerHTML = posts.map(p => `
      <div class="comm-post">
        <div class="cp-avatar">${p.initials || '👤'}</div>
        <div class="cp-body">
          <div class="cp-header">
            <span class="cp-name">${p.by || 'Student'}</span>
            <span class="cp-tag ${p.type || 'doubt'}">${p.type || 'doubt'}</span>
            <span class="cp-time">${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''}</span>
          </div>
          <div class="cp-text">${p.message || ''}</div>
          ${p.subject ? `<div class="cp-sub">📚 ${p.subject}</div>` : ''}
          <button class="cp-reply" onclick="showToast('Reply feature coming soon! 🚀')">💬 Reply</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    feed.innerHTML = '<div class="empty-state"><p>Could not load community posts.</p></div>';
  }
}

async function postToComm(e) {
  e.preventDefault();
  if (!currentUser) { showToast('Please login to post 🔒'); navigateTo('auth'); return; }

  const msg  = document.getElementById('commMsg').value.trim();
  const type = document.getElementById('commType').value;
  const subj = document.getElementById('commSubject').value.trim();
  if (!msg) { showToast('Please write something first!'); return; }

  const btn = document.getElementById('commPostBtn');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  try {
    await db.collection('community').add({
      message: msg, type, subject: subj,
      by: currentUser.name || 'Student',
      initials: currentUser.initials || '👤',
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    });
    document.getElementById('commForm').reset();
    showToast('Posted! 🎉');
    loadCommunity();
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Post';
  }
}

