<script lang="ts">
  /** Glimmend stickerzakje op het beloningsscherm: tik erop en de sticker springt eruit. */
  import Sticker from './Sticker.svelte';
  import { STICKER } from '../engine/stickers';
  import { spreek } from '../audio/stem';
  import { speelFanfare, speelPoef } from '../audio/geluid';
  import { glitterOp } from './feest';
  import teksten from '../../content/teksten.json';

  let { ids }: { ids: string[] } = $props();

  let index = $state(0);
  let fase: 'dicht' | 'scheur' | 'open' = $state('dicht');
  let plekEl: HTMLElement | undefined = $state();
  let huidig = $derived(STICKER[ids[index]]);
  let nogMeer = $derived(index < ids.length - 1);

  async function open() {
    if (fase !== 'dicht' || !huidig) return;
    fase = 'scheur';
    speelPoef();
    await new Promise((r) => setTimeout(r, 420));
    fase = 'open';
    speelFanfare();
    glitterOp(plekEl ?? null);
    await spreek(huidig.naam, 'woord');
    if (huidig.baasStad) await spreek(teksten.stickers.baas);
    else if (huidig.zeldzaam === 'holo') await spreek(teksten.stickers.zeldzaam);
  }

  function volgende() {
    index++;
    fase = 'dicht';
  }
</script>

{#if huidig}
  <div class="zakje-plek" bind:this={plekEl}>
    <p class="kop">{ids.length > 1 ? `${index + 1} van ${ids.length} stickers` : 'Nieuwe sticker!'}</p>
    {#key index}
      {#if fase !== 'open'}
        <button class="zakje" class:scheur={fase === 'scheur'} onclick={open} aria-label="Open het stickerzakje">
          <span class="rand"></span>
          <span class="glans"></span>
          <span class="label">STICKERS</span>
          <span class="sterretje">✨</span>
          <span class="tik">Tik!</span>
        </button>
      {:else}
        <div class="onthuld">
          <div class="straal"></div>
          <div class="pop"><Sticker sticker={huidig} grootte={170} /></div>
          <p class="naam">{huidig.naam}</p>
          {#if nogMeer}
            <button class="knop-goud nog" onclick={volgende}>Nog een zakje ✨</button>
          {:else}
            <p class="plak">Hij zit in je plakboek!</p>
          {/if}
        </div>
      {/if}
    {/key}
  </div>
{/if}

<style>
  .zakje-plek {
    position: absolute;
    right: 34px;
    top: 50%;
    translate: 0 -50%;
    width: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    z-index: 2;
    animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.2s backwards;
  }
  .kop {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #fde68a;
    text-shadow: 0 0 12px rgba(251, 191, 36, 0.8);
  }
  .zakje {
    position: relative;
    width: 160px;
    height: 210px;
    border-radius: 14px 14px 20px 20px;
    overflow: hidden;
    background: linear-gradient(150deg, #f472b6 0%, #a855f7 45%, #22d3ee 100%);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45), inset 0 0 0 3px rgba(255, 255, 255, 0.5);
    animation: wiebel 1.4s ease-in-out infinite;
    transform-origin: 50% 90%;
  }
  .rand {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 22px;
    background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.85) 0 8px, rgba(255, 255, 255, 0.55) 8px 16px);
    clip-path: polygon(0 0, 100% 0, 100% 60%, 95% 100%, 90% 60%, 85% 100%, 80% 60%, 75% 100%, 70% 60%, 65% 100%, 60% 60%, 55% 100%, 50% 60%, 45% 100%, 40% 60%, 35% 100%, 30% 60%, 25% 100%, 20% 60%, 15% 100%, 10% 60%, 5% 100%, 0 60%);
    transition: transform 0.4s ease-in, opacity 0.4s;
  }
  .glans {
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.75) 45%, transparent 60%);
    background-size: 300% 100%;
    animation: glans 2.4s ease-in-out infinite;
  }
  .label {
    position: absolute;
    left: 0;
    right: 0;
    top: 74px;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #fff;
    text-shadow: 0 2px 0 #7e22ce, 0 0 12px rgba(255, 255, 255, 0.8);
  }
  .sterretje {
    position: absolute;
    left: 50%;
    top: 112px;
    translate: -50% 0;
    font-size: 40px;
  }
  .tik {
    position: absolute;
    left: 50%;
    bottom: 12px;
    translate: -50% 0;
    padding: 2px 16px;
    border-radius: 999px;
    background: #fff;
    color: #7e22ce;
    font-size: 20px;
    font-weight: 700;
  }
  .zakje.scheur {
    animation: scheur 0.42s ease-in forwards;
  }
  .zakje.scheur .rand {
    transform: translate(40px, -40px) rotate(25deg);
    opacity: 0;
  }
  .onthuld {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .straal {
    position: absolute;
    top: -40px;
    left: 50%;
    width: 280px;
    height: 280px;
    translate: -50% 0;
    background: repeating-conic-gradient(rgba(253, 230, 138, 0.35) 0 10deg, transparent 10deg 20deg);
    mask-image: radial-gradient(circle, #000 20%, transparent 68%);
    -webkit-mask-image: radial-gradient(circle, #000 20%, transparent 68%);
    animation: draai 10s linear infinite;
    pointer-events: none;
  }
  .pop {
    animation: sticker-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .naam {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
  .plak {
    margin: 0;
    font-size: 20px;
    color: #f9a8d4;
  }
  .nog {
    font-size: 22px;
    padding: 8px 18px;
  }
  @keyframes wiebel {
    0%, 100% { transform: rotate(-4deg); }
    50% { transform: rotate(4deg) translateY(-6px); }
  }
  @keyframes glans {
    0%, 50% { background-position: 150% 0; }
    100% { background-position: -50% 0; }
  }
  @keyframes scheur {
    0% { transform: scale(1); }
    40% { transform: scale(1.1) rotate(-6deg); }
    100% { transform: scale(0.2) translateY(80px); opacity: 0; }
  }
  @keyframes sticker-in {
    0% { transform: scale(0) rotate(-200deg); }
    100% { transform: scale(1) rotate(0); }
  }
  @keyframes draai {
    to { rotate: 360deg; }
  }
</style>
