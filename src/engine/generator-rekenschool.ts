/**
 * De Rekenschool: oefenen tot het kwartje valt, volgens de aanpak van de Nederlandse methodes in groep 4
 * (handelingsmodel: concreet → model → abstract; kort en vaak; altijd met begrip):
 *
 *  - Rekenrek: optellen en aftrekken "via de 10" (8 + 5 = 8 + 2 + 3) op een rekenrek met vijfstructuur;
 *    tot 100 met sprongen over de getallenlijn naar het hele tiental (47 + 8 = 47 + 3 + 5).
 *  - Tafel-groepjes: vermenigvuldigen als herhaald optellen (3 × 4 = 3 groepjes van 4), eerst de
 *    ankertafels 2, 5 en 10, daarna afleiden met steunsommen (6 × 7 = 5 × 7 + 7, 9 × 7 = 10 × 7 − 7).
 *  - Geldwinkel: bedragen samenstellen (betalen) en teruggeven door aan te vullen.
 *  - Welke som?: een verhaaltje lezen en de bewerking kiezen (taal + rekenen).
 *
 * Af en toe zit er een uitdaging tussen: een opgave van het volgende niveau (met een gouden ster).
 */
import verhaalPoolData from '../../content/verhaaltjessommen.json';
import { somUit, type Som } from './generator-rekenen';
import { getal, kies, schud, standaardRnd, type Rnd } from './toeval';

/** Kans op een uitdaging (opgave van het volgende niveau). */
export const UITDAGING_KANS = 0.15;

const metUitdaging = <T>(niveau: number, max: number, rnd: Rnd, maak: (n: number) => T): T & { uitdaging: boolean } => {
  const uitdaging = niveau < max && rnd() < UITDAGING_KANS;
  return { ...maak(uitdaging ? niveau + 1 : niveau), uitdaging };
};

// ---------------------------------------------------------------- Rekenrek
export type RekOpgave = Som & {
  uitdaging: boolean;
  /** Via de 10: eerst `eerst` erbij/eraf tot het tiental, dan `dan`. Null als er geen tiental gepasseerd wordt. */
  brug: { eerst: number; dan: number; tiental: number } | null;
};

/** Niveau 0: tot 10. 1: plus via de 10 (tot 20). 2: plus en min via de 10 (tot 20). 3: via het tiental tot 100. */
function kaleRek(niveau: number, rnd: Rnd): { a: number; op: '+' | '-'; b: number } {
  if (niveau <= 0) {
    if (rnd() < 0.5) {
      const a = getal(1, 8, rnd);
      return { a, op: '+', b: getal(1, 10 - a, rnd) };
    }
    const a = getal(3, 10, rnd);
    return { a, op: '-', b: getal(1, a - 1, rnd) };
  }
  if (niveau === 1 || (niveau === 2 && rnd() < 0.5)) {
    const a = getal(5, 9, rnd);
    return { a, op: '+', b: getal(11 - a, 9, rnd) };
  }
  if (niveau === 2) {
    const a = getal(11, 18, rnd);
    return { a, op: '-', b: getal(a - 9, 9, rnd) };
  }
  // Tot 100 over het tiental heen
  if (rnd() < 0.5) {
    const tien = getal(1, 8, rnd) * 10;
    const e = getal(3, 9, rnd);
    return { a: tien + e, op: '+', b: getal(11 - e, 9, rnd) };
  }
  const tien = getal(2, 9, rnd) * 10;
  const e = getal(1, 7, rnd);
  return { a: tien + e, op: '-', b: getal(e + 1, 9, rnd) };
}

export function brugVan(a: number, op: '+' | '-', b: number): RekOpgave['brug'] {
  if (op === '+') {
    const tiental = Math.ceil((a + 1) / 10) * 10;
    if (a + b <= tiental || a % 10 === 0) return null;
    return { eerst: tiental - a, dan: b - (tiental - a), tiental };
  }
  const tiental = Math.floor(a / 10) * 10;
  if (a - b >= tiental || a % 10 === 0) return null;
  return { eerst: a - tiental, dan: b - (a - tiental), tiental };
}

export function maakRekenrek(niveau: number, aantal: number, rnd: Rnd = standaardRnd): RekOpgave[] {
  const lijst: RekOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; lijst.length < aantal && p < aantal * 50; p++) {
    const o = metUitdaging(niveau, 3, rnd, (n) => kaleRek(n, rnd));
    const k = `${o.a}${o.op}${o.b}`;
    if (gezien.has(k)) continue;
    gezien.add(k);
    lijst.push({ ...somUit(o.a, o.op, o.b, rnd), uitdaging: o.uitdaging, brug: brugVan(o.a, o.op, o.b) });
  }
  return lijst;
}

