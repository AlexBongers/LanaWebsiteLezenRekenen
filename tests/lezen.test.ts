import { describe, expect, it } from 'vitest';
import {
  FLITS_MAX,
  FLITS_MIN,
  LEES_NIVEAUS,
  maakFlitsOpgaven,
  nieuweFlitstijd,
  woordGroepen,
} from '../src/engine/generator-lezen';
import { zaadRnd } from '../src/engine/toeval';
import verhalen from '../content/lezen/verhalen-E4.json';

describe('flitswoorden', () => {
  it('elke groep heeft precies 3 verschillende woorden', () => {
    for (const n of LEES_NIVEAUS) {
      for (const g of woordGroepen(n)) {
        expect(g).toHaveLength(3);
        expect(new Set(g).size).toBe(3);
      }
    }
  });

  it('opgaven bevatten het geflitste woord en geen dubbele groepen', () => {
    const opgaven = maakFlitsOpgaven('L2', 8, zaadRnd(1));
    expect(opgaven).toHaveLength(8);
    for (const o of opgaven) expect(o.keuzes).toContain(o.woord);
    expect(new Set(opgaven.map((o) => o.keuzes.slice().sort().join())).size).toBe(8);
  });

  it('flitstijd blijft tussen de grenzen', () => {
    let t = 1500;
    for (let i = 0; i < 100; i++) t = nieuweFlitstijd(t, true);
    expect(t).toBe(FLITS_MIN);
    for (let i = 0; i < 100; i++) t = nieuweFlitstijd(t, false);
    expect(t).toBe(FLITS_MAX);
  });
});

describe('verhalen', () => {
  it('elke vraag heeft 3 keuzes en een geldig goed antwoord', () => {
    for (const v of verhalen) {
      expect(v.zinnen.length).toBeGreaterThan(5);
      for (const q of v.vragen) {
        expect(q.keuzes).toHaveLength(3);
        expect(q.goed).toBeGreaterThanOrEqual(0);
        expect(q.goed).toBeLessThan(3);
      }
    }
  });

  it('het goede antwoord staat niet altijd op dezelfde plek', () => {
    const plekken = new Set(verhalen.flatMap((v) => v.vragen.map((q) => q.goed)));
    expect(plekken.size).toBe(3);
  });
});
