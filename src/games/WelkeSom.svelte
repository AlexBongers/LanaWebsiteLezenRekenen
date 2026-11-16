<script lang="ts">
  /**
   * Rekenschool: Welke som? Taal en rekenen samen.
   * Lees het verhaaltje, kies de som die erbij hoort (plus of min?), en reken hem dan uit.
   * Bij een fout lichten de signaalwoorden op ("erbij", "weg", "samen").
   */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import { maakWelkeSom, SIGNAALWOORDEN, type WelkeSomOpgave } from '../engine/generator-rekenschool';
  import { heeftOpname, somDelen, spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<WelkeSomOpgave>(
    kiesVers(
      'welkesom',
      maakWelkeSom(niveau, aantal * 3, undefined, (t) => heeftOpname(t, 'zin')).map((o) => ({ opgave: o, id: `welkesom.${o.goed}`, niveau: o.uitdaging ? niveau + 1 : niveau })),
      (x) => x.id,
      aantal,
    ),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let stap: 'kies' | 'reken' = $state('kies');
  let somFout: string[] = $state([]);
  let fout: number[] = $state([]);
  let juist = $state(false);
  let bezig = $state(true);
  let toonSignaal = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let knopEls: HTMLElement[] = $state([]);

  const signaal = $derived(new Set(o.som.op === '+' ? SIGNAALWOORDEN.plus : SIGNAALWOORDEN.min));
  const woorden = $derived(o.tekst.split(' '));
  const kaal = (w: string) => w.toLowerCase().replace(/[.,?!]/g, '');

  const lees = () => spreek(o.tekst, 'zin');

  onMount(() => {
    (async () => {
      await spreek(teksten.rekenschool.welkeSom);
      await start();
    })();
  });

  async function start() {
    stap = 'kies';
    somFout = [];
    fout = [];
    juist = false;
    toonSignaal = false;
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    await lees();
  }

  async function kiesSom(s: string) {
    if (bezig || stap !== 'kies' || somFout.includes(s)) return;
    if (s === o.goed) {
      speelGoed();
      bezig = true;
      await spreek(somDelen(o.som.a, o.som.op, o.som.b), 'getal');
      stap = 'reken';
      bezig = false;
      await spreek(teksten.rekenschool.rekenUit);
    } else {
      speelBijna();
      somFout = [...somFout, s];
      stemming = 'denk';
      toonSignaal = true;
      ronde.fout(s);
      await spreek(o.som.op === '+' ? teksten.rekenschool.hintPlus : teksten.rekenschool.hintMin);
    }
  }

  async function kies(k: number, i: number) {
    if (bezig || stap !== 'reken' || fout.includes(k)) return;
    if (k === o.som.antwoord) {
      bezig = true;
      juist = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed() + (o.uitdaging ? 1 : 0), knopEls[i]);
      await spreek(somDelen(o.som.a, o.som.op, o.som.b, o.som.antwoord), 'getal');
      if (Math.random() < 0.5) await spreek(compliment('mira'));
      await wacht(400);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      if (fout.length >= 2) {
        juist = true;
        await spreek(somDelen(o.som.a, o.som.op, o.som.b, o.som.antwoord), 'getal');
      } else {
        await spreek(bijna());
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    stemming = 'rust';
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
      <div class="verhaal">
        {#if o.uitdaging}<span class="ster">⭐ Uitdaging</span>{/if}
        <p class="tekst">
          {#each woorden as w, i (i)}
            <span class:signaal={toonSignaal && signaal.has(kaal(w))}>{w}</span>{' '}
          {/each}
        </p>
        <Luidspreker opTik={lees} klein />
      </div>
    {/key}

    {#if stap === 'kies'}
      <p class="vraag">Welke som hoort erbij?</p>
      {#key ronde.nummer}
        <div class="keuzerij">
          {#each o.keuzes as s (s)}
            <button class="keuzeknop somknop" class:fout={somFout.includes(s)} onclick={() => kiesSom(s)}>{s}</button>
          {/each}
        </div>
      {/key}
    {:else}
      <div class="gekozen">{o.goed} = <span class="vraagteken" class:goed={juist}>{juist ? o.som.antwoord : '?'}</span></div>
      <div class="keuzerij">
        {#each o.som.keuzes as k, i (k)}
          <button
            class="keuzeknop getalknop"
            class:fout={fout.includes(k)}
            class:goed={juist && k === o.som.antwoord}
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}>{k}</button
          >
        {/each}
      </div>
      {#if juist && fout.length >= 2}
        <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .verhaal {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 900px;
    padding: 18px 26px;
    border-radius: 26px;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffdf7, #fdf2f8);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.45), 0 16px 40px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.4s ease-out;
  }
  .verhaal :global(.luidspreker) {
    flex-shrink: 0;
    background: linear-gradient(180deg, #f472b6, #db2777);
    border-color: #fbcfe8;
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
  .tekst {
    margin: 0;
    font-family: var(--font-lees);
    font-size: 34px;
    line-height: 1.5;
  }
  .signaal {
    padding: 0 4px;
    border-radius: 8px;
    background: #fde68a;
    box-shadow: 0 0 0 2px #f59e0b;
  }
  .vraag {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    color: #fbcfe8;
  }
  .somknop {
    min-width: 200px;
    font-size: 50px;
    font-family: var(--font-titel);
  }
  .gekozen {
    font-size: 58px;
    font-weight: 700;
  }
  .vraagteken {
    color: #f9a8d4;
  }
  .vraagteken.goed {
    color: #86efac;
  }
  .getalknop {
    min-width: 130px;
    font-size: 52px;
    font-family: var(--font-titel);
  }
</style>
