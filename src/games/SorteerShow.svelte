<script lang="ts">
  /** Zoey: Sorteer-show. Lees het woord op het pakje en tik de mand waar het in hoort. */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Sorteer3D from './Sorteer3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakSorteer, type SorteerOpgave } from '../engine/generator-sorteer';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<SorteerOpgave>(
    maakSorteer(niveau, aantal).map((o) => ({ opgave: o, id: `sorteer.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: number[] = $state([]);
  let juist: number | null = $state(null);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let drieD = $state(heeftWebGL());
  let vlakEl: HTMLElement | undefined = $state();
  let knopEls: HTMLElement[] = $state([]);
  const bron = (i: number) => (drieD ? (vlakEl ?? null) : knopEls[i]);

  onMount(() => {
    void spreek(teksten.sorteer.start);
  });

  async function kies(i: number) {
    if (bezig || ronde.onthuld || fout.includes(i)) return;
    if (i === o.goed) {
      bezig = true;
      juist = i;
      speelGoed();
      glitterOp(bron(i));
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), bron(i));
      await spreek(o.woord, 'woord');
      await spreek(o.bakken[i].naam, 'woord');
      if (Math.random() < 0.5) await spreek(compliment('zoey'));
      await wacht(500);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, i];
      stemming = 'denk';
      if (ronde.fout(o.bakken[i].id) === 'onthuld') {
        juist = o.goed;
        await spreek(o.woord, 'woord');
        await spreek(o.bakken[o.goed].naam, 'woord');
      } else {
        await spreek(bijna());
        await spreek(teksten.sorteer.hint);
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    juist = null;
    bezig = false;
    stemming = 'dans';
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#06b6d4" />
    <Duo wie="zoey" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <p class="vraag">Lees het woord op het pakje. In welke mand hoort het?</p>
    {#if drieD}
      <div class="fabriek" bind:this={vlakEl}>
        <Sorteer3D
          woord={o.woord}
          bakken={o.bakken}
          goed={juist}
          {fout}
          actief={!bezig && !ronde.onthuld}
          sleutel={ronde.nummer}
          opKies={kies}
          opFout={() => (drieD = false)}
        />
      </div>
    {:else}
      {#key ronde.nummer}
        <div class="pakje">{o.woord}</div>
      {/key}
    {/if}
    {#key ronde.nummer}
      <div class="keuzerij" class:onzichtbaar-3d={drieD}>
        {#each o.bakken as b, i (b.id)}
          <button
            class="keuzeknop mand"
            class:fout={fout.includes(i)}
            class:goed={(juist !== null || ronde.onthuld) && i === o.goed}
            bind:this={knopEls[i]}
            onclick={() => kies(i)}>{b.icoon} {b.naam}</button
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
  .vraag {
    margin: 0;
    padding: 6px 24px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 26px;
    font-weight: 700;
    color: #a5f3fc;
  }
  .fabriek {
    width: 960px;
    height: 500px;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }
  .pakje {
    padding: 20px 50px;
    border-radius: 16px;
    background: #d6a35c;
    color: #2e1065;
    font-family: var(--font-lees);
    font-size: 80px;
    font-weight: 700;
  }
  .mand {
    min-width: 220px;
    font-size: 38px;
  }
</style>
