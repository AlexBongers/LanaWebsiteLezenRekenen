<script lang="ts">
  /** Zoey: Blokken-bouwer. Zoey zegt een woord; tik de klankblokjes in de goede volgorde. */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Bouw3D from './Bouw3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakBouw, type BouwOpgave } from '../engine/generator-fase5';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<BouwOpgave>(
    maakBouw(niveau, aantal).map((o) => ({ opgave: o, id: `bouw.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let geplaatst = $state(0);
  let fouten: number[] = $state([]);
  let klaar = $state(false);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let drieD = $state(heeftWebGL());
  let vlakEl: HTMLElement | undefined = $state();

  onMount(() => {
    (async () => {
      await spreek(teksten.bouwen.start);
      await zegWoord();
    })();
  });

  async function zegWoord() {
    bezig = false;
    await spreek(o.woord, 'woord');
  }

  async function tik(j: number) {
    if (bezig || klaar || j < geplaatst) return;
    if (j === geplaatst) {
      speelTik();
      geplaatst++;
      if (geplaatst === o.delen.length) await af(false);
    } else {
      speelBijna();
      fouten = [...fouten, j];
      stemming = 'denk';
      if (ronde.fout(String(j)) === 'onthuld') {
        bezig = true;
        geplaatst = o.delen.length;
        await wacht(400 + o.delen.length * 200);
        await af(true);
      } else {
        await spreek(bijna());
        await spreek(teksten.bouwen.hint);
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
    if (!onthuld) await spreek(compliment('zoey'));
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
    <div class="luister">
      <span>Bouw het woord dat je hoort</span>
      <Luidspreker opTik={() => spreek(o.woord, 'woord')} />
    </div>
    {#if drieD}
      <div class="bouwplaats" bind:this={vlakEl}>
        <Bouw3D
          delen={o.delen}
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
          {#each o.delen as d, j}
            <span class="vak" class:vol={j < geplaatst}>{j < geplaatst ? d : ''}</span>
          {/each}
        </div>
        <div class="keuzerij">
          {#each o.door as j (j)}
            <button class="keuzeknop deel" class:weg={j < geplaatst} class:fout={fouten.at(-1) === j} onclick={() => tik(j)}>{o.delen[j]}</button>
          {/each}
        </div>
      </div>
    {/key}
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
    color: #a5f3fc;
  }
  .bouwplaats {
    width: 960px;
    height: 480px;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
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
    min-width: 120px;
    height: 90px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    border: 3px dashed rgba(165, 243, 252, 0.6);
    font-family: var(--font-lees);
    font-size: 54px;
    font-weight: 700;
  }
  .vak.vol {
    border-style: solid;
    background: #fffdf7;
    color: var(--inkt);
  }
  .deel {
    font-family: var(--font-lees);
    font-size: 54px;
  }
  .deel.weg {
    visibility: hidden;
  }
</style>
