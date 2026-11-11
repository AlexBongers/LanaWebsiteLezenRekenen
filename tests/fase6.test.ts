import { describe, expect, it } from 'vitest';
import { DICTEE_WOORDEN, klanken, maakDictee, maakGeld, maakHarten, maakKlinker, maakMeten } from '../src/engine/generator-fase6';
import { zaadRnd } from '../src/engine/toeval';
import plaatjes from '../content/fase3/plaatjes.json';

describe('spelling', () => {
  it('knipt woorden in klanken zoals op school', () => {
    expect(klanken('schoen')).toEqual(['sch', 'oe', 'n']);
    expect(klanken('maan')).toEqual(['m', 'aa', 'n']);
    expect(klanken('trein')).toEqual(['t', 'r', 'ei', 'n']);
    expect(klanken('haai')).toEqual(['h', 'aai']);
  });

  it('alle dicteewoorden zijn ingesproken (staan bij de plaatjes)', () => {
    const woorden = new Set((plaatjes.woorden as [string, string][]).map(([w]) => w));
    for (const w of DICTEE_WOORDEN.flat()) expect(woorden.has(w)).toBe(true);
  });

  it('dictee: de klanken vormen het woord, de extra klanken zitten er niet in', () => {
    for (const niveau of [0, 1]) {
      for (const o of maakDictee(niveau, 15, zaadRnd(niveau + 2))) {
        expect(o.klanken.join('')).toBe(o.woord);
        for (const x of o.extra) expect(o.klanken).not.toContain(x);
        expect([...o.door].sort((a, b) => a - b)).toEqual([...o.klanken, ...o.extra].map((_, i) => i));
      }
    }
  });

  it('klinker-kiezer: het gat is een klinker en de goede klank staat tussen de keuzes', () => {
    for (const o of maakKlinker(1, 15, zaadRnd(9))) {
      expect(o.keuzes).toContain(o.klanken[o.gat]);
      expect(new Set(o.keuzes).size).toBe(o.keuzes.length);
    }
  });
});

describe('rekenen', () => {
  it('verliefde harten: samen het totaal, drie verschillende keuzes', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakHarten(niveau, 20, zaadRnd(niveau + 5))) {
        expect(o.deel + o.antwoord).toBe(o.totaal);
        if (niveau === 0) expect(o.totaal).toBe(10);
        if (niveau === 2) expect(o.totaal).toBeGreaterThan(10);
        expect(new Set(o.keuzes).size).toBe(3);
        expect(o.keuzes).toContain(o.antwoord);
      }
    }
  });

  it('geld: het totaal klopt en past bij het niveau', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakGeld(niveau, 20, zaadRnd(niveau + 11))) {
        expect(o.geld.reduce((s, m) => s + m.waarde, 0)).toBe(o.totaal);
        expect(o.totaal).toBeLessThanOrEqual(niveau === 0 ? 10 : niveau === 1 ? 20 : 100);
        expect(o.keuzes).toContain(o.totaal);
        expect(o.eenheid).toBe(niveau === 2 ? 'cent' : 'euro');
      }
    }
  });

  it('meten en wegen: het antwoord staat tussen de keuzes', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakMeten(niveau, 12, zaadRnd(niveau + 21))) {
        expect((o.keuzes as (string | number)[]).includes(o.antwoord)).toBe(true);
        if (niveau === 0) expect(o.soort).toBe('zwaarder');
      }
    }
  });
});
