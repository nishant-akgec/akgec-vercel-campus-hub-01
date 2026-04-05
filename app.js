// // -- FIREBASE CONFIG -------------------------------------
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

// -- CONSTANTS -------------------------------------------
const ADMIN_EMAIL = 'nishantsingh2206@gmail.com';
const ADMIN_UID   = ''; // set this to your Firebase UID

// -- STATE -----------------------------------------------
let currentUser = null;
let currentPage = 'home';
let selState = { college: '', course: '', branch: '', semester: '' };
let activeSubject = null;
let notesSearchQ = '';
let notesSortMode = 'latest';
let adminFilterMode = 'all';
let allAdminNotes = [];
let communityPosts = [];

// -- DATA: AKTU COLLEGES --------------------------------
const aktuColleges = [
    "AKGEC - Ajay Kumar Garg Engineering College, Ghaziabad",
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
    "Lucknow University - Engineering",
    "BBDU - Babu Banarasi Das University, Lucknow",
    "Invertis University, Bareilly",
    "Teerthanker Mahaveer University, Moradabad",
    "IET - Institute of Engineering & Technology, Lucknow",
    "Rama University, Kanpur",
    "NIET - Noida Institute of Engineering & Technology",
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

const subjectIcons = [''S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14','S15'];

function getSubjects(branch, semester) {
    const clean = branch.replace(/\s*\(.*\)/, '').trim();
    const map = subjectMap[clean] || subjectMap['CSE'];
    return map[semester] || ['Subject 1','Subject 2','Subject 3','Subject 4','Subject 5'];
}

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

function initParticles() {
    const p = document.getElementById('heroParticles');
    if (!p) return;
    p.innerHTML = '';
    for (let i = 0; i < 18; i++) {
          const el = document.createElement('div');
          el.className = 'particle';
          const size = Math.random() * 5 + 3;
          const colors = ['#7c3aed','#3b82f6','#a78bfa','#60a5fa','#10b981'];
          el.style.cssText = "width:" + size + "px;height:" + size + "px; " +
                  "left:" + (Math.random()*100) + "%; " +
                  "background:" + colors[Math.floor(Math.random()*colors.length)] + "; " +
                  "animation-duration:" + (Math.random()*12+8) + "s; " +
                  "animation-delay:" + (Math.random()*8) + "s;";
          p.appendChild(el);
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
          db.collection('users').doc(user.uid).get().then(doc => {
                  if (doc.exists) {
                            currentUser = { uid: user.uid, email: user.email, ...doc.data() };
                  } else {
                            currentUser = {
                                        uid: user.uid, email: user.email,
                                        name: user.displayName || user.email.split('@')[0],
                                        initials: getInitials(user.displayName || user.email),
                                        college: '', points: 0, uploads: 0
                            };
                            db.collection('users').doc(user.uid).set({ ...currentUser });
                  }
                  renderNavAuth(); loadStats(); loadRecentNotes();
          });
    } else {
          currentUser = null; renderNavAuth(); loadRecentNotes(); loadStats();
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
          el.innerHTML = (isAdmin ? '<button class="nav-admin-btn" onclick="navigateTo(\'admin\')">Admin</button>' : '') +
                  '<div class="nav-user-chip" onclick="navigateTo(\'profile\')" style="cursor:pointer" title="My Profile">' +
                    '<div class="nav-avatar">' + (currentUser.initials || 'User') + '</div>' +
                    '<span class="nav-username">' + (currentUser.name || 'User').split(' ')[0] + '</span>' +
                  '</div>' +
                  '<button class="nav-logout-btn" onclick="handleLogout()">Logout</button>';
    } else {
          el.innerHTML = '<button class="nav-login-btn" onclick="navigateTo(\'auth\')">Login / Sign Up</button>';
    }
}

function navigateTo(page) {
    const isUserPremium = currentUser && (currentUser.isPremium || (currentUser.points || 0) >= 100);
    if (page === 'community' && !isUserPremium) {
          showToast('Community is for Premium members only! (Get 100 pts for free access)');
          navigateTo('premium');
          return;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const pg = document.getElementById('page-' + page);
    if (pg) pg.classList.add('active');
    const nl = document.getElementById('nav-' + page);
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
    const fields = { 'upCollege': currentUser.college || '', 'upCourse': currentUser.course || '', 'upBranch': currentUser.branch || '' };
    for (const [id, val] of Object.entries(fields)) {
          const el = document.getElementById(id);
          if (el && val && !el.value) el.value = val;
    }
}

async function loadStats() {
    try {
          const snap = await db.collection('notes').where('status', '==', 'approved').get();
          const el = document.getElementById('statNotes');
          if (el) el.textContent = (snap.size || 0) + '+';
          const usnap = await db.collection('users').get();
          const uel = document.getElementById('statUsers');
          if (uel) uel.textContent = (usnap.size || 0) + '+';
    } catch (e) { }
}

async function loadRecentNotes() {
    const grid = document.getElementById('recentNotesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="notes-loading">Loading recent notes...</div>';
    try {
          const snap = await db.collection('notes').limit(60).get();
          let notes = [];
          snap.forEach(d => notes.push({ id: d.id, ...d.data() }));
          notes = notes.filter(n => n.status === 'approved').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
          if (!notes.length) {
                  grid.innerHTML = '<div class="notes-loading">No notes approved yet.</div>';
                  return;
          }
          grid.innerHTML = notes.map(n => 
                                           '<div class="recent-note-card" onclick="quickViewNote(\'' + n.id + '\',\'' + n.pdfLink + '\')">' +
                    '<div class="rnc-icon">PDF</div>' +
                    '<div class="rnc-body">' +
                      '<div class="rnc-title">' + (n.title || 'Untitled') + '</div>' +
                      '<div class="rnc-meta">' + (n.branch || '') + ' - ' + (n.semester || '') + ' - ' + (n.subject || '') + '</div>' +
                      '<span class="rnc-badge approved">Approved</span>' +
                    '</div>' +
                  '</div>'
                                         ).join('');
    } catch (e) { grid.innerHTML = '<div class="notes-loading">Error loading notes.</div>'; }
}

function quickViewNote(id, pdfLink) {
    if (!pdfLink) { showToast('Error: This note has no valid link!'); return; }
    downloadNote(id);
    let finalLink = pdfLink;
    if (pdfLink.includes('drive.google.com') && pdfLink.includes('/view')) {
          finalLink = pdfLink.replace('/view', '/preview');
    }
    window.open(finalLink, '_blank');
}

function handleHeroSearch() {
    const q = document.getElementById('heroSearch').value.toLowerCase();
    const dd = document.getElementById('searchDropdown');
    if (!q || q.length < 2) { dd.classList.remove('visible'); return; }
    const results = aktuColleges.filter(c => c.toLowerCase().includes(q)).slice(0, 6);
    if (!results.length) { dd.classList.remove('visible'); return; }
    dd.innerHTML = results.map(c => 
                                   '<div class="sdrop-item" onclick="selectCollegeFromSearch(\'' + c.replace(/'/g,"\\\\") + '\')">College: ' + c + '</div>'
                                 ).join('');
    dd.classList.add('visible');
}

function selectCollegeFromSearch(college) {
    const dd = document.getElementById('searchDropdown');
    dd.classList.remove('visible');
    document.getElementById('heroSearch').value = college;
    selState.college = college;
    navigateTo('explore');
    setTimeout(() => { goSelStep(2); document.getElementById('sstep-1').classList.add('done'); renderCourses(); }, 400);
}

function buildExplore() { goSelStep(1); renderColleges(); }
function goSelStep(n) {
    for (let i = 1; i <= 4; i++) {
          document.getElementById('sel-' + i)?.classList.toggle('active', i === n);
          document.getElementById('sstep-' + i)?.classList.toggle('active', i === n);
    }
}
function renderColleges() {
    const list = document.getElementById('collegeList');
    const q = (document.getElementById('collegeSearch')?.value || '').toLowerCase();
    const filtered = aktuColleges.filter(c => !q || c.toLowerCase().includes(q));
    list.innerHTML = filtered.map(c => 
                                      '<div class="college-item ' + (selState.college === c ? 'selected' : '') + '" onclick="selectCollege(\'' + c.replace(/'/g,"\\\\") + '\')">College: ' + c + '</div>'
                                    ).join('');
}
function selectCollege(college) { selState.college = college; document.getElementById('sstep-1').classList.add('done'); goSelStep(2); renderCourses(); }
function renderCourses() { document.getElementById('courseList').innerHTML = courses.map(c => '<button class="option-btn ' + (selState.course === c ? 'selected' : '') + '" onclick="selectCourse(\'' + c + '\')">' + c + '</button>').join(''); }
function selectCourse(course) { selState.course = course; document.getElementById('sstep-2').classList.add('done'); goSelStep(3); renderBranches(); }
function renderBranches() {
    const brList = branches[selState.course] || branches['B.Tech'];
    document.getElementById('branchList').innerHTML = brList.map(b => '<button class="option-btn ' + (selState.branch === b ? 'selected' : '') + '" onclick="selectBranch(\'' + b + '\')">' + b + '</button>').join('');
}
function selectBranch(branch) { selState.branch = branch; document.getElementById('sstep-3').classList.add('done'); goSelStep(4); renderSemesters(); }
function renderSemesters() {
    document.getElementById('semGrid').innerHTML = Array.from({ length: 8 }, (_, i) => 
                                                                  '<button class="sem-btn" onclick="selectSemester(\'Semester ' + (i+1) + '\')">' +
            '<span class="sem-num">' + (i+1) + '</span><span class="sem-label">Sem</span>' +
          '</button>').join('');
}
function selectSemester(sem) { selState.semester = sem; buildSubjectsPage(); }

function buildSubjectsPage() {
    const subjects = getSubjects(selState.branch, selState.semester);
    document.getElementById('subjectsPageTitle').textContent = 'Subjects';
    document.getElementById('subjectsPageMeta').textContent = selState.college.split('-')[0].trim() + ' - ' + selState.course + ' ' + selState.branch + ' - ' + selState.semester;
    const grid = document.getElementById('subjectGrid');
    grid.innerHTML = subjects.map((s, i) => {
          const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6','#f97316'];
          return '<div class="subj-card" onclick="openSubject(\'' + s.replace(/'/g,"\\\\") + '\')">' +
                    '<div class="subj-icon-wrap" style="background:' + colors[i % colors.length] + '22">S</div>' +
                    '<div class="subj-name">' + s + '</div>' +
                    '<div class="subj-meta">' + selState.semester + ' - ' + selState.branch + '</div>' +
                    '<div class="subj-arrow">-></div>' +
                  '</div>';
    }).join('');
    navigateTo('subjects');
}

function openSubject(subject) {
    activeSubject = subject;
    document.getElementById('notesPageTitle').textContent = 'Note: ' + subject;
    document.getElementById('notesPageMeta').textContent = selState.college.split('-')[0].trim() + ' - ' + selState.course + ' ' + selState.branch + ' - ' + selState.semester;
    navigateTo('notes'); renderNotes();
}

async function renderNotes() {
    const list = document.getElementById('notesList');
    list.innerHTML = '<div class="empty-state">Loading notes...</div>';
    try {
          const snap = await db.collection('notes').where('subject', '==', activeSubject).get();
          let notes = []; snap.forEach(d => notes.push({ id: d.id, ...d.data() }));
          notes = notes.filter(n => n.status === 'approved');
          if (!notes.length) { list.innerHTML = '<div class="empty-state">No notes yet.</div>'; return; }
          list.innerHTML = notes.map(n => 
                                           '<div class="note-card">' +
                    '<div class="nc-icon">PDF</div>' +
                    '<div class="nc-body">' +
                      '<div class="nc-title">' + (n.title || 'Untitled') + '</div>' +
                      '<div class="nc-meta">By ' + n.by + ' - ' + (n.chapter || 'General') + ' - Downloads: ' + (n.downloads || 0) + '</div>' +
                    '</div>' +
                    '<div class="nc-actions">' +
                      '<button class="btn-view" onclick="quickViewNote(\'' + n.id + '\', \'' + n.pdfLink + '\')">View</button>' +
                      '<button class="btn-dl" onclick="quickViewNote(\'' + n.id + '\', \'' + n.pdfLink + '\')">Save</button>' +
                    '</div>' +
                  '</div>').join('');
    } catch (err) { list.innerHTML = '<div class="empty-state">Error loading notes.</div>'; }
}

async function downloadNote(id) {
    try { await db.collection('notes').doc(id).update({ downloads: firebase.firestore.FieldValue.increment(1) }); } catch (e) { }
}

const MAX_FILE_MB = 20;
function onFileSelect(input) {
    const file = input.files[0]; if (!file) return;
    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > MAX_FILE_MB) { showToast('File too large! Max ' + MAX_FILE_MB + 'MB allowed'); input.value = ''; return; }
    document.getElementById('fileChosen').textContent = 'Selected: ' + file.name + ' (' + sizeMb.toFixed(1) + ' MB)';
}

async function handleUpload(e) {
    e.preventDefault();
    if (!currentUser) { showToast('Please login to upload'); navigateTo('auth'); return; }
    const title = document.getElementById('upTitle').value.trim();
    const college = document.getElementById('upCollege').value.trim();
    const course = document.getElementById('upCourse').value;
    const branch = document.getElementById('upBranch').value;
    const semester = document.getElementById('upSemester').value;
    const subject = document.getElementById('upSubject').value.trim();
    const linkInput = document.getElementById('upLink').value.trim();
    const file = document.getElementById('upFile').files?.[0];
    if (!file && !linkInput) { showToast('Upload a file OR paste a link'); return; }

  const btn = document.getElementById('uploadBtn');
    btn.disabled = true; btn.textContent = 'Uploading...';
    try {
          let pdfLink = linkInput;
          if (file) {
                  const storageRef = storage.ref('notes/' + Date.now() + '_' + file.name);
                  await storageRef.put(file);
                  pdfLink = await storageRef.getDownloadURL();
          }
          await db.collection('notes').add({
                  title, college, course, branch, semester, subject, pdfLink,
                  userId: currentUser.uid, by: currentUser.name || 'Anonymous',
                  downloads: 0, likes: 0, status: 'pending', createdAt: new Date().toISOString()
          });
          showToast('Success! Sent for approval'); navigateTo('home');
    } catch (err) { showToast('Upload failed: ' + err.message); } finally { btn.disabled = false; btn.textContent = 'Upload Notes'; }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pw = document.getElementById('loginPassword').value;
    try { await auth.signInWithEmailAndPassword(email, pw); showToast('Welcome back!'); navigateTo('home'); } catch (err) { document.getElementById('loginError').textContent = err.message; }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pw = document.getElementById('signupPassword').value;
    try {
          const cred = await auth.createUserWithEmailAndPassword(email, pw);
          await db.collection('users').doc(cred.user.uid).set({ name, email, initials: getInitials(name), points: 0, uploads: 0, createdAt: new Date().toISOString() });
          showToast('Welcome!'); navigateTo('home');
    } catch (err) { document.getElementById('signupError').textContent = err.message; }
}

async function handleGoogleLogin() {
    try {
          const result = await auth.signInWithPopup(googleProvider);
          const user = result.user;
          const doc = await db.collection('users').doc(user.uid).get();
          if (!doc.exists) await db.collection('users').doc(user.uid).set({ name: user.displayName, email: user.email, initials: getInitials(user.displayName), points: 0, uploads: 0, createdAt: new Date().toISOString() });
          showToast('Welcome!'); navigateTo('home');
    } catch (err) { showToast('Google login failed: ' + err.message); }
}

async function handleLogout() { await auth.signOut(); currentUser = null; showToast('Logged out'); navigateTo('home'); }

async function buildAdmin() {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) { navigateTo('home'); return; }
    const list = document.getElementById('adminList');
    if (!list) return;
    list.innerHTML = 'Loading...';
    try {
          const snap = await db.collection('notes').get();
          allAdminNotes = []; snap.forEach(d => allAdminNotes.push({ id: d.id, ...d.data() }));
          allAdminNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          renderAdminNotes();
    } catch (err) { list.innerHTML = '<p>Error loading.</p>'; }
}

function renderAdminNotes() {
    const list = document.getElementById('adminList');
    if (!list) return;
    list.innerHTML = allAdminNotes.map(n => 
                                           '<div class="admin-note-card">' +
            '<div class="anc-body">' +
              '<div class="anc-title">' + n.title + '</div>' +
              '<div class="anc-meta">By ' + n.by + ' - ' + n.college + ' - ' + n.subject + '</div>' +
              '<span class="status-badge ' + n.status + '">' + n.status + '</span>' +
            '</div>' +
            '<div class="anc-actions">' +
              '<button class="anc-btn view" onclick="quickViewNote(\'' + n.id + '\',\'' + n.pdfLink + '\')">View</button>' +
              (n.status === 'pending' ? '<button class="anc-btn approve" onclick="approveNote(\'' + n.id + '\',\'' + n.userId + '\')">Approve</button>' : '') +
              '<button class="anc-btn del" onclick="declineNote(\'' + n.id + '\')">Delete</button>' +
            '</div>' +
          '</div>').join('');
}

async function approveNote(id, userId) {
    try {
          await db.collection('notes').doc(id).update({ status: 'approved' });
          if (userId) await db.collection('users').doc(userId).update({ points: firebase.firestore.FieldValue.increment(10) });
          showToast('Approved!'); buildAdmin();
    } catch (err) { showToast('Error'); }
}

async function declineNote(id) {
    if (confirm('Delete?')) { await db.collection('notes').doc(id).delete(); showToast('Deleted'); buildAdmin(); }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => { navigateTo('home'); initParticles(); });
