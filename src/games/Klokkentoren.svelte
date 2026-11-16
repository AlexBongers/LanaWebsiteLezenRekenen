<script lang="ts">
  /**
   * Lana's Klokkentoren: klokkijken, analoog en digitaal.
   *  Hele uren → halve uren → kwartieren → digitaal (3:30 = half 4) → op vijf minuten.
   *  Vijf soorten opgaven: de klok lezen, de goede klok kiezen, analoog naar digitaal,
   *  digitaal naar woorden, en digitaal aan analoog koppelen.
   *  De foute keuzes zijn de vergissingen die kinderen echt maken (half 4 of half 3? over of voor?).
   *  Na een fout kleurt de klok: rechts is "over", links is "voor", en de uitleg die erbij hoort klinkt.
   */
  import { onMount } from 'svelte';
  import Lana from '../art/Lana.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import KlokBeeld from '../ui/KlokBeeld.svelte';
  import { digitaal, klokHint, maakToren, tijdId, tijdTekst, tijdZin, type KlokTijd, type TorenOpgave } from '../engine/generator-lana';
  import { vg } from '../store/voortgang.svelte';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<TorenOpgave>(
    kiesVers(
      'kloktoren',
      maakToren(niveau, aantal * 4).map((o) => ({ opgave: o, id: `toren.${o.soort}.${tijdId(o.tijd)}`, niveau: o.uitdaging ? niveau + 1 : niveau })),
      (x) => x.id,
      aantal,
    ),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: string[] = $state([]);
  let juist = $state(false);
  let bezig = $state(true);
  let uitleg = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let knopEls: HTMLElement[] = $state([]);

  /** Wat staat er bovenaan: een analoge klok, een digitale klok of de tijd in woorden? */
  let toont = $derived(o.soort === 'lees' || o.soort === 'naarDigitaal' ? 'analoog' : o.soort === 'kies' ? 'woorden' : 'digitaal');
  /** Waaruit kiest ze: woorden, digitale tijden of klokken? */
  let kiest = $derived(o.soort === 'lees' || o.soort === 'vanDigitaal' ? 'woorden' : o.soort === 'naarDigitaal' ? 'digitaal' : 'klokken');
  /** Vanaf vijf minuten staan de minuten om de rand zodra ze hulp krijgt. */
  let metMinuten = $derived(uitleg && o.tijd.min % 15 !== 0);

  const zegTijd = () => spreek(tijdZin(o.tijd), 'zin');

  onMount(() => {
    (async () => {
      await spreek(teksten.lana.toren.start);
      await spreek(teksten.lana.toren.niveau[Math.min(niveau, teksten.lana.toren.niveau.length - 1)]);
      await start();
    })();
  });

  async function start() {
    fout = [];
    juist = false;
    uitleg = false;
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    await spreek(teksten.lana.toren.vraag[o.soort]);
    // Bij "kies de klok" hoort ze de tijd; bij de andere soorten moet ze die zelf lezen
    if (o.soort === 'kies') await zegTijd();
  }

  async function kies(k: KlokTijd, i: number) {
    const id = tijdId(k);
    if (bezig || juist || ronde.onthuld || fout.includes(id)) return;
    if (id === tijdId(o.tijd)) {
      bezig = true;
      juist = true;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed() + (o.uitdaging ? 1 : 0), knopEls[i]);
      await zegTijd();
      if (Math.random() < 0.5) await spreek(compliment());
      await wacht(500);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, id];
      stemming = 'denk';
      bezig = true;
      uitleg = true;
      if (ronde.fout(tijdTekst(k)) === 'onthuld') {
        await spreek(teksten.hetIs);
        await zegTijd();
      } else {
        await spreek(bijna());
        // Digitaal: eerst uitleggen hoe je het leest; anders de uitleg bij de stand van de lange wijzer
        await spreek(toont === 'digitaal' || kiest === 'digitaal' ? teksten.lana.toren.hint.digitaal : teksten.lana.toren.hint[klokHint(o.tijd)]);
      }
      bezig = false;
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
    <Tekstballon kleur="#f59e0b" />
    <Lana avatar={vg.avatar} {stemming} hoogte={430} />
  </div>

  <div class="speelveld toren">
    {#key ronde.nummer}
      <div class="boven">
        {#if o.uitdaging}<span class="opgave-label naast">⭐ Uitdaging</span>{/if}
        {#if toont === 'analoog'}
          <div class="groteklok"><KlokBeeld tijd={o.tijd} {uitleg} minuten={metMinuten} /></div>
        {:else if toont === 'digitaal'}
          <div class="wekker">
            <span class="scherm">{digitaal(o.tijd)}</span>
            {#if uitleg}<span class="leeswijzer"><b>uur</b> : <b>minuten</b></span>{/if}
          </div>
        {:else}
          <div class="woordkaart">
            <span>{tijdTekst(o.tijd)}</span>
            <Luidspreker opTik={zegTijd} klein />
          </div>
        {/if}
      </div>
    {/key}

    <p class="vraag">
      {o.soort === 'lees' ? 'Hoe laat is het?' : o.soort === 'kies' ? 'Welke klok hoort erbij?' : o.soort === 'naarDigitaal' ? 'Hoe staat dat op de digitale klok?' : o.soort === 'vanDigitaal' ? 'Hoe zeg je deze tijd?' : 'Welke klok laat dezelfde tijd zien?'}
    </p>

    {#key ronde.nummer}
      <div class="keuzerij" class:klokken={kiest === 'klokken'}>
        {#each o.keuzes as k, i (tijdId(k))}
          {@const id = tijdId(k)}
          <button
            class="keuzeknop {kiest}"
            class:fout={fout.includes(id)}
            class:goed={(juist || ronde.onthuld) && id === tijdId(o.tijd)}
            style="animation-delay:{i * 0.08}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}
            aria-label={kiest === 'klokken' ? `Klok ${i + 1}` : undefined}
          >
            {#if kiest === 'klokken'}
              <span class="kleineklok"><KlokBeeld tijd={k} klein uitleg={uitleg && (juist || ronde.onthuld) && id === tijdId(o.tijd)} /></span>
            {:else if kiest === 'digitaal'}
              <span class="scherm klein">{digitaal(k)}</span>
            {:else}
              {tijdTekst(k)}
            {/if}
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
  .toren {
    gap: 16px;
  }
  .boven {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 150px;
    animation: pop-in 0.4s ease-out;
  }
  .naast {
    top: -6px;
    left: -90px;
  }
  .groteklok {
    width: 330px;
    height: 330px;
  }
  .wekker {
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 18px 30px;
    border-radius: 28px;
    background: linear-gradient(180deg, #334155, #0f172a);
    border: 5px solid #94a3b8;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.5);
  }
  .scherm {
    padding: 6px 26px;
    border-radius: 14px;
    font-family: 'Courier New', monospace;
    font-size: 96px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #4ade80;
    background: #022c22;
    text-shadow: 0 0 16px rgba(74, 222, 128, 0.8);
  }
  .scherm.klein {
    font-size: 44px;
    padding: 4px 14px;
    letter-spacing: 2px;
  }
  .leeswijzer {
    font-size: 22px;
    color: #fde68a;
  }
  .woordkaart {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 14px 20px 14px 34px;
    border-radius: 26px;
    font-family: var(--font-lees);
    font-size: 58px;
    font-weight: 700;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffdf7, #fef3c7);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.55), 0 14px 34px rgba(0, 0, 0, 0.4);
  }
  .woordkaart :global(.luidspreker) {
    background: linear-gradient(180deg, #fbbf24, #d97706);
    border-color: #fde68a;
  }
  .vraag {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    color: #fde68a;
  }
  .keuzerij {
    flex-wrap: wrap;
    gap: 18px;
    max-width: 900px;
  }
  .keuzeknop.woorden {
    min-width: 190px;
    min-height: 92px;
    padding: 10px 20px;
    font-size: 32px;
    white-space: nowrap;
  }
  .keuzeknop.digitaal {
    min-width: 180px;
    min-height: 100px;
    padding: 10px 16px;
  }
  .keuzeknop.klokken {
    min-width: 0;
    min-height: 0;
    padding: 10px;
  }
  .kleineklok {
    display: block;
    width: 210px;
    height: 210px;
  }
</style>
