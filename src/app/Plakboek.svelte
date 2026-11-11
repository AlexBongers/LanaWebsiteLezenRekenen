<script lang="ts">
  /** Lana's plakboek: een opengeslagen boek met per bladzijde een stickerset. */
  import { onMount } from 'svelte';
  import Sticker from '../ui/Sticker.svelte';
  import { STICKERS, STICKER_SETS, STICKER, draaiing, stickersVan, type Sticker as StickerT } from '../engine/stickers';
  import { bewaar, vg } from '../store/voortgang.svelte';
  import { spreek } from '../audio/stem';
  import { speelTik } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import teksten from '../../content/teksten.json';

  let { opTerug }: { opTerug: () => void } = $props();

  // Twee bladzijden per keer; de laatste bladzijde is het overzicht.
  type Blad = { soort: 'set'; set: (typeof STICKER_SETS)[number] } | { soort: 'overzicht' };
  const bladen: Blad[] = [...STICKER_SETS.map((set) => ({ soort: 'set' as const, set })), { soort: 'overzicht' }];
  const spreads = Math.ceil(bladen.length / 2);

  let spread = $state(0);
  let richting = $state(1);
  let groot: StickerT | null = $state(null);
  let grootEl: HTMLElement | undefined = $state();
  let nieuw = $state<string[]>([...vg.stickersNieuw]);

  const heeft = (id: string) => vg.stickers.includes(id);
  let aantal = $derived(vg.stickers.filter((id) => STICKER[id]).length);
  let links = $derived(bladen[spread * 2]);
  let rechts = $derived(bladen[spread * 2 + 1]);

  onMount(() => {
    void spreek(aantal >= STICKERS.length ? teksten.stickers.vol : teksten.stickers.welkom);
    // Begin bij de eerste bladzijde met een nieuwe sticker.
    const eerste = nieuw.map((id) => STICKER[id]).find(Boolean);
    if (eerste) spread = Math.floor(bladen.findIndex((b) => b.soort === 'set' && b.set.id === eerste.set) / 2);
    return () => {
      // Alles is nu gezien
      if (vg.stickersNieuw.length) {
        vg.stickersNieuw = [];
        void bewaar();
      }
    };
  });

  function blader(stap: number) {
    const n = spread + stap;
    if (n < 0 || n >= spreads) return;
    speelTik();
    richting = stap;
    spread = n;
  }

  function naarSet(i: number) {
    speelTik();
    const n = Math.floor(i / 2);
    richting = n >= spread ? 1 : -1;
    spread = n;
  }

  async function bekijk(s: StickerT) {
    speelTik();
    if (!heeft(s.id)) {
      void spreek(teksten.stickers.leeg);
      return;
    }
    groot = s;
    nieuw = nieuw.filter((x) => x !== s.id);
    await Promise.resolve();
    glitterOp(grootEl ?? null);
    void spreek(s.naam, 'woord');
  }
</script>

