<script lang="ts">
  /** Mira: Verliefde harten. Welk getal hoort bij dit getal om samen het grote getal te maken? */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Harten3D from './Harten3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakHarten, type HartOpgave } from '../engine/generator-fase6';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<HartOpgave>(
    maakHarten(niveau, aantal).map((o) => ({ opgave: o, id: `hart.${o.totaal}=${o.deel}+${o.antwoord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: number[] = $state([]);
  let juist = $state(false);
  let wiebel = $state(0);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let drieD = $state(heeftWebGL());
  let knopEls: HTMLElement[] = $state([]);

  const zegSom = () => spreek([String(o.totaal), 'is', String(o.deel), 'plus'], 'getal');

  onMount(() => {
    (async () => {
      await spreek(teksten.harten.start);
      bezig = false;
      await zegSom();
    })();
  });

  async function kies(k: number, i: number) {
    if (bezig || ronde.onthuld || fout.includes(k)) return;
    if (k === o.antwoord) {
      bezig = true;
      juist = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      await spreek([String(o.totaal), 'is', String(o.deel), 'plus', String(o.antwoord)], 'getal');
      await spreek(Math.random() < 0.4 ? teksten.harten.samen : compliment('mira'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      wiebel++;
      stemming = 'denk';
      if (ronde.fout(String(k)) === 'onthuld') {
        juist = true;
        await spreek([String(o.totaal), 'is', String(o.deel), 'plus', String(o.antwoord)], 'getal');
      } else {
        await spreek(bijna());
        await spreek(teksten.harten.hint);
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    juist = false;
    bezig = false;
    stemming = 'dans';
    void wacht(500).then(zegSom);
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Duo wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    {#key ronde.nummer}
      <div class="somkaart">
        <span>{o.totaal}</span>
        <span class="is">=</span>
        <span>{o.deel}</span>
        <span class="is">+</span>
        <span class="vraag" class:goed={juist}>{juist ? o.antwoord : '?'}</span>
        <Luidspreker opTik={zegSom} klein />
      </div>
    {/key}
    <div class="hartvlak">
      {#if drieD}
        <Harten3D totaal={o.totaal} deel={o.deel} antwoord={o.antwoord} toon={juist} {wiebel} sleutel={ronde.nummer} opFout={() => (drieD = false)} />
      {:else}
        <div class="plat-hart">
          <span class="half links">{o.deel}</span><span class="half rechts">{juist ? o.antwoord : '?'}</span>
        </div>
      {/if}
    </div>
    {#key ronde.nummer}
      <div class="keuzerij">
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop getalknop"
            class:fout={fout.includes(k)}
            class:goed={juist && k === o.antwoord}
            style="animation-delay:{i * 0.1}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}>{k}</button
          >
        {/each}
      </div>
    {/key}
    {#if ronde.onthuld}
      <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .somkaart {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 18px 8px 30px;
    border-radius: 26px;
    font-size: 60px;
    font-weight: 700;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
    border: 3px solid rgba(249, 168, 212, 0.6);
    animation: pop-in 0.4s ease-out;
  }
  .is {
    color: var(--goud);
  }
  .vraag {
    min-width: 1.2em;
    text-align: center;
    color: #f9a8d4;
  }
  .vraag.goed {
    color: #86efac;
  }
  .hartvlak {
    width: 760px;
    height: 360px;
    display: grid;
    place-items: center;
    -webkit-mask-image: radial-gradient(ellipse 60% 66% at 50% 50%, #000 72%, transparent 100%);
    mask-image: radial-gradient(ellipse 60% 66% at 50% 50%, #000 72%, transparent 100%);
  }
  .plat-hart {
    display: flex;
    gap: 6px;
  }
  .half {
    display: grid;
    place-items: center;
    width: 150px;
    height: 200px;
    font-size: 80px;
    font-weight: 700;
    background: #f472b6;
  }
  .half.links {
    border-radius: 100px 20px 20px 100px;
  }
  .half.rechts {
    border-radius: 20px 100px 100px 20px;
    background: #c026d3;
  }
  .getalknop {
    min-width: 150px;
    font-size: 60px;
    font-family: var(--font-titel);
  }
</style>
