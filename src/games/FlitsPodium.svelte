<script lang="ts">
  /** Rumi: Flits-podium. Een woord flitst in de spotlight; welk woord zag je? */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import {
    FLITS_MAX,
    FLITS_MIN,
    nieuweFlitstijd,
    type FlitsOpgave,
  } from '../engine/generator-lezen';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { vg } from '../store/voortgang.svelte';
  import type { Gepland, Resultaat } from '../engine/sessie';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, intro, opgaven = [], auditie = false }: SpelProps<FlitsOpgave> = $props();

  // svelte-ignore state_referenced_locally
  let rij: Gepland<FlitsOpgave>[] = $state([...opgaven]);
  const resultaten: Resultaat[] = [];
  let eersteFout: string | undefined;
  const opnieuw = new Set<number>();

  let index = $state(0);
  let fase: 'klaar' | 'flits' | 'kiezen' | 'wacht' | 'goed' | 'onthuld' = $state('klaar');
  let pogingen = $state(0);
  let fout: string[] = $state([]);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' = $state('rust');
  let podiumEl: HTMLElement | undefined = $state();

  let item = $derived(rij[index]);
  let opgave = $derived(item.opgave);
  // Lange woorden: kleinere letters, zodat de drie knoppen altijd naast elkaar passen.
  let letters = $derived(opgave.keuzes.reduce((n, k) => n + k.length, 0));
  let keuzeMaat = $derived(Math.min(54, Math.floor(1200 / Math.max(letters, 1))));
  let woordMaat = $derived(Math.min(124, Math.floor(900 / Math.max(opgave.woord.length, 1))));
  let bliksems = $derived(Math.max(1, Math.ceil(((FLITS_MAX - vg.flitstijd) / (FLITS_MAX - FLITS_MIN)) * 5)));

  onMount(() => {
    (async () => {
      if (intro) await spreek(intro);
      if (auditie) await spreek(teksten.auditie.start);
      await spreek(teksten.flits.start);
    })();
    return stopSpreken;
  });

  async function flits(duur: number) {
    stopSpreken();
    speelTik();
    fase = 'flits';
    await wacht(duur);
    fase = 'kiezen';
    void spreek(teksten.flits.vraag);
  }

  async function kies(woord: string) {
    if (fase !== 'kiezen' || fout.includes(woord)) return;
    if (woord === opgave.woord) {
      fase = 'goed';
      speelGoed();
      glitterOp(podiumEl ?? null);
      stemming = 'juich';
      if (!opnieuw.has(index)) {
        resultaten.push({ id: item.id, niveau: item.niveau, bron: item.bron, goed: pogingen === 0, gekozen: eersteFout });
        if (pogingen === 0) vg.flitstijd = nieuweFlitstijd(vg.flitstijd, true);
      }
      opNoten(pogingen === 0 ? 2 : 1, podiumEl);
      await spreek(opgave.woord, 'woord');
      await spreek(compliment());
      await wacht(200);
      volgende();
    } else {
      speelBijna();
      if (pogingen === 0 && !opnieuw.has(index)) eersteFout = woord;
      fout = [...fout, woord];
      pogingen++;
      stemming = 'denk';
      if (!opnieuw.has(index) && pogingen === 1) vg.flitstijd = nieuweFlitstijd(vg.flitstijd, false);
      if (pogingen >= 2) {
        fase = 'onthuld';
        if (!opnieuw.has(index)) {
          resultaten.push({ id: item.id, niveau: item.niveau, bron: item.bron, goed: false, gekozen: eersteFout });
          rij = [...rij, { ...item }];
          opnieuw.add(rij.length - 1);
        }
        await spreek(teksten.hetIs);
        await spreek(opgave.woord, 'woord');
      } else {
        fase = 'wacht';
        await wacht(500);
        await spreek(teksten.flits.nogEens);
        stemming = 'rust';
        await flits(Math.min(FLITS_MAX, vg.flitstijd * 1.6));
      }
    }
  }

  function volgende() {
    const klaar = index + 1;
    opVoortgang(klaar / rij.length);
    if (klaar >= rij.length) {
      opKlaar(resultaten);
      return;
    }
    index = klaar;
    pogingen = 0;
    eersteFout = undefined;
    fout = [];
    stemming = 'rust';
    fase = 'klaar';
  }
</script>

