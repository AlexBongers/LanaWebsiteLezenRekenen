<script lang="ts">
  /** Zoey: Songtekst-verhaal. Zelf lezen, daarna vragen beantwoorden. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import verhalen from '../../content/lezen/verhalen-E4.json';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { vg } from '../store/voortgang.svelte';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import type { SpelProps } from './types';
  import type { Resultaat } from '../engine/sessie';

  let { opNoten, opVoortgang, opKlaar, intro }: SpelProps = $props();

  type Verhaal = (typeof verhalen)[number];

  function kiesVerhaal(): Verhaal {
    const nieuw = verhalen.find((v) => !vg.gelezenVerhalen.includes(v.id));
    if (nieuw) return nieuw;
    // Alles gelezen: het verhaal dat het langst geleden is (herhaald lezen maakt vlotter).
    return verhalen.find((v) => v.id === vg.gelezenVerhalen[0]) ?? verhalen[0];
  }

  const verhaal = kiesVerhaal();
  const stappen = 1 + verhaal.vragen.length;
  const resultaten: Resultaat[] = [];

  let fase: 'lezen' | 'vragen' = $state('lezen');
  let actieveZin: number | null = $state(null);
  let vraagIndex = $state(0);
  let pogingen = $state(0);
  let fout: number[] = $state([]);
  let goedGekozen = $state(false);
  let onthuld = $state(false);
  let knopEls: HTMLElement[] = $state([]);
  let klaarKnop: HTMLElement | undefined = $state();
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' = $state('rust');

  let vraag = $derived(verhaal.vragen[vraagIndex]);

  onMount(() => {
    (async () => {
      if (intro) await spreek(intro);
      await spreek(teksten.verhaal.start);
    })();
    return stopSpreken;
  });

  async function leesZin(i: number) {
    actieveZin = i;
    await spreek(verhaal.zinnen[i], 'zin');
    if (actieveZin === i) actieveZin = null;
  }

  async function klaarMetLezen() {
    stopSpreken();
    actieveZin = null;
    speelGoed();
    opNoten(3, klaarKnop);
    opVoortgang(1 / stappen);
    fase = 'vragen';
    stemming = 'juich';
    await wacht(400);
    void zegVraag();
  }

  function zegVraag() {
    return spreek(vraag.vraag, 'zin');
  }

  async function kies(i: number) {
    if (goedGekozen || onthuld || fout.includes(i)) return;
    if (i === vraag.goed) {
      goedGekozen = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = 'juich';
      resultaten.push({ id: `verhaal.${verhaal.id}.${vraagIndex}`, niveau: 0, bron: 'niveau', goed: pogingen === 0 });
      opNoten(pogingen === 0 ? 2 : 1, knopEls[i]);
      await spreek(compliment());
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, i];
      pogingen++;
      stemming = 'denk';
      if (pogingen >= 2) {
        onthuld = true;
        resultaten.push({ id: `verhaal.${verhaal.id}.${vraagIndex}`, niveau: 0, bron: 'niveau', goed: false });
        await spreek(teksten.hetIs);
        await spreek(vraag.keuzes[vraag.goed], 'zin');
      } else {
        await spreek(bijna());
        await spreek(teksten.verhaal.zoek);
      }
    }
  }

  function volgende() {
    opVoortgang((2 + vraagIndex) / stappen);
    if (vraagIndex + 1 >= verhaal.vragen.length) {
      vg.gelezenVerhalen = [...vg.gelezenVerhalen.filter((id) => id !== verhaal.id), verhaal.id];
      opKlaar(resultaten);
      return;
    }
    vraagIndex++;
    pogingen = 0;
    fout = [];
    goedGekozen = false;
    onthuld = false;
    stemming = 'rust';
    void zegVraag();
  }
</script>

<div class="spel" class:vragen={fase === 'vragen'}>
  <div class="heldin">
    {#if fase === 'lezen'}<Tekstballon kleur="#06b6d4" />{/if}
    <Heldin wie="zoey" {stemming} hoogte={fase === 'vragen' ? 260 : 360} />
  </div>

  <article class="songtekst">
    <header>
      <span class="noot">♪</span>
      <h2>{verhaal.titel}</h2>
      <span class="noot">♫</span>
    </header>
    <p class="tekst">
      {#each verhaal.zinnen as zin, i}
        <span
          class="zin"
          class:actief={actieveZin === i}
          role="button"
          tabindex="0"
          onclick={() => leesZin(i)}
          onkeydown={(e) => e.key === 'Enter' && leesZin(i)}>{zin}</span
        >{' '}
      {/each}
    </p>
    {#if fase === 'lezen'}
      <div class="onder">
        <span class="tip">Tik op een zin als je hulp nodig hebt.</span>
        <button class="knop-goud" bind:this={klaarKnop} onclick={klaarMetLezen}>Klaar met lezen ✓</button>
      </div>
    {/if}
  </article>

  {#if fase === 'vragen'}
    {#key vraagIndex}
      <section class="vraagpaneel">
        <div class="teller">Vraag {vraagIndex + 1} van {verhaal.vragen.length}</div>
        <div class="vraag">
          <h3>{vraag.vraag}</h3>
          <Luidspreker opTik={zegVraag} klein />
        </div>
        <div class="keuzes">
          {#each vraag.keuzes as keuze, i}
            <button
              class="keuze"
              class:fout={fout.includes(i)}
              class:goed={(goedGekozen || onthuld) && i === vraag.goed}
              style="animation-delay:{i * 0.1}s"
              bind:this={knopEls[i]}
              onclick={() => kies(i)}
            >
              <span class="letter">{['A', 'B', 'C'][i]}</span>{keuze}
            </button>
          {/each}
        </div>
        {#if onthuld}
          <button class="knop-goud verder" onclick={volgende}>Verder ➜</button>
        {/if}
      </section>
    {/key}
  {/if}
</div>

<style>
  .spel {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 230px 1fr;
    gap: 12px;
    padding: 0 28px 20px 0;
  }
  .spel.vragen {
    grid-template-columns: 150px 1fr 450px;
  }
  .heldin {
    position: relative;
    align-self: end;
    justify-self: center;
    padding-bottom: 6px;
  }
  .songtekst {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin-top: 4px;
    padding: 18px 34px 18px;
    border-radius: 28px;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffdf7, #fdf4ff);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.5), 0 16px 40px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.45s ease-out;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  h2 {
    margin: 0;
    font-size: 36px;
    color: #a21caf;
  }
  .noot {
    font-size: 34px;
    color: #06b6d4;
  }
  .tekst {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 8px 0 0;
    padding-right: 6px;
    font-family: var(--font-lees);
    font-size: 30px;
    line-height: 50px;
    background: repeating-linear-gradient(180deg, transparent 0 48px, rgba(124, 58, 237, 0.13) 48px 50px);
    background-attachment: local;
  }
  .vragen .tekst {
    font-size: 23px;
    line-height: 38px;
    background: repeating-linear-gradient(180deg, transparent 0 36px, rgba(124, 58, 237, 0.13) 36px 38px);
    background-attachment: local;
  }
  .zin {
    padding: 3px 2px;
    cursor: pointer;
    border-radius: 8px;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
    transition: background 0.2s;
  }
  .zin.actief {
    background: #fde68a;
    box-shadow: 0 0 0 3px #fbbf24;
  }
  .onder {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 12px;
  }
  .tip {
    font-size: 20px;
    color: #7c3aed;
  }
  .vraagpaneel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 4px;
    animation: schuif-in 0.45s ease-out;
  }
  .teller {
    align-self: flex-start;
    padding: 4px 16px;
    border-radius: 999px;
    background: rgba(34, 211, 238, 0.25);
    font-size: 20px;
  }
  .vraag {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  h3 {
    margin: 0;
    flex: 1;
    font-family: var(--font-lees);
    font-size: 31px;
    line-height: 1.3;
  }
  .keuzes {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .keuze {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 82px;
    padding: 10px 20px 10px 12px;
    border-radius: 22px;
    font-family: var(--font-lees);
    font-size: 27px;
    font-weight: 700;
    text-align: left;
    color: var(--inkt);
    background: linear-gradient(180deg, #ffffff, #ecfeff);
    border: 3px solid #fff;
    box-shadow: 0 6px 0 #0891b2, 0 10px 20px rgba(0, 0, 0, 0.3);
    animation: pop-in 0.4s ease-out backwards;
  }
  .keuze:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #0891b2;
  }
  .letter {
    flex: none;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    font-family: var(--font-titel);
    color: #fff;
    background: linear-gradient(180deg, #22d3ee, #0891b2);
  }
  .keuze.fout {
    animation: schud 0.5s ease-in-out;
    opacity: 0.45;
    filter: grayscale(1);
  }
  .keuze.goed {
    background: linear-gradient(180deg, #f0fdf4, #86efac);
    box-shadow: 0 6px 0 #15803d, 0 0 30px rgba(134, 239, 172, 0.9);
  }
  .keuze.goed .letter {
    background: linear-gradient(180deg, #4ade80, #15803d);
  }
  .verder {
    align-self: flex-end;
    animation: pop-in 0.4s ease-out;
  }
  @keyframes schuif-in {
    from { transform: translateX(80px); opacity: 0; }
  }
</style>
