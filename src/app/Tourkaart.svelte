<script lang="ts">
  import { onMount } from 'svelte';
  import Lana from '../art/Lana.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import OuderSlot from './OuderSlot.svelte';
  import { STEDEN, MEIDEN, huidigeStad, stadGered, stadOpen, totaalSterren, tourKlaar } from '../engine/tour';
  import { vg } from '../store/voortgang.svelte';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelTik } from '../audio/geluid';
  import teksten from '../../content/teksten.json';

  let {
    opStad,
    opKleedkamer,
    opOuder,
    opStoppen,
  }: { opStad: (id: string) => void; opKleedkamer: () => void; opOuder: () => void; opStoppen: () => void } = $props();

  // Posities van de steden op de kaart (procent van de kaart).
  const PLEK = [
    { x: 9, y: 74 },
    { x: 25, y: 34 },
    { x: 42, y: 70 },
    { x: 58, y: 30 },
    { x: 75, y: 66 },
    { x: 90, y: 26 },
  ];

  let huidig = $derived(huidigeStad(vg.tour));
  let huidigIndex = $derived(STEDEN.findIndex((s) => s.id === huidig.id));
  let geschud: string | null = $state(null);

  // Kronkelpad door alle steden (viewBox 1000 x 600).
  function pad(tot: number) {
    let d = `M ${PLEK[0].x * 10} ${PLEK[0].y * 6}`;
    for (let i = 1; i <= tot; i++) {
      const a = PLEK[i - 1];
      const b = PLEK[i];
      const mx = ((a.x + b.x) / 2) * 10;
      d += ` C ${mx} ${a.y * 6}, ${mx} ${b.y * 6}, ${b.x * 10} ${b.y * 6}`;
    }
    return d;
  }

  onMount(() => {
    void spreek(tourKlaar(vg.tour) ? teksten.tour.klaar : teksten.tour.start);
  });

  function kies(i: number) {
    const stad = STEDEN[i];
    if (!stadOpen(i, vg.tour)) {
      speelBijna();
      geschud = stad.id;
      setTimeout(() => (geschud = null), 500);
      void spreek(teksten.tour.dicht);
      return;
    }
    speelTik();
    opStad(stad.id);
  }
</script>

