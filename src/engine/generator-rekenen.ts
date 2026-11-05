import pool from '../../content/verhaaltjessommen.json';
import { getal, kies, schud, standaardRnd, type Rnd } from './toeval';

/**
 * Rekenniveaus, in kleine stapjes (zodat het niet te snel moeilijk wordt):
 *  R1  plus en min tot 20, ook over het tiental
 *  R2  tot 100, makkelijk: hele tientallen (30 + 40) en een getal erbij of eraf (34 + 5)
 *  R3  tot 100 zonder overschrijding, ook met twee getallen (34 + 25)
 *  R4  over het tiental met één getal (47 + 8, 52 − 7)
 *  R5  tot 100 met overschrijding, ook met twee getallen (38 + 27)
 */
export const REKEN_NIVEAUS = ['R1', 'R2', 'R3', 'R4', 'R5'] as const;
export type RekenNiveau = (typeof REKEN_NIVEAUS)[number];

export type Sprong = { van: number; naar: number };

export type Som = {
  a: number;
  b: number;
  op: '+' | '-';
  antwoord: number;
  /** Vier keuzes (het antwoord zit erbij), al geschud. */
  keuzes: number[];
  /** Tussenstappen voor de getallenlijn-hint, bijv. 47 → 50 → 55. */
  sprongen: Sprong[];
  /** Optioneel verhaaltje rond de som. */
  verhaal?: string;
};

type SomType = (rnd: Rnd) => { a: number; b: number; op: '+' | '-' };

const plus = (a: number, b: number) => ({ a, b, op: '+' as const });
const min = (a: number, b: number) => ({ a, b, op: '-' as const });

// ---- R1: tot 20 ----
const r1PlusZonder: SomType = (r) => {
  const a = getal(1, 18, r);
  const ruimte = a < 10 ? 9 - a : 19 - a;
  return plus(a, getal(1, Math.max(1, ruimte), r));
};
const r1PlusOver: SomType = (r) => {
  const a = getal(3, 9, r);
  return plus(a, getal(11 - a, 9, r));
};
const r1MinZonder: SomType = (r) => {
  const a = getal(11, 19, r);
  return min(a, getal(1, a - 10, r));
};
const r1MinOver: SomType = (r) => {
  const a = getal(11, 18, r);
  return min(a, getal((a % 10) + 1, 9, r));
};

// ---- R3: tot 100 zonder overschrijding ----
const r3Tientallen: SomType = (r) => {
  if (r() < 0.5) {
    const a = getal(1, 8, r) * 10;
    return plus(a, getal(1, (100 - a) / 10, r) * 10);
  }
  const a = getal(2, 10, r) * 10;
  return min(a, getal(1, a / 10 - 1, r) * 10);
};
const r3PlusTEE: SomType = (r) => {
  const t = getal(1, 9, r) * 10;
  const e = getal(0, 8, r);
  return plus(t + e, getal(1, 9 - e, r));
};
const r3MinTEE: SomType = (r) => {
  const t = getal(1, 9, r) * 10;
  const e = getal(2, 9, r);
  return min(t + e, getal(1, e - 1, r));
};
const r3PlusTETE: SomType = (r) => {
  const t1 = getal(1, 7, r);
  const t2 = getal(1, 8 - t1, r);
  const e1 = getal(0, 8, r);
  const e2 = getal(1, 9 - e1, r);
  return plus(t1 * 10 + e1, t2 * 10 + e2);
};
const r3MinTETE: SomType = (r) => {
  const t1 = getal(3, 9, r);
  const t2 = getal(1, t1 - 1, r);
  const e1 = getal(2, 9, r);
  const e2 = getal(1, e1 - 1, r);
  return min(t1 * 10 + e1, t2 * 10 + e2);
};

// ---- R4: tot 100 met overschrijding ----
const r4PlusTEE: SomType = (r) => {
  const t = getal(1, 8, r) * 10;
  const e = getal(2, 9, r);
  return plus(t + e, getal(11 - e, 9, r));
};
const r4MinTEE: SomType = (r) => {
  const t = getal(2, 9, r) * 10;
  const e = getal(0, 7, r);
  return min(t + e, getal(e + 1, 9, r));
};
const r4PlusTETE: SomType = (r) => {
  const t1 = getal(1, 6, r);
  const t2 = getal(1, 8 - t1, r);
  const e1 = getal(2, 9, r);
  const e2 = getal(11 - e1, 9, r);
  return plus(t1 * 10 + e1, t2 * 10 + e2);
};
const r4MinTETE: SomType = (r) => {
  const t1 = getal(3, 9, r);
  const t2 = getal(1, t1 - 2, r);
  const e1 = getal(0, 7, r);
  const e2 = getal(e1 + 1, 9, r);
  return min(t1 * 10 + e1, t2 * 10 + e2);
};

