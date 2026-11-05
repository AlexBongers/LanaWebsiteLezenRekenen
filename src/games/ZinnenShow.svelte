<script lang="ts">
  /** Zoey: Zinnen-show. Lees de zin en kies het plaatje dat erbij past. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import { maakZinnen, type ZinOpgave } from '../engine/generator-fase3';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<ZinOpgave>(
    maakZinnen(aantal).map((o) => ({ opgave: o, id: `zin.${o.zin}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: string[] = $state([]);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' = $state('rust');
  let knopEls: HTMLElement[] = $state([]);

  onMount(() => {
    void spreek(teksten.zinnen.start);
    return stopSpreken;
  });

  async function kies(k: ZinOpgave['keuzes'][number], i: number) {
    if (bezig || ronde.onthuld || fout.includes(k.zin)) return;
    if (k.zin === o.zin) {
      bezig = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = 'juich';
      opNoten(ronde.goed(), knopEls[i]);
      await spreek(compliment());
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k.zin];
      stemming = 'denk';
      if (ronde.fout(k.plaatje) === 'onthuld') {
        await spreek(o.zin, 'zin');
      } else {
        await spreek(bijna());
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    bezig = false;
    stemming = 'rust';
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#06b6d4" />
    <Heldin wie="zoey" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    {#key ronde.nummer}
      <div class="zinkaart">
        <p class="zin">{o.zin}</p>
        <Luidspreker opTik={() => spreek(o.zin, 'zin')} klein />
      </div>
      <div class="keuzerij">
        {#each o.keuzes as k, i (k.zin)}
          <button
            class="keuzeknop scene"
            class:fout={fout.includes(k.zin)}
            class:goed={ronde.onthuld && k.zin === o.zin}
            style="animation-delay:{i * 0.1}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}
            aria-label="Plaatje {i + 1}"
          >
            <span class="emoji">{k.plaatje}</span>
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
  .zinkaart {
    display: flex;
    align-items: center;
    gap: 20px;
    max-width: 880px;
    padding: 22px 30px;
    border-radius: 28px;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffdf7, #fdf4ff);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.5), 0 16px 40px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.45s ease-out;
  }
  .zinkaart :global(.knop-rond) {
    flex: none;
    background: #06b6d4;
    border-color: #a5f3fc;
  }
  .zin {
    margin: 0;
    font-family: var(--font-lees);
    font-size: 44px;
    line-height: 1.4;
    word-spacing: 0.14em;
  }
  .scene {
    width: 250px;
    height: 190px;
  }
  .emoji {
    font-size: 76px;
    line-height: 1;
    letter-spacing: -4px;
    white-space: nowrap;
  }
</style>
