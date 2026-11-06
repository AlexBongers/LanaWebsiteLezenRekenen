import { describe, expect, it } from 'vitest';
import {
  STEDEN,
  baasOpen,
  huidigeStad,
  noteerSterren,
  stadOpen,
  sterrenVoor,
  totaalSterren,
  tourKlaar,
  type TourStand,
} from '../src/engine/tour';
import { heeftItem, item, CATEGORIEEN } from '../src/engine/kleedkamer';
import teksten from '../content/teksten.json';

describe('wereldtour', () => {
  it('begint met alleen de eerste stad open', () => {
    expect(stadOpen(0, {})).toBe(true);
    expect(stadOpen(1, {})).toBe(false);
    expect(huidigeStad({}).id).toBe(STEDEN[0].id);
  });

  it('de baas komt pas als alle drie de meiden gespeeld zijn', () => {
    let t: TourStand = {};
    t = noteerSterren(t, 'seoel', 'rumi', 2);
    t = noteerSterren(t, 'seoel', 'mira', 1);
    expect(baasOpen('seoel', t)).toBe(false);
    t = noteerSterren(t, 'seoel', 'zoey', 3);
    expect(baasOpen('seoel', t)).toBe(true);
  });

  it('na de baas gaat de volgende stad open', () => {
    let t: TourStand = {};
    t = noteerSterren(t, 'seoel', 'baas', 1);
    expect(stadOpen(1, t)).toBe(true);
    expect(huidigeStad(t).id).toBe(STEDEN[1].id);
  });

  it('bewaart de beste score', () => {
    let t = noteerSterren({}, 'seoel', 'mira', 3);
    t = noteerSterren(t, 'seoel', 'mira', 1);
    expect(t.seoel.mira).toBe(3);
    expect(totaalSterren(t)).toBe(3);
  });

  it('tour is klaar als alle baas-demonen weg zijn', () => {
    let t: TourStand = {};
    for (const s of STEDEN) t = noteerSterren(t, s.id, 'baas', 1);
    expect(tourKlaar(t)).toBe(true);
  });

  it('sterren volgens de 85%/60%-regel', () => {
    expect(sterrenVoor(8, 8)).toBe(3);
    expect(sterrenVoor(5, 8)).toBe(2);
    expect(sterrenVoor(2, 8)).toBe(1);
  });
});

describe('kleedkamer', () => {
  it('gratis items heeft Lana meteen, betaalde pas na kopen', () => {
    expect(heeftItem([], 'outfit', 'paarsjasje')).toBe(true);
    expect(heeftItem([], 'outfit', 'glitterjurk')).toBe(false);
    expect(heeftItem(['outfit:glitterjurk'], 'outfit', 'glitterjurk')).toBe(true);
  });
  it('elke categorie heeft een gratis begin-item en unieke ids', () => {
    for (const c of CATEGORIEEN) {
      expect(c.items.some((i) => i.prijs === 0)).toBe(true);
      expect(new Set(c.items.map((i) => i.id)).size).toBe(c.items.length);
    }
    expect(item('accessoire', 'kroon')?.prijs).toBeGreaterThan(0);
  });
});

describe('aanmoedigingen', () => {
  it('zijn er genoeg, en een flink deel noemt Lana', () => {
    expect(teksten.complimenten.length + teksten.complimentenLana.length).toBeGreaterThanOrEqual(40);
    expect(teksten.complimentenLana.every((z) => z.includes('Lana'))).toBe(true);
    expect(new Set(teksten.complimenten).size).toBe(teksten.complimenten.length);
  });
});
