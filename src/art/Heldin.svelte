<script lang="ts">
  /**
   * De drie heldinnen, getekend in K-pop/anime-stijl met hun herkenbare kenmerken:
   *  Rumi: lange donkerpaarse vlecht, zwart-gouden outfit, zwaard
   *  Mira: lang golvend roze haar, rode jas, lange staf met kling (de langste)
   *  Zoey: zwart haar met pony en twee hoge staartjes, sportieve outfit, gloeiende messen (de jongste)
   * Eigen tekeningen, geen officiële afbeeldingen.
   * stemming: 'rust' (zacht wiegen), 'dans', 'juich' (springen), 'denk' (hoofd schuin)
   */
  import type { HeldinId } from '../store/voortgang.svelte';

  let {
    wie,
    stemming = 'rust',
    hoogte = 320,
  }: { wie: HeldinId; stemming?: 'rust' | 'dans' | 'juich' | 'denk'; hoogte?: number } = $props();

  const STIJL = {
    rumi: {
      haar: '#4c1d95', haarLicht: '#a78bfa', haarDonker: '#1e0b4b',
      iris: '#a78bfa', irisDonker: '#5b21b6',
      gloed: '#c4b5fd', schaal: 1,
    },
    mira: {
      haar: '#e11d74', haarLicht: '#fda4af', haarDonker: '#831843',
      iris: '#d97706', irisDonker: '#7c2d12',
      gloed: '#fbcfe8', schaal: 1.05,
    },
    zoey: {
      haar: '#18181b', haarLicht: '#60a5fa', haarDonker: '#000000',
      iris: '#92400e', irisDonker: '#451a03',
      gloed: '#a5f3fc', schaal: 0.94,
    },
  } as const;

  let s = $derived(STIJL[wie]);
  const id = `h${Math.random().toString(36).slice(2, 8)}`;
  const HUID = '#fde4d3';
  const HUID_SCHADUW = '#f0bfa0';
</script>

<svg
  class="heldin {stemming}"
  viewBox="-20 -50 240 440"
  style="height:{hoogte * s.schaal}px"
  role="img"
  aria-label={wie}
