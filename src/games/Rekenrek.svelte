<script lang="ts">
  /**
   * Rekenschool: Rekenrek. Optellen en aftrekken "via de 10", zoals op school.
   *  - Niveau 0: tot 10; alle kralen in beeld (tellen en zien).
   *  - Niveau 1: plus via de 10, met stappen: "Hoeveel erbij tot 10?" → de rest erbij → antwoord.
   *  - Niveau 2: plus en min via de 10; het rekenrek staat er, de stappen pas na een fout.
   *  - Niveau 3: tot 100 over het tiental; sprongen op de getallenlijn na een fout.
   * Foute sommen gaan in de herhalingsdoosjes en komen later terug (ook in Dans-sommen).
   */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import RekenrekBeeld from '../ui/RekenrekBeeld.svelte';
  import GetallenLijn from '../ui/GetallenLijn.svelte';
  import { brugVan, maakRekenrek, type RekOpgave } from '../engine/generator-rekenschool';
  import { somId, somUitId } from '../engine/generator-rekenen';
  import { aanDeBeurt } from '../engine/herhaling';
  import { vg } from '../store/voortgang.svelte';
  import { somDelen, spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  /** Past een som uit de doosjes bij dit niveau van het rekenrek? */
  const pastHier = (s: { a: number; op: '+' | '-'; b: number; antwoord: number }, n: number) => {
    const top = Math.max(s.a, s.antwoord);
    if (n <= 0) return top <= 10;
    if (n === 1) return top <= 20 && s.op === '+';
    if (n === 2) return top <= 20;
    return s.b < 10;
  };

  /** Sommen die eerder fout gingen (ook in Dans-sommen) komen hier terug, mét het rekenrek erbij. Hooguit twee per keer. */
  function uitDoosjes(n: number): { opgave: RekOpgave; id: string; uitDoos: boolean }[] {
    const uit: { opgave: RekOpgave; id: string; uitDoos: boolean }[] = [];
    for (const { id } of aanDeBeurt(vg.herhaling, 'som.', Date.now())) {
      const s = somUitId(id);
      if (!s || !pastHier(s, n)) continue;
      uit.push({ opgave: { ...s, uitdaging: false, brug: brugVan(s.a, s.op, s.b) }, id, uitDoos: true });
      if (uit.length >= 2) break;
    }
    return uit;
  }

  // svelte-ignore state_referenced_locally
  const terug = uitDoosjes(niveau);
  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<RekOpgave>(
    [
      ...terug,
      ...kiesVers(
        'rekenrek',
        maakRekenrek(niveau, aantal * 4)
          .filter((o) => !terug.some((t) => t.id === somId(o)))
          .map((o) => ({ opgave: o, id: somId(o), niveau: o.uitdaging ? niveau + 1 : niveau })),
        (x) => x.id,
        aantal - terug.length,
      ),
    ],
    niveau,
    { opKlaar, opVoortgang },
  );
  /** Op niveau 2 doet Mira de eerste minsommen via de 10 nog samen met haar; daarna zelf. */
  const SAMEN_MIN = 3;
  let samenGedaan = 0;
  let o = $derived(ronde.huidig);
  let fase: 'splits' | 'antwoord' | 'klaar' = $state('antwoord');
  let erbij = $state(0);
  let eraf = $state(0);
  let fout: number[] = $state([]);
  let splitsFout: number[] = $state([]);
  let juist = $state(false);
  let toonStappen = $state(false);
  let toonLijn = $state(false);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let knopEls: HTMLElement[] = $state([]);

  /** Past het in het rekenrek (tot 20)? Anders de getallenlijn. */
  let opRek = $derived(Math.max(o.a, o.op === '+' ? o.a + o.b : o.a) <= 20);
  let splitsKeuzes = $derived(o.brug ? [...new Set([o.brug.eerst, o.brug.eerst + 1, Math.max(1, o.brug.eerst - 1)])].sort((x, y) => x - y) : []);

  const zegSom = () => spreek(somDelen(o.a, o.op, o.b), 'getal');

  onMount(() => {
    (async () => {
      await spreek(teksten.rekenschool.rekenrek);
      await start();
    })();
  });

  async function start() {
    erbij = 0;
    eraf = 0;
    fout = [];
    splitsFout = [];
    juist = false;
    toonLijn = false;
    // Niveau 0: de kralen van b staan er al bij (zien en tellen); niveau 1: stappen via de 10
    const samenMin = niveau === 2 && o.op === '-' && samenGedaan < SAMEN_MIN;
    toonStappen = !!o.brug && !o.uitdaging && (niveau <= 1 || samenMin);
    const samen = toonStappen && samenMin;
    if (samen) samenGedaan++;
    if (niveau === 0 && !o.brug && o.op === '+') erbij = o.b;
    if (niveau === 0 && !o.brug && o.op === '-') eraf = o.b;
    fase = toonStappen ? 'splits' : 'antwoord';
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    await zegSom();
    if (samen) await spreek(teksten.rekenschool.samenMin);
    if (toonStappen) await spreek(o.op === '+' ? teksten.rekenschool.eerstNaarTien : teksten.rekenschool.eerstTerugNaarTien);
  }

  /** Stap 1 via de 10: hoeveel erbij (of eraf) tot het tiental? */
  async function kiesSplits(n: number) {
    if (bezig || !o.brug || fase !== 'splits') return;
    if (n !== o.brug.eerst) {
      speelBijna();
      splitsFout = [...splitsFout, n];
      await spreek(teksten.rekenschool.telTotTien);
      return;
    }
    bezig = true;
    speelTik();
    await laatBrugZien();
    fase = 'antwoord';
    bezig = false;
    await spreek(teksten.rekenschool.hoeveelNu);
  }

  /** De kralen schuiven: eerst tot het tiental, dan de rest. Met de som erbij gesproken. */
  async function laatBrugZien() {
    if (!o.brug) return;
    const { eerst, dan, tiental } = o.brug;
    if (o.op === '+') {
      erbij = eerst;
      await spreek([String(o.a), 'plus', String(eerst), 'is', String(tiental)], 'getal');
      await wacht(250);
      erbij = eerst + dan;
      await spreek([String(tiental), 'plus', String(dan)], 'getal');
    } else {
      eraf = eerst;
      await spreek([String(o.a), 'min', String(eerst), 'is', String(tiental)], 'getal');
      await wacht(250);
      eraf = eerst + dan;
      await spreek([String(tiental), 'min', String(dan)], 'getal');
    }
  }

  async function kies(k: number, i: number) {
    if (bezig || ronde.onthuld || fase !== 'antwoord' || fout.includes(k)) return;
    if (k === o.antwoord) {
      bezig = true;
      juist = true;
      fase = 'klaar';
      if (o.op === '+') erbij = o.b;
      else eraf = o.b;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed() + (o.uitdaging ? 1 : 0), knopEls[i]);
      await spreek(somDelen(o.a, o.op, o.b, o.antwoord), 'getal');
      if (Math.random() < 0.5) await spreek(compliment('mira'));
      await wacht(400);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      bezig = true;
      const uitkomst = ronde.fout(String(k));
      // Na een fout: de strategie laten zien (rekenrek of getallenlijn)
      if (opRek && o.brug && erbij === 0 && eraf === 0) {
        await spreek(o.op === '+' ? teksten.rekenschool.eerstNaarTien : teksten.rekenschool.eerstTerugNaarTien);
        await laatBrugZien();
      } else if (!opRek) {
        toonLijn = true;
        await spreek(teksten.rekenschool.lijn);
      } else if (uitkomst !== 'onthuld') {
        await spreek(bijna());
      }
      if (uitkomst === 'onthuld') {
        if (o.op === '+') erbij = o.b;
        else eraf = o.b;
        await spreek(somDelen(o.a, o.op, o.b, o.antwoord), 'getal');
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
        {#if o.uitdaging}<span class="ster" title="Uitdaging">⭐ Uitdaging</span>{/if}
        <span>{o.a}</span>
        <span class="op">{o.op === '+' ? '+' : '−'}</span>
        <span>{o.b}</span>
        <span class="op">=</span>
        <span class="vraag" class:goed={juist || ronde.onthuld}>{juist || ronde.onthuld ? o.antwoord : '?'}</span>
        <Luidspreker opTik={zegSom} klein />
      </div>
    {/key}

    {#if opRek}
      <div class="rek"><RekenrekBeeld basis={o.a} {erbij} {eraf} /></div>
    {:else if toonLijn}
      <div class="lijn"><GetallenLijn sprongen={o.sprongen} /></div>
    {:else}
      <div class="lijn leeg">Tip: spring eerst naar het hele tiental.</div>
    {/if}

    {#if o.brug && (toonStappen || erbij > 0 || eraf > 0)}
      <div class="stappen">
        <span class="stap" class:aan={erbij >= o.brug.eerst || eraf >= o.brug.eerst}>
          {o.a} {o.op === '+' ? '+' : '−'} {o.brug.eerst} = {o.brug.tiental}
        </span>
        <span class="pijl">→</span>
        <span class="stap" class:aan={erbij >= o.b || eraf >= o.b}>
          {o.brug.tiental} {o.op === '+' ? '+' : '−'} {o.brug.dan} = {o.brug.tiental + (o.op === '+' ? o.brug.dan : -o.brug.dan)}
        </span>
      </div>
    {/if}

    {#key ronde.nummer + fase}
      {#if fase === 'splits' && o.brug}
        <p class="vraagregel">{o.op === '+' ? `Hoeveel erbij tot ${o.brug.tiental}?` : `Hoeveel eraf tot ${o.brug.tiental}?`}</p>
        <div class="keuzerij">
          {#each splitsKeuzes as k (k)}
            <button class="keuzeknop getalknop" class:fout={splitsFout.includes(k)} onclick={() => kiesSplits(k)}>{k}</button>
          {/each}
        </div>
      {:else}
        <div class="keuzerij">
          {#each o.keuzes as k, i (k)}
            <button
              class="keuzeknop getalknop"
              class:fout={fout.includes(k)}
              class:goed={(juist || ronde.onthuld) && k === o.antwoord}
              disabled={fase !== 'antwoord' && !ronde.onthuld}
              bind:this={knopEls[i]}
              onclick={() => kies(k, i)}>{k}</button
            >
          {/each}
        </div>
      {/if}
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
    gap: 16px;
    padding: 8px 18px 8px 32px;
    border-radius: 26px;
    font-size: 64px;
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
    box-shadow: 0 0 14px rgba(251, 191, 36, 0.8);
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
  .rek {
    width: 640px;
  }
  .lijn {
    width: 680px;
    height: 130px;
  }
  .lijn.leeg {
    display: grid;
    place-items: center;
    font-size: 24px;
    color: #fde68a;
  }
  .stappen {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 30px;
    font-weight: 700;
  }
  .stap {
    padding: 4px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s;
  }
  .stap.aan {
    color: #fff;
    background: rgba(251, 191, 36, 0.3);
    box-shadow: 0 0 14px rgba(251, 191, 36, 0.5);
  }
  .pijl {
    color: #fde68a;
  }
  .vraagregel {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #fde68a;
  }
  .getalknop {
    min-width: 130px;
    font-size: 54px;
    font-family: var(--font-titel);
  }
</style>
