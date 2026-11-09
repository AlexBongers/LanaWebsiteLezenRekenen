import { describe, expect, it } from 'vitest';
import {
  knipPlekken,
  maakDozen,
  maakPlaatjes,
  maakRijm,
  maakSpringen,
  maakTafels,
  maakZinnen,
  maakZwaard,
  PLAATJES,
  ZIN_GROEPEN,
} from '../src/engine/generator-fase3';
import { zaadRnd } from '../src/engine/toeval';
import karaoke from '../content/fase3/karaoke.json';
import klank from '../content/fase3/klankgroepen.json';
import rijm from '../content/fase3/rijm.json';

const uniek = <T>(l: T[]) => new Set(l.map((x) => JSON.stringify(x))).size === l.length;

describe('woord bij plaatje', () => {
  it('heeft geen dubbele woorden of plaatjes', () => {
    expect(uniek(PLAATJES.map((p) => p.woord))).toBe(true);
    expect(uniek(PLAATJES.map((p) => p.emoji))).toBe(true);
  });
  it('3 verschillende keuzes met het goede plaatje erbij; niveau 1 alleen korte woorden', () => {
    for (const niveau of [0, 1]) {
      const rnd = zaadRnd(niveau + 1);
      const opgaven = maakPlaatjes(niveau, 10, rnd);
      expect(opgaven).toHaveLength(10);
      for (const o of opgaven) {
        expect(o.keuzes).toHaveLength(3);
        expect(uniek(o.keuzes)).toBe(true);
        expect(o.keuzes.some((k) => k.woord === o.woord)).toBe(true);
        if (niveau === 0) expect(o.woord.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('rijm-rap', () => {
  it('elk rijmwoord rijmt echt en de afleiders niet (zelfde eind na de laatste klinker)', () => {
    const eind = (w: string) => w.replace(/^.*?([aeiouy]+[^aeiouy]*)$/, '$1');
    for (const set of [...rijm.niveau1, ...rijm.niveau2]) {
      const [woord, rijmwoord, ...af] = set;
      expect(set).toHaveLength(4);
      expect(uniek(set)).toBe(true);
      expect(eind(rijmwoord)).toBe(eind(woord));
      for (const a of af) expect(eind(a)).not.toBe(eind(woord));
    }
  });
  it('maakt opgaven zonder dubbele woorden', () => {
    const o = maakRijm(1, 10, zaadRnd(3));
    expect(o).toHaveLength(10);
    expect(uniek(o.map((x) => x.woord))).toBe(true);
    for (const x of o) expect(x.keuzes).toContain(x.rijm);
  });
});

describe('klankgroepen-zwaard', () => {
  it('niveau 1 heeft 2 klankgroepen, niveau 2 heeft er 3', () => {
    for (const w of klank.niveau1) expect(w.split('|')).toHaveLength(2);
    for (const w of klank.niveau2) expect(w.split('|')).toHaveLength(3);
  });
  it('knipplekken kloppen', () => {
    expect(knipPlekken(['ra', 'men'])).toEqual([2]);
    expect(knipPlekken(['zon', 'ne', 'bril'])).toEqual([3, 5]);
    const o = maakZwaard(1, 8, zaadRnd(4));
    for (const x of o) expect(x.delen.join('')).toBe(x.woord);
  });
});

describe('zinnen-show', () => {
  it('elk groepje heeft 3 verschillende zinnen en plaatjes', () => {
    for (const g of ZIN_GROEPEN) {
      expect(g).toHaveLength(3);
      expect(uniek(g.map((z) => z.zin))).toBe(true);
      expect(uniek(g.map((z) => z.plaatje))).toBe(true);
    }
    for (const o of maakZinnen(8, zaadRnd(5))) expect(o.keuzes.some((k) => k.zin === o.zin)).toBe(true);
  });
});

describe('getallen-spring', () => {
  it('doelen liggen op de getallenlijn; sprongen gaan via het hele tiental', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakSpringen(niveau, 30, zaadRnd(6 + niveau))) {
        for (const d of o.doelen) {
          expect(d).toBeGreaterThanOrEqual(o.van);
          expect(d).toBeLessThanOrEqual(o.tot);
          expect((d - o.van) % o.stap).toBe(0);
        }
        if (o.som) {
          const uitkomst = o.som.op === '+' ? o.som.a + o.som.b : o.som.a - o.som.b;
          expect(o.doelen[1]).toBe(uitkomst);
          expect(o.doelen[0] % 10).toBe(0);
          expect(uitkomst).toBeGreaterThanOrEqual(0);
          expect(uitkomst).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe('lightstick-dozen en tafel-ritme', () => {
  it('dozen: getallen tussen 11 en 99, tel-keuzes met het goede getal', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakDozen(niveau, 12, zaadRnd(9 + niveau))) {
        expect(o.getal).toBeGreaterThan(10);
        expect(o.getal).toBeLessThan(100);
        if (o.keuzes) {
          expect(o.keuzes).toContain(o.getal);
          expect(uniek(o.keuzes)).toBe(true);
        }
      }
    }
  });
  it('tafels: de reeks klopt en het antwoord staat tussen de keuzes', () => {
    for (const niveau of [0, 1, 2]) {
      for (const o of maakTafels(niveau, 12, zaadRnd(12 + niveau))) {
        expect(o.reeks[1] - o.reeks[0]).toBe(o.tafel);
        expect(o.antwoord - o.reeks[2]).toBe(o.tafel);
        expect(o.keuzes).toContain(o.antwoord);
        expect(uniek(o.keuzes)).toBe(true);
        expect(Math.max(...o.keuzes)).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('karaoke', () => {
  it('liedjes hebben korte regels zonder aanhalingstekens', () => {
    for (const l of karaoke.liedjes) {
      expect(l.regels.length).toBeGreaterThanOrEqual(3);
      for (const r of l.regels) {
        expect(r.split(' ').length).toBeLessThanOrEqual(11);
        expect(r).not.toMatch(/["“”„]/);
      }
    }
  });
});

describe('alles van fase 3 is ingesproken', () => {
  it('woorden, rijmen, klankgroepen, zinnen en karaoke staan in de stemlijst', async () => {
    const { alleTeksten } = await import('../src/audio/alle-teksten');
    const lijst = new Set(alleTeksten().map((t) => `${t.soort}|${t.tekst}`));
    for (const p of PLAATJES) expect(lijst.has(`woord|${p.woord}`)).toBe(true);
    for (const [w, r] of [...rijm.niveau1, ...rijm.niveau2]) {
      expect(lijst.has(`woord|${w}`)).toBe(true);
      expect(lijst.has(`woord|${r}`)).toBe(true);
    }
    for (const w of [...klank.niveau1, ...klank.niveau2]) expect(lijst.has(`woord|${w.replace(/\|/g, '')}`)).toBe(true);
    for (const g of ZIN_GROEPEN) for (const z of g) expect(lijst.has(`zin|${z.zin}`)).toBe(true);
    for (const l of karaoke.liedjes) for (const r of l.regels) expect(lijst.has(`zin|${r}`)).toBe(true);
  });
});

describe('lichte modus', () => {
  it('staat aan bij "aan", of bij "automatisch" als de meting traag was', async () => {
    const { wilLicht } = await import('../src/ui/prestatie');
    expect(wilLicht({ lichteModus: 'aan', lichtGemeten: false })).toBe(true);
    expect(wilLicht({ lichteModus: 'uit', lichtGemeten: true })).toBe(false);
    expect(wilLicht({ lichteModus: 'auto', lichtGemeten: true })).toBe(true);
    expect(wilLicht({ lichteModus: 'auto', lichtGemeten: false })).toBe(false);
    expect(wilLicht({ lichteModus: 'auto', lichtGemeten: null })).toBe(false);
  });
});
