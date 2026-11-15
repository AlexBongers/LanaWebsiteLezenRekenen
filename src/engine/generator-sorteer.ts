/**
 * Sorteer-show: lees het woord op het pakje en kies de goede mand (dieren, eten, vervoer, kleren, natuur).
 * Alleen tekst op het pakje: ze moet het woord echt lezen. Alle woorden zijn al ingesproken (plaatjes).
 */
import { kies, schud, standaardRnd, type Rnd } from './toeval';

export type Bak = { id: string; naam: string; icoon: string };

export const BAKKEN: Bak[] = [
  { id: 'dieren', naam: 'Dieren', icoon: '🐾' },
  { id: 'eten', naam: 'Eten', icoon: '🍎' },
  { id: 'vervoer', naam: 'Vervoer', icoon: '🚗' },
  { id: 'kleren', naam: 'Kleren', icoon: '👕' },
  { id: 'natuur', naam: 'Natuur', icoon: '🌳' },
];

export const SOORTEN: Record<string, string[]> = {
  dieren: ['vis', 'kat', 'hond', 'muis', 'uil', 'eend', 'kip', 'koe', 'paard', 'schaap', 'beer', 'vos', 'aap', 'bij', 'spin', 'slak', 'haai', 'krab', 'slang', 'leeuw', 'olifant', 'giraf', 'zebra', 'krokodil', 'schildpad', 'vlinder', 'kikker', 'walvis', 'varken', 'tijger', 'panda', 'koala', 'egel', 'vleermuis', 'dolfijn', 'octopus', 'haan', 'zwaan', 'papegaai', 'flamingo'],
  eten: ['peer', 'kaas', 'brood', 'taart', 'ei', 'melk', 'druif', 'appel', 'banaan', 'aardbei', 'wortel', 'pizza', 'ijsje', 'citroen', 'kers', 'meloen', 'tomaat', 'ananas', 'koekje', 'soep'],
  vervoer: ['bus', 'boot', 'trein', 'fiets', 'auto', 'raket', 'vliegtuig', 'taxi', 'tractor', 'helikopter', 'step'],
  kleren: ['hoed', 'sok', 'jas', 'schoen', 'bril', 'jurk', 'pet', 'handschoen', 'sjaal'],
  natuur: ['maan', 'zon', 'ster', 'wolk', 'boom', 'bloem', 'berg', 'vuur', 'regenboog', 'sneeuw', 'blad', 'paddenstoel'],
};

export type SorteerOpgave = { woord: string; bakken: Bak[]; goed: number };

/** Niveau 0: korte woorden (tot 5 letters). Niveau 1: alle woorden, ook lange. */
export function maakSorteer(niveau: number, aantal: number, rnd: Rnd = standaardRnd): SorteerOpgave[] {
  const lijst: SorteerOpgave[] = [];
  const gehad = new Set<string>();
  let pogingen = 0;
  while (lijst.length < aantal && pogingen++ < 300) {
    const drie = schud(BAKKEN, rnd).slice(0, 3);
    const doelBak = kies(drie, rnd);
    const woorden = SOORTEN[doelBak.id].filter((w) => (niveau >= 1 ? true : w.length <= 5) && !gehad.has(w));
    if (!woorden.length) continue;
    const woord = kies(woorden, rnd);
    gehad.add(woord);
    lijst.push({ woord, bakken: drie, goed: drie.indexOf(doelBak) });
  }
  return lijst;
}
