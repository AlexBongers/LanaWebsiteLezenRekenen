<script lang="ts">
  /**
   * Rekenschool: Geldwinkel. Geld écht gebruiken:
   *  - Betalen: tik munten en briefjes uit je portemonnee op de toonbank tot je precies genoeg hebt.
   *    (Tip: begin met het grootste geld.)
   *  - Teruggeven: je betaalt met een briefje; hoeveel krijg je terug? (aanvullen vanaf de prijs)
   */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import { maakWinkel, type WinkelOpgave } from '../engine/generator-rekenschool';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import { kiesVers } from './vers';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<WinkelOpgave>(
    kiesVers('winkel', maakWinkel(niveau, aantal * 4).map((o) => ({ opgave: o, id: `winkel.${o.soort}.${o.prijs}${o.eenheid}` })), (x) => x.id, aantal),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let toonbank: number[] = $state([]);
  let fout: number[] = $state([]);
  let juist = $state(false);
  let bezig = $state(true);
  let schud = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let toonbankEl: HTMLElement | undefined = $state();
  let knopEls: HTMLElement[] = $state([]);

  let totaal = $derived(toonbank.reduce((s, m) => s + m, 0));
  const bedrag = (n: number) => (o.eenheid === 'euro' ? `€ ${n}` : `${n} cent`);
  const isBriefje = (w: number) => o.eenheid === 'euro' && w >= 5;
  const zegPrijs = () => spreek([String(o.prijs), o.eenheid], 'getal');

  onMount(() => {
    (async () => {
      await spreek(teksten.rekenschool.winkel);
      await start();
    })();
  });

  async function start() {
    toonbank = [];
    fout = [];
    juist = false;
    bezig = false;
    if (o.uitdaging) await spreek(teksten.rekenschool.uitdaging);
    if (o.soort === 'terug') {
      await spreek(teksten.rekenschool.terug);
    }
    await zegPrijs();
  }

  function leg(w: number) {
    if (bezig || juist) return;
    speelTik();
    toonbank = [...toonbank, w].sort((a, b) => b - a);
  }

  function pak(i: number) {
    if (bezig || juist) return;
    speelTik();
    toonbank = toonbank.filter((_, j) => j !== i);
  }

  async function betaal() {
    if (bezig || juist || toonbank.length === 0) return;
    if (totaal === o.prijs) {
      await goed(toonbankEl ?? null);
    } else {
      speelBijna();
      schud = true;
      setTimeout(() => (schud = false), 500);
      stemming = 'denk';
      bezig = true;
      const uitkomst = ronde.fout(String(totaal));
      await spreek(totaal > o.prijs ? teksten.rekenschool.teVeel : teksten.rekenschool.teWeinig);
      if (uitkomst === 'onthuld') {
        // Laat zien hoe het kan: van groot naar klein
        toonbank = voorbeeld(o.prijs, o.munten);
        await spreek(teksten.rekenschool.grootsteEerst);
      }
      bezig = false;
    }
  }

  /** Zo betaal je het netst: steeds het grootste geld dat nog past. */
  function voorbeeld(prijs: number, munten: number[]): number[] {
    const uit: number[] = [];
    let rest = prijs;
    for (const m of [...munten].sort((a, b) => b - a)) {
      while (rest >= m) {
        uit.push(m);
        rest -= m;
      }
    }
    return uit;
  }

  async function kiesTerug(k: number, i: number) {
    if (bezig || juist || ronde.onthuld || fout.includes(k)) return;
    if (k === o.betaald - o.prijs) {
      await goed(knopEls[i]);
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      bezig = true;
      const uitkomst = ronde.fout(String(k));
      await spreek(teksten.rekenschool.hintTerug);
      if (uitkomst === 'onthuld') await spreek([String(o.betaald - o.prijs), o.eenheid], 'getal');
      bezig = false;
    }
  }

  async function goed(bron: Element | null) {
    bezig = true;
    juist = true;
    speelGoed();
    glitterOp(bron);
    stemming = Math.random() < 0.5 ? 'juich' : 'draai';
    opNoten(ronde.goed() + (o.uitdaging ? 1 : 0), bron);
    if (o.soort === 'terug') await spreek([String(o.betaald - o.prijs), o.eenheid], 'getal');
    await spreek(compliment('mira'));
    await wacht(400);
    volgende();
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

  <div class="speelveld winkel">
    {#key ronde.nummer}
      <div class="etalage">
        {#if o.uitdaging}<span class="ster">⭐ Uitdaging</span>{/if}
        <span class="artikel">{o.artikel.emoji}</span>
        <div class="prijskaart">
          <span class="naam">{o.artikel.naam}</span>
          <span class="prijs">{bedrag(o.prijs)}</span>
        </div>
        <button class="knop-rond luid" onclick={zegPrijs} aria-label="Prijs voorlezen">🔊</button>
      </div>
    {/key}

    {#if o.soort === 'betalen'}
      <div class="toonbank" class:schud class:goed={juist} bind:this={toonbankEl}>
        <span class="label">Op de toonbank: <strong>{bedrag(totaal)}</strong></span>
        <div class="geld">
          {#each toonbank as m, i (i + '-' + m)}
            <button class="stuk" class:briefje={isBriefje(m)} class:cent={o.eenheid === 'cent'} onclick={() => pak(i)} aria-label="Haal {bedrag(m)} terug">
              {o.eenheid === 'euro' ? `€${m}` : m}
            </button>
          {:else}
            <span class="leeg">Tik op je geld om te betalen</span>
          {/each}
        </div>
      </div>
      <div class="portemonnee">
        <span class="label">👛 Jouw geld</span>
        {#each [...o.munten].sort((a, b) => b - a) as m (m)}
          <button class="stuk" class:briefje={isBriefje(m)} class:cent={o.eenheid === 'cent'} onclick={() => leg(m)} aria-label="Leg {bedrag(m)} neer">
            {o.eenheid === 'euro' ? `€${m}` : m}
          </button>
        {/each}
        <button class="knop-goud betaal" disabled={toonbank.length === 0 || juist} onclick={betaal}>Betalen ✓</button>
      </div>
    {:else}
      <div class="terug">
        <span class="betaal-met">Je betaalt met <span class="stuk briefje groot">€{o.betaald}</span></span>
        <p class="vraag">Hoeveel krijg je terug?</p>
        {#if ronde.pogingen > 0}
          <p class="aanvul">💡 Tel verder: {o.prijs} → {o.betaald}</p>
        {/if}
      </div>
      {#key ronde.nummer}
        <div class="keuzerij">
          {#each o.keuzes as k, i (k)}
            <button
              class="keuzeknop bedrag"
              class:fout={fout.includes(k)}
              class:goed={(juist || ronde.onthuld) && k === o.betaald - o.prijs}
              bind:this={knopEls[i]}
              onclick={() => kiesTerug(k, i)}>{bedrag(k)}</button
            >
          {/each}
        </div>
      {/key}
      {#if ronde.onthuld}
        <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
      {/if}
    {/if}
    {#if o.soort === 'betalen' && ronde.onthuld}
      <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .winkel {
    gap: 18px;
  }
  .etalage {
    position: relative;
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 10px 26px;
    border-radius: 26px;
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
  .artikel {
    font-size: 84px;
    line-height: 1;
    font-family: 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
  }
  .prijskaart {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 22px;
    border-radius: 14px;
    background: #fffdf7;
    color: var(--inkt);
    transform: rotate(-3deg);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
  }
  .naam {
    font-size: 22px;
    font-weight: 600;
  }
  .prijs {
    font-size: 46px;
    font-weight: 700;
    color: #b91c1c;
  }
  .toonbank {
    width: 820px;
    min-height: 140px;
    padding: 10px 18px;
    border-radius: 22px;
    background: linear-gradient(180deg, #92400e, #78350f);
    border: 4px solid #fbbf24;
    box-shadow: inset 0 6px 14px rgba(0, 0, 0, 0.4);
  }
  .toonbank.goed {
    border-color: #4ade80;
    box-shadow: 0 0 30px rgba(74, 222, 128, 0.6);
  }
  .toonbank.schud {
    animation: schud 0.5s ease-in-out;
  }
  .label {
    font-size: 22px;
    font-weight: 700;
    color: #fde68a;
  }
  .geld {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
    min-height: 80px;
    align-items: center;
  }
  .leeg {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.6);
  }
  .portemonnee {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
    border-radius: 22px;
    background: rgba(0, 0, 0, 0.3);
  }
  .stuk {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    font-family: var(--font-titel);
    font-size: 26px;
    font-weight: 700;
    color: #422006;
    background: radial-gradient(circle at 35% 30%, #fff7c2, #f2c94c 55%, #b7791f);
    border: 4px solid #e5e7eb;
    box-shadow: 0 5px 0 rgba(0, 0, 0, 0.35);
    transition: transform 0.1s;
  }
  .stuk:active {
    transform: translateY(3px);
  }
  .stuk.cent {
    background: radial-gradient(circle at 35% 30%, #fde68a, #d97706 60%, #92400e);
    border-color: #fbbf24;
    width: 66px;
    height: 66px;
    font-size: 24px;
  }
  .stuk.briefje {
    width: 112px;
    height: 64px;
    border-radius: 10px;
    color: #fff;
    background: linear-gradient(135deg, #f87171, #b91c1c);
    border: 3px solid #fecaca;
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
  }
  .stuk.groot {
    display: inline-grid;
    vertical-align: middle;
  }
  .betaal {
    margin-left: auto;
  }
  .terug {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .betaal-met {
    font-size: 30px;
    font-weight: 700;
  }
  .vraag {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    color: #fde68a;
  }
  .aanvul {
    margin: 0;
    font-size: 26px;
    color: #fef3c7;
  }
  .bedrag {
    min-width: 170px;
    font-size: 48px;
    font-family: var(--font-titel);
  }
</style>
