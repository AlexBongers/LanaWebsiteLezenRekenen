<script lang="ts">
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Demon from '../art/Demon.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import characters from '../../content/characters.json';
  import teksten from '../../content/teksten.json';
  import { MEIDEN, STEDEN, baasOpen, stadGered, type PodiumId } from '../engine/tour';
  import { vg } from '../store/voortgang.svelte';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelTik } from '../audio/geluid';

  let { stadId, opKies, opTerug }: { stadId: string; opKies: (p: PodiumId) => void; opTerug: () => void } = $props();

  const vaardigheid = { rumi: 'flits', mira: 'rekenen', zoey: 'verhaal' } as const;
  let stad = $derived(STEDEN.find((s) => s.id === stadId) ?? STEDEN[0]);
  let stadNr = $derived(STEDEN.findIndex((s) => s.id === stadId));
  let gekozen: PodiumId | null = $state(null);
  let schud = $state(false);
  let baasKan = $derived(baasOpen(stadId, vg.tour));
  let gered = $derived(stadGered(stadId, vg.tour));

  onMount(() => {
    void spreek(stad.welkom);
    return stopSpreken;
  });

  function kies(p: PodiumId) {
    if (gekozen) return;
    if (p === 'baas' && !baasKan) {
      speelBijna();
      schud = true;
      setTimeout(() => (schud = false), 500);
      void spreek(teksten.tour.baasDicht);
      return;
    }
    speelTik();
    gekozen = p;
    setTimeout(() => opKies(p), 700);
  }

  const sterren = (p: PodiumId) => vg.tour[stadId]?.[p] ?? 0;
</script>

<div class="stad" style="--stad:{stad.kleur}">
  <header>
    <button class="knop-rond" onclick={opTerug} aria-label="Terug naar de wereldtour">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="titel">
      <span class="embleem">{stad.embleem}</span>
      <div>
        <h1>{stad.naam}</h1>
        <p>{stad.zaal}</p>
      </div>
    </div>
    <NotenTeller aantal={vg.noten} />
  </header>

  <div class="kaarten">
    {#each MEIDEN as h, i}
      {@const c = characters[h]}
      <button
        class="kaart"
        class:gekozen={gekozen === h}
        class:weg={gekozen !== null && gekozen !== h}
        style="--kleur:{c.kleur}; animation-delay:{i * 0.1}s"
        onclick={() => kies(h)}
      >
        <div class="figuur">
          <Heldin wie={h} stemming={gekozen === h ? 'juich' : 'rust'} hoogte={360} />
        </div>
        <div class="naambord">
          <span class="naam">{c.naam}</span>
          <span class="vak">{c.vak}</span>
          <span class="ster-rij">
            {#each [1, 2, 3] as n}<span class:aan={sterren(h) >= n}>★</span>{/each}
          </span>
          <span class="uitleg">{c.uitleg} · level {vg.vaardigheden[vaardigheid[h]].niveau + 1}</span>
        </div>
      </button>
    {/each}

    <button
      class="kaart baas"
      class:dicht={!baasKan}
      class:gered
      class:schud
      class:gekozen={gekozen === 'baas'}
      class:weg={gekozen !== null && gekozen !== 'baas'}
      style="--kleur:#f59e0b; animation-delay:0.3s"
      onclick={() => kies('baas')}
    >
      <div class="figuur baasfiguur">
        <span class="kroon">👑</span>
        <Demon soort={stadNr * 7 + 3} grootte={210} />
        {#if !baasKan}<span class="slot">🔒</span>{/if}
      </div>
      <div class="naambord">
        <span class="naam">{stad.baas}</span>
        <span class="vak">Baas-demon</span>
        {#if gered}
          <span class="ster-rij">{#each [1, 2, 3] as n}<span class:aan={sterren('baas') >= n}>★</span>{/each}</span>
          <span class="uitleg">Weggezongen! Speel gerust nog eens.</span>
        {:else if baasKan}
          <span class="uitleg klaar">Hij is er! Tik om te vechten!</span>
        {:else}
          <span class="uitleg">Speel eerst bij Rumi, Mira en Zoey</span>
        {/if}
      </div>
    </button>
  </div>
</div>

<style>
  .stad {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 14px 24px 22px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .titel {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .embleem {
    font-size: 56px;
    filter: drop-shadow(0 0 14px var(--stad));
  }
  h1 {
    margin: 0;
    font-size: 44px;
    line-height: 1;
    text-shadow: 0 0 24px var(--stad);
  }
  .titel p {
    margin: 2px 0 0;
    font-size: 20px;
    color: #fde68a;
  }
  .kaarten {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    padding-top: 14px;
  }
  .kaart {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
    padding: 0 6px 14px;
    border-radius: 32px;
    background:
      radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--kleur) 55%, transparent), transparent 70%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03));
    border: 3px solid color-mix(in srgb, var(--kleur) 70%, white);
    box-shadow: 0 0 30px color-mix(in srgb, var(--kleur) 50%, transparent);
    animation: kaart-in 0.6s ease-out backwards, kaart-dein 4s ease-in-out 0.6s infinite;
    transition: transform 0.3s, opacity 0.3s;
  }
  .kaart:nth-child(2) { animation-duration: 0.6s, 4.6s; }
  .kaart:nth-child(3) { animation-duration: 0.6s, 3.6s; }
  .kaart:nth-child(4) { animation-duration: 0.6s, 4.2s; }
  @keyframes kaart-dein {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -6px; }
  }
  .kaart:active {
    transform: scale(0.97);
  }
  .kaart.gekozen {
    transform: scale(1.05);
    box-shadow: 0 0 60px var(--kleur), 0 0 0 6px #fde68a;
  }
  .kaart.weg {
    opacity: 0.25;
    transform: scale(0.94);
  }
  .baas {
    background:
      radial-gradient(ellipse at 50% 40%, rgba(245, 158, 11, 0.45), transparent 70%),
      repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0 14px, transparent 14px 28px),
      linear-gradient(180deg, rgba(127, 29, 29, 0.6), rgba(30, 10, 50, 0.6));
  }
  .baas.dicht {
    filter: grayscale(0.7) brightness(0.7);
  }
  .baas.schud {
    animation: schud 0.5s ease-in-out;
  }
  .figuur {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .baasfiguur {
    position: relative;
    align-items: center;
  }
  .kroon {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -175px;
    font-size: 54px;
    rotate: -12deg;
    z-index: 1;
  }
  .slot {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    font-size: 70px;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6));
  }
  .naambord {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-top: 6px;
    text-align: center;
  }
  .naam {
    font-size: 38px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    text-shadow: 0 3px 0 color-mix(in srgb, var(--kleur) 60%, black), 0 0 20px var(--kleur);
  }
  .vak {
    font-size: 22px;
    font-weight: 600;
    color: #fde68a;
  }
  .ster-rij {
    font-size: 30px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.25);
    line-height: 1;
  }
  .ster-rij .aan {
    color: #fbbf24;
    text-shadow: 0 0 10px rgba(251, 191, 36, 0.9);
  }
  .uitleg {
    font-size: 17px;
    color: #e9d5ff;
  }
  .uitleg.klaar {
    color: #fde68a;
    font-weight: 700;
    animation: knipper 1.2s ease-in-out infinite;
  }
  @keyframes kaart-in {
    from { transform: translateY(60px); opacity: 0; }
  }
  @keyframes knipper {
    50% { opacity: 0.5; }
  }
</style>
