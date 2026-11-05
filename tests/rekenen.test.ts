import { describe, expect, it } from 'vitest';
import { maakAfleiders, maakSom, maakSommen, maakSprongen, REKEN_NIVEAUS } from '../src/engine/generator-rekenen';
import { zaadRnd } from '../src/engine/toeval';

const overschrijdt = (a: number, b: number, op: '+' | '-') =>
  op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;

describe('somgenerator', () => {
  it('R1 blijft tot en met 20', () => {
    const rnd = zaadRnd(1);
    for (let i = 0; i < 2000; i++) {
      const s = maakSom('R1', { rnd });
      expect(s.a).toBeLessThanOrEqual(20);
      expect(s.antwoord).toBeGreaterThanOrEqual(0);
      expect(s.antwoord).toBeLessThanOrEqual(20);
    }
  });

  it('R3 gaat tot 100 en nooit over het tiental', () => {
    const rnd = zaadRnd(2);
    for (let i = 0; i < 2000; i++) {
      const s = maakSom('R3', { rnd });
      expect(s.antwoord).toBeGreaterThanOrEqual(0);
      expect(s.antwoord).toBeLessThanOrEqual(100);
      expect(overschrijdt(s.a, s.b, s.op)).toBe(false);
    }
  });

  it('R4 gaat altijd over het tiental en blijft tot 100', () => {
    const rnd = zaadRnd(3);
    for (let i = 0; i < 2000; i++) {
      const s = maakSom('R4', { rnd });
      expect(s.antwoord).toBeGreaterThan(0);
      expect(s.antwoord).toBeLessThanOrEqual(100);
      expect(overschrijdt(s.a, s.b, s.op)).toBe(true);
    }
  });

  it('heeft altijd 4 verschillende keuzes met het goede antwoord erbij', () => {
    const rnd = zaadRnd(4);
    for (const niveau of REKEN_NIVEAUS) {
      for (let i = 0; i < 1000; i++) {
        const s = maakSom(niveau, { rnd });
        expect(s.keuzes).toHaveLength(4);
        expect(new Set(s.keuzes).size).toBe(4);
        expect(s.keuzes).toContain(s.antwoord);
        s.keuzes.forEach((k) => expect(k).toBeGreaterThanOrEqual(0));
      }
    }
  });

  it('maakt een reeks zonder dubbele sommen', () => {
    const reeks = maakSommen('R4', 12, { rnd: zaadRnd(5) });
    expect(reeks).toHaveLength(12);
    expect(new Set(reeks.map((s) => `${s.a}${s.op}${s.b}`)).size).toBe(12);
  });
});

describe('sprongen op de getallenlijn', () => {
  it('47 + 8 gaat via 50', () => {
    expect(maakSprongen(47, 8, '+')).toEqual([
      { van: 47, naar: 50 },
      { van: 50, naar: 55 },
    ]);
  });
  it('52 − 7 gaat via 50', () => {
    expect(maakSprongen(52, 7, '-')).toEqual([
      { van: 52, naar: 50 },
      { van: 50, naar: 45 },
    ]);
  });
  it('38 + 27: eerst de tientallen, dan via 70', () => {
    expect(maakSprongen(38, 27, '+')).toEqual([
      { van: 38, naar: 58 },
      { van: 58, naar: 60 },
      { van: 60, naar: 65 },
    ]);
  });
  it('34 + 5 in één sprong', () => {
    expect(maakSprongen(34, 5, '+')).toEqual([{ van: 34, naar: 39 }]);
  });
  it('de laatste sprong komt altijd op het antwoord uit', () => {
    const rnd = zaadRnd(6);
    for (const niveau of REKEN_NIVEAUS) {
      for (let i = 0; i < 500; i++) {
        const s = maakSom(niveau, { rnd });
        expect(s.sprongen.at(-1)!.naar).toBe(s.antwoord);
        expect(s.sprongen[0].van).toBe(s.a);
      }
    }
  });
});

describe('foute keuzes', () => {
  it('bevat de typische fout "overschrijding vergeten"', () => {
    expect(maakAfleiders(52, 7, '-', 45, zaadRnd(1))).toContain(55);
    expect(maakAfleiders(13, 6, '-', 7, zaadRnd(1))).toContain(13);
  });
});
