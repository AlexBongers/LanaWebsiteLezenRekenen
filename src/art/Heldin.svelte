<script lang="ts">
  /**
   * De drie heldinnen, half-realistisch getekend (echte lichaamsverhoudingen,
   * zachte schaduw, gedetailleerde gezichten), met hun eigen kenmerken:
   *  Rumi: lange donkerpaarse vlecht, zwart jasje met goud, paarse microfoon
   *  Mira: lang roze haar in een hoge staart, rood jasje, roze microfoon (de langste)
   *  Zoey: zwart haar met rechte pony en twee staartjes, sportief, turquoise microfoon (de jongste)
   * Eigen tekeningen, geen officiële afbeeldingen.
   * stemming: 'rust' (zacht wiegen), 'dans', 'juich' (springen), 'denk' (hoofd schuin)
   */
  import type { HeldinId } from '../store/voortgang.svelte';

  let {
    wie,
    stemming = 'rust',
    hoogte = 320,
  }: { wie: HeldinId; stemming?: 'rust' | 'dans' | 'juich' | 'denk' | 'draai'; hoogte?: number } = $props();

  const STIJL = {
    rumi: {
      haar: '#5b2a9e', haarLicht: '#b79cf2', haarDonker: '#22093f',
      iris: '#8b6cf0', irisDonker: '#3b1d80',
      lip: '#c2416b', mic: '#8b5cf6', schaal: 1,
    },
    mira: {
      haar: '#e0306f', haarLicht: '#ffb3c7', haarDonker: '#7a0f38',
      iris: '#b45309', irisDonker: '#4a1c06',
      lip: '#d43d5c', mic: '#ec4899', schaal: 1.05,
    },
    zoey: {
      haar: '#23202b', haarLicht: '#6f7fa8', haarDonker: '#06050a',
      iris: '#7c3f12', irisDonker: '#2b1204',
      lip: '#e0567a', mic: '#14b8a6', schaal: 0.95,
    },
  } as const;

  let s = $derived(STIJL[wie]);
  const id = `h${Math.random().toString(36).slice(2, 8)}`;

  // ---------- Hulp: een vloeiend ledemaat (arm, been) als gevulde vorm ----------
  type P = [x: number, y: number, breedte: number];

  /** Catmull-Rom door de punten, als cubic Bézier. */
  function vloeiend(pts: [number, number][], begin = true): string {
    let d = begin ? `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}` : '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  function ledemaat(pts: P[]): string {
    const links: [number, number][] = [];
    const rechts: [number, number][] = [];
    pts.forEach(([x, y, w], i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l;
      const ny = dx / l;
      links.push([x + (nx * w) / 2, y + (ny * w) / 2]);
      rechts.push([x - (nx * w) / 2, y - (ny * w) / 2]);
    });
    const eind = pts[pts.length - 1][2] / 2;
    const terug = rechts.reverse();
    return `${vloeiend(links)} A${eind} ${eind} 0 0 1 ${terug[0][0].toFixed(1)} ${terug[0][1].toFixed(1)}${vloeiend(terug, false)} Z`;
  }

  /** Punt op een deel van het traject (voor mouwen die halverwege ophouden). */
  function tot(pts: P[], t: number): P[] {
    const n = (pts.length - 1) * t;
    const i = Math.floor(n);
    const f = n - i;
    if (i >= pts.length - 1) return pts;
    const a = pts[i];
    const b = pts[i + 1];
    return [...pts.slice(0, i + 1), [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]];
  }

  // ---------- Houding per heldin ----------
  const ARM_RECHTS: P[] = [[124, 90, 12.5], [145, 124, 9.5], [151, 92, 7.5]];
  const ARM_LINKS: Record<HeldinId, P[]> = {
    rumi: [[76, 90, 12.5], [69, 140, 9.5], [71, 184, 7.5]],
    mira: [[76, 90, 12.5], [60, 128, 9.5], [83, 154, 7.5]],
    zoey: [[76, 90, 12], [55, 64, 9], [61, 30, 7.5]],
  };
  const HAND_LINKS: Record<HeldinId, [number, number]> = { rumi: [71, 192], mira: [86, 156], zoey: [61, 22] };

  const BENEN: Record<HeldinId, { l: P[]; r: P[] }> = {
    rumi: { l: [[91, 176, 22], [89, 266, 15], [88, 346, 11]], r: [[109, 176, 22], [112, 266, 15], [114, 346, 11]] },
    mira: { l: [[91, 176, 22], [87, 268, 15], [84, 348, 11]], r: [[109, 176, 22], [113, 268, 15], [117, 348, 11]] },
    zoey: { l: [[91, 178, 21], [90, 266, 14], [90, 344, 10.5]], r: [[109, 178, 21], [112, 266, 14], [113, 344, 10.5]] },
  };
  /** Broekspijpen: wat wijder dan het been. */
  const wijder = (pts: P[], extra: number[]): P[] => pts.map(([x, y, w], i) => [x, y, w + extra[i]]);

  let armL = $derived(ARM_LINKS[wie]);
  let handL = $derived(HAND_LINKS[wie]);
  let benen = $derived(BENEN[wie]);
  let zingt = $derived(stemming === 'juich' || stemming === 'dans' || stemming === 'draai');

  const romp = 'M74 86 C69 104 78 132 86 150 C84 160 81 168 80 178 L120 178 C119 168 116 160 114 150 C122 132 131 104 126 86 C114 79 86 79 74 86 Z';

  const JAS = { rumi: '#16131f', mira: '#c8102e', zoey: '#22b8d8' } as const;
  const JAS_DONKER = { rumi: '#050409', mira: '#7d0a1d', zoey: '#0e7490' } as const;
