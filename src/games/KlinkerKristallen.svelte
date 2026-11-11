<script lang="ts">
  /** Rumi: Klinker-kristallen. In het woord mist een klank; kies de edelsteen met de goede letters. */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Keuze3D from './Keuze3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakKlinker, type KlinkerOpgave } from '../engine/generator-fase6';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<KlinkerOpgave>(
    maakKlinker(niveau, aantal).map((o) => ({ opgave: o, id: `klinker.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let goedeKlank = $derived(o.klanken[o.gat]);
  let fout: string[] = $state([]);
  let juist: number | null = $state(null);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let drieD = $state(heeftWebGL());
  let vlakEl: HTMLElement | undefined = $state();
  let knopEls: HTMLElement[] = $state([]);
  let woordEl: HTMLElement | undefined = $state();
  const bron = (i: number) => (drieD ? (vlakEl ?? null) : knopEls[i]);
  let ingevuld = $derived(juist !== null || ronde.onthuld);

  onMount(() => {
    (async () => {
      await spreek(teksten.klinker.start);
      await zegWoord();
    })();
  });

  async function zegWoord() {
    bezig = false;
    await spreek(o.woord, 'woord');
  }

  async function kies(k: string, i: number) {
    if (bezig || ronde.onthuld || fout.includes(k)) return;
    if (k === goedeKlank) {
      bezig = true;
      juist = i;
      speelGoed();
      glitterOp(woordEl ?? bron(i));
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), bron(i));
      await spreek(o.woord, 'woord');
      await spreek(compliment('rumi'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      if (ronde.fout(k) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(o.woord, 'woord');
      } else {
        await spreek(bijna());
        await spreek(teksten.klinker.hint);
        await spreek(o.woord, 'woord');
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    juist = null;
    stemming = 'rust';
    void wacht(600).then(zegWoord);
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#8b5cf6" />
    <Duo wie="rumi" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    {#key ronde.nummer}
      <div class="woordkaart" bind:this={woordEl}>
        <span class="plaatje" aria-hidden="true">{o.emoji}</span>
        <span class="woord">
          {#each o.klanken as k, i}
            {#if i === o.gat}
              <span class="gat" class:vol={ingevuld}>{ingevuld ? k : '?'}</span>
            {:else}{k}{/if}
          {/each}
        </span>
        <Luidspreker opTik={() => spreek(o.woord, 'woord')} />
      </div>
    {/key}
    {#if drieD}
      <div class="vlak-3d" bind:this={vlakEl}>
        <Keuze3D
          thema="stenen"
          soort="woord"
          labels={o.keuzes}
          fout={o.keuzes.map((k, i) => (fout.includes(k) ? i : -1)).filter((i) => i >= 0)}
          goed={ronde.onthuld ? o.keuzes.indexOf(goedeKlank) : juist}
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
            class="keuzeknop klank"
            class:fout={fout.includes(k)}
            class:goed={ronde.onthuld && k === goedeKlank}
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
  .woordkaart {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 14px 26px;
    border-radius: 28px;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffdf7, #f5f3ff);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.5), 0 16px 40px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.45s ease-out;
  }
  .woordkaart :global(.luidspreker) {
    background: linear-gradient(180deg, #a78bfa, #7c3aed);
    box-shadow: 0 4px 0 #5b21b6;
  }
  .plaatje {
    font-size: 76px;
    line-height: 1;
    font-family: 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
  }
  .woord {
    font-family: var(--font-lees);
    font-size: 92px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: 2px;
  }
  .gat {
    display: inline-block;
    min-width: 1.1em;
    margin: 0 4px;
    padding: 0 8px;
    border-radius: 14px;
    text-align: center;
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.15);
    border: 4px dashed #a78bfa;
    animation: puls-gat 1.4s ease-in-out infinite;
  }
  .gat.vol {
    color: #15803d;
    background: #dcfce7;
    border: 4px solid #4ade80;
    animation: pop-in 0.4s ease-out;
  }
  .klank {
    min-width: 140px;
    font-family: var(--font-lees);
    font-size: 60px;
  }
  @keyframes puls-gat {
    0%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.5); }
    50% { box-shadow: 0 0 18px 4px rgba(167, 139, 250, 0.7); }
  }
</style>
