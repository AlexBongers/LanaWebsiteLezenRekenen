/**
 * Stickers voor het plakboek.
 * Na elk concert krijgt Lana een stickerzakje (bij 3 sterren twee). Een baas-demon wegzingen
 * levert zijn eigen, glinsterende baas-sticker op. Ze krijgt altijd een sticker die ze nog niet heeft.
 */

export type Zeldzaam = 'gewoon' | 'glans' | 'holo';
export type Beeld =
  | { soort: 'emoji'; teken: string }
  | { soort: 'heldin'; wie: 'rumi' | 'mira' | 'zoey' }
  | { soort: 'lana' }
  | { soort: 'demon'; nr: number; kroon?: boolean };

export type Sticker = {
  id: string;
  naam: string;
  set: string;
  beeld: Beeld;
  zeldzaam: Zeldzaam;
  /** Alleen te krijgen door de baas-demon van deze stad weg te zingen. */
  baasStad?: string;
};

export type StickerSet = { id: string; naam: string; kleur: string; icoon: string };

export const STICKER_SETS: StickerSet[] = [
  { id: 'groep', naam: 'De groep', kleur: '#a855f7', icoon: '🎤' },
  { id: 'demonen', naam: 'Demonnetjes', kleur: '#3b82f6', icoon: '👾' },
  { id: 'tour', naam: 'Wereldtour', kleur: '#06b6d4', icoon: '✈️' },
  { id: 'baas', naam: 'Baas-demonen', kleur: '#f59e0b', icoon: '👑' },
  { id: 'podium', naam: 'Op het podium', kleur: '#ec4899', icoon: '🎹' },
  { id: 'glitter', naam: 'Glitter', kleur: '#d946ef', icoon: '💎' },
  { id: 'lekker', naam: 'Lekker!', kleur: '#f97316', icoon: '🍡' },
];

const e = (id: string, naam: string, set: string, teken: string, zeldzaam: Zeldzaam = 'gewoon'): Sticker => ({
  id,
  naam,
  set,
  beeld: { soort: 'emoji', teken },
  zeldzaam,
});

/** Dezelfde volgorde als de steden op de wereldtour. */
const BAZEN: [string, string][] = [
  ['seoel', 'Grompie'],
  ['tokio', 'Kriebelkop'],
  ['amsterdam', 'Slijmbal'],
  ['parijs', 'Mopperpot'],
  ['newyork', 'Lawaaimaker'],
  ['finale', 'Koning Kreun'],
];

