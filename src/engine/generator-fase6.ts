/**
 * Opgaven voor spelling en het nieuwe rekenen (groep 4):
 *  - Letter-dictee: hoor een woord, bouw het uit losse klanken (zoals bij een dictee)
 *  - Klinker-kiezer: welke klank mist er in het woord?
 *  - Verliefde harten: splitsen tot 10 en tot 20
 *  - Geld tellen: euro's en centen
 *  - Meten en wegen: zwaarder/lichter, centimeters op de liniaal, kilo's op de weegschaal
 */
import plaatjes from '../../content/fase3/plaatjes.json';
import { getal, kies, schud, standaardRnd, type Rnd } from './toeval';

const EMOJI = Object.fromEntries(plaatjes.woorden as [string, string][]) as Record<string, string>;

// ---------------------------------------------------------------- Klanken
/** Klankzuivere woorden: wat je hoort, schrijf je. Niveau 1 heeft lastigere klanken (ui, ij, ng, sch). */
export const DICTEE_WOORDEN: string[][] = [
  ['maan', 'zon', 'ster', 'wolk', 'boom', 'tent', 'vuur', 'ring', 'sok', 'jas', 'bril', 'lamp', 'bel', 'boot', 'bus', 'peer', 'vis', 'kat', 'kip', 'koe', 'vos', 'aap', 'kaas', 'melk', 'slak', 'spin', 'krab', 'boek', 'deur', 'voet', 'neus', 'klok'],
  ['bloem', 'schoen', 'fiets', 'trein', 'druif', 'kroon', 'schaap', 'slang', 'draak', 'berg', 'hart', 'taart', 'beer', 'haai', 'bij', 'muis', 'uil', 'oor', 'kikker'],
];

/** Knip een woord in klanken: "schoen" → sch-oe-n, "maan" → m-aa-n. */
export function klanken(woord: string): string[] {
  return woord.match(/sch|ch|ng|nk|aai|ooi|oei|aa|ee|oo|uu|ie|oe|eu|ui|ij|ei|ou|au|[a-z]/g) ?? [];
}

const KLINKERS = new Set(['a', 'e', 'i', 'o', 'u', 'aa', 'ee', 'oo', 'uu', 'ie', 'oe', 'eu', 'ui', 'ij', 'ei', 'ou', 'au', 'aai', 'ooi', 'oei']);
export const isKlinker = (k: string) => KLINKERS.has(k);

/** Klanken die kinderen vaak verwisselen. */
const LIJKT: Record<string, string[]> = {
  a: ['aa', 'e'], aa: ['a', 'ee'], e: ['ee', 'i', 'eu'], ee: ['e', 'aa', 'eu'], i: ['ie', 'e', 'ij'], ie: ['i', 'ij', 'ee'],
  o: ['oo', 'oe', 'u'], oo: ['o', 'oe', 'ou'], oe: ['oo', 'u', 'o'], u: ['uu', 'o', 'eu'], uu: ['u', 'ui', 'eu'], eu: ['uu', 'ee', 'ui'],
  ui: ['ou', 'uu', 'eu'], ij: ['ei', 'ie', 'i'], ei: ['ij', 'ee', 'e'], ou: ['au', 'ui', 'oe'], au: ['ou', 'aa', 'a'],
  aai: ['aa', 'ooi', 'ei'], ooi: ['oo', 'oei', 'ui'], oei: ['oe', 'ooi', 'ui'],
  b: ['d', 'p'], d: ['b', 't'], p: ['b', 't'], t: ['d', 'k'], k: ['g', 't'], g: ['ch', 'k'], ch: ['g', 'sch'], s: ['z', 'f'], z: ['s', 'v'],
  f: ['v', 's'], v: ['f', 'w'], w: ['v', 'f'], m: ['n', 'w'], n: ['m', 'ng'], ng: ['nk', 'n'], nk: ['ng', 'k'], l: ['r', 'n'], r: ['l', 'w'],
  j: ['ij', 'g'], h: ['g', 'ch'], sch: ['ch', 's'],
};

export type DicteeOpgave = { woord: string; emoji: string; klanken: string[]; extra: string[]; door: number[] };

