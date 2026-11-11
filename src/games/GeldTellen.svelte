<script lang="ts">
  /** Mira: Geld tellen. Munten en briefjes vallen op de toonbank; hoeveel is het samen? */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Geld3D from './Geld3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { geldTekst, maakGeld, type GeldOpgave } from '../engine/generator-fase6';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<GeldOpgave>(
    maakGeld(niveau, aantal).map((o) => ({ opgave: o, id: `geld.${o.geld.map((m) => m.waarde).join('+')}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: number[] = $state([]);
  let juist = $state(false);
  let goed = $state(0);
  let tel = $state(0);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let drieD = $state(heeftWebGL());
  let knopEls: HTMLElement[] = $state([]);

  const zegBedrag = (n: number) => spreek([String(n), o.eenheid], 'getal');

  onMount(() => {
    void spreek(teksten.geld.start);
  });

  async function kies(k: number, i: number) {
    if (bezig || ronde.onthuld || fout.includes(k)) return;
    if (k === o.totaal) {
      bezig = true;
      juist = true;
      goed++;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      await zegBedrag(o.totaal);
      await spreek(compliment('mira'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, k];
      stemming = 'denk';
      tel++;
      if (ronde.fout(String(k)) === 'onthuld') {
        await spreek(teksten.hetIs);
        await zegBedrag(o.totaal);
      } else {
        await spreek(bijna());
        await spreek(teksten.geld.hint);
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    fout = [];
    juist = false;
    bezig = false;
    stemming = 'rust';
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Duo wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <p class="vraag">Hoeveel geld is het samen?</p>
    <div class="toonbank">
      {#if drieD}
        <Geld3D geld={o.geld} eenheid={o.eenheid} sleutel={ronde.nummer} {goed} {tel} opFout={() => (drieD = false)} />
      {:else}
        <div class="plat">
          {#each o.geld as m}
            <span class="stuk" class:briefje={m.soort === 'briefje'}>{geldTekst(m.waarde, o.eenheid)}</span>
          {/each}
        </div>
      {/if}
    </div>
    {#key ronde.nummer}
      <div class="keuzerij">
        {#each o.keuzes as k, i (k)}
          <button
            class="keuzeknop bedrag"
            class:fout={fout.includes(k)}
            class:goed={(juist || ronde.onthuld) && k === o.totaal}
            style="animation-delay:{i * 0.1}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}>{geldTekst(k, o.eenheid)}</button
          >
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
    margin: 0;
    padding: 6px 26px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 32px;
    font-weight: 700;
    color: #fde68a;
  }
  .toonbank {
    width: 900px;
    height: 400px;
    display: grid;
    place-items: center;
    -webkit-mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 74%, transparent 100%);
    mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 74%, transparent 100%);
  }
  .plat {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: center;
  }
  .stuk {
    display: grid;
    place-items: center;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff7c2, #f2c94c);
    color: #3f2a00;
    font-size: 30px;
    font-weight: 700;
  }
  .stuk.briefje {
    width: 180px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fca5a5, #ef4444);
    color: #fff;
  }
  .bedrag {
    min-width: 190px;
    font-size: 54px;
    font-family: var(--font-titel);
  }
</style>
