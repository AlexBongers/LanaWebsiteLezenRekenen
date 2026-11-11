<script lang="ts">
  /** Mira: Ballonnen-rij. Tik de ballonnen van het kleinste naar het grootste getal. */
  import { onMount } from 'svelte';
  import Duo from '../art/Duo.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Ballon3D from './Ballon3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { maakBallonnen, type BallonOpgave } from '../engine/generator-fase5';
  import { spreek } from '../audio/stem';
  import { speelBijna, speelGoed, speelPoef } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<BallonOpgave>(
    maakBallonnen(niveau, Math.max(4, Math.round(aantal * 0.75))).map((o) => ({ opgave: o, id: `ballon.${[...o.getallen].sort((a, b) => a - b).join('-')}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let volgorde = $derived([...o.getallen].sort((a, b) => a - b));
  let gepoft: number[] = $state([]);
  let fouten: number[] = $state([]);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let drieD = $state(heeftWebGL());
  let vlakEl: HTMLElement | undefined = $state();
  let knopEls: HTMLElement[] = $state([]);
  const bron = (i: number) => (drieD ? (vlakEl ?? null) : knopEls[i]);

  onMount(() => {
    void spreek(teksten.ballonnen.start);
  });

  async function tik(n: number) {
    if (bezig || gepoft.includes(n)) return;
    const i = o.getallen.indexOf(n);
    if (n === volgorde[gepoft.length]) {
      speelPoef();
      gepoft = [...gepoft, n];
      void spreek(String(n), 'getal');
      if (gepoft.length === volgorde.length) {
        bezig = true;
        speelGoed();
        glitterOp(bron(i));
        stemming = Math.random() < 0.5 ? 'juich' : 'draai';
        if (!ronde.onthuld) opNoten(ronde.goed(), bron(i));
        await wacht(600);
        await spreek(ronde.onthuld ? teksten.ballonnen.klaar : compliment('mira'));
        await wacht(200);
        volgende();
      }
    } else if (!ronde.onthuld) {
      speelBijna();
      fouten = [...fouten, n];
      stemming = 'denk';
      if (ronde.fout(String(n)) === 'onthuld') {
        // Nu staan er nummertjes op de ballonnen; ze mag ze zo afmaken.
        await spreek(teksten.ballonnen.hint);
      } else {
        await spreek(bijna());
        await spreek(teksten.ballonnen.hint);
      }
    } else {
      speelBijna();
      fouten = [...fouten, n];
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    gepoft = [];
    fouten = [];
    bezig = false;
    stemming = 'dans';
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#ec4899" />
    <Duo wie="mira" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="rij" aria-label="Al op volgorde">
      {#each volgorde as n, i}
        <span class="vakje" class:vol={i < gepoft.length}>{i < gepoft.length ? gepoft[i] : ''}</span>
        {#if i < volgorde.length - 1}<span class="pijl">&lt;</span>{/if}
      {/each}
    </div>
    {#if drieD}
      <div class="lucht" bind:this={vlakEl}>
        <Ballon3D
          getallen={o.getallen}
          {gepoft}
          {fouten}
          toonVolgorde={ronde.onthuld}
          actief={!bezig}
          sleutel={ronde.nummer}
          opKies={tik}
          opFout={() => (drieD = false)}
        />
      </div>
    {/if}
    {#key ronde.nummer}
      <div class="keuzerij" class:onzichtbaar-3d={drieD}>
        {#each o.getallen as n, i (n)}
          <button
            class="keuzeknop getalknop"
            class:goed={gepoft.includes(n)}
            class:fout={fouten.at(-1) === n}
            bind:this={knopEls[i]}
            onclick={() => tik(n)}
            aria-label="Ballon {n}">{n}</button
          >
        {/each}
      </div>
    {/key}
  </div>
</div>

<style>
  .rij {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 22px;
    border-radius: 26px;
    background: rgba(0, 0, 0, 0.3);
  }
  .vakje {
    display: grid;
    place-items: center;
    width: 96px;
    height: 74px;
    border-radius: 18px;
    font-size: 44px;
    font-weight: 700;
    border: 3px dashed rgba(253, 230, 138, 0.5);
    transition: all 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .vakje.vol {
    border-style: solid;
    border-color: #fde68a;
    background: linear-gradient(180deg, #fffaf0, #fde68a);
    color: var(--inkt);
    transform: scale(1.06);
  }
  .pijl {
    font-size: 34px;
    font-weight: 700;
    color: #fde68a;
  }
  .lucht {
    width: 960px;
    height: 450px;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent);
  }
  .getalknop {
    min-width: 150px;
    font-size: 60px;
    font-family: var(--font-titel);
  }
</style>