/** Per niveau de somtypes met een gewicht (vaker = belangrijker). */
const TYPES: Record<RekenNiveau, [SomType, number][]> = {
  R1: [[r1PlusZonder, 1], [r1PlusOver, 2], [r1MinZonder, 1], [r1MinOver, 2]],
  R2: [[r3Tientallen, 1], [r3PlusTEE, 2], [r3MinTEE, 2]],
  R3: [[r3PlusTEE, 1], [r3MinTEE, 1], [r3PlusTETE, 2], [r3MinTETE, 2]],
  R4: [[r4PlusTEE, 1], [r4MinTEE, 1]],
  R5: [[r4PlusTEE, 1], [r4MinTEE, 1], [r4PlusTETE, 2], [r4MinTETE, 2]],
};

function kiesGewogen(lijst: [SomType, number][], rnd: Rnd): SomType {
  const totaal = lijst.reduce((s, [, g]) => s + g, 0);
  let x = rnd() * totaal;
  for (const [type, g] of lijst) {
    x -= g;
    if (x < 0) return type;
  }
  return lijst[lijst.length - 1][0];
}

/**
 * Tussenstappen zoals op school: eerst de tientallen, dan de eenheden,
 * en bij overschrijding eerst naar het hele tiental (47 + 8 → 50 → 55).
 */
export function maakSprongen(a: number, b: number, op: '+' | '-'): Sprong[] {
  const teken = op === '+' ? 1 : -1;
  const sprongen: Sprong[] = [];
  let nu = a;
  const tientallen = Math.floor(b / 10) * 10;
  let eenheden = b % 10;
  if (tientallen > 0) {
    sprongen.push({ van: nu, naar: nu + teken * tientallen });
    nu += teken * tientallen;
  }
  if (eenheden > 0) {
    const naarTiental = op === '+' ? (10 - (nu % 10)) % 10 : nu % 10;
    if (naarTiental > 0 && naarTiental < eenheden) {
      sprongen.push({ van: nu, naar: nu + teken * naarTiental });
      nu += teken * naarTiental;
      eenheden -= naarTiental;
    }
    sprongen.push({ van: nu, naar: nu + teken * eenheden });
  }
  return sprongen;
}

