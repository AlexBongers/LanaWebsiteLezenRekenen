<script lang="ts">
  /**
   * Baas-demon: gemengde opdrachten (sommen en flitswoorden).
   * Elk goed antwoord zingt een hartje van de baas weg. Hij gaat altijd uiteindelijk weg;
   * hoe vaak het meteen goed was bepaalt de sterren.
   */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Lana from '../art/Lana.svelte';
  import Demon from '../art/Demon.svelte';
  import GetallenLijn from '../ui/GetallenLijn.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import { maakSom, REKEN_NIVEAUS, type Som } from '../engine/generator-rekenen';
  import { LEES_NIVEAUS, maakFlitsOpgaven, type FlitsOpgave } from '../engine/generator-lezen';
  import { STEDEN } from '../engine/tour';
  import { spreek, somDelen, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelPoef, speelFanfare } from '../audio/geluid';
  import { vg } from '../store/voortgang.svelte';
  import { teksten, uitZak, wacht } from './teksten';
  import type { SpelProps } from './types';
  import type { Resultaat } from '../engine/sessie';

  let { opNoten, opVoortgang, opKlaar, intro, stadId = 'seoel' }: SpelProps = $props();

  const HARTJES = 5;
  type Opgave = { soort: 'som'; som: Som } | { soort: 'woord'; woord: FlitsOpgave };

  const stadNr = Math.max(0, STEDEN.findIndex((s) => s.id === stadId));
  const rekenNiveau = REKEN_NIVEAUS[Math.min(vg.vaardigheden.rekenen.niveau, REKEN_NIVEAUS.length - 1)];
  const leesNiveau = LEES_NIVEAUS[Math.min(vg.vaardigheden.flits.niveau, LEES_NIVEAUS.length - 1)];
  const woorden = maakFlitsOpgaven(leesNiveau, 12);
  let woordTeller = 0;

  function nieuweOpgave(soort: 'som' | 'woord'): Opgave {
    if (soort === 'som') return { soort, som: maakSom(rekenNiveau, { verhaalKans: 0 }) };
    return { soort, woord: woorden[woordTeller++ % woorden.length] };
  }

  let rij: Opgave[] = $state(['som', 'woord', 'som', 'woord', 'som'].map((s) => nieuweOpgave(s as 'som' | 'woord')));
  let index = $state(0);
  let hartjes = $state(HARTJES);
  let pogingen = $state(0);
  let fout: (number | string)[] = $state([]);
  let flitsen = $state(false);
  let onthuld = $state(false);
  let bezig = $state(true);
  let geraakt = $state(false);
  let lacht = $state(false);
  let verslagen = $state(false);
  let aanval = $state(0);
  let groep: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let baasEl: HTMLElement | undefined = $state();
  const resultaten: Resultaat[] = [];
  const noteer = (goed: boolean) =>
    resultaten.push({ id: `baas.${resultaten.length}`, niveau: 0, bron: 'niveau', goed });

  let opgave = $derived(rij[index]);

  onMount(() => {
    (async () => {
      if (intro) await spreek(intro);
      await start();
    })();
    return stopSpreken;
  });

  async function start() {
    pogingen = 0;
    fout = [];
    onthuld = false;
    groep = 'dans';
    if (opgave.soort === 'woord') {
      await spreek(teksten.baas.woord);
      await flits(vg.flitstijd * 1.3);
    } else {
      bezig = false;
      await spreek(somDelen(opgave.som.a, opgave.som.op, opgave.som.b), 'getal');
    }
  }

  async function flits(duur: number) {
    bezig = true;
    flitsen = true;
    await wacht(duur);
    flitsen = false;
    bezig = false;
  }

  function isGoed(k: number | string) {
    return opgave.soort === 'som' ? k === opgave.som.antwoord : k === opgave.woord.woord;
  }

  async function kies(k: number | string) {
    if (bezig || onthuld || verslagen || fout.includes(k)) return;
    if (isGoed(k)) {
      bezig = true;
      speelGoed();
      groep = Math.random() < 0.5 ? 'juich' : 'draai';
      aanval++;
      noteer(pogingen === 0);
      opNoten(pogingen === 0 ? 2 : 1, baasEl);
      await wacht(550);
      speelPoef();
      geraakt = true;
      hartjes--;
      opVoortgang((HARTJES - hartjes) / HARTJES);
      setTimeout(() => (geraakt = false), 600);
      if (hartjes <= 0) {
        verslagen = true;
        await wacht(400);
        speelFanfare();
        await spreek(teksten.baas.weg);
        await wacht(600);
        opKlaar(resultaten);
        return;
      }
      await spreek(uitZak('raak', teksten.baas.raak));
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      pogingen++;
      lacht = true;
      groep = 'denk';
      setTimeout(() => (lacht = false), 1400);
      if (pogingen >= 2) {
        onthuld = true;
        noteer(false);
        // De baas krijgt een extra opgave van dezelfde soort.
        rij = [...rij, nieuweOpgave(opgave.soort)];
        await spreek(teksten.hetIs);
        if (opgave.soort === 'som') await spreek(somDelen(opgave.som.a, opgave.som.op, opgave.som.b, opgave.som.antwoord), 'getal');
        else await spreek(opgave.woord.woord, 'woord');
      } else {
        await spreek(teksten.baas.lacht);
        if (opgave.soort === 'woord') await flits(Math.min(3000, vg.flitstijd * 1.8));
      }
    }
  }

  function volgende() {
    index++;
    // Zorg dat er altijd genoeg opdrachten klaarstaan voor de hartjes die over zijn.
    while (rij.length - index < hartjes) rij = [...rij, nieuweOpgave(rij.length % 2 ? 'woord' : 'som')];
    void start();
  }

  const verder = volgende;
