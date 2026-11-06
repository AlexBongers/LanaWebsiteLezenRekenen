<script lang="ts">
  /** Nachtelijke stad met sterren, spotlights en een zacht gouden schild. */
  let { accent = '#8b5cf6' }: { accent?: string } = $props();

  // Zwevende muzieknoten en glinsters
  const noten = Array.from({ length: 16 }, (_, i) => ({
    teken: ['♪', '♫', '✦', '♬', '✧', '♩'][i % 6],
    x: (i * 47 + 7) % 100,
    duur: 14 + (i % 5) * 3,
    vertraging: -((i * 3.7) % 18),
    grootte: 18 + (i % 4) * 8,
    kleur: ['#fde68a', '#f9a8d4', '#c4b5fd', '#a5f3fc'][i % 4],
  }));

  const sterren = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: ((i * 61.8) % 62) + 1,
    r: 1 + ((i * 7) % 3) * 0.7,
    d: (i % 7) * 0.6,
  }));
</script>

<div class="achtergrond" style="--accent:{accent}">
  <div class="lucht"></div>
  <svg class="sterren" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    {#each sterren as s}
      <circle cx={s.x} cy={s.y} r={s.r * 0.12} fill="#fff" style="animation-delay:{s.d}s" />
    {/each}
  </svg>
  <div class="schild"></div>
  <span class="vallend v1"></span>
  <span class="vallend v2"></span>
  <span class="vallend v3"></span>
  <div class="noten">
    {#each noten as n}
      <span
        style="left:{n.x}%; font-size:{n.grootte}px; color:{n.kleur}; animation-duration:{n.duur}s; animation-delay:{n.vertraging}s"
        >{n.teken}</span
      >
    {/each}
  </div>
  <div class="spot spot-1"></div>
  <div class="spot spot-2"></div>
  <div class="spot spot-3"></div>
  <svg class="stad" viewBox="0 0 1280 220" preserveAspectRatio="none" aria-hidden="true">
    <path
      fill="#0b0420"
      d="M0 220 V140 h40 v-30 h30 v40 h26 v-70 h34 v70 h22 v-40 h40 v-30 h12 v-40 h6 v40 h12 v30 h30 v60 h28 v-90 h44 v90 h20 v-50 h36 v-20 h30 v70 h24 v-110 h10 v-30 h4 v-28 h4 v28 h4 v30 h10 v110 h30 v-60 h40 v40 h26 v-80 h50 v80 h20 v-40 h34 v-20 h30 v60 h30 v-100 h40 v100 h24 v-50 h30 v30 h36 v-70 h28 v70 h30 v-40 h40 v60 h30 v-30 h40 v40 h40 V220 Z"
    />
    <g fill="#fde68a" opacity="0.55">
      {#each Array.from({ length: 46 }, (_, i) => i) as i}
        <rect x={(i * 97) % 1260 + 10} y={150 + ((i * 37) % 55)} width="5" height="7" rx="1" />
      {/each}
    </g>
  </svg>
  <div class="vloer"></div>
</div>

<style>
  .achtergrond {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
  }
  .lucht {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%),
      radial-gradient(ellipse 60% 40% at 15% 85%, rgba(236, 72, 153, 0.25), transparent 70%),
      radial-gradient(ellipse 60% 40% at 85% 85%, rgba(34, 211, 238, 0.18), transparent 70%),
      linear-gradient(180deg, #1b0b3a 0%, #12062b 55%, #0b0420 100%);
    transition: background 0.8s;
  }
  .sterren {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .sterren circle {
    animation: twinkel 3s ease-in-out infinite;
  }
  .schild {
    position: absolute;
    left: 50%;
    top: -70vh;
    width: 160vw;
    height: 120vh;
    transform: translateX(-50%);
    border-radius: 50%;
    border-bottom: 3px solid rgba(253, 230, 138, 0.35);
    box-shadow: 0 30px 80px -20px rgba(251, 191, 36, 0.35);
    background-image:
      radial-gradient(circle at 50% 100%, rgba(251, 191, 36, 0.12), transparent 40%);
    animation: schild-glow 6s ease-in-out infinite;
  }
  .vallend {
    position: absolute;
    width: 140px;
    height: 3px;
    border-radius: 3px;
    background: linear-gradient(90deg, transparent, #fff 70%, #fde68a);
    filter: drop-shadow(0 0 6px #fff);
    opacity: 0;
    rotate: 20deg;
  }
  .v1 { top: 8%; left: 10%; animation: val 9s ease-in 2s infinite; }
  .v2 { top: 18%; left: 55%; animation: val 13s ease-in 6s infinite; }
  .v3 { top: 4%; left: 35%; animation: val 17s ease-in 11s infinite; }
  @keyframes val {
    0% { transform: translateX(0); opacity: 0; }
    2% { opacity: 1; }
    8% { transform: translateX(420px); opacity: 0; }
    100% { transform: translateX(420px); opacity: 0; }
  }
  .noten span {
    position: absolute;
    bottom: -40px;
    opacity: 0;
    text-shadow: 0 0 12px currentColor;
    animation: stijg linear infinite;
  }
  @keyframes stijg {
    0% { transform: translateY(0) translateX(0) rotate(-10deg); opacity: 0; }
    10% { opacity: 0.55; }
    50% { transform: translateY(-55vh) translateX(30px) rotate(10deg); }
    85% { opacity: 0.4; }
    100% { transform: translateY(-110vh) translateX(-20px) rotate(-10deg); opacity: 0; }
  }
  .spot {
    position: absolute;
    bottom: -10vh;
    width: 34vw;
    height: 130vh;
    background: linear-gradient(0deg, color-mix(in srgb, var(--accent) 35%, transparent), transparent 85%);
    clip-path: polygon(46% 100%, 54% 100%, 100% 0, 0 0);
    filter: blur(6px);
    transform-origin: 50% 100%;
    opacity: 0.55;
    mix-blend-mode: screen;
  }
  .spot-1 { left: 2vw; animation: zwaai 9s ease-in-out infinite; }
  .spot-2 { left: 33vw; animation: zwaai 11s ease-in-out infinite reverse; background: linear-gradient(0deg, rgba(251, 191, 36, 0.3), transparent 85%); }
  .spot-3 { right: 2vw; animation: zwaai 10s ease-in-out -3s infinite; }
  .stad {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 24vh;
  }
  .vloer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 5vh;
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.5));
  }
  @keyframes twinkel {
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
  }
  @keyframes zwaai {
    0%, 100% { transform: rotate(-14deg); }
    50% { transform: rotate(14deg); }
  }
  @keyframes schild-glow {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
</style>
