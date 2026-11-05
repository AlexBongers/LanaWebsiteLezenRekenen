/**
 * Niveau-aanpassing per vaardigheid (PLAN.md §3.4).
 * Na een sessie: >85% goed = stapje omhoog, <60% goed = stapje omlaag.
 */
export type Vaardigheid = {
  niveau: number;
  /** Laatste antwoorden (true = goed bij eerste poging), maximaal 20. */
  recent: boolean[];
};

export const OMHOOG = 0.85;
export const OMLAAG = 0.6;
export const MIN_OPGAVEN = 6;

export function verwerkSessie(v: Vaardigheid, resultaten: boolean[], maxNiveau: number): Vaardigheid {
  const recent = [...v.recent, ...resultaten].slice(-20);
  if (resultaten.length < MIN_OPGAVEN) return { niveau: v.niveau, recent };
  const score = resultaten.filter(Boolean).length / resultaten.length;
  let niveau = v.niveau;
  if (score > OMHOOG) niveau = Math.min(maxNiveau, niveau + 1);
  else if (score < OMLAAG) niveau = Math.max(0, niveau - 1);
  return { niveau, recent };
}

export function percentage(v: Vaardigheid): number | null {
  if (v.recent.length === 0) return null;
  return Math.round((v.recent.filter(Boolean).length / v.recent.length) * 100);
}
