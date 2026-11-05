/**
 * Opgaven voor de spellen van fase 3 (PLAN.md §4).
 * Alle generators krijgen een niveau (0, 1, 2) en een aantal, en zijn met `rnd` te testen.
 */
import plaatjesData from '../../content/fase3/plaatjes.json';
import rijmData from '../../content/fase3/rijm.json';
import klankData from '../../content/fase3/klankgroepen.json';
import zinnenData from '../../content/fase3/zinnen.json';
import { getal, kies, schud, standaardRnd, type Rnd } from './toeval';

// ---------------------------------------------------------------- Woord bij plaatje
export type Plaatje = { woord: string; emoji: string };
export type PlaatjeOpgave = Plaatje & { keuzes: Plaatje[] };

export const PLAATJES: Plaatje[] = (plaatjesData.woorden as [string, string][]).map(([woord, emoji]) => ({ woord, emoji }));

/** Hoe meer twee woorden op elkaar lijken, hoe hoger (zelfde begin, zelfde lengte, gedeelde letters). */
function lijkt(a: string, b: string): number {
  let score = 0;
  if (a[0] === b[0]) score += 3;
  if (a.slice(0, 2) === b.slice(0, 2)) score += 2;
  score += Math.max(0, 2 - Math.abs(a.length - b.length));
  score += [...new Set(a)].filter((l) => b.includes(l)).length * 0.3;
  return score;
}

export function maakPlaatjes(niveau: number, aantal: number, rnd: Rnd = standaardRnd): PlaatjeOpgave[] {
  const pool = niveau === 0 ? PLAATJES.filter((p) => p.woord.length <= 4) : PLAATJES;
  return schud(pool, rnd)
    .slice(0, aantal)
    .map((doel) => {
      const anderen = PLAATJES.filter((p) => p.woord !== doel.woord);
      // Niveau 2: afleiders die op het woord lijken, zodat ze echt goed moet lezen.
      const kandidaten =
        niveau === 0 ? schud(anderen, rnd) : schud([...anderen].sort((x, y) => lijkt(doel.woord, y.woord) - lijkt(doel.woord, x.woord)).slice(0, 6), rnd);
      return { ...doel, keuzes: schud([doel, ...kandidaten.slice(0, 2)], rnd) };
    });
}

// ---------------------------------------------------------------- Rijm-rap
export type RijmOpgave = { woord: string; rijm: string; keuzes: string[] };

export function rijmSets(niveau: number): string[][] {
  return niveau === 0 ? rijmData.niveau1 : [...rijmData.niveau1, ...rijmData.niveau2, ...rijmData.niveau2];
}

export function maakRijm(niveau: number, aantal: number, rnd: Rnd = standaardRnd): RijmOpgave[] {
  const gezien = new Set<string>();
  const uit: RijmOpgave[] = [];
  for (const [woord, rijm, ...af] of schud(rijmSets(niveau), rnd)) {
    if (uit.length >= aantal) break;
    if (gezien.has(woord)) continue;
    gezien.add(woord);
    uit.push({ woord, rijm, keuzes: schud([rijm, ...af], rnd) });
  }
  return uit;
}

// ---------------------------------------------------------------- Klankgroepen-zwaard
export type ZwaardOpgave = { woord: string; delen: string[] };

export function maakZwaard(niveau: number, aantal: number, rnd: Rnd = standaardRnd): ZwaardOpgave[] {
  const lijst = niveau === 0 ? klankData.niveau1 : [...klankData.niveau1.slice(10), ...klankData.niveau2];
  return schud(lijst, rnd)
    .slice(0, aantal)
    .map((w) => ({ woord: w.replace(/\|/g, ''), delen: w.split('|') }));
}

/** Na welke letters (index) moet geknipt worden? "ra|men" → [2] */
export function knipPlekken(delen: string[]): number[] {
  const plekken: number[] = [];
  let n = 0;
  for (const d of delen.slice(0, -1)) {
    n += d.length;
    plekken.push(n);
  }
  return plekken;
}

// ---------------------------------------------------------------- Zinnen-show
export type ZinKeuze = { zin: string; plaatje: string };
export type ZinOpgave = ZinKeuze & { keuzes: ZinKeuze[] };

export const ZIN_GROEPEN: ZinKeuze[][] = (zinnenData.groepen as [string, string][][]).map((g) =>
  g.map(([zin, plaatje]) => ({ zin, plaatje })),
);

export function maakZinnen(aantal: number, rnd: Rnd = standaardRnd): ZinOpgave[] {
  return schud(ZIN_GROEPEN, rnd)
    .slice(0, aantal)
    .map((groep) => {
      const doel = kies(groep, rnd);
      return { ...doel, keuzes: schud(groep, rnd) };
    });
}

