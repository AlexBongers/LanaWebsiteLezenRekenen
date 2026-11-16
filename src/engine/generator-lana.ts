/**
 * Lana's eigen spellen: drie grondige oefenspellen die op zichzelf staan.
 *
 *  - Rekenlab: de hele leerlijn optellen en aftrekken van groep 4 in zes kleine stappen, met tafelsommen erbij.
 *    Het antwoord typt ze zelf (raden kan niet). Ook "gatsommen" (8 + ? = 13): die laten zien of ze het snapt.
 *  - Eurobank: geld tellen, een bedrag maken, "heb ik genoeg?" en wisselgeld; eerst hele euro's, dan centen,
 *    dan euro's en centen samen.
 *  - Klokkentoren: analoog en digitaal; hele uren → halve uren → kwartieren → digitaal → vijf minuten.
 *
 * Af en toe zit er een uitdaging tussen: een opgave van het volgende niveau.
 */
import { somUit, type Som } from './generator-rekenen';
import { brugVan, metUitdaging, steunVoor, type RekOpgave, type Steun } from './generator-rekenschool';
import { getal, kies, schud, standaardRnd, type Rnd } from './toeval';

// ================================================================ Rekenlab
export const LAB_MAX = 5;
/** Wat er op elk niveau geoefend wordt (ook voor de ouderhoek). */
export const LAB_NIVEAUS = [
  'plus en min tot 10',
  'tot 20 zonder over de 10 te gaan, en dubbelen',
  'plus over de 10 (8 + 5)',
  'min over de 10 (13 − 5)',
  'tot 100 zonder over het tiental te gaan',
  'tot 100 over het tiental (47 + 8, 52 − 7)',
];

export type LabOpgave =
  | { soort: 'som'; som: Som; brug: RekOpgave['brug']; uitdaging: boolean }
  /** Gatsom: a + ? = c of a − ? = c. Het antwoord is het ontbrekende getal. */
  | { soort: 'gat'; a: number; op: '+' | '-'; c: number; antwoord: number; uitdaging: boolean }
  | { soort: 'keer'; groepen: number; per: number; antwoord: number; steun: Steun; uitdaging: boolean };

type Kaal = { a: number; op: '+' | '-'; b: number };

function kaleLab(niveau: number, rnd: Rnd): Kaal {
  switch (Math.max(0, Math.min(LAB_MAX, niveau))) {
    case 0: {
      if (rnd() < 0.5) {
        const a = getal(1, 8, rnd);
        return { a, op: '+', b: getal(1, 10 - a, rnd) };
      }
      const a = getal(3, 10, rnd);
      return { a, op: '-', b: getal(1, a - 1, rnd) };
    }
    case 1: {
      const r = rnd();
      // Dubbelen (6 + 6) zijn een anker voor later (6 + 7 = 6 + 6 + 1)
      if (r < 0.25) {
        const a = getal(3, 10, rnd);
        return { a, op: '+', b: a };
      }
      if (r < 0.6) {
        const e = getal(1, 7, rnd);
        return { a: 10 + e, op: '+', b: getal(1, 9 - e, rnd) };
      }
      const e = getal(2, 9, rnd);
      return { a: 10 + e, op: '-', b: getal(1, e, rnd) };
    }
    case 2: {
      const a = getal(5, 9, rnd);
      return { a, op: '+', b: getal(11 - a, 9, rnd) };
    }
    case 3: {
      // Vooral min over de 10; plus blijft terugkomen
      if (rnd() < 0.3) {
        const a = getal(5, 9, rnd);
        return { a, op: '+', b: getal(11 - a, 9, rnd) };
      }
      const a = getal(11, 18, rnd);
      return { a, op: '-', b: getal(a - 9, 9, rnd) };
    }
    case 4: {
      const r = rnd();
      if (r < 0.25) {
        const a = getal(1, 8, rnd) * 10;
        return rnd() < 0.5 ? { a, op: '+', b: getal(1, 9 - a / 10, rnd) * 10 } : { a: a + 10, op: '-', b: getal(1, a / 10, rnd) * 10 };
      }
      const t = getal(2, 9, rnd) * 10;
      if (r < 0.65) {
        const e = getal(1, 7, rnd);
        return { a: t + e, op: '+', b: getal(1, 9 - e, rnd) };
      }
      const e = getal(2, 9, rnd);
      return { a: t + e, op: '-', b: getal(1, e, rnd) };
    }
    default: {
      if (rnd() < 0.5) {
        const t = getal(1, 8, rnd) * 10;
        const e = getal(3, 9, rnd);
        return { a: t + e, op: '+', b: getal(11 - e, 9, rnd) };
      }
      const t = getal(2, 9, rnd) * 10;
      const e = getal(1, 7, rnd);
      return { a: t + e, op: '-', b: getal(e + 1, 9, rnd) };
    }
  }
}

