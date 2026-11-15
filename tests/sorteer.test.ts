import { describe, expect, it } from 'vitest';
import { BAKKEN, SOORTEN, maakSorteer } from '../src/engine/generator-sorteer';
import { zaadRnd } from '../src/engine/toeval';
import plaatjes from '../content/fase3/plaatjes.json';

describe('Sorteer-show', () => {
  it('alle woorden zijn ingesproken en staan maar in één mand', () => {
    const ingesproken = new Set((plaatjes.woorden as [string, string][]).map(([w]) => w));
    const gezien = new Set<string>();
    for (const b of BAKKEN) {
      for (const w of SOORTEN[b.id]) {
        expect(ingesproken.has(w)).toBe(true);
        expect(gezien.has(w)).toBe(false);
        gezien.add(w);
      }
    }
  });

  it('het woord hoort echt in de goede mand, drie verschillende manden', () => {
    for (const niveau of [0, 1]) {
      const lijst = maakSorteer(niveau, 10, zaadRnd(niveau + 3));
      expect(lijst).toHaveLength(10);
      for (const o of lijst) {
        expect(new Set(o.bakken.map((b) => b.id)).size).toBe(3);
        expect(SOORTEN[o.bakken[o.goed].id]).toContain(o.woord);
        if (niveau === 0) expect(o.woord.length).toBeLessThanOrEqual(5);
      }
    }
  });
});
