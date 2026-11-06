<script lang="ts">
  /**
   * Lana als vierde lid van de groep, in dezelfde half-realistische stijl als de heldinnen
   * (zelfde verhoudingen, gezicht en schaduw). Alles is in te stellen in de kleedkamer:
   * kapsel, haarkleur, outfit, accessoire, huidskleur en oogkleur.
   */
  import { HUIDTINTEN, OOGKLEUREN, haarKleuren, lichtKleur, type Avatar } from '../engine/kleedkamer';

  let {
    avatar,
    stemming = 'rust',
    hoogte = 320,
    licht = false,
    stil = false,
  }: {
    avatar: Avatar;
    stemming?: 'rust' | 'dans' | 'juich' | 'denk' | 'draai';
    hoogte?: number;
    licht?: boolean;
    /** Zonder animaties (voor kleine voorbeeldjes). */
    stil?: boolean;
  } = $props();

  const id = `l${Math.random().toString(36).slice(2, 8)}`;
  const HOOFD = 'translate(100 58) scale(1.13) translate(-100 -58)';

  // ---------- Kleuren ----------
  function meng(a: string, b: string, t: number): string {
    const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
  }
  let huid = $derived(HUIDTINTEN[avatar.huid] ?? HUIDTINTEN[0]);
  let huidLicht = $derived(meng(huid, '#ffffff', 0.45));
  let huidDonker = $derived(meng(huid, '#8a4b2e', 0.35));
  let iris = $derived(OOGKLEUREN.find((o) => o.id === avatar.ogen)?.kleur ?? '#92400e');
  let hk = $derived(haarKleuren(avatar.haarkleur));
  let lk = $derived(lichtKleur(avatar.licht));
  const LIP = '#d9536f';

  const OUTFIT = {
    paarsjasje: { jas: '#7c3aed', donker: '#4c1d95', top: '#f4f1f8', broek: '#1e1b4b', schoen: '#6d28d9', rand: 'goud' },
    sterrenhoodie: { jas: '#ec4899', donker: '#9d174d', top: '#ec4899', broek: '#4c1d95', schoen: 'sneaker', rand: '#fde68a' },
    rodejas: { jas: '#c8102e', donker: '#7d0a1d', top: '#1d1b24', broek: '#2b2a33', schoen: '#141317', rand: 'goud' },
    sport: { jas: '#14b8a6', donker: '#0f766e', top: '#fbfbfd', broek: '#1d2a4d', schoen: 'sneaker', rand: '#fff' },
    glitterjurk: { jas: '#c084fc', donker: '#7e22ce', top: '#c084fc', broek: '#c084fc', schoen: '#a855f7', rand: '#fff' },
    goudpak: { jas: '#e8a317', donker: '#a1620b', top: '#fff7ed', broek: '#fffbeb', schoen: '#d97706', rand: '#fff7c2' },
  } as const;
  let o = $derived(OUTFIT[avatar.outfit as keyof typeof OUTFIT] ?? OUTFIT.paarsjasje);
  let rok = $derived(avatar.outfit === 'glitterjurk');
  let kort = $derived(avatar.outfit === 'sport');
  let zingt = $derived(stemming === 'juich' || stemming === 'dans' || stemming === 'draai');

  // ---------- Vloeiende ledematen (zelfde techniek als de heldinnen) ----------
  type P = [x: number, y: number, breedte: number];
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
      links.push([x + ((-dy / l) * w) / 2, y + ((dx / l) * w) / 2]);
      rechts.push([x - ((-dy / l) * w) / 2, y - ((dx / l) * w) / 2]);
    });
    const eind = pts[pts.length - 1][2] / 2;
    const terug = rechts.reverse();
    return `${vloeiend(links)} A${eind} ${eind} 0 0 1 ${terug[0][0].toFixed(1)} ${terug[0][1].toFixed(1)}${vloeiend(terug, false)} Z`;
  }
  function tot(pts: P[], t: number): P[] {
    const n = (pts.length - 1) * t;
    const i = Math.floor(n);
    const f = n - i;
    if (i >= pts.length - 1) return pts;
    const a = pts[i];
    const b = pts[i + 1];
    return [...pts.slice(0, i + 1), [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]];
  }
  const wijder = (pts: P[], extra: number[]): P[] => pts.map(([x, y, w], i) => [x, y, w + extra[i]]);

  const ARM_R: P[] = [[124, 90, 12.5], [145, 124, 9.5], [151, 92, 7.5]];
  const ARM_L: P[] = [[76, 90, 12.5], [68, 138, 9.5], [72, 182, 7.5]];
  const HAND_L: [number, number] = [72, 190];
  const BEEN_L: P[] = [[91, 177, 21], [90, 266, 14], [89, 345, 10.5]];
  const BEEN_R: P[] = [[109, 177, 21], [111, 266, 14], [113, 345, 10.5]];
  const romp = 'M74 86 C69 104 78 132 86 150 C84 160 81 168 80 178 L120 178 C119 168 116 160 114 150 C122 132 131 104 126 86 C114 79 86 79 74 86 Z';
  const jasL = 'M74 86 C70 104 74 126 78 144 L92 146 L94 92 L88 82 Z';
  const jasR = 'M126 86 C130 104 126 126 122 144 L108 146 L106 92 L112 82 Z';
