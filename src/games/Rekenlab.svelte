<script lang="ts">
  /**
   * Lana's Rekenlab: de hele leerlijn plus en min van groep 4 in zes kleine stappen, met tafelsommen erbij.
   *  - Ze typt het antwoord zelf (raden kan niet).
   *  - Gatsommen (8 + ? = 13) laten zien of ze de som echt snapt.
   *  - Het lampje laat de aanpak van school zien: kralen op het rekenrek, sprongen op de getallenlijn, groepjes bij tafels.
   *    Na een fout komt die hulp vanzelf; na twee fouten het antwoord, en de som komt later terug.
   */
  import { onMount } from 'svelte';
  import Lana from '../art/Lana.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Cijferpad from '../ui/Cijferpad.svelte';
  import RekenrekBeeld from '../ui/RekenrekBeeld.svelte';
  import GetallenLijn from '../ui/GetallenLijn.svelte';
  import { labId, labTafel, maakLab, type LabOpgave } from '../engine/generator-lana';
  import { brugVan } from '../engine/generator-rekenschool';
  import { maakSprongen } from '../engine/generator-rekenen';
  import { sommenUitDoosjes } from './doosjes';
  import { vg } from '../store/voortgang.svelte';
  import { somDelen, spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde, type Opgave } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  /** Past een som uit de doosjes bij dit niveau? */
  const pastHier = (a: number, b: number, uit: number, n: number) => {
    const top = Math.max(a, uit);
    if (n <= 0) return top <= 10;
    if (n <= 3) return top <= 20;
    return b < 10 || b % 10 === 0;
  };

  function stelSamen(n: number, totaal: number): Opgave<LabOpgave>[] {
    // Sommen die eerder fout gingen (in welk rekenspel dan ook): hooguit twee
    const terug: Opgave<LabOpgave>[] = sommenUitDoosjes((s) => pastHier(s.a, s.b, s.antwoord, n)).map(({ id, som }) => ({
      opgave: { soort: 'som', som, brug: brugVan(som.a, som.op, som.b), uitdaging: false },
      id,
      uitDoos: true,
    }));
    // Twee tafelsommen (vanaf niveau 2), aan het eind
    const tafels: Opgave<LabOpgave>[] = [];
    for (let p = 0; tafels.length < 2 && p < 20; p++) {
      const t = labTafel(n);
      if (!t) break;
      if (!tafels.some((x) => x.id === labId(t))) tafels.push({ opgave: t, id: labId(t), niveau: n });
    }
    const nieuw = kiesVers(
      'rekenlab',
      maakLab(n, totaal * 4)
        .filter((o) => !terug.some((t) => t.id === labId(o)))
        .map((o) => ({ opgave: o, id: labId(o), niveau: o.uitdaging ? n + 1 : n })),
      (x) => x.id,
      Math.max(1, totaal - terug.length - tafels.length),
    );
    return [...terug, ...nieuw, ...tafels];
  }

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<LabOpgave>(stelSamen(niveau, aantal), niveau, { opKlaar, opVoortgang });
  let o = $derived(ronde.huidig);

  let invoer = $state('');
  let erbij = $state(0);
  let eraf = $state(0);
  let hulp = $state(false);
  let juist = $state(false);
  let schud = $state(false);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let vakEl: HTMLElement | undefined = $state();

  // De som als a, op, b (bij een gatsom is b het ontbrekende getal)
  let kaal = $derived(
    o.soort === 'som' ? { a: o.som.a, op: o.som.op, b: o.som.b, uit: o.som.antwoord } : o.soort === 'gat' ? { a: o.a, op: o.op, b: o.antwoord, uit: o.c } : null,
  );
  let antwoord = $derived(o.soort === 'som' ? o.som.antwoord : o.antwoord);
  let opRek = $derived(!!kaal && Math.max(kaal.a, kaal.uit) <= 20);
  /** Tot en met niveau 1 staat het rekenrek er altijd bij (zien en tellen); daarna pas bij hulp. */
  let toonRek = $derived(opRek && (niveau <= 1 || hulp || juist || ronde.onthuld));
  let brug = $derived(kaal ? brugVan(kaal.a, kaal.op, kaal.b) : null);
  let sprongen = $derived(kaal ? maakSprongen(kaal.a, kaal.b, kaal.op) : []);
  let maxCijfers = $derived(Math.min(3, String(antwoord).length + 1));

  async function zegSom() {
    if (o.soort === 'som') await spreek(somDelen(o.som.a, o.som.op, o.som.b), 'getal');
    else if (o.soort === 'keer') await spreek([String(o.groepen), 'keer', String(o.per)], 'getal');
    else await spreek(teksten.lana.lab.gat);
  }
  async function zegHelemaal() {
    if (o.soort === 'keer') await spreek([String(o.groepen), 'keer', String(o.per), 'is', String(o.antwoord)], 'getal');
    else if (kaal) await spreek(somDelen(kaal.a, kaal.op, kaal.b, kaal.uit), 'getal');
  }

  onMount(() => {
    (async () => {
      await spreek(teksten.lana.lab.start);
      await start();
    })();
  });

  async function start() {
    invoer = '';
    erbij = 0;
    eraf = 0;
    hulp = false;
    juist = false;
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    if (o.soort === 'keer' && ronde.rij[ronde.nummer - 1]?.opgave.soort !== 'keer') await spreek(teksten.lana.lab.keer);
    await zegSom();
  }

  /** De aanpak van school laten zien (lampje, of vanzelf na een fout). */
  async function toonHulp() {
    hulp = true;
    if (o.soort === 'keer') {
      if (o.steun.soort === 'afleiden') {
        await spreek(teksten.rekenschool.steunsom);
        await spreek(o.steun.spraak, 'getal');
      } else {
        await spreek(teksten.rekenschool.telGroepjes);
      }
      return;
    }
    if (!kaal) return;
    if (!opRek) {
      await spreek(teksten.rekenschool.lijn);
      return;
    }
    const zet = (n: number) => (kaal!.op === '+' ? (erbij = n) : (eraf = n));
    if (brug) {
      await spreek(kaal.op === '+' ? teksten.rekenschool.eerstNaarTien : teksten.rekenschool.eerstTerugNaarTien);
      zet(brug.eerst);
      await spreek([String(kaal.a), kaal.op === '+' ? 'plus' : 'min', String(brug.eerst), 'is', String(brug.tiental)], 'getal');
      await wacht(300);
      zet(kaal.b);
    } else {
      zet(kaal.b);
      await spreek(teksten.lana.lab.telKralen);
    }
  }

  async function lampje() {
    if (bezig || juist || ronde.onthuld || hulp) return;
    speelTik();
    bezig = true;
    await toonHulp();
    bezig = false;
  }

  async function controleer() {
    if (bezig || juist || ronde.onthuld || invoer === '') return;
    if (Number(invoer) === antwoord) {
      bezig = true;
      juist = true;
      if (kaal && opRek) kaal.op === '+' ? (erbij = kaal.b) : (eraf = kaal.b);
      speelGoed();
      glitterOp(vakEl ?? null);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed() + (o.uitdaging ? 1 : 0), vakEl ?? null);
      await zegHelemaal();
      if (Math.random() < 0.5) await spreek(compliment());
      await wacht(400);
      volgende();
    } else {
      speelBijna();
      schud = true;
      setTimeout(() => (schud = false), 500);
      stemming = 'denk';
      bezig = true;
      const uitkomst = ronde.fout(invoer);
      invoer = '';
      if (uitkomst === 'onthuld') {
        hulp = true;
        if (kaal && opRek) kaal.op === '+' ? (erbij = kaal.b) : (eraf = kaal.b);
        await spreek(teksten.hetIs);
        await zegHelemaal();
      } else if (!hulp) {
        await toonHulp();
      } else {
        await spreek(bijna());
      }
      bezig = false;
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    stemming = 'dans';
    void start();
  }

  const teken = (op: '+' | '-') => (op === '+' ? '+' : '−');
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#f59e0b" />
    <Lana avatar={vg.avatar} {stemming} hoogte={430} />
  </div>

  <div class="speelveld lab">
    <div class="links">
      {#key ronde.nummer}
        <div class="somkaart" class:schud>
          {#if o.uitdaging}<span class="opgave-label">⭐ Uitdaging</span>{/if}
          {#if ronde.rij[ronde.nummer].uitDoos}<span class="opgave-label terug">🔁 Nog een keer</span>{/if}
          {#if o.soort === 'som'}
            <span>{o.som.a}</span><span class="op">{teken(o.som.op)}</span><span>{o.som.b}</span><span class="op">=</span>
            <span class="vak" class:goed={juist} class:toon={ronde.onthuld} bind:this={vakEl}>{juist || ronde.onthuld ? antwoord : invoer || '?'}</span>
          {:else if o.soort === 'gat'}
            <span>{o.a}</span><span class="op">{teken(o.op)}</span>
            <span class="vak" class:goed={juist} class:toon={ronde.onthuld} bind:this={vakEl}>{juist || ronde.onthuld ? antwoord : invoer || '?'}</span>
            <span class="op">=</span><span>{o.c}</span>
          {:else}
            <span>{o.groepen}</span><span class="op">×</span><span>{o.per}</span><span class="op">=</span>
            <span class="vak" class:goed={juist} class:toon={ronde.onthuld} bind:this={vakEl}>{juist || ronde.onthuld ? antwoord : invoer || '?'}</span>
          {/if}
          <Luidspreker opTik={zegSom} klein />
        </div>
      {/key}

      <div class="model">
        {#if o.soort === 'keer'}
          {#if hulp || juist || ronde.onthuld}
            <div class="groepjes">
              {#each Array.from({ length: o.groepen }, (_, g) => g) as g (g)}
                <span class="groepje">
                  {#each Array.from({ length: o.per }, (_, j) => j) as j (j)}<i></i>{/each}
                  <b>{(g + 1) * o.per}</b>
                </span>
              {/each}
            </div>
            {#if o.steun.soort === 'afleiden'}<p class="tipvak">💡 {o.steun.tekst}</p>{/if}
          {:else}
            <p class="zacht">{o.groepen} groepjes van {o.per}</p>
          {/if}
        {:else if kaal}
          {#if toonRek}
            <div class="rek"><RekenrekBeeld basis={kaal.a} {erbij} {eraf} /></div>
            {#if brug && (hulp || juist || ronde.onthuld)}
              <p class="tipvak">
                💡 {kaal.a} {teken(kaal.op)} {brug.eerst} = {brug.tiental} → {brug.tiental} {teken(kaal.op)} {brug.dan} = {kaal.uit}
              </p>
            {/if}
          {:else if !opRek && (hulp || juist || ronde.onthuld)}
            <div class="lijn"><GetallenLijn {sprongen} /></div>
          {:else}
            <p class="zacht">{o.soort === 'gat' ? 'Welk getal mist er?' : 'Reken het uit en typ het antwoord.'}</p>
          {/if}
        {/if}
      </div>
    </div>

    <div class="rechts">
      <Cijferpad bind:waarde={invoer} max={maxCijfers} uit={bezig || juist || ronde.onthuld} opOk={controleer} />
      {#if ronde.onthuld}
        <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
      {:else}
        <button class="lampje" class:aan={hulp} disabled={hulp || bezig || juist} onclick={lampje}>💡 Laat zien</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .lab {
    flex-direction: row;
    gap: 34px;
    align-items: center;
  }
  .links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    width: 560px;
  }
  .rechts {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .somkaart.schud {
    animation: schud 0.5s ease-in-out;
  }
  .vak {
    min-width: 1.7em;
    padding: 0 10px;
    text-align: center;
    border-radius: 16px;
    color: #2e1065;
    background: #fff;
    border: 4px dashed #f59e0b;
  }
  .vak.goed {
    background: #bbf7d0;
    border: 4px solid #22c55e;
  }
  .vak.toon {
    background: #fde68a;
    border-style: solid;
  }
  .model {
    min-height: 230px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .rek {
    width: 540px;
  }
  .lijn {
    width: 560px;
    height: 130px;
  }
  .zacht {
    margin: 0;
    font-size: 26px;
    background: none;
    border: none;
    color: #fde68a;
    font-weight: 600;
  }
  .groepjes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    max-width: 560px;
  }
  .groepje {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, 12px);
    gap: 4px;
    padding: 8px 10px;
    min-width: 34px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(249, 168, 212, 0.6);
  }
  .groepje i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff7c2, #fbbf24 60%, #b45309);
  }
  .groepje b {
    position: absolute;
    top: -12px;
    right: -8px;
    padding: 0 7px;
    border-radius: 999px;
    font-size: 16px;
    color: #052e16;
    background: #4ade80;
  }
  .lampje {
    padding: 10px 22px;
    border-radius: 999px;
    font-size: 24px;
    font-weight: 700;
    color: #422006;
    background: linear-gradient(180deg, #fef3c7, #fcd34d);
    box-shadow: 0 5px 0 #b45309;
  }
  .lampje:disabled {
    opacity: 0.45;
    box-shadow: none;
  }
</style>
