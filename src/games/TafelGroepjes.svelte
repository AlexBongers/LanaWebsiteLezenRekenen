<script lang="ts">
  /**
   * Rekenschool: Tafel-groepjes. Vermenigvuldigen met begrip:
   *  - 4 × 5 = 4 groepjes van 5: tik de groepjes aan en tel in sprongen (5, 10, 15, 20).
   *  - Eerst de ankertafels 2, 5 en 10; daarna afleiden met een steunsom (6 × 7 = 5 × 7 + 7).
   *  - Op het hoogste niveau alleen de som (automatiseren); de groepjes komen pas na een fout.
   */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import { maakGroepjes, type GroepjesOpgave } from '../engine/generator-rekenschool';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<GroepjesOpgave>(
    kiesVers('groepjes', maakGroepjes(niveau, aantal * 4).map((o) => ({ opgave: o, id: `tafel.${o.groepen}x${o.per}` })), (x) => x.id, aantal),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let geteld = $state(0);
  let fout: number[] = $state([]);
  let juist = $state(false);
  let bezig = $state(true);
  let toonGroepjes = $state(true);
  let toonSteun = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let knopEls: HTMLElement[] = $state([]);

  const ICONEN = ['🍩', '⭐', '🎵', '💎', '🍭', '🌸', '🎈', '🍓'];
  let icoon = $derived(ICONEN[(o.per + o.groepen) % ICONEN.length]);

  const zegSom = () => spreek([String(o.groepen), 'keer', String(o.per)], 'getal');

  onMount(() => {
    (async () => {
      await spreek(teksten.rekenschool.groepjes);
      await start();
    })();
  });

  async function start() {
    geteld = 0;
    fout = [];
    juist = false;
    // Hoogste niveau: eerst uit het hoofd; bij afleiden staat de steunsom er meteen bij op niveau 1 en 2
    toonGroepjes = niveau < 3;
    toonSteun = niveau >= 1 && niveau <= 2 && o.steun.soort === 'afleiden';
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    await zegSom();
    if (toonGroepjes && niveau === 0) await spreek(teksten.rekenschool.telGroepjes);
  }

  /** Herhaald optellen: elk getikt groepje telt er `per` bij. */
  async function tel(i: number) {
    if (i !== geteld || geteld >= o.groepen) return;
    speelTik();
    geteld++;
    void spreek(String(geteld * o.per), 'getal');
  }

  async function kies(k: number, i: number) {
    if (bezig || ronde.onthuld || fout.includes(k)) return;
    if (k === o.antwoord) {
      bezig = true;
      juist = true;
      geteld = o.groepen;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed() + (o.uitdaging ? 1 : 0), knopEls[i]);
      await spreek([String(o.groepen), 'keer', String(o.per), 'is', String(o.antwoord)], 'getal');
      if (Math.random() < 0.5) await spreek(compliment('mira'));
      await wacht(400);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      bezig = true;
      const uitkomst = ronde.fout(String(k));
      toonGroepjes = true;
      if (o.steun.soort === 'afleiden') {
        toonSteun = true;
        await spreek(teksten.rekenschool.steunsom);
        await spreek(o.steun.spraak, 'getal');
      } else if (uitkomst !== 'onthuld') {
        await spreek(bijna());
        await spreek(teksten.rekenschool.telGroepjes);
      }
      if (uitkomst === 'onthuld') {
        geteld = o.groepen;
        await spreek([String(o.groepen), 'keer', String(o.per), 'is', String(o.antwoord)], 'getal');
      }
      bezig = false;
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    stemming = 'dans';
    void start();
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
        {#if o.uitdaging}<span class="ster">⭐ Uitdaging</span>{/if}
        <span>{o.groepen}</span><span class="op">×</span><span>{o.per}</span><span class="op">=</span>
        <span class="vraag" class:goed={juist || ronde.onthuld}>{juist || ronde.onthuld ? o.antwoord : '?'}</span>
        <Luidspreker opTik={zegSom} klein />
      </div>
    {/key}
    <p class="uitleg">{o.groepen} groepjes van {o.per}</p>

    {#if toonGroepjes}
      <div class="groepjes" class:veel={o.groepen > 5}>
        {#each Array.from({ length: o.groepen }, (_, i) => i) as g (g)}
          <button class="groepje" class:geteld={g < geteld} class:volgende={g === geteld} onclick={() => tel(g)} aria-label="Groepje {g + 1}">
            <span class="dingen" class:breed={o.per > 5} style="grid-template-columns: repeat({Math.min(o.per, 5)}, 1fr)">
              {#each Array.from({ length: o.per }, (_, j) => j) as j (j)}<span class="ding">{icoon}</span>{/each}
            </span>
            {#if g < geteld}<span class="som">{(g + 1) * o.per}</span>{/if}
          </button>
        {/each}
      </div>
      {#if geteld > 0}
        <div class="sprongen">
          {#each Array.from({ length: geteld }, (_, i) => (i + 1) * o.per) as n, i (i)}
            <span class="sprong">{i === 0 ? '' : '+' + o.per + ' → '}<strong>{n}</strong></span>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="uitleg">Weet je hem uit je hoofd?</p>
    {/if}

    {#if toonSteun}
      <div class="steun">💡 {o.steun.tekst}</div>
    {/if}

    {#key ronde.nummer}
      <div class="keuzerij">
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop getalknop"
            class:fout={fout.includes(k)}
            class:goed={(juist || ronde.onthuld) && k === o.antwoord}
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
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 6px 18px 6px 30px;
    border-radius: 26px;
    font-size: 60px;
    font-weight: 700;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
    border: 3px solid rgba(253, 230, 138, 0.6);
    animation: pop-in 0.4s ease-out;
  }
  .ster {
    position: absolute;
    top: -18px;
    left: 18px;
    padding: 2px 12px;
    border-radius: 999px;
    font-size: 18px;
    color: #422006;
    background: linear-gradient(180deg, #fde68a, #f59e0b);
  }
  .op {
    color: var(--goud);
  }
  .vraag {
    min-width: 1.3em;
    text-align: center;
    color: #f9a8d4;
  }
  .vraag.goed {
    color: #86efac;
  }
  .uitleg {
    margin: -8px 0 0;
    font-size: 24px;
    color: #fbcfe8;
  }
  .groepjes {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    width: min(900px, 100%);
  }
  .groepje {
    position: relative;
    display: grid;
    place-items: center;
    min-width: 150px;
    min-height: 110px;
    padding: 8px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.1);
    border: 3px dashed rgba(249, 168, 212, 0.6);
    transition: all 0.25s;
  }
  .groepje.volgende {
    border-color: #fde68a;
    animation: puls-groep 1.2s ease-in-out infinite;
  }
  .groepje.geteld {
    border-style: solid;
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.18);
  }
  .dingen {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    font-size: 32px;
    line-height: 1;
  }
  .dingen.breed {
    font-size: 24px;
  }
  .som {
    position: absolute;
    top: -12px;
    right: -8px;
    padding: 1px 10px;
    border-radius: 999px;
    background: #4ade80;
    color: #052e16;
    font-size: 20px;
    font-weight: 700;
  }
  .sprongen {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 30px;
    font-weight: 700;
    color: #fde68a;
  }
  .steun {
    padding: 8px 20px;
    border-radius: 16px;
    background: rgba(251, 191, 36, 0.18);
    border: 2px solid rgba(251, 191, 36, 0.6);
    font-size: 26px;
    font-weight: 700;
    color: #fef3c7;
  }
  .getalknop {
    min-width: 130px;
    font-size: 52px;
    font-family: var(--font-titel);
  }
  @keyframes puls-groep {
    0%, 100% { box-shadow: 0 0 0 rgba(253, 230, 138, 0); }
    50% { box-shadow: 0 0 18px rgba(253, 230, 138, 0.8); }
  }
</style>
