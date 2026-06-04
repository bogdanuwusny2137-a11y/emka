// Sprawdzenie czy urządzenie to iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                    ('standalone' in window.navigator && window.navigator.standalone);

const DB_NAME = 'fobywatel';
const DB_STORE = 'data';
let _memoryCache = {};
let _dbReady = null;

function _openDb() {
  if (_dbReady) return _dbReady;
  _dbReady = new Promise((resolve) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
  return _dbReady;
}

async function _idbSet(key, value) {
  try {
    const db = await _openDb();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ key, value });
  } catch (e) { /* skip */ }
}

async function _idbGet(key) {
  try {
    const db = await _openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) { return null; }
}

async function _idbRemove(key) {
  try {
    const db = await _openDb();
    if (!db) return;
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(key);
  } catch (e) { /* skip */ }
}

async function _idbKeys() {
  try {
    const db = await _openDb();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) { return []; }
}

function safeSetItem(key, value) {
  _memoryCache[key] = value;
  try { localStorage.setItem(key, value); } catch (e) {
    console.warn('localStorage set failed for', key, '- using IndexedDB fallback');
    _idbSet(key, value);
  }
}

function safeGetItem(key) {
  if (_memoryCache[key] !== undefined) return _memoryCache[key];
  try {
    const v = localStorage.getItem(key);
    if (v !== null) {
      _memoryCache[key] = v;
      return v;
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function safeGetItemAsync(key) {
  if (_memoryCache[key] !== undefined) return _memoryCache[key];
  try {
    const v = localStorage.getItem(key);
    if (v !== null) {
      _memoryCache[key] = v;
      return v;
    }
  } catch (e) { /* ignore */ }
  const fb = await _idbGet(key);
  if (fb !== null) _memoryCache[key] = fb;
  return fb;
}

function safeRemoveItem(key) {
  delete _memoryCache[key];
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  _idbRemove(key);
}

async function safePushDoc(doc) {
  const raw = safeGetItem('dowody');
  let allDocs = {};
  try { allDocs = JSON.parse(raw || '{}'); } catch(e) { allDocs = {}; }
  const token = safeGetItem('activeToken') || 'default';
  if (!allDocs[token]) allDocs[token] = [];
  allDocs[token].push(doc);
  safeSetItem('dowody', JSON.stringify(allDocs));
}

async function safeUpdateDoc(index, doc) {
  const raw = safeGetItem('dowody');
  let allDocs = {};
  try { allDocs = JSON.parse(raw || '{}'); } catch(e) { allDocs = {}; }
  const token = safeGetItem('activeToken') || 'default';
  if (!allDocs[token]) allDocs[token] = [];
  allDocs[token][index] = doc;
  safeSetItem('dowody', JSON.stringify(allDocs));
}

async function safeDeleteDoc(index) {
  const raw = safeGetItem('dowody');
  let allDocs = {};
  try { allDocs = JSON.parse(raw || '{}'); } catch(e) { allDocs = {}; }
  const token = safeGetItem('activeToken') || 'default';
  if (allDocs[token] && allDocs[token][index]) {
    allDocs[token].splice(index, 1);
    safeSetItem('dowody', JSON.stringify(allDocs));
  }
}

async function safeGetDocs() {
  let raw = safeGetItem('dowody');
  if (!raw) raw = await safeGetItemAsync('dowody');
  let allDocs = {};
  try { allDocs = JSON.parse(raw || '{}'); } catch(e) { allDocs = {}; }
  const token = safeGetItem('activeToken') || 'default';
  let userDocs = allDocs[token] || [];
  if (userDocs.length === 0 && token !== 'default') {
    userDocs = allDocs['default'] || [];
    if (userDocs.length > 0) {
      allDocs[token] = userDocs;
      delete allDocs['default'];
      safeSetItem('dowody', JSON.stringify(allDocs));
    }
  }
  return userDocs;
}

async function safeSetDocs(userDocs) {
  const raw = safeGetItem('dowody');
  let allDocs = {};
  try { allDocs = JSON.parse(raw || '{}'); } catch(e) { allDocs = {}; }
  const token = safeGetItem('activeToken') || 'default';
  allDocs[token] = userDocs;
  safeSetItem('dowody', JSON.stringify(allDocs));
}

async function migrateLocalStorageToIdb() {
  if (!isIOS) return;
  try {
    const raw = localStorage.getItem('dowody');
    if (raw) {
      const idbVal = await _idbGet('dowody');
      if (!idbVal) await _idbSet('dowody', raw);
    }
    const keysToMigrate = ['formData', 'cardData', 'activeToken', 'editingDocument'];
    for (const k of keysToMigrate) {
      const v = localStorage.getItem(k);
      if (v) {
        const idbV = await _idbGet(k);
        if (!idbV) await _idbSet(k, v);
      }
    }
  } catch (e) { console.warn('Migration error:', e); }
}

document.addEventListener('DOMContentLoaded', () => {
  if (isIOS) {
    migrateLocalStorageToIdb();
  }
});