import { describe, expect, it } from 'vitest';
import { maakBallonnen, maakSterrenregen } from '../src/engine/generator-fase5';
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
});
