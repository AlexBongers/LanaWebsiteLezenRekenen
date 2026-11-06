<script lang="ts">
  /** Kleedkamer: Lana maakt haar eigen figuur, het vierde lid van de groep. */
  import { onMount } from 'svelte';
  import Lana from '../art/Lana.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import {
    CATEGORIEEN,
    HUIDTINTEN,
    OOGKLEUREN,
    heeftItem,
    itemSleutel,
    type Avatar,
    type CategorieId,
    type Item,
  } from '../engine/kleedkamer';
  import { bewaar, vg } from '../store/voortgang.svelte';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelBijna, speelFanfare, speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import teksten from '../../content/teksten.json';

  let { opTerug }: { opTerug: () => void } = $props();

  type Tab = CategorieId | 'ik';
  let tab = $state<Tab>('haar');
  let pas = $state<{ cat: CategorieId; item: Item } | null>(null);
  let schud = $state(false);
  let podiumEl: HTMLElement | undefined = $state();

  let categorie = $derived(CATEGORIEEN.find((c) => c.id === tab));
  let toon: Avatar = $derived(pas ? { ...vg.avatar, [pas.cat]: pas.item.id } : vg.avatar);

  onMount(() => {
    void spreek(teksten.kleedkamer.welkom);
  });

  function tik(cat: CategorieId, item: Item) {
    speelTik();
    if (heeftItem(vg.gekocht, cat, item.id)) {
      pas = null;
      vg.avatar = { ...vg.avatar, [cat]: item.id };
      void bewaar();
      void spreek(teksten.kleedkamer.aan);
    } else {
      pas = { cat, item };
    }
  }

  async function koop() {
    if (!pas) return;
    if (vg.noten < pas.item.prijs) {
      speelBijna();
      schud = true;
      setTimeout(() => (schud = false), 500);
      void spreek(teksten.kleedkamer.teWeinig);
      return;
    }
    vg.noten -= pas.item.prijs;
    vg.gekocht = [...vg.gekocht, itemSleutel(pas.cat, pas.item.id)];
    vg.avatar = { ...vg.avatar, [pas.cat]: pas.item.id };
    pas = null;
    await bewaar();
    speelFanfare();
    glitterOp(podiumEl ?? null);
    void spreek(teksten.kleedkamer.gekocht);
  }

  function zetIk<K extends 'huid' | 'ogen'>(k: K, v: Avatar[K]) {
    speelTik();
    pas = null;
    vg.avatar = { ...vg.avatar, [k]: v };
    void bewaar();
  }

  function kiesTab(t: Tab) {
    speelTik();
    tab = t;
    pas = null;
  }

  const draagt = (cat: CategorieId, id: string) => vg.avatar[cat] === id;
</script>

