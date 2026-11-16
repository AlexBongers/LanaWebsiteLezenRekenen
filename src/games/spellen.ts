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
  | 'zinnen'
  | 'sterren'
  | 'ballonnen'
  | 'klok'
  | 'bouwen'
  | 'dictee'
  | 'klinker'
  | 'harten'
  | 'geld'
  | 'meten'
  | 'sorteer'
  | 'rekenrek'
  | 'groepjes'
  | 'winkel'
  | 'welkesom';

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
  /** Hoort bij de Rekenschool (eigen menu op de wereldtour), niet bij het menu van de heldin. */
  school?: boolean;
};

export const SPELLEN: SpelDef[] = [
  { id: 'flits', heldin: 'rumi', naam: 'Flits-podium', uitleg: 'Welk woord flitste er?', icoon: '⚡', vaardigheid: 'flits', maxNiveau: 1, snel: true },
  { id: 'plaatje', heldin: 'rumi', naam: 'Woord bij plaatje', uitleg: 'Lees het woord, tik het plaatje', icoon: '🖼️', vaardigheid: 'plaatje', maxNiveau: 1, snel: true },
  { id: 'zwaard', heldin: 'rumi', naam: 'Klankgroepen-zwaard', uitleg: 'Hak lange woorden in stukjes', icoon: '🗡️', vaardigheid: 'zwaard', maxNiveau: 1 },
  { id: 'sterren', heldin: 'rumi', naam: 'Sterrenregen', uitleg: 'Vang de ster met het woord dat je hoort', icoon: '🌠', vaardigheid: 'sterren', maxNiveau: 1, snel: true },
  { id: 'klinker', heldin: 'rumi', naam: 'Klinker-kristallen', uitleg: 'Welke klank mist er in het woord?', icoon: '💎', vaardigheid: 'klinker', maxNiveau: 1, snel: true },
  { id: 'karaoke', heldin: 'rumi', naam: 'Karaoke-podium', uitleg: 'Lees een liedje steeds sneller', icoon: '🎤', vaardigheid: 'karaoke', maxNiveau: 0 },

  { id: 'sommen', heldin: 'mira', naam: 'Dans-sommen', uitleg: 'Tik de demon met het antwoord', icoon: '💃', vaardigheid: 'rekenen', maxNiveau: 4, rekenen: true, snel: true },
  { id: 'tafels', heldin: 'mira', naam: 'Tafel-ritme', uitleg: 'Welk getal komt op de beat?', icoon: '🥁', vaardigheid: 'tafels', maxNiveau: 2, rekenen: true, snel: true },
  { id: 'ballonnen', heldin: 'mira', naam: 'Ballonnen-rij', uitleg: 'Tik de getallen van klein naar groot', icoon: '🎈', vaardigheid: 'ballonnen', maxNiveau: 2, rekenen: true, snel: true },
  { id: 'harten', heldin: 'mira', naam: 'Verliefde harten', uitleg: 'Welk getal hoort erbij?', icoon: '💞', vaardigheid: 'harten', maxNiveau: 2, rekenen: true, snel: true },
  { id: 'springen', heldin: 'mira', naam: 'Getallen-spring', uitleg: 'Spring naar het goede getal', icoon: '🦘', vaardigheid: 'springen', maxNiveau: 2, rekenen: true },
  { id: 'klok', heldin: 'mira', naam: 'Klok-show', uitleg: 'Hoe laat is het?', icoon: '🕒', vaardigheid: 'klok', maxNiveau: 1, rekenen: true },
  { id: 'geld', heldin: 'mira', naam: 'Geld tellen', uitleg: 'Hoeveel geld is het samen?', icoon: '💶', vaardigheid: 'geld', maxNiveau: 2, rekenen: true },
  { id: 'meten', heldin: 'mira', naam: 'Meten en wegen', uitleg: 'Weegschaal en liniaal', icoon: '⚖️', vaardigheid: 'meten', maxNiveau: 2, rekenen: true },
  { id: 'dozen', heldin: 'mira', naam: 'Lightstick-dozen', uitleg: 'Maak getallen met dozen van 10', icoon: '📦', vaardigheid: 'dozen', maxNiveau: 2, rekenen: true },

  { id: 'rijm', heldin: 'zoey', naam: 'Rijm-rap', uitleg: 'Welk woord rijmt erop?', icoon: '🎧', vaardigheid: 'rijm', maxNiveau: 1, snel: true },
  { id: 'zinnen', heldin: 'zoey', naam: 'Zinnen-show', uitleg: 'Lees de zin, kies het plaatje', icoon: '🎬', vaardigheid: 'zinnen', maxNiveau: 0, snel: true },
  { id: 'sorteer', heldin: 'zoey', naam: 'Sorteer-show', uitleg: 'Lees het woord, kies de goede mand', icoon: '🧺', vaardigheid: 'sorteer', maxNiveau: 1, snel: true },
  { id: 'dictee', heldin: 'zoey', naam: 'Letter-dictee', uitleg: 'Bouw het woord met losse letters', icoon: '✍️', vaardigheid: 'dictee', maxNiveau: 1 },
  { id: 'bouwen', heldin: 'zoey', naam: 'Blokken-bouwer', uitleg: 'Bouw het woord met klankblokjes', icoon: '🧱', vaardigheid: 'bouwen', maxNiveau: 1 },
  { id: 'verhaal', heldin: 'zoey', naam: 'Songtekst-verhaal', uitleg: 'Lees een verhaal, beantwoord vragen', icoon: '📖', vaardigheid: 'verhaal', maxNiveau: 0 },

  // Rekenschool (oefenen met begrip: rekenrek, groepjes, geld, verhaaltjes)
  { id: 'rekenrek', heldin: 'mira', naam: 'Rekenrek', uitleg: 'Rekenen via de tien', icoon: '🧮', vaardigheid: 'rekenrek', maxNiveau: 3, rekenen: true, school: true },
  { id: 'groepjes', heldin: 'mira', naam: 'Tafel-groepjes', uitleg: 'Tafels snappen met groepjes', icoon: '🛍️', vaardigheid: 'groepjes', maxNiveau: 3, rekenen: true, school: true },
  { id: 'winkel', heldin: 'mira', naam: 'Geldwinkel', uitleg: 'Betalen en wisselgeld', icoon: '🏪', vaardigheid: 'winkel', maxNiveau: 3, rekenen: true, school: true },
  { id: 'welkesom', heldin: 'mira', naam: 'Welke som?', uitleg: 'Lees het verhaal, kies de som', icoon: '📝', vaardigheid: 'welkesom', maxNiveau: 2, rekenen: true, school: true },
];

export const SPEL = Object.fromEntries(SPELLEN.map((s) => [s.id, s])) as Record<SpelId, SpelDef>;

export const spellenVan = (h: HeldinId) => SPELLEN.filter((s) => s.heldin === h && !s.school);
/**
 * De Rekenschool als leerlijn, in de volgorde waarin het op school wordt opgebouwd:
 * splitsen → via de tien → veel sommen → tafels → geld → verhaaltjes.
 */
export const SCHOOL_VOLGORDE: SpelId[] = ['harten', 'rekenrek', 'sommen', 'groepjes', 'winkel', 'welkesom'];
export const schoolSpellen = () => SCHOOL_VOLGORDE.map((id) => SPEL[id]);

/** Dagdoel van de Rekenschool: zoveel rekenspellen op een dag. */
export const DAGDOEL = 3;
/** Hoeveel rekenspellen uit de Rekenschool zijn er vandaag gespeeld? */
export function schoolVandaag(sessies: { datum: string; spel?: string }[], nu = new Date()): number {
  const dag = nu.toDateString();
  return sessies.filter((s) => SCHOOL_VOLGORDE.includes(s.spel as SpelId) && new Date(s.datum).toDateString() === dag).length;
}
