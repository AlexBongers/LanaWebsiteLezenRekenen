import { describe, expect, it } from 'vitest';
import { aanDeBeurt, verwerkAntwoord, type Herhaling } from '../src/engine/herhaling';
import { AUDITIE, auditieUitslag, planAuditie, planSessie, verdeling } from '../src/engine/sessie';
import { maakSommen, REKEN_NIVEAUS, somId, somSoort, somUitId } from '../src/engine/generator-rekenen';
import { flitsUitId, groepSleutel, LEES_NIVEAUS, maakFlitsOpgaven, woordId } from '../src/engine/generator-lezen';
import { werkStatsBij, lastigsteSommen, vaakVerwisseld, type Stats } from '../src/engine/overzicht';
import { zaadRnd } from '../src/engine/toeval';

const DAG = 864e5;

describe('herhalingsdoosjes', () => {
  it('fout gaat naar doos 1 en komt meteen weer aan de beurt', () => {
    const h = verwerkAntwoord({}, 'som.47+8', false, 2, 1000);
    expect(h['som.47+8']).toEqual({ doos: 1, volgende: 1000, niveau: 2 });
    expect(aanDeBeurt(h, 'som.', 1000)).toEqual([{ id: 'som.47+8', niveau: 2 }]);
  });

  it('goed schuift een doos op en wacht steeds langer', () => {
    let h: Herhaling = verwerkAntwoord({}, 'woord.lucht', false, 1, 0);
    h = verwerkAntwoord(h, 'woord.lucht', true, 1, 0);
    expect(h['woord.lucht'].doos).toBe(2);
    expect(h['woord.lucht'].volgende).toBe(1 * DAG);
    expect(aanDeBeurt(h, 'woord.', 0)).toHaveLength(0);
    expect(aanDeBeurt(h, 'woord.', DAG)).toHaveLength(1);
    h = verwerkAntwoord(h, 'woord.lucht', true, 1, 0);
    expect(h['woord.lucht'].volgende).toBe(3 * DAG);
  });

  it('na doos 5 is het gekend en verdwijnt het', () => {
    let h: Herhaling = verwerkAntwoord({}, 'woord.lucht', false, 1, 0);
    for (let i = 0; i < 4; i++) h = verwerkAntwoord(h, 'woord.lucht', true, 1, 0);
    expect(h['woord.lucht'].doos).toBe(5);
    h = verwerkAntwoord(h, 'woord.lucht', true, 1, 0);
    expect(h['woord.lucht']).toBeUndefined();
  });

  it('weer fout gaat terug naar doos 1', () => {
    let h: Herhaling = verwerkAntwoord({}, 'som.8+5', false, 0, 0);
    h = verwerkAntwoord(h, 'som.8+5', true, 0, 0);
    h = verwerkAntwoord(h, 'som.8+5', true, 0, 0);
    h = verwerkAntwoord(h, 'som.8+5', false, 0, 5);
    expect(h['som.8+5']).toEqual({ doos: 1, volgende: 5, niveau: 0 });
  });

  it('meteen goed zonder doos voegt niets toe', () => {
    expect(verwerkAntwoord({}, 'som.8+5', true, 0, 0)).toEqual({});
  });

  it('laagste doos eerst', () => {
    const h: Herhaling = {
      'som.1+1': { doos: 3, volgende: 0, niveau: 0 },
      'som.2+2': { doos: 1, volgende: 0, niveau: 0 },
      'woord.maan': { doos: 1, volgende: 0, niveau: 0 },
    };
    expect(aanDeBeurt(h, 'som.', 0).map((x) => x.id)).toEqual(['som.2+2', 'som.1+1']);
  });
});

describe('sleutels terug naar opgaven', () => {
  it('som heen en terug', () => {
    const s = somUitId('som.47+8')!;
    expect(s.antwoord).toBe(55);
    expect(s.keuzes).toContain(55);
    expect(somId(s)).toBe('som.47+8');
    expect(somUitId('som.52-7')!.antwoord).toBe(45);
    expect(somUitId('rommel')).toBeNull();
  });

  it('woord heen en terug, met zijn groepje', () => {
    const o = flitsUitId('woord.lucht')!;
    expect(o.woord).toBe('lucht');
    expect(o.keuzes).toContain('lucht');
    expect(o.keuzes).toHaveLength(3);
    expect(flitsUitId('woord.bestaatniet')).toBeNull();
  });

  it('soort som', () => {
    expect(somSoort(47, '+', 8)).toBe('plus tot 100 met overschrijding');
    expect(somSoort(34, '+', 5)).toBe('plus tot 100 zonder overschrijding');
    expect(somSoort(13, '-', 6)).toBe('min tot 20 met overschrijding');
    expect(somSoort(30, '+', 40)).toBe('plus tot 100 hele tientallen');
  });
});