// ---------------------------------------------------------------- Getallen-spring
export type SpringOpgave = {
  soort: 'tiental' | 'getal' | 'sprong';
  /** Begin en eind van de getallenlijn, en de afstand tussen de streepjes. */
  van: number;
  tot: number;
  stap: number;
  /** Waar ze achter elkaar heen moet springen. */
  doelen: number[];
  som?: { a: number; op: '+' | '-'; b: number };
};

export function maakSpringen(niveau: number, aantal: number, rnd: Rnd = standaardRnd): SpringOpgave[] {
  const uit: SpringOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; uit.length < aantal && p < aantal * 40; p++) {
    let o: SpringOpgave;
    if (niveau === 0) {
      o = { soort: 'tiental', van: 0, tot: 100, stap: 10, doelen: [getal(1, 9, rnd) * 10] };
    } else if (niveau === 1) {
      const t = getal(1, 8, rnd) * 10;
      o = { soort: 'getal', van: t, tot: t + 10, stap: 1, doelen: [t + getal(1, 9, rnd)] };
    } else {
      const plus = rnd() < 0.6;
      const t = getal(1, 8, rnd) * 10;
      const e = getal(2, 8, rnd);
      const a = t + e;
      if (plus) {
        const b = getal(11 - e, 9, rnd);
        o = { soort: 'sprong', van: t, tot: t + 20, stap: 1, doelen: [t + 10, a + b], som: { a, op: '+', b } };
      } else {
        const b = getal(e + 1, Math.min(9, e + 8), rnd);
        o = { soort: 'sprong', van: t - 10, tot: t + 10, stap: 1, doelen: [t, a - b], som: { a, op: '-', b } };
      }
    }
    const k = JSON.stringify(o.doelen) + (o.som ? o.som.op + o.som.a : '');
    if (gezien.has(k)) continue;
    gezien.add(k);
    uit.push(o);
  }
  return uit;
}

// ---------------------------------------------------------------- Lightstick-dozen
export type DozenOpgave = { soort: 'bouw' | 'tel'; getal: number; keuzes?: number[] };

export function maakDozen(niveau: number, aantal: number, rnd: Rnd = standaardRnd): DozenOpgave[] {
  const uit: DozenOpgave[] = [];
  const gezien = new Set<number>();
  for (let p = 0; uit.length < aantal && p < aantal * 40; p++) {
    const n = niveau === 0 ? getal(11, 39, rnd) : getal(12, 98, rnd);
    if (gezien.has(n) || n % 10 === 0) continue;
    gezien.add(n);
    if (niveau < 2) {
      uit.push({ soort: 'bouw', getal: n });
    } else {
      const t = Math.floor(n / 10);
      const e = n % 10;
      // Typische fout: tientallen en eenheden omgedraaid (47 ↔ 74).
      const omgedraaid = e * 10 + t;
      const kandidaten = [omgedraaid, n + 10, n - 10, n + 1, n - 1].filter((x) => x !== n && x > 0 && x < 100);
      uit.push({ soort: 'tel', getal: n, keuzes: schud([n, ...[...new Set(kandidaten)].slice(0, 2)], rnd) });
    }
  }
  return uit;
}

// ---------------------------------------------------------------- Tafel-ritme
export type TafelOpgave = { tafel: number; reeks: number[]; antwoord: number; keuzes: number[] };

export function tafelsVoor(niveau: number): number[] {
  return niveau === 0 ? [1, 2, 10] : niveau === 1 ? [2, 5, 10] : [2, 3, 4, 5, 10];
}

export function maakTafels(niveau: number, aantal: number, rnd: Rnd = standaardRnd): TafelOpgave[] {
  const uit: TafelOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; uit.length < aantal && p < aantal * 40; p++) {
    const tafel = kies(tafelsVoor(niveau), rnd);
    const k = getal(0, 6, rnd);
    const sleutel = `${tafel}x${k}`;
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    const reeks = [k + 1, k + 2, k + 3].map((x) => x * tafel);
    const antwoord = (k + 4) * tafel;
    const kandidaten = [antwoord + tafel, antwoord - 1, antwoord + 1, antwoord + 2, antwoord - tafel - 1].filter(
      (x) => x !== antwoord && x > reeks[2] - tafel && x <= 100,
    );
    uit.push({ tafel, reeks, antwoord, keuzes: schud([antwoord, ...[...new Set(kandidaten)].slice(0, 2)], rnd) });
  }
  return uit;
}