<div class="plakboek">
  <header>
    <button class="knop-rond" onclick={opTerug} aria-label="Terug naar de wereldtour">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <h1 class="goudtekst">Mijn plakboek</h1>
    <div class="teller" aria-label="{aantal} van {STICKERS.length} stickers">
      <span class="getal">{aantal} / {STICKERS.length}</span>
      <span class="balk"><span style="width:{(aantal / STICKERS.length) * 100}%"></span></span>
    </div>
  </header>

  <div class="tabs">
    {#each bladen as b, i}
      {@const actief = Math.floor(i / 2) === spread}
      {#if b.soort === 'set'}
        {@const n = stickersVan(b.set.id).filter((s) => heeft(s.id)).length}
        {@const heeftNieuw = stickersVan(b.set.id).some((s) => nieuw.includes(s.id))}
        <button class="tab" class:actief style="--kleur:{b.set.kleur}" onclick={() => naarSet(i)}>
          <span class="tab-icoon">{b.set.icoon}</span>
          <span class="tab-teller">{n}/{stickersVan(b.set.id).length}</span>
          {#if heeftNieuw}<span class="stip"></span>{/if}
        </button>
      {:else}
        <button class="tab" class:actief style="--kleur:#fbbf24" onclick={() => naarSet(i)}>
          <span class="tab-icoon">⭐</span>
          <span class="tab-teller">alles</span>
        </button>
      {/if}
    {/each}
  </div>

  <div class="boek">
    <button class="pijl links" onclick={() => blader(-1)} disabled={spread === 0} aria-label="Vorige bladzijde">‹</button>
    {#key spread}
      <div class="spread" style="--richting:{richting}">
        {#each [links, rechts] as blad, kant}
          <section class="blad" class:rechts={kant === 1}>
            {#if blad?.soort === 'set'}
              {@const lijst = stickersVan(blad.set.id)}
              <h2 style="--kleur:{blad.set.kleur}">{blad.set.icoon} {blad.set.naam}</h2>
              <div class="raster" class:zes={lijst.length === 6}>
                {#each lijst as s (s.id)}
                  <button class="vak" onclick={() => bekijk(s)} aria-label={heeft(s.id) ? s.naam : 'Lege plek'}>
                    <Sticker sticker={s} grootte={122} leeg={!heeft(s.id)} draai={draaiing(s.id)} nieuw={nieuw.includes(s.id)} />
                    <span class="onder">{heeft(s.id) ? s.naam : s.baasStad ? 'Zing de baas weg!' : '???'}</span>
                  </button>
                {/each}
              </div>
            {:else if blad?.soort === 'overzicht'}
              <h2 style="--kleur:#f59e0b">⭐ Mijn verzameling</h2>
              <div class="overzicht">
                <div class="groot-getal">{aantal}</div>
                <p>van de {STICKERS.length} stickers verzameld</p>
                <div class="soorten">
                  {#each [['gewoon', 'Gewoon'], ['glans', 'Goud'], ['holo', 'Glitter']] as [z, naam]}
                    {@const alle = STICKERS.filter((s) => s.zeldzaam === z)}
                    <div class="soort">
                      <Sticker sticker={alle[0]} grootte={64} leeg={!alle.some((s) => heeft(s.id))} />
                      <span>{naam}: {alle.filter((s) => heeft(s.id)).length}/{alle.length}</span>
                    </div>
                  {/each}
                </div>
                <p class="tip">Na elk concert krijg je een sticker. Bij drie sterren twee!</p>
              </div>
            {/if}
            <span class="paginanummer">{spread * 2 + kant + 1}</span>
          </section>
        {/each}
      </div>
    {/key}
    <button class="pijl rechts" onclick={() => blader(1)} disabled={spread >= spreads - 1} aria-label="Volgende bladzijde">›</button>
  </div>

  {#if groot}
    <button class="vergroot" onclick={() => (groot = null)} aria-label="Sluiten">
      <div class="groot" bind:this={grootEl}>
        <Sticker sticker={groot} grootte={300} />
      </div>
      <p class="groot-naam">{groot.naam}</p>
      <p class="groot-soort">
        {groot.zeldzaam === 'holo' ? '🌈 Glitter-sticker' : groot.zeldzaam === 'glans' ? '✨ Gouden sticker' : 'Sticker'}
      </p>
    </button>
  {/if}
</div>

<style>
  .plakboek {
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
    font-size: 50px;
    text-align: center;
  }
  .teller {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 170px;
  }
  .getal {
    font-size: 26px;
    font-weight: 700;
    color: #fde68a;
  }
  .balk {
    width: 160px;
    height: 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }
  .balk span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #f472b6, #fbbf24);
    transition: width 0.6s;
  }
  .tabs {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 8px 0 6px;
  }
  .tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    font-size: 18px;
    font-weight: 700;
  }
  .tab.actief {
    background: color-mix(in srgb, var(--kleur) 55%, transparent);
    border-color: color-mix(in srgb, var(--kleur) 60%, white);
    box-shadow: 0 0 16px color-mix(in srgb, var(--kleur) 70%, transparent);
  }
  .tab-icoon {
    font-size: 26px;
  }
  .stip {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ec4899;
    border: 2px solid #fff;
    animation: puls 1.2s ease-in-out infinite;
  }
  .boek {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: stretch;
    gap: 10px;
    perspective: 1800px;
  }
  .pijl {
    align-self: center;
    width: 64px;
    height: 110px;
    border-radius: 22px;
    font-size: 70px;
    line-height: 1;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.14);
    border: 2px solid rgba(255, 255, 255, 0.25);
  }
  .pijl:disabled {
    opacity: 0.25;
  }
  .spread {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 10px;
    border-radius: 26px;
    background: linear-gradient(180deg, #7c3aed, #5b21b6);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 4px #a78bfa;
    animation: blad-om 0.5s cubic-bezier(0.3, 1.2, 0.5, 1);
    transform-origin: 50% 50%;
  }
  .blad {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 14px 22px 30px;
    border-radius: 18px 6px 6px 18px;
    background:
      repeating-linear-gradient(180deg, transparent 0 37px, rgba(124, 58, 237, 0.07) 37px 39px),
      linear-gradient(90deg, #fdf8ee, #fffdf8 85%, #efe6d6);
    color: #2e1065;
    box-shadow: inset -10px 0 18px rgba(0, 0, 0, 0.08);
  }
  .blad.rechts {
    border-radius: 6px 18px 18px 6px;
    background:
      repeating-linear-gradient(180deg, transparent 0 37px, rgba(124, 58, 237, 0.07) 37px 39px),
      linear-gradient(90deg, #efe6d6, #fffdf8 15%, #fdf8ee);
    box-shadow: inset 10px 0 18px rgba(0, 0, 0, 0.08);
  }
  h2 {
    margin: 0 0 8px;
    font-size: 32px;
    color: var(--kleur);
    text-shadow: 0 2px 0 rgba(255, 255, 255, 0.8);
  }
  .raster {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-content: center;
    gap: 18px 2px;
  }
  .raster.zes {
    grid-template-columns: repeat(3, 1fr);
  }
  .vak {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    border-radius: 16px;
  }
  .vak:active {
    transform: scale(0.95);
  }
  .onder {
    max-width: 130px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.1;
    text-align: center;
    color: #5b21b6;
  }
  .paginanummer {
    position: absolute;
    bottom: 8px;
    left: 50%;
    translate: -50% 0;
    font-size: 15px;
    color: #a78bfa;
  }
  .overzicht {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
  }
  .groot-getal {
    font-size: 110px;
    font-weight: 700;
    line-height: 1;
    background: linear-gradient(180deg, #f472b6, #7c3aed);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .overzicht p {
    margin: 0;
    font-size: 22px;
  }
  .soorten {
    display: flex;
    gap: 24px;
    margin: 14px 0;
  }
  .soort {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 18px;
    font-weight: 600;
  }
  .tip {
    color: #7c3aed;
  }
  .vergroot {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: radial-gradient(circle, rgba(46, 16, 101, 0.85), rgba(10, 2, 30, 0.92));
    animation: fade 0.25s ease-out;
  }
  .groot {
    animation: sticker-groot 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .groot-naam {
    margin: 10px 0 0;
    font-size: 54px;
    font-weight: 700;
  }
  .groot-soort {
    margin: 0;
    font-size: 26px;
    color: #fde68a;
  }
  @keyframes blad-om {
    from {
      transform: rotateY(calc(var(--richting) * -14deg)) translateX(calc(var(--richting) * 40px));
      opacity: 0.3;
    }
  }
  @keyframes sticker-groot {
    from { transform: scale(0.3) rotate(-30deg); }
  }
  @keyframes puls {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.25); }
  }
  @keyframes fade {
    from { opacity: 0; }
  }
</style>
