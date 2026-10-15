import { getPreferences, updatePreferences } from './storage.js';

const clamp = (v, max) => Math.max(0, Math.min(max,
  Number.isFinite(Number(v)) ? Number(v) : 100));

/**
 * MP3: Web Audio GainNode permite amplificação acima de 100%, com limitador
 * para reduzir saturação. Voz nativa: SpeechSynthesisUtterance suporta 0..1.
 */
export function mountNarrationVolume({ player, audio = null }) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const canBoost = Boolean(audio && AudioContextClass);
  const max = canBoost ? 200 : 100;
  let volume = clamp(getPreferences().narrationVolume ?? 100, max);

  const wrapper = document.createElement('div');
  wrapper.className = 'narration-volume';
  wrapper.innerHTML = [
    '<label for="narration-volume">Volume da voz</label>',
    '<input type="range" id="narration-volume" min="0" max="' + max + '" step="5"',
    ' aria-label="Volume da narração">',
    '<output for="narration-volume"></output>'
  ].join('');
  // Controle independente do volume da música, no próprio player dos livros.
  player.appendChild(wrapper);
  const slider = wrapper.querySelector('input');
  const output = wrapper.querySelector('output');
  let context = null;
  let gain = null;

  function apply() {
    slider.value = String(volume);
    slider.setAttribute('aria-valuetext', volume + '%');
    output.textContent = volume + '%';
    if (audio) {
      if (gain && context) {
        audio.volume = 1;
        gain.gain.setTargetAtTime(volume / 100, context.currentTime, 0.012);
      } else {
        audio.volume = Math.min(1, volume / 100);
      }
    }
  }

  slider.addEventListener('input', () => {
    volume = clamp(slider.value, max);
    updatePreferences({ narrationVolume: volume });
    apply();
  });

  function resumeAudioContext() {
    if (!canBoost) return;
    if (!context) {
      try {
        context = new AudioContextClass();
        const source = context.createMediaElementSource(audio);
        gain = context.createGain();
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -2;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.2;
        source.connect(gain);
        gain.connect(limiter);
        limiter.connect(context.destination);
        apply();
      } catch {
        // Ainda é possível usar o controle padrão do audio até 100%.
        if (!gain) {
          volume = Math.min(volume, 100);
          slider.max = '100';
          apply();
        }
        return;
      }
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }

  apply();
  return { resumeAudioContext, getVolume: () => volume };
}
