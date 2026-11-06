import { describe, expect, it } from 'vitest';
import { uitZak } from '../src/games/teksten';

describe('zakje trekken', () => {
  it('herhaalt pas als alles geweest is, en nooit twee keer achter elkaar', () => {
    const lijst = ['a', 'b', 'c', 'd', 'e'];
    const getrokken = Array.from({ length: 50 }, () => uitZak('test', lijst));
    for (let i = 0; i < 50; i += 5) expect(new Set(getrokken.slice(i, i + 5)).size).toBe(5);
    for (let i = 1; i < 50; i++) expect(getrokken[i]).not.toBe(getrokken[i - 1]);
  });
});
