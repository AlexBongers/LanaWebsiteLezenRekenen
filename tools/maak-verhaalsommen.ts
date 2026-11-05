/**
 * Maakt een vaste verzameling verhaaltjessommen per niveau (content/verhaaltjessommen.json).
 * Omdat de verzameling vast is, kan de stem ze allemaal vooraf inspreken (npm run audio).
 *
 *   npm run verhaalsommen            nieuwe verzameling (overschrijft het bestand)
 *   npm run verhaalsommen -- 30      30 per niveau (standaard 24)
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { maakKaleSom, REKEN_NIVEAUS, VERHALEN_MIN, VERHALEN_PLUS, type VerhaalSom } from '../src/engine/generator-rekenen';
import { zaadRnd } from '../src/engine/toeval';

const perNiveau = Number(process.argv[2] ?? 24);
const rnd = zaadRnd(2026);
const uit: Record<string, VerhaalSom[]> = {};

for (const niveau of REKEN_NIVEAUS) {
  const lijst: VerhaalSom[] = [];
  const gezien = new Set<string>();
  let teller = { '+': 0, '-': 0 };
  for (let poging = 0; lijst.length < perNiveau && poging < 10_000; poging++) {
    const { a, b, op } = maakKaleSom(niveau, rnd);
    // Om en om plus en min; geen sommen met 0 of 1 (klinkt raar in een verhaaltje).
    if (a < 2 || b < 2 || teller[op] >= perNiveau / 2) continue;
    const k = `${a}${op}${b}`;
    if (gezien.has(k)) continue;
    gezien.add(k);
    const sjablonen = op === '+' ? VERHALEN_PLUS : VERHALEN_MIN;
    lijst.push({ a, op, b, tekst: sjablonen[teller[op] % sjablonen.length](a, b) });
    teller[op]++;
  }
  uit[niveau] = lijst;
}

writeFileSync(
  join(import.meta.dirname, '..', 'content', 'verhaaltjessommen.json'),
  JSON.stringify({ _uitleg: 'Vaste verhaaltjessommen per niveau, vooraf ingesproken. Maak opnieuw met: npm run verhaalsommen (daarna npm run audio).', ...uit }, null, 2) + '\n',
);
const tekens = Object.values(uit).flat().reduce((n, v) => n + v.tekst.length, 0);
console.log(`${Object.values(uit).flat().length} verhaaltjessommen (${tekens} tekens).`);
