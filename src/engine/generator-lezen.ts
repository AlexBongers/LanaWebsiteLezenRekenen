import woorden from '../../content/lezen/woorden-flits.json';
import { schud, standaardRnd, type Rnd } from './toeval';

export const LEES_NIVEAUS = ['L1', 'L2'] as const;
export type LeesNiveau = (typeof LEES_NIVEAUS)[number];

export type FlitsOpgave = {
  woord: string;
  /** Drie keuzes (het woord zit erbij), al geschud. */
  keuzes: string[];
};

export function woordGroepen(niveau: LeesNiveau): string[][] {
  return (woorden as unknown as Record<LeesNiveau, string[][]>)[niveau];
}

/** Kies `aantal` opgaven uit verschillende groepjes, zodat er geen dubbele zijn. */
export function maakFlitsOpgaven(niveau: LeesNiveau, aantal: number, rnd: Rnd = standaardRnd): FlitsOpgave[] {
  const groepen = schud(woordGroepen(niveau), rnd).slice(0, aantal);
  return groepen.map((groep) => {
    const woord = groep[Math.floor(rnd() * groep.length)];
    return { woord, keuzes: schud(groep.slice(0, 3), rnd) };
  });
}

/** Flitstijd in milliseconden: sneller bij goed, langzamer bij fout. */
export const FLITS_MIN = 350;
export const FLITS_MAX = 3000;
export const FLITS_START = 1500;

export function nieuweFlitstijd(huidig: number, goed: boolean): number {
  const nieuw = goed ? huidig * 0.9 : huidig * 1.25;
  return Math.round(Math.min(FLITS_MAX, Math.max(FLITS_MIN, nieuw)));
}
