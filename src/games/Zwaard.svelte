<script lang="ts">
  /** Rumi: Klankgroepen-zwaard. Tik tussen de letters om het woord in klankgroepen te hakken. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import { knipPlekken, maakZwaard, type ZwaardOpgave } from '../engine/generator-fase3';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelPoef, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<ZwaardOpgave>(
    maakZwaard(niveau, aantal).map((o) => ({ opgave: o, id: `zwaard.${o.woord}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let juist = $derived(knipPlekken(o.delen));
  let knippen: number[] = $state([]);
  let gehakt = $state(false);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' = $state('rust');
  let woordEl: HTMLElement | undefined = $state();

  let maat = $derived(Math.min(100, Math.floor(860 / o.woord.length)));
  const klinker = (l: string) => 'aeiouy'.includes(l);

  onMount(() => {
    void spreek(teksten.zwaard.start);
    return stopSpreken;
  });

  function knip(na: number) {
    if (bezig || gehakt || ronde.onthuld) return;
    speelTik();
    knippen = knippen.includes(na) ? knippen.filter((k) => k !== na) : [...knippen, na].sort((a, b) => a - b);
  }

  async function hak() {
    if (bezig || ronde.onthuld || knippen.length === 0) return;
    if (knippen.join() === juist.join()) {
      bezig = true;
      gehakt = true;
      speelPoef();
      speelGoed();
      glitterOp(woordEl ?? null);
      stemming = 'juich';
      opNoten(ronde.goed(), woordEl);
      await spreek(o.woord, 'woord');
      await spreek(compliment());
      await wacht(300);
      volgende();
    } else {
      speelBijna();
      stemming = 'denk';
      if (ronde.fout(knippen.join(',')) === 'onthuld') {
        knippen = [...juist];
        gehakt = true;
        await spreek(teksten.zwaard.hint);
        await spreek(o.woord, 'woord');
      } else {
        knippen = [];
        await spreek(teksten.zwaard.nogEens);
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    knippen = [];
    gehakt = false;
    bezig = false;
    stemming = 'rust';
  }
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#8b5cf6" />
    <Heldin wie="rumi" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    {#key ronde.nummer}
      <div class="woord" class:gehakt bind:this={woordEl} style="--maat:{maat}px">
        {#each o.woord.split('') as letter, i}
          <span class="letter" class:klinker={ronde.pogingen > 0 && klinker(letter)}>{letter}</span>
          {#if i < o.woord.length - 1}
            <button class="spleet" class:geknipt={knippen.includes(i + 1)} onclick={() => knip(i + 1)} aria-label="Hak na letter {i + 1}">
              <span class="streep"></span>
            </button>
          {/if}
        {/each}
      </div>
    {/key}
    <p class="tip">{ronde.pogingen > 0 && !ronde.onthuld ? 'Tip: elke klankgroep heeft een klinker (geel).' : 'Tik tussen de letters waar je wilt hakken.'}</p>
    {#if ronde.onthuld}
      <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
    {:else}
      <button class="knop-goud hak" disabled={knippen.length === 0 || bezig} onclick={hak}>🗡️ Hakken!</button>
    {/if}
  </div>
</div>

<style>
  .woord {
    display: flex;
    align-items: stretch;
    padding: 26px 30px;
    border-radius: 30px;
    background: linear-gradient(180deg, #fffdf7, #f5f3ff);
    border: 4px solid #fff;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.5), 0 16px 40px rgba(0, 0, 0, 0.4);
    animation: pop-in 0.45s ease-out;
  }
  .letter {
    font-family: var(--font-lees);
    font-size: var(--maat);
    font-weight: 700;
    line-height: 1.1;
    color: var(--inkt);
    padding: 0 2px;
    border-radius: 10px;
    transition: background 0.3s;
  }
  .letter.klinker {
    background: #fde68a;
  }
  .spleet {
    position: relative;
    width: 40px;
    margin: 0 -10px;
    z-index: 1;
    display: grid;
    place-items: center;
  }
  .streep {
    width: 4px;
    height: 70%;
    border-radius: 2px;
    background: rgba(124, 58, 237, 0.18);
    transition: all 0.2s;
  }
  .spleet.geknipt .streep {
    width: 7px;
    height: 100%;
    background: linear-gradient(180deg, #fff, #a78bfa, #fff);
    box-shadow: 0 0 14px #a78bfa;
  }
  .gehakt .spleet.geknipt {
    margin: 0 16px;
    transition: margin 0.4s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .tip {
    margin: 0;
    font-size: 26px;
    color: #ddd6fe;
  }
  .hak:disabled {
    opacity: 0.5;
    filter: grayscale(0.6);
  }
</style>
