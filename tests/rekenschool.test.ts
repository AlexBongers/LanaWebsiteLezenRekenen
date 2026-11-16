import { describe, expect, it } from 'vitest';
import { brugVan, maakGroepjes, maakRekenrek, maakWelkeSom, maakWinkel, steunVoor } from '../src/engine/generator-rekenschool';
import { zaadRnd } from '../src/engine/toeval';

describe('Rekenschool', () => {
  it('rekenen via de 10: 8 + 5 = 8 + 2 + 3, 13 − 5 = 13 − 3 − 2, 47 + 8 = 47 + 3 + 5', () => {
    expect(brugVan(8, '+', 5)).toEqual({ eerst: 2, dan: 3, tiental: 10 });
    expect(brugVan(13, '-', 5)).toEqual({ eerst: 3, dan: 2, tiental: 10 });
    expect(brugVan(47, '+', 8)).toEqual({ eerst: 3, dan: 5, tiental: 50 });
    expect(brugVan(53, '-', 7)).toEqual({ eerst: 3, dan: 4, tiental: 50 });
    expect(brugVan(4, '+', 3)).toBeNull();
  });

  it('rekenrek: niveau 1 en 2 gaan altijd via de 10, het antwoord klopt en zit in de keuzes', () => {
    for (const niveau of [0, 1, 2, 3]) {
      for (const o of maakRekenrek(niveau, 30, zaadRnd(niveau + 40))) {
        expect(o.antwoord).toBe(o.op === '+' ? o.a + o.b : o.a - o.b);
        expect(o.keuzes).toContain(o.antwoord);
        if (!o.uitdaging && (niveau === 1 || niveau === 2 || niveau === 3)) expect(o.brug).not.toBeNull();
        if (!o.uitdaging && niveau <= 2) expect(Math.max(o.a, o.antwoord)).toBeLessThanOrEqual(20);
      }
    }
  });

  it('uitdagingen komen af en toe voor, niet te vaak', () => {
    const lijst = maakRekenrek(1, 200, zaadRnd(7));
    const n = lijst.filter((o) => o.uitdaging).length;
    expect(n).toBeGreaterThan(10);
    expect(n).toBeLessThan(60);
  });

  it('tafel-groepjes: eerst de ankertafels, steunsommen kloppen', () => {
    for (const o of maakGroepjes(0, 20, zaadRnd(3))) if (!o.uitdaging) expect([2, 5, 10]).toContain(o.per);
    for (const o of maakGroepjes(2, 30, zaadRnd(4))) {
      expect(o.antwoord).toBe(o.groepen * o.per);
      expect(o.keuzes).toContain(o.antwoord);
    }
    expect(steunVoor(6, 7).tekst).toBe('5 × 7 = 35, en dan nog 7 erbij');
    expect(steunVoor(9, 7).tekst).toBe('10 × 7 = 70, en dan 7 eraf');
  });

  it('geldwinkel: wisselgeld klopt, bedragen passen bij het niveau', () => {
    for (const o of maakWinkel(2, 20, zaadRnd(5))) {
      if (o.uitdaging) continue;
      expect(o.soort).toBe('terug');
      expect(o.keuzes).toContain(o.betaald - o.prijs);
    }
    for (const o of maakWinkel(0, 20, zaadRnd(6))) if (!o.uitdaging) expect(o.prijs).toBeLessThanOrEqual(10);
  });

  it('welke som: de goede som staat tussen drie verschillende keuzes', () => {
    for (const o of maakWelkeSom(1, 10, zaadRnd(8))) {
      expect(o.keuzes).toContain(o.goed);
      expect(new Set(o.keuzes).size).toBe(o.keuzes.length);
    }
  });
});

import { HERHAAL_KANS, opgaveVoorTafel } from '../src/engine/generator-rekenschool';
import { DAGDOEL, schoolSpellen, schoolVandaag } from '../src/games/spellen';

describe('pedagogische nalooppunten', () => {
  it('herhaalt vanaf niveau 1 ook de tafels die ze al kent', () => {
    const nieuw = maakGroepjes(1, 12, zaadRnd(7), 0).filter((o) => !o.uitdaging);
    expect(nieuw.every((o) => [3, 4].includes(o.per))).toBe(true);
    const oud = maakGroepjes(1, 12, zaadRnd(7), 1).filter((o) => !o.uitdaging);
    expect(oud.every((o) => [2, 5, 10].includes(o.per))).toBe(true);
    const oud2 = maakGroepjes(2, 12, zaadRnd(7), 1).filter((o) => !o.uitdaging);
    expect(oud2.every((o) => [2, 3, 4, 5, 10].includes(o.per))).toBe(true);
    expect(HERHAAL_KANS).toBeGreaterThan(0.2);
  });

  it('bouwt een tafelsom uit de doosjes terug op', () => {
    const o = opgaveVoorTafel(6, 7);
    expect(o.antwoord).toBe(42);
    expect(o.keuzes).toContain(42);
    expect(o.steun.soort).toBe('afleiden');
  });

  it('telt de rekenspellen van vandaag voor het dagdoel', () => {
    const nu = new Date('2026-11-16T15:00:00');
    const gisteren = new Date('2026-11-15T15:00:00').toISOString();
    const sessies = [
      { datum: gisteren, spel: 'rekenrek' },
      { datum: nu.toISOString(), spel: 'rekenrek' },
      { datum: nu.toISOString(), spel: 'flits' },
      { datum: nu.toISOString(), spel: 'sommen' },
      { datum: nu.toISOString() },
    ];
    expect(schoolVandaag(sessies, nu)).toBe(2);
    expect(DAGDOEL).toBe(3);
    expect(schoolSpellen().map((s) => s.id)).toEqual(['harten', 'rekenrek', 'sommen', 'groepjes', 'winkel', 'welkesom']);
  });
});
