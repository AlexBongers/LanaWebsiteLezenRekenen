/**
 * Afwisseling over concerten heen: elk spel onthoudt welke opgaven Lana de laatste keren zag.
 * Uit een ruime voorraad kandidaten gaan eerst de nog nooit geziene, daarna de langst geleden geziene.
 * Zo loopt ze bij opnieuw spelen niet steeds tegen dezelfde sommen en woorden aan.
 */
import { vg } from '../store/voortgang.svelte';
import { schud } from '../engine/toeval';

/** Hoeveel opgaven per spel we onthouden. */
const GEHEUGEN = 120;

export function kiesVers<T>(naam: string, kandidaten: T[], sleutel: (x: T) => string, aantal: number): T[] {
  const recent = vg.gezienRecent?.[naam] ?? [];
  const plek = new Map(recent.map((k, i) => [k, i]));
  // -1 = nog nooit gezien; anders hoe lager, hoe langer geleden
  const rang = (x: T) => plek.get(sleutel(x)) ?? -1;
  const gekozen: T[] = [];
  const gezien = new Set<string>();
  for (const x of [...kandidaten].sort((a, b) => rang(a) - rang(b))) {
    const k = sleutel(x);
    if (gezien.has(k)) continue;
    gezien.add(k);
    gekozen.push(x);
    if (gekozen.length >= aantal) break;
  }
  vg.gezienRecent = {
    ...vg.gezienRecent,
    [naam]: [...recent.filter((k) => !gezien.has(k)), ...gezien].slice(-GEHEUGEN),
  };
  return schud(gekozen);
}
