import { describe, expect, it } from 'vitest';
import { percentage, verwerkSessie } from '../src/engine/adaptief';
import { audioSleutel, cyrb53 } from '../src/audio/hash';

const reeks = (goed: number, totaal: number) => Array.from({ length: totaal }, (_, i) => i < goed);

describe('niveau-aanpassing', () => {
  it('gaat omhoog boven 85%', () => {
    expect(verwerkSessie({ niveau: 1, recent: [] }, reeks(8, 8), 2).niveau).toBe(2);
    expect(verwerkSessie({ niveau: 1, recent: [] }, reeks(7, 8), 2).niveau).toBe(2);
  });
  it('blijft tussen 60% en 85%', () => {
    expect(verwerkSessie({ niveau: 1, recent: [] }, reeks(6, 8), 2).niveau).toBe(1);
    expect(verwerkSessie({ niveau: 1, recent: [] }, reeks(5, 8), 2).niveau).toBe(1);
  });
  it('gaat omlaag onder 60%', () => {
    expect(verwerkSessie({ niveau: 1, recent: [] }, reeks(4, 8), 2).niveau).toBe(0);
  });
  it('blijft binnen de grenzen', () => {
    expect(verwerkSessie({ niveau: 2, recent: [] }, reeks(8, 8), 2).niveau).toBe(2);
    expect(verwerkSessie({ niveau: 0, recent: [] }, reeks(0, 8), 2).niveau).toBe(0);
  });
  it('verandert niets bij te weinig opgaven', () => {
    expect(verwerkSessie({ niveau: 1, recent: [] }, reeks(3, 3), 2).niveau).toBe(1);
  });
  it('onthoudt maximaal 20 antwoorden', () => {
    const v = verwerkSessie({ niveau: 0, recent: reeks(15, 15) }, reeks(0, 10), 2);
    expect(v.recent).toHaveLength(20);
    expect(percentage(v)).toBe(50);
  });
});

describe('audio-sleutels', () => {
  it('zijn stabiel en hangen af van tekst, soort en stem', () => {
    expect(cyrb53('hallo')).toBe(cyrb53('hallo'));
    expect(audioSleutel('maan', 'woord', 'x')).toBe(audioSleutel('  maan ', 'woord', 'x'));
    expect(audioSleutel('maan', 'woord', 'x')).not.toBe(audioSleutel('maan', 'zin', 'x'));
    expect(audioSleutel('maan', 'woord', 'x')).not.toBe(audioSleutel('maan', 'woord', 'y'));
  });
});
