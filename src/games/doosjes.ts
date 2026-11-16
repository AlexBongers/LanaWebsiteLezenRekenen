/**
 * Sommen uit de herhalingsdoosjes die nu aan de beurt zijn, voor de spellen die ze opnieuw aanbieden
 * (Rekenrek en Rekenlab). Het maakt niet uit in welk rekenspel de som eerder fout ging.
 */
import { somUitId, type Som } from '../engine/generator-rekenen';
import { aanDeBeurt } from '../engine/herhaling';
import { vg } from '../store/voortgang.svelte';

/** Hoeveel sommen uit de doosjes er hooguit in één ronde terugkomen. */
export const MAX_UIT_DOOSJES = 2;

export function sommenUitDoosjes(past: (s: Som) => boolean, max = MAX_UIT_DOOSJES): { id: string; som: Som }[] {
  const uit: { id: string; som: Som }[] = [];
  for (const { id } of aanDeBeurt(vg.herhaling, 'som.', Date.now())) {
    const som = somUitId(id);
    if (!som || !past(som)) continue;
    uit.push({ id, som });
    if (uit.length >= max) break;
  }
  return uit;
}