</script>

<svg class="lana {stemming}" class:stil viewBox="4 -30 192 410" style="height:{hoogte}px" role="img" aria-label="Lana">
  <defs>
    <radialGradient id="{id}-huid" cx="0.38" cy="0.3" r="0.85">
      <stop offset="0" stop-color={huidLicht} />
      <stop offset="0.55" stop-color={huid} />
      <stop offset="1" stop-color={huidDonker} />
    </radialGradient>
    <linearGradient id="{id}-huidlid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color={huidDonker} />
      <stop offset="0.45" stop-color={huidLicht} />
      <stop offset="1" stop-color={huidDonker} />
    </linearGradient>
    <linearGradient id="{id}-haar" x1="0.2" y1="0" x2={avatar.haarkleur === 'regenboog' ? '1' : '0.6'} y2="1">
      <stop offset="0" stop-color={hk[0]} />
      <stop offset={avatar.haarkleur === 'regenboog' ? '0.5' : '0.25'} stop-color={hk[1]} />
      <stop offset="1" stop-color={hk[2]} />
    </linearGradient>
    <linearGradient id="{id}-haarzij" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color={hk[2]} />
      <stop offset="0.45" stop-color={hk[1]} />
      <stop offset="0.6" stop-color={hk[0]} stop-opacity="0.9" />
      <stop offset="1" stop-color={hk[2]} />
    </linearGradient>
    <linearGradient id="{id}-glans" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0" />
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.35" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="{id}-iris" cx="0.5" cy="0.38" r="0.65">
      <stop offset="0" stop-color={iris} stop-opacity="0.75" />
      <stop offset="0.55" stop-color={iris} />
      <stop offset="1" stop-color={meng(iris, '#000000', 0.55)} />
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
      {#if avatar.accessoire === 'microfoon'}
        <stop offset="0" stop-color="#fff7c2" />
        <stop offset="0.6" stop-color="#f2b632" />
        <stop offset="1" stop-color="#a1620b" />
      {:else}
        <stop offset="0" stop-color="#f4f4f5" />
        <stop offset="0.6" stop-color="#a1a1aa" />
        <stop offset="1" stop-color="#3f3f46" />
      {/if}
    </radialGradient>
    <linearGradient id="{id}-mic" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color={avatar.accessoire === 'microfoon' ? '#d4a017' : '#fbbf24'} />
      <stop offset="0.4" stop-color="#fff" stop-opacity="0.85" />
      <stop offset="1" stop-color={avatar.accessoire === 'microfoon' ? '#a1620b' : '#f59e0b'} />
    </linearGradient>
    <pattern id="{id}-gaas" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
      <path d="M0 0 L2.4 2.4 M2.4 0 L0 2.4" stroke="#52525b" stroke-width="0.35" />
    </pattern>
    <radialGradient id="{id}-licht" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color={lk} stop-opacity="0.9" />
      <stop offset="1" stop-color={lk} stop-opacity="0" />
    </radialGradient>
    <filter id="{id}-lijn" x="-15%" y="-15%" width="130%" height="130%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="dik" />
      <feFlood flood-color="#1a0b2e" flood-opacity="0.75" result="kleur" />
      <feComposite in="kleur" in2="dik" operator="in" result="rand" />
      <feMerge><feMergeNode in="rand" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="{id}-zacht" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.4" />
    </filter>
    <filter id="{id}-gloed" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>

  {#if licht}
    <ellipse cx="100" cy="370" rx="100" ry="24" fill="url(#{id}-licht)" class="licht" />
  {/if}
  <ellipse cx="100" cy="374" rx="44" ry="6" fill="#000" opacity="0.32" />

  <g filter="url(#{id}-lijn)">
    <g class="lijf">
      <!-- ============ ACHTERHAAR ============ -->
      {#if avatar.haar === 'vlecht'}
        <g class="zwaai" style="transform-origin:74px 70px">
          <path d="M70 60 C62 120 66 200 60 300 L66 300 C72 200 80 120 82 60 Z" fill={hk[2]} />
          {#each Array.from({ length: 19 }, (_, i) => i) as i}
            {@const cx = 73 - i * 0.7 + (i % 2 ? 2.6 : -2.6)}
            {@const cy = 70 + i * 13}
            <ellipse {cx} {cy} rx={8.2 - i * 0.22} ry="9.5" transform="rotate({i % 2 ? 32 : -32} {cx} {cy})" fill="url(#{id}-haarzij)" />
          {/each}
          <circle cx="60" cy="303" r="4.5" fill="#f472b6" />
          <path d="M57 306 q-3 12 -6 20 M60 306 q0 12 0 22 M63 306 q3 12 6 20" stroke={hk[1]} stroke-width="3" stroke-linecap="round" fill="none" />
        </g>
        <path transform={HOOFD} d="M74 30 C70 -8 130 -8 126 30 L128 70 C116 80 84 80 72 70 Z" fill="url(#{id}-haar)" />
      {:else if avatar.haar === 'hogestaart'}
        <g class="zwaai" style="transform-origin:104px -8px">
          <path d="M102 -4 C140 -10 150 20 142 70 C136 120 150 170 140 236 C132 218 124 226 118 240 C116 200 120 150 116 100 C112 60 110 20 100 -12 Z" fill="url(#{id}-haarzij)" />
          <path d="M124 10 C138 50 128 110 136 180" stroke={hk[0]} stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round" />
        </g>
        <path transform={HOOFD} d="M74 30 C70 -8 130 -8 126 30 L127 66 C116 74 84 74 73 66 Z" fill="url(#{id}-haar)" />
        <ellipse transform={HOOFD} cx="104" cy="5" rx="5" ry="3" fill="#f472b6" />
      {:else if avatar.haar === 'lang'}
        <path transform={HOOFD} d="M74 30 C70 -8 130 -8 126 30 C130 70 134 110 130 150 C120 158 112 152 104 158 L96 158 C88 152 80 158 70 150 C66 110 70 70 74 30 Z" fill="url(#{id}-haar)" />
        <path transform={HOOFD} d="M76 60 C74 90 74 120 76 146 M124 60 C126 90 126 120 124 146" stroke={hk[0]} stroke-width="1.4" fill="none" opacity="0.45" />
      {:else if avatar.haar === 'staartjes'}
        <g transform={HOOFD}>
          <g class="zwaai" style="transform-origin:78px 34px">
            <path d="M78 30 C58 30 52 60 54 92 C55 108 50 120 46 128 C58 122 64 110 66 96 C68 74 68 56 80 42 Z" fill="url(#{id}-haarzij)" />
            <circle cx="76" cy="36" r="3.4" fill="#f472b6" />
          </g>
          <g class="zwaai omgekeerd" style="transform-origin:122px 34px">
            <path d="M122 30 C142 30 148 60 146 92 C145 108 150 120 154 128 C142 122 136 110 134 96 C132 74 132 56 120 42 Z" fill="url(#{id}-haarzij)" />
            <circle cx="124" cy="36" r="3.4" fill="#f472b6" />
          </g>
          <path d="M75 30 C71 -6 129 -6 125 30 L126 62 C116 70 84 70 74 62 Z" fill="url(#{id}-haar)" />
        </g>
      {:else if avatar.haar === 'knotjes'}
        <g transform={HOOFD}>
          <circle cx="80" cy="-2" r="11" fill="url(#{id}-haar)" />
          <circle cx="120" cy="-2" r="11" fill="url(#{id}-haar)" />
          <path d="M74 -6 q6 -6 12 -2 M114 -6 q6 -6 12 -2" stroke={hk[0]} stroke-width="1.2" fill="none" opacity="0.7" />
          <path d="M75 30 C71 -6 129 -6 125 30 L126 62 C116 70 84 70 74 62 Z" fill="url(#{id}-haar)" />
        </g>
      {:else}
        <!-- bob -->
        <path transform={HOOFD} d="M74 30 C70 -8 130 -8 126 30 L128 60 C118 68 82 68 72 60 Z" fill="url(#{id}-haar)" />
      {/if}

      <!-- ============ BENEN ============ -->
      {#if rok || kort}
        <path d={ledemaat(BEEN_L)} fill="url(#{id}-huidlid)" />
        <path d={ledemaat(BEEN_R)} fill="url(#{id}-huidlid)" />
      {:else}
        <path d={ledemaat(wijder(BEEN_L, [6, 6, 8]))} fill={o.broek} />
        <path d={ledemaat(wijder(BEEN_R, [6, 6, 8]))} fill={o.broek} />
        <path d={ledemaat(wijder(BEEN_L, [6, 6, 8]))} fill="url(#{id}-stof)" />
        <path d={ledemaat(wijder(BEEN_R, [6, 6, 8]))} fill="url(#{id}-stof)" />
        <path d="M100 182 L100 200" stroke="#000" stroke-width="1.2" opacity="0.5" />
      {/if}
      {#if kort}
        <path d={ledemaat(BEEN_L.slice(1).map(([x, y, w], i) => [x, i === 0 ? y + 18 : y, w + 1.6]))} fill="#f5f7fb" />
        <path d={ledemaat(BEEN_R.slice(1).map(([x, y, w], i) => [x, i === 0 ? y + 18 : y, w + 1.6]))} fill="#f5f7fb" />
        <path d="M83 290 h15 M105 290 h15" stroke="#14b8a6" stroke-width="2.5" />
      {/if}
      {#if o.schoen === 'sneaker'}
        <path d="M78 340 q12 -4 22 0 l2 16 q1 8 -7 8 h-17 q-7 0 -5 -8 z" fill="#ffffff" />
        <path d="M102 340 q12 -4 22 0 l3 16 q1 8 -7 8 h-16 q-8 0 -6 -8 z" fill="#ffffff" />
        <path d="M76 358 h26 M101 358 h27" stroke={avatar.outfit === 'sport' ? '#14b8a6' : '#ec4899'} stroke-width="3.5" />
      {:else}
        <path d="M78 300 h20 l1 46 q8 4 6 14 q-1 4 -6 4 h-22 q-5 0 -4 -8 z" fill={o.schoen} />
        <path d="M104 300 h20 l1 46 q8 4 6 14 q-1 4 -6 4 h-22 q-5 0 -4 -8 z" fill={o.schoen} />
        <path d="M80 304 h18 M106 304 h18" stroke="url(#{id}-goud)" stroke-width="2.4" />
        <path d="M83 312 l4 28 M109 312 l4 28" stroke="#fff" stroke-width="1.2" opacity="0.25" />
      {/if}

      <!-- ============ ROMP / OUTFIT ============ -->
      {#if rok}
        <path d="M74 86 C69 104 76 130 82 150 L60 258 Q100 272 140 258 L118 150 C124 130 131 104 126 86 C114 79 86 79 74 86 Z" fill={o.jas} />
        <path d="M74 86 C69 104 76 130 82 150 L60 258 Q100 272 140 258 L118 150 C124 130 131 104 126 86 C114 79 86 79 74 86 Z" fill="url(#{id}-stof)" />
        <path d="M82 150 Q100 158 118 150" stroke="#fff" stroke-width="2.4" fill="none" />
        {#each [[86, 110], [112, 104], [100, 180], [76, 226], [124, 230], [96, 244], [110, 206], [88, 196], [102, 130]] as [x, y]}
          <path d="M{x} {y - 4} l1.2 3 3 1 -3 1 -1.2 3 -1.2 -3 -3 -1 3 -1z" fill="#fff" class="glitter" />
        {/each}
      {:else if avatar.outfit === 'sterrenhoodie'}
        <path d="M72 86 C66 110 72 150 72 184 L128 184 C128 150 134 110 128 86 C114 78 86 78 72 86 Z" fill={o.jas} />
        <path d="M72 86 C66 110 72 150 72 184 L128 184 C128 150 134 110 128 86 C114 78 86 78 72 86 Z" fill="url(#{id}-stof)" />
        <path d="M84 150 h32 v20 h-32 z" fill={o.donker} opacity="0.35" />
        <path d="M90 84 Q100 100 110 84" stroke={o.donker} stroke-width="3" fill="none" />
        <path d="M96 92 v14 M104 92 v14" stroke="#fff" stroke-width="1.4" />
        {#each [[86, 118], [114, 128], [100, 140]] as [x, y]}
          <path d="M{x} {y - 6} l1.8 4 4.4 0.6 -3.2 3 0.8 4.4 -3.8 -2 -3.8 2 0.8 -4.4 -3.2 -3 4.4 -0.6z" fill={o.rand} />
        {/each}
      {:else}
        <path d={romp} fill={o.top} />
        <path d={romp} fill="url(#{id}-stof)" />
        {#if kort}
          <path d="M79 168 L121 168 L125 206 Q112 210 103 204 L100 192 L97 204 Q88 210 75 206 Z" fill={o.broek} />
          <rect x="79" y="166" width="42" height="6" rx="2" fill="#14b8a6" />
        {:else}
          <rect x="81" y="168" width="38" height="8" rx="2.5" fill={avatar.outfit === 'rodejas' ? '#3a3944' : 'url(#' + id + '-goud)'} />
        {/if}
        {#if avatar.outfit === 'rodejas'}
          <path d="M73 86 C66 120 70 160 70 192 L88 194 L92 92 L86 80 Z" fill={o.jas} />
          <path d="M127 86 C134 120 130 160 130 192 L112 194 L108 92 L114 80 Z" fill={o.jas} />
          <path d="M73 86 C66 120 70 160 70 192 L88 194 L92 92 L86 80 Z" fill="url(#{id}-stof)" />
          <path d="M127 86 C134 120 130 160 130 192 L112 194 L108 92 L114 80 Z" fill="url(#{id}-stof)" />
          <path d="M86 80 L80 104 L92 96 Z M114 80 L120 104 L108 96 Z" fill={o.donker} />
        {:else}
          <path d={jasL} fill={o.jas} />
          <path d={jasR} fill={o.jas} />
          <path d={jasL} fill="url(#{id}-stof)" />
          <path d={jasR} fill="url(#{id}-stof)" />
          {#if o.rand === 'goud'}
            <path d="M88 82 L94 92 L92 146 M112 82 L106 92 L108 146 M78 144 L92 146 M108 146 L122 144" stroke="url(#{id}-goud)" stroke-width="2" fill="none" />
            <text x="100" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="url(#{id}-goud)" font-family="Fredoka, sans-serif">L</text>
          {:else}
            <path d="M76 100 L80 142 M124 100 L120 142" stroke={o.rand} stroke-width="2.4" />
          {/if}
          {#if avatar.outfit === 'goudpak'}
            {#each [[80, 100], [84, 120], [80, 134], [120, 100], [116, 120], [120, 134]] as [x, y]}
              <circle cx={x} cy={y} r="1.6" fill="#fff" class="glitter" />
            {/each}
          {/if}
          <path d="M88 82 L94 92 L106 92 L112 82" stroke={o.donker} stroke-width="2.4" fill="none" />
        {/if}
      {/if}

      <!-- ============ LINKERARM ============ -->
      <g class="arm-links">
        <path d={ledemaat(ARM_L)} fill="url(#{id}-huidlid)" />
        <path d={ledemaat(tot(ARM_L, 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill={rok ? o.donker : o.jas} />
        <path d={ledemaat(tot(ARM_L, 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill="url(#{id}-stof)" />
        <ellipse cx={HAND_L[0]} cy={HAND_L[1]} rx="5.2" ry="6.4" fill="url(#{id}-huid)" />
      </g>

      <!-- ============ NEK ============ -->
      <path d="M93 54 L93 84 Q100 90 107 84 L107 54 Z" fill="url(#{id}-huidlid)" />
      <path d="M93 62 Q100 72 107 62 L107 56 L93 56 Z" fill={huidDonker} opacity="0.6" />

      <!-- ============ HOOFD ============ -->
      <g class="hoofd">
        <g transform={HOOFD}>
          <ellipse cx="77.5" cy="33" rx="3.6" ry="6" fill={huidDonker} />
          <ellipse cx="122.5" cy="33" rx="3.6" ry="6" fill={huidDonker} />
          <path d="M77.5 26 C77.5 2 122.5 2 122.5 26 C122.5 39 117 49 108 55 Q100 59.5 92 55 C83 49 77.5 39 77.5 26 Z" fill="url(#{id}-huid)" />
          <path d="M78 30 C80 43 87 52 95 57 C87 51 82 43 80 30 Z" fill={huidDonker} opacity="0.4" />
          <path d="M122 30 C120 43 113 52 105 57 C113 51 118 43 120 30 Z" fill={huidDonker} opacity="0.4" />

          <g class="ogen">
            {#each [{ x: 89, k: -1 }, { x: 111, k: 1 }] as e}
              {@const x = e.x}
              {@const k = e.k}
              <ellipse cx={x + k * 0.5} cy="25.5" rx="8.5" ry="3.6" fill={hk[1]} opacity="0.2" filter="url(#{id}-zacht)" />
              <path d="M{x - 7.5} 30 Q{x - 1} 23 {x + 7.5} 29 Q{x + 1} 35.5 {x - 7.5} 30 Z" fill="#fbfbff" />
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
              {#if k < 0}
                <path d="M{x + 7.5} 29 Q{x - 1} 22.6 {x - 7.5} 30 L{x - 10} 28" stroke="#160a1e" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              {:else}
                <path d="M{x - 7.5} 30 Q{x + 1} 22.6 {x + 7.5} 29 L{x + 10} 27" stroke="#160a1e" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              {/if}
              <path d="M{x + k * 4} 24.6 l{k * 1.2} -2 M{x + k * 6.4} 26.2 l{k * 1.8} -1.6" stroke="#160a1e" stroke-width="0.8" stroke-linecap="round" />
              <path d="M{x - 6.5} 25.6 Q{x} 20.8 {x + 6.5} 25" stroke={huidDonker} stroke-width="0.6" fill="none" opacity="0.8" />
            {/each}
          </g>

          {#if stemming === 'denk'}
            <path d="M81 20 Q87 16.5 95 18.6" stroke={hk[2]} stroke-width="1.5" fill="none" stroke-linecap="round" />
            <path d="M105 17.4 Q113 14.6 119.5 18.4" stroke={hk[2]} stroke-width="1.5" fill="none" stroke-linecap="round" />
          {:else}
            <path d="M81 21 Q87 17.5 95 19.2" stroke={hk[2]} stroke-width="1.5" fill="none" stroke-linecap="round" />
            <path d="M105 19.2 Q113 17.5 119 21" stroke={hk[2]} stroke-width="1.5" fill="none" stroke-linecap="round" />
          {/if}

          <g transform="translate(0 -2.6)">
            <path d="M99 30 Q98 38 97 43" stroke={huidDonker} stroke-width="0.8" fill="none" opacity="0.7" />
            <path d="M96.5 44.5 Q100 46.4 103.5 44.5" stroke={huidDonker} stroke-width="1" fill="none" stroke-linecap="round" />
            <ellipse cx="101" cy="38" rx="1.3" ry="4" fill="#fff" opacity="0.3" />
          </g>
          <ellipse cx="85" cy="38.5" rx="6" ry="3.2" fill="#f2708a" opacity="0.3" filter="url(#{id}-zacht)" />
          <ellipse cx="115" cy="38.5" rx="6" ry="3.2" fill="#f2708a" opacity="0.3" filter="url(#{id}-zacht)" />

          <g transform="translate(100 47) scale(0.92) translate(-100 -51)">
            {#if zingt}
              <path d="M93.5 49.5 Q100 47.4 106.5 49.5 Q105 58.5 100 59 Q95 58.5 93.5 49.5 Z" fill="#5a1426" />
              <path d="M94.4 49.8 Q100 48.6 105.6 49.8 L105.2 51.4 Q100 50.6 94.8 51.4 Z" fill="#fff" />
              <ellipse cx="100" cy="56.4" rx="3.6" ry="1.8" fill="#e06a7d" />
              <path d="M93 49.4 Q96.5 47 100 48.4 Q103.5 47 107 49.4" stroke={LIP} stroke-width="1.6" fill="none" stroke-linecap="round" />
            {:else if stemming === 'denk'}
              <ellipse cx="101" cy="51.4" rx="2.4" ry="2.1" fill="#7a2338" />
            {:else}
              <path d="M93.6 50 Q96.8 48.4 100 49.4 Q103.2 48.4 106.4 50 Q100 51.6 93.6 50 Z" fill={LIP} />
              <path d="M94.2 50.4 Q100 55.6 105.8 50.4 Q100 52 94.2 50.4 Z" fill={LIP} opacity="0.85" />
              <path d="M93 49.6 Q100 52.4 107 49.6" stroke="#7a2338" stroke-width="0.8" fill="none" stroke-linecap="round" />
            {/if}
          </g>

          <!-- ============ VOORHAAR ============ -->
          {#if avatar.haar === 'bob'}
            <path d="M76 26 C72 -6 128 -6 124 26 L120 18 L115 21.5 L110 17.5 L105 21 L100 17 L95 21 L90 17.5 L85 21.5 L80 18 Z" fill="url(#{id}-haar)" />
            <path d="M77 22 Q72 46 77 62 L84 60 Q79 44 81 26 Z" fill="url(#{id}-haarzij)" />
            <path d="M123 22 Q128 46 123 62 L116 60 Q121 44 119 26 Z" fill="url(#{id}-haarzij)" />
          {:else if avatar.haar === 'hogestaart'}
            <path d="M77 30 C72 -6 128 -6 123 30 C120 14 112 6 100 5 C88 6 80 14 77 30 Z" fill="url(#{id}-haar)" />
            <path d="M80 18 C74 40 78 60 82 76" stroke="url(#{id}-haar)" stroke-width="3.2" fill="none" stroke-linecap="round" />
          {:else}
            <!-- zachte zijscheiding -->
            <path d="M76 34 C70 -6 128 -10 125 26 C120 12 110 6 98 8 C92 16 84 22 76 34 Z" fill="url(#{id}-haar)" />
            <path d="M98 8 C108 14 116 22 124 30 C122 18 114 8 98 8 Z" fill={hk[2]} opacity="0.4" />
            {#if avatar.haar === 'lang' || avatar.haar === 'vlecht'}
              <path d="M77 24 Q70 56 76 84 L81 82 Q77 56 82 30 Z" fill="url(#{id}-haarzij)" />
              <path d="M123 22 Q131 54 125 82 L120 80 Q124 54 119 28 Z" fill="url(#{id}-haarzij)" />
            {/if}
          {/if}
          <path d="M84 6 Q98 -2 116 4" stroke="url(#{id}-glans)" stroke-width="3" fill="none" stroke-linecap="round" />

          <!-- oorbellen -->
          <path d="M77 38 v5 M123 38 v5" stroke="url(#{id}-goud)" stroke-width="1" />
          <circle cx="77" cy="45" r="1.8" fill="url(#{id}-goud)" />
          <circle cx="123" cy="45" r="1.8" fill="url(#{id}-goud)" />

          <!-- ============ ACCESSOIRES OP HET HOOFD ============ -->
          {#if avatar.accessoire === 'kroon'}
            <path d="M86 4 L89 -10 L95 -2 L100 -14 L105 -2 L111 -10 L114 4 Z" fill="url(#{id}-goud)" stroke="#a1620b" stroke-width="1" />
            <circle cx="100" cy="-5" r="2" fill="#ec4899" />
            <circle cx="90" cy="-1" r="1.2" fill="#22d3ee" />
            <circle cx="110" cy="-1" r="1.2" fill="#22d3ee" />
          {:else if avatar.accessoire === 'strik'}
            <g transform="rotate(18 118 6)">
              <path d="M118 6 L104 -2 Q101 6 104 14 Z" fill="#f472b6" />
              <path d="M118 6 L132 -2 Q135 6 132 14 Z" fill="#f472b6" />
              <circle cx="118" cy="6" r="3.6" fill="#db2777" />
            </g>
          {:else if avatar.accessoire === 'koptelefoon'}
            <path d="M75 30 C70 -14 130 -14 125 30" stroke="#1f2937" stroke-width="4" fill="none" />
            <rect x="70" y="24" width="10" height="17" rx="4.5" fill="#ec4899" />
            <rect x="120" y="24" width="10" height="17" rx="4.5" fill="#ec4899" />
          {:else if avatar.accessoire === 'hartjesbril'}
            {#each [89, 111] as x}
              <path d="M{x} 36 C{x - 12} 28 {x - 7} 19 {x} 25 C{x + 7} 19 {x + 12} 28 {x} 36 Z" fill="#f472b6" fill-opacity="0.45" stroke="#db2777" stroke-width="1.6" />
            {/each}
            <path d="M96 27 Q100 25 104 27" stroke="#db2777" stroke-width="1.6" fill="none" />
          {/if}
        </g>
      </g>

      <!-- ============ RECHTERARM + MICROFOON / STAF ============ -->
      <g class="arm-rechts">
        <path d={ledemaat(ARM_R)} fill="url(#{id}-huidlid)" />
        <path d={ledemaat(tot(ARM_R, 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill={rok ? o.donker : o.jas} />
        <path d={ledemaat(tot(ARM_R, 0.75).map(([x, y, w]) => [x, y, w + 2.5]))} fill="url(#{id}-stof)" />
        {#if avatar.accessoire === 'sterrenstaf'}
          <rect x="149.5" y="10" width="5" height="96" rx="2.5" fill="url(#{id}-goud)" />
          <g filter="url(#{id}-gloed)">
            <path d="M152 -10 l4.5 9.2 10.1 1.5 -7.3 7.1 1.7 10 -9 -4.7 -9 4.7 1.7 -10 -7.3 -7.1 10.1 -1.5z" fill="url(#{id}-goud)" stroke="#fff7c2" stroke-width="1.2" />
          </g>
        {:else}
          <path d="M147.6 92 L149 60 L155 60 L156.4 92 Q152 95 147.6 92 Z" fill="url(#{id}-mic)" />
          <rect x="147.6" y="60" width="8.8" height="3" rx="1" fill="#3f3f46" />
          <circle cx="152" cy="53" r="7.6" fill="url(#{id}-mickop)" />
          <circle cx="152" cy="53" r="7.6" fill="url(#{id}-gaas)" />
          <ellipse cx="149.4" cy="49.8" rx="2.4" ry="1.6" fill="#fff" opacity="0.7" />
        {/if}
        <path d="M146 76 Q144 84 147 90 Q152 93 157 88 Q159 80 156 74 Q151 71 146 76 Z" fill="url(#{id}-huid)" />
      </g>
    </g>
  </g>
</svg>

<style>
  .lana {
    overflow: visible;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.45));
  }
  .lijf {
    transform-origin: 100px 372px;
    transform-box: view-box;
  }
  .rust .lijf { animation: wieg 3.4s ease-in-out infinite; }
  .dans .lijf { animation: dans 0.9s ease-in-out infinite; }
  .juich .lijf { animation: spring 0.65s ease-in-out infinite; }
  .draai .lijf { animation: draai 1s ease-in-out infinite; }
  .hoofd {
    transform-origin: 100px 62px;
    transform-box: view-box;
    transition: transform 0.4s;
  }
  .denk .hoofd { transform: rotate(-7deg); }
  .arm-links {
    transform-origin: 76px 90px;
    transform-box: view-box;
  }
  .arm-rechts {
    transform-origin: 124px 90px;
    transform-box: view-box;
  }
  .juich .arm-rechts, .dans .arm-rechts, .draai .arm-rechts { animation: zwaai 0.65s ease-in-out infinite alternate; }
  .juich .arm-links { animation: zwaai-links 0.65s ease-in-out infinite alternate; }
  .zwaai {
    transform-box: view-box;
    animation: slinger 2.4s ease-in-out infinite;
  }
  .zwaai.omgekeerd { animation-direction: reverse; }
  .ogen {
    transform-origin: 100px 29px;
    transform-box: view-box;
    animation: knipper 5.5s infinite;
  }
  .glitter { animation: twinkel 1.6s ease-in-out infinite; }
  .glitter:nth-child(odd) { animation-delay: -0.8s; }
  .licht { animation: licht 2.4s ease-in-out infinite; }
  .stil * { animation: none !important; }
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
  @keyframes draai {
    0% { transform: scaleX(1) translateY(0); }
    25% { transform: scaleX(0.2) translateY(-16px); }
    50% { transform: scaleX(-1) translateY(-22px); }
    75% { transform: scaleX(-0.2) translateY(-16px); }
    100% { transform: scaleX(1) translateY(0); }
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
  @keyframes twinkel {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes licht {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .lijf, .arm-rechts, .arm-links, .zwaai, .ogen, .glitter, .licht { animation: none !important; }
  }
</style>
