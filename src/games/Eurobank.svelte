<script lang="ts">
  /**
   * Lana's Eurobank: alles over geld, stap voor stap.
   *  - Tellen: hoeveel is dit samen? (begin bij het grootste geld en tel verder)
   *  - Maken: leg zelf een bedrag neer; met zo weinig mogelijk geld krijg je een extra noot.
   *  - Genoeg?: heb je genoeg om het te kopen, en hoeveel houd je over of kom je te kort?
   *  - Terug: je betaalt met een briefje; hoeveel krijg je terug? (verder tellen vanaf de prijs)
   * Eerst hele euro's, dan centen (100 cent = 1 euro), dan euro's en centen samen.
   */
  import { onMount } from 'svelte';
  import Lana from '../art/Lana.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Cijferpad from '../ui/Cijferpad.svelte';
  import GeldStuk from '../ui/GeldStuk.svelte';
  import { bankId, geldSpraak, geldTekst, maakBank, minsteStukken, type BankOpgave } from '../engine/generator-lana';
  import { vg } from '../store/voortgang.svelte';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<BankOpgave>(
    kiesVers('eurobank', maakBank(niveau, aantal * 4).map((o) => ({ opgave: o, id: bankId(o), niveau: o.uitdaging ? niveau + 1 : niveau })), (x) => x.id, aantal),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);

  let invoer = $state('');
  let bakje: number[] = $state([]);
  let fout: number[] = $state([]);
  /** Bij "genoeg?": eerst ja of nee, dan het verschil. */
  let stap = $state<'janee' | 'verschil'>('janee');
  let hint = $state(false);
  let juist = $state(false);
  let schud = $state(false);
  let bezig = $state(true);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let doelEl: HTMLElement | undefined = $state();

  /** Het geld dat op tafel ligt (tellen en genoeg), van groot naar klein. */
  let geld = $derived(o.soort === 'tel' || o.soort === 'genoeg' ? [...o.geld].sort((a, b) => b - a) : []);
  /** Optellen terwijl je telt: 5, 7, 8 … */
  let tussen = $derived(geld.map((_, i) => geld.slice(0, i + 1).reduce((s, x) => s + x, 0)));
  let totaal = $derived(bakje.reduce((s, x) => s + x, 0));
  /** Het goede getal dat ze typt of kiest (in centen). */
  let antwoord = $derived(o.soort === 'tel' || o.soort === 'terug' ? o.antwoord : o.soort === 'genoeg' ? o.verschil : o.bedrag);
  /** Hoe antwoordt ze? Hele euro's typen, centen typen, of kiezen (euro's en centen samen). */
  let wijze = $derived.by((): 'euro' | 'cent' | 'kies' => {
    if (o.soort === 'tel') return o.geld.every((m) => m >= 100) ? 'euro' : o.geld.every((m) => m < 100) ? 'cent' : 'kies';
    return 'euro';
  });
  let typt = $derived((o.soort === 'tel' && wijze !== 'kies') || o.soort === 'terug' || (o.soort === 'genoeg' && stap === 'verschil'));

  const zeg = (cent: number) => spreek(geldSpraak(cent), 'getal');

  onMount(() => {
    (async () => {
      await spreek(teksten.lana.bank.start);
      if (niveau === 2) await spreek(teksten.lana.bank.centen);
      await start();
    })();
  });

  async function start() {
    invoer = '';
    bakje = [];
    fout = [];
    stap = 'janee';
    hint = false;
    juist = false;
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    if (o.soort === 'tel') await spreek(teksten.lana.bank.tel);
    else if (o.soort === 'maak') {
      await spreek(teksten.lana.bank.maak);
      await zeg(o.bedrag);
    } else if (o.soort === 'genoeg') {
      await zeg(o.prijs);
      await spreek(teksten.lana.bank.genoeg);
    } else {
      await zeg(o.prijs);
      await spreek(teksten.rekenschool.terug);
    }
  }

  async function goed(extra = 0) {
    bezig = true;
    juist = true;
    speelGoed();
    glitterOp(doelEl ?? null);
    stemming = Math.random() < 0.5 ? 'juich' : 'draai';
    opNoten(ronde.goed() + (o.uitdaging ? 1 : 0) + extra, doelEl ?? null);
    await zeg(antwoord);
    if (extra) await spreek(teksten.lana.bank.weinig);
    else if (Math.random() < 0.5) await spreek(compliment());
    await wacht(400);
    volgende();
  }

  /** Fout: eerst een hint die bij de opgave past, bij de tweede fout het antwoord. */
  async function mis(gekozen: string, hintZin: string) {
    speelBijna();
    schud = true;
    setTimeout(() => (schud = false), 500);
    stemming = 'denk';
    bezig = true;
    invoer = '';
    const uitkomst = ronde.fout(gekozen);
    hint = true;
    if (uitkomst === 'onthuld') {
      if (o.soort === 'maak') bakje = minsteStukken(o.bedrag, o.stukken);
      if (o.soort === 'genoeg') stap = 'verschil';
      await spreek(o.soort === 'maak' ? teksten.rekenschool.grootsteEerst : teksten.hetIs);
      if (o.soort !== 'maak') await zeg(antwoord);
    } else {
      await spreek(hintZin);
    }
    bezig = false;
  }

  /** Getypt antwoord: hele euro's of centen. */
  async function controleer() {
    if (bezig || juist || ronde.onthuld || invoer === '') return;
    const cent = Number(invoer) * (wijze === 'cent' && o.soort === 'tel' ? 1 : 100);
    if (cent === antwoord) return goed();
    const zin = o.soort === 'tel' ? teksten.lana.bank.telHint : o.soort === 'terug' ? teksten.rekenschool.hintTerug : teksten.lana.bank.verschilHint;
    await mis(geldTekst(cent), zin);
  }

  async function kies(k: number) {
    if (bezig || juist || ronde.onthuld || fout.includes(k)) return;
    if (k === antwoord) return goed();
    fout = [...fout, k];
    await mis(geldTekst(k), teksten.lana.bank.telHint);
  }

  async function jaNee(ja: boolean) {
    if (bezig || juist || ronde.onthuld || o.soort !== 'genoeg' || stap !== 'janee') return;
    if (ja === o.genoeg) {
      speelGoed();
      stap = 'verschil';
      await spreek(o.genoeg ? teksten.lana.bank.over : teksten.lana.bank.tekort);
    } else {
      await mis(ja ? 'ja' : 'nee', teksten.lana.bank.genoegHint);
    }
  }

  function leg(m: number) {
    if (bezig || juist || ronde.onthuld) return;
    speelTik();
    bakje = [...bakje, m].sort((a, b) => b - a);
  }
  function pak(i: number) {
    if (bezig || juist || ronde.onthuld) return;
    speelTik();
    bakje = bakje.filter((_, j) => j !== i);
  }
  async function klaarMaken() {
    if (bezig || juist || ronde.onthuld || o.soort !== 'maak' || bakje.length === 0) return;
    if (totaal === o.bedrag) {
      // Met zo weinig mogelijk geld (en zonder hint): een extra noot
      const netjes = bakje.length === minsteStukken(o.bedrag, o.stukken).length && ronde.pogingen === 0;
      return goed(netjes ? 1 : 0);
    }
    await mis(geldTekst(totaal), totaal > o.bedrag ? teksten.rekenschool.teVeel : teksten.rekenschool.teWeinig);
  }

  function volgende() {
    if (!ronde.volgende()) return;
    stemming = 'dans';
    void start();
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#f59e0b" />
    <Lana avatar={vg.avatar} {stemming} hoogte={430} />
  </div>

  <div class="speelveld bank">
    <div class="links">
      {#key ronde.nummer}
        <div class="opdracht" class:schud bind:this={doelEl}>
          {#if o.uitdaging}<span class="opgave-label">⭐ Uitdaging</span>{/if}
          {#if o.soort === 'tel'}
            <span class="vraag">Hoeveel is dit samen?</span>
          {:else if o.soort === 'maak'}
            <span class="vraag">Maak</span><span class="bedrag">{geldTekst(o.bedrag)}</span>
          {:else if o.soort === 'genoeg'}
            <span class="ding">{o.ding.emoji}</span>
            <span class="vraag">{o.ding.naam}</span><span class="bedrag">{geldTekst(o.prijs)}</span>
          {:else}
            <span class="ding">{o.ding.emoji}</span>
            <span class="vraag">{o.ding.naam}</span><span class="bedrag">{geldTekst(o.prijs)}</span>
          {/if}
        </div>
      {/key}

      {#if o.soort === 'tel' || o.soort === 'genoeg'}
        <div class="tafel">
          <span class="label">{o.soort === 'genoeg' ? 'Jouw geld' : 'Tel het geld'}{#if o.soort === 'genoeg' && (hint || stap === 'verschil')}: <strong>{geldTekst(o.heeft)}</strong>{/if}</span>
          <div class="geld">
            {#each geld as m, i (i)}
              <span class="plek">
                <GeldStuk cent={m} />
                {#if hint || juist}<span class="tussen">{geldTekst(tussen[i])}</span>{/if}
              </span>
            {/each}
          </div>
        </div>
      {:else if o.soort === 'maak'}
        <div class="tafel" class:goed={juist}>
          <span class="label">In het bakje: <strong>{geldTekst(totaal).replace(/^0 cent$/, '€ 0')}</strong></span>
          <div class="geld">
            {#each bakje as m, i (i + '-' + m)}
              <button class="tik" onclick={() => pak(i)} aria-label="Haal {geldTekst(m)} weg"><GeldStuk cent={m} /></button>
            {:else}
              <span class="leeg">Tik op het geld hieronder</span>
            {/each}
          </div>
        </div>
        <div class="portemonnee">
          <span class="label">👛</span>
          {#each [...o.stukken].sort((a, b) => b - a) as m (m)}
            <button class="tik" onclick={() => leg(m)} aria-label="Leg {geldTekst(m)} neer"><GeldStuk cent={m} /></button>
          {/each}
        </div>
      {:else}
        <div class="tafel">
          <span class="label">Je betaalt met</span>
          <div class="geld"><GeldStuk cent={o.betaald} /></div>
          {#if hint}<p class="tipvak">💡 Tel verder: {geldTekst(o.prijs)} → {geldTekst(o.betaald)}</p>{/if}
        </div>
      {/if}

      {#if o.soort === 'genoeg'}
        {#if stap === 'janee'}
          <p class="vraagregel">Heb je genoeg?</p>
        {:else}
          <p class="vraagregel">{o.genoeg ? 'Ja! Hoeveel houd je over?' : 'Nee. Hoeveel kom je te kort?'}</p>
          {#if hint}<p class="tipvak">💡 Tel verder: {geldTekst(Math.min(o.heeft, o.prijs))} → {geldTekst(Math.max(o.heeft, o.prijs))}</p>{/if}
        {/if}
      {:else if o.soort === 'terug'}
        <p class="vraagregel">Hoeveel krijg je terug?</p>
      {/if}
    </div>

    <div class="rechts">
      {#if typt}
        <div class="invoer" class:goed={juist} class:toon={ronde.onthuld}>
          {#if wijze === 'cent' && o.soort === 'tel'}
            <span class="getal">{juist || ronde.onthuld ? antwoord : invoer || '?'}</span><span class="eenheid">cent</span>
          {:else}
            <span class="eenheid">€</span><span class="getal">{juist || ronde.onthuld ? antwoord / 100 : invoer || '?'}</span>
          {/if}
        </div>
        <Cijferpad bind:waarde={invoer} max={3} uit={bezig || juist || ronde.onthuld} opOk={controleer} />
      {:else if o.soort === 'tel'}
        <div class="keuzes">
          {#each o.keuzes as k (k)}
            <button class="keuzeknop bedragknop" class:fout={fout.includes(k)} class:goed={(juist || ronde.onthuld) && k === antwoord} onclick={() => kies(k)}>{geldTekst(k)}</button>
          {/each}
        </div>
      {:else if o.soort === 'genoeg'}
        <div class="keuzes">
          <button class="keuzeknop janee ja" onclick={() => jaNee(true)}>👍 Ja</button>
          <button class="keuzeknop janee nee" onclick={() => jaNee(false)}>👎 Nee</button>
        </div>
      {:else}
        <button class="knop-goud klaar" disabled={bakje.length === 0 || juist || ronde.onthuld} onclick={klaarMaken}>Klaar ✓</button>
      {/if}
      {#if ronde.onthuld}
        <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .bank {
    flex-direction: row;
    gap: 30px;
    align-items: center;
  }
  .links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 590px;
  }
  .rechts {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    min-width: 312px;
  }
  .opdracht {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 26px;
    border-radius: 24px;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffdf7, #fef3c7);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.55), 0 14px 34px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.4s ease-out;
  }
  .opdracht.schud {
    animation: schud 0.5s ease-in-out;
  }
  .ding {
    font-size: 58px;
    line-height: 1;
  }
  .vraag {
    font-size: 30px;
    font-weight: 700;
  }
  .bedrag {
    font-family: var(--font-titel);
    font-size: 50px;
    font-weight: 700;
    color: #b91c1c;
  }
  .tafel {
    width: 100%;
    min-height: 150px;
    padding: 10px 18px 14px;
    border-radius: 22px;
    background: linear-gradient(180deg, #92400e, #78350f);
    border: 4px solid #fbbf24;
    box-shadow: inset 0 6px 14px rgba(0, 0, 0, 0.4);
  }
  .tafel.goed {
    border-color: #4ade80;
    box-shadow: 0 0 30px rgba(74, 222, 128, 0.6);
  }
  .label {
    font-size: 22px;
    font-weight: 700;
    color: #fde68a;
  }
  .geld {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 10px;
    min-height: 84px;
    margin-top: 6px;
  }
  .plek {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 4px;
  }
  .tussen {
    padding: 0 8px;
    border-radius: 999px;
    font-size: 17px;
    font-weight: 700;
    color: #052e16;
    background: #86efac;
    white-space: nowrap;
  }
  .leeg {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.6);
  }
  .tik {
    display: grid;
    place-items: center;
    transition: transform 0.1s;
  }
  .tik:active {
    transform: translateY(3px);
  }
  .portemonnee {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 18px;
    border-radius: 22px;
    background: rgba(0, 0, 0, 0.3);
  }
  .portemonnee .label {
    font-size: 34px;
  }
  .vraagregel {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    color: #fde68a;
  }
  .invoer {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 220px;
    justify-content: center;
    padding: 4px 20px;
    border-radius: 18px;
    font-family: var(--font-titel);
    font-weight: 700;
    color: #2e1065;
    background: #fff;
    border: 4px dashed #f59e0b;
  }
  .invoer.goed {
    background: #bbf7d0;
    border: 4px solid #22c55e;
  }
  .invoer.toon {
    background: #fde68a;
    border-style: solid;
  }
  .getal {
    font-size: 58px;
  }
  .eenheid {
    font-size: 34px;
    color: #b45309;
  }
  .keuzes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .bedragknop {
    min-width: 150px;
    min-height: 110px;
    font-size: 36px;
    font-family: var(--font-titel);
  }
  .janee {
    min-width: 150px;
    min-height: 130px;
    font-size: 36px;
  }
  .klaar {
    font-size: 30px;
    padding: 16px 34px;
  }
</style>
