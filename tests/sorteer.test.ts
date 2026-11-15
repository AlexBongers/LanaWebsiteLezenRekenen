import { describe, expect, it } from 'vitest';
import { BAKKEN, SOORTEN, maakSorteer } from '../src/engine/generator-sorteer';
import { zaadRnd } from '../src/engine/toeval';
import { alleTeksten } from '../src/audio/alle-teksten';

describe('Sorteer-show', () => {
  it('alle woorden zijn ingesproken en staan maar in één mand', () => {
    const ingesproken = new Set(alleTeksten().filter((t) => t.soort === 'woord').map((t) => t.tekst));
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

describe('afwisseling (vers)', () => {
  it('kiest eerst wat nog niet gezien is, daarna het langst geleden geziene', async () => {
    const { vg } = await import('../src/store/voortgang.svelte');
    const { kiesVers } = await import('../src/games/vers');
    vg.gezienRecent = {};
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
    const eerste = kiesVers('test', pool, (x) => x, 3);
    const tweede = kiesVers('test', pool, (x) => x, 3);
    // De tweede keer krijgt ze de drie die ze nog niet had
    expect(new Set([...eerste, ...tweede]).size).toBe(6);
    // Daarna komen de eerste drie weer (die zijn het langst geleden)
    const derde = kiesVers('test', pool, (x) => x, 3);
    expect([...derde].sort()).toEqual([...eerste].sort());
  });
});
