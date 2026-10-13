import { getPreferences, updatePreferences } from './storage.js';

export function initSpeech({ sections, title, toast }) {
  const synth = window.speechSynthesis;
  const supported = Boolean(synth && window.SpeechSynthesisUtterance);
  const player = document.getElementById('audio-player');
  const startSection = document.querySelector('[data-speech-section]');
  const startAll = document.querySelector('[data-speech-all]');
  const playPause = document.querySelector('[data-player-playpause]');
  const stopButton = document.querySelector('[data-player-stop]');
  const nextButton = document.querySelector('[data-player-next]');
  const prevButton = document.querySelector('[data-player-prev]');
  const voiceSelect = document.querySelector('[data-voice-select]');
  const rateSelect = document.querySelector('[data-rate-select]');
  const chapterLabel = document.querySelector('[data-audio-section]');
  const warning = document.querySelector('[data-voice-message]');
  const spokenBlocks = sections.map(section => [...section.querySelectorAll('[data-readable]')]);
  const titles = sections.map(section => section.querySelector('h2')?.textContent.trim() || 'Seção');
  let voices = [];
  let activeSection = 0;
  let queue = [];
  let queueIndex = 0;
  let runToken = 0;
  let mode = 'section';
  let playing = false;
  let paused = false;
  let currentElement = null;
  const MAX_SEGMENT = 200;
  const preferred = () => getPreferences();

  function status(text) { warning.textContent = text; }
  function changePlayButton() {
    const text = playing && !paused ? 'Pausar' : 'Reproduzir';
    playPause.setAttribute('aria-label', text);
    playPause.setAttribute('title', text);
    playPause.querySelector('[data-icon-play]').hidden = playing && !paused;
    playPause.querySelector('[data-icon-pause]').hidden = !playing || paused;
  }
  function cleanHighlight() { currentElement?.classList.remove('spoken'); currentElement = null; }
  function highlight(block) {
    if (block === currentElement) return;
    cleanHighlight(); currentElement = block;
    if (block) {
      block.classList.add('spoken');
      const rect = block.getBoundingClientRect();
      if (rect.top < 90 || rect.bottom > window.innerHeight * .78) {
        const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        block.scrollIntoView({ behavior, block: 'center' });
      }
    }
  }
  function selectedVoice() { return voices.find(v => v.voiceURI === voiceSelect.value) || null; }
  function voiceList() {
    if (!supported) return;
    voices = synth.getVoices();
    const pt = voices.filter(v => /^pt(?:-|$)/i.test(v.lang));
    pt.sort((a,b) => Number(/^pt-BR$/i.test(b.lang)) - Number(/^pt-BR$/i.test(a.lang)) || a.name.localeCompare(b.name));
    voiceSelect.replaceChildren();
    for (const v of pt) {
      const option = document.createElement('option');
      option.value = v.voiceURI; option.textContent = `${v.name} (${v.lang})`;
      voiceSelect.appendChild(option);
    }
    const p = preferred();
    const stored = pt.find(v => v.voiceURI === p.voiceURI);
    const selected = stored || pt.find(v => /^pt-BR$/i.test(v.lang)) || pt[0];
    if (selected) voiceSelect.value = selected.voiceURI;
    voiceSelect.disabled = !pt.length;
    if (!voices.length) status('Aguardando as vozes do navegador. O recurso depende do dispositivo.');
    else if (!pt.length) status('Nenhuma voz em português encontrada neste navegador. A voz padrão do dispositivo será usada, se disponível.');
    else if (!pt.some(v => /^pt-BR$/i.test(v.lang))) status('Nenhuma voz pt-BR encontrada. Será utilizada uma voz em outra variante do português.');
    else status('A narração utiliza as vozes instaladas no navegador e pode ser interrompida ao bloquear a tela.');
  }
  function splitSpeech(text) {
    // Segmentos curtos contornam a interrupção silenciosa de falas longas em alguns navegadores.
    const sentences = text.replace(/\s+/g,' ').trim().match(/[^.!?;:]+[.!?;:]*/g) || [text];
    const segments = [];
    let part = '';
    function flush() { if (part.trim()) segments.push(part.trim()); part = ''; }
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      for (const word of words) {
        if (part.length + word.length + 1 > MAX_SEGMENT) flush();
        if (word.length > MAX_SEGMENT) {
          for (let i=0;i<word.length;i+=MAX_SEGMENT) segments.push(word.slice(i,i+MAX_SEGMENT));
        } else part += `${part ? ' ' : ''}${word}`;
      }
      if (part.length > MAX_SEGMENT * .73) flush();
    }
    flush();
    return segments;
  }
  function queueFor(index) {
    const blocks = spokenBlocks[index] || [];
    return blocks.flatMap(block => splitSpeech(block.textContent).map(text => ({ text, block })));
  }
  function labelSection() {
    chapterLabel.textContent = `${String(activeSection+1).padStart(2,'0')} · ${titles[activeSection]}`;
    prevButton.disabled = activeSection === 0;
    nextButton.disabled = activeSection === sections.length-1;
  }
  function stop(hide = true) {
    runToken++;
    playing = false; paused = false; queue = []; queueIndex = 0;
    try { synth?.cancel(); } catch { /* em alguns dispositivos, speechSynthesis falha ao cancelar */ }
    cleanHighlight(); changePlayButton();
    if (hide) player.classList.remove('active');
  }
  function announceSegment(token) {
    if (token !== runToken || !playing || paused) return;
    if (queueIndex >= queue.length) {
      if (mode === 'all' && activeSection + 1 < sections.length) {
        moveTo(activeSection + 1, true); return;
      }
      stop(false);
      status('Narração concluída. Se desejar, inicie uma nova leitura.');
      return;
    }
    const segment = queue[queueIndex];
    let utterance;
    try { utterance = new SpeechSynthesisUtterance(segment.text); }
    catch { stop(false); status('Não foi possível inicializar a voz neste navegador.'); return; }
    utterance.lang = selectedVoice()?.lang || 'pt-BR';
    if (selectedVoice()) utterance.voice = selectedVoice();
    utterance.rate = Number(rateSelect.value);
    utterance.onstart = () => { if (token === runToken) highlight(segment.block); };
    utterance.onend = () => {
      if (token !== runToken || !playing) return;
      queueIndex++;
      // Mantém cada fala curta e encadeia somente após o término real da anterior.
      announceSegment(token);
    };
    utterance.onerror = (event) => {
      if (token !== runToken || !playing) return;
      if (['interrupted','canceled'].includes(event.error)) return;
      stop(false);
      status(`A narração foi interrompida (${event.error || 'falha desconhecida'}). Tente iniciar novamente.`);
    };
    try { synth.speak(utterance); }
    catch { stop(false); status('Este navegador não conseguiu iniciar a narração.'); }
  }
  function moveTo(index, keepMode = true) {
    if (!supported || index < 0 || index >= sections.length) return;
    const selectedMode = keepMode ? mode : 'section';
    stop(false);
    mode = selectedMode;
    activeSection = index;
    labelSection();
    queue = queueFor(index);
    if (!queue.length) { status('Não há texto narrável nesta seção.'); return; }
    player.classList.add('active');
    playing = true; paused = false; changePlayButton();
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    announceSegment(runToken);
  }
  function visibleSectionIndex() {
    let candidate = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= window.innerHeight*.45) candidate = i;
    }
    return candidate;
  }
  startSection?.addEventListener('click', () => { mode = 'section'; moveTo(visibleSectionIndex()); });
  startAll?.addEventListener('click', () => { mode = 'all'; moveTo(visibleSectionIndex()); });
  playPause?.addEventListener('click', () => {
    if (!playing) { mode = 'section'; moveTo(activeSection); return; }
    if (paused) {
      try { synth.resume(); paused = false; changePlayButton(); }
      catch { status('O navegador não conseguiu retomar. Interrompa e inicie novamente.'); }
    } else {
      try { synth.pause(); paused = true; changePlayButton(); }
      catch { status('Este navegador não oferece pausa confiável. Use parar e reproduzir.'); }
    }
  });
  stopButton?.addEventListener('click', () => stop());
  nextButton?.addEventListener('click', () => moveTo(activeSection + 1));
  prevButton?.addEventListener('click', () => moveTo(activeSection - 1));
  voiceSelect?.addEventListener('change', () => {
    updatePreferences({ voiceURI: voiceSelect.value });
    if (playing) { const i = activeSection; moveTo(i); status('Voz alterada. Seção reiniciada para aplicar a escolha.'); }
  });
  rateSelect.value = String(preferred().rate || 1);
  rateSelect.addEventListener('change', () => {
    updatePreferences({ rate: Number(rateSelect.value) });
    if (playing) status('A nova velocidade será aplicada ao próximo trecho narrado.');
  });
  labelSection(); changePlayButton();
  if (!supported) {
    startSection.disabled = true; startAll.disabled = true;
    document.querySelector('.voice-hint').textContent = 'Leitura em voz alta indisponível neste navegador.';
    return;
  }
  voiceList();
  synth.addEventListener?.('voiceschanged', voiceList);
  window.addEventListener('pagehide', () => stop());
}
