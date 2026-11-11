<script lang="ts">
  /**
   * Eén sticker: uitgeknipt met een dikke witte rand. Glans-stickers hebben een gouden rand,
   * holo-stickers een bewegende regenboogglans. `leeg` toont alleen een gestippeld plekje.
   */
  import Heldin from '../art/Heldin.svelte';
  import Lana from '../art/Lana.svelte';
  import Demon from '../art/Demon.svelte';
  import { vg } from '../store/voortgang.svelte';
  import type { Sticker } from '../engine/stickers';

  let {
    sticker,
    grootte = 120,
    leeg = false,
    draai = 0,
    nieuw = false,
  }: { sticker: Sticker; grootte?: number; leeg?: boolean; draai?: number; nieuw?: boolean } = $props();

  let b = $derived(sticker.beeld);
</script>

{#if leeg}
  <div class="plek" style="--g:{grootte}px">
    {#if b.soort === 'emoji'}
      <span class="schim" style="font-size:{grootte * 0.52}px">{b.teken}</span>
    {:else}
      <span class="vraag" style="font-size:{grootte * 0.4}px">?</span>
    {/if}
  </div>
{:else}
  <div class="sticker {sticker.zeldzaam}" class:nieuw style="--g:{grootte}px; --draai:{draai}deg">
    <div class="vel">
      {#if b.soort === 'emoji'}
        <span class="emoji" style="font-size:{grootte * 0.56}px">{b.teken}</span>
      {:else if b.soort === 'heldin'}
        <div class="portret" style="top:{grootte * 0.04}px"><Heldin wie={b.wie} stemming="rust" hoogte={grootte * 2.3} diepte={false} /></div>
      {:else if b.soort === 'lana'}
        <div class="portret" style="top:{grootte * 0.04}px"><Lana avatar={vg.avatar} hoogte={grootte * 2.3} stil /></div>
      {:else}
        <div class="demon"><Demon soort={b.nr} grootte={grootte * 0.84} /></div>
        {#if b.kroon}<span class="kroon" style="font-size:{grootte * 0.3}px">👑</span>{/if}
      {/if}
      {#if sticker.zeldzaam === 'holo'}<span class="holo-laag"></span>{/if}
      {#if sticker.zeldzaam !== 'gewoon'}<span class="glimmer"></span>{/if}
    </div>
    {#if nieuw}<span class="nieuw-label">nieuw!</span>{/if}
  </div>
{/if}

<style>
  .plek,
  .sticker {
    position: relative;
    width: var(--g);
    height: var(--g);
    flex: none;
  }
  .plek {
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 3px dashed rgba(124, 58, 237, 0.35);
    background: rgba(124, 58, 237, 0.05);
  }
  .schim {
    filter: grayscale(1) brightness(0.4);
    opacity: 0.16;
  }
  .vraag {
    font-weight: 700;
    color: rgba(124, 58, 237, 0.25);
  }
  .sticker {
    transform: rotate(var(--draai));
    filter: drop-shadow(0 4px 5px rgba(46, 16, 101, 0.35));
  }
  .vel {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 50%;
    border: calc(var(--g) * 0.06) solid #fff;
    background: radial-gradient(circle at 35% 30%, #ffffff, #f5f3ff 55%, #e9d5ff);
  }
  .glans .vel {
    border-color: #fde68a;
    background: radial-gradient(circle at 35% 30%, #fffbeb, #fef3c7 55%, #fcd34d);
    box-shadow: inset 0 0 0 2px #f59e0b;
  }
  .holo .vel {
    border-color: #fff;
    background: conic-gradient(from 200deg, #fbcfe8, #ddd6fe, #bae6fd, #bbf7d0, #fef08a, #fbcfe8);
  }
  .emoji {
    line-height: 1;
    filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.2));
  }
  .portret {
    position: absolute;
    left: 50%;
    translate: -50% 0;
  }
  .portret :global(*),
  .demon :global(*) {
    animation: none !important;
  }
  .demon {
    margin-top: 6%;
  }
  .kroon {
    position: absolute;
    top: 2%;
    left: 50%;
    translate: -50% 0;
    rotate: 12deg;
  }
  .holo-laag {
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.7) 40%, rgba(244, 114, 182, 0.4) 50%, rgba(56, 189, 248, 0.4) 60%, transparent 80%);
    background-size: 250% 250%;
    mix-blend-mode: overlay;
    animation: holo 3.2s ease-in-out infinite;
    pointer-events: none;
  }
  .glimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 35%, rgba(255, 255, 255, 0.85) 50%, transparent 65%);
    background-size: 300% 100%;
    animation: glimmer 3.6s ease-in-out infinite;
    pointer-events: none;
  }
  .nieuw {
    animation: nieuw-puls 1.6s ease-in-out infinite;
  }
  .nieuw-label {
    position: absolute;
    right: -8px;
    top: -6px;
    padding: 1px 10px;
    border-radius: 999px;
    background: #ec4899;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    rotate: 12deg;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
  @keyframes holo {
    0%, 100% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
  }
  @keyframes glimmer {
    0%, 60% { background-position: 150% 0; }
    100% { background-position: -50% 0; }
  }
  @keyframes nieuw-puls {
    0%, 100% { filter: drop-shadow(0 4px 5px rgba(46, 16, 101, 0.35)) drop-shadow(0 0 0 rgba(236, 72, 153, 0)); }
    50% { filter: drop-shadow(0 4px 5px rgba(46, 16, 101, 0.35)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.9)); }
  }
  :global(.licht) .holo-laag,
  :global(.licht) .glimmer {
    animation: none;
  }
</style>