/** Kans op een gatsom (vanaf niveau 1; op niveau 0 al een paar als splitsoefening). */
export const GAT_KANS = 0.25;
/** Welke tafels er bij welk niveau van het lab horen (leeg = nog geen tafelsommen). */
const LAB_TAFELS: number[][] = [[], [], [2, 5, 10], [2, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 10]];

export function labTafel(niveau: number, rnd: Rnd = standaardRnd): LabOpgave | null {
  const tafels = LAB_TAFELS[Math.max(0, Math.min(LAB_MAX, niveau))];
  if (!tafels.length) return null;
  const per = kies(tafels, rnd);
  const groepen = getal(2, niveau >= 4 ? 10 : 6, rnd);
  return { soort: 'keer', groepen, per, antwoord: groepen * per, steun: steunVoor(groepen, per), uitdaging: false };
}

export function labId(o: LabOpgave): string {
  if (o.soort === 'som') return `som.${o.som.a}${o.som.op}${o.som.b}`;
  if (o.soort === 'gat') return `gat.${o.a}${o.op}?=${o.c}`;
  return `keer.${o.groepen}x${o.per}`;
}

/** Plus- en minsommen (en gatsommen) voor het lab; de tafelsommen komen er in het spel bij. */
export function maakLab(niveau: number, aantal: number, rnd: Rnd = standaardRnd): LabOpgave[] {
  const lijst: LabOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; lijst.length < aantal && p < aantal * 60; p++) {
    const o = metUitdaging(niveau, LAB_MAX, rnd, (n) => kaleLab(n, rnd));
    const { a, op, b } = o;
    const gat = !o.uitdaging && rnd() < (niveau === 0 ? 0.2 : GAT_KANS);
    const opgave: LabOpgave = gat
      ? { soort: 'gat', a, op, c: op === '+' ? a + b : a - b, antwoord: b, uitdaging: false }
      : { soort: 'som', som: somUit(a, op, b, rnd), brug: brugVan(a, op, b), uitdaging: o.uitdaging };
    const k = labId(opgave);
    if (gezien.has(k)) continue;
    gezien.add(k);
    lijst.push(opgave);
  }
  return lijst;
}

// ================================================================ Eurobank
/** Alles in centen. */
export const MUNTEN = [5, 10, 20, 50, 100, 200];
export const BRIEFJES = [500, 1000, 2000, 5000];
export const isBriefje = (cent: number) => cent >= 500;

/** "€ 3", "€ 2,50" of "45 cent" */
export function geldTekst(cent: number): string {
  if (cent < 100) return `${cent} cent`;
  const e = Math.floor(cent / 100);
  const c = cent % 100;
  return c === 0 ? `€ ${e}` : `€ ${e},${String(c).padStart(2, '0')}`;
}
/** Kort opschrift op een munt of briefje: "€2", "50c". */
export const stukTekst = (cent: number) => (cent >= 100 ? `€${cent / 100}` : `${cent}c`);

/** Wat de stem zegt, in losse stukjes die al ingesproken zijn: ["2","euro","50"]. */
export function geldSpraak(cent: number): string[] {
  const e = Math.floor(cent / 100);
  const c = cent % 100;
  if (e === 0) return [String(c), 'cent'];
  return c === 0 ? [String(e), 'euro'] : [String(e), 'euro', String(c)];
}

/** Zo betaal je met zo weinig mogelijk geld: steeds het grootste stuk dat nog past. */
export function minsteStukken(bedrag: number, stukken: number[]): number[] {
  const uit: number[] = [];
  let rest = bedrag;
  for (const m of [...stukken].sort((x, y) => y - x)) {
    while (rest >= m) {
      uit.push(m);
      rest -= m;
    }
  }
  return rest === 0 ? uit : [];
}

export const BANK_MAX = 4;
export const BANK_NIVEAUS = [
  'hele euro\'s tot € 10 tellen en maken',
  'briefjes erbij: tot € 50',
  'centen tot 100 cent (1 euro)',
  'heb ik genoeg? en wisselgeld',
  'euro\'s en centen samen (€ 2,50)',
];

