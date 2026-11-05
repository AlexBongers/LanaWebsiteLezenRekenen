/**
 * Maakt mp3-bestanden van alle teksten met een stemgenerator (Google, ElevenLabs of Microsoft Azure).
 *
 *   npm run audio:proef            laat zien wat er gemaakt gaat worden (kost niets)
 *   npm run audio -- --proef       maakt proefstemmen in public/audio/proef/ (laat Lana kiezen!)
 *   npm run audio -- --stemmen     zoekt Nederlandse vrouwenstemmen in de ElevenLabs-bibliotheek
 *   npm run audio                  maakt alle ontbrekende bestanden + audio-manifest.json
 *
 * Sleutels: GOOGLE_TTS_API_KEY, ELEVENLABS_API_KEY of AZURE_SPEECH_KEY (+ AZURE_SPEECH_REGION),
 * als omgevingsvariabele of in een .env-bestand (zie .env.example).
 * Provider, stem en tempo staan in content/stem.json.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import stemInfo from '../content/stem.json';
import { alleTeksten } from '../src/audio/alle-teksten';
import { audioSleutel, normaliseer, type Spreeksoort } from '../src/audio/hash';

const MAP = join(import.meta.dirname, '..', 'public', 'audio');
const TTS = join(MAP, 'tts');
const PROEF = join(MAP, 'proef');

try {
  process.loadEnvFile(join(import.meta.dirname, '..', '.env'));
} catch {
  // geen .env; de variabelen staan misschien al in de omgeving
}

type Provider = 'google' | 'elevenlabs' | 'azure';
const args = new Set(process.argv.slice(2));

async function metHerhaling(doe: () => Promise<Response>): Promise<Buffer> {
  for (let poging = 1; poging <= 5; poging++) {
    const r = await doe();
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 1000 * 2 ** poging));
      continue;
    }
    throw new Error(`fout ${r.status}: ${(await r.text()).slice(0, 400)}`);
  }
  throw new Error('de dienst blijft "te druk" zeggen; probeer het later nog eens.');
}

// ---------- Google Cloud Text-to-Speech ----------
let googleTempoWerkt = true;

async function google(tekst: string, stem: string, soort: Spreeksoort): Promise<Buffer> {
  const sleutel = process.env.GOOGLE_TTS_API_KEY;
  if (!sleutel) throw new Error('GOOGLE_TTS_API_KEY ontbreekt (zie .env.example).');
  const vraag = async (metTempo: boolean) => {
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${sleutel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: normaliseer(tekst) },
        voice: { languageCode: 'nl-NL', name: stem },
        audioConfig: { audioEncoding: 'MP3', ...(metTempo ? { speakingRate: stemInfo.google.tempo[soort] } : {}) },
      }),
    });
    return r;
  };
  for (let poging = 1; poging <= 5; poging++) {
    let r = await vraag(googleTempoWerkt);
    if (r.status === 400 && googleTempoWerkt) {
      // Sommige stemmen kennen geen tempo-instelling; dan zonder.
      const fout = await r.text();
      if (/speaking.?rate|pace/i.test(fout)) {
        googleTempoWerkt = false;
        r = await vraag(false);
      } else throw new Error(`fout 400: ${fout.slice(0, 400)}`);
    }
    if (r.ok) {
      const data = (await r.json()) as { audioContent: string };
      return Buffer.from(data.audioContent, 'base64');
    }
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 1000 * 2 ** poging));
      continue;
    }
    throw new Error(`fout ${r.status}: ${(await r.text()).slice(0, 400)}`);
  }
  throw new Error('Google blijft "te druk" zeggen; probeer het later nog eens.');
}

// ---------- ElevenLabs ----------
function elevenSleutel() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error('ELEVENLABS_API_KEY ontbreekt (zie .env.example).');
  return k;
}

async function elevenlabs(tekst: string, stem: string, soort: Spreeksoort): Promise<Buffer> {
  const e = stemInfo.elevenlabs;
  // Losse woorden en getallen: model dat Nederlands kan afdwingen (anders klinkt "maan" soms Engels).
  const kort = soort === 'woord' || soort === 'getal';
  const model = kort ? e.modelWoorden : e.modelZinnen;
  const body: Record<string, unknown> = {
    text: normaliseer(tekst),
    model_id: model,
    voice_settings: {
      stability: e.stabiliteit,
      similarity_boost: e.gelijkenis,
      style: e.stijl,
      use_speaker_boost: true,
      speed: e.tempo[soort],
    },
  };
  if (/turbo_v2_5|flash_v2_5/.test(model)) body.language_code = 'nl';
  return metHerhaling(() =>
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${stem}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': elevenSleutel(), 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    }),
  );
}

async function zoekNederlandseStemmen() {
  const r = await fetch('https://api.elevenlabs.io/v1/shared-voices?language=nl&gender=female&page_size=30', {
    headers: { 'xi-api-key': elevenSleutel() },
  });
  if (!r.ok) throw new Error(`fout ${r.status}: ${await r.text()}`);
  const data = (await r.json()) as {
    voices: { name: string; voice_id: string; public_owner_id: string; accent?: string; age?: string; description?: string; preview_url?: string }[];
  };
  for (const v of data.voices) {
    console.log(`${v.name}  [${v.accent ?? '?'}, ${v.age ?? '?'}]  voice_id=${v.voice_id}  owner=${v.public_owner_id}`);
    if (v.description) console.log(`   ${v.description.slice(0, 120)}`);
    if (v.preview_url) console.log(`   voorbeeld: ${v.preview_url}`);
  }
  console.log('\nEen stem uit de bibliotheek gebruiken? Voeg hem toe aan "My Voices" op elevenlabs.io, of via:');
  console.log('POST https://api.elevenlabs.io/v1/voices/add/{owner}/{voice_id}  (body: {"new_name": "..."})');
}

// ---------- Azure ----------
function escape(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function azure(tekst: string, stem: string, soort: Spreeksoort): Promise<Buffer> {
  const sleutel = process.env.AZURE_SPEECH_KEY;
  const regio = process.env.AZURE_SPEECH_REGION ?? 'westeurope';
  if (!sleutel) throw new Error('AZURE_SPEECH_KEY ontbreekt (zie .env.example).');
  const binnen = `<prosody rate="${stemInfo.azure.tempo[soort]}">${escape(normaliseer(tekst))}</prosody>`;
  const taal = stem.includes('Multilingual') ? `<lang xml:lang="nl-NL">${binnen}</lang>` : binnen;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="nl-NL"><voice name="${stem}">${taal}</voice></speak>`;
  return metHerhaling(() =>
    fetch(`https://${regio}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': sleutel,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'gouden-missie',
      },
      body: ssml,
    }),
  );
}

function spreekIn(provider: Provider, tekst: string, stem: string, soort: Spreeksoort) {
  if (provider === 'google') return google(tekst, stem, soort);
  return provider === 'azure' ? azure(tekst, stem, soort) : elevenlabs(tekst, stem, soort);
}

const SLEUTELS: Record<Provider, string> = {
  google: 'GOOGLE_TTS_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY',
  azure: 'AZURE_SPEECH_KEY',
};

// ---------- Opdrachten ----------
async function maakProefstemmen() {
  mkdirSync(PROEF, { recursive: true });
  for (const p of stemInfo.proefstemmen) {
    const provider = p.provider as Provider;
    if (!process.env[SLEUTELS[provider]]) continue;
    process.stdout.write(`Proefstem ${p.naam} … `);
    try {
      writeFileSync(join(PROEF, `${provider}-${p.id}.mp3`), await spreekIn(provider, stemInfo.proefzin, p.id, 'instructie'));
      console.log('klaar');
    } catch (e) {
      console.log(`mislukt: ${(e as Error).message}`);
    }
  }
  console.log('\nLuister in de Ouderhoek → Stem. Zet de gekozen stem in content/stem.json en draai: npm run audio');
}

async function maakAlles(droog: boolean) {
  mkdirSync(TTS, { recursive: true });
  const provider = stemInfo.provider as Provider;
  const stem = stemInfo.stem;
  const taken = alleTeksten().map((t) => ({ ...t, sleutel: audioSleutel(t.tekst, t.soort, stem) }));
  const nieuw = taken.filter((t) => !existsSync(join(TTS, `${t.sleutel}.mp3`)));
  const tekens = nieuw.reduce((n, t) => n + t.tekst.length, 0);

  console.log(`Provider: ${provider}, stem: ${stem}`);
  console.log(`${taken.length} teksten, waarvan ${nieuw.length} nieuw (${tekens} tekens).`);
  if (droog) {
    nieuw.slice(0, 12).forEach((t) => console.log(`  [${t.soort}] ${t.tekst}`));
    if (nieuw.length > 12) console.log(`  … en nog ${nieuw.length - 12}`);
    return;
  }

  let klaar = 0;
  for (const t of nieuw) {
    writeFileSync(join(TTS, `${t.sleutel}.mp3`), await spreekIn(provider, t.tekst, stem, t.soort));
    klaar++;
    if (klaar % 25 === 0 || klaar === nieuw.length) console.log(`  ${klaar}/${nieuw.length}`);
  }

  const bestanden = taken.map((t) => t.sleutel).filter((k) => existsSync(join(TTS, `${k}.mp3`)));
  writeFileSync(join(MAP, 'audio-manifest.json'), JSON.stringify({ stem, bestanden }));
  console.log(`audio-manifest.json bijgewerkt (${bestanden.length} bestanden).`);
}

if (args.has('--stemmen')) await zoekNederlandseStemmen();
else if (args.has('--proef')) await maakProefstemmen();
else await maakAlles(args.has('--dry-run'));
