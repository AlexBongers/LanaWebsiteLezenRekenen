import data from '../../content/kleedkamer.json';

export type Avatar = {
  huid: number;
  ogen: string;
  haar: string;
  haarkleur: string;
  outfit: string;
  accessoire: string;
  licht: string;
};

export type CategorieId = 'haar' | 'haarkleur' | 'outfit' | 'accessoire' | 'licht';
export type Item = { id: string; naam: string; prijs: number; kleuren?: string[]; kleur?: string };
export type Categorie = { id: CategorieId; naam: string; icoon: string; items: Item[] };

export const CATEGORIEEN = data.categorieen as Categorie[];
export const HUIDTINTEN = data.huid;
export const OOGKLEUREN = data.ogen;

export const STANDAARD_AVATAR: Avatar = {
  huid: 0,
  ogen: 'bruin',
  haar: 'lang',
  haarkleur: 'bruin',
  outfit: 'paarsjasje',
  accessoire: 'geen',
  licht: 'paars',
};

export const itemSleutel = (cat: CategorieId, id: string) => `${cat}:${id}`;

export function item(cat: CategorieId, id: string): Item | undefined {
  return CATEGORIEEN.find((c) => c.id === cat)?.items.find((i) => i.id === id);
}

export function heeftItem(gekocht: string[], cat: CategorieId, id: string): boolean {
  const i = item(cat, id);
  return !!i && (i.prijs === 0 || gekocht.includes(itemSleutel(cat, id)));
}

export function haarKleuren(id: string): string[] {
  return item('haarkleur', id)?.kleuren ?? ['#a0673a', '#6b3f1d', '#3b2010'];
}

export function lichtKleur(id: string): string {
  return item('licht', id)?.kleur ?? '#8b5cf6';
}