export type Ding = { naam: string; emoji: string };
export const DINGEN: Ding[] = [
  { naam: 'ijsje', emoji: '🍦' }, { naam: 'boek', emoji: '📖' }, { naam: 'bal', emoji: '⚽' }, { naam: 'knuffel', emoji: '🧸' },
  { naam: 'microfoon', emoji: '🎤' }, { naam: 'zonnebril', emoji: '🕶️' }, { naam: 'taart', emoji: '🎂' }, { naam: 'pet', emoji: '🧢' },
  { naam: 'poster', emoji: '🖼️' }, { naam: 'lolly', emoji: '🍭' }, { naam: 'appel', emoji: '🍎' }, { naam: 'koekje', emoji: '🍪' },
];

type BankKern =

  /** Hoeveel is dit samen? */
  | { soort: 'tel'; geld: number[]; antwoord: number; keuzes: number[] }
  /** Maak dit bedrag met het geld uit je portemonnee. */
  | { soort: 'maak'; bedrag: number; stukken: number[] }
  /** Je hebt `geld`; het ding kost `prijs`. Genoeg? En hoeveel over of te kort? */
  | { soort: 'genoeg'; ding: Ding; geld: number[]; heeft: number; prijs: number; genoeg: boolean; verschil: number; keuzes: number[] }
  /** Je betaalt met een briefje; hoeveel krijg je terug? */
  | { soort: 'terug'; ding: Ding; prijs: number; betaald: number; antwoord: number; keuzes: number[] };
export type BankOpgave = BankKern & { uitdaging: boolean };

export function bankId(o: BankOpgave): string {
  if (o.soort === 'tel') return `bank.tel.${[...o.geld].sort((a, b) => a - b).join('+')}`;
  if (o.soort === 'maak') return `bank.maak.${o.bedrag}`;
  if (o.soort === 'genoeg') return `bank.genoeg.${o.heeft}.${o.prijs}`;
  return `bank.terug.${o.betaald}.${o.prijs}`;
}

/** Een willekeurig stapeltje geld dat samen `doel` is (niet altijd het netste). */
function stapel(doel: number, stukken: number[], rnd: Rnd): number[] {
  const uit: number[] = [];
  let rest = doel;
  const oplopend = [...stukken].sort((a, b) => a - b);
  for (let p = 0; rest > 0 && p < 40; p++) {
    const past = oplopend.filter((m) => m <= rest);
    if (!past.length) return minsteStukken(doel, stukken);
    // Meestal een groot stuk, soms een kleiner: zo ontstaan er verschillende stapeltjes
    const m = rnd() < 0.6 ? past[past.length - 1] : kies(past, rnd);
    uit.push(m);
    rest -= m;
  }
  return uit.length <= 8 && rest === 0 ? uit : minsteStukken(doel, stukken);
}

function keuzesRond(goed: number, stap: number, rnd: Rnd, extra: number[] = []): number[] {
  const set = new Set([goed]);
  for (const x of schud([...extra, goed + stap, goed - stap, goed + 2 * stap, goed - 2 * stap, goed + 10 * stap], rnd)) {
    if (set.size >= 4) break;
    if (x > 0) set.add(x);
  }
  return schud([...set], rnd);
}

function kaleBank(niveau: number, rnd: Rnd): BankKern {
  const n = Math.max(0, Math.min(BANK_MAX, niveau));
  const ding = kies(DINGEN, rnd);
  if (n === 0 || n === 1) {
    const stukken = n === 0 ? [100, 200, 500] : [100, 200, 500, 1000, 2000];
    const bedrag = (n === 0 ? getal(3, 10, rnd) : getal(11, 50, rnd)) * 100;
    if (rnd() < 0.5) {
      const geld = stapel(bedrag, stukken, rnd);
      return { soort: 'tel', geld, antwoord: bedrag, keuzes: keuzesRond(bedrag, 100, rnd) };
    }
    return { soort: 'maak', bedrag, stukken };
  }
  if (n === 2) {
    const stukken = [5, 10, 20, 50];
    const bedrag = getal(3, 20, rnd) * 5;
    if (rnd() < 0.5) {
      const geld = stapel(bedrag, stukken, rnd);
      return { soort: 'tel', geld, antwoord: bedrag, keuzes: keuzesRond(bedrag, 5, rnd) };
    }
    return { soort: 'maak', bedrag, stukken };
  }
  if (n === 3) {
    if (rnd() < 0.5) {
      const betaald = kies([1000, 2000, 5000], rnd);
      const prijs = getal(betaald === 1000 ? 3 : betaald === 2000 ? 11 : 30, betaald / 100 - 1, rnd) * 100;
      const antwoord = betaald - prijs;
      return { soort: 'terug', ding, prijs, betaald, antwoord, keuzes: keuzesRond(antwoord, 100, rnd, [prijs]) };
    }
    const heeft = getal(5, 20, rnd) * 100;
    const genoeg = rnd() < 0.5;
    const verschil = getal(1, Math.min(6, heeft / 100 - 1), rnd) * 100;
    const prijs = genoeg ? heeft - verschil : heeft + verschil;
    return {
      soort: 'genoeg', ding, geld: stapel(heeft, [100, 200, 500, 1000], rnd), heeft, prijs, genoeg, verschil,
      keuzes: keuzesRond(verschil, 100, rnd),
    };
  }
  // Euro's en centen samen, in stappen van 10 cent
  const stukken = [10, 20, 50, 100, 200];
  const bedrag = getal(1, 5, rnd) * 100 + kies([10, 20, 30, 40, 50, 60, 70, 80, 90], rnd);
  if (rnd() < 0.5) {
    const geld = stapel(bedrag, stukken, rnd);
    // Bekende vergissing: 2 euro en 50 cent is niet 52 cent of € 7
    return { soort: 'tel', geld, antwoord: bedrag, keuzes: keuzesRond(bedrag, 10, rnd, [bedrag + 100, bedrag - 100]) };
  }
  return { soort: 'maak', bedrag, stukken };
}

