<script lang="ts">
  /** Mira: Tafel-ritme. Een beat speelt, de reeks wordt opgezegd; welk getal komt hierna? */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import { maakTafels, type TafelOpgave } from '../engine/generator-fase3';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<TafelOpgave>(
    // Gesorteerd per tafel: dan hoort ze de tafel een paar keer achter elkaar.
    maakTafels(niveau, aantal)
      .sort((a, b) => a.tafel - b.tafel)
      .map((o) => ({ opgave: o, id: `tafel.${o.tafel}x${o.antwoord / o.tafel}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let getoond = $state(0); // hoeveel getallen van de reeks al in beeld zijn
  let fout: number[] = $state([]);
  let bezig = $state(true);
  let pols = $state(0);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let knopEls: HTMLElement[] = $state([]);
  let vorigeTafel = 0;
  let gestopt = false;

  const TAFELNAAM = teksten.tafels.tafel as Record<string, string>;

  onMount(() => {
    // Een zachte beat (geen klok die afloopt).
    const beat = setInterval(() => {
      pols++;
      if (!bezig) speelTik();
    }, 650);
    (async () => {
      await spreek(teksten.tafels.start);
      await speelReeks();
    })();
    return () => {
      gestopt = true;
      clearInterval(beat);
    };
  });

  async function speelReeks() {
    bezig = true;
    getoond = 0;
    if (o.tafel !== vorigeTafel) {
      vorigeTafel = o.tafel;
      await spreek(TAFELNAAM[String(o.tafel)] ?? '');
    }
    for (let i = 0; i < o.reeks.length; i++) {
      if (gestopt) return;
      getoond = i + 1;
      await spreek(String(o.reeks[i]), 'getal');
      await wacht(180);
    }
    getoond = o.reeks.length;
    bezig = false;
  }

  async function kies(n: number, i: number) {
    if (bezig || ronde.onthuld || fout.includes(n)) return;
    if (n === o.antwoord) {
      bezig = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      await spreek(String(n), 'getal');
      await spreek(compliment('mira'));
      await wacht(200);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, n];
      stemming = 'denk';
      if (ronde.fout(String(n)) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(String(o.antwoord), 'getal');
      } else {
        await spreek(bijna());
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    stemming = 'dans';
    void speelReeks();
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Duo wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="tafel">Tafel van {o.tafel}</div>
    {#key ronde.nummer}
      <div class="reeks">
        {#each o.reeks as n, i}
          <div class="tegel" class:zichtbaar={i < getoond}>{n}</div>
          <span class="pijl">+{o.tafel}</span>
        {/each}
        <div class="tegel vraag" class:goed={ronde.onthuld}>{ronde.onthuld ? o.antwoord : '?'}</div>
        <div class="luid"><Luidspreker opTik={speelReeks} /></div>
      </div>
      <div class="keuzerij">
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop getalknop"
            class:fout={fout.includes(k)}
            class:goed={ronde.onthuld && k === o.antwoord}
            style="animation-delay:{i * 0.1}s"
            disabled={bezig && !ronde.onthuld}
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}>{k}</button
          >
        {/each}
      </div>
    {/key}
    <div class="beat" aria-hidden="true">
      {#each [0, 1, 2, 3] as b}<span class:aan={pols % 4 === b}></span>{/each}
    </div>
    {#if ronde.onthuld}
      <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .tafel {
    padding: 6px 26px;
    border-radius: 999px;
    font-size: 30px;
    font-weight: 700;
    background: linear-gradient(90deg, #ec4899, #f59e0b);
  }
  .reeks {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding-right: 80px;
  }
  .tegel {
    display: grid;
    place-items: center;
    width: 130px;
    height: 120px;
    border-radius: 26px;
    font-size: 64px;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.12);
    border: 3px solid rgba(249, 168, 212, 0.6);
    opacity: 0.15;
    transform: scale(0.8);
    transition: all 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .tegel.zichtbaar {
    opacity: 1;
    transform: scale(1);
  }
  .tegel.vraag {
    opacity: 1;
    transform: scale(1);
    color: #f9a8d4;
    border-style: dashed;
  }
  .tegel.vraag.goed {
    color: #86efac;
    border-color: #86efac;
  }
  .pijl {
    font-size: 22px;
    color: #fde68a;
  }
  .luid {
    position: absolute;
    right: 0;
  }
  .getalknop {
    min-width: 170px;
    font-size: 64px;
    font-family: var(--font-titel);
  }
  .getalknop:disabled {
    opacity: 0.6;
  }
  .beat {
    display: flex;
    gap: 14px;
  }
  .beat span {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.1s;
  }
  .beat span.aan {
    background: #f472b6;
    box-shadow: 0 0 16px #f472b6;
    transform: scale(1.3);
  }
</style>
