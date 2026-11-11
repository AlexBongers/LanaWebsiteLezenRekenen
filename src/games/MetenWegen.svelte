<script lang="ts">
  /** Mira: Meten en wegen. Welke is zwaarder? Hoe lang is het potlood? Hoeveel kilo weegt het pakje? */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Meten3D from './Meten3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { DINGEN, maakMeten, type MeetOpgave } from '../engine/generator-fase6';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  const sleutelVan = (o: MeetOpgave) =>
    o.soort === 'zwaarder' ? `meten.${o.links.naam}-${o.rechts.naam}` : o.soort === 'liniaal' ? `meten.cm${o.lengte}` : `meten.kg${o.kilo}`;

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<MeetOpgave>(
    maakMeten(niveau, aantal).map((o) => ({ opgave: o, id: sleutelVan(o) })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: (string | number)[] = $state([]);
  let juist = $state(false);
  let goed = $state(0);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let drieD = $state(heeftWebGL());
  let knopEls: HTMLElement[] = $state([]);

  const VRAAG = { zwaarder: 'Welke is zwaarder?', liniaal: 'Hoe lang is het potlood?', kilo: 'Hoeveel kilo weegt het pakje?' } as const;
  const emojiVan = (naam: string) => DINGEN.find((d) => d.naam === naam)?.emoji ?? '';
  const tekstVan = (k: string | number) => (o.soort === 'zwaarder' ? String(k) : o.soort === 'liniaal' ? `${k} cm` : `${k} kilo`);

  const zegVraag = () => spreek(teksten.meten[o.soort]);

  onMount(() => {
    (async () => {
      await zegVraag();
      bezig = false;
    })();
  });

  async function kies(k: string | number, i: number) {
    if (bezig || ronde.onthuld || fout.includes(k)) return;
    if (k === o.antwoord) {
      bezig = true;
      juist = true;
      goed++;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      if (o.soort === 'liniaal') await spreek([String(k), 'centimeter'], 'getal');
      else if (o.soort === 'kilo') await spreek([String(k), 'kilo'], 'getal');
      await spreek(compliment('mira'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      const hint = o.soort === 'zwaarder' ? teksten.meten.hintZwaar : o.soort === 'liniaal' ? teksten.meten.hintLiniaal : teksten.meten.hintKilo;
      if (ronde.fout(String(k)) === 'onthuld') {
        juist = true;
        await spreek(hint);
      } else {
        await spreek(bijna());
        await spreek(hint);
      }
    }
  }

  async function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    juist = false;
    stemming = 'rust';
    await wacht(400);
    await zegVraag();
    bezig = false;
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Duo wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="vraag">
      <span>{VRAAG[o.soort]}</span>
      <Luidspreker opTik={zegVraag} klein />
    </div>
    <div class="meetvlak">
      {#if drieD}
        <Meten3D opgave={o} sleutel={ronde.nummer} {goed} opFout={() => (drieD = false)} />
      {:else}
        <div class="plat">
          {#if o.soort === 'zwaarder'}
            <span class="groot">{o.links.emoji} ⚖️ {o.rechts.emoji}</span>
          {:else if o.soort === 'liniaal'}
            <span class="groot">✏️ 📏</span>
          {:else}
            <span class="groot">🎁 ⚖️ {o.kilo} × 1 kg</span>
          {/if}
        </div>
      {/if}
    </div>
    {#key ronde.nummer}
      <div class="keuzerij">
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop meetknop"
            class:fout={fout.includes(k)}
            class:goed={juist && k === o.antwoord}
            style="animation-delay:{i * 0.1}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}
          >
            {#if o.soort === 'zwaarder'}<span class="emoji">{emojiVan(String(k))}</span>{/if}
            {tekstVan(k)}
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
  .vraag {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 6px 12px 6px 26px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 32px;
    font-weight: 700;
    color: #bfdbfe;
  }
  .meetvlak {
    width: 900px;
    height: 420px;
    display: grid;
    place-items: center;
    -webkit-mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 74%, transparent 100%);
    mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 74%, transparent 100%);
  }
  .groot {
    font-size: 80px;
  }
  .meetknop {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 190px;
    font-size: 44px;
    font-family: var(--font-titel);
  }
  .emoji {
    font-size: 52px;
    font-family: 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
  }
</style>