// ---------------------------------------------------------------- Tafel-groepjes
export type Steun = { soort: 'anker' | 'afleiden'; tekst: string; spraak: string[] };
export type GroepjesOpgave = { groepen: number; per: number; antwoord: number; keuzes: number[]; steun: Steun; uitdaging: boolean };

const TAFELS_PER_NIVEAU = [[2, 5, 10], [3, 4], [6, 7, 8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]];

/** De steunsom bij "groepen × per": via een ankertafel (1, 2, 5 of 10 keer). */
export function steunVoor(groepen: number, per: number): Steun {
  const keer = (x: number) => `${x} × ${per}`;
  const spraak = (x: number) => [String(x), 'keer', String(per)];
  switch (groepen) {
    case 3:
      return { soort: 'afleiden', tekst: `${keer(2)} = ${2 * per}, en dan nog ${per} erbij`, spraak: [...spraak(2), 'is', String(2 * per), 'plus', String(per)] };
    case 4:
      return { soort: 'afleiden', tekst: `${keer(2)} = ${2 * per}, en dat twee keer: ${2 * per} + ${2 * per}`, spraak: [...spraak(2), 'is', String(2 * per), 'plus', String(2 * per)] };
    case 6:
      return { soort: 'afleiden', tekst: `${keer(5)} = ${5 * per}, en dan nog ${per} erbij`, spraak: [...spraak(5), 'is', String(5 * per), 'plus', String(per)] };
    case 7:
      return { soort: 'afleiden', tekst: `${keer(5)} = ${5 * per}, en dan nog ${keer(2)} = ${2 * per} erbij`, spraak: [...spraak(5), 'is', String(5 * per), 'plus', String(2 * per)] };
    case 8:
      return { soort: 'afleiden', tekst: `${keer(10)} = ${10 * per}, en dan ${keer(2)} = ${2 * per} eraf`, spraak: [...spraak(10), 'is', String(10 * per), 'min', String(2 * per)] };
    case 9:
      return { soort: 'afleiden', tekst: `${keer(10)} = ${10 * per}, en dan ${per} eraf`, spraak: [...spraak(10), 'is', String(10 * per), 'min', String(per)] };
    default:
      return { soort: 'anker', tekst: `Tel in sprongen van ${per}`, spraak: [] };
  }
}

export function maakGroepjes(niveau: number, aantal: number, rnd: Rnd = standaardRnd): GroepjesOpgave[] {
  const lijst: GroepjesOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; lijst.length < aantal && p < aantal * 50; p++) {
    const o = metUitdaging(niveau, 3, rnd, (n) => {
      const per = kies(TAFELS_PER_NIVEAU[Math.min(3, n)], rnd);
      // Op het eerste niveau weinig groepjes, zodat ze ze echt kan tellen
      const groepen = n === 0 ? getal(2, 6, rnd) : getal(2, 10, rnd);
      return { groepen, per };
    });
    const k = `${o.groepen}x${o.per}`;
    if (gezien.has(k)) continue;
    gezien.add(k);
    const antwoord = o.groepen * o.per;
    const keuzes = new Set([antwoord]);
    for (const x of schud([antwoord + o.per, antwoord - o.per, antwoord + 1, antwoord - 1, antwoord + 2], rnd)) {
      if (keuzes.size >= 4) break;
      if (x > 0 && x <= 100) keuzes.add(x);
    }
    lijst.push({ ...o, antwoord, keuzes: schud([...keuzes], rnd), steun: steunVoor(o.groepen, o.per) });
  }
  return lijst;
}

// ---------------------------------------------------------------- Geldwinkel
export type Artikel = { naam: string; emoji: string };
export const ARTIKELEN: Artikel[] = [
  { naam: 'ijsje', emoji: '🍦' }, { naam: 'lolly', emoji: '🍭' }, { naam: 'boek', emoji: '📖' }, { naam: 'bal', emoji: '⚽' },
  { naam: 'knuffel', emoji: '🧸' }, { naam: 'microfoon', emoji: '🎤' }, { naam: 'zonnebril', emoji: '🕶️' }, { naam: 'taart', emoji: '🎂' },
  { naam: 'cd', emoji: '💿' }, { naam: 'pet', emoji: '🧢' }, { naam: 'lightstick', emoji: '🪄' }, { naam: 'poster', emoji: '🖼️' },
];

