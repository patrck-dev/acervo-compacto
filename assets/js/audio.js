import { getPreferences, updatePreferences, read, write } from './storage.js';
import { initSpeech } from './speech.js';
import { mountNarrationVolume } from './narration-volume.js';

// Player de áudios estáticos por seção; mantém a Web Speech API como fallback.
export async function initNarration({ sections, title, toast }) {
  const slug = document.body.dataset.book;
  const launchButtons = [
    document.querySelector('[data-speech-section]'),
    document.querySelector('[data-speech-all]')
  ].filter(Boolean);
  launchButtons.forEach(button => { button.disabled = true; });
  const fallback = () => {
    launchButtons.forEach(button => { button.disabled = false; });
    initSpeech({ sections, title, toast });
  };
  const manifestURL = new URL('../audio/' + encodeURIComponent(slug) + '/manifest.json', import.meta.url);
  let manifest;
  try {
    const response = await fetch(manifestURL, { cache: 'no-cache' });
    if (!response.ok) return fallback();
    manifest = await response.json();
    if (manifest.version !== 1 || manifest.book !== slug || !Array.isArray(manifest.sections)) {
      throw new Error('Manifesto inválido');
    }
  } catch {
    return fallback();
  }
  const tracks = new Map(manifest.sections.map(track => [track.id, track]));
  if (sections.some(section => {
    const file = tracks.get(section.id)?.file;
    return !file || !/^[a-zA-Z0-9_-]+\.mp3$/.test(file);
  })) return fallback();

  const player = document.getElementById('audio-player');
  const playPause = document.querySelector('[data-player-playpause]');
  const stopButton = document.querySelector('[data-player-stop]');
  const nextButton = document.querySelector('[data-player-next]');
  const prevButton = document.querySelector('[data-player-prev]');
  const rateSelect = document.querySelector('[data-rate-select]');
  const voiceSelect = document.querySelector('[data-voice-select]');
  const chapterLabel = document.querySelector('[data-audio-section]');
  const message = document.querySelector('[data-voice-message]');
  const titles = sections.map(s => s.querySelector('h2')?.textContent.trim() || s.id);
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.playbackRate = Number(getPreferences().rate) || 1;
  let activeSection = 0;
  let mode = 'section';
  let currentHighlight = null;
  let sequence = 0;
  let lastSavedAt = 0;
  const key = 'audioProgress.' + slug;
  const saved = read(key, null);
  const currentID = sections.findIndex(s => s.id === saved?.sectionId);
  if (currentID >= 0) activeSection = currentID;

  voiceSelect.replaceChildren();
  const option = document.createElement('option');
  option.value = 'neural';
  const voiceNames = { pf_dora: 'Dora', pm_alex: 'Alex', pm_santa: 'Santa' };
  option.textContent = (voiceNames[manifest.voice] || 'Neural') + ' · pt-BR';
  voiceSelect.appendChild(option);
  voiceSelect.disabled = true;
  rateSelect.value = String(getPreferences().rate || 1);
  message.textContent = 'Áudio neural gerado previamente. Sem síntese de voz no seu dispositivo.';

  const seekRow = document.createElement('div');
  seekRow.className = 'audio-position';
  const elapsed = document.createElement('span');
  elapsed.className = 'audio-time';
  elapsed.textContent = '0:00';
  const seek = document.createElement('input');
  seek.type = 'range';
  seek.min = '0';
  seek.max = '1000';
  seek.step = '1';
  seek.value = '0';
  seek.disabled = true;
  seek.setAttribute('aria-label', 'Posição do áudio');
  const total = document.createElement('span');
  total.className = 'audio-time';
  total.textContent = '0:00';
  seekRow.append(elapsed, seek, total);
  player.appendChild(seekRow);
  const narrationVolume = mountNarrationVolume({ player, audio });

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const s = Math.floor(seconds);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function updateTime() {
    const duration = audio.duration;
    elapsed.textContent = formatTime(audio.currentTime);
    total.textContent = formatTime(duration);
    seek.disabled = !Number.isFinite(duration) || duration <= 0;
    if (!seek.matches(':active') && !seek.disabled) {
      seek.value = String(Math.round((audio.currentTime / duration) * 1000));
    }
  }
  function savePosition(completed = false) {
    if (!audio.src) return;
    write(key, { sectionId: sections[activeSection].id,
      time: completed ? 0 : Math.max(0, audio.currentTime),
      completed, updatedAt: Date.now() });
  }
  function buttons() {
    const playing = !audio.paused && !audio.ended;
    playPause.querySelector('[data-icon-play]').hidden = playing;
    playPause.querySelector('[data-icon-pause]').hidden = !playing;
    playPause.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
    playPause.setAttribute('title', playing ? 'Pausar' : 'Reproduzir');
    prevButton.disabled = activeSection === 0;
    nextButton.disabled = activeSection === sections.length - 1;
  }
  function highlight() {
    currentHighlight?.classList.remove('spoken');
    const block = sections[activeSection].querySelector('[data-readable]');
    currentHighlight = block;
    if (!block) return;
    block.classList.add('spoken');
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    block.scrollIntoView({ behavior, block: 'center' });
  }
  function setSection(index) {
    activeSection = index;
    chapterLabel.textContent = String(index + 1).padStart(2, '0') + ' · ' + titles[index];
    buttons();
  }
  async function attemptPlay(token) {
    narrationVolume.resumeAudioContext();
    try {
      await audio.play();
      if (token === sequence) message.textContent = '';
    } catch (error) {
      if (token !== sequence || error.name === 'AbortError') return;
      message.textContent = 'Não foi possível reproduzir o MP3. Verifique a conexão e tente novamente.';
    }
    buttons();
  }
  function start(index, playbackMode = 'section', position = 0) {
    if (index < 0 || index >= sections.length) return;
    savePosition();
    sequence += 1;
    const token = sequence;
    mode = playbackMode;
    const track = tracks.get(sections[index].id);
    audio.pause();
    audio.src = new URL(track.file, manifestURL).href;
    audio.load();
    setSection(index);
    player.classList.add('active');
    highlight();
    const onMetadata = () => {
      if (token !== sequence) return;
      if (position > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(position, Math.max(0, audio.duration - .5));
      }
      updateTime();
    };
    audio.addEventListener('loadedmetadata', onMetadata, { once: true });
    attemptPlay(token);
  }
  function visibleSectionIndex() {
    let candidate = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * .45) candidate = i;
    });
    return candidate;
  }
  function stop() {
    savePosition();
    sequence++;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    currentHighlight?.classList.remove('spoken');
    currentHighlight = null;
    player.classList.remove('active');
    buttons();
    updateTime();
  }
  launchButtons[0]?.addEventListener('click', () => {
    const index = visibleSectionIndex();
    const state = read(key, null);
    const resume = state?.sectionId === sections[index].id && !state.completed
      ? Number(state.time) || 0 : 0;
    start(index, 'section', resume);
  });
  launchButtons[1]?.addEventListener('click', () => start(visibleSectionIndex(), 'all'));
  playPause.addEventListener('click', () => {
    if (!audio.src) {
      const state = read(key, null);
      const position = state?.sectionId === sections[activeSection].id ? Number(state.time) || 0 : 0;
      start(activeSection, 'section', position);
    } else if (audio.paused) attemptPlay(sequence);
    else audio.pause();
    buttons();
  });
  prevButton.addEventListener('click', () => start(activeSection - 1, mode));
  nextButton.addEventListener('click', () => start(activeSection + 1, mode));
  stopButton.addEventListener('click', stop);
  rateSelect.addEventListener('change', () => {
    const rate = Number(rateSelect.value);
    if (!Number.isFinite(rate) || rate < .8 || rate > 1.5) return;
    updatePreferences({ rate });
    audio.playbackRate = rate;
  });
  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(seek.value) / 1000;
    updateTime();
  });
  audio.addEventListener('loadedmetadata', updateTime);
  audio.addEventListener('timeupdate', () => {
    updateTime();
    if (Date.now() - lastSavedAt > 1500) {
      lastSavedAt = Date.now();
      savePosition();
    }
  });
  audio.addEventListener('pause', buttons);
  audio.addEventListener('play', buttons);
  audio.addEventListener('error', () => {
    if (audio.src) message.textContent = 'MP3 indisponível. Confirme que a geração automática terminou.';
    buttons();
  });
  audio.addEventListener('ended', () => {
    savePosition(true);
    if (mode === 'all' && activeSection < sections.length - 1) {
      start(activeSection + 1, mode);
    } else {
      message.textContent = 'Narração concluída.';
      buttons();
    }
  });
  window.addEventListener('pagehide', () => {
    savePosition();
    audio.pause();
  });
  setSection(activeSection);
  updateTime();
  launchButtons.forEach(button => { button.disabled = false; });
}