</script>

<svg
  class="heldin {stemming}"
  viewBox="4 -30 192 410"
  style="height:{hoogte * s.schaal}px"
  role="img"
  aria-label={wie}
>
  <defs>
    <!-- huid: zacht licht van linksboven -->
    <radialGradient id="{id}-huid" cx="0.38" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#ffe9dc" />
      <stop offset="0.55" stop-color="#f7d0b8" />
      <stop offset="1" stop-color="#e3a98a" />
    </radialGradient>
    <linearGradient id="{id}-huidlid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9b597" />
      <stop offset="0.45" stop-color="#fbdcc8" />
      <stop offset="1" stop-color="#dba085" />
    </linearGradient>
    <linearGradient id="{id}-haar" x1="0.2" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color={s.haarLicht} />
      <stop offset="0.25" stop-color={s.haar} />
      <stop offset="1" stop-color={s.haarDonker} />
    </linearGradient>
    <linearGradient id="{id}-haarzij" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color={s.haarDonker} />
      <stop offset="0.45" stop-color={s.haar} />
      <stop offset="0.6" stop-color={s.haarLicht} stop-opacity="0.9" />
      <stop offset="1" stop-color={s.haarDonker} />
    </linearGradient>
    <linearGradient id="{id}-glans" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0" />
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.35" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="{id}-iris" cx="0.5" cy="0.38" r="0.65">
      <stop offset="0" stop-color={s.iris} stop-opacity="0.75" />
      <stop offset="0.55" stop-color={s.iris} />
      <stop offset="1" stop-color={s.irisDonker} />
    </radialGradient>
    <linearGradient id="{id}-stof" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.35" />
      <stop offset="0.35" stop-color="#000" stop-opacity="0" />
      <stop offset="0.7" stop-color="#fff" stop-opacity="0.12" />
      <stop offset="1" stop-color="#000" stop-opacity="0.3" />
    </linearGradient>
    <linearGradient id="{id}-goud" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff4c2" />
      <stop offset="0.5" stop-color="#f2b632" />
      <stop offset="1" stop-color="#a1620b" />
    </linearGradient>
    <radialGradient id="{id}-mickop" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#f4f4f5" />
      <stop offset="0.6" stop-color="#a1a1aa" />
      <stop offset="1" stop-color="#3f3f46" />
    </radialGradient>
    <linearGradient id="{id}-mic" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color={s.mic} />
      <stop offset="0.4" stop-color="#fff" stop-opacity="0.85" />
      <stop offset="1" stop-color={s.mic} />
    </linearGradient>
    <pattern id="{id}-gaas" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
      <path d="M0 0 L2.4 2.4 M2.4 0 L0 2.4" stroke="#52525b" stroke-width="0.35" />
    </pattern>
    <!-- zachte omlijning, minder tekenfilm dan een harde lijn -->
    <filter id="{id}-lijn" x="-15%" y="-15%" width="130%" height="130%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="dik" />
      <feFlood flood-color="#1a0b2e" flood-opacity="0.75" result="kleur" />
      <feComposite in="kleur" in2="dik" operator="in" result="rand" />
      <feMerge><feMergeNode in="rand" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="{id}-zacht" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.4" />
    </filter>
  </defs>

  <ellipse cx="100" cy="374" rx="44" ry="6" fill="#000" opacity="0.32" />

  <g filter="url(#{id}-lijn)">
  <g class="lijf">
    <!-- ============ ACHTERHAAR ============ -->
    {#if wie === 'rumi'}
      <!-- volume achter het hoofd -->
      <path transform="translate(100 58) scale(1.13) translate(-100 -58)" d="M74 30 C70 -8 130 -8 126 30 L128 70 C116 80 84 80 72 70 Z" fill="url(#{id}-haar)" />
      <!-- lange vlecht over de schouder naar achteren -->
      <g class="vlecht">
        <path d="M70 60 C62 120 66 200 60 300 L66 300 C72 200 80 120 82 60 Z" fill={s.haarDonker} />
        {#each Array.from({ length: 19 }, (_, i) => i) as i}
          {@const cx = 73 - i * 0.7 + (i % 2 ? 2.6 : -2.6)}
          {@const cy = 70 + i * 13}
          <ellipse {cx} {cy} rx={8.2 - i * 0.22} ry="9.5" transform="rotate({i % 2 ? 32 : -32} {cx} {cy})" fill="url(#{id}-haarzij)" />
          <path d="M{cx - 5} {cy - 4} q5 6 10 1" stroke={s.haarDonker} stroke-width="0.8" fill="none" opacity="0.6" />
        {/each}
        <rect x="55" y="300" width="10" height="6" rx="2" fill="url(#{id}-goud)" />
        <path d="M57 306 q-3 12 -6 20 M60 306 q0 12 0 22 M63 306 q3 12 6 20" stroke={s.haar} stroke-width="3" stroke-linecap="round" fill="none" />
      </g>
    {:else if wie === 'mira'}
      <!-- hoge staart: lang en golvend achter de rug -->
      <g class="staart staart-m">
        <path d="M102 -4 C140 -10 150 20 142 70 C136 120 150 170 140 236 C132 218 124 226 118 240 C116 200 120 150 116 100 C112 60 110 20 100 -12 Z" fill="url(#{id}-haarzij)" />
        <path d="M124 10 C138 50 128 110 136 180 M118 30 C126 80 120 140 126 200" stroke={s.haarLicht} stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round" />
        <path d="M132 40 C140 90 134 150 138 214" stroke={s.haarDonker} stroke-width="1.4" fill="none" opacity="0.5" stroke-linecap="round" />
      </g>
      <path transform="translate(100 58) scale(1.13) translate(-100 -58)" d="M74 30 C70 -8 130 -8 126 30 L127 66 C116 74 84 74 73 66 Z" fill="url(#{id}-haar)" />
      <ellipse transform="translate(100 58) scale(1.13) translate(-100 -58)" cx="104" cy="5" rx="5" ry="3" fill="url(#{id}-goud)" />
    {:else}
      <!-- Zoey: twee staartjes -->
      <g transform="translate(100 58) scale(1.13) translate(-100 -58)"><g class="staart staart-l">
        <path d="M78 6 C56 -2 44 30 48 64 C50 84 44 100 38 110 C52 104 60 90 62 74 C64 52 64 34 76 18 Z" fill="url(#{id}-haarzij)" />
        <path d="M66 16 C56 32 54 56 52 84" stroke={s.haarLicht} stroke-width="1.6" fill="none" opacity="0.6" stroke-linecap="round" />
      </g>
      <g class="staart staart-r">
        <path d="M122 6 C144 -2 156 30 152 64 C150 84 156 100 162 110 C148 104 140 90 138 74 C136 52 136 34 124 18 Z" fill="url(#{id}-haarzij)" />
        <path d="M134 16 C144 32 146 56 148 84" stroke={s.haarLicht} stroke-width="1.6" fill="none" opacity="0.6" stroke-linecap="round" />
      </g></g>
      <path transform="translate(100 58) scale(1.13) translate(-100 -58)" d="M75 30 C71 -6 129 -6 125 30 L126 62 C116 70 84 70 74 62 Z" fill="url(#{id}-haar)" />
    {/if}

    <!-- ============ BENEN ============ -->
    {#if wie === 'zoey'}
      <path d={ledemaat(benen.l)} fill="url(#{id}-huidlid)" />
      <path d={ledemaat(benen.r)} fill="url(#{id}-huidlid)" />
      <!-- kniekousen -->
      <path d={ledemaat(benen.l.slice(1).map(([x, y, w], i) => [x, i === 0 ? y + 18 : y, w + 1.6]))} fill="#f5f7fb" />
      <path d={ledemaat(benen.r.slice(1).map(([x, y, w], i) => [x, i === 0 ? y + 18 : y, w + 1.6]))} fill="#f5f7fb" />
      <path d="M83 290 h15 M105 290 h15" stroke="#22b8d8" stroke-width="2.5" />
      <path d="M83 295 h15 M105 295 h15" stroke="#e0306f" stroke-width="1.5" />
      <!-- sneakers -->
      <path d="M78 340 q12 -4 22 0 l2 16 q1 8 -7 8 h-17 q-7 0 -5 -8 z" fill="#ffffff" />
      <path d="M102 340 q12 -4 22 0 l3 16 q1 8 -7 8 h-16 q-8 0 -6 -8 z" fill="#ffffff" />
      <path d="M76 358 h26 M101 358 h27" stroke="#22b8d8" stroke-width="3.5" />
      <path d="M84 346 l10 -2 M108 346 l10 -2" stroke="#94a3b8" stroke-width="1.2" />
      <!-- shortje -->
      <path d="M79 168 L121 168 L125 206 Q112 210 103 204 L100 192 L97 204 Q88 210 75 206 Z" fill="#1d2a4d" />
      <path d="M79 168 L121 168 L125 206 Q112 210 103 204 L100 192 L97 204 Q88 210 75 206 Z" fill="url(#{id}-stof)" />
      <rect x="79" y="166" width="42" height="6" rx="2" fill="#22b8d8" />
    {:else}
      {@const broek = wie === 'rumi' ? '#15121c' : '#2b2a33'}
      <path d={ledemaat(wijder(benen.l, [6, 6, wie === 'mira' ? 12 : 8]))} fill={broek} />
      <path d={ledemaat(wijder(benen.r, [6, 6, wie === 'mira' ? 12 : 8]))} fill={broek} />
      <path d={ledemaat(wijder(benen.l, [6, 6, wie === 'mira' ? 12 : 8]))} fill="url(#{id}-stof)" />
      <path d={ledemaat(wijder(benen.r, [6, 6, wie === 'mira' ? 12 : 8]))} fill="url(#{id}-stof)" />
      <path d="M100 182 L100 200" stroke="#000" stroke-width="1.2" opacity="0.5" />
      {#if wie === 'rumi'}
        <!-- gouden bies langs de broek -->
        <path d="M82 184 C80 230 82 300 80 340 M118 184 C121 230 121 300 124 340" stroke="url(#{id}-goud)" stroke-width="1.6" fill="none" />
        <!-- laarzen -->
        <path d="M78 300 h20 l1 46 q8 4 6 14 q-1 4 -6 4 h-22 q-5 0 -4 -8 z" fill="#0a0910" />
        <path d="M104 300 h20 l1 46 q8 4 6 14 q-1 4 -6 4 h-22 q-5 0 -4 -8 z" fill="#0a0910" />
        <path d="M80 304 h18 M106 304 h18" stroke="url(#{id}-goud)" stroke-width="2.4" />
        <path d="M83 312 l4 28 M109 312 l4 28" stroke="#fff" stroke-width="1.2" opacity="0.25" />
      {:else}
        <!-- cargozakken en stoere boots -->
        <path d="M74 240 h14 v20 h-14 z M114 240 h14 v20 h-14 z" fill="#3a3944" />
        <path d="M74 245 h14 M114 245 h14" stroke="#18181b" stroke-width="1" />
        <path d="M72 336 h28 v18 q0 10 -8 10 h-20 q-6 0 -5 -10 z" fill="#141317" />
        <path d="M102 336 h28 l2 18 q1 10 -6 10 h-20 q-6 0 -6 -10 z" fill="#141317" />
        <path d="M70 358 h31 M102 358 h31" stroke="#55545e" stroke-width="3.5" />
        <path d="M78 340 l14 0 M108 340 l14 0" stroke="#55545e" stroke-width="1.2" stroke-dasharray="2 2" />
      {/if}
    {/if}

    <!-- ============ ROMP / OUTFIT ============ -->
    {#if wie === 'rumi'}
      <!-- wit topje -->
      <path d={romp} fill="#f4f1f8" />
      <path d={romp} fill="url(#{id}-stof)" />
      <path d="M92 86 Q100 100 108 86" stroke="#c9c2d6" stroke-width="1.2" fill="none" />
      <!-- gouden ketting -->
      <path d="M90 84 Q100 104 110 84" stroke="url(#{id}-goud)" stroke-width="1.4" fill="none" />
      <path d="M100 98 l3 5 -3 5 -3 -5 z" fill="url(#{id}-goud)" />
      <!-- kort zwart jasje met gouden randen -->
      <path d="M74 86 C70 104 74 126 78 140 L92 142 L94 92 L88 82 Z" fill={JAS.rumi} />
      <path d="M126 86 C130 104 126 126 122 140 L108 142 L106 92 L112 82 Z" fill={JAS.rumi} />
      <path d="M74 86 C70 104 74 126 78 140 L92 142 L94 92 L88 82 Z" fill="url(#{id}-stof)" />
      <path d="M126 86 C130 104 126 126 122 140 L108 142 L106 92 L112 82 Z" fill="url(#{id}-stof)" />
      <path d="M88 82 L94 92 L92 142 M112 82 L106 92 L108 142 M78 140 L92 142 M108 142 L122 140" stroke="url(#{id}-goud)" stroke-width="2" fill="none" />
      <path d="M88 82 L84 100 L94 92 M112 82 L116 100 L106 92" fill="#2a2536" />
      <!-- riem -->
      <rect x="81" y="168" width="38" height="8" rx="2.5" fill="url(#{id}-goud)" />
      <rect x="96" y="167" width="8" height="10" rx="2" fill="#15121c" stroke="url(#{id}-goud)" stroke-width="1.2" />
    {:else if wie === 'mira'}
      <!-- zwart topje -->
      <path d={romp} fill="#1d1b24" />
      <path d={romp} fill="url(#{id}-stof)" />
      <path d="M86 120 h28 M85 128 h30" stroke="#3a3744" stroke-width="1" />
      <!-- rood jasje, open, tot over de heup -->
      <path d="M73 86 C66 120 70 160 70 192 L88 194 L92 92 L86 80 Z" fill={JAS.mira} />
      <path d="M127 86 C134 120 130 160 130 192 L112 194 L108 92 L114 80 Z" fill={JAS.mira} />
      <path d="M73 86 C66 120 70 160 70 192 L88 194 L92 92 L86 80 Z" fill="url(#{id}-stof)" />
      <path d="M127 86 C134 120 130 160 130 192 L112 194 L108 92 L114 80 Z" fill="url(#{id}-stof)" />
      <!-- revers -->
      <path d="M86 80 L80 104 L92 96 Z M114 80 L120 104 L108 96 Z" fill={JAS_DONKER.mira} />
      <path d="M92 96 L88 194 M108 96 L112 194" stroke={JAS_DONKER.mira} stroke-width="1.6" />
      <circle cx="90" cy="150" r="1.8" fill="url(#{id}-goud)" />
      <circle cx="110" cy="150" r="1.8" fill="url(#{id}-goud)" />
      <path d="M94 86 Q100 96 106 86" stroke="url(#{id}-goud)" stroke-width="1.2" fill="none" />
      <circle cx="100" cy="95" r="2.2" fill="url(#{id}-goud)" />
    {:else}
      <!-- wit shirt met sportief jasje -->
      <path d={romp} fill="#fbfbfd" />
      <path d={romp} fill="url(#{id}-stof)" />
      <text x="100" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="#e0306f" font-family="Fredoka, sans-serif">Z</text>
      <path d="M74 86 C70 104 74 126 78 146 L90 148 L94 92 L88 82 Z" fill={JAS.zoey} />
      <path d="M126 86 C130 104 126 126 122 146 L110 148 L106 92 L112 82 Z" fill={JAS.zoey} />
      <path d="M74 86 C70 104 74 126 78 146 L90 148 L94 92 L88 82 Z" fill="url(#{id}-stof)" />
      <path d="M126 86 C130 104 126 126 122 146 L110 148 L106 92 L112 82 Z" fill="url(#{id}-stof)" />
      <path d="M76 100 L80 144 M124 100 L120 144" stroke="#fff" stroke-width="2.4" />
      <path d="M94 92 L90 148 M106 92 L110 148" stroke={JAS_DONKER.zoey} stroke-width="1.6" />
      <path d="M88 82 L94 92 L106 92 L112 82" stroke={JAS_DONKER.zoey} stroke-width="3" fill="none" />
    {/if}

    <!-- ============ LINKERARM ============ -->
    <g class="arm-links">
      <path d={ledemaat(armL)} fill="url(#{id}-huidlid)" />
      <path d={ledemaat(tot(armL, wie === 'mira' ? 0.85 : 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill={JAS[wie]} />
      <path d={ledemaat(tot(armL, wie === 'mira' ? 0.85 : 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill="url(#{id}-stof)" />
      {#if wie === 'zoey'}
        <!-- zwaaiende hand met vredesteken -->
        <ellipse cx={handL[0]} cy={handL[1] + 2} rx="5.5" ry="6.5" fill="url(#{id}-huid)" />
        <path d="M{handL[0] - 2.5} {handL[1] - 2} l-2.5 -11 M{handL[0] + 2} {handL[1] - 2.5} l2.5 -11" stroke="#f3c7ae" stroke-width="3.2" stroke-linecap="round" />
      {:else}
        <ellipse cx={handL[0]} cy={handL[1]} rx="5.2" ry="6.4" fill="url(#{id}-huid)" />
      {/if}
    </g>

    <!-- ============ NEK ============ -->
    <path d="M93 54 L93 84 Q100 90 107 84 L107 54 Z" fill="url(#{id}-huidlid)" />
    <path d="M93 62 Q100 72 107 62 L107 56 L93 56 Z" fill="#d9997b" opacity="0.6" />

    <!-- ============ HOOFD ============ -->
    <g class="hoofd">
    <g transform="translate(100 58) scale(1.13) translate(-100 -58)">
      <!-- oren -->
      <ellipse cx="77.5" cy="33" rx="3.6" ry="6" fill="#efbba0" />
      <ellipse cx="122.5" cy="33" rx="3.6" ry="6" fill="#efbba0" />
      <!-- gezicht: smaller, met kaaklijn -->
      <path d="M77.5 26 C77.5 2 122.5 2 122.5 26 C122.5 39 117 49 108 55 Q100 59.5 92 55 C83 49 77.5 39 77.5 26 Z" fill="url(#{id}-huid)" />
      <!-- schaduw langs kaak en wang -->
      <path d="M78 30 C80 43 87 52 95 57 C87 51 82 43 80 30 Z" fill="#d99a7d" opacity="0.45" />
      <path d="M122 30 C120 43 113 52 105 57 C113 51 118 43 120 30 Z" fill="#d99a7d" opacity="0.45" />

      <!-- ogen -->
      <g class="ogen">
        {#each [{ x: 89, k: -1 }, { x: 111, k: 1 }] as o}
          {@const x = o.x}
          {@const k = o.k}
          <!-- oogschaduw -->
          <ellipse cx={x + k * 0.5} cy="25.5" rx="8.5" ry="3.6" fill={s.haar} opacity="0.22" filter="url(#{id}-zacht)" />
          <!-- oogwit, amandelvormig -->
          <path d="M{x - 7.5} 30 Q{x - 1} 23 {x + 7.5} 29 Q{x + 1} 35.5 {x - 7.5} 30 Z" fill="#fbfbff" />
          <!-- iris en pupil -->
          <clipPath id="{id}-oog{k}">
            <path d="M{x - 7.5} 30 Q{x - 1} 23 {x + 7.5} 29 Q{x + 1} 35.5 {x - 7.5} 30 Z" />
          </clipPath>
          <g clip-path="url(#{id}-oog{k})">
            <circle cx={x + k * 0.4} cy="29.6" r="4.1" fill="url(#{id}-iris)" />
            <circle cx={x + k * 0.4} cy="29.6" r="1.8" fill="#120818" />
            <path d="M{x - 7.5} 27 Q{x} 22 {x + 7.5} 26.5 L{x + 7.5} 28.5 Q{x} 25.5 {x - 7.5} 29.5 Z" fill="#000" opacity="0.18" />
          </g>
          <circle cx={x - 1.2 + k * 0.4} cy="28" r="1.2" fill="#fff" />
          <circle cx={x + 1.6 + k * 0.4} cy="31.4" r="0.55" fill="#fff" opacity="0.9" />
          <!-- bovenooglid met eyeliner en een vleugeltje naar buiten -->
          {#if k < 0}
            <path d="M{x + 7.5} 29 Q{x - 1} 22.6 {x - 7.5} 30 L{x - 10.5} 27.6" stroke="#160a1e" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          {:else}
            <path d="M{x - 7.5} 30 Q{x + 1} 22.6 {x + 7.5} 29 L{x + 10.5} 26.4" stroke="#160a1e" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          {/if}
          <!-- wimpers -->
          <path d="M{x + k * 4} 24.6 l{k * 1.2} -2 M{x + k * 6.4} 26.2 l{k * 1.8} -1.6" stroke="#160a1e" stroke-width="0.8" stroke-linecap="round" />
          <!-- ooglidplooi en onderrand -->
          <path d="M{x - 6.5} 25.6 Q{x} 20.8 {x + 6.5} 25" stroke="#c98468" stroke-width="0.6" fill="none" opacity="0.8" />
          <path d="M{x - 5.5} 32.6 Q{x + 1} 34.8 {x + 6.5} 30.6" stroke="#b97a62" stroke-width="0.5" fill="none" opacity="0.7" />
        {/each}
      </g>

      <!-- wenkbrauwen, dun en gevormd -->
      {#if stemming === 'denk'}
        <path d="M81 20 Q87 16.5 95 18.6" stroke={s.haarDonker} stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M105 17.4 Q113 14.6 119.5 18.4" stroke={s.haarDonker} stroke-width="1.5" fill="none" stroke-linecap="round" />
      {:else}
        <path d="M81 21 Q87 17.5 95 19.2" stroke={s.haarDonker} stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M105 19.2 Q113 17.5 119 21" stroke={s.haarDonker} stroke-width="1.5" fill="none" stroke-linecap="round" />
      {/if}

      <!-- neus: lichte rug en neusvleugels -->
      <g transform="translate(0 -2.6)">
      <path d="M99 30 Q98 38 97 43" stroke="#d39a7e" stroke-width="0.8" fill="none" opacity="0.7" />
      <path d="M96.5 44.5 Q100 46.4 103.5 44.5" stroke="#c4846a" stroke-width="1" fill="none" stroke-linecap="round" />
      <ellipse cx="101" cy="38" rx="1.3" ry="4" fill="#fff" opacity="0.35" />
      </g>

      <!-- blosjes -->
      <ellipse cx="85" cy="38.5" rx="6" ry="3.2" fill="#f2708a" opacity="0.28" filter="url(#{id}-zacht)" />
      <ellipse cx="115" cy="38.5" rx="6" ry="3.2" fill="#f2708a" opacity="0.28" filter="url(#{id}-zacht)" />

      <!-- mond -->
      <g transform="translate(100 47) scale(0.92) translate(-100 -51)">
      {#if zingt}
        <!-- zingend: open mond met tanden en tong -->
        <path d="M93.5 49.5 Q100 47.4 106.5 49.5 Q105 58.5 100 59 Q95 58.5 93.5 49.5 Z" fill="#5a1426" />
        <path d="M94.4 49.8 Q100 48.6 105.6 49.8 L105.2 51.4 Q100 50.6 94.8 51.4 Z" fill="#fff" />
        <ellipse cx="100" cy="56.4" rx="3.6" ry="1.8" fill="#e06a7d" />
        <path d="M93 49.4 Q96.5 47 100 48.4 Q103.5 47 107 49.4" stroke={s.lip} stroke-width="1.6" fill="none" stroke-linecap="round" />
        <path d="M94 51 Q95.5 58.6 100 59.2 Q104.5 58.6 106 51" stroke={s.lip} stroke-width="1.3" fill="none" opacity="0.8" />
      {:else if stemming === 'denk'}
        <ellipse cx="101" cy="51.4" rx="2.4" ry="2.1" fill="#7a2338" />
        <path d="M98.4 50.2 Q101 48.6 103.6 50.2" stroke={s.lip} stroke-width="1.4" fill="none" stroke-linecap="round" />
      {:else}
        <!-- glimlach met gevormde lippen -->
        <path d="M93.6 50 Q96.8 48.4 100 49.4 Q103.2 48.4 106.4 50 Q100 51.6 93.6 50 Z" fill={s.lip} />
        <path d="M94.2 50.4 Q100 55.6 105.8 50.4 Q100 52 94.2 50.4 Z" fill={s.lip} opacity="0.85" />
        <path d="M93 49.6 Q100 52.4 107 49.6" stroke="#7a2338" stroke-width="0.8" fill="none" stroke-linecap="round" />
        <ellipse cx="100" cy="52.6" rx="2.2" ry="0.7" fill="#fff" opacity="0.45" />
      {/if}
      </g>

      <!-- ============ VOORHAAR ============ -->
      {#if wie === 'rumi'}
        <!-- zijscheiding, lokken langs het gezicht -->
        <path d="M76 34 C70 -6 128 -10 125 26 C120 12 110 6 98 8 C92 16 84 22 76 34 Z" fill="url(#{id}-haar)" />
        <path d="M98 8 C108 14 116 22 124 30 C122 18 114 8 98 8 Z" fill={s.haarDonker} opacity="0.5" />
        <path d="M77 24 Q70 56 76 84 L81 82 Q77 56 82 30 Z" fill="url(#{id}-haarzij)" />
        <path d="M123 22 Q131 54 125 82 L120 80 Q124 54 119 28 Z" fill="url(#{id}-haarzij)" />
        <path d="M84 6 Q98 -2 116 4" stroke="url(#{id}-glans)" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M86 12 Q92 10 96 9 M104 10 Q114 12 120 20" stroke={s.haarLicht} stroke-width="0.8" fill="none" opacity="0.7" />
      {:else if wie === 'mira'}
        <!-- strak naar achteren in een hoge staart, met wat losse lokken -->
        <path d="M77 30 C72 -6 128 -6 123 30 C120 14 112 6 100 5 C88 6 80 14 77 30 Z" fill="url(#{id}-haar)" />
        <path d="M86 6 Q100 -4 114 6" stroke="url(#{id}-glans)" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M84 10 Q92 2 100 1 M116 10 Q108 2 100 1" stroke={s.haarDonker} stroke-width="0.8" fill="none" opacity="0.6" />
        <!-- losse lokken -->
        <path d="M80 18 C74 40 78 60 82 76" stroke="url(#{id}-haar)" stroke-width="3.2" fill="none" stroke-linecap="round" />
        <path d="M120 18 C126 40 122 60 118 76" stroke="url(#{id}-haar)" stroke-width="3.2" fill="none" stroke-linecap="round" />
      {:else}
        <!-- rechte pony, net boven de wenkbrauwen -->
        <path d="M76 26 C72 -6 128 -6 124 26 L120 18 L115 21.5 L110 17.5 L105 21 L100 17 L95 21 L90 17.5 L85 21.5 L80 18 Z" fill="url(#{id}-haar)" />
        <path d="M77 22 Q72 46 77 66 L82 64 Q78 46 81 26 Z" fill="url(#{id}-haarzij)" />
        <path d="M123 22 Q128 46 123 66 L118 64 Q122 46 119 26 Z" fill="url(#{id}-haarzij)" />
        <path d="M84 4 Q100 -4 116 4" stroke="url(#{id}-glans)" stroke-width="3" fill="none" stroke-linecap="round" />
        <path d="M88 8 L87 18 M96 7 L95 18 M104 7 L105 18 M112 8 L113 18" stroke={s.haarLicht} stroke-width="0.6" opacity="0.5" />
        <!-- haarelastiekjes -->
        <circle cx="76" cy="10" r="3.6" fill="#22b8d8" />
        <circle cx="124" cy="10" r="3.6" fill="#22b8d8" />
      {/if}

      <!-- oorbellen -->
      {#if wie === 'zoey'}
        <circle cx="77" cy="40" r="1.8" fill="#e0306f" />
        <circle cx="123" cy="40" r="1.8" fill="#e0306f" />
      {:else}
        <path d="M77 38 v6 M123 38 v6" stroke="url(#{id}-goud)" stroke-width="1" />
        <path d="M77 44 l2 3 -2 3 -2 -3 z M123 44 l2 3 -2 3 -2 -3 z" fill="url(#{id}-goud)" />
      {/if}
    </g>
    </g>

    <!-- ============ RECHTERARM + MICROFOON ============ -->
    <g class="arm-rechts">
      <path d={ledemaat(ARM_RECHTS)} fill="url(#{id}-huidlid)" />
      <path d={ledemaat(tot(ARM_RECHTS, wie === 'mira' ? 0.85 : 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill={JAS[wie]} />
      <path d={ledemaat(tot(ARM_RECHTS, wie === 'mira' ? 0.85 : 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill="url(#{id}-stof)" />
      <!-- microfoon -->
      <path d="M147.6 92 L149 60 L155 60 L156.4 92 Q152 95 147.6 92 Z" fill="url(#{id}-mic)" />
      <rect x="147.6" y="60" width="8.8" height="3" rx="1" fill="#3f3f46" />
      <circle cx="152" cy="53" r="7.6" fill="url(#{id}-mickop)" />
      <circle cx="152" cy="53" r="7.6" fill="url(#{id}-gaas)" />
      <ellipse cx="149.4" cy="49.8" rx="2.4" ry="1.6" fill="#fff" opacity="0.7" />
      <!-- hand om de microfoon -->
      <path d="M146 76 Q144 84 147 90 Q152 93 157 88 Q159 80 156 74 Q151 71 146 76 Z" fill="url(#{id}-huid)" />
      <path d="M147 79 h9 M147 83 h9.4" stroke="#d39a7e" stroke-width="0.6" />
    </g>
  </g>
  </g>
</svg>

<style>
  .heldin {
    overflow: visible;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.45));
  }
  .lijf {
    transform-origin: 100px 372px;
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
  /* rondje draaien van blijdschap */
  .draai .lijf {
    animation: draai 1s ease-in-out infinite;
  }
  .draai .arm-rechts {
    animation: zwaai 0.5s ease-in-out infinite alternate;
  }
  @keyframes draai {
    0% { transform: scaleX(1) translateY(0); }
    25% { transform: scaleX(0.2) translateY(-16px); }
    50% { transform: scaleX(-1) translateY(-22px); }
    75% { transform: scaleX(-0.2) translateY(-16px); }
    100% { transform: scaleX(1) translateY(0); }
  }
  .hoofd {
    transform-origin: 100px 62px;
    transform-box: view-box;
    transition: transform 0.4s;
  }
  .denk .hoofd {
    transform: rotate(-7deg);
  }
  .arm-links {
    transform-origin: 76px 90px;
    transform-box: view-box;
    transition: transform 0.3s;
  }
  .arm-rechts {
    transform-origin: 124px 90px;
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
    transform-origin: 74px 70px;
    transform-box: view-box;
    animation: slinger 3.4s ease-in-out infinite;
  }
  .staart {
    transform-box: view-box;
    animation: slinger 1.8s ease-in-out infinite;
  }
  .staart-l { transform-origin: 76px 14px; }
  .staart-r { transform-origin: 124px 14px; animation-direction: reverse; }
  .staart-m { transform-origin: 104px -8px; animation-duration: 2.6s; }
  .ogen {
    transform-origin: 100px 29px;
    transform-box: view-box;
    animation: knipper 5s infinite;
  }
  @keyframes wieg {
    0%, 100% { transform: rotate(-1deg); }
    50% { transform: rotate(1deg) translateY(-2px); }
  }
  @keyframes dans {
    0%, 100% { transform: rotate(-3.5deg) translateY(0); }
    50% { transform: rotate(3.5deg) translateY(-10px); }
  }
  @keyframes spring {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-24px); }
  }
  @keyframes zwaai {
    from { transform: rotate(0deg); }
    to { transform: rotate(-16deg); }
  }
  @keyframes zwaai-links {
    from { transform: rotate(0deg); }
    to { transform: rotate(22deg); }
  }
  @keyframes slinger {
    0%, 100% { transform: rotate(-2.5deg); }
    50% { transform: rotate(2.5deg); }
  }
  @keyframes knipper {
    0%, 95%, 100% { transform: scaleY(1); }
    97% { transform: scaleY(0.1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .lijf, .arm-rechts, .arm-links, .ogen, .vlecht, .staart { animation: none !important; }
  }
</style>
