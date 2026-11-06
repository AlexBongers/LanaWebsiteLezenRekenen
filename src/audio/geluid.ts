/**
 * Geluidseffecten, gemaakt met de Web Audio API (geen bestanden nodig).
 */
let ctx: AudioContext | null = null;
let uitgang: AudioNode | null = null;
let muziekAan = true;

export function zetEffectenAan(aan: boolean) {
  muziekAan = aan;
}

/** Moet aangeroepen worden vanuit een tik (anders blokkeert de browser geluid). */
export function ontgrendelGeluid() {
  if (!ctx) {
    ctx = new AudioContext();
    // Alle effecten via één hoofdvolume en een compressor: zo klinken ze ongeveer even hard.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    const hoofd = ctx.createGain();
    hoofd.gain.value = 0.7;
    hoofd.connect(compressor).connect(ctx.destination);
    uitgang = hoofd;
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

/** De gedeelde AudioContext (pas beschikbaar na de eerste tik). */
export function audioContext(): AudioContext | null {
  return ctx;
}

function toon(freq: number, start: number, duur: number, type: OscillatorType = 'sine', volume = 0.18) {
  if (!ctx || !uitgang || !muziekAan) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duur);
  osc.connect(gain).connect(uitgang);
  osc.start(t0);
  osc.stop(t0 + duur + 0.05);
}

/** Goed antwoord: vrolijk "ting-ting". */
export function speelGoed() {
  toon(880, 0, 0.25, 'triangle', 0.2);
  toon(1320, 0.1, 0.35, 'triangle', 0.2);
}

/** Fout antwoord: zacht, niet streng. */
export function speelBijna() {
  toon(330, 0, 0.18, 'triangle', 0.2);
  toon(262, 0.12, 0.25, 'triangle', 0.2);
}

/** Demon verdwijnt: "poef". */
export function speelPoef() {
  if (!ctx || !uitgang || !muziekAan) return;
  const duur = 0.35;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const bron = ctx.createBufferSource();
  bron.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duur);
  const gain = ctx.createGain();
  gain.gain.value = 0.35;
  bron.connect(filter).connect(gain).connect(uitgang!);
  bron.start();
}

/** Concert gewonnen: fanfare. */
export function speelFanfare() {
  [523, 659, 784, 1047].forEach((f, i) => toon(f, i * 0.13, 0.4, 'triangle', 0.18));
  toon(1047, 0.6, 0.9, 'triangle', 0.16);
  toon(1319, 0.6, 0.9, 'triangle', 0.12);
}

/** Tik op een knop. */
export function speelTik() {
  toon(660, 0, 0.08, 'triangle', 0.12);
}

/** Combo: snel oplopend loopje. */
export function speelCombo() {
  [784, 988, 1175, 1568].forEach((f, i) => toon(f, i * 0.07, 0.22, 'triangle', 0.18));
}
