import { describe, expect, it } from 'vitest';
import { kampioenDelen, maakKampioen, maakPoortSom } from '../src/engine/generator-kampioen';
import { zaadRnd } from '../src/engine/toeval';

describe('Tafel-kampioen (groep 5)', () => {
  it('poortsom: altijd tot 100 en altijd met overschrijding van het tiental', () => {
    const rnd = zaadRnd(4);
    for (let i = 0; i < 200; i++) {
      const s = maakPoortSom(rnd);
      expect(s.antwoord).toBe(s.op === '+' ? s.a + s.b : s.a - s.b);
      expect(s.antwoord).toBeGreaterThanOrEqual(10);
      expect(s.antwoord).toBeLessThanOrEqual(100);
      if (s.op === '+') expect((s.a % 10) + (s.b % 10)).toBeGreaterThanOrEqual(10);
      else expect(s.a % 10).toBeLessThan(s.b % 10);
    }
  });

  it('opgaven kloppen, zijn uniek en niveau 0 heeft alleen keersommen', () => {
    for (const niveau of [0, 1]) {
      const lijst = maakKampioen(niveau, 10, zaadRnd(niveau + 8));
      expect(lijst).toHaveLength(10);
      expect(new Set(lijst.map((o) => `${o.a}${o.op}${o.b}`)).size).toBe(10);
      for (const o of lijst) {
        expect(o.op === '×' ? o.a * o.b : o.a / o.b).toBe(o.antwoord);
        if (niveau === 0) expect(o.op).toBe('×');
      }
    }
  });

  it('de stem zegt keer en gedeeld door', () => {
    expect(kampioenDelen({ a: 7, op: '×', b: 8, antwoord: 56 }, true)).toEqual(['7', 'keer', '8', 'is', '56']);
    expect(kampioenDelen({ a: 56, op: ':', b: 7, antwoord: 8 })).toEqual(['56', 'gedeeld door', '7']);
  });
});
