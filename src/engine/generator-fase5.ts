/**
 * Opgaven voor de vier nieuwe 3D-spellen:
 *  - Sterrenregen (Rumi): hoor een woord, tik de ster met dat woord
 *  - Ballonnen-rij (Mira): tik de getallen van klein naar groot
 *  - Klok-show (Mira): hoe laat is het? (hele en halve uren)
 *  - Blokken-bouwer (Zoey): zet de klankgroepen in de goede volgorde
 * Alle woorden en getallen zijn al ingesproken; voor de klok zijn de tijden apart ingesproken.
 */
import woorden from '../../content/lezen/woorden-flits.json';
import klankData from '../../content/fase3/klankgroepen.json';
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

// ---------------------------------------------------------------- Klok-show
export type Tijd = { uur: number; min: 0 | 30 };
export type KlokOpgave = { tijd: Tijd; keuzes: Tijd[] };

const UURWOORD = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];
const volgend = (uur: number) => (uur % 12) + 1;
const zelfde = (a: Tijd, b: Tijd) => a.uur === b.uur && a.min === b.min;

/** Zoals op school: "3 uur", "half 4". */
export function klokTekst(t: Tijd): string {
  return t.min === 0 ? `${t.uur} uur` : `half ${volgend(t.uur)}`;
}

/** Wat de stem zegt: "Drie uur." of "Half vier." */
export function klokZin(t: Tijd): string {
  const s = t.min === 0 ? `${UURWOORD[t.uur]} uur` : `half ${UURWOORD[volgend(t.uur)]}`;
  return `${s[0].toUpperCase()}${s.slice(1)}.`;
}

export const ALLE_TIJDEN: Tijd[] = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((uur) => [
  { uur, min: 0 as const },
  { uur, min: 30 as const },
]);

/** Niveau 0: hele uren. Niveau 1: ook halve uren, met de bekende vergissing (half 4 of half 3?) als foute keuze. */
export function maakKlok(niveau: number, aantal: number, rnd: Rnd = standaardRnd): KlokOpgave[] {
  const lijst: KlokOpgave[] = [];
  let vorige: Tijd | null = null;
  for (let n = 0; n < aantal; n++) {
    let tijd: Tijd;
    do {
      tijd = { uur: getal(1, 12, rnd), min: niveau >= 1 && rnd() < 0.6 ? 30 : 0 };
    } while (vorige && zelfde(tijd, vorige));
    vorige = tijd;
    const fout: Tijd[] = [];
    if (tijd.min === 30) {
      // De klassieke vergissing: het uur waar de kleine wijzer net voorbij is
      fout.push({ uur: (tijd.uur + 10) % 12 + 1, min: 30 }, { uur: tijd.uur, min: 0 });
    } else if (niveau >= 1) {
      fout.push({ uur: tijd.uur, min: 30 }, { uur: (tijd.uur + 10) % 12 + 1, min: 30 });
    } else {
      // Hele uren: de wijzers verwisseld, of een uur ernaast
      const wissel = tijd.uur === 12 ? 6 : 12;
      fout.push({ uur: wissel === tijd.uur ? 3 : wissel, min: 0 }, { uur: volgend(tijd.uur), min: 0 });
    }
    const keuzes: Tijd[] = [tijd];
    for (const f of fout) if (!keuzes.some((k) => zelfde(k, f))) keuzes.push(f);
    while (keuzes.length < 3) {
      const extra: Tijd = { uur: getal(1, 12, rnd), min: niveau >= 1 && rnd() < 0.5 ? 30 : 0 };
      if (!keuzes.some((k) => zelfde(k, extra))) keuzes.push(extra);
    }
    lijst.push({ tijd, keuzes: schud(keuzes, rnd) });
  }
  return lijst;
}

// ---------------------------------------------------------------- Blokken-bouwer
export type BouwOpgave = { woord: string; delen: string[]; door: number[] };

/** Woorden in klankgroepen; `door` is de door elkaar gehusselde volgorde van de blokjes. */
export function maakBouw(niveau: number, aantal: number, rnd: Rnd = standaardRnd): BouwOpgave[] {
  const pool = ((niveau >= 1 ? klankData.niveau2 : klankData.niveau1) as string[]).filter((w) => w.includes('|'));
  return schud(pool, rnd)
    .slice(0, aantal)
    .map((w) => {
      const delen = w.split('|');
      let door = schud(
        delen.map((_, i) => i),
        rnd,
      );
      if (door.every((d, i) => d === i)) door = [...door].reverse();
      return { woord: delen.join(''), delen, door };
    });
}
