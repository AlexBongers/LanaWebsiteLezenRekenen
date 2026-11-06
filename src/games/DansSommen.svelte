<script lang="ts">
  /** Mira: Dans-sommen. Tik de demon met het goede antwoord weg. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Demon from '../art/Demon.svelte';
  import GetallenLijn from '../ui/GetallenLijn.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import type { Som } from '../engine/generator-rekenen';
  import type { Gepland, Resultaat } from '../engine/sessie';
  import { spreek, somDelen, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelPoef } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, intro, opgaven = [], auditie = false }: SpelProps<Som> = $props();

  // svelte-ignore state_referenced_locally
  let rij: Gepland<Som>[] = $state([...opgaven]);
  const resultaten: Resultaat[] = [];
  let index = $state(0);
  let pogingen = $state(0);
  let fout: number[] = $state([]);
  let weg: number | null = $state(null);
  let lacht: number | null = $state(null);
  let onthuld = $state(false);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let demonEls: HTMLElement[] = $state([]);
  let opnieuw = new Set<number>();
  let eersteFout: number | null = null;

  let item = $derived(rij[index]);
  let som = $derived(item.opgave);
  let toonHint = $derived(pogingen >= 1);

  function zegSom() {
    return spreek(somDelen(som.a, som.op, som.b), 'getal');
  }
  function zegVerhaal() {
    return som.verhaal ? spreek(som.verhaal, 'zin') : zegSom();
  }

  onMount(() => {
    (async () => {
      if (intro) await spreek(intro);
      await spreek(auditie ? teksten.auditie.start : teksten.sommen.start);
      await zegSom();
    })();
    return stopSpreken;
  });

  async function kies(keuze: number, i: number) {
    if (bezig || onthuld || fout.includes(keuze)) return;
    if (keuze === som.antwoord) {
      bezig = true;
      weg = i;
      speelGoed();
      speelPoef();
      glitterOp(demonEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      if (!opnieuw.has(index)) resultaten.push({ id: item.id, niveau: item.niveau, bron: item.bron, goed: pogingen === 0 });
      opNoten(pogingen === 0 ? 2 : 1, demonEls[i]);
      await spreek(compliment('mira'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      if (pogingen === 0 && !opnieuw.has(index)) eersteFout = keuze;
      fout = [...fout, keuze];
      lacht = i;
      setTimeout(() => (lacht = lacht === i ? null : lacht), 1300);
      pogingen++;
      stemming = 'denk';
      if (pogingen >= 2) {
        onthuld = true;
        if (!opnieuw.has(index)) {
          resultaten.push({ id: item.id, niveau: item.niveau, bron: item.bron, goed: false, gekozen: String(eersteFout) });
        }
        // Deze som komt aan het eind nog een keer terug.
        if (!opnieuw.has(index)) {
          rij = [...rij, { ...item }];
          opnieuw.add(rij.length - 1);
        }
        await spreek(somDelen(som.a, som.op, som.b, som.antwoord), 'getal');
        await spreek(teksten.verder);
      } else {
        await spreek(bijna());
        await spreek(teksten.sommen.hint);
      }
    }
  }

  function volgende() {
    const klaar = index + 1;
    opVoortgang(klaar / rij.length);
    if (klaar >= rij.length) {
      opKlaar(resultaten);
      return;
    }
    index = klaar;
    pogingen = 0;
    eersteFout = null;
    fout = [];
    weg = null;
    lacht = null;
    onthuld = false;
    bezig = false;
    stemming = 'dans';
    void (som.verhaal ? zegVerhaal() : zegSom());
  }
</script>

<div class="spel">
  <div class="heldin">
    <Tekstballon kleur="#ec4899" />
    <Heldin wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="podium">
    {#key index}
      <div class="kaart" class:verhaal={!!som.verhaal}>
        {#if som.verhaal}
          <p class="verhaaltekst">{som.verhaal}</p>
        {/if}
        <div class="som">
          <span>{som.a}</span>
          <span class="op">{som.op === '+' ? '+' : '−'}</span>
          <span>{som.b}</span>
          <span class="op">=</span>
          <span class="antwoord" class:onthuld>{onthuld ? som.antwoord : '?'}</span>
        </div>
        <div class="luid"><Luidspreker opTik={som.verhaal ? zegVerhaal : zegSom} /></div>
      </div>
    {/key}

    <div class="hint" class:zichtbaar={toonHint}>
      {#if toonHint}
        {#key index}
          <GetallenLijn sprongen={som.sprongen} />
        {/key}
      {/if}
    </div>

    <div class="demonen">
      {#each som.keuzes as keuze, i (index + '-' + keuze)}
        <button
          class="demon"
          class:fout={fout.includes(keuze)}
          class:weg={weg === i}
          class:goed={onthuld && keuze === som.antwoord}
          style="animation-delay:{i * 0.12}s"
          bind:this={demonEls[i]}
          onclick={() => (onthuld && keuze === som.antwoord ? volgende() : kies(keuze, i))}
          aria-label="Antwoord {keuze}"
        >
          {#if lacht === i}<span class="hihi">hihi!</span>{/if}
          <span class="bord">{keuze}</span>
          <Demon soort={i + index} grootte={104} />
        </button>
      {/each}
    </div>

    {#if onthuld}
      <button class="knop-goud verder" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .spel {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 290px 1fr;
  }
  .heldin {
    position: relative;
    align-self: end;
    justify-self: center;
    padding-bottom: 16px;
  }
  .podium {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 32px 20px 0;
  }
  .kaart {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 18px 96px 18px 48px;
    border-radius: 32px;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
    border: 3px solid rgba(253, 230, 138, 0.55);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35), inset 0 0 30px rgba(236, 72, 153, 0.15);
    backdrop-filter: blur(6px);
    animation: pop-in 0.45s ease-out;
  }
  .verhaaltekst {
    margin: 0;
    max-width: 720px;
    font-family: var(--font-lees);
    font-size: 28px;
    line-height: 1.45;
    color: #fff;
    text-align: center;
    user-select: text;
  }
  .som {
    display: flex;
    gap: 22px;
    align-items: center;
    font-size: 92px;
    font-weight: 700;
    line-height: 1.1;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.35), 0 0 30px rgba(236, 72, 153, 0.6);
  }
  .verhaal .som {
    font-size: 64px;
  }
  .op {
    color: var(--goud);
  }
  .antwoord {
    min-width: 1.4em;
    text-align: center;
    color: #f9a8d4;
  }
  .antwoord.onthuld {
    color: #86efac;
    animation: pop-in 0.5s ease-out;
  }
  .luid {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
  .hint {
    width: 100%;
    max-width: 780px;
    height: 0;
    overflow: hidden;
    transition: height 0.4s;
    display: grid;
    place-items: center;
  }
  .hint.zichtbaar {
    height: 160px;
  }
  .demonen {
    margin-top: auto;
    display: flex;
    gap: 30px;
    justify-content: center;
    align-items: end;
  }
  .demon {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    animation: demon-in 0.5s ease-out backwards, dobber 2.4s ease-in-out infinite;
    transition: opacity 0.3s, filter 0.3s;
  }
  .demon:nth-child(2) { animation-duration: 0.5s, 2.1s; }
  .demon:nth-child(3) { animation-duration: 0.5s, 2.7s; }
  .demon:nth-child(4) { animation-duration: 0.5s, 2.3s; }
  .bord {
    min-width: 132px;
    padding: 8px 18px;
    margin-bottom: -14px;
    border-radius: 20px;
    font-size: 58px;
    font-weight: 700;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffaf0, #fde68a);
    border: 4px solid #fff;
    box-shadow: 0 6px 0 #b45309, 0 10px 20px rgba(0, 0, 0, 0.35);
    position: relative;
    z-index: 1;
  }
  .demon:active .bord {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #b45309;
  }
  .demon.fout {
    animation: schud 0.5s ease-in-out;
    filter: grayscale(0.85) brightness(0.6);
    opacity: 0.55;
  }
  .hihi {
    position: absolute;
    right: -26px;
    top: -34px;
    z-index: 2;
    padding: 4px 12px;
    border-radius: 14px;
    background: #fff;
    color: #7c3aed;
    font-size: 22px;
    font-weight: 700;
    transform: rotate(10deg);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    animation: pop-in 0.3s ease-out;
  }
  .demon.weg {
    animation: poef 0.6s ease-in forwards;
  }
  .demon.goed .bord {
    background: linear-gradient(180deg, #dcfce7, #86efac);
    box-shadow: 0 6px 0 #15803d, 0 0 30px rgba(134, 239, 172, 0.9);
    animation: pop-in 0.5s ease-out;
  }
  .verder {
    position: absolute;
    right: 40px;
    bottom: 200px;
    animation: pop-in 0.4s ease-out;
  }
  @keyframes demon-in {
    from { transform: translateY(120px) scale(0.6); opacity: 0; }
  }
  @keyframes dobber {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes poef {
    0% { transform: scale(1) rotate(0); opacity: 1; }
    40% { transform: scale(1.2) rotate(-8deg); opacity: 1; }
    100% { transform: scale(0.1) rotate(25deg) translateY(-80px); opacity: 0; }
  }
</style>
