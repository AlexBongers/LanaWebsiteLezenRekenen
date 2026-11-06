/**
 * Zet alle bestaande opnames in public/audio op dezelfde luidheid (-16 LUFS).
 *   npm run audio:volume
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DOEL_LUFS, heeftFfmpeg, meetLuidheid, normaliseer } from './volume';

if (!heeftFfmpeg) {
  console.error('ffmpeg ontbreekt; installeer ffmpeg en probeer opnieuw.');
  process.exit(1);
}

const mappen = ['tts', 'proef'].map((m) => join(import.meta.dirname, '..', 'public', 'audio', m)).filter(existsSync);
let aangepast = 0;
let totaal = 0;
const voor: number[] = [];
const na: number[] = [];
for (const map of mappen) {
  for (const naam of readdirSync(map).filter((n) => n.endsWith('.mp3'))) {
    totaal++;
    const pad = join(map, naam);
    const r = normaliseer(readFileSync(pad));
    if (r.was !== null) voor.push(r.was);
    if (r.aangepast) {
      writeFileSync(pad, r.mp3);
      aangepast++;
      const nieuw = meetLuidheid(r.mp3);
      if (nieuw !== null) na.push(nieuw);
    } else if (r.was !== null) na.push(r.was);
    if (totaal % 100 === 0) console.log(`  ${totaal} bestanden bekeken`);
  }
}
const bereik = (l: number[]) => (l.length ? `${Math.min(...l).toFixed(1)} tot ${Math.max(...l).toFixed(1)} LUFS` : '-');
console.log(`${totaal} bestanden, ${aangepast} aangepast naar ${DOEL_LUFS} LUFS.`);
console.log(`Luidheid voor: ${bereik(voor)}`);
console.log(`Luidheid na:   ${bereik(na)}`);
