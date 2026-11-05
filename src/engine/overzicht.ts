/**
 * Gegevens voor het overzicht in de ouderhoek: welke soorten sommen gaan
 * goed of zijn lastig, en welke woorden verwisselt Lana vaak.
 */
import { somSoort } from './generator-rekenen';
import type { Resultaat } from './sessie';

export type Telling = { goed: number; totaal: number };
export type Stats = { sommen: Record<string, Telling>; verwisselingen: Record<string, number> };

export function werkStatsBij(stats: Stats, resultaten: Resultaat[]): Stats {
  const sommen = { ...stats.sommen };
  const verwisselingen = { ...stats.verwisselingen };
  for (const r of resultaten) {
    const som = /^som\.(\d+)([+-])(\d+)$/.exec(r.id);
    if (som) {
      const soort = somSoort(Number(som[1]), som[2] as '+' | '-', Number(som[3]));
      const t = sommen[soort] ?? { goed: 0, totaal: 0 };
      sommen[soort] = { goed: t.goed + (r.goed ? 1 : 0), totaal: t.totaal + 1 };
    }
    if (r.id.startsWith('woord.') && !r.goed && r.gekozen) {
      const k = `${r.id.slice(6)}→${r.gekozen}`;
      verwisselingen[k] = (verwisselingen[k] ?? 0) + 1;
    }
  }
  return { sommen, verwisselingen };
}

/** Soorten sommen met minstens `min` pogingen, de lastigste eerst. */
export function lastigsteSommen(stats: Stats, min = 3): { soort: string; pct: number; totaal: number }[] {
  return Object.entries(stats.sommen)
    .filter(([, t]) => t.totaal >= min)
    .map(([soort, t]) => ({ soort, pct: Math.round((t.goed / t.totaal) * 100), totaal: t.totaal }))
    .sort((a, b) => a.pct - b.pct);
}

export function vaakVerwisseld(stats: Stats, aantal = 6): { woord: string; gekozen: string; keer: number }[] {
  return Object.entries(stats.verwisselingen)
    .map(([k, keer]) => {
      const [woord, gekozen] = k.split('→');
      return { woord, gekozen, keer };
    })
    .sort((a, b) => b.keer - a.keer)
    .slice(0, aantal);
}
