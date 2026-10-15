import { getPreferences, updatePreferences } from './storage.js';

const POSITION_KEY = 'acervo-compacto.music.position.v1';
const clamp = value => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 20));

// O arquivo é compartilhado por todas as páginas: caminho relativo ao módulo.
export function initBackgroundMusic() {
  const controls = document.querySelector('.top-actions');
  if (!controls) return;

  const preference = getPreferences();
  let volume = clamp(preference.musicVolume ?? 20);
  let muted = Boolean(preference.musicMuted);
  const audio = new Audio(new URL('../music-background.mp3', import.meta.url).href);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = volume / 100;
  audio.muted = muted;
  audio.setAttribute('playsinline', '');

  const mini = document.createElement('div');
  mini.className = 'music-mini';
  mini.setAttribute('role', 'group');
  mini.setAttribute('aria-label', 'Música ambiente');
  mini.innerHTML = [
    '<span class="music-mini-label" aria-hidden="true">Música</span>',
    '<button class="music-mini-mute" type="button" aria-label="Silenciar música"',
    ' title="Silenciar música" aria-pressed="false">',
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"',
    ' fill="none" stroke="currentColor" stroke-width="1.8"',
    ' stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M11 5 6 9H3v6h3l5 4V5Z"/>',
    '<path class="music-icon-sound" d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>',
    '<path class="music-icon-muted" d="m16 9 5 6m0-6-5 6" hidden/>',
    '</svg></button>',
    '<label class="sr-only" for="ambient-volume">Volume da música ambiente</label>',
    '<input id="ambient-volume" type="range" min="0" max="100" step="1"',
    ' aria-label="Volume da música ambiente">',
    '<output class="music-mini-value" for="ambient-volume"></output>'
  ].join('');
  controls.prepend(mini);
  const muteButton = mini.querySelector('.music-mini-mute');
  const slider = mini.querySelector('#ambient-volume');
  const output = mini.querySelector('output');

  function draw() {
    slider.value = String(volume);
    output.textContent = volume + '%';
    audio.volume = volume / 100;
    audio.muted = muted || volume === 0;
    muteButton.setAttribute('aria-pressed', String(audio.muted));
    muteButton.setAttribute('aria-label', audio.muted ? 'Ativar música' : 'Silenciar música');
    muteButton.title = audio.muted ? 'Ativar música' : 'Silenciar música';
    mini.querySelector('.music-icon-sound').hidden = audio.muted;
    mini.querySelector('.music-icon-muted').hidden = !audio.muted;
  }

  function restorePosition() {
    try {
      const seconds = Number(sessionStorage.getItem(POSITION_KEY));
      if (Number.isFinite(seconds) && seconds > 0 && Number.isFinite(audio.duration) && audio.duration > 0)
        audio.currentTime = seconds % audio.duration;
    } catch { /* modo privado: apenas reinicia a faixa */ }
  }

  function savePosition() {
    try { sessionStorage.setItem(POSITION_KEY, String(audio.currentTime || 0)); }
    catch { /* sem acesso ao armazenamento de sessão */ }
  }

  let starting = false;
  function tryStart() {
    if (starting || !audio.paused) return;
    starting = true;
    let promise;
    try { promise = audio.play(); }
    catch { starting = false; return; }
    Promise.resolve(promise).then(() => {
      starting = false;
      document.removeEventListener('pointerdown', tryStart, true);
      document.removeEventListener('click', tryStart, true);
      document.removeEventListener('keydown', onKeyboard, true);
    }).catch(() => { starting = false; }); // Autoplay bloqueado: tenta na próxima interação.
  }

  function onKeyboard(event) {
    if (event.key === 'Enter' || event.key === ' ' || event.key.startsWith('Arrow')) tryStart();
  }

  muteButton.addEventListener('click', () => {
    muted = !muted;
    updatePreferences({ musicMuted: muted });
    draw();
    tryStart();
  });
  slider.addEventListener('input', () => {
    volume = clamp(slider.value);
    if (volume > 0 && muted) muted = false;
    updatePreferences({ musicVolume: volume, musicMuted: muted });
    draw();
    tryStart();
  });

  audio.addEventListener('loadedmetadata', restorePosition, { once: true });
  audio.addEventListener('error', () => {
    mini.title = 'A faixa de música não pôde ser carregada.';
  });
  window.addEventListener('pagehide', savePosition);

  // No celular o miniplayer fica acima do player de narração, sem encobri-lo.
  const voicePlayer = document.getElementById('audio-player');
  if (voicePlayer) {
    const syncHeight = () => {
      const shown = voicePlayer.classList.contains('active');
      mini.style.setProperty('--narration-player-height',
        shown ? Math.ceil(voicePlayer.getBoundingClientRect().height) + 'px' : '0px');
    };
    new MutationObserver(syncHeight).observe(voicePlayer, { attributes: true, attributeFilter: ['class'] });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncHeight).observe(voicePlayer);
    syncHeight();
  }

  draw();
  document.addEventListener('pointerdown', tryStart, true);
  document.addEventListener('click', tryStart, true);
  document.addEventListener('keydown', onKeyboard, true);
  // A tentativa de autoplay só funciona onde o navegador permitir.
  tryStart();
}