</script>

<div class="gevecht">
  <!-- Opdracht -->
  <div class="opdracht">
    {#key index}
      <div class="kaart">
        {#if opgave.soort === 'som'}
          <div class="som">
            <span>{opgave.som.a}</span>
            <span class="op">{opgave.som.op === '+' ? '+' : '−'}</span>
            <span>{opgave.som.b}</span>
            <span class="op">=</span>
            <span class="vraag" class:onthuld>{onthuld ? opgave.som.antwoord : '?'}</span>
          </div>
          <Luidspreker klein opTik={() => spreek(somDelen(opgave.som.a, opgave.som.op, opgave.som.b), 'getal')} />
        {:else}
          <div class="flitsvak" data-woord={opgave.woord.woord}>
            {#if flitsen || onthuld}
              <span class="woord" class:onthuld>{opgave.woord.woord}</span>
            {:else}
              <span class="vraag">?</span>
            {/if}
          </div>
        {/if}
      </div>
    {/key}

    {#if opgave.soort === 'som' && pogingen >= 1}
      <div class="hint"><GetallenLijn sprongen={opgave.som.sprongen} /></div>
    {/if}

    <div class="keuzes" class:verborgen={opgave.soort === 'woord' && flitsen}>
      {#if opgave.soort === 'som'}
        {#each opgave.som.keuzes as k (index + '-' + k)}
          <button class="keuze" class:fout={fout.includes(k)} class:goed={onthuld && k === opgave.som.antwoord} onclick={() => kies(k)}>{k}</button>
        {/each}
      {:else}
        {#each opgave.woord.keuzes as k (index + '-' + k)}
          <button class="keuze woordknop" class:fout={fout.includes(k)} class:goed={onthuld && k === opgave.woord.woord} onclick={() => kies(k)}>{k}</button>
        {/each}
      {/if}
      {#if onthuld}
        <button class="knop-goud verder" onclick={verder}>Verder ➜</button>
      {/if}
    </div>
  </div>

  <!-- De groep -->
  <div class="groep">
    <Heldin wie="rumi" stemming={groep} hoogte={315} />
    <Heldin wie="mira" stemming={groep} hoogte={315} />
    <Lana avatar={vg.avatar} stemming={groep} hoogte={315} />
    <Heldin wie="zoey" stemming={groep} hoogte={315} />
  </div>

  <!-- Zing-aanval: noten vliegen naar de baas -->
  {#key aanval}
    {#if aanval > 0}
      <div class="aanval" aria-hidden="true">
        {#each ['♪', '♫', '♬', '♪', '♫'] as n, i}
          <span style="animation-delay:{i * 0.06}s; --y:{(i - 2) * 26}px">{n}</span>
        {/each}
      </div>
    {/if}
  {/key}

  <!-- De baas -->
  <div class="baas" class:geraakt class:verslagen bind:this={baasEl}>
    <div class="hartjes" aria-label="{hartjes} hartjes">
      {#each Array.from({ length: HARTJES }, (_, i) => i) as i}
        <span class:weg={i >= hartjes}>💜</span>
      {/each}
    </div>
    <div class="baaslijf">
      <span class="kroon">👑</span>
      <Demon soort={stadNr * 7 + 3} grootte={250} />
      {#if lacht}<span class="haha">Hahaha!</span>{/if}
    </div>
    <div class="baasnaam">{STEDEN[stadNr].baas}</div>
  </div>
</div>

<style>
  .gevecht {
    position: absolute;
    inset: 0;
  }
  .opdracht {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    z-index: 2;
  }
  .kaart {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 520px;
    justify-content: center;
    padding: 10px 30px;
    border-radius: 28px;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
    border: 3px solid rgba(253, 230, 138, 0.6);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 0 30px rgba(245, 158, 11, 0.15);
    backdrop-filter: blur(6px);
    animation: pop-in 0.4s ease-out;
  }
  .som {
    display: flex;
    gap: 18px;
    font-size: 72px;
    font-weight: 700;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .op {
    color: var(--goud);
  }
  .vraag {
    color: #f9a8d4;
    min-width: 1.3em;
    text-align: center;
  }
  .onthuld {
    color: #86efac;
  }
  .flitsvak {
    height: 96px;
    display: grid;
    place-items: center;
  }
  .woord {
    font-family: var(--font-lees);
    font-size: 84px;
    font-weight: 700;
    text-shadow: 0 0 24px rgba(255, 255, 255, 0.8);
    animation: pop-in 0.12s ease-out;
  }
  .flitsvak .vraag {
    font-size: 84px;
    opacity: 0.4;
  }
  .hint {
    width: 640px;
    height: 120px;
    margin-top: -6px;
  }
  .keuzes {
    display: flex;
    gap: 18px;
    align-items: center;
    transition: opacity 0.2s;
  }
  .keuzes.verborgen {
    opacity: 0;
    pointer-events: none;
  }
  .keuze {
    min-width: 120px;
    padding: 10px 22px;
    border-radius: 22px;
    font-size: 48px;
    font-weight: 700;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffaf0, #fde68a);
    border: 4px solid #fff;
    box-shadow: 0 6px 0 #b45309, 0 10px 20px rgba(0, 0, 0, 0.35);
    animation: pop-in 0.35s ease-out backwards, zweef 2.5s ease-in-out 0.35s infinite;
  }
  .keuze:nth-child(2n) { animation-duration: 0.35s, 2.1s; }
  .keuze:nth-child(3n) { animation-duration: 0.35s, 2.9s; }
  @keyframes zweef {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -7px; }
  }
  .woordknop {
    font-family: var(--font-lees);
    font-size: 44px;
    background: linear-gradient(180deg, #ffffff, #ede9fe);
    box-shadow: 0 6px 0 #7c3aed, 0 10px 20px rgba(0, 0, 0, 0.35);
  }
  .keuze:active {
    transform: translateY(4px);
  }
  .keuze.fout {
    animation: schud 0.5s ease-in-out;
    opacity: 0.4;
    filter: grayscale(1);
  }
  .keuze.goed {
    background: linear-gradient(180deg, #f0fdf4, #86efac);
    box-shadow: 0 6px 0 #15803d, 0 0 30px rgba(134, 239, 172, 0.9);
  }
  .groep {
    position: absolute;
    left: 20px;
    bottom: 10px;
    display: flex;
    align-items: flex-end;
    gap: 0;
  }
  .baas {
    position: absolute;
    right: 40px;
    bottom: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.3s;
  }
  .baaslijf {
    position: relative;
    animation: baas-zweef 2.6s ease-in-out infinite;
  }
  .kroon {
    position: absolute;
    left: 50%;
    top: -18px;
    translate: -50% 0;
    font-size: 64px;
    rotate: 10deg;
    z-index: 1;
  }
  .haha {
    position: absolute;
    right: -30px;
    top: 10px;
    padding: 6px 16px;
    border-radius: 18px;
    background: #fff;
    color: #b91c1c;
    font-size: 28px;
    font-weight: 700;
    rotate: 8deg;
    animation: pop-in 0.3s ease-out;
  }
  .hartjes {
    display: flex;
    gap: 4px;
    font-size: 36px;
    margin-bottom: 4px;
  }
  .hartjes span {
    transition: transform 0.4s, opacity 0.4s, filter 0.4s;
  }
  .hartjes .weg {
    opacity: 0.25;
    filter: grayscale(1);
    transform: scale(0.7);
  }
  .baasnaam {
    padding: 4px 20px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid #f59e0b;
    font-size: 26px;
    font-weight: 700;
    color: #fde68a;
  }
  .geraakt .baaslijf {
    animation: au 0.5s ease-out;
    filter: brightness(2) saturate(0.5);
  }
  .verslagen .baaslijf {
    animation: verdwijn 1s ease-in forwards;
  }
  .aanval span {
    position: absolute;
    left: 360px;
    bottom: 230px;
    font-size: 54px;
    color: #fde68a;
    text-shadow: 0 0 16px #fbbf24, 0 0 30px #ec4899;
    animation: vlieg 0.6s ease-in forwards;
    opacity: 0;
  }
  @keyframes vlieg {
    0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translate(560px, var(--y)) scale(1.3) rotate(30deg); opacity: 0.2; }
  }
  @keyframes baas-zweef {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-12px) rotate(2deg); }
  }
  @keyframes au {
    0% { transform: translateX(0) rotate(0); }
    25% { transform: translateX(24px) rotate(12deg); }
    60% { transform: translateX(-10px) rotate(-6deg); }
    100% { transform: translateX(0) rotate(0); }
  }
  @keyframes verdwijn {
    0% { transform: scale(1) rotate(0); opacity: 1; }
    40% { transform: scale(1.2) rotate(-20deg); opacity: 1; }
    100% { transform: scale(0) rotate(540deg) translateY(-200px); opacity: 0; }
  }
</style>
