<script lang="ts">
  /** Zoey: Rijm-rap. Zoey rapt een woord; welk geschreven woord rijmt erop? */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import { maakRijm, type RijmOpgave } from '../engine/generator-fase3';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<RijmOpgave>(
    maakRijm(niveau, aantal).map((o) => ({ opgave: o, id: `rijm.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: string[] = $state([]);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let knopEls: HTMLElement[] = $state([]);

  /** Het rijmstuk: de laatste klinker(s) met wat erna komt ("maan" → "aan"). */
  const rijmdeel = (w: string) => w.match(/[aeiouy]+[^aeiouy]*$/)?.[0] ?? w;

  onMount(() => {
    (async () => {
      await spreek(teksten.rijm.start);
      await zegWoord();
    })();
    return stopSpreken;
  });

  async function zegWoord() {
    speelTik();
    await spreek(teksten.rijm.vraag);
    await spreek(o.woord, 'woord');
  }

  async function kies(w: string, i: number) {
    if (bezig || ronde.onthuld || fout.includes(w)) return;
    if (w === o.rijm) {
      bezig = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      await spreek(o.woord, 'woord');
      await spreek(o.rijm, 'woord');
      await spreek(compliment('zoey'));
      await wacht(200);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, w];
      stemming = 'denk';
      if (ronde.fout(w) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(o.rijm, 'woord');
      } else {
        await spreek(bijna());
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    bezig = false;
    stemming = 'dans';
    void zegWoord();
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#06b6d4" />
    <Heldin wie="zoey" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="equalizer" aria-hidden="true">
      {#each Array.from({ length: 12 }) as _, i}<span style="animation-delay:{(i * 0.13) % 0.9}s"></span>{/each}
    </div>
    {#key ronde.nummer}
      <div class="opdrachtkaart">
        <div class="leeswoord groot">
          {#if ronde.pogingen > 0}
            {o.woord.slice(0, o.woord.length - rijmdeel(o.woord).length)}<span class="hint-goud">{rijmdeel(o.woord)}</span>
          {:else}{o.woord}{/if}
        </div>
        <div class="luid"><Luidspreker opTik={zegWoord} /></div>
      </div>
      <p class="vraag">Welk woord rijmt erop?</p>
      <div class="keuzerij">
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop"
            class:fout={fout.includes(k)}
            class:goed={ronde.onthuld && k === o.rijm}
            style="animation-delay:{i * 0.1}s; font-size:{Math.min(56, Math.floor(1150 / o.keuzes.join('').length))}px"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}
          >
            {k}
          </button>
        {/each}
      </div>
    {/key}
    {#if ronde.onthuld}
      <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .groot {
    font-size: 100px;
    padding-right: 60px;
  }
  .luid {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
  }
  .vraag {
    margin: 0;
    font-size: 28px;
    color: #a5f3fc;
  }
  .equalizer {
    display: flex;
    gap: 8px;
    height: 46px;
    align-items: end;
  }
  .equalizer span {
    width: 12px;
    border-radius: 6px;
    background: linear-gradient(180deg, #67e8f9, #a855f7);
    animation: bar 0.9s ease-in-out infinite alternate;
  }
  @keyframes bar {
    from { height: 8px; }
    to { height: 46px; }
  }
</style>
