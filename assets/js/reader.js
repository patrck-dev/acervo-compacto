import { write, remove, progressKey, getProgress, setProgress } from './storage.js';
import { initNavigation } from './navigation.js';
import { initNarration } from './audio.js';

export function initReader({ toast }) {
  const slug = document.body.dataset.book;
  const title = document.querySelector('h1').textContent.trim();
  const sections = [...document.querySelectorAll('.reading-section[data-chapter]')];
  const readable = [...document.querySelectorAll('[data-readable]')];
  const saved = getProgress(slug);
  const meter = document.querySelector('[data-reading-meter]');
  const end = document.querySelector('[data-book-end]');
  const nav = initNavigation(sections);
  const scrollBoundary = () => {
    const start = window.scrollY + sections[0].getBoundingClientRect().top;
    const anchor = Math.min(260, window.innerHeight * .32);
    const bottomScroll = document.documentElement.scrollHeight - window.innerHeight;
    const finish = Math.min(window.scrollY + end.getBoundingClientRect().top, bottomScroll + anchor);
    return { start, finish };
  };
  let restored = false;
  let rafPending = false;
  const getActiveBlock = () => {
    const anchor = Math.min(260, window.innerHeight * .32);
    let active = readable[0];
    for (const block of readable) {
      if (block.getBoundingClientRect().top <= anchor) active = block;
      else break;
    }
    return active;
  };
  function calculateProgress() {
    const { start, finish } = scrollBoundary();
    const anchor = Math.min(260, window.innerHeight * .32);
    const y = window.scrollY + anchor;
    return Math.max(0, Math.min(100, (y - start) / Math.max(1, finish - start) * 100));
  }
  function persistPosition() {
    if (!restored) return;
    const percent = +calculateProgress().toFixed(2);
    meter.style.width = `${percent}%`;
    const el = getActiveBlock();
    setProgress(slug, { percent, blockId: el?.id || sections[0].id, sectionId: el?.closest('.reading-section')?.id || sections[0].id, updatedAt: Date.now() });
  }
  function onScroll() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; persistPosition(); });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('reader-settings-changed', onScroll);
  write('lastOpened', slug);
  const resumeAlert = document.querySelector('[data-resume-alert]');
  if (saved?.percent > 0.5) {
    resumeAlert.classList.add('show');
    resumeAlert.querySelector('[data-resume-percent]').textContent = `${Math.round(saved.percent)}%`;
    resumeAlert.querySelector('[data-resume-button]').addEventListener('click', () => {
      const element = document.getElementById(saved.blockId) || document.getElementById(saved.sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  // URL com âncora explícita prevalece sobre posição salva. Sem âncora, retoma automaticamente.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!location.hash && saved?.blockId && saved.percent > 0.5) {
      const target = document.getElementById(saved.blockId) || document.getElementById(saved.sectionId);
      if (target) {
        const y = window.scrollY + target.getBoundingClientRect().top - 94;
        window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
      }
    }
    restored = true; nav.update(); persistPosition();
  }));
  document.querySelector('[data-reset-progress]')?.addEventListener('click', () => {
    if (!confirm('Reiniciar o progresso de leitura desta obra?')) return;
    remove(progressKey(slug));
    restored = false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* origens restritas podem impedir edição da URL */ }
    window.scrollTo({ top: 0, behavior: 'instant' });
    meter.style.width = '0%';
    resumeAlert?.classList.remove('show');
    setTimeout(() => { restored = true; }, 250);
    toast('Progresso reiniciado.');
  });
  initNarration({ sections, title, toast });
}
