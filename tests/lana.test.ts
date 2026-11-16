import { describe, expect, it } from 'vitest';
import {
  ALLE_KLOKTIJDEN, BANK_MAX, LAB_MAX, TOREN_MAX, bankId, digitaal, geldSpraak, geldTekst, klokAfleiders, klokHint, labId, labTafel,
  maakBank, maakLab, maakToren, minsteStukken, tijdId, tijdTekst, tijdZin,
} from '../src/engine/generator-lana';
import { zaadRnd } from '../src/engine/toeval';

describe('Rekenlab', () => {
  it('houdt elk niveau binnen zijn getallengebied', () => {
    for (let n = 0; n <= LAB_MAX; n++) {
      for (const o of maakLab(n, 40, zaadRnd(n + 1))) {
        if (o.uitdaging) continue;
        const { a, op, b } = o.soort === 'som' ? o.som : o.soort === 'gat' ? { a: o.a, op: o.op, b: o.antwoord } : { a: 0, op: '+' as const, b: 0 };
        const uit = op === '+' ? a + b : a - b;
        expect(uit).toBeGreaterThanOrEqual(0);
        expect(Math.max(a, uit)).toBeLessThanOrEqual(n === 0 ? 10 : n <= 3 ? 20 : 100);
        const over = op === '+' ? (a % 10) + (b % 10) > 10 || ((a % 10) + (b % 10) === 10 && false) : a % 10 < b % 10;
        if (n === 2) expect(op === '+' && a < 10 && a + b > 10).toBe(true);
        if (n === 4) expect(over).toBe(false);
        if (n === 5) expect(op === '+' ? (a % 10) + b > 10 : a % 10 < b).toBe(true);
      }
    }
  });

  it('maakt gatsommen met het ontbrekende getal als antwoord', () => {
    const gaten = maakLab(3, 60, zaadRnd(4)).filter((o) => o.soort === 'gat');
    expect(gaten.length).toBeGreaterThan(5);
    for (const g of gaten) if (g.soort === 'gat') expect(g.op === '+' ? g.a + g.antwoord : g.a - g.antwoord).toBe(g.c);
  });

  it('geeft plussommen een sleutel voor de herhalingsdoosjes en tafels pas vanaf niveau 2', () => {
    const som = maakLab(2, 10, zaadRnd(2)).find((o) => o.soort === 'som')!;
    expect(labId(som)).toMatch(/^som\.\d+[+-]\d+$/);
    expect(labTafel(0, zaadRnd(1))).toBeNull();
    const t = labTafel(2, zaadRnd(1))!;
    expect(t.soort === 'keer' && [2, 5, 10].includes(t.per)).toBe(true);
    expect(labId(t)).toMatch(/^keer\.\d+x\d+$/);
  });
});

describe('Eurobank', () => {
  it('schrijft en zegt bedragen goed', () => {
    expect(geldTekst(300)).toBe('€ 3');
    expect(geldTekst(250)).toBe('€ 2,50');
    expect(geldTekst(45)).toBe('45 cent');
    expect(geldSpraak(250)).toEqual(['2', 'euro', '50']);
    expect(geldSpraak(45)).toEqual(['45', 'cent']);
    expect(minsteStukken(800, [100, 200, 500])).toEqual([500, 200, 100]);
  });

  it('klopt op elk niveau', () => {
    for (let n = 0; n <= BANK_MAX; n++) {
      const lijst = maakBank(n, 30, zaadRnd(n + 3));
      expect(lijst.length).toBeGreaterThan(15);
      expect(new Set(lijst.map(bankId)).size).toBe(lijst.length);
      for (const o of lijst) {
        if (o.soort === 'tel') {
          expect(o.geld.reduce((s, x) => s + x, 0)).toBe(o.antwoord);
          expect(o.geld.length).toBeLessThanOrEqual(8);
          expect(o.keuzes).toContain(o.antwoord);
        } else if (o.soort === 'maak') {
          expect(minsteStukken(o.bedrag, o.stukken).reduce((s, x) => s + x, 0)).toBe(o.bedrag);
        } else if (o.soort === 'genoeg') {
          expect(o.geld.reduce((s, x) => s + x, 0)).toBe(o.heeft);
          expect(o.genoeg ? o.heeft - o.prijs : o.prijs - o.heeft).toBe(o.verschil);
          expect(o.verschil).toBeGreaterThan(0);
        } else {
          expect(o.betaald - o.prijs).toBe(o.antwoord);
          expect(o.antwoord).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('Klokkentoren', () => {
  it('zegt de tijd zoals op school', () => {
    expect(tijdTekst({ uur: 3, min: 0 })).toBe('3 uur');
    expect(tijdTekst({ uur: 3, min: 30 })).toBe('half 4');
    expect(tijdTekst({ uur: 3, min: 15 })).toBe('kwart over 3');
    expect(tijdTekst({ uur: 3, min: 45 })).toBe('kwart voor 4');
    expect(tijdTekst({ uur: 3, min: 20 })).toBe('10 voor half 4');
    expect(tijdTekst({ uur: 12, min: 35 })).toBe('5 over half 1');
    expect(tijdZin({ uur: 3, min: 50 })).toBe('Tien voor vier.');
    expect(digitaal({ uur: 3, min: 5 })).toBe('3:05');
    expect(klokHint({ uur: 3, min: 25 })).toBe('voorHalf');
  });

  it('zegt hele en halve uren zoals de oude Klok-show (die opnames blijven bruikbaar)', () => {
    expect(tijdZin({ uur: 3, min: 0 })).toBe('Drie uur.');
    expect(tijdZin({ uur: 12, min: 30 })).toBe('Half één.');
    expect(ALLE_KLOKTIJDEN.length).toBe(144);
  });

  it('geeft unieke keuzes met de goede tijd erbij, en de juiste minuten per niveau', () => {
    const toegestaan = [[0], [0, 30], [0, 15, 30, 45], [0, 15, 30, 45]];
    for (let n = 0; n <= TOREN_MAX; n++) {
      for (const o of maakToren(n, 30, zaadRnd(n + 9))) {
        const ids = o.keuzes.map(tijdId);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain(tijdId(o.tijd));
        expect(o.keuzes.length).toBe(o.soort === 'kies' || o.soort === 'koppel' ? 3 : 4);
        if (!o.uitdaging && n < 4) expect(toegestaan[n]).toContain(o.tijd.min);
        // Ook de foute keuzes blijven binnen wat ze op dit niveau kent
        if (!o.uitdaging && n < 4) for (const k of o.keuzes) expect(toegestaan[n]).toContain(k.min);
        if (!o.uitdaging && n < 3) expect(['lees', 'kies']).toContain(o.soort);
      }
    }
    expect(klokAfleiders({ uur: 3, min: 30 }, zaadRnd(1)).map(tijdId)).not.toContain('3.30');
  });
});