export const STICKERS: Sticker[] = [
  // De groep
  { id: 'rumi', naam: 'Rumi', set: 'groep', beeld: { soort: 'heldin', wie: 'rumi' }, zeldzaam: 'glans' },
  { id: 'mira', naam: 'Mira', set: 'groep', beeld: { soort: 'heldin', wie: 'mira' }, zeldzaam: 'glans' },
  { id: 'zoey', naam: 'Zoey', set: 'groep', beeld: { soort: 'heldin', wie: 'zoey' }, zeldzaam: 'glans' },
  { id: 'lana', naam: 'Lana', set: 'groep', beeld: { soort: 'lana' }, zeldzaam: 'holo' },
  e('microfoon', 'Gouden microfoon', 'groep', '🎤'),
  e('paarshart', 'Paars hart', 'groep', '💜'),
  e('zwaard', 'Zwaard', 'groep', '🗡️'),
  e('maan', 'Maan', 'groep', '🌙'),
  // Demonnetjes (dezelfde als in de spellen)
  ...['Bibber', 'Giechel', 'Snurk', 'Proest', 'Wiebel', 'Knipoog', 'Hikje', 'Smikkel'].map(
    (naam, i): Sticker => ({ id: `demon${i}`, naam, set: 'demonen', beeld: { soort: 'demon', nr: i * 7 + 1 }, zeldzaam: i === 3 || i === 6 ? 'glans' : 'gewoon' }),
  ),
  // Wereldtour
  e('seoel', 'Seoel', 'tour', '🏯'),
  e('tokio', 'Tokio', 'tour', '🗼'),
  e('amsterdam', 'Amsterdam', 'tour', '🌷'),
  e('parijs', 'Parijs', 'tour', '🥐'),
  e('newyork', 'New York', 'tour', '🗽'),
  e('finale', 'De Gouden Finale', 'tour', '🏆', 'glans'),
  e('vliegtuig', 'Vliegtuig', 'tour', '✈️'),
  e('koffer', 'Koffer', 'tour', '🧳'),
  // Baas-demonen: alleen door de baas weg te zingen
  ...BAZEN.map(
    ([stad, naam], i): Sticker => ({
      id: `baas-${stad}`,
      naam,
      set: 'baas',
      beeld: { soort: 'demon', nr: i * 7 + 3, kroon: true },
      zeldzaam: 'holo',
      baasStad: stad,
    }),
  ),
  // Op het podium
  e('keyboard', 'Keyboard', 'podium', '🎹'),
  e('drum', 'Drum', 'podium', '🥁'),
  e('gitaar', 'Gitaar', 'podium', '🎸'),
  e('noten', 'Muzieknoten', 'podium', '🎶'),
  e('cd', 'Cd', 'podium', '💿'),
  e('koptelefoon', 'Koptelefoon', 'podium', '🎧'),
  e('camera', 'Camera', 'podium', '📸'),
  e('ster', 'Ster', 'podium', '🌟', 'glans'),
  // Glitter
  e('glitterhart', 'Glitterhart', 'glitter', '💖', 'glans'),
  e('regenboog', 'Regenboog', 'glitter', '🌈', 'holo'),
  e('eenhoorn', 'Eenhoorn', 'glitter', '🦄', 'holo'),
  e('diamant', 'Diamant', 'glitter', '💎', 'holo'),
  e('kroon', 'Kroon', 'glitter', '👑', 'glans'),
  e('vlinder', 'Vlinder', 'glitter', '🦋'),
  e('vallendester', 'Vallende ster', 'glitter', '🌠', 'glans'),
  e('toverbal', 'Toverbal', 'glitter', '🔮'),
  // Lekker!
  e('noedels', 'Noedels', 'lekker', '🍜'),
  e('rijstballetjes', 'Rijstballetjes', 'lekker', '🍡'),
  e('taartje', 'Taartje', 'lekker', '🍰'),
  e('bubbelthee', 'Bubbelthee', 'lekker', '🧋'),
  e('aardbei', 'Aardbei', 'lekker', '🍓'),
  e('ijsje', 'IJsje', 'lekker', '🍦'),
  e('donut', 'Donut', 'lekker', '🍩'),
  e('lolly', 'Lolly', 'lekker', '🍭', 'glans'),
];

export const STICKER = Object.fromEntries(STICKERS.map((s) => [s.id, s])) as Record<string, Sticker>;
export const stickersVan = (set: string) => STICKERS.filter((s) => s.set === set);

const GEWICHT: Record<Zeldzaam, number> = { gewoon: 70, glans: 25, holo: 8 };

/** Kies `aantal` nieuwe stickers die ze nog niet heeft (zeldzame komen minder vaak). */
export function kiesStickers(bezit: string[], aantal: number, kans: () => number = Math.random): string[] {
  const gekozen: string[] = [];
  for (let n = 0; n < aantal; n++) {
    const pot = STICKERS.filter((s) => !s.baasStad && !bezit.includes(s.id) && !gekozen.includes(s.id));
    if (pot.length === 0) break;
    const totaal = pot.reduce((t, s) => t + GEWICHT[s.zeldzaam], 0);
    let r = kans() * totaal;
    let keuze = pot[pot.length - 1];
    for (const s of pot) {
      r -= GEWICHT[s.zeldzaam];
      if (r < 0) {
        keuze = s;
        break;
      }
    }
    gekozen.push(keuze.id);
  }
  return gekozen;
}

/** De stickers voor een gewonnen concert. */
export function stickerBeloning(
  bezit: string[],
  opties: { sterren: number; baasStad?: string | null },
  kans: () => number = Math.random,
): string[] {
  const nieuw = kiesStickers(bezit, opties.sterren >= 3 ? 2 : 1, kans);
  if (opties.baasStad) {
    const b = STICKERS.find((s) => s.baasStad === opties.baasStad);
    if (b && !bezit.includes(b.id)) nieuw.unshift(b.id);
  }
  return nieuw;
}

/** Een vaste, lichte draaiing per sticker, zodat het plakboek er met de hand geplakt uitziet. */
export function draaiing(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return ((h % 13) - 6) * 1.1;
}
