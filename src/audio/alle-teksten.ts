/**
 * Verzamelt alle teksten die de stem moet kunnen uitspreken.
 * tools/maak-audio.ts maakt hiervan mp3-bestanden.
 */
import teksten from '../../content/teksten.json';
import characters from '../../content/characters.json';
import woorden from '../../content/lezen/woorden-flits.json';
import verhalen from '../../content/lezen/verhalen-E4.json';
import type { Spreeksoort } from './hash';

export type TeSpreken = { tekst: string; soort: Spreeksoort };

/** Losse woorden die bij sommen horen ("47", "plus", "8", "is", "55"). */
export const SOM_WOORDEN = ['plus', 'min', 'is'];

function strings(x: unknown): string[] {
  if (typeof x === 'string') return [x];
  if (Array.isArray(x)) return x.flatMap(strings);
  if (x && typeof x === 'object') return Object.values(x).flatMap(strings);
  return [];
}

export function alleTeksten(): TeSpreken[] {
  const lijst: TeSpreken[] = [];
  const voeg = (tekst: string, soort: Spreeksoort) => lijst.push({ tekst, soort });

  strings(teksten).forEach((t) => voeg(t, 'instructie'));
  Object.values(characters).forEach((c) => voeg(c.intro, 'instructie'));

  for (const [sleutel, groepen] of Object.entries(woorden)) {
    if (sleutel.startsWith('_')) continue;
    strings(groepen).forEach((w) => voeg(w, 'woord'));
  }

  for (const v of verhalen) {
    voeg(v.titel, 'zin');
    v.zinnen.forEach((z) => voeg(z, 'zin'));
    for (const q of v.vragen) {
      voeg(q.vraag, 'zin');
      q.keuzes.forEach((k) => voeg(k, 'zin'));
    }
  }

  for (let n = 0; n <= 100; n++) voeg(String(n), 'getal');
  SOM_WOORDEN.forEach((w) => voeg(w, 'getal'));

  // Dubbele eruit
  const gezien = new Set<string>();
  return lijst.filter(({ tekst, soort }) => {
    const k = `${soort}|${tekst}`;
    if (gezien.has(k)) return false;
    gezien.add(k);
    return true;
  });
}
