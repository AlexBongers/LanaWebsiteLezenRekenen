/**
 * De stem van de site.
 * 1. Eerst kijken of er een vooraf gemaakt mp3-bestand is (ElevenLabs-stem, zie tools/maak-audio.ts).
 * 2. Zo niet: de ingebouwde stem van de tablet (Web Speech API).
 */
import stemInstellingen from '../../content/stem.json';
import { audioSleutel, normaliseer, type Spreeksoort } from './hash';
import { audioContext } from './geluid';

type Manifest = { stem: string; bestanden: string[] };

let manifest: Manifest = { stem: stemInstellingen.stem, bestanden: [] };
let beschikbaar = new Set<string>();
let apparaatStemUri: string | null = null;
let huidigeAudio: HTMLAudioElement | null = null;
let huidigeBron: AudioBufferSourceNode | null = null;
let beurt = 0;

const TEMPO: Record<Spreeksoort, number> = { instructie: 0.95, woord: 0.8, zin: 0.9, getal: 0.95 };

export async function laadStemManifest() {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}audio/audio-manifest.json`, { cache: 'no-cache' });
    if (r.ok) {
      manifest = await r.json();
      beschikbaar = new Set(manifest.bestanden);
    }
  } catch {
    // Geen manifest: dan alleen de tabletstem.
  }
}

export function aantalStemBestanden() {
  return beschikbaar.size;
}

function bestandVoor(tekst: string, soort: Spreeksoort): string | null {
  const sleutel = audioSleutel(tekst, soort, manifest.stem);
  return beschikbaar.has(sleutel) ? `${import.meta.env.BASE_URL}audio/tts/${sleutel}.mp3` : null;
}

// ---------- Tabletstem ----------

export function nederlandseStemmen(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('nl'));
}

export function zetApparaatStem(uri: string | null) {
  apparaatStemUri = uri;
}

function kiesApparaatStem(): SpeechSynthesisVoice | undefined {
  const stemmen = nederlandseStemmen();
  const nlNL = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-') === 'nl-nl';
  return (
    stemmen.find((v) => v.voiceURI === apparaatStemUri) ??
    stemmen.find((v) => nlNL(v) && /female|vrouw/i.test(v.name)) ??
    stemmen.find(nlNL) ??
    stemmen[0]
  );
}

function spreekMetApparaat(tekst: string, soort: Spreeksoort, mijnBeurt: number): Promise<void> {
  return new Promise((klaar) => {
    if (!('speechSynthesis' in window) || mijnBeurt !== beurt) return klaar();
    const u = new SpeechSynthesisUtterance(tekst);
    u.lang = 'nl-NL';
    const stem = kiesApparaatStem();
    if (stem) u.voice = stem;
    u.rate = TEMPO[soort];
    u.pitch = 1.1;
    // Chrome vergeet soms "onend"; daarom ook een veiligheidstimer.
    const timer = setTimeout(klaar, 1500 + tekst.length * 120);
    u.onend = u.onerror = () => {
      clearTimeout(timer);
      klaar();
    };
    speechSynthesis.speak(u);
  });
}

// ---------- mp3 ----------

/**
 * Stemfragmenten via Web Audio: stilte aan begin en eind wordt weggeknipt,
 * zodat Lana niet hoeft te wachten en de stukjes van een som direct op elkaar aansluiten.
 */
type Fragment = { buffer: AudioBuffer; start: number; duur: number };
const fragmenten = new Map<string, Promise<Fragment | null>>();
const DREMPEL = 0.012;

function knipStilte(buffer: AudioBuffer): Fragment {
  const data = buffer.getChannelData(0);
  let begin = 0;
  while (begin < data.length && Math.abs(data[begin]) < DREMPEL) begin++;
  let eind = data.length - 1;
  while (eind > begin && Math.abs(data[eind]) < DREMPEL) eind--;
  if (eind <= begin) return { buffer, start: 0, duur: buffer.duration };
  const marge = Math.floor(buffer.sampleRate * 0.03);
  const van = Math.max(0, begin - marge);
  const tot = Math.min(data.length - 1, eind + marge * 2);
  return { buffer, start: van / buffer.sampleRate, duur: (tot - van) / buffer.sampleRate };
}

function laadFragment(url: string): Promise<Fragment | null> {
  const ctx = audioContext();
  if (!ctx) return Promise.resolve(null);
  let f = fragmenten.get(url);
  if (!f) {
    f = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => ctx.decodeAudioData(data))
      .then(knipStilte)
      .catch(() => null);
    fragmenten.set(url, f);
    // Niet eindeloos onthouden.
    if (fragmenten.size > 400) fragmenten.delete(fragmenten.keys().next().value!);
  }
  return f;
}

function speelFragment(f: Fragment, mijnBeurt: number): Promise<void> {
  return new Promise((klaar) => {
    const ctx = audioContext();
    if (!ctx || mijnBeurt !== beurt) return klaar();
    if (ctx.state === 'suspended') void ctx.resume();
    const bron = ctx.createBufferSource();
    bron.buffer = f.buffer;
    bron.connect(ctx.destination);
    huidigeBron = bron;
    bron.onended = () => {
      if (huidigeBron === bron) huidigeBron = null;
      klaar();
    };
    bron.start(0, f.start, f.duur);
  });
}

function speelBestand(url: string, mijnBeurt: number): Promise<void> {
  return new Promise((klaar) => {
    if (mijnBeurt !== beurt) return klaar();
    const audio = new Audio(url);
    huidigeAudio = audio;
    audio.onended = audio.onerror = () => klaar();
    audio.play().catch(() => klaar());
  });
}

// ---------- Wat wordt er nu gezegd? (voor de tekstballon) ----------

type Luisteraar = (tekst: string | null, soort: Spreeksoort) => void;
const luisteraars = new Set<Luisteraar>();

export function luisterNaarStem(cb: Luisteraar): () => void {
  luisteraars.add(cb);
  return () => luisteraars.delete(cb);
}

function meld(tekst: string | null, soort: Spreeksoort = 'instructie') {
  luisteraars.forEach((cb) => cb(tekst, soort));
}

// ---------- Openbaar ----------

export function stopSpreken() {
  beurt++;
  meld(null);
  if (huidigeAudio) {
    huidigeAudio.pause();
    huidigeAudio = null;
  }
  if (huidigeBron) {
    try {
      huidigeBron.stop();
    } catch {
      // al gestopt
    }
    huidigeBron = null;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/**
 * Spreek een tekst uit. Een lijst wordt achter elkaar uitgesproken
 * (bijv. ["47", "plus", "8"]) als alle stukjes als bestand bestaan;
 * anders wordt de hele zin in één keer door de tabletstem gezegd.
 */
export async function spreek(tekst: string | string[], soort: Spreeksoort = 'instructie'): Promise<void> {
  stopSpreken();
  const mijnBeurt = beurt;
  const delen = (Array.isArray(tekst) ? tekst : [tekst]).map(normaliseer).filter(Boolean);
  const bestanden = delen.map((d) => bestandVoor(d, soort));
  meld(delen.join(' '), soort);
  if (bestanden.every((b): b is string => b !== null)) {
    // Alle stukjes alvast tegelijk laden, dan zonder pauze achter elkaar afspelen.
    const geladen = bestanden.map(laadFragment);
    for (let i = 0; i < bestanden.length; i++) {
      if (mijnBeurt !== beurt) return;
      const f = await geladen[i];
      if (mijnBeurt !== beurt) return;
      if (f) await speelFragment(f, mijnBeurt);
      else await speelBestand(bestanden[i], mijnBeurt);
    }
  } else {
    await spreekMetApparaat(delen.join(' '), soort, mijnBeurt);
  }
  if (mijnBeurt === beurt) meld(null, soort);
}

/** Zet een som om naar losse stukjes om uit te spreken. */
export function somDelen(a: number, op: '+' | '-', b: number, antwoord?: number): string[] {
  const delen = [String(a), op === '+' ? 'plus' : 'min', String(b)];
  if (antwoord !== undefined) delen.push('is', String(antwoord));
  return delen;
}

// Stemmen laden vaak pas na een tijdje.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices());
}
