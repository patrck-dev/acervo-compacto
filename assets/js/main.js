import { persistent, getPreferences, updatePreferences, getProgress } from './storage.js';
import { initReader } from './reader.js';
import { initBackgroundMusic } from './background-music.js';

const mediaDark = matchMedia('(prefers-color-scheme: dark)');
const themeButtons = () => document.querySelectorAll('[data-theme-choice]');
function resolvedTheme(pref = getPreferences().theme) {
  return pref === 'auto' ? (mediaDark.matches ? 'dark' : 'light') : pref;
}
function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.setAttribute('aria-label', `Ativar tema ${resolvedTheme() === 'dark' ? 'claro' : 'escuro'}`);
    button.setAttribute('title', `Ativar tema ${resolvedTheme() === 'dark' ? 'claro' : 'escuro'}`);
  });
  themeButtons().forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === getPreferences().theme)));
}
function applyFontSize() {
  const size = Math.max(16, Math.min(26, Math.round(getPreferences().fontSize / 2) * 2));
  document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
  document.querySelectorAll('[data-font-current]').forEach(el => { el.textContent = `${size} px`; });
  document.querySelectorAll('[data-font-down]').forEach(el => { el.disabled = size <= 16; });
  document.querySelectorAll('[data-font-up]').forEach(el => { el.disabled = size >= 26; });
}
export function adjustFont(delta) {
  const next = Math.max(16, Math.min(26, getPreferences().fontSize + delta));
  updatePreferences({ fontSize: next });
  applyFontSize();
  window.dispatchEvent(new Event('reader-settings-changed'));
}
function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.role = 'status'; el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
const dialog = document.getElementById('settings-dialog');
document.querySelectorAll('[data-open-settings]').forEach(b => b.addEventListener('click', () => dialog?.showModal()));
document.querySelectorAll('[data-close-settings]').forEach(b => b.addEventListener('click', () => dialog?.close()));
dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
  updatePreferences({ theme: resolvedTheme() === 'dark' ? 'light' : 'dark' }); applyTheme();
}));
themeButtons().forEach(b => b.addEventListener('click', () => { updatePreferences({ theme: b.dataset.themeChoice }); applyTheme(); }));
document.querySelectorAll('[data-font-down]').forEach(b => b.addEventListener('click', () => adjustFont(-2)));
document.querySelectorAll('[data-font-up]').forEach(b => b.addEventListener('click', () => adjustFont(2)));
mediaDark.addEventListener?.('change', applyTheme);
applyTheme(); applyFontSize();
initBackgroundMusic();
if (!persistent) {
  const el = document.querySelector('.storage-warning');
  if (el) { el.classList.add('show'); el.textContent = 'O navegador bloqueou o armazenamento local. Preferências, progresso e notas não permanecerão após fechar a página.'; }
}

if (document.body.dataset.page === 'reader') initReader({ toast });
if (document.body.dataset.page === 'home') {
  document.querySelectorAll('[data-book-card]').forEach(book => {
    const progress = getProgress(book.dataset.bookCard);
    const stored = Number(progress?.percent);
    const percent = Number.isFinite(stored) ? Math.min(100, Math.max(0, Math.round(stored))) : 0;
    const started = Number.isFinite(stored) && stored > .5;
    const title = book.querySelector('h3')?.textContent.trim() || 'esta obra';
    book.querySelector('[data-progress-label]').textContent =
      started ? (percent >= 100 ? 'Leitura concluída' : percent + '% concluído') : 'Ainda não iniciado';
    book.querySelector('[data-progress-fill]').style.width = percent + '%';
    book.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(percent));
    const link = book.querySelector('[data-resume-link]');
    link.querySelector('[data-resume-text]').textContent = started ? 'Retomar leitura' : 'Começar leitura';
    link.setAttribute('aria-label', (started ? 'Retomar ' : 'Começar ') + 'a leitura de ' + title);
  });
}
