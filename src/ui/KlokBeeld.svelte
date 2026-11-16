<script lang="ts">
  /**
   * Analoge klok zoals in de klas: korte (dikke) wijzer voor het uur, lange (roze) wijzer voor de minuten.
   * Met `uitleg` kleurt de rechterhelft ("over") en de linkerhelft ("voor") en staan de minuten erbij.
   */
  import type { KlokTijd } from '../engine/generator-lana';

  let {
    tijd,
    uitleg = false,
    minuten = false,
    klein = false,
  }: {
    tijd: KlokTijd;
    uitleg?: boolean;
    /** Minuten (5, 10, 15…) om de rand. */
    minuten?: boolean;
    /** Kleine klok (keuzeknop): alleen de streepjes bij de cijfers. */
    klein?: boolean;
  } = $props();

  const STREEPJES = Array.from({ length: 60 }, (_, i) => i);
  const UREN = Array.from({ length: 12 }, (_, i) => i + 1);
  let streepjes = $derived(klein ? STREEPJES.filter((m) => m % 5 === 0) : STREEPJES);

  let minHoek = $derived(tijd.min * 6);
  let uurHoek = $derived(((tijd.uur % 12) + tijd.min / 60) * 30);
  const punt = (deel: number, r: number) => ({ x: Math.sin(deel * Math.PI * 2) * r, y: -Math.cos(deel * Math.PI * 2) * r });
</script>

<svg viewBox="-128 -128 256 256" class="klok" role="img" aria-label="Analoge klok">
  <circle r="114" cy="7" fill="rgba(0, 0, 0, 0.3)" />
  <circle r="112" fill="#fdf2f8" stroke="#f472b6" stroke-width="10" />
  {#if uitleg}
    <path d="M0 0 L0 -106 A106 106 0 0 1 0 106 Z" fill="rgba(74, 222, 128, 0.28)" />
    <path d="M0 0 L0 106 A106 106 0 0 1 0 -106 Z" fill="rgba(96, 165, 250, 0.28)" />
    <text x="36" y="-24" text-anchor="middle" class="helft over">over</text>
    <text x="-36" y="-24" text-anchor="middle" class="helft voor">voor</text>
  {/if}
  {#each streepjes as m (m)}
    {@const a = punt(m / 60, 104)}
    {@const b = punt(m / 60, m % 5 === 0 ? 92 : 98)}
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#831843" stroke-width={m % 5 === 0 ? 3 : 1} stroke-linecap="round" />
  {/each}
  {#each UREN as u (u)}
    {@const p = punt(u / 12, 76)}
    <text x={p.x} y={p.y + 8} text-anchor="middle" class="cijfer">{u}</text>
    {#if minuten}
      {@const q = punt(u / 12, 121)}
      <text x={q.x} y={q.y + 4} text-anchor="middle" class="minuut">{u === 12 ? 0 : u * 5}</text>
    {/if}
  {/each}
  <g class="wijzer" style="transform: rotate({uurHoek}deg)">
    <line x1="0" y1="8" x2="0" y2="-50" stroke="#2e1065" stroke-width="10" stroke-linecap="round" />
  </g>
  <g class="wijzer" style="transform: rotate({minHoek}deg)">
    <line x1="0" y1="10" x2="0" y2="-88" stroke="#db2777" stroke-width="6" stroke-linecap="round" />
  </g>
  <circle r="8" fill="#fbbf24" stroke="#92400e" stroke-width="2" />
</svg>

<style>
  .klok {
    width: 100%;
    height: 100%;
  }
  .cijfer {
    font-family: var(--font-titel);
    font-size: 24px;
    font-weight: 700;
    fill: #2e1065;
  }
  .minuut {
    font-size: 11px;
    font-weight: 700;
    fill: #fde68a;
  }
  .helft {
    font-size: 15px;
    font-weight: 700;
  }
  .helft.over {
    fill: #15803d;
  }
  .helft.voor {
    fill: #1d4ed8;
  }
  .wijzer {
    transition: transform 0.6s cubic-bezier(0.3, 1.3, 0.5, 1);
  }
</style>