/** Foute keuzes die lijken op typische denkfouten. */
export function maakAfleiders(a: number, b: number, op: '+' | '-', antwoord: number, rnd: Rnd = standaardRnd): number[] {
  const kandidaten = new Set<number>();
  // Overschrijding vergeten: 47 + 8 = 45, 52 - 7 = 55
  if (op === '+') kandidaten.add(Math.floor(antwoord / 10) * 10 - 10 + (antwoord % 10));
  if (op === '-') kandidaten.add((Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs((a % 10) - (b % 10)));
  // Plus en min verwisseld
  kandidaten.add(op === '+' ? a - b : a + b);
  for (const d of [1, -1, 10, -10, 2, -2]) kandidaten.add(antwoord + d);

  const geldig = [...kandidaten].filter((x) => x !== antwoord && x >= 0 && x <= 100);
  const eerst = schud(geldig.slice(0, 2), rnd);
  const rest = schud(geldig.slice(2), rnd);
  const gekozen: number[] = [];
  for (const x of [...eerst, ...rest]) {
    if (gekozen.length === 3) break;
    if (!gekozen.includes(x)) gekozen.push(x);
  }
  return gekozen;
}

export const VERHALEN_PLUS = [
  (a: number, b: number) => `Mira heeft ${a} lichtstokken. Zoey geeft er ${b} bij. Hoeveel lichtstokken heeft Mira nu?`,
  (a: number, b: number) => `In de zaal zitten ${a} kinderen. Er komen nog ${b} kinderen bij. Hoeveel kinderen zitten er nu?`,
  (a: number, b: number) => `Rumi zingt ${a} liedjes. Daarna zingt ze er nog ${b}. Hoeveel liedjes zingt Rumi?`,
];
export const VERHALEN_MIN = [
  (a: number, b: number) => `Rumi heeft ${a} stickers. Ze geeft er ${b} weg. Hoeveel stickers heeft Rumi nog?`,
  (a: number, b: number) => `Er zijn ${a} demonen. Zoey zingt er ${b} weg. Hoeveel demonen zijn er nog?`,
  (a: number, b: number) => `Mira heeft ${a} ballonnen. Er knappen er ${b}. Hoeveel ballonnen heeft Mira nog?`,
];

/** Een som opbouwen uit a, op en b (keuzes en sprongen erbij). */
export function somUit(a: number, op: '+' | '-', b: number, rnd: Rnd = standaardRnd): Som {
  const antwoord = op === '+' ? a + b : a - b;
  const keuzes = schud([antwoord, ...maakAfleiders(a, b, op, antwoord, rnd)], rnd);
  return { a, b, op, antwoord, keuzes, sprongen: maakSprongen(a, b, op) };
}

/** Vaste sleutel van een som, bijv. "som.47+8" (voor de herhalingsdoosjes). */
export const somId = (s: { a: number; op: '+' | '-'; b: number }) => `som.${s.a}${s.op}${s.b}`;

/** Terug van sleutel naar som; null als de sleutel niet klopt. */
export function somUitId(id: string, rnd: Rnd = standaardRnd): Som | null {
  const m = /^som\.(\d+)([+-])(\d+)$/.exec(id);
  if (!m) return null;
  return somUit(Number(m[1]), m[2] as '+' | '-', Number(m[3]), rnd);
}

/** Bij welk niveau hoort deze som? (index in REKEN_NIVEAUS) */
export function somNiveau(a: number, op: '+' | '-', b: number): number {
  const uitkomst = op === '+' ? a + b : a - b;
  if (Math.max(a, uitkomst) <= 20) return 0;
  const over = op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
  if (!over) return b >= 10 && b % 10 !== 0 ? 2 : 1;
  return b >= 10 ? 4 : 3;
}

/** Soort som voor het overzicht in de ouderhoek, bijv. "min tot 100 met overschrijding". */
export function somSoort(a: number, op: '+' | '-', b: number): string {
  const uitkomst = op === '+' ? a + b : a - b;
  const bereik = Math.max(a, uitkomst) <= 20 ? 'tot 20' : 'tot 100';
  const over = op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
  const heleTientallen = a % 10 === 0 && b % 10 === 0;
  const soort = heleTientallen ? 'hele tientallen' : over ? 'met overschrijding' : 'zonder overschrijding';
  return `${op === '+' ? 'plus' : 'min'} ${bereik} ${soort}`;
}

export type VerhaalSom = { a: number; op: '+' | '-'; b: number; tekst: string };

/**
 * Verhaaltjessommen komen uit een vaste verzameling (content/verhaaltjessommen.json),
 * zodat ze allemaal vooraf door de stem zijn ingesproken.
 * Nieuwe maken: npm run verhaalsommen, daarna npm run audio.
 */
export function verhaalPool(niveau: RekenNiveau): VerhaalSom[] {
  return (pool as unknown as Record<RekenNiveau, VerhaalSom[]>)[niveau] ?? [];
}

/** Ruwe som (zonder verhaaltje) van een niveau; voor het maken van de verzameling. */
export function maakKaleSom(niveau: RekenNiveau, rnd: Rnd = standaardRnd) {
  return kiesGewogen(TYPES[niveau], rnd)(rnd);
}

export function maakSom(niveau: RekenNiveau, opties: { rnd?: Rnd; verhaalKans?: number } = {}): Som {
  const rnd = opties.rnd ?? standaardRnd;
  const verhalen = verhaalPool(niveau);
  if (verhalen.length && rnd() < (opties.verhaalKans ?? 0.2)) {
    const v = kies(verhalen, rnd);
    return { ...somUit(v.a, v.op, v.b, rnd), verhaal: v.tekst };
  }
  const { a, b, op } = maakKaleSom(niveau, rnd);
  return somUit(a, op, b, rnd);
}

/** Een reeks sommen zonder dubbele. */
export function maakSommen(niveau: RekenNiveau, aantal: number, opties: { rnd?: Rnd; verhaalKans?: number } = {}): Som[] {
  const sommen: Som[] = [];
  const gezien = new Set<string>();
  let pogingen = 0;
  while (sommen.length < aantal && pogingen < aantal * 50) {
    pogingen++;
    const som = maakSom(niveau, opties);
    const sleutel = `${som.a}${som.op}${som.b}`;
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    sommen.push(som);
  }
  return sommen;
}
