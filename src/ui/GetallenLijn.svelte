<script lang="ts">
  /** Getallenlijn met sprongen, zoals op school: 47 → 50 → 55. */
  import type { Sprong } from '../engine/generator-rekenen';

  let { sprongen }: { sprongen: Sprong[] } = $props();

  const B = 760; // breedte in svg-eenheden
  const H = 150;
  const MARGE = 30;

  let punten = $derived(sprongen.flatMap((s) => [s.van, s.naar]));
  let laag = $derived(Math.max(0, Math.floor((Math.min(...punten) - 2) / 5) * 5));
  let hoog = $derived(Math.ceil((Math.max(...punten) + 2) / 5) * 5);
  let x = $derived((n: number) => MARGE + ((n - laag) / (hoog - laag)) * (B - 2 * MARGE));
  let stap = $derived(hoog - laag > 40 ? 5 : 1);
  let streepjes = $derived(Array.from({ length: Math.floor((hoog - laag) / stap) + 1 }, (_, i) => laag + i * stap));
  // Tientallen en randen krijgen een label, behalve als ze te dicht bij een sprongpunt liggen.
  let labels = $derived.by(() => {
    const ruimte = (hoog - laag) / 22;
    const extra = [laag, hoog, ...streepjes.filter((n) => n % 10 === 0)].filter(
      (n) => !punten.some((p) => p !== n && Math.abs(p - n) < ruimte),
    );
    return new Set([...punten, ...extra]);
  });
</script>

<svg viewBox="0 0 {B} {H}" class="lijn" aria-label="Getallenlijn">
  <line x1={MARGE - 10} y1="110" x2={B - MARGE + 10} y2="110" stroke="#fde68a" stroke-width="4" stroke-linecap="round" />
  {#each streepjes as n}
    <line
      x1={x(n)}
      x2={x(n)}
      y1={n % 10 === 0 ? 98 : n % 5 === 0 ? 102 : 105}
      y2={n % 10 === 0 ? 122 : n % 5 === 0 ? 118 : 115}
      stroke="#fde68a"
      stroke-width={n % 10 === 0 ? 4 : 2}
    />
  {/each}
  {#each [...labels] as n}
    <text
      x={x(n)}
      y="145"
      text-anchor="middle"
      font-size={punten.includes(n) ? 24 : 18}
      font-weight={punten.includes(n) ? 700 : 500}
      fill={punten.includes(n) ? '#fff' : '#c4b5fd'}>{n}</text
    >
  {/each}
  {#each sprongen as s, i}
    {@const x1 = x(s.van)}
    {@const x2 = x(s.naar)}
    {@const hoogte = Math.min(80, 30 + Math.abs(x2 - x1) * 0.25)}
    <g class="sprong" style="animation-delay:{i * 0.7}s">
      <path
        d="M{x1} 104 Q{(x1 + x2) / 2} {104 - hoogte * 1.6} {x2} 104"
        fill="none"
        stroke={i % 2 ? '#22d3ee' : '#f472b6'}
        stroke-width="5"
        stroke-linecap="round"
        pathLength="1"
      />
      <circle cx={x2} cy="104" r="7" fill={i % 2 ? '#22d3ee' : '#f472b6'} />
      <text x={(x1 + x2) / 2} y={104 - hoogte * 0.8 - 6} text-anchor="middle" font-size="24" font-weight="700" fill="#fff">
        {s.naar > s.van ? '+' : '−'}{Math.abs(s.naar - s.van)}
      </text>
    </g>
  {/each}
</svg>

<style>
  .lijn {
    width: 100%;
    max-width: 760px;
    font-family: var(--font-titel);
    overflow: visible;
  }
  .sprong {
    opacity: 0;
    animation: verschijn 0.6s ease-out forwards;
  }
  .sprong path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: teken 0.6s ease-out forwards;
    animation-delay: inherit;
  }
  @keyframes verschijn {
    to { opacity: 1; }
  }
  @keyframes teken {
    to { stroke-dashoffset: 0; }
  }
</style>