export function maakBank(niveau: number, aantal: number, rnd: Rnd = standaardRnd): BankOpgave[] {
  const lijst: BankOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; lijst.length < aantal && p < aantal * 60; p++) {
    const o = metUitdaging(niveau, BANK_MAX, rnd, (n) => kaleBank(n, rnd));
    const k = bankId(o);
    if (gezien.has(k)) continue;
    gezien.add(k);
    lijst.push(o);
  }
  return lijst;
}

// ================================================================ Klokkentoren
/** uur 1 t/m 12, min in stappen van 5. */
export type KlokTijd = { uur: number; min: number };
const UURWOORD = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];
const volgend = (uur: number) => (uur % 12) + 1;

function delen(t: KlokTijd, uur: (u: number) => string, vijf: string, tien: string): string {
  const nu = uur(t.uur);
  const straks = uur(volgend(t.uur));
  switch (t.min) {
    case 0: return `${nu} uur`;
    case 5: return `${vijf} over ${nu}`;
    case 10: return `${tien} over ${nu}`;
    case 15: return `kwart over ${nu}`;
    case 20: return `${tien} voor half ${straks}`;
    case 25: return `${vijf} voor half ${straks}`;
    case 30: return `half ${straks}`;
    case 35: return `${vijf} over half ${straks}`;
    case 40: return `${tien} over half ${straks}`;
    case 45: return `kwart voor ${straks}`;
    case 50: return `${tien} voor ${straks}`;
    default: return `${vijf} voor ${straks}`;
  }
}

/** Zoals op school geschreven: "half 4", "kwart over 3", "10 voor half 4". */
export const tijdTekst = (t: KlokTijd) => delen(t, String, '5', '10');
/** Wat de stem zegt: "Kwart over drie." */
export function tijdZin(t: KlokTijd): string {
  const s = delen(t, (u) => UURWOORD[u], 'vijf', 'tien');
  return `${s[0].toUpperCase()}${s.slice(1)}.`;
}
/** Digitaal: "3:30" */
export const digitaal = (t: KlokTijd) => `${t.uur}:${String(t.min).padStart(2, '0')}`;
export const tijdId = (t: KlokTijd) => `${t.uur}.${t.min}`;

/** Alle tijden die de stem moet kunnen zeggen. */
export const ALLE_KLOKTIJDEN: KlokTijd[] = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((uur) =>
  Array.from({ length: 12 }, (_, j) => ({ uur, min: j * 5 })),
);

export const TOREN_MAX = 4;
export const TOREN_NIVEAUS = ['hele uren', 'halve uren', 'kwart over en kwart voor', 'digitaal (3:30 = half 4)', 'op vijf minuten, analoog en digitaal'];
const MINUTEN_PER_NIVEAU: number[][] = [[0], [30, 30, 0], [15, 45, 15, 45, 30, 0], [0, 30, 15, 45], [5, 10, 20, 25, 35, 40, 50, 55, 15, 45]];

/**
 * Wat ze ziet → wat ze kiest:
 *  - lees:  analoge klok → de tijd in woorden
 *  - kies:  de tijd in woorden → de goede analoge klok
 *  - naarDigitaal: analoge klok → digitale tijd
 *  - vanDigitaal:  digitale tijd → de tijd in woorden
 *  - koppel: digitale tijd → de goede analoge klok
 */
