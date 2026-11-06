<script lang="ts">
  /**
   * Mira: Lightstick-dozen. Bouw een getal met dozen van 10 en losse lichtstokken,
   * of tel hoeveel het er samen zijn (niveau 3).
   */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import { maakDozen, type DozenOpgave } from '../engine/generator-fase3';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<DozenOpgave>(
    maakDozen(niveau, aantal).map((o) => ({ opgave: o, id: `doos.${o.soort}.${o.getal}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let dozen = $state(0);
  let los = $state(0);
  let fout: number[] = $state([]);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('rust');
  let veldEl: HTMLElement | undefined = $state();
  let knopEls: HTMLElement[] = $state([]);

  // Bij tellen staat het getal al klaar in dozen; bij bouwen begint het leeg.
  let toonDozen = $derived(o.soort === 'tel' || ronde.onthuld ? Math.floor(o.getal / 10) : dozen);
  let toonLos = $derived(o.soort === 'tel' || ronde.onthuld ? o.getal % 10 : los);

  onMount(() => {
    void zegOpdracht();
  });

  async function zegOpdracht() {
    if (o.soort === 'tel') return spreek(teksten.dozen.tel);
    await spreek(teksten.dozen.bouw);
    await spreek(String(o.getal), 'getal');
  }

  function pas(soort: 'doos' | 'los', d: number) {
    if (bezig || ronde.onthuld) return;
    speelTik();
    if (soort === 'doos') dozen = Math.max(0, Math.min(9, dozen + d));
    else los = Math.max(0, Math.min(9, los + d));
  }

  async function goed(bron: Element | null | undefined) {
    bezig = true;
    speelGoed();
    glitterOp(bron ?? null);
    stemming = Math.random() < 0.5 ? 'juich' : 'draai';
    opNoten(ronde.goed(), bron);
    await spreek(String(o.getal), 'getal');
    await spreek(compliment('mira'));
    await wacht(250);
    volgende();
  }

  async function nietGoed(gekozen: number) {
    speelBijna();
    stemming = 'denk';
    if (ronde.fout(String(gekozen)) === 'onthuld') {
      await spreek(teksten.hetIs);
      await spreek(String(o.getal), 'getal');
    } else if (o.soort === 'bouw') {
      await spreek(gekozen > o.getal ? teksten.dozen.teVeel : teksten.dozen.teWeinig);
    } else {
      await spreek(bijna());
    }
  }

  async function klaar() {
    if (bezig || ronde.onthuld) return;
    const n = dozen * 10 + los;
    if (n === o.getal) await goed(veldEl);
    else await nietGoed(n);
  }

  async function kies(n: number, i: number) {
    if (bezig || ronde.onthuld || fout.includes(n)) return;
    if (n === o.getal) await goed(knopEls[i]);
    else {
      fout = [...fout, n];
      await nietGoed(n);
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    dozen = 0;
    los = 0;
    fout = [];
    bezig = false;
    stemming = 'rust';
    void zegOpdracht();
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Heldin wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    {#key ronde.nummer}
      {#if o.soort === 'bouw'}
        <div class="opdrachtkaart"><div class="getal">Maak <span class="hint-goud">{o.getal}</span></div></div>
      {/if}

      <div class="veld" bind:this={veldEl}>
        <div class="groep">
          {#each Array.from({ length: toonDozen }) as _, d (d)}
            <div class="doos">
              {#each Array.from({ length: 10 }) as _, s (s)}<span class="stok"></span>{/each}
            </div>
          {/each}
        </div>
        <div class="groep losse">
          {#each Array.from({ length: toonLos }) as _, s (s)}<span class="stok groot"></span>{/each}
        </div>
        {#if o.soort === 'bouw' && ronde.pogingen > 0}
          <div class="teller">{dozen} × 10 + {los} = {dozen * 10 + los}</div>
        {/if}
      </div>

      {#if o.soort === 'bouw'}
        <div class="bediening">
          <div class="paar">
            <button class="rond" onclick={() => pas('doos', -1)} aria-label="Doos eraf">−</button>
            <span class="label">📦 doos van 10</span>
            <button class="rond plus" onclick={() => pas('doos', 1)} aria-label="Doos erbij">+</button>
          </div>
          <div class="paar">
            <button class="rond" onclick={() => pas('los', -1)} aria-label="Lichtstok eraf">−</button>
            <span class="label">✨ losse stok</span>
            <button class="rond plus" onclick={() => pas('los', 1)} aria-label="Lichtstok erbij">+</button>
          </div>
          {#if !ronde.onthuld}<button class="knop-goud" onclick={klaar}>Klaar! ✓</button>{/if}
        </div>
      {:else}
        <div class="keuzerij">
          {#each o.keuzes ?? [] as k, i (k)}
            <button
              class="keuzeknop"
              class:fout={fout.includes(k)}
              class:goed={ronde.onthuld && k === o.getal}
              style="animation-delay:{i * 0.1}s"
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
  .getal {
    font-size: 60px;
    font-weight: 700;
  }
  .veld {
    position: relative;
    display: flex;
    align-items: end;
    gap: 34px;
    min-height: 230px;
    min-width: 600px;
    max-width: 940px;
    padding: 20px 26px;
    border-radius: 26px;
    background: rgba(10, 2, 30, 0.45);
    border: 3px dashed rgba(249, 168, 212, 0.5);
  }
  .groep {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    max-width: 640px;
  }
  .losse {
    gap: 8px;
    max-width: 200px;
  }
  .doos {
    display: flex;
    gap: 3px;
    padding: 8px 8px 12px;
    border-radius: 10px;
    background: linear-gradient(180deg, #7c3aed, #4c1d95);
    border: 2px solid #c4b5fd;
    box-shadow: 0 4px 0 #2e1065;
    animation: pop-in 0.3s ease-out;
  }
  .stok {
    width: 7px;
    height: 76px;
    border-radius: 4px;
    background: linear-gradient(180deg, #fff, #f472b6 40%, #ec4899);
    box-shadow: 0 0 8px #f472b6;
  }
  .stok.groot {
    width: 12px;
    height: 96px;
    animation: pop-in 0.25s ease-out;
  }
  .teller {
    position: absolute;
    right: 16px;
    top: 10px;
    font-size: 24px;
    color: #fde68a;
  }
  .bediening {
    display: flex;
    align-items: center;
    gap: 30px;
  }
  .paar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
  }
  .label {
    font-size: 22px;
    font-weight: 600;
  }
  .rond {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    font-size: 44px;
    font-weight: 700;
    line-height: 1;
    background: rgba(255, 255, 255, 0.2);
    border: 3px solid rgba(255, 255, 255, 0.6);
  }
  .rond.plus {
    background: #ec4899;
  }
  .rond:active {
    transform: scale(0.92);
  }
</style>
