import teksten from '../../content/teksten.json';
import characters from '../../content/characters.json';
import { schud } from '../engine/toeval';

export { teksten };

/**
 * "Zakje trekken": elke zin komt pas terug als alle andere al geweest zijn,
 * en nooit twee keer dezelfde direct na elkaar.
 */
const zakjes = new Map<string, { inhoud: string[]; laatste?: string }>();

export function uitZak(naam: string, lijst: readonly string[]): string {
  let zak = zakjes.get(naam);
  if (!zak || zak.inhoud.length === 0) {
    let nieuw = schud(lijst);
    if (zak?.laatste && nieuw[0] === zak.laatste && nieuw.length > 1) nieuw = [...nieuw.slice(1), nieuw[0]];
    zak = { inhoud: nieuw, laatste: zak?.laatste };
    zakjes.set(naam, zak);
  }
  const zin = zak.inhoud.shift()!;
  zak.laatste = zin;
  return zin;
}

type Wie = keyof typeof characters;
let teller = 0;

/** Een compliment: afwisselend algemeen, met Lana's naam, of van de heldin zelf. */
export function compliment(wie?: Wie): string {
  teller++;
  const r = teller % 5;
  if (r === 1 || r === 3) return uitZak('lana', teksten.complimentenLana);
  if (r === 4 && wie) return uitZak(`heldin-${wie}`, characters[wie].complimenten);
  return uitZak('algemeen', teksten.complimenten);
}

export const bijna = () => uitZak('bijna', teksten.bijna);
export const wacht = (ms: number) => new Promise((r) => setTimeout(r, ms));