/** Het woord in klanken plus twee lastige extra klanken die er niet in horen; alles door elkaar. */
export function maakDictee(niveau: number, aantal: number, rnd: Rnd = standaardRnd): DicteeOpgave[] {
  return schud(DICTEE_WOORDEN[Math.min(1, niveau)], rnd)
    .slice(0, aantal)
    .map((woord) => {
      const kl = klanken(woord);
      const kandidaten = schud(
        [...new Set(kl.flatMap((k) => LIJKT[k] ?? []))].filter((k) => !kl.includes(k)),
        rnd,
      );
      const extra = kandidaten.slice(0, 2);
      let door = schud(
        [...kl, ...extra].map((_, i) => i),
        rnd,
      );
      if (door.slice(0, kl.length).every((d, i) => d === i)) door = [...door].reverse();
      return { woord, emoji: EMOJI[woord] ?? '⭐', klanken: kl, extra, door };
    });
}

export type KlinkerOpgave = { woord: string; emoji: string; klanken: string[]; gat: number; keuzes: string[] };

/** Eén klinkerklank valt weg; kies uit de goede klank en twee die erop lijken. */
export function maakKlinker(niveau: number, aantal: number, rnd: Rnd = standaardRnd): KlinkerOpgave[] {
  return schud(DICTEE_WOORDEN[Math.min(1, niveau)], rnd)
    .slice(0, aantal)
    .map((woord) => {
      const kl = klanken(woord);
      const plekken = kl.map((k, i) => (isKlinker(k) ? i : -1)).filter((i) => i >= 0);
      const gat = kies(plekken, rnd);
      const goed = kl[gat];
      const fout = (LIJKT[goed] ?? ['a', 'e']).filter((k) => k !== goed).slice(0, 2);
      return { woord, emoji: EMOJI[woord] ?? '⭐', klanken: kl, gat, keuzes: schud([goed, ...fout], rnd) };
    });
}

// ---------------------------------------------------------------- Verliefde harten
export type HartOpgave = { totaal: number; deel: number; antwoord: number; keuzes: number[] };

/** Niveau 0: verliefde harten (samen 10). Niveau 1: splitsen tot 10. Niveau 2: splitsen tot 20. */
export function maakHarten(niveau: number, aantal: number, rnd: Rnd = standaardRnd): HartOpgave[] {
  const lijst: HartOpgave[] = [];
  let vorige = '';
  for (let n = 0; n < aantal; n++) {
    let totaal: number;
    let deel: number;
    do {
      totaal = niveau === 0 ? 10 : niveau === 1 ? getal(5, 10, rnd) : getal(11, 20, rnd);
      deel = niveau === 2 ? getal(Math.max(1, totaal - 10), Math.min(10, totaal - 1), rnd) : getal(1, totaal - 1, rnd);
    } while (`${totaal}-${deel}` === vorige);
    vorige = `${totaal}-${deel}`;
    const antwoord = totaal - deel;
    const keuzes = new Set([antwoord]);
    for (const k of schud([antwoord + 1, antwoord - 1, deel, antwoord + 2, antwoord - 2, totaal], rnd)) {
      if (keuzes.size >= 3) break;
      if (k >= 0 && k <= 20) keuzes.add(k);
    }
    lijst.push({ totaal, deel, antwoord, keuzes: schud([...keuzes], rnd) });
  }
  return lijst;
}

// ---------------------------------------------------------------- Geld tellen
export type Munt = { waarde: number; soort: 'munt' | 'briefje' };
export type GeldOpgave = { eenheid: 'euro' | 'cent'; geld: Munt[]; totaal: number; keuzes: number[] };

