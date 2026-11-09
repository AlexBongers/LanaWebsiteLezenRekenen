<script lang="ts">
  /** Mira: Getallen-spring. Tik op de getallenlijn waar het getal staat; bij sommen eerst naar het hele tiental. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import Luidspreker from '../ui/Luidspreker.svelte';
  import { maakSpringen, type SpringOpgave } from '../engine/generator-fase3';
  import Spring3D from './Spring3D.svelte';
  import { heeftWebGL } from '../ui/drie-d';
  import { somId } from '../engine/generator-rekenen';
  import { spreek, somDelen, stopSpreken } from '../audio/stem';
  import { speelBijna, speelGoed, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { teksten, compliment, bijna, wacht } from './teksten';
  import { Ronde } from './ronde.svelte';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar, niveau = 0, aantal = 8 }: SpelProps = $props();

  // svelte-ignore state_referenced_locally
  const ronde = new Ronde<SpringOpgave>(
    maakSpringen(niveau, aantal).map((o) => ({ opgave: o, id: o.som ? somId(o.som) : `spring.${o.van}-${o.doelen[0]}` })),
    niveau,
    { opKlaar, opVoortgang },
  );
  let o = $derived(ronde.huidig);
  let stap = $state(0); // welk doel nu (bij sommen: 0 = tiental, 1 = antwoord)
  let positie: number | null = $state(null); // waar Mira's ster staat
  let fout: number[] = $state([]);
  let bezig = $state(false);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' | 'draai' = $state('dans');
  let lijnEl: HTMLElement | undefined = $state();
  /** 3D als het apparaat dat kan; anders de platte getallenlijn. */
  let drieD = $state(heeftWebGL());

  const B = 920; // breedte van de getallenlijn in px
  let streepjes = $derived(Array.from({ length: (o.tot - o.van) / o.stap + 1 }, (_, i) => o.van + i * o.stap));
  const x = (n: number) => 30 + ((n - o.van) / (o.tot - o.van)) * (B - 60);
  /** Welke getallen staan erbij? Bij 'getal' alleen begin en eind (tellen!), tenzij als hint. */
  const metGetal = (n: number) =>
    o.soort === 'tiental' || n % 10 === 0 || ronde.onthuld || (o.soort === 'getal' && ronde.pogingen > 0 && n % 5 === 0);

  onMount(() => {
    (async () => {
      await spreek(teksten.springen.start);
      await zegOpdracht();
    })();
  });

  async function zegOpdracht() {
    if (o.som) {
      await spreek(somDelen(o.som.a, o.som.op, o.som.b), 'getal');
      if (stap === 0) await spreek(teksten.springen.sprong);
    } else {
      await spreek(teksten.springen.waar);
      await spreek(String(o.doelen[0]), 'getal');
    }
  }

  async function tik(n: number) {
    if (bezig || ronde.onthuld || fout.includes(n)) return;
    speelTik();
    positie = n;
    const doel = o.doelen[stap];
    if (n === doel) {
      if (stap < o.doelen.length - 1) {
        stap++;
        speelGoed();
        await spreek(teksten.springen.naarTiental);
        return;
      }
      bezig = true;
      speelGoed();
      glitterOp(lijnEl ?? null);
      stemming = Math.random() < 0.5 ? 'juich' : 'draai';
      opNoten(ronde.goed(), lijnEl);
      await spreek(String(doel), 'getal');
      await spreek(compliment('mira'));
      await wacht(250);
      volgende();
    } else {
      speelBijna();
      fout = [...fout, n];
      stemming = 'denk';
      if (ronde.fout(String(n)) === 'onthuld') {
        positie = o.doelen[o.doelen.length - 1];
        stap = o.doelen.length;
        await spreek(teksten.hetIs);
        await spreek(String(positie), 'getal');
      } else {
        await spreek(bijna());
      }
    }
  }

  function volgende() {
    if (!ronde.volgende()) return;
    stap = 0;
    positie = null;
    fout = [];
    bezig = false;
    stemming = 'dans';
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
      <div class="opdrachtkaart opdracht">
        {#if o.som}
          <div class="som">{o.som.a} {o.som.op === '+' ? '+' : '−'} {o.som.b} = ?</div>
          <div class="stapjes">
            <span class:klaar={stap > 0}>1. naar {o.doelen[0]}</span>
            <span class:klaar={stap > 1}>2. naar het antwoord</span>
          </div>
        {:else}
          <div class="som">Waar staat <span class="hint-goud">{o.doelen[0]}</span>?</div>
        {/if}
        <div class="luid"><Luidspreker opTik={zegOpdracht} /></div>
      </div>

    {/key}

      <div class="lijn" class:drie={drieD} bind:this={lijnEl} style="width:{B}px">
        {#if drieD}
          <Spring3D
            van={o.van}
            tot={o.tot}
            stap={o.stap}
            {positie}
            {fout}
            doelen={ronde.onthuld ? o.doelen : []}
            getoond={streepjes.filter(metGetal)}
            opTik={tik}
            opFout={() => (drieD = false)}
          />
          <!-- Onzichtbare knoppen: toetsenbord, schermlezers en tests -->
          <div class="verborgen">
            {#each streepjes as n (n)}
              <button onclick={() => tik(n)} aria-label="Getal {n}">{n}</button>
            {/each}
          </div>
        {:else}
          <div class="balk"></div>
          {#each streepjes as n (n)}
            <button
              class="streep"
              class:tien={n % 10 === 0}
              class:fout={fout.includes(n)}
              class:doel={ronde.onthuld && o.doelen.includes(n)}
              style="left:{x(n)}px"
              onclick={() => tik(n)}
              aria-label="Getal {n}"
            >
              <span class="tick"></span>
              {#if metGetal(n)}<span class="getal">{n}</span>{/if}
            </button>
          {/each}
          {#if positie !== null}
            {#key positie}
              <div class="mira" style="left:{x(positie)}px">⭐</div>
            {/key}
          {/if}
        {/if}
      </div>
    {#if ronde.onthuld}
      <button class="knop-goud verder-knop" onclick={volgende}>Verder ➜</button>
    {/if}
  </div>
</div>

<style>
  .opdracht {
    padding-right: 110px;
  }
  .som {
    font-size: 64px;
    font-weight: 700;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .stapjes {
    display: flex;
    gap: 18px;
    font-size: 22px;
    color: #ddd6fe;
  }
  .stapjes .klaar {
    color: #86efac;
    text-decoration: line-through;
  }
  .luid {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
  }
  .lijn.drie {
    height: 270px;
    margin-top: 4px;
    border-radius: 26px;
    background: radial-gradient(ellipse at 50% 100%, rgba(236, 72, 153, 0.22), rgba(10, 2, 30, 0.5) 70%);
    border: 3px solid rgba(249, 168, 212, 0.3);
    overflow: hidden;
  }
  .verborgen {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .lijn {
    position: relative;
    height: 170px;
    margin-top: 30px;
  }
  .balk {
    position: absolute;
    left: 20px;
    right: 20px;
    top: 60px;
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, #f9a8d4, #fde68a, #a5f3fc);
    box-shadow: 0 0 18px rgba(253, 230, 138, 0.6);
  }
  .streep {
    position: absolute;
    top: 0;
    width: 44px;
    height: 150px;
    margin-left: -22px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .tick {
    margin-top: 44px;
    width: 4px;
    height: 42px;
    border-radius: 2px;
    background: #fff;
  }
  .tien .tick {
    width: 6px;
    height: 58px;
    margin-top: 36px;
  }
  .getal {
    margin-top: 8px;
    font-size: 30px;
    font-weight: 700;
  }
  .streep.fout .tick {
    background: #f87171;
  }
  .streep.doel .tick {
    background: #86efac;
    box-shadow: 0 0 16px #86efac;
  }
  .streep:active .tick {
    transform: scaleY(1.2);
  }
  .mira {
    position: absolute;
    top: -6px;
    margin-left: -24px;
    font-size: 48px;
    pointer-events: none;
    animation: sprong 0.45s ease-out;
    filter: drop-shadow(0 0 12px #fbbf24);
  }
  @keyframes sprong {
    0% { transform: translateY(0) scale(0.6); }
    50% { transform: translateY(-50px) scale(1.2); }
    100% { transform: translateY(0) scale(1); }
  }
</style>
