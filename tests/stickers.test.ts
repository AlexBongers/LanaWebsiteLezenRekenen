import { describe, expect, it } from 'vitest';
import { STICKERS, STICKER_SETS, kiesStickers, stickerBeloning } from '../src/engine/stickers';

describe('stickers', () => {
  it('hebben unieke ids en horen bij een bestaand set', () => {
    const ids = new Set(STICKERS.map((s) => s.id));
    expect(ids.size).toBe(STICKERS.length);
    for (const s of STICKERS) expect(STICKER_SETS.some((x) => x.id === s.set)).toBe(true);
  });

  it('geeft alleen stickers die ze nog niet heeft, en nooit een baas-sticker zomaar', () => {
    const bezit = STICKERS.filter((s) => !s.baasStad).slice(0, 40).map((s) => s.id);
    for (let i = 0; i < 50; i++) {
      for (const id of kiesStickers(bezit, 2)) {
        expect(bezit).not.toContain(id);
        expect(id.startsWith('baas-')).toBe(false);
      }
    }
  });

  it('twee stickers bij drie sterren, de baas-sticker erbij na het wegzingen', () => {
    expect(stickerBeloning([], { sterren: 2 })).toHaveLength(1);
    expect(stickerBeloning([], { sterren: 3 })).toHaveLength(2);
    const r = stickerBeloning([], { sterren: 1, baasStad: 'tokio' });
    expect(r[0]).toBe('baas-tokio');
    expect(stickerBeloning(['baas-tokio'], { sterren: 1, baasStad: 'tokio' })).not.toContain('baas-tokio');
  });

  it('geeft niets meer als alles verzameld is', () => {
    const alles = STICKERS.filter((s) => !s.baasStad).map((s) => s.id);
    expect(kiesStickers(alles, 2)).toEqual([]);
  });
});
