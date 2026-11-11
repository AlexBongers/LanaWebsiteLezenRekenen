<script lang="ts">
  /**
   * Zoey: Letter-dictee. Zoey zegt een woord (met een plaatje als steuntje);
   * Lana bouwt het woord klank voor klank met letterblokjes. Er liggen ook twee lastige blokjes tussen.
   */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Bouw3D from './Bouw3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakDictee, type DicteeOpgave } from '../engine/generator-fase6';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<DicteeOpgave>(
    maakDictee(niveau, aantal).map((o) => ({ opgave: o, id: `dictee.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let alle = $derived([...o.klanken, ...o.extra]);
  let geplaatst = $state(0);
  let fouten: number[] = $state([]);
  let klaar = $state(false);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let drieD = $state(heeftWebGL());
  let vlakEl: HTMLElement | undefined = $state();

  onMount(() => {
    (async () => {
      await spreek(teksten.dictee.start);
      await zegWoord();
    })();
  });

  async function zegWoord() {
    bezig = false;
    await spreek(o.woord, 'woord');
  }

  async function tik(j: number) {
    if (bezig || klaar) return;
    // Hetzelfde klankje kan twee keer in een woord zitten (kikker): elk blokje met de goede klank is goed
    if (j < o.klanken.length && j >= geplaatst && alle[j] === o.klanken[geplaatst]) {
      speelTik();
      geplaatst++;
      if (geplaatst === o.klanken.length) await af(false);
    } else if (j >= geplaatst || j >= o.klanken.length) {
      speelBijna();
      fouten = [...fouten, j];
      stemming = 'denk';
      if (ronde.fout(alle[j]) === 'onthuld') {
        bezig = true;
        geplaatst = o.klanken.length;
        await wacht(500 + o.klanken.length * 200);
        await af(true);
      } else {
        await spreek(bijna());
        await spreek(teksten.dictee.hint);
        await spreek(o.woord, 'woord');
      }
    }
  }

  async function af(onthuld: boolean) {
    bezig = true;
    klaar = true;
    speelGoed();
    glitterOp(vlakEl ?? null);
    stemming = Math.random() < 0.5 ? 'juich' : 'draai';
    if (!onthuld) opNoten(ronde.goed(), vlakEl ?? null);
    await wacht(700);
    await spreek(o.woord, 'woord');
    if (!onthuld) await spreek(Math.random() < 0.5 ? teksten.dictee.goed : compliment('zoey'));
    await wacht(onthuld ? 900 : 300);
    volgende();
  }

  function volgende() {
    if (!ronde.volgende()) return;
    geplaatst = 0;
    fouten = [];
    klaar = false;
    stemming = 'dans';
    void wacht(700).then(zegWoord);
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#06b6d4" />
    <Duo wie="zoey" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="opdracht">
      <span class="plaatje" aria-hidden="true">{o.emoji}</span>
      <span>Schrijf het woord</span>
      <Luidspreker opTik={() => spreek(o.woord, 'woord')} />
    </div>
    {#if drieD}
      <div class="werkplaats" bind:this={vlakEl}>
        <Bouw3D
          delen={o.klanken}
          extra={o.extra}
          door={o.door}
          {geplaatst}
          {fouten}
          {klaar}
          actief={!bezig && !klaar}
          sleutel={ronde.nummer}
          opKies={tik}
          opFout={() => (drieD = false)}
        />
      </div>
    {/if}
    {#key ronde.nummer}
      <div class:onzichtbaar-3d={drieD} class="plat">
        <div class="gebouwd">
          {#each o.klanken as k, j}
            <span class="vak" class:vol={j < geplaatst}>{j < geplaatst ? k : ''}</span>
          {/each}
        </div>
        <div class="keuzerij">
          {#each o.door as j (j)}
            <button class="keuzeknop letter" class:weg={j < geplaatst && j < o.klanken.length} class:fout={fouten.at(-1) === j} onclick={() => tik(j)}>{alle[j]}</button>
          {/each}
        </div>
      </div>
    {/key}
  </div>
</div>

<style>
  .opdracht {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 6px 14px 6px 18px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 30px;
    font-weight: 700;
    color: #a5f3fc;
  }
  .plaatje {
    font-size: 54px;
    line-height: 1;
    font-family: 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
  }
  .werkplaats {
    width: 960px;
    height: 470px;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }
  .plat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .gebouwd {
    display: flex;
    gap: 8px;
  }
  .vak {
    min-width: 90px;
    height: 90px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    border: 3px dashed rgba(165, 243, 252, 0.6);
    font-family: var(--font-lees);
    font-size: 56px;
    font-weight: 700;
  }
  .vak.vol {
    border-style: solid;
    background: #fffdf7;
    color: var(--inkt);
  }
  .letter {
    min-width: 100px;
    font-family: var(--font-lees);
    font-size: 56px;
  }
  .letter.weg {
    visibility: hidden;
  }
</style>
