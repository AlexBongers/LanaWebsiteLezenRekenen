<script lang="ts">
  /**
   * 🏆 Tafel-kampioen: de uitdaging voor groep 5.
   * Eerst een gouden deur met een slot: die gaat pas open na een moeilijke som (tot 100, met overschrijding).
   * Daarna alle tafels tot 10 door elkaar (later ook deelsommen); Lana typt zelf het antwoord.
   */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import Cijferpad from '../ui/Cijferpad.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import Beloning from './Beloning.svelte';
  import { kampioenDelen, kampioenHint, kampioenId, maakKampioen, maakPoortSom, type KampioenOpgave } from '../engine/generator-kampioen';
  import { Ronde } from '../games/ronde.svelte';
  import { teksten, compliment, bijna, wacht } from '../games/teksten';
  import { somDelen, spreek } from '../audio/stem';
  import { speelBijna, speelFanfare, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { bewaar, vg } from '../store/voortgang.svelte';
  import type { Resultaat } from '../engine/sessie';

  let { opTerug }: { opTerug: () => void } = $props();

  type Fase = 'poort' | 'open' | 'spel' | 'klaar';
  let fase: Fase = $state('poort');
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');

  // ---------- De poort ----------
  let poort = $state(maakPoortSom());
  let poortFout = $state(0);
  let poortWaarde = $state('');
  let poortSchud = $state(false);
  let deurEl: HTMLElement | undefined = $state();

  const zegPoort = () => spreek(somDelen(poort.a, poort.op, poort.b), 'getal');

  onMount(() => {
    (async () => {
      await spreek(teksten.uitdaging.poort);
      await zegPoort();
    })();
  });

  async function probeerPoort() {
    if (Number(poortWaarde) === poort.antwoord) {
      fase = 'open';
      stemming = 'juich';
      speelFanfare();
      glitterOp(deurEl ?? null);
      await spreek(teksten.uitdaging.open);
      await wacht(400);
      start();
    } else {
      speelBijna();
      poortSchud = true;
      setTimeout(() => (poortSchud = false), 500);
      poortFout++;
      poortWaarde = '';
      stemming = 'denk';
      if (poortFout >= 2) {
        // Na twee keer mis een nieuwe moeilijke som (het antwoord verklappen we niet: het blijft een uitdaging)
        poort = maakPoortSom();
        poortFout = 0;
        await spreek(teksten.uitdaging.nieuweSom);
        await zegPoort();
      } else {
        await spreek(teksten.uitdaging.dicht);
      }
    }
  }

  // ---------- Het spel ----------
  const AANTAL = 10;
  const niveau = vg.vaardigheden.kampioen.niveau;
  let ronde = $state<Ronde<KampioenOpgave> | null>(null);
  let o = $derived(ronde?.huidig);
  let waarde = $state('');
  let fout = $state(false);
  let juist = $state(false);
  let bezig = $state(false);
  let voortgang = $state(0);
  let verdiend = $state(0);
  let kaartEl: HTMLElement | undefined = $state();
  let uitslag: { goed: number; totaal: number; omhoog: boolean } | null = $state(null);

  function start() {
    ronde = new Ronde<KampioenOpgave>(
      maakKampioen(niveau, AANTAL).map((x) => ({ opgave: x, id: kampioenId(x) })),
      niveau,
      { opKlaar: klaar, opVoortgang: (f) => (voortgang = f) },
    );
    fase = 'spel';
    stemming = 'dans';
    void (async () => {
      await spreek(teksten.uitdaging.start);
      await zegSom();
    })();
  }

  const zegSom = () => (o ? spreek(kampioenDelen(o), 'getal') : Promise.resolve());

  async function probeer() {
    if (!ronde || !o || bezig || ronde.onthuld) return;
    if (Number(waarde) === o.antwoord) {
      bezig = true;
      juist = true;
      speelGoed();
      glitterOp(kaartEl ?? null);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      const n = ronde.goed();
      vg.noten += n;
      verdiend += n;
      await spreek(kampioenDelen(o, true), 'getal');
      if (Math.random() < 0.5) await spreek(compliment('mira'));
      await wacht(250);
      volgende();
    } else {
      speelBijna();
      const gekozen = waarde;
      fout = true;
      setTimeout(() => (fout = false), 500);
      stemming = 'denk';
      waarde = '';
      if (ronde.fout(gekozen) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(kampioenDelen(o, true), 'getal');
      } else {
        await spreek(bijna());
        await spreek(teksten.uitdaging.hint);
      }
    }
  }

  function volgende() {
    if (!ronde) return;
    waarde = '';
    fout = false;
    juist = false;
    bezig = false;
    stemming = 'dans';
    if (!ronde.volgende()) return;
    void wacht(300).then(zegSom);
  }

  async function klaar(resultaten: Resultaat[]) {
    const goed = resultaten.filter((r) => r.goed).length;
    const totaal = resultaten.length;
    // Bijna alles meteen goed? Dan komen er voortaan ook deelsommen bij.
    const omhoog = niveau === 0 && totaal > 0 && goed / totaal >= 0.8;
    const v = vg.vaardigheden.kampioen;
    vg.vaardigheden.kampioen = {
      niveau: omhoog ? 1 : v.niveau,
      recent: [...v.recent, ...resultaten.map((r) => r.goed)].slice(-20),
    };
    vg.noten += 5;
    verdiend += 5;
    await bewaar();
    fase = 'klaar';
    uitslag = { goed, totaal, omhoog };
  }

  function nogEens() {
    uitslag = null;
    verdiend = 0;
    voortgang = 0;
    start();
  }
</script>

<div class="uitdaging">
  <header>
    <button class="knop-rond" onclick={opTerug} aria-label="Terug naar de wereldtour">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <h1 class="goudtekst">🏆 Tafel-kampioen <span class="groep">groep 5</span></h1>
    <NotenTeller aantal={vg.noten} />
  </header>

  <div class="inhoud">
    <div class="heldin-plek">
      <Tekstballon kleur="#f59e0b" />
      <Duo wie="mira" {stemming} hoogte={400} />
    </div>

    {#if fase === 'poort' || fase === 'open'}
      <div class="poortvlak">
        <div class="deur" class:open={fase === 'open'} class:schud={poortSchud} bind:this={deurEl}>
          <div class="boog"></div>
          <div class="nopjes" aria-hidden="true">
            {#each Array.from({ length: 10 }) as _, i}<span style="--i:{i}"></span>{/each}
          </div>
          <div class="slot" aria-hidden="true">{fase === 'open' ? '🔓' : '🔒'}</div>
          <div class="som">
            <span>{poort.a}</span>
            <span class="op">{poort.op === '+' ? '+' : '−'}</span>
            <span>{poort.b}</span>
            <span class="op">=</span>
            <span class="antwoord" class:leeg={!poortWaarde}>{poortWaarde || '?'}</span>
          </div>
          <div class="luid"><Luidspreker opTik={zegPoort} klein /></div>
        </div>
        <div class="paneel">
          <p class="uitleg">Los de som op om de deur te openen</p>
          <Cijferpad bind:waarde={poortWaarde} uit={fase === 'open'} opOk={probeerPoort} />
        </div>
      </div>
    {:else if fase === 'spel' && ronde && o}
      <div class="spelvlak-k">
        <div class="balk"><span style="width:{voortgang * 100}%"></span></div>
        {#key ronde.nummer}
          <div class="kaart" class:goed={juist} class:fout bind:this={kaartEl}>
            <span>{o.a}</span>
            <span class="op">{o.op}</span>
            <span>{o.b}</span>
            <span class="op">=</span>
            <span class="antwoord" class:leeg={!waarde && !ronde.onthuld}>{ronde.onthuld ? o.antwoord : waarde || '?'}</span>
            <div class="luid"><Luidspreker opTik={zegSom} klein /></div>
          </div>
        {/key}
        <p class="hulpje" class:zichtbaar={ronde.pogingen > 0}>💡 {kampioenHint(o)}</p>
        {#if ronde.onthuld}
          <button class="knop-goud" onclick={volgende}>Verder ➜</button>
        {:else}
          <Cijferpad bind:waarde uit={bezig} opOk={probeer} />
        {/if}
      </div>
    {/if}
  </div>

  {#if fase === 'klaar' && uitslag}
    <Beloning
      heldin="mira"
      goed={uitslag.goed}
      totaal={uitslag.totaal}
      noten={verdiend}
      omhoog={uitslag.omhoog}
      titel="Uitdaging gehaald!"
      gesproken={teksten.uitdaging.klaar}
      melding={uitslag.omhoog ? '🏆 Nu komen er ook deelsommen bij!' : undefined}
      terugTekst="Naar de wereldtour"
      opNogEens={nogEens}
      {opTerug}
    />
  {/if}
</div>

<style>
  .uitdaging {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 14px 24px 18px;
  }
  header {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  h1 {
    flex: 1;
    margin: 0;
    font-size: 46px;
    text-align: center;
  }
  .groep {
    display: inline-block;
    vertical-align: middle;
    margin-left: 8px;
    padding: 2px 14px;
    border-radius: 999px;
    font-size: 20px;
    color: #422006;
    background: linear-gradient(180deg, #fde68a, #f59e0b);
    -webkit-text-fill-color: #422006;
    text-shadow: none;
  }
  .inhoud {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 290px 1fr;
  }
  .heldin-plek {
    position: relative;
    align-self: end;
    justify-self: center;
    padding-bottom: 10px;
  }
  .poortvlak {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 44px;
    perspective: 1200px;
  }
  .deur {
    position: relative;
    width: 400px;
    height: 540px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    border-radius: 200px 200px 22px 22px;
    background:
      radial-gradient(ellipse at 35% 25%, rgba(255, 255, 255, 0.45), transparent 45%),
      linear-gradient(160deg, #fde68a, #f59e0b 45%, #b45309);
    border: 8px solid #fff7c2;
    box-shadow: 0 0 60px rgba(251, 191, 36, 0.6), inset 0 0 40px rgba(120, 53, 15, 0.5), 0 20px 40px rgba(0, 0, 0, 0.5);
    transform-origin: 0% 50%;
    transition: transform 1.1s cubic-bezier(0.5, 0, 0.3, 1);
  }
  .deur.open {
    transform: rotateY(-75deg);
  }
  .deur.schud {
    animation: schud 0.5s ease-in-out;
  }
  .boog {
    position: absolute;
    inset: 22px;
    border-radius: 180px 180px 12px 12px;
    border: 4px solid rgba(255, 247, 194, 0.7);
    pointer-events: none;
  }
  .nopjes span {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff, #b45309);
  }
  .nopjes span:nth-child(-n + 5) {
    top: 86%;
  }
  .nopjes span:nth-child(n + 6) {
    top: 92%;
  }
  .nopjes span:nth-child(5n + 1) { left: 16%; }
  .nopjes span:nth-child(5n + 2) { left: 32%; }
  .nopjes span:nth-child(5n + 3) { left: 48%; }
  .nopjes span:nth-child(5n + 4) { left: 64%; }
  .nopjes span:nth-child(5n) { left: 80%; }
  .slot {
    font-size: 96px;
    line-height: 1;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.4));
  }
  .deur.open .slot {
    animation: pop-in 0.5s ease-out;
  }
  .som {
    display: flex;
    gap: 12px;
    padding: 12px 24px;
    border-radius: 22px;
    background: rgba(66, 32, 6, 0.85);
    font-size: 56px;
    font-weight: 700;
    color: #fff;
    box-shadow: inset 0 0 0 3px #fde68a;
  }
  .op {
    color: var(--goud);
  }
  .antwoord {
    min-width: 1.4em;
    text-align: center;
    color: #86efac;
  }
  .antwoord.leeg {
    color: #f9a8d4;
  }
  .deur .luid {
    position: absolute;
    right: 26px;
    bottom: 70px;
  }
  .paneel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .uitleg {
    margin: 0;
    max-width: 330px;
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    color: #fde68a;
  }
  .spelvlak-k {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }
  .balk {
    width: 560px;
    height: 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }
  .balk span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #fde68a, #f59e0b);
    transition: width 0.5s;
  }
  .kaart {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 16px 92px 16px 40px;
    border-radius: 30px;
    font-size: 84px;
    font-weight: 700;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05));
    border: 4px solid rgba(253, 230, 138, 0.7);
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.35), 0 12px 30px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.4s ease-out;
  }
  .kaart.goed {
    border-color: #4ade80;
    box-shadow: 0 0 40px rgba(74, 222, 128, 0.6);
  }
  .kaart.fout {
    animation: schud 0.5s ease-in-out;
  }
  .kaart .luid {
    position: absolute;
    right: 18px;
    top: 50%;
    translate: 0 -50%;
  }
  .hulpje {
    margin: 0;
    min-height: 34px;
    padding: 4px 18px;
    border-radius: 14px;
    font-size: 24px;
    font-weight: 600;
    color: #fef3c7;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .hulpje.zichtbaar {
    opacity: 1;
  }
</style>