/** Niveau 0: euro's tot 10. Niveau 1: euro's tot 20 (met een briefje van 10). Niveau 2: centen tot 100. */
export function maakGeld(niveau: number, aantal: number, rnd: Rnd = standaardRnd): GeldOpgave[] {
  const soorten =
    niveau === 0 ? [1, 2, 5] : niveau === 1 ? [1, 2, 5, 10] : [5, 10, 20, 50];
  const max = niveau === 0 ? 10 : niveau === 1 ? 20 : 100;
  const lijst: GeldOpgave[] = [];
  for (let n = 0; n < aantal; n++) {
    let geld: Munt[];
    let totaal: number;
    do {
      const stuks = getal(2, niveau === 0 ? 4 : 5, rnd);
      geld = Array.from({ length: stuks }, () => {
        const w = kies(soorten, rnd);
        return { waarde: w, soort: niveau < 2 && w >= 5 ? ('briefje' as const) : ('munt' as const) };
      });
      totaal = geld.reduce((s, m) => s + m.waarde, 0);
    } while (totaal > max || totaal < 3);
    geld.sort((a, b) => b.waarde - a.waarde);
    const stap = niveau === 2 ? 5 : 1;
    const keuzes = new Set([totaal]);
    for (const k of schud([totaal + stap, totaal - stap, totaal + 2 * stap, totaal - 2 * stap, totaal + 10], rnd)) {
      if (keuzes.size >= 3) break;
      if (k > 0 && k <= max + 10) keuzes.add(k);
    }
    lijst.push({ eenheid: niveau === 2 ? 'cent' : 'euro', geld, totaal, keuzes: schud([...keuzes], rnd) });
  }
  return lijst;
}

export const geldTekst = (bedrag: number, eenheid: 'euro' | 'cent') => (eenheid === 'euro' ? `€ ${bedrag}` : `${bedrag} cent`);

// ---------------------------------------------------------------- Meten en wegen
export type Ding = { naam: string; emoji: string; gewicht: number };
export const DINGEN: Ding[] = [
  { naam: 'veer', emoji: '🪶', gewicht: 1 },
  { naam: 'aardbei', emoji: '🍓', gewicht: 2 },
  { naam: 'appel', emoji: '🍎', gewicht: 3 },
  { naam: 'boek', emoji: '📖', gewicht: 5 },
  { naam: 'kat', emoji: '🐈', gewicht: 8 },
  { naam: 'pompoen', emoji: '🎃', gewicht: 9 },
  { naam: 'hond', emoji: '🐕', gewicht: 12 },
  { naam: 'olifant', emoji: '🐘', gewicht: 40 },
];

export type MeetOpgave =
  | { soort: 'zwaarder'; links: Ding; rechts: Ding; keuzes: string[]; antwoord: string }
  | { soort: 'liniaal'; lengte: number; keuzes: number[]; antwoord: number }
  | { soort: 'kilo'; kilo: number; keuzes: number[]; antwoord: number };

/** Niveau 0: welke is zwaarder? Niveau 1: hoe lang is het potlood (cm)? Niveau 2: hoeveel kilo weegt het pakje? */
export function maakMeten(niveau: number, aantal: number, rnd: Rnd = standaardRnd): MeetOpgave[] {
  const lijst: MeetOpgave[] = [];
  for (let n = 0; n < aantal; n++) {
    // Steeds een beetje herhalen van het vorige niveau maakt het afwisselend
    const soort = niveau === 0 ? 'zwaarder' : niveau === 1 ? (n % 4 === 3 ? 'zwaarder' : 'liniaal') : n % 3 === 2 ? 'liniaal' : 'kilo';
    if (soort === 'zwaarder') {
      const [a, b] = schud(DINGEN, rnd);
      const zwaar = a.gewicht > b.gewicht ? a : b;
      lijst.push({ soort, links: a, rechts: b, keuzes: [a.naam, b.naam], antwoord: zwaar.naam });
    } else {
      const max = soort === 'liniaal' ? 12 : 6;
      const goed = getal(soort === 'liniaal' ? 3 : 1, max, rnd);
      const keuzes = new Set([goed]);
      for (const k of schud([goed + 1, goed - 1, goed + 2, goed - 2], rnd)) {
        if (keuzes.size >= 3) break;
        if (k > 0 && k <= max + 2) keuzes.add(k);
      }
      if (soort === 'liniaal') lijst.push({ soort, lengte: goed, keuzes: schud([...keuzes], rnd), antwoord: goed });
      else lijst.push({ soort, kilo: goed, keuzes: schud([...keuzes], rnd), antwoord: goed });
    }
  }
  return lijst;
}
