<script lang="ts">
  /** Een grappige, niet-enge demon. `soort` bepaalt kleur en vorm. */
  let { soort = 0, grootte = 110 }: { soort?: number; grootte?: number } = $props();

  const KLEUREN = [
    ['#60a5fa', '#1d4ed8'],
    ['#a78bfa', '#5b21b6'],
    ['#34d399', '#047857'],
    ['#f472b6', '#9d174d'],
  ];
  let k = $derived(KLEUREN[((soort % KLEUREN.length) + KLEUREN.length) % KLEUREN.length]);
  let scheel = $derived(soort % 2 === 1);
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
  <!-- hoorns -->
  <path d="M30 40 Q18 14 34 6 Q32 24 44 32 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" />
  <path d="M90 40 Q102 14 86 6 Q88 24 76 32 Z" fill="#fde68a" stroke="#b45309" stroke-width="2" />
  <!-- lijf -->
  <path
    d="M60 24 C92 24 106 50 104 78 C103 96 98 108 88 110 C84 104 80 104 76 110 C72 104 66 104 60 110 C54 104 48 104 44 110 C40 104 36 104 32 110 C22 108 17 96 16 78 C14 50 28 24 60 24 Z"
    fill="url(#{id}-lijf)"
  />
  <ellipse cx="46" cy="44" rx="12" ry="7" fill="#fff" opacity="0.25" transform="rotate(-25 46 44)" />
  <!-- ogen -->
  <circle cx="44" cy="60" r={scheel ? 13 : 11} fill="#fff" />
  <circle cx="77" cy="60" r={scheel ? 9 : 11} fill="#fff" />
  <circle cx={scheel ? 48 : 46} cy="62" r="5" fill="#111827" class="pupil" />
  <circle cx={scheel ? 74 : 79} cy="62" r="5" fill="#111827" class="pupil" />
  <circle cx="44" cy="58" r="1.8" fill="#fff" />
  <circle cx="77" cy="58" r="1.8" fill="#fff" />
  <!-- mond met één tandje -->
  <path d="M42 82 Q60 98 78 82 Q60 90 42 82 Z" fill="#1f2937" />
  <path d="M55 86 l3 6 l3 -6 z" fill="#fff" />
  <!-- armpjes -->
  <path d="M18 76 Q6 70 8 58" stroke={k[1]} stroke-width="7" fill="none" stroke-linecap="round" />
  <path d="M102 76 Q114 70 112 58" stroke={k[1]} stroke-width="7" fill="none" stroke-linecap="round" />
</svg>

<style>
  .demon-svg {
    overflow: visible;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
  .pupil {
    animation: kijk 4s ease-in-out infinite;
  }
  @keyframes kijk {
    0%, 40%, 100% { transform: translate(0, 0); }
    50%, 80% { transform: translate(-3px, 1px); }
  }
</style>
