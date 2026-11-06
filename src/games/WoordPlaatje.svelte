<script lang="ts">
  /** Rumi: Woord bij plaatje. Lees het woord (niet voorgelezen) en tik het goede plaatje. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import { maakPlaatjes, type PlaatjeOpgave } from '../engine/generator-fase3';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<PlaatjeOpgave>(
    maakPlaatjes(niveau, aantal).map((o) => ({ opgave: o, id: `plaatje.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: string[] = $state([]);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let knopEls: HTMLElement[] = $state([]);

  onMount(() => {
    void spreek(teksten.plaatje.start);
    return stopSpreken;
  });

  async function kies(woord: string, i: number) {
    if (bezig || ronde.onthuld || fout.includes(woord)) return;
    if (woord === o.woord) {
      bezig = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      await spreek(o.woord, 'woord');
      await spreek(compliment('rumi'));
      await wacht(200);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, woord];
      stemming = 'denk';
      if (ronde.fout(woord) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(o.woord, 'woord');
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
    <Tekstballon kleur="#8b5cf6" />
    <Heldin wie="rumi" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    {#key ronde.nummer}
      <div class="opdrachtkaart">
        <!-- Hint na een fout: de eerste letter licht op -->
        <div class="leeswoord" style="font-size:{Math.min(110, Math.floor(820 / o.woord.length))}px">
          {#if ronde.pogingen > 0}<span class="hint-goud">{o.woord[0]}</span>{o.woord.slice(1)}{:else}{o.woord}{/if}
        </div>
      </div>
      <div class="keuzerij">
        {#each o.keuzes as k, i (k.woord)}
          <button
            class="keuzeknop plaatje"
            class:fout={fout.includes(k.woord)}
            class:goed={ronde.onthuld && k.woord === o.woord}
            style="animation-delay:{i * 0.1}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k.woord, i)}
            aria-label="Plaatje {i + 1}"
          >
            <span class="emoji">{k.emoji}</span>
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
  .plaatje {
    width: 220px;
    height: 200px;
  }
  .emoji {
    font-size: 120px;
    line-height: 1;
    font-family: 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
  }
</style>