>
  <defs>
    <linearGradient id="{id}-haar" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color={s.haarLicht} />
      <stop offset="0.3" stop-color={s.haar} />
      <stop offset="1" stop-color={s.haarDonker} />
    </linearGradient>
    <linearGradient id="{id}-haarglans" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0" />
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.55" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="{id}-iris" cx="0.5" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#fff" stop-opacity="0.3" />
      <stop offset="0.35" stop-color={s.iris} />
      <stop offset="1" stop-color={s.irisDonker} />
    </radialGradient>
    <linearGradient id="{id}-kling" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" />
      <stop offset="0.5" stop-color={s.gloed} />
      <stop offset="1" stop-color="#ffffff" />
    </linearGradient>
    <linearGradient id="{id}-goud" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7c2" />
      <stop offset="0.5" stop-color="#fbbf24" />
      <stop offset="1" stop-color="#b45309" />
    </linearGradient>
    <filter id="{id}-gloed" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  <ellipse cx="100" cy="378" rx="46" ry="7" fill="#000" opacity="0.3" />

  <g class="lijf">
    <!-- ============ ACHTERHAAR ============ -->
    {#if wie === 'rumi'}
      <!-- de lange vlecht, zwaaiend naast het lichaam -->
      <g class="vlecht">
        {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as i}
          <ellipse
            cx={66 - i * 1.6 + (i % 2 ? 4 : -4)}
            cy={122 + i * 21}
            rx={11 - i * 0.45}
            ry="13"
            transform="rotate({i % 2 ? 28 : -28} {66 - i * 1.6 + (i % 2 ? 4 : -4)} {122 + i * 21})"
            fill="url(#{id}-haar)"
            stroke={s.haarDonker}
            stroke-width="1.2"
          />
        {/each}
        <rect x="45" y="330" width="12" height="7" rx="2" fill="url(#{id}-goud)" />
        <path d="M47 337 q-3 14 -6 22 M51 337 q0 14 0 24 M55 337 q3 14 6 22" stroke={s.haar} stroke-width="3.5" stroke-linecap="round" fill="none" />
      </g>
    {/if}
    <g transform="translate(100 104) scale(1.22) translate(-100 -104)">
    {#if wie === 'rumi'}
      <path d="M64 64 C58 18 142 18 136 64 L138 118 C122 128 78 128 62 118 Z" fill="url(#{id}-haar)" />
    {:else if wie === 'mira'}
      <path
        d="M62 62 C52 10 148 10 138 62 C150 104 156 150 146 206 C140 196 134 204 128 214 C124 200 116 206 110 214 L90 214 C84 206 76 200 72 214 C66 204 60 196 54 206 C44 150 50 104 62 62 Z"
        fill="url(#{id}-haar)"
      />
      <path d="M140 90 C150 130 148 170 142 196" stroke={s.haarLicht} stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round" />
      <path d="M60 90 C50 130 52 170 58 196" stroke={s.haarLicht} stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round" />
    {:else}
      <!-- Zoey: twee hoge staartjes -->
      <g class="staart staart-l">
        <path d="M70 36 C40 30 30 70 36 110 C38 130 30 150 24 160 C40 152 48 136 50 120 C54 100 52 80 66 54 Z" fill="url(#{id}-haar)" />
        <path d="M58 46 C44 60 42 90 40 120" stroke={s.haarLicht} stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round" />
      </g>
      <g class="staart staart-r">
        <path d="M130 36 C160 30 170 70 164 110 C162 130 170 150 176 160 C160 152 152 136 150 120 C146 100 148 80 134 54 Z" fill="url(#{id}-haar)" />
        <path d="M142 46 C156 60 158 90 160 120" stroke={s.haarLicht} stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round" />
      </g>
      <path d="M66 62 C60 22 140 22 134 62 L136 104 C122 112 78 112 64 104 Z" fill="url(#{id}-haar)" />
    {/if}

    </g>

    <!-- ============ BENEN ============ -->
    {#if wie === 'rumi'}
      <path d="M80 200 L120 200 L124 352 L106 352 L101 222 L99 222 L94 352 L76 352 Z" fill="#111827" />
      <path d="M104 222 L106 352 M96 222 L94 352" stroke="#374151" stroke-width="1.5" />
      <!-- laarzen -->
      <path d="M74 318 h21 v42 q0 8 -8 8 h-20 q-6 0 -4 -8 l11 -6 z" fill="#0b0b14" />
      <path d="M105 318 h21 v36 l11 6 q2 8 -4 8 h-20 q-8 0 -8 -8 z" fill="#0b0b14" />
      <path d="M74 322 h21 M105 322 h21" stroke="url(#{id}-goud)" stroke-width="3" />
    {:else if wie === 'mira'}
      <!-- wijde cargobroek -->
      <path d="M78 196 L122 196 L130 350 L104 350 L101 226 L99 226 L96 350 L70 350 Z" fill="#27272a" />
      <rect x="72" y="262" width="14" height="18" rx="2" fill="#3f3f46" />
      <rect x="114" y="262" width="14" height="18" rx="2" fill="#3f3f46" />
      <path d="M80 206 Q96 230 112 210" stroke="#d4d4d8" stroke-width="2" fill="none" stroke-dasharray="3 2" />
      <!-- stoere boots -->
      <path d="M68 340 h30 v20 q0 8 -8 8 h-24 q-6 0 -4 -10 z" fill="#18181b" />
      <path d="M102 340 h30 l2 18 q2 10 -4 10 h-24 q-6 0 -6 -8 z" fill="#18181b" />
      <path d="M66 362 h32 M102 362 h32" stroke="#52525b" stroke-width="4" />
    {:else}
      <!-- benen met kniekousen -->
      <rect x="82" y="200" width="15" height="150" rx="7" fill={HUID} />
      <rect x="103" y="200" width="15" height="150" rx="7" fill={HUID} />
      <rect x="81" y="272" width="17" height="80" rx="6" fill="#f8fafc" />
      <rect x="102" y="272" width="17" height="80" rx="6" fill="#f8fafc" />
      <path d="M81 280 h17 M102 280 h17" stroke="#22d3ee" stroke-width="3" />
      <!-- sneakers -->
      <path d="M76 346 h24 v12 q0 8 -8 8 h-18 q-6 0 -5 -8 z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M100 346 h24 l3 12 q1 8 -5 8 h-18 q-8 0 -8 -8 z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M74 362 h26 M100 362 h28" stroke="#22d3ee" stroke-width="3" />
      <!-- shortje -->
      <path d="M78 178 L122 178 L126 214 L102 214 L100 202 L98 214 L74 214 Z" fill="#1e293b" />
      <rect x="78" y="176" width="44" height="7" rx="2" fill="#22d3ee" />
    {/if}

    <!-- ============ LIJF / OUTFIT ============ -->
    {#if wie === 'rumi'}
      <path d="M80 120 Q100 114 120 120 L120 198 Q100 202 80 198 Z" fill="#f8fafc" />
      <path d="M90 124 L100 150 L110 124" stroke="url(#{id}-goud)" stroke-width="2" fill="none" />
      <!-- kort zwart jasje met goud -->
      <path d="M72 120 L92 116 L90 172 L74 170 Q70 140 72 120 Z" fill="#111827" />
      <path d="M128 120 L108 116 L110 172 L126 170 Q130 140 128 120 Z" fill="#111827" />
      <path d="M92 116 L90 172 M108 116 L110 172" stroke="url(#{id}-goud)" stroke-width="3" />
      <path d="M74 170 L90 172 M110 172 L126 170" stroke="url(#{id}-goud)" stroke-width="3" />
      <rect x="78" y="194" width="44" height="8" rx="3" fill="url(#{id}-goud)" />
      <circle cx="100" cy="198" r="5" fill="#111827" stroke="url(#{id}-goud)" stroke-width="2" />
    {:else if wie === 'mira'}
      <path d="M80 120 Q100 114 120 120 L118 200 Q100 204 82 200 Z" fill="#18181b" />
      <path d="M86 140 h28 M86 150 h28" stroke="#3f3f46" stroke-width="1.5" />
      <!-- rode jas, losjes open -->
      <path d="M70 118 L90 114 L86 214 L66 210 Q62 160 70 118 Z" fill="#dc2626" />
      <path d="M130 118 L110 114 L114 214 L134 210 Q138 160 130 118 Z" fill="#dc2626" />
      <path d="M90 114 L84 150 L74 122 Z M110 114 L116 150 L126 122 Z" fill="#991b1b" />
      <path d="M86 214 L66 210 M114 214 L134 210" stroke="#7f1d1d" stroke-width="3" />
      <circle cx="100" cy="128" r="4" fill="url(#{id}-goud)" />
      <path d="M93 118 Q100 134 107 118" stroke="url(#{id}-goud)" stroke-width="1.5" fill="none" />
    {:else}
      <!-- sportief cropjasje -->
      <path d="M78 120 Q100 114 122 120 L122 180 Q100 184 78 180 Z" fill="#f8fafc" />
      <path d="M74 120 L94 116 L92 166 L76 164 Q72 140 74 120 Z" fill="#38bdf8" />
      <path d="M126 120 L106 116 L108 166 L124 164 Q128 140 126 120 Z" fill="#38bdf8" />
      <path d="M78 124 L80 162 M122 124 L120 162" stroke="#fff" stroke-width="3" />
      <path d="M94 116 L92 166 M106 116 L108 166" stroke="#0369a1" stroke-width="2" />
      <text x="100" y="158" text-anchor="middle" font-size="14" font-weight="700" fill="#0ea5e9" font-family="Fredoka, sans-serif">Z</text>
    {/if}

    <!-- ============ LINKERARM ============ -->
    <g class="arm-links">
      {#if wie === 'zoey'}
        <!-- zwaait / vredesteken -->
        <path d="M78 126 Q58 116 60 92" stroke="#38bdf8" stroke-width="13" stroke-linecap="round" fill="none" />
        <circle cx="60" cy="86" r="7" fill={HUID} />
        <path d="M57 82 l-3 -12 M62 81 l2 -12" stroke={HUID} stroke-width="4" stroke-linecap="round" />
      {:else if wie === 'mira'}
        <!-- hand in de zij -->
        <path d="M74 124 Q56 150 70 178" stroke="#dc2626" stroke-width="14" stroke-linecap="round" fill="none" />
        <circle cx="74" cy="182" r="7" fill={HUID} />
      {:else}
        <path d="M76 124 Q64 158 66 192" stroke="#111827" stroke-width="13" stroke-linecap="round" fill="none" />
        <path d="M66 172 l0 18" stroke={HUID} stroke-width="10" stroke-linecap="round" />
        <circle cx="66" cy="198" r="7" fill={HUID} />
      {/if}
    </g>

    <!-- ============ NEK EN HOOFD ============ -->
    <path d="M93 96 L93 120 Q100 124 107 120 L107 96 Z" fill={HUID} />
    <path d="M93 104 Q100 112 107 104 L107 98 L93 98 Z" fill={HUID_SCHADUW} />

    <g transform="translate(100 104) scale(1.22) translate(-100 -104)">
    <g class="hoofd">
      <path d="M71 60 C71 32 129 32 129 60 C129 84 116 100 100 104 C84 100 71 84 71 60 Z" fill={HUID} />
      <!-- ogen -->
      <g class="ogen">
        {#each [{ x: 87, kant: -1 }, { x: 113, kant: 1 }] as o}
          {@const x = o.x}
          <path d="M{x - 9} 73 Q{x} 62 {x + 9} 71 Q{x + 1} 81 {x - 9} 73 Z" fill="#fff" />
          <ellipse cx={x} cy="72.5" rx="5.2" ry="6.6" fill="url(#{id}-iris)" />
          <ellipse cx={x} cy="73" rx="2.4" ry="3.4" fill="#1a0b2e" />
          <circle cx={x - 1.8} cy="69.8" r="1.9" fill="#fff" />
          <circle cx={x + 2} cy="76" r="0.9" fill="#fff" />
          {#if wie === 'mira'}
            <!-- iets half dichte, coole ogen -->
            <path d="M{x - 10} 70 Q{x} 62 {x + 10} 69 L{x + 10} 64 L{x - 10} 64 Z" fill={HUID} />
            <path d="M{x - 10} 71 Q{x} 65 {x + 10} 69.5" stroke="#1a0b2e" stroke-width="2.8" fill="none" stroke-linecap="round" />
          {:else}
            <path d="M{x - 10} 72 Q{x} 61 {x + 10} 70" stroke="#1a0b2e" stroke-width="2.8" fill="none" stroke-linecap="round" />
          {/if}
          <path d="M{x + o.kant * 10} {o.kant < 0 ? 72 : 70} l{o.kant * 3.5} -3" stroke="#1a0b2e" stroke-width="1.4" stroke-linecap="round" />
        {/each}
      </g>
      <!-- wenkbrauwen -->
      <path d="M79 57 q8 -4 15 -1" stroke={s.haarDonker} stroke-width="2" fill="none" stroke-linecap="round" />
      <path d="M106 56 q7 -3 15 1" stroke={s.haarDonker} stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- neus -->
      <path d="M100 81 q1.6 3 -0.8 4.2" stroke="#d89b7c" stroke-width="1.4" fill="none" stroke-linecap="round" />
      <!-- blosjes -->
      <ellipse cx="81" cy="84" rx="6" ry="3" fill="#fb7185" opacity="0.35" />
      <ellipse cx="119" cy="84" rx="6" ry="3" fill="#fb7185" opacity="0.35" />
      <!-- mond -->
      {#if stemming === 'juich' || stemming === 'dans' || wie === 'zoey'}
        <path d="M93 90 Q100 99 107 90 Z" fill="#be123c" />
        <path d="M94 90.5 Q100 93 106 90.5" fill="#fff" />
      {:else if stemming === 'denk'}
        <ellipse cx="101" cy="92" rx="2.6" ry="3" fill="#be123c" />
      {:else if wie === 'mira'}
        <path d="M95 92 Q101 94 106 90" stroke="#be123c" stroke-width="2.2" fill="none" stroke-linecap="round" />
      {:else}
        <path d="M94 91 Q100 95.5 106 91" stroke="#be123c" stroke-width="2.4" fill="none" stroke-linecap="round" />
      {/if}


      <!-- ============ VOORHAAR ============ -->
      {#if wie === 'rumi'}
        <path d="M68 70 C60 24 140 22 132 66 C126 50 114 42 100 44 C92 54 80 60 68 70 Z" fill="url(#{id}-haar)" />
        <!-- lange lokken langs het gezicht -->
        <path d="M70 58 Q62 92 72 120 L78 118 Q72 92 76 62 Z" fill="url(#{id}-haar)" />
        <path d="M130 58 Q138 92 128 120 L122 118 Q128 92 124 62 Z" fill="url(#{id}-haar)" />
        <path d="M82 36 Q100 28 120 36" stroke="url(#{id}-haarglans)" stroke-width="4" fill="none" stroke-linecap="round" />
      {:else if wie === 'mira'}
        <path d="M66 74 C56 22 144 20 134 70 C128 52 118 40 104 38 C96 50 82 58 66 74 Z" fill="url(#{id}-haar)" />
        <path d="M66 60 Q54 100 64 132 Q70 120 70 104 Q72 84 76 64 Z" fill="url(#{id}-haar)" />
        <path d="M134 60 Q146 100 136 132 Q130 120 130 104 Q128 84 124 64 Z" fill="url(#{id}-haar)" />
        <path d="M80 34 Q100 24 122 34" stroke="url(#{id}-haarglans)" stroke-width="4" fill="none" stroke-linecap="round" />
      {:else}
        <!-- rechte pony -->
        <path d="M68 62 C60 22 140 22 132 62 L127 54 L120 58 L113 53 L106 57 L99 53 L92 57 L85 53 L78 58 L72 54 Z" fill="url(#{id}-haar)" />
        <path d="M68 60 Q64 84 70 100 L76 98 Q72 82 74 64 Z" fill="url(#{id}-haar)" />
        <path d="M132 60 Q136 84 130 100 L124 98 Q128 82 126 64 Z" fill="url(#{id}-haar)" />
        <path d="M82 34 Q100 26 118 34" stroke="url(#{id}-haarglans)" stroke-width="4" fill="none" stroke-linecap="round" />
        <!-- haarelastiekjes -->
        <circle cx="68" cy="42" r="5" fill="#22d3ee" />
        <circle cx="132" cy="42" r="5" fill="#22d3ee" />
      {/if}
      <!-- oorbellen -->
      <circle cx="71" cy="82" r="2.5" fill="url(#{id}-goud)" />
      <circle cx="129" cy="82" r="2.5" fill="url(#{id}-goud)" />
      <path d="M124 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff" class="glinster" />
    </g>
    </g>

    <!-- ============ RECHTERARM + WAPEN ============ -->
    <g class="arm-rechts">
      {#if wie === 'rumi'}
        <path d="M124 124 Q138 156 134 188" stroke="#111827" stroke-width="13" stroke-linecap="round" fill="none" />
        <path d="M134 170 l0 16" stroke={HUID} stroke-width="10" stroke-linecap="round" />
        <!-- zwaard -->
        <g filter="url(#{id}-gloed)">
          <path d="M138 198 L186 330 L180 334 L132 202 Z" fill="url(#{id}-kling)" />
        </g>
        <path d="M124 196 L146 188" stroke="url(#{id}-goud)" stroke-width="6" stroke-linecap="round" />
        <path d="M130 192 L124 176" stroke="#4c1d95" stroke-width="5" stroke-linecap="round" />
        <circle cx="134" cy="192" r="7" fill={HUID} />
      {:else if wie === 'mira'}
        <!-- lange staf met kling -->
        <rect x="143" y="-6" width="6" height="374" rx="3" fill="#3f3f46" />
        <rect x="143" y="140" width="6" height="60" rx="3" fill="#7f1d1d" />
        <g filter="url(#{id}-gloed)">
          <path d="M146 -4 C170 -20 178 -46 160 -48 C164 -30 152 -18 143 -10 Z" fill="url(#{id}-kling)" />
        </g>
        <rect x="139" y="-8" width="14" height="6" rx="2" fill="url(#{id}-goud)" />
        <path d="M126 124 Q144 150 144 172" stroke="#dc2626" stroke-width="14" stroke-linecap="round" fill="none" />
        <circle cx="146" cy="176" r="7.5" fill={HUID} />
      {:else}
        <path d="M122 126 Q142 150 140 176" stroke="#38bdf8" stroke-width="13" stroke-linecap="round" fill="none" />
        <!-- drie gloeiende messen in een waaier -->
        <g filter="url(#{id}-gloed)">
          {#each [-30, 0, 30] as hoek}
            <g transform="rotate({hoek} 142 182)">
              <path d="M142 182 L138 150 L142 138 L146 150 Z" fill="url(#{id}-kling)" />
            </g>
          {/each}
        </g>
        <circle cx="141" cy="182" r="7" fill={HUID} />
      {/if}
    </g>
  </g>
</svg>

<style>
  .heldin {
    overflow: visible;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.45));
  }
  .lijf {
    transform-origin: 100px 375px;
    transform-box: view-box;
  }
  .rust .lijf {
    animation: wieg 3.4s ease-in-out infinite;
  }
  .dans .lijf {
    animation: dans 0.9s ease-in-out infinite;
  }
  .juich .lijf {
    animation: spring 0.65s ease-in-out infinite;
  }
  .hoofd {
    transform-origin: 100px 104px;
    transform-box: view-box;
    transition: transform 0.4s;
  }
  .denk .hoofd {
    transform: rotate(-8deg);
  }
  .arm-links {
    transform-origin: 76px 124px;
    transform-box: view-box;
    transition: transform 0.3s;
  }
  .arm-rechts {
    transform-origin: 124px 124px;
    transform-box: view-box;
  }
  .juich .arm-rechts,
  .dans .arm-rechts {
    animation: zwaai 0.65s ease-in-out infinite alternate;
  }
  .juich .arm-links {
    animation: zwaai-links 0.65s ease-in-out infinite alternate;
  }
  .vlecht {
    transform-origin: 66px 118px;
    transform-box: view-box;
    animation: slinger 3.4s ease-in-out infinite;
  }
  .staart {
    transform-box: view-box;
    animation: slinger 1.8s ease-in-out infinite;
  }
  .staart-l { transform-origin: 66px 44px; }
  .staart-r { transform-origin: 134px 44px; animation-direction: reverse; }
  .glinster {
    transform-origin: 124px 47px;
    transform-box: view-box;
    animation: twinkel 1.8s ease-in-out infinite;
  }
  .ogen {
    transform-origin: 100px 72px;
    transform-box: view-box;
    animation: knipper 5s infinite;
  }
  @keyframes wieg {
    0%, 100% { transform: rotate(-1.2deg); }
    50% { transform: rotate(1.2deg) translateY(-3px); }
  }
  @keyframes dans {
    0%, 100% { transform: rotate(-4deg) translateY(0); }
    50% { transform: rotate(4deg) translateY(-12px); }
  }
  @keyframes spring {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-26px); }
  }
  @keyframes zwaai {
    from { transform: rotate(0deg); }
    to { transform: rotate(-20deg); }
  }
  @keyframes zwaai-links {
    from { transform: rotate(0deg); }
    to { transform: rotate(25deg); }
  }
  @keyframes slinger {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  @keyframes twinkel {
    0%, 100% { transform: scale(0.5); opacity: 0.4; }
    50% { transform: scale(1.3); opacity: 1; }
  }
  @keyframes knipper {
    0%, 95%, 100% { transform: scaleY(1); }
    97% { transform: scaleY(0.1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .lijf, .arm-rechts, .arm-links, .glinster, .ogen, .vlecht, .staart { animation: none !important; }
  }
</style>