<div class="kleedkamer">
  <header>
    <button class="knop-rond" onclick={opTerug} aria-label="Terug naar de wereldtour">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <h1 class="goudtekst">Kleedkamer</h1>
    <NotenTeller aantal={vg.noten} />
  </header>

  <div class="inhoud">
    <section class="podium" bind:this={podiumEl}>
      <div class="spiegel">
        {#each Array.from({ length: 10 }, (_, i) => i) as i}
          <span class="lampje" style="--i:{i}"></span>
        {/each}
      </div>
      <div class="figuur">
        <Lana avatar={toon} hoogte={500} licht stemming={pas ? 'denk' : 'dans'} />
      </div>
      <div class="naambord">
        <span class="naam">Lana</span>
        <span class="rol">het vierde lid</span>
      </div>
      {#if pas}
        <div class="koop" class:schud>
          <span>{pas.item.naam}</span>
          {#if vg.noten >= pas.item.prijs}
            <button class="knop-goud" onclick={koop}>Kopen voor ♪ {pas.item.prijs}</button>
          {:else}
            <button class="knop-goud te-weinig" onclick={koop}>Nog ♪ {pas.item.prijs - vg.noten} nodig</button>
          {/if}
          <button class="annuleer" onclick={() => (pas = null)}>Toch niet</button>
        </div>
      {/if}
    </section>

    <section class="kast">
      <nav class="tabs">
        <button class:actief={tab === 'ik'} onclick={() => kiesTab('ik')}><span>🙂</span>Ik</button>
        {#each CATEGORIEEN as c}
          <button class:actief={tab === c.id} onclick={() => kiesTab(c.id)}><span>{c.icoon}</span>{c.naam}</button>
        {/each}
      </nav>

      {#if tab === 'ik'}
        <div class="ik">
          <h3>Huidskleur</h3>
          <div class="stalen">
            {#each HUIDTINTEN as kleur, i}
              <button class="staal" class:aan={vg.avatar.huid === i} style="background:{kleur}" aria-label="Huidskleur {i + 1}" onclick={() => zetIk('huid', i)}></button>
            {/each}
          </div>
          <h3>Oogkleur</h3>
          <div class="stalen">
            {#each OOGKLEUREN as o}
              <button class="staal oog" class:aan={vg.avatar.ogen === o.id} style="--kleur:{o.kleur}" aria-label="Ogen {o.id}" onclick={() => zetIk('ogen', o.id)}></button>
            {/each}
          </div>
        </div>
      {:else if categorie}
        <div class="raster">
          {#each categorie.items as item (categorie.id + item.id)}
            {@const cat = categorie.id}
            {@const heeft = heeftItem(vg.gekocht, cat, item.id)}
            <button
              class="tegel"
              class:aan={draagt(cat, item.id)}
              class:pas={pas?.item.id === item.id && pas?.cat === cat}
              class:dicht={!heeft}
              onclick={() => tik(cat, item)}
            >
              <div class="voorbeeld">
                {#if cat === 'haarkleur'}
                  <span class="bol" style="background:linear-gradient(135deg, {item.kleuren?.join(', ')})"></span>
                {:else if cat === 'licht'}
                  <span
                    class="bol licht"
                    style="background:{item.id === 'regenboog'
                      ? 'conic-gradient(#f472b6, #fbbf24, #4ade80, #38bdf8, #a78bfa, #f472b6)'
                      : `radial-gradient(circle, #fff, ${item.kleur})`}; --kleur:{item.kleur}"
                  ></span>
                {:else if cat === 'outfit'}
                  <div class="heel"><Lana avatar={{ ...vg.avatar, [cat]: item.id }} hoogte={190} stil /></div>
                {:else}
                  <div class="portret"><Lana avatar={{ ...vg.avatar, [cat]: item.id }} hoogte={380} stil /></div>
                {/if}
              </div>
              <span class="itemnaam">{item.naam}</span>
              <span class="status">
                {#if draagt(cat, item.id)}✓ Aan{:else if heeft}Kies{:else}♪ {item.prijs}{/if}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .kleedkamer {
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
    justify-content: space-between;
  }
  h1 {
    margin: 0;
    font-size: 52px;
  }
  .inhoud {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 430px 1fr;
    gap: 20px;
    padding-top: 10px;
  }
  .podium {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    border-radius: 32px;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 50% 100%, rgba(251, 191, 36, 0.25), transparent 60%),
      linear-gradient(180deg, #2e1065, #1b0b3a);
    border: 4px solid #fde68a;
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.3), inset 0 0 40px rgba(0, 0, 0, 0.4);
  }
  .spiegel {
    position: absolute;
    inset: 14px;
    border-radius: 24px;
    pointer-events: none;
  }
  .lampje {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff7c2;
    box-shadow: 0 0 12px #fbbf24;
    top: calc(var(--i) * 9%);
    left: 0;
    animation: lampje 2s ease-in-out infinite;
    animation-delay: calc(var(--i) * -0.2s);
  }
  .lampje:nth-child(even) {
    left: auto;
    right: 0;
    top: calc((var(--i) - 1) * 9%);
  }
  .figuur {
    margin-bottom: -6px;
  }
  .naambord {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 14px;
    padding: 4px 26px;
    border-radius: 18px;
    background: rgba(0, 0, 0, 0.45);
  }
  .naam {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
  }
  .rol {
    font-size: 18px;
    color: #fde68a;
  }
  .koop {
    position: absolute;
    left: 16px;
    right: 16px;
    top: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px;
    border-radius: 22px;
    background: rgba(27, 11, 58, 0.92);
    border: 3px solid #fde68a;
    font-size: 26px;
    font-weight: 700;
    animation: pop-in 0.3s ease-out;
  }
  .koop.schud {
    animation: schud 0.5s ease-in-out;
  }
  .te-weinig {
    background: linear-gradient(180deg, #e9d5ff, #c4b5fd);
    box-shadow: 0 6px 0 #6d28d9;
    color: #2e1065;
    font-size: 24px;
  }
  .annuleer {
    font-size: 18px;
    color: #c4b5fd;
    text-decoration: underline;
  }
  .kast {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tabs {
    display: flex;
    gap: 8px;
  }
  .tabs button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    border-radius: 18px;
    font-size: 17px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  .tabs button span {
    font-size: 30px;
  }
  .tabs button.actief {
    background: linear-gradient(180deg, rgba(251, 191, 36, 0.4), rgba(236, 72, 153, 0.3));
    border-color: #fde68a;
    box-shadow: 0 0 18px rgba(251, 191, 36, 0.5);
  }
  .raster {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    align-content: start;
    padding: 4px 4px 10px;
  }
  .tegel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 6px 10px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
    border: 3px solid rgba(255, 255, 255, 0.25);
    transition: transform 0.15s;
  }
  .tegel:active {
    transform: scale(0.95);
  }
  .tegel.aan {
    border-color: #4ade80;
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
  }
  .tegel.pas {
    border-color: #fde68a;
    box-shadow: 0 0 24px rgba(251, 191, 36, 0.7);
  }
  .voorbeeld {
    width: 100%;
    height: 150px;
    display: grid;
    justify-items: center;
    align-items: center;
    overflow: hidden;
    border-radius: 16px;
    background: radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.12), transparent 70%);
  }
  .portret {
    align-self: start;
    margin-top: -14px;
  }
  .heel {
    margin-top: -8px;
  }
  .tegel.dicht .voorbeeld {
    opacity: 0.85;
  }
  .bol {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid #fff;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }
  .bol.licht {
    box-shadow: 0 0 30px var(--kleur), 0 0 60px var(--kleur);
  }
  .itemnaam {
    font-size: 20px;
    font-weight: 600;
  }
  .status {
    padding: 2px 14px;
    border-radius: 999px;
    font-size: 19px;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.35);
    color: #fde68a;
  }
  .tegel.aan .status {
    color: #86efac;
  }
  .ik h3 {
    margin: 10px 0 10px;
    font-size: 26px;
  }
  .stalen {
    display: flex;
    gap: 18px;
  }
  .staal {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
  }
  .staal.oog {
    background: radial-gradient(circle, #1a0b2e 0 22%, var(--kleur) 24% 58%, #fff 60%);
  }
  .staal.aan {
    border-color: #4ade80;
    box-shadow: 0 0 0 4px #4ade80, 0 0 20px rgba(74, 222, 128, 0.6);
  }
  @keyframes lampje {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
</style>
