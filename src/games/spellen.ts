/**
 * Alle spellen, per heldin (PLAN.md §4). De snelle spellen staan bovenaan:
 * die vindt Lana het leukst.
 */
import type { HeldinId, VaardigheidId } from '../store/voortgang.svelte';

export type SpelId =
  | 'flits'
  | 'plaatje'
  | 'zwaard'
  | 'karaoke'
  | 'sommen'
  | 'springen'
  | 'dozen'
  | 'tafels'
  | 'verhaal'
  | 'rijm'
  | 'zinnen';

export type SpelDef = {
  id: SpelId;
  heldin: HeldinId;
  naam: string;
  uitleg: string;
  icoon: string;
  vaardigheid: VaardigheidId;
  /** Hoogste niveau (0 = maar één niveau). */
  maxNiveau: number;
  /** Rekenspel: rustigere regels voor omhoog/omlaag. */
  rekenen?: boolean;
  snel?: boolean;
};

export const SPELLEN: SpelDef[] = [
  { id: 'flits', heldin: 'rumi', naam: 'Flits-podium', uitleg: 'Welk woord flitste er?', icoon: '⚡', vaardigheid: 'flits', maxNiveau: 1, snel: true },
  { id: 'plaatje', heldin: 'rumi', naam: 'Woord bij plaatje', uitleg: 'Lees het woord, tik het plaatje', icoon: '🖼️', vaardigheid: 'plaatje', maxNiveau: 1, snel: true },
  { id: 'zwaard', heldin: 'rumi', naam: 'Klankgroepen-zwaard', uitleg: 'Hak lange woorden in stukjes', icoon: '🗡️', vaardigheid: 'zwaard', maxNiveau: 1 },
  { id: 'karaoke', heldin: 'rumi', naam: 'Karaoke-podium', uitleg: 'Lees een liedje steeds sneller', icoon: '🎤', vaardigheid: 'karaoke', maxNiveau: 0 },

  { id: 'sommen', heldin: 'mira', naam: 'Dans-sommen', uitleg: 'Tik de demon met het antwoord', icoon: '💃', vaardigheid: 'rekenen', maxNiveau: 4, rekenen: true, snel: true },
  { id: 'tafels', heldin: 'mira', naam: 'Tafel-ritme', uitleg: 'Welk getal komt op de beat?', icoon: '🥁', vaardigheid: 'tafels', maxNiveau: 2, rekenen: true, snel: true },
  { id: 'springen', heldin: 'mira', naam: 'Getallen-spring', uitleg: 'Spring naar het goede getal', icoon: '🦘', vaardigheid: 'springen', maxNiveau: 2, rekenen: true },
  { id: 'dozen', heldin: 'mira', naam: 'Lightstick-dozen', uitleg: 'Maak getallen met dozen van 10', icoon: '📦', vaardigheid: 'dozen', maxNiveau: 2, rekenen: true },

  { id: 'rijm', heldin: 'zoey', naam: 'Rijm-rap', uitleg: 'Welk woord rijmt erop?', icoon: '🎧', vaardigheid: 'rijm', maxNiveau: 1, snel: true },
  { id: 'zinnen', heldin: 'zoey', naam: 'Zinnen-show', uitleg: 'Lees de zin, kies het plaatje', icoon: '🎬', vaardigheid: 'zinnen', maxNiveau: 0, snel: true },
  { id: 'verhaal', heldin: 'zoey', naam: 'Songtekst-verhaal', uitleg: 'Lees een verhaal, beantwoord vragen', icoon: '📖', vaardigheid: 'verhaal', maxNiveau: 0 },
];

export const SPEL = Object.fromEntries(SPELLEN.map((s) => [s.id, s])) as Record<SpelId, SpelDef>;

export const spellenVan = (h: HeldinId) => SPELLEN.filter((s) => s.heldin === h);
