<script lang="ts">
  /** Rumi: Sterrenregen. Rumi zegt een woord; tik de vallende ster met dat woord. */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Sterren3D from './Sterren3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakSterrenregen, type SterOpgave } from '../engine/generator-fase5';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<SterOpgave>(
    maakSterrenregen(niveau, aantal).map((o) => ({ opgave: o, id: `ster.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: string[] = $state([]);
  let juist: number | null = $state(null);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let drieD = $state(heeftWebGL());
  let vlakEl: HTMLElement | undefined = $state();
  let knopEls: HTMLElement[] = $state([]);
  const bron = (i: number) => (drieD ? (vlakEl ?? null) : knopEls[i]);

  onMount(() => {
    (async () => {
      await spreek(teksten.sterren.start);
      await zegWoord();
    })();
  });

  async function zegWoord() {
    speelTik();
    bezig = false;
    await spreek(o.woord, 'woord');
  }

  async function kies(w: string, i: number) {
    if (bezig || ronde.onthuld || fout.includes(w)) return;
    if (w === o.woord) {
      bezig = true;
      juist = i;
      speelGoed();
      glitterOp(bron(i));
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), bron(i));
      await spreek(o.woord, 'woord');
      await spreek(compliment('rumi'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, w];
      stemming = 'denk';
      if (ronde.fout(w) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(o.woord, 'woord');
      } else {
        await spreek(bijna());
        await spreek(o.woord, 'woord');
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    juist = null;
    stemming = 'rust';
    void wacht(900).then(zegWoord);
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#8b5cf6" />
    <Duo wie="rumi" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="luister">
      <span>Welk woord hoor je?</span>
      <Luidspreker opTik={() => spreek(o.woord, 'woord')} />
    </div>
    {#if drieD}
      <div class="hemel" bind:this={vlakEl}>
        <Sterren3D
          woorden={o.keuzes}
          fout={o.keuzes.map((k, i) => (fout.includes(k) ? i : -1)).filter((i) => i >= 0)}
          goed={ronde.onthuld ? o.keuzes.indexOf(o.woord) : juist}
          actief={!bezig && !ronde.onthuld}
          sleutel={ronde.nummer}
          opKies={(i) => kies(o.keuzes[i], i)}
          opFout={() => (drieD = false)}
        />
      </div>
    {/if}
    {#key ronde.nummer}
      <div class="keuzerij" class:onzichtbaar-3d={drieD}>
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop woordknop"
            class:fout={fout.includes(k)}
            class:goed={ronde.onthuld && k === o.woord}
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
  .luister {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 14px 8px 26px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 30px;
    font-weight: 700;
    color: #e9d5ff;
  }
  .hemel {
    width: 960px;
    height: 470px;
    -webkit-mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 70%, transparent 100%);
    mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 70%, transparent 100%);
  }
  .woordknop {
    font-family: var(--font-lees);
    font-size: 54px;
  }
</style>
