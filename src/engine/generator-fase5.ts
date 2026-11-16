/**
 * Opgaven voor twee 3D-spellen:
 *  - Sterrenregen (Rumi): hoor een woord, tik de ster met dat woord
 *  - Ballonnen-rij (Mira): tik de getallen van klein naar groot
 * Alle woorden en getallen zijn al ingesproken.
 */
import woorden from '../../content/lezen/woorden-flits.json';
import { getal, schud, standaardRnd, type Rnd } from './toeval';

// ---------------------------------------------------------------- Sterrenregen
export type SterOpgave = { woord: string; keuzes: string[] };

export function maakSterrenregen(niveau: number, aantal: number, rnd: Rnd = standaardRnd): SterOpgave[] {
  const groepen = (niveau >= 1 ? woorden.L2 : woorden.L1) as string[][];
  return schud(groepen, rnd)
    .slice(0, aantal)
    .map((groep) => {
      const keuzes = schud(groep, rnd);
      return { woord: keuzes[getal(0, keuzes.length - 1, rnd)], keuzes };
    });
}

// ---------------------------------------------------------------- Ballonnen-rij
export type BallonOpgave = { getallen: number[] };

/** Niveau 0: drie getallen tot 20. Niveau 1: vier tot 50. Niveau 2: vier dicht bij elkaar tot 100. */
export function maakBallonnen(niveau: number, aantal: number, rnd: Rnd = standaardRnd): BallonOpgave[] {
  const lijst: BallonOpgave[] = [];
  for (let n = 0; n < aantal; n++) {
    const hoeveel = niveau === 0 ? 3 : 4;
    const [van, tot] = niveau === 0 ? [0, 20] : niveau === 1 ? [0, 50] : (() => {
      const begin = getal(10, 70, rnd);
      return [begin, begin + 30];
    })();
    const set = new Set<number>();
    while (set.size < hoeveel) set.add(getal(van, tot, rnd));
    let getallen = schud([...set], rnd);
    // Nooit al op volgorde
    if (getallen.every((g, i) => i === 0 || g > getallen[i - 1])) getallen = [...getallen].reverse();
    lijst.push({ getallen });
  }
  return lijst;
}

