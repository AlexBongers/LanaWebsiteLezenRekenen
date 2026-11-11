import { describe, expect, it } from 'vitest';
import { ALLE_TIJDEN, klokTekst, klokZin, maakBallonnen, maakBouw, maakKlok, maakSterrenregen } from '../src/engine/generator-fase5';
import { zaadRnd } from '../src/engine/toeval';

describe('nieuwe 3D-spellen', () => {
  it('sterrenregen: het woord staat altijd tussen de keuzes', () => {
    for (const o of maakSterrenregen(1, 8, zaadRnd(3))) expect(o.keuzes).toContain(o.woord);
  });

  it('ballonnen: verschillende getallen, nooit al op volgorde, binnen het niveau', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakBallonnen(niveau, 20, zaadRnd(niveau + 1))) {
        expect(new Set(o.getallen).size).toBe(o.getallen.length);
        expect(o.getallen.every((g, i) => i === 0 || g > o.getallen[i - 1])).toBe(false);
        expect(Math.max(...o.getallen)).toBeLessThanOrEqual(niveau === 0 ? 20 : 100);
      }
    }
  });

  it('klok: schrijft en zegt de tijd zoals op school', () => {
    expect(klokTekst({ uur: 3, min: 0 })).toBe('3 uur');
    expect(klokTekst({ uur: 3, min: 30 })).toBe('half 4');
    expect(klokTekst({ uur: 12, min: 30 })).toBe('half 1');
    expect(klokZin({ uur: 3, min: 30 })).toBe('Half vier.');
    expect(ALLE_TIJDEN).toHaveLength(24);
  });

  it('klok: drie verschillende keuzes waaronder het goede antwoord; niveau 0 alleen hele uren', () => {
    for (const niveau of [0, 1]) {
      for (const o of maakKlok(niveau, 30, zaadRnd(7 + niveau))) {
        expect(o.keuzes).toHaveLength(3);
        expect(new Set(o.keuzes.map(klokTekst)).size).toBe(3);
        expect(o.keuzes.map(klokTekst)).toContain(klokTekst(o.tijd));
        if (niveau === 0) expect(o.keuzes.every((k) => k.min === 0)).toBe(true);
      }
    }
  });

  it('blokken: de blokjes liggen door elkaar en vormen samen het woord', () => {
    for (const o of maakBouw(0, 10, zaadRnd(5))) {
      expect(o.delen.join('')).toBe(o.woord);
      expect(o.door.every((d, i) => d === i)).toBe(false);
      expect([...o.door].sort()).toEqual(o.delen.map((_, i) => i));
    }
  });
});
