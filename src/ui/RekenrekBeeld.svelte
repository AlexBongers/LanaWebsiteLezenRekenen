<script lang="ts">
  /**
   * Een rekenrek zoals op school: twee rijen van tien kralen, per rij vijf rood en vijf wit.
   * Kralen die "meetellen" staan links. Wat erbij komt licht goud op; wat eraf gaat schuift weg en vervaagt.
   */
  let {
    basis,
    erbij = 0,
    eraf = 0,
  }: {
    /** Hoeveel kralen er vanaf het begin staan. */
    basis: number;
    /** Kralen die er (al) bij gekomen zijn (goud). */
    erbij?: number;
    /** Kralen die er (al) af gegaan zijn. */
    eraf?: number;
  } = $props();

  const KRAAL = 34;
  const x = (i: number, actief: boolean) => 40 + i * KRAAL + (i >= 5 ? 12 : 0) + (actief ? 0 : 230);

  type Kraal = { k: number; rij: number; i: number; actief: boolean; goud: boolean; weg: boolean };
  let kralen = $derived(
    Array.from({ length: 20 }, (_, k): Kraal => {
      const rij = Math.floor(k / 10);
      const i = k % 10;
      const totaal = basis + erbij;
      const weg = k >= basis - eraf && k < basis && eraf > 0;
      return { k, rij, i, actief: k < totaal && !weg, goud: k >= basis && k < totaal, weg };
    }),
  );
</script>

<svg viewBox="0 0 620 172" class="rek" role="img" aria-label="Rekenrek met {basis + erbij - eraf} kralen">
  <defs>
    <radialGradient id="rek-rood" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fecaca" /><stop offset="0.5" stop-color="#ef4444" /><stop offset="1" stop-color="#991b1b" /></radialGradient>
    <radialGradient id="rek-wit" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff" /><stop offset="0.6" stop-color="#e5e7eb" /><stop offset="1" stop-color="#9ca3af" /></radialGradient>
    <radialGradient id="rek-goud" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff7c2" /><stop offset="0.5" stop-color="#fbbf24" /><stop offset="1" stop-color="#b45309" /></radialGradient>
  </defs>
  <!-- Frame -->
  <rect x="8" y="16" width="604" height="150" rx="18" fill="rgba(0, 0, 0, 0.35)" />
  <rect x="8" y="10" width="604" height="150" rx="18" fill="#7c2d12" />
  <rect x="18" y="20" width="584" height="130" rx="12" fill="#fef3c7" />
  {#each [0, 1] as rij}
    <line x1="22" x2="598" y1={58 + rij * 56} y2={58 + rij * 56} stroke="#78350f" stroke-width="4" />
  {/each}
  {#each kralen as kr (kr.k)}
    <circle
      class="kraal"
      class:goud={kr.goud}
      class:weg={kr.weg}
      cx="0"
      cy={58 + kr.rij * 56}
      r="15"
      style="transform: translateX({x(kr.i, kr.actief)}px)"
      fill={kr.goud ? 'url(#rek-goud)' : kr.i < 5 ? 'url(#rek-rood)' : 'url(#rek-wit)'}
      stroke="#1f2937"
      stroke-width="1.5"
    />
  {/each}
</svg>

<style>
  .rek {
    width: 100%;
    height: auto;
  }
  .kraal {
    transition: transform 0.55s cubic-bezier(0.3, 1.4, 0.5, 1), opacity 0.4s;
  }
  .kraal.goud {
    stroke: #fff7c2;
    stroke-width: 3;
  }
  .kraal.weg {
    opacity: 0.35;
  }
</style>
