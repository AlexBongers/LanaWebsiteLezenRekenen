/**
 * De stem van de site.
 * 1. Eerst kijken of er een vooraf gemaakt mp3-bestand is (Azure-stem, zie tools/maak-audio.ts).
 * 2. Zo niet: de ingebouwde stem van de tablet (Web Speech API).
 */
import stemInstellingen from '../../content/stem.json';
import { audioSleutel, normaliseer, type Spreeksoort } from './hash';

type Manifest = { stem: string; bestanden: string[] };

let manifest: Manifest = { stem: stemInstellingen.stem, bestanden: [] };
let beschikbaar = new Set<string>();
let apparaatStemUri: string | null = null;
let huidigeAudio: HTMLAudioElement | null = null;
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
    for (const b of bestanden) {
      if (mijnBeurt !== beurt) return;
      await speelBestand(b, mijnBeurt);
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