describe('concert plannen', () => {
  it('verdeling 70/20/10', () => {
    expect(verdeling(10, true, true, 0)).toEqual({ niveau: 7, makkelijk: 2, uitdaging: 1, herhaling: 0 });
    expect(verdeling(8, true, true, 5)).toEqual({ niveau: 3, makkelijk: 2, uitdaging: 1, herhaling: 2 });
    expect(verdeling(8, false, true, 0)).toEqual({ niveau: 7, makkelijk: 0, uitdaging: 1, herhaling: 0 });
    expect(verdeling(8, true, false, 0)).toEqual({ niveau: 6, makkelijk: 2, uitdaging: 0, herhaling: 0 });
  });

  const rekenPlan = (niveau: number, herhaling: { id: string; niveau: number }[] = [], zaad = 1) => {
    const rnd = zaadRnd(zaad);
    return planSessie({
      aantal: 8,
      niveau,
      maxNiveau: REKEN_NIVEAUS.length - 1,
      herhaling,
      maak: (n, aantal) => maakSommen(REKEN_NIVEAUS[n], aantal, { rnd, verhaalKans: 0 }),
      herbouw: (id) => somUitId(id, rnd),
      id: somId,
      rnd,
    });
  };

  it('maakt precies het gevraagde aantal, zonder dubbele', () => {
    for (let zaad = 1; zaad < 30; zaad++) {
      for (const niveau of [0, 1, 2]) {
        const plan = rekenPlan(niveau, [], zaad);
        expect(plan).toHaveLength(8);
        expect(new Set(plan.map((p) => p.id)).size).toBe(8);
      }
    }
  });

  it('begint met een makkelijke opgave en heeft één uitdaging', () => {
    const plan = rekenPlan(1);
    expect(plan[0].bron).toBe('makkelijk');
    expect(plan[0].niveau).toBe(0);
    expect(plan.filter((p) => p.bron === 'uitdaging')).toHaveLength(1);
    expect(plan.filter((p) => p.bron === 'uitdaging')[0].niveau).toBe(2);
    expect(plan.filter((p) => p.bron === 'niveau').length).toBeGreaterThanOrEqual(5);
  });

  it('neemt opgaven uit de doosjes mee (maximaal een kwart)', () => {
    const herhaling = ['som.47+8', 'som.52-7', 'som.38+27', 'som.61-9'].map((id) => ({ id, niveau: 2 }));
    const plan = rekenPlan(1, herhaling);
    const h = plan.filter((p) => p.bron === 'herhaling');
    expect(h.map((p) => p.id).sort()).toEqual(['som.47+8', 'som.52-7']);
    expect(h[0].niveau).toBe(2);
    expect(plan).toHaveLength(8);
  });

  it('flitsen: geen twee woorden uit hetzelfde groepje', () => {
    const rnd = zaadRnd(4);
    const plan = planSessie({
      aantal: 8,
      niveau: 1,
      maxNiveau: LEES_NIVEAUS.length - 1,
      herhaling: [{ id: 'woord.lucht', niveau: 1 }],
      maak: (n, aantal) => maakFlitsOpgaven(LEES_NIVEAUS[n], aantal, rnd),
      herbouw: (id) => flitsUitId(id, rnd),
      id: (o) => woordId(o.woord),
      sleutel: groepSleutel,
      rnd,
    });
    expect(plan).toHaveLength(8);
    expect(new Set(plan.map((p) => groepSleutel(p.opgave))).size).toBe(8);
    expect(plan.some((p) => p.id === 'woord.lucht')).toBe(true);
  });
});

describe('auditie', () => {
  it('loopt op in moeilijkheid', () => {
    const plan = planAuditie(AUDITIE.rekenen, (n, aantal) => maakSommen(REKEN_NIVEAUS[n], aantal), somId);
    expect(plan.map((p) => p.niveau)).toEqual([0, 0, 1, 1, 1, 2, 2, 2]);
    expect(plan.every((p) => p.bron === 'auditie')).toBe(true);
  });

  const r = (niveau: number, goed: boolean) => ({ niveau, goed });

  it('begint op het eerste niveau dat nog niet lukt', () => {
    // R1 goed, R3 1 van 3: begin op R3
    expect(auditieUitslag([r(0, true), r(0, true), r(1, true), r(1, false), r(1, false), r(2, false), r(2, false), r(2, false)], 2)).toBe(1);
    // R1 maar half goed: begin op R1
    expect(auditieUitslag([r(0, true), r(0, false), r(1, true), r(1, true), r(1, true)], 2)).toBe(0);
    // 2 van 3 is genoeg
    expect(auditieUitslag([r(0, true), r(0, true), r(1, true), r(1, true), r(1, false), r(2, true), r(2, false), r(2, false)], 2)).toBe(2);
    // Alles goed: hoogste niveau
    expect(auditieUitslag([r(0, true), r(1, true), r(2, true)], 2)).toBe(2);
  });
});

describe('overzicht voor de ouderhoek', () => {
  it('telt per soort som en onthoudt verwisselde woorden', () => {
    let stats: Stats = { sommen: {}, verwisselingen: {} };
    stats = werkStatsBij(stats, [
      { id: 'som.47+8', niveau: 2, bron: 'niveau', goed: false },
      { id: 'som.36+7', niveau: 2, bron: 'niveau', goed: true },
      { id: 'som.52-7', niveau: 2, bron: 'niveau', goed: false },
      { id: 'woord.lucht', niveau: 1, bron: 'niveau', goed: false, gekozen: 'licht' },
      { id: 'woord.lucht', niveau: 1, bron: 'herhaling', goed: false, gekozen: 'licht' },
      { id: 'woord.maan', niveau: 0, bron: 'niveau', goed: true },
    ]);
    expect(stats.sommen['plus tot 100 met overschrijding']).toEqual({ goed: 1, totaal: 2 });
    expect(lastigsteSommen(stats, 1)[0].soort).toBe('min tot 100 met overschrijding');
    expect(vaakVerwisseld(stats)).toEqual([{ woord: 'lucht', gekozen: 'licht', keer: 2 }]);
  });
});
