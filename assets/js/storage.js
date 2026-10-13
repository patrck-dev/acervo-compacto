// Persistência exclusivamente local; degradação explícita quando bloqueada.
const PREFIX = 'biblioteca.existencia.v1.';
const fallback = new Map();
let storageAvailable = true;
try {
  const k = PREFIX + 'probe';
  localStorage.setItem(k, '1');
  localStorage.removeItem(k);
} catch { storageAvailable = false; }
export const persistent = storageAvailable;
export function read(key, defaultValue = null) {
  try {
    const raw = storageAvailable ? localStorage.getItem(PREFIX + key) : fallback.get(key);
    return raw == null ? defaultValue : JSON.parse(raw);
  } catch { return defaultValue; }
}
export function write(key, value) {
  try {
    const serialized = JSON.stringify(value);
    if (storageAvailable) localStorage.setItem(PREFIX + key, serialized);
    else fallback.set(key, serialized);
    return storageAvailable;
  } catch { return false; }
}
export function remove(key) {
  try { if (storageAvailable) localStorage.removeItem(PREFIX + key); else fallback.delete(key); }
  catch { /* armazenamento negado; interface permanece utilizável */ }
}
export const progressKey = (slug) => `progress.${slug}`;
export const notesKey = (slug) => `notes.${slug}`;
export function getProgress(slug) { return read(progressKey(slug)); }
export function setProgress(slug, data) { return write(progressKey(slug), data); }
export function getPreferences() { return { theme: 'auto', fontSize: 18, rate: 1, voiceURI: '', ...read('preferences', {}) }; }
export function updatePreferences(patch) { const next = { ...getPreferences(), ...patch }; write('preferences', next); return next; }
