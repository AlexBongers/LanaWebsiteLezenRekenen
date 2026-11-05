<script lang="ts">
  /** Een grappige, niet-enge demon. `soort` bepaalt kleur, hoorns en vleugeltjes. */
  let { soort = 0, grootte = 110 }: { soort?: number; grootte?: number } = $props();

  const KLEUREN = [
    ['#60a5fa', '#1d4ed8'],
    ['#a78bfa', '#5b21b6'],
    ['#34d399', '#047857'],
    ['#f472b6', '#9d174d'],
    ['#fb923c', '#c2410c'],
  ];
  let n = $derived(((soort % 60) + 60) % 60);
  let k = $derived(KLEUREN[n % KLEUREN.length]);
  let hoorns = $derived(n % 3);
  let vleugels = $derived(n % 4 === 3);
  let scheel = $derived(n % 2 === 1);
  const id = `d${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg viewBox="0 0 120 120" width={grootte} height={grootte} class="demon-svg" aria-hidden="true">
  <defs>
    <radialGradient id="{id}-lijf" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stop-color={k[0]} />
      <stop offset="1" stop-color={k[1]} />
    </radialGradient>
  </defs>
  <ellipse cx="60" cy="114" rx="34" ry="5" fill="#000" opacity="0.25" />

  <g class="lijfje">
    {#if vleugels}
      <g class="vleugel-l"><path d="M24 58 Q2 40 4 66 Q12 60 16 70 Q20 62 26 70 Z" fill={k[1]} stroke="#1e1b4b" stroke-width="2" /></g>
      <g class="vleugel-r"><path d="M96 58 Q118 40 116 66 Q108 60 104 70 Q100 62 94 70 Z" fill={k[1]} stroke="#1e1b4b" stroke-width="2" /></g>
    {/if}

    <!-- hoorns -->
    {#if hoorns === 0}
      <path d="M30 40 Q18 14 34 6 Q32 24 44 32 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" />
      <path d="M90 40 Q102 14 86 6 Q88 24 76 32 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" />
    {:else if hoorns === 1}
      <path d="M36 32 L40 18 L48 30 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" stroke-linejoin="round" />
      <path d="M84 32 L80 18 L72 30 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" stroke-linejoin="round" />
      <path d="M56 26 q4 -14 10 -2 q-2 -10 6 -6" stroke={k[1]} stroke-width="4" fill="none" stroke-linecap="round" />
    {:else}
      <path d="M50 28 Q58 -4 72 8 Q62 12 70 28 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" />
    {/if}

    <!-- lijf -->
    <path
      d="M60 24 C92 24 106 50 104 78 C103 96 98 108 88 110 C84 104 80 104 76 110 C72 104 66 104 60 110 C54 104 48 104 44 110 C40 104 36 104 32 110 C22 108 17 96 16 78 C14 50 28 24 60 24 Z"
      fill="url(#{id}-lijf)"
      stroke="#1e1b4b"
      stroke-width="2.5"
    />
    <ellipse cx="46" cy="44" rx="12" ry="7" fill="#fff" opacity="0.3" transform="rotate(-25 46 44)" />
    <!-- buikje -->
    <ellipse cx="60" cy="92" rx="18" ry="10" fill="#fff" opacity="0.15" />

    <!-- ogen -->
    <g class="ogen">
      <circle cx="44" cy="60" r={scheel ? 13 : 11} fill="#fff" stroke="#1e1b4b" stroke-width="2" />
      <circle cx="77" cy="60" r={scheel ? 9 : 11} fill="#fff" stroke="#1e1b4b" stroke-width="2" />
      <circle cx={scheel ? 48 : 46} cy="62" r="5" fill="#111827" class="pupil" />
      <circle cx={scheel ? 74 : 79} cy="62" r="5" fill="#111827" class="pupil" />
      <circle cx="44" cy="58" r="1.8" fill="#fff" />
      <circle cx="77" cy="58" r="1.8" fill="#fff" />
    </g>
    <!-- wangetjes -->
    <ellipse cx="32" cy="76" rx="6" ry="3.5" fill="#fda4af" opacity="0.55" />
    <ellipse cx="88" cy="76" rx="6" ry="3.5" fill="#fda4af" opacity="0.55" />
    <!-- mond met één tandje -->
    <path d="M42 82 Q60 98 78 82 Q60 90 42 82 Z" fill="#1f2937" />
    <path d="M55 86 l3 6 l3 -6 z" fill="#fff" />
    <!-- armpjes -->
    <path d="M18 76 Q6 70 8 58" stroke={k[1]} stroke-width="7" fill="none" stroke-linecap="round" />
    <path d="M102 76 Q114 70 112 58" stroke={k[1]} stroke-width="7" fill="none" stroke-linecap="round" />
  </g>
</svg>

<style>
  .demon-svg {
    overflow: visible;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
  .lijfje {
    transform-origin: 60px 112px;
    transform-box: view-box;
    animation: squish 1.6s ease-in-out infinite;
  }
  .ogen {
    transform-origin: 60px 60px;
    transform-box: view-box;
    animation: knipper 4.5s infinite;
  }
  .pupil {
    animation: kijk 4s ease-in-out infinite;
  }
  .vleugel-l,
  .vleugel-r {
    transform-box: view-box;
    animation: fladder 0.35s ease-in-out infinite alternate;
  }
  .vleugel-l { transform-origin: 26px 62px; }
  .vleugel-r { transform-origin: 94px 62px; animation-direction: alternate-reverse; }
  @keyframes squish {
    0%, 100% { transform: scale(1, 1); }
    50% { transform: scale(1.04, 0.95); }
  }
  @keyframes knipper {
    0%, 92%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }
  @keyframes kijk {
    0%, 40%, 100% { transform: translate(0, 0); }
    50%, 80% { transform: translate(-3px, 1px); }
  }
  @keyframes fladder {
    from { transform: rotate(-12deg); }
    to { transform: rotate(12deg); }
  }
</style>
