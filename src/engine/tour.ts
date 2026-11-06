/** Wereldtour: welke steden en baas-demonen open zijn (PLAN.md fase 4). */
import steden from '../../content/wereld/tour.json';

export type Stad = (typeof steden)[number];
export type PodiumId = 'rumi' | 'mira' | 'zoey' | 'baas';
/** Per stad per podium het aantal sterren (0 tot 3). */
export type TourStand = Record<string, Partial<Record<PodiumId, number>>>;

export const STEDEN: Stad[] = steden;
export const MEIDEN = ['rumi', 'mira', 'zoey'] as const;

export function stadIndex(id: string) {
  return STEDEN.findIndex((s) => s.id === id);
}

export function stadOpen(i: number, tour: TourStand): boolean {
  if (i <= 0) return true;
  return (tour[STEDEN[i - 1].id]?.baas ?? 0) > 0;
}

export function baasOpen(stadId: string, tour: TourStand): boolean {
  const s = tour[stadId] ?? {};
  return MEIDEN.every((m) => (s[m] ?? 0) > 0);
}

export function stadGered(stadId: string, tour: TourStand): boolean {
  return (tour[stadId]?.baas ?? 0) > 0;
}

/** De stad waar Lana nu is: de laatste open stad. */
export function huidigeStad(tour: TourStand): Stad {
  let laatste = 0;
  STEDEN.forEach((_, i) => {
    if (stadOpen(i, tour)) laatste = i;
  });
  return STEDEN[laatste];
}

export function sterrenInStad(stadId: string, tour: TourStand): number {
  const s = tour[stadId] ?? {};
  return (['rumi', 'mira', 'zoey', 'baas'] as PodiumId[]).reduce((t, p) => t + (s[p] ?? 0), 0);
}

export function totaalSterren(tour: TourStand): number {
  return STEDEN.reduce((t, s) => t + sterrenInStad(s.id, tour), 0);
}

export function tourKlaar(tour: TourStand): boolean {
  return STEDEN.every((s) => stadGered(s.id, tour));
}

/** Sterren voor een concert: 3 bij 85% meteen goed, 2 bij 60%, anders 1. */
export function sterrenVoor(goed: number, totaal: number): number {
  if (totaal === 0) return 3;
  const p = goed / totaal;
  return p >= 0.85 ? 3 : p >= 0.6 ? 2 : 1;
}

/** Nieuwe stand na een gespeeld concert (bewaart de beste score). */
export function noteerSterren(tour: TourStand, stadId: string, podium: PodiumId, sterren: number): TourStand {
  const oud = tour[stadId] ?? {};
  return { ...tour, [stadId]: { ...oud, [podium]: Math.max(oud[podium] ?? 0, sterren) } };
}
