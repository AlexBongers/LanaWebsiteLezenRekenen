/**
 * Maakt mp3-bestanden van alle teksten met de stemgenerator (Microsoft Azure AI Speech).
 *
 *   npm run audio:proef            laat zien wat er gemaakt gaat worden (kost niets)
 *   npm run audio -- --proef       maakt 4 proefstemmen in public/audio/proef/ (laat Lana kiezen!)
 *   npm run audio                  maakt alle ontbrekende bestanden + audio-manifest.json
 *
 * Zet eerst AZURE_SPEECH_KEY en AZURE_SPEECH_REGION in een .env-bestand (zie .env.example).
 * De gekozen stem en het tempo staan in content/stem.json.
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
  // geen .env; misschien staan de variabelen al in de omgeving
}

const args = new Set(process.argv.slice(2));
const droog = args.has('--dry-run');
const proef = args.has('--proef');

function escape(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ssml(tekst: string, stem: string, tempo: string) {
  const binnen = `<prosody rate="${tempo}">${escape(normaliseer(tekst))}</prosody>`;
  const taal = stem.includes('Multilingual') ? `<lang xml:lang="nl-NL">${binnen}</lang>` : binnen;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="nl-NL"><voice name="${stem}">${taal}</voice></speak>`;
}

async function spreekIn(tekst: string, stem: string, tempo: string): Promise<Buffer> {
  const sleutel = process.env.AZURE_SPEECH_KEY;
  const regio = process.env.AZURE_SPEECH_REGION ?? 'westeurope';
  if (!sleutel) throw new Error('AZURE_SPEECH_KEY ontbreekt. Zet hem in .env (zie .env.example).');
  for (let poging = 1; poging <= 5; poging++) {
    const r = await fetch(`https://${regio}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': sleutel,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'gouden-missie',
      },
      body: ssml(tekst, stem, tempo),
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 1000 * 2 ** poging));
      continue;
    }
    throw new Error(`Azure gaf fout ${r.status}: ${await r.text()}`);
  }
  throw new Error('Azure blijft "te druk" zeggen. Probeer het later nog eens.');
}

async function maakProefstemmen() {
  mkdirSync(PROEF, { recursive: true });
  for (const p of stemInfo.proefstemmen) {
    process.stdout.write(`Proefstem ${p.naam} (${p.id}) … `);
    try {
      writeFileSync(join(PROEF, `${p.id}.mp3`), await spreekIn(stemInfo.proefzin, p.id, stemInfo.tempo.instructie));
      console.log('klaar');
    } catch (e) {
      console.log(`mislukt: ${(e as Error).message}`);
    }
  }
  console.log('\nLuister in de Ouderhoek → Stem, of open de bestanden in public/audio/proef/.');
  console.log('Zet de gekozen stem daarna in content/stem.json bij "stem" en draai: npm run audio');
}

async function maakAlles() {
  mkdirSync(TTS, { recursive: true });
  const stem = stemInfo.stem;
  const teksten = alleTeksten();
  const tempo = stemInfo.tempo as Record<Spreeksoort, string>;
  const taken = teksten.map((t) => ({ ...t, sleutel: audioSleutel(t.tekst, t.soort, stem) }));
  const nieuw = taken.filter((t) => !existsSync(join(TTS, `${t.sleutel}.mp3`)));
  const tekens = nieuw.reduce((n, t) => n + t.tekst.length, 0);

  console.log(`Stem: ${stem}`);
  console.log(`${taken.length} teksten, waarvan ${nieuw.length} nieuw (${tekens} tekens).`);
  if (droog) {
    nieuw.slice(0, 15).forEach((t) => console.log(`  [${t.soort}] ${t.tekst}`));
    if (nieuw.length > 15) console.log(`  … en nog ${nieuw.length - 15}`);
    return;
  }

  let klaar = 0;
  for (const t of nieuw) {
    writeFileSync(join(TTS, `${t.sleutel}.mp3`), await spreekIn(t.tekst, stem, tempo[t.soort]));
    klaar++;
    if (klaar % 25 === 0 || klaar === nieuw.length) console.log(`  ${klaar}/${nieuw.length}`);
  }

  const bestanden = taken.map((t) => t.sleutel).filter((k) => existsSync(join(TTS, `${k}.mp3`)));
  writeFileSync(join(MAP, 'audio-manifest.json'), JSON.stringify({ stem, bestanden }, null, 0));
  console.log(`audio-manifest.json bijgewerkt (${bestanden.length} bestanden).`);
}

if (proef) await maakProefstemmen();
else await maakAlles();
