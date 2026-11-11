/**
 * Tafel-kampioen: de uitdaging voor groep 5.
 *  - De poortsom: een moeilijke som tot 100 met overschrijding (47 + 38, 72 − 29).
 *  - De opgaven: alle tafels tot 10 door elkaar (vooral 6, 7, 8 en 9), op niveau 2 ook deelsommen.
 * Lana typt het antwoord zelf: raden kan niet.
 */
import { getal, kies, schud, standaardRnd, type Rnd } from './toeval';

export type PoortSom = { a: number; op: '+' | '-'; b: number; antwoord: number };

/** Altijd met overschrijding van het tiental: dat maakt hem echt moeilijk voor groep 4. */
export function maakPoortSom(rnd: Rnd = standaardRnd): PoortSom {
  for (;;) {
    if (rnd() < 0.5) {
      const a = getal(25, 68, rnd);
      const b = getal(13, 39, rnd);
      if (a + b <= 100 && (a % 10) + (b % 10) >= 10) return { a, op: '+', b, antwoord: a + b };
    } else {
      const a = getal(51, 95, rnd);
      const b = getal(13, 49, rnd);
      if (a - b >= 10 && a % 10 < b % 10) return { a, op: '-', b, antwoord: a - b };
    }
  }
}

export type KampioenOpgave = { a: number; op: '×' | ':'; b: number; antwoord: number };

const sleutel = (o: KampioenOpgave) => `${o.a}${o.op}${o.b}`;
export const kampioenId = (o: KampioenOpgave) => `kampioen.${sleutel(o)}`;

/** Niveau 0: keersommen (tafels 2 t/m 10, vooral de lastige). Niveau 1: ook deelsommen. */
export function maakKampioen(niveau: number, aantal: number, rnd: Rnd = standaardRnd): KampioenOpgave[] {
  const tafels = [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10];
  const gezien = new Set<string>();
  const lijst: KampioenOpgave[] = [];
  let pogingen = 0;
  while (lijst.length < aantal && pogingen++ < 500) {
    const t = kies(tafels, rnd);
    const n = getal(2, 10, rnd);
    const deel = niveau >= 1 && rnd() < 0.45;
    const o: KampioenOpgave = deel ? { a: t * n, op: ':', b: t, antwoord: n } : rnd() < 0.5 ? { a: n, op: '×', b: t, antwoord: n * t } : { a: t, op: '×', b: n, antwoord: n * t };
    if (gezien.has(sleutel(o))) continue;
    gezien.add(sleutel(o));
    lijst.push(o);
  }
  return schud(lijst, rnd);
}

/** Wat de stem zegt: ["7", "keer", "8"] of ["56", "gedeeld door", "7"], met "is" en het antwoord erbij. */
export function kampioenDelen(o: KampioenOpgave, metAntwoord = false): string[] {
  const d = [String(o.a), o.op === '×' ? 'keer' : 'gedeeld door', String(o.b)];
  if (metAntwoord) d.push('is', String(o.antwoord));
  return d;
}

/** Een hulpje bij een fout: rekenen via een tafel die je al kent. */
export function kampioenHint(o: KampioenOpgave): string {
  if (o.op === ':') return `${o.b} × ? = ${o.a}`;
  const [groot, klein] = o.a >= o.b ? [o.a, o.b] : [o.b, o.a];
  if (klein >= 6) return `${groot} × 5 = ${groot * 5}, en dan nog ${klein - 5} × ${groot} erbij`;
  return `${groot} × ${klein - 1} = ${groot * (klein - 1)}, en dan nog ${groot} erbij`;
}