<div class="tour">
  <header>
    <OuderSlot opOpen={opOuder} />
    <h1 class="goudtekst">Wereldtour</h1>
    <div class="rechts">
      <div class="sterren-totaal">⭐ {totaalSterren(vg.tour)}</div>
      <NotenTeller aantal={vg.noten} />
      <button class="stoppen" onclick={opStoppen} aria-label="Stoppen met spelen">
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
          <path d="M12 3 v8" stroke="#fff" stroke-width="2.8" stroke-linecap="round" />
          <path d="M6.3 6.8 a8 8 0 1 0 11.4 0" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" />
        </svg>
        <span>Stoppen</span>
      </button>
    </div>
  </header>

  <div class="kaart">
    <svg class="paden" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
      <path d={pad(STEDEN.length - 1)} class="pad-toekomst" />
      <path d={pad(huidigIndex)} class="pad-gedaan" />
    </svg>

    <span class="vliegtuig" aria-hidden="true">✈️</span>
    {#each STEDEN as stad, i}
      {@const open = stadOpen(i, vg.tour)}
      {@const gered = stadGered(stad.id, vg.tour)}
      <button
        class="stad"
        class:open
        class:gered
        class:huidig={stad.id === huidig.id}
        class:schud={geschud === stad.id}
        style="left:{PLEK[i].x}%; top:{PLEK[i].y}%; --kleur:{stad.kleur}; animation-delay:{i * 0.08}s"
        onclick={() => kies(i)}
        aria-label={stad.naam}
      >
        <span class="bol">
          <span class="embleem">{open ? stad.embleem : '🔒'}</span>
          {#if gered}<span class="vlag">⭐</span>{/if}
        </span>
        <span class="naam">{stad.naam}</span>
        {#if open}
          <span class="podia">
            {#each MEIDEN as m}
              <span class="punt {m}" class:aan={(vg.tour[stad.id]?.[m] ?? 0) > 0}></span>
            {/each}
            <span class="punt baas" class:aan={gered}></span>
          </span>
        {/if}
      </button>
    {/each}

    <div class="lana" style="left:{PLEK[huidigIndex].x}%; top:{PLEK[huidigIndex].y}%">
      <Lana avatar={vg.avatar} hoogte={175} stemming="dans" />
    </div>
  </div>

  <button class="knop-goud kleedkamer" onclick={opKleedkamer}>👗 Kleedkamer</button>
</div>

<style>
  .tour {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px 26px 20px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h1 {
    margin: 0;
    font-size: 58px;
  }
  .rechts {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .stoppen {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 60px;
    padding: 0 20px 0 14px;
    border-radius: 999px;
    font-size: 22px;
    font-weight: 700;
    background: rgba(239, 68, 68, 0.75);
    border: 3px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  }
  .sterren-totaal {
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    border: 2px solid rgba(253, 230, 138, 0.5);
    font-size: 28px;
    font-weight: 700;
    color: #fde68a;
  }
  .kaart {
    position: relative;
    flex: 1;
    margin: 8px 30px 70px;
  }
  .paden {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .pad-toekomst {
    fill: none;
    stroke: rgba(196, 181, 253, 0.35);
    stroke-width: 6;
    stroke-dasharray: 4 14;
    stroke-linecap: round;
    animation: mieren 1.2s linear infinite;
  }
  @keyframes mieren {
    to { stroke-dashoffset: -36; }
  }
  .vliegtuig {
    position: absolute;
    left: -60px;
    top: 12%;
    font-size: 44px;
    animation: vlieg 14s linear 1s infinite;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
  }
  @keyframes vlieg {
    0% { transform: translate(0, 0) rotate(8deg); }
    50% { transform: translate(60vw, -30px) rotate(-4deg); }
    100% { transform: translate(115vw, 10px) rotate(8deg); }
  }
  .pad-gedaan {
    fill: none;
    stroke: #fbbf24;
    stroke-width: 9;
    stroke-linecap: round;
    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.9));
  }
  .stad {
    position: absolute;
    translate: -50% -50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    animation: pop-in 0.5s ease-out backwards;
  }
  .bol {
    position: relative;
    display: grid;
    place-items: center;
    width: 112px;
    height: 112px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #6b7280, #374151);
    border: 5px solid #9ca3af;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    transition: transform 0.15s;
  }
  .open .bol {
    animation: dein 3s ease-in-out infinite;
  }
  .stad:nth-child(odd) .bol { animation-delay: -1.5s; }
  @keyframes dein {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -7px; }
  }
  .open .bol {
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--kleur) 50%, white), var(--kleur) 60%, color-mix(in srgb, var(--kleur) 60%, black));
    border-color: #fde68a;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45), 0 0 26px var(--kleur);
  }
  .huidig .bol {
    animation: puls 1.6s ease-in-out infinite, dein 3s ease-in-out infinite;
  }
  .stad:active .bol {
    transform: scale(0.92);
  }
  .embleem {
    font-size: 56px;
    line-height: 1;
    filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.3));
  }
  .vlag {
    position: absolute;
    right: -8px;
    top: -8px;
    font-size: 36px;
    filter: drop-shadow(0 0 8px #fbbf24);
  }
  .naam {
    padding: 2px 14px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.45);
    font-size: 22px;
    font-weight: 700;
    white-space: nowrap;
  }
  .podia {
    display: flex;
    gap: 5px;
  }
  .punt {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.4);
  }
  .punt.aan.rumi { background: #8b5cf6; border-color: #fff; }
  .punt.aan.mira { background: #ec4899; border-color: #fff; }
  .punt.aan.zoey { background: #06b6d4; border-color: #fff; }
  .punt.baas { border-radius: 3px; }
  .punt.aan.baas { background: #fbbf24; border-color: #fff; }
  .schud .bol {
    animation: schud 0.5s ease-in-out;
  }
  .lana {
    position: absolute;
    translate: 18px -96%;
    pointer-events: none;
    transition: left 1s, top 1s;
  }
  .kleedkamer {
    position: absolute;
    left: 28px;
    bottom: 22px;
    z-index: 2;
  }
  @keyframes puls {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
</style>