export type TorenSoort = 'lees' | 'kies' | 'naarDigitaal' | 'vanDigitaal' | 'koppel';
export type TorenOpgave = { soort: TorenSoort; tijd: KlokTijd; keuzes: KlokTijd[]; uitdaging: boolean };

const SOORTEN_PER_NIVEAU: TorenSoort[][] = [
  ['lees', 'lees', 'kies'],
  ['lees', 'lees', 'kies'],
  ['lees', 'lees', 'kies'],
  ['naarDigitaal', 'vanDigitaal', 'koppel'],
  ['lees', 'kies', 'naarDigitaal', 'vanDigitaal', 'koppel'],
];

/** Foute keuzes die lijken op de vergissingen die kinderen echt maken. */
export function klokAfleiders(t: KlokTijd, rnd: Rnd = standaardRnd, toegestaan?: number[]): KlokTijd[] {
  const ander = (u: number, d: number) => ((u - 1 + d + 12) % 12) + 1;
  const kandidaten: KlokTijd[] = [
    // half 4 gelezen als half 3 (of andersom): het uur ernaast
    { uur: ander(t.uur, 1), min: t.min },
    { uur: ander(t.uur, -1), min: t.min },
    // over en voor verwisseld (kwart over ↔ kwart voor, 10 over ↔ 10 voor)
    { uur: t.uur, min: (60 - t.min) % 60 },
    // heel en half verwisseld
    { uur: t.uur, min: (t.min + 30) % 60 },
    // wijzers verwisseld: de lange wijzer voor het uur aangezien
    { uur: t.min === 0 ? 12 : t.min / 5, min: (t.uur % 12) * 5 },
  ];
  // Aanvullen met andere uren, voor als er te weinig overblijven
  const reserve: KlokTijd[] = schud([2, 3, 4, 5, 6], rnd).map((d) => ({ uur: ander(t.uur, d), min: t.min }));
  const uit: KlokTijd[] = [];
  const gezien = new Set([tijdId(t)]);
  for (const k of [...schud(kandidaten, rnd), ...reserve]) {
    // Alleen tijden die ze op dit niveau al kent (geen "kwart over" bij de hele uren)
    if (toegestaan && !toegestaan.includes(k.min)) continue;
    if (gezien.has(tijdId(k))) continue;
    gezien.add(tijdId(k));
    uit.push(k);
    if (uit.length >= 3) break;
  }
  return uit;
}

export function maakToren(niveau: number, aantal: number, rnd: Rnd = standaardRnd): TorenOpgave[] {
  const lijst: TorenOpgave[] = [];
  const gezien = new Set<string>();
  for (let p = 0; lijst.length < aantal && p < aantal * 60; p++) {
    const o = metUitdaging(niveau, TOREN_MAX, rnd, (n) => {
      const i = Math.max(0, Math.min(TOREN_MAX, n));
      const tijd: KlokTijd = { uur: getal(1, 12, rnd), min: kies(MINUTEN_PER_NIVEAU[i], rnd) };
      const soort = kies(SOORTEN_PER_NIVEAU[i], rnd);
      // Klokken kiezen: drie klokken naast elkaar; woorden of digitaal: vier keuzes
      const n3 = soort === 'kies' || soort === 'koppel' ? 2 : 3;
      return { soort, tijd, keuzes: schud([tijd, ...klokAfleiders(tijd, rnd, i < TOREN_MAX ? [...new Set(MINUTEN_PER_NIVEAU[i])] : undefined).slice(0, n3)], rnd) };
    });
    const k = `${o.soort}.${tijdId(o.tijd)}`;
    if (gezien.has(k)) continue;
    gezien.add(k);
    lijst.push(o);
  }
  return lijst;
}

/** Welke uitleg hoort bij deze tijd? (sleutel in teksten.toren.hint) */
export function klokHint(t: KlokTijd): 'heel' | 'half' | 'kwartOver' | 'kwartVoor' | 'over' | 'voor' | 'voorHalf' | 'overHalf' {
  if (t.min === 0) return 'heel';
  if (t.min === 30) return 'half';
  if (t.min === 15) return 'kwartOver';
  if (t.min === 45) return 'kwartVoor';
  if (t.min < 15) return 'over';
  if (t.min < 30) return 'voorHalf';
  if (t.min < 45) return 'overHalf';
  return 'voor';
}
