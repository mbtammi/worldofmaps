// Temporary client-side feature requests store (to be replaced by Firebase)
// Provides submit, list, upvote and 'new since last seen' tracking using localStorage.

const STORAGE_KEY = 'worldofmaps_feature_requests_v1';
const LAST_SEEN_KEY = 'worldofmaps_feature_requests_last_seen';

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch (_) {}
  return [];
}

function saveAll(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(_){/* ignore */}
}

export function listFeatures() {
  return loadAll().sort((a,b)=> b.votes - a.votes || b.created - a.created);
}

export function submitFeature({ title, description }) {
  const trimmedTitle = (title||'').trim();
  const trimmedDesc = (description||'').trim();
  if (!trimmedTitle) throw new Error('Title required');
  const now = Date.now();
  const list = loadAll();
  const id = 'fr_' + now.toString(36) + '_' + Math.random().toString(36).slice(2,8);
  list.push({ id, title: trimmedTitle.slice(0,120), description: trimmedDesc.slice(0,600), votes: 1, created: now });
  saveAll(list);
  return id;
}

export function upvoteFeature(id) {
  const list = loadAll();
  const feature = list.find(f => f.id === id);
  if (!feature) return false;
  // Prevent multiple votes per feature per browser (very light client guard)
  const votedKey = 'worldofmaps_feature_voted_' + id;
  if (localStorage.getItem(votedKey)) return false;
  feature.votes += 1;
  localStorage.setItem(votedKey, '1');
  saveAll(list);
  return true;
}

export function getLastSeenTimestamp() {
  try { return parseInt(localStorage.getItem(LAST_SEEN_KEY)) || 0; } catch(_) { return 0; }
}

export function markAllSeen() {
  try { localStorage.setItem(LAST_SEEN_KEY, Date.now().toString()); } catch(_){/* ignore */}
}

export function hasNewFeatures() {
  const lastSeen = getLastSeenTimestamp();
  return loadAll().some(f => f.created > lastSeen);
}

// Seed with a few example items if empty
(function seed(){
  const list = loadAll();
  if (list.length === 0) {
    saveAll([
      { id: 'seed_darkmode', title: 'Offline Mode', description: 'Play cached recent datasets when offline and sync later.', votes: 5, created: Date.now()-3600*1000 },
      { id: 'seed_leaderboard', title: 'Global Leaderboard', description: 'Daily fastest solve / fewest guesses board (privacy-friendly).', votes: 9, created: Date.now()-7200*1000 },
      { id: 'seed_classroom', title: 'Classroom Pack', description: 'Teacher dashboard to pick dataset and track class results.', votes: 3, created: Date.now()-5400*1000 }
    ]);
  }
})();
