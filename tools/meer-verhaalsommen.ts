/**
 * Voegt verhaaltjessommen toe aan content/verhaaltjessommen.json zonder de bestaande te veranderen
 * (die zijn al ingesproken). Gebruikt de nieuwste sjablonen.
 *
 *   npx tsx tools/meer-verhaalsommen.ts 12     12 extra per niveau
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { maakKaleSom, REKEN_NIVEAUS, VERHALEN_MIN, VERHALEN_PLUS, type VerhaalSom } from '../src/engine/generator-rekenen';
import { zaadRnd } from '../src/engine/toeval';

const extra = Number(process.argv[2] ?? 12);
const pad = join(import.meta.dirname, '..', 'content', 'verhaaltjessommen.json');
const data = JSON.parse(readFileSync(pad, 'utf8')) as Record<string, VerhaalSom[] | string>;
const rnd = zaadRnd(Date.now() % 100000);
let nieuw = 0;
let tekens = 0;

for (const niveau of REKEN_NIVEAUS) {
  const lijst = data[niveau] as VerhaalSom[];
  const gezien = new Set(lijst.map((v) => `${v.a}${v.op}${v.b}`));
  const teksten = new Set(lijst.map((v) => v.tekst));
  const teller = { '+': 0, '-': 0 };
  let erbij = 0;
  for (let poging = 0; erbij < extra && poging < 20_000; poging++) {
    const { a, b, op } = maakKaleSom(niveau, rnd);
    if (a < 2 || b < 2 || teller[op] >= extra / 2) continue;
    const k = `${a}${op}${b}`;
    if (gezien.has(k)) continue;
    // Bij voorkeur de nieuwe sjablonen (achteraan in de lijst)
    const sjablonen = op === '+' ? VERHALEN_PLUS : VERHALEN_MIN;
    const sjabloon = sjablonen[3 + ((teller[op] + erbij) % (sjablonen.length - 3))];
    const tekst = sjabloon(a, b);
    if (teksten.has(tekst)) continue;
    gezien.add(k);
    teksten.add(tekst);
    lijst.push({ a, op, b, tekst });
    teller[op]++;
    erbij++;
    nieuw++;
    tekens += tekst.length;
  }
}
writeFileSync(pad, JSON.stringify(data, null, 2) + '\n');
console.log(`${nieuw} verhaaltjessommen erbij (${tekens} tekens).`);