<div class="spel">
  <div class="heldin">
    <Tekstballon kleur="#8b5cf6" />
    <Heldin wie="rumi" {stemming} hoogte={420} />
  </div>

  <div class="midden">
    <div class="snelheid" aria-label="Flitssnelheid {bliksems} van 5">
      <span>Flitssnelheid</span>
      {#each [1, 2, 3, 4, 5] as b}
        <span class="bliksem" class:aan={b <= bliksems}>⚡</span>
      {/each}
    </div>

    <div class="podium" bind:this={podiumEl}>
      <div class="lichtbundel" class:aan={fase === 'flits' || fase === 'goed' || fase === 'onthuld'}></div>
      {#if fase === 'klaar'}
        {#key index}
          <button class="ster" onclick={() => flits(vg.flitstijd)} aria-label="Laat het woord zien">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient id="ster-goud" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#fff7c2" />
                  <stop offset="0.5" stop-color="#fbbf24" />
                  <stop offset="1" stop-color="#d97706" />
                </linearGradient>
              </defs>
              <path
                d="M50 5 l13 27 30 4 -22 21 5 30 -26 -14 -26 14 5 -30 -22 -21 30 -4z"
                fill="url(#ster-goud)"
                stroke="#fff7c2"
                stroke-width="3"
                stroke-linejoin="round"
              />
            </svg>
            <span>Tik!</span>
          </button>
        {/key}
      {:else if fase === 'flits' || fase === 'goed' || fase === 'onthuld'}
        <div class="woord" class:goed={fase === 'goed'} class:onthuld={fase === 'onthuld'} style="font-size:{woordMaat}px">{opgave.woord}</div>
        {#if fase === 'onthuld'}
          <div class="luid"><Luidspreker opTik={() => spreek(opgave.woord, 'woord')} /></div>
        {/if}
      {:else}
        <div class="vraag">?</div>
      {/if}
    </div>

    <div class="keuzes" class:zichtbaar={fase === 'kiezen' || fase === 'goed' || fase === 'onthuld'}>
      {#each opgave.keuzes as k, i (index + k)}
        <button
          class="keuze"
          class:fout={fout.includes(k)}
          class:goed={(fase === 'goed' || fase === 'onthuld') && k === opgave.woord}
          style="animation-delay:{i * 0.1}s; font-size:{keuzeMaat}px"
          onclick={() => kies(k)}
          disabled={fase !== 'kiezen'}>{k}</button
        >
      {/each}
    </div>

    {#if fase === 'onthuld'}
      <button class="knop-goud verder" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .spel {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 290px 1fr;
  }
  .heldin {
    position: relative;
    align-self: end;
    justify-self: center;
    padding-bottom: 16px;
  }
  .midden {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    padding: 0 32px 28px 0;
  }
  .snelheid {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 18px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 22px;
    color: #c4b5fd;
  }
  .snelheid > span:first-child {
    margin-right: 8px;
  }
  .bliksem {
    font-size: 26px;
    filter: grayscale(1) opacity(0.3);
  }
  .bliksem.aan {
    filter: drop-shadow(0 0 6px #fbbf24);
  }
  .podium {
    position: relative;
    width: 720px;
    height: 300px;
    display: grid;
    place-items: center;
    border-radius: 50% / 40%;
    background:
      radial-gradient(ellipse at 50% 60%, rgba(139, 92, 246, 0.35), transparent 70%),
      radial-gradient(ellipse at 50% 100%, rgba(251, 191, 36, 0.2), transparent 60%);
  }
  .podium::after {
    content: '';
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: 6px;
    height: 46px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(253, 230, 138, 0.45), transparent 70%);
    border-top: 3px solid rgba(253, 230, 138, 0.5);
  }
  .lichtbundel {
    position: absolute;
    inset: -120px 15% 0;
    background: linear-gradient(180deg, transparent, rgba(255, 247, 194, 0.35));
    clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }
  .lichtbundel.aan {
    opacity: 1;
  }
  .ster {
    position: relative;
    width: 200px;
    height: 200px;
    animation: pop-in 0.5s ease-out, puls 1.6s ease-in-out 0.5s infinite;
    filter: drop-shadow(0 0 24px rgba(251, 191, 36, 0.8));
  }
  .ster svg {
    width: 100%;
    height: 100%;
  }
  .ster span {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding-top: 18px;
    font-size: 40px;
    font-weight: 700;
    color: #78350f;
  }
  .woord {
    position: relative;
    z-index: 1;
    font-family: var(--font-lees);
    font-size: 124px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.7), 0 0 60px rgba(167, 139, 250, 0.9);
    animation: flits-in 0.12s ease-out;
  }
  .woord.goed {
    color: #fde68a;
    text-shadow: 0 0 30px rgba(251, 191, 36, 0.9);
    animation: pop-in 0.4s ease-out;
  }
  .woord.onthuld {
    color: #bbf7d0;
  }
  .luid {
    position: absolute;
    right: 40px;
    top: 40px;
  }
  .vraag {
    font-size: 140px;
    font-weight: 700;
    color: rgba(196, 181, 253, 0.35);
    animation: pop-in 0.3s ease-out;
  }
  .keuzes {
    display: flex;
    gap: 24px;
    max-width: 100%;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .keuzes.zichtbaar {
    opacity: 1;
    pointer-events: auto;
  }
  .keuze {
    flex: 0 1 auto;
    min-width: 200px;
    max-width: 320px;
    white-space: nowrap;
    padding: 18px 22px;
    border-radius: 26px;
    font-family: var(--font-lees);
    font-size: 54px;
    font-weight: 700;
    color: var(--inkt);
    background: linear-gradient(180deg, #ffffff, #ede9fe);
    border: 4px solid #fff;
    box-shadow: 0 7px 0 #7c3aed, 0 12px 24px rgba(0, 0, 0, 0.35);
    animation: pop-in 0.4s ease-out backwards;
    transition: transform 0.1s;
  }
  .keuze:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 2px 0 #7c3aed;
  }
  .keuze:disabled {
    cursor: default;
  }
  .keuze.fout {
    animation: schud 0.5s ease-in-out;
    opacity: 0.4;
    filter: grayscale(1);
  }
  .keuze.goed {
    background: linear-gradient(180deg, #f0fdf4, #86efac);
    box-shadow: 0 7px 0 #15803d, 0 0 32px rgba(134, 239, 172, 0.9);
  }
  .verder {
    position: absolute;
    right: 40px;
    bottom: 150px;
    animation: pop-in 0.4s ease-out;
  }
  @keyframes puls {
    0%, 100% { transform: scale(1) rotate(0); }
    50% { transform: scale(1.08) rotate(4deg); }
  }
  @keyframes flits-in {
    from { transform: scale(1.4); opacity: 0; }
  }
</style>
