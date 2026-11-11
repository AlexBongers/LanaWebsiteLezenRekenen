<script lang="ts">
  /** Mira: Klok-show. Kijk naar de wekker: hoe laat is het? Hele uren, later ook halve uren. */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Klok3D from './Klok3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { klokTekst, klokZin, maakKlok, type KlokOpgave, type Tijd } from '../engine/generator-fase5';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<KlokOpgave>(
    maakKlok(niveau, aantal).map((o) => ({ opgave: o, id: `klok.${klokTekst(o.tijd)}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let fout: string[] = $state([]);
  let bezig = $state(false);
  let juist = $state(false);
  let rinkel = $state(0);
  let wiebel = $state(0);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let drieD = $state(heeftWebGL());
  let knopEls: HTMLElement[] = $state([]);

  onMount(() => {
    void spreek(teksten.klok.start);
  });

  async function kies(k: Tijd, i: number) {
    const tekst = klokTekst(k);
    if (bezig || ronde.onthuld || fout.includes(tekst)) return;
    if (tekst === klokTekst(o.tijd)) {
      bezig = true;
      juist = true;
      rinkel++;
      speelGoed();
      glitterOp(knopEls[i]);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), knopEls[i]);
      await spreek(klokZin(o.tijd), 'zin');
      await spreek(compliment('mira'));
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, tekst];
      wiebel++;
      stemming = 'denk';
      if (ronde.fout(tekst) === 'onthuld') {
        await spreek(teksten.hetIs);
        await spreek(klokZin(o.tijd), 'zin');
      } else {
        await spreek(bijna());
        await spreek(o.tijd.min === 30 ? teksten.klok.hintHalf : teksten.klok.hint);
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

  // Platte klok als er geen 3D is
  let minHoek = $derived(o.tijd.min * 6);
  let uurHoek = $derived(((o.tijd.uur % 12) + o.tijd.min / 60) * 30);
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Duo wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="klokvlak">
      {#if drieD}
        <Klok3D tijd={o.tijd} {rinkel} {wiebel} opFout={() => (drieD = false)} />
      {:else}
        <svg viewBox="-110 -110 220 220" class="platte-klok" aria-label="Klok">
          <circle r="100" fill="#fff" stroke="#f472b6" stroke-width="10" />
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as u}
            <text x={Math.sin((u / 12) * Math.PI * 2) * 74} y={-Math.cos((u / 12) * Math.PI * 2) * 74 + 7} text-anchor="middle" font-size="22" font-weight="700" fill="#2e1065">{u}</text>
          {/each}
          <line x1="0" y1="0" x2="0" y2="-48" stroke="#2e1065" stroke-width="9" stroke-linecap="round" transform="rotate({uurHoek})" />
          <line x1="0" y1="0" x2="0" y2="-80" stroke="#db2777" stroke-width="5" stroke-linecap="round" transform="rotate({minHoek})" />
          <circle r="7" fill="#fbbf24" />
        </svg>
      {/if}
    </div>
    <p class="vraag">Hoe laat is het?</p>
    {#key ronde.nummer}
      <div class="keuzerij">
        {#each o.keuzes as k, i (klokTekst(k))}
          {@const tekst = klokTekst(k)}
          <button
            class="keuzeknop tijdknop"
            class:fout={fout.includes(tekst)}
            class:goed={(juist || ronde.onthuld) && tekst === klokTekst(o.tijd)}
            style="animation-delay:{i * 0.1}s"
            bind:this={knopEls[i]}
            onclick={() => kies(k, i)}>{tekst}</button
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
  .klokvlak {
    width: 760px;
    height: 400px;
    display: grid;
    place-items: center;
    -webkit-mask-image: radial-gradient(ellipse 60% 64% at 50% 50%, #000 72%, transparent 100%);
    mask-image: radial-gradient(ellipse 60% 64% at 50% 50%, #000 72%, transparent 100%);
  }
  .platte-klok {
    width: 330px;
    height: 330px;
  }
  .vraag {
    margin: -10px 0 0;
    font-size: 30px;
    font-weight: 700;
    color: #fbcfe8;
  }
  .tijdknop {
    min-width: 200px;
    font-size: 52px;
    font-family: var(--font-titel);
  }
</style>