export type WinkelOpgave = {
  artikel: Artikel;
  prijs: number;
  eenheid: 'euro' | 'cent';
  /** 'betalen': leg zelf het bedrag neer. 'terug': hoeveel wisselgeld krijg je? */
  soort: 'betalen' | 'terug';
  /** Munten en briefjes in de portemonnee (betalen) */
  munten: number[];
  /** Waarmee je betaalt (terug) */
  betaald: number;
  keuzes: number[];
  uitdaging: boolean;
};

/** Niveau 0: betalen tot €10. 1: betalen tot €20. 2: wisselgeld terug van €10 of €20. 3: betalen met centen tot 100 cent. */
export function maakWinkel(niveau: number, aantal: number, rnd: Rnd = standaardRnd): WinkelOpgave[] {
  const lijst: WinkelOpgave[] = [];
  let vorige = '';
  for (let p = 0; lijst.length < aantal && p < aantal * 50; p++) {
    const o = metUitdaging(niveau, 3, rnd, (n): Omit<WinkelOpgave, 'uitdaging'> => {
      const artikel = kies(ARTIKELEN, rnd);
      if (n <= 1) {
        const prijs = n === 0 ? getal(3, 10, rnd) : getal(8, 20, rnd);
        return { artikel, prijs, eenheid: 'euro', soort: 'betalen', munten: n === 0 ? [1, 2, 5] : [1, 2, 5, 10], betaald: 0, keuzes: [] };
      }
      if (n === 2) {
        const betaald = rnd() < 0.5 ? 10 : 20;
        const prijs = getal(betaald === 10 ? 3 : 11, betaald - 1, rnd);
        const terug = betaald - prijs;
        const keuzes = new Set([terug]);
        for (const x of schud([terug + 1, terug - 1, terug + 2, prijs], rnd)) {
          if (keuzes.size >= 3) break;
          if (x > 0 && x !== betaald) keuzes.add(x);
        }
        return { artikel, prijs, eenheid: 'euro', soort: 'terug', munten: [], betaald, keuzes: schud([...keuzes], rnd) };
      }
      const prijs = getal(3, 19, rnd) * 5;
      return { artikel, prijs, eenheid: 'cent', soort: 'betalen', munten: [5, 10, 20, 50], betaald: 0, keuzes: [] };
    });
    const k = `${o.soort}${o.prijs}`;
    if (k === vorige) continue;
    vorige = k;
    lijst.push(o);
  }
  return lijst;
}

// ---------------------------------------------------------------- Welke som?
export type WelkeSomOpgave = {
  tekst: string;
  som: Som;
  /** Drie sommen om uit te kiezen, als tekst ("8 + 5"). */
  keuzes: string[];
  goed: string;
  uitdaging: boolean;
};

type PoolSom = { a: number; op: '+' | '-'; b: number; tekst: string };
const POOL = verhaalPoolData as unknown as Record<string, PoolSom[]>;
const NIVEAU_POOLS = [['R1'], ['R2', 'R3'], ['R4', 'R5']];
const somTekst = (a: number, op: '+' | '-', b: number) => `${a} ${op === '+' ? '+' : '−'} ${b}`;

/** De woorden die verraden of er iets bij komt of af gaat (voor de hint). */
export const SIGNAALWOORDEN = {
  plus: ['bij', 'erbij', 'samen', 'komen', 'verdient', 'bakt'],
  min: ['weg', 'eraf', 'uit', 'knappen', 'eet', 'deelt', 'koopt'],
};

/** Niveau 0: verhaaltjes tot 20. 1: tot 100 zonder overschrijding. 2: tot 100 met overschrijding. */
export function maakWelkeSom(niveau: number, aantal: number, rnd: Rnd = standaardRnd, bruikbaar: (tekst: string) => boolean = () => true): WelkeSomOpgave[] {
  const lijst: WelkeSomOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; lijst.length < aantal && p < aantal * 50; p++) {
    const o = metUitdaging(niveau, 2, rnd, (n) => {
      const pool = NIVEAU_POOLS[Math.min(2, n)].flatMap((k) => POOL[k] ?? []).filter((v) => bruikbaar(v.tekst));
      return { v: pool.length ? kies(pool, rnd) : null };
    });
    if (!o.v || gezien.has(o.v.tekst)) continue;
    gezien.add(o.v.tekst);
    const { a, op, b, tekst } = o.v;
    const goed = somTekst(a, op, b);
    const tegen = op === '+' ? (a > b ? somTekst(a, '-', b) : somTekst(b, '-', a)) : somTekst(a, '+', b);
    const anders = somTekst(a, op, op === '+' ? b + 1 : Math.max(1, b - 1));
    lijst.push({ tekst, som: somUit(a, op, b, rnd), keuzes: schud([...new Set([goed, tegen, anders])], rnd), goed, uitdaging: o.uitdaging });
  }
  return lijst;
}
