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

  it('R2 en R3 gaan tot 100 en nooit over het tiental', () => {
    const rnd = zaadRnd(2);
    for (let i = 0; i < 4000; i++) {
      const s = maakSom(i % 2 ? 'R2' : 'R3', { rnd });
      expect(s.antwoord).toBeGreaterThanOrEqual(0);
      expect(s.antwoord).toBeLessThanOrEqual(100);
      expect(overschrijdt(s.a, s.b, s.op)).toBe(false);
    }
  });

  it('R4 en R5 gaan altijd over het tiental en blijven tot 100', () => {
    const rnd = zaadRnd(3);
    for (let i = 0; i < 4000; i++) {
      const s = maakSom(i % 2 ? 'R4' : 'R5', { rnd });
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

describe('rustige opbouw van rekenen', () => {
  it('R2: alleen hele tientallen of een los getal erbij/eraf', () => {
    const rnd = zaadRnd(11);
    for (let i = 0; i < 2000; i++) {
      const s = maakSom('R2', { rnd, verhaalKans: 0 });
      expect(s.b < 10 || (s.a % 10 === 0 && s.b % 10 === 0)).toBe(true);
    }
  });
  it('R4: over het tiental met maar één getal (47 + 8)', () => {
    const rnd = zaadRnd(12);
    for (let i = 0; i < 2000; i++) expect(maakSom('R4', { rnd, verhaalKans: 0 }).b).toBeLessThan(10);
  });
  it('somNiveau hoort bij het niveau dat de som maakte', async () => {
    const { somNiveau } = await import('../src/engine/generator-rekenen');
    const rnd = zaadRnd(13);
    REKEN_NIVEAUS.forEach((n, i) => {
      for (let k = 0; k < 500; k++) {
        const s = maakSom(n, { rnd, verhaalKans: 0 });
        // Nooit moeilijker dan het niveau zelf (overlap naar beneden mag: 20 − 5 lijkt op R1).
        const gevonden = somNiveau(s.a, s.op, s.b);
        expect(gevonden).toBeLessThanOrEqual(i);

      }
    });
  });
});


describe('getallen in woorden (voor de stem)', () => {
  it('spreekt getallen goed uit', async () => {
    const { getalInWoorden } = await import('../src/audio/getallen');
    expect(getalInWoorden(0)).toBe('nul');
    expect(getalInWoorden(1)).toBe('één');
    expect(getalInWoorden(13)).toBe('dertien');
    expect(getalInWoorden(20)).toBe('twintig');
    expect(getalInWoorden(21)).toBe('eenentwintig');
    expect(getalInWoorden(22)).toBe('tweeëntwintig');
    expect(getalInWoorden(23)).toBe('drieëntwintig');
    expect(getalInWoorden(47)).toBe('zevenenveertig');
    expect(getalInWoorden(88)).toBe('achtentachtig');
    expect(getalInWoorden(100)).toBe('honderd');
  });
});
