<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Lana from '../art/Lana.svelte';
  import { bewaar, vg } from '../store/voortgang.svelte';
  import StickerZakje from '../ui/StickerZakje.svelte';
  import { stickerBeloning } from '../engine/stickers';
  import { uitZak } from '../games/teksten';
  import { spreek } from '../audio/stem';
  import { speelFanfare } from '../audio/geluid';
  import { grootFeest } from '../ui/feest';
  import teksten from '../../content/teksten.json';
  import type { HeldinId } from '../store/voortgang.svelte';

  let {
    heldin,
    goed,
    terugTekst = 'Ander spel',
    gesproken,
    totaal,
    noten,
    omhoog,
    titel = 'Concert gewonnen!',
    melding,
    pauze = false,
    opNogEens,
    opTerug,
    opPauze = opTerug,
    baasStad,
  }: {
    heldin: HeldinId | 'baas';
    goed: number;
    /** Tekst op de terug-knop. */
    terugTekst?: string;
    /** Wat de stem zegt (anders een wisselende beloningszin). */
    gesproken?: string;
    totaal: number;
    noten: number;
    omhoog: boolean;
    titel?: string;
    /** Extra regel, bijv. het startniveau na de auditie. */
    melding?: string;
    /** Speeltijd om: alleen nog een knop naar het pauzescherm. */
    pauze?: boolean;
    opPauze?: () => void;
    /** De baas van deze stad is weggezongen: dan komt zijn baas-sticker erbij. */
    baasStad?: string;
    opNogEens: () => void;
    opTerug: () => void;
  } = $props();

  let sterren = $derived(totaal === 0 ? 3 : goed / totaal >= 0.85 ? 3 : goed / totaal >= 0.6 ? 2 : 1);
  // Eén keer kiezen bij het openen: een wisselende kop en zin, vaak met Lana's naam.
  const kop = untrack(() => uitZak('beloningKop', teksten.beloningKoppen));
  const zin = untrack(() => gesproken ?? (melding ? teksten.auditie.klaar : uitZak('beloning', teksten.beloningen)));
  const blij = (h: HeldinId) => (h === heldin ? 'draai' : 'dans');

  // Stickers voor dit concert: meteen in het plakboek, zodat ze nooit kwijtraken.
  const nieuweStickers = untrack(() => {
    const ids = stickerBeloning(vg.stickers, { sterren, baasStad });
    if (ids.length) {
      vg.stickers = [...vg.stickers, ...ids];
      vg.stickersNieuw = [...vg.stickersNieuw, ...ids];
      void bewaar();
    }
    return ids;
  });

  onMount(() => {
    speelFanfare();
    grootFeest();
    void (async () => {
      await spreek(zin);
      if (nieuweStickers.length > 1 && !baasStad) await spreek(teksten.stickers.twee);
      else if (nieuweStickers.length) await spreek(uitZak('stickerNieuw', teksten.stickers.nieuw));
      if (pauze) await spreek(teksten.pauze.tijd);
    })();
  });
</script>

<div class="scherm">
  {#if nieuweStickers.length}
    <StickerZakje ids={nieuweStickers} />
  {/if}
  <div class="kaart">
    <p class="lana">{kop}</p>
    <h2 class="goudtekst">{titel}</h2>

    <div class="sterren">
      {#each [1, 2, 3] as s}
        <svg viewBox="0 0 100 100" class:aan={s <= sterren} style="animation-delay:{0.3 + s * 0.25}s" aria-hidden="true">
          <path
            d="M50 5 l13 27 30 4 -22 21 5 30 -26 -14 -26 14 5 -30 -22 -21 30 -4z"
            fill={s <= sterren ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
            stroke={s <= sterren ? '#fff7c2' : 'rgba(255,255,255,0.3)'}
            stroke-width="4"
            stroke-linejoin="round"
          />
        </svg>
      {/each}
    </div>

    <div class="groep">
      <div class="lid" style="--d:0s"><Heldin wie="rumi" stemming={blij('rumi')} hoogte={255} /></div>
      <div class="lid" style="--d:.1s"><Heldin wie="mira" stemming={blij('mira')} hoogte={265} /></div>
      <div class="lid" style="--d:.2s"><Lana avatar={vg.avatar} stemming="juich" hoogte={285} licht /></div>
      <div class="lid" style="--d:.3s"><Heldin wie="zoey" stemming={blij('zoey')} hoogte={250} /></div>
    </div>

    <div class="noten">+{noten} gouden noten</div>
    {#if melding}
      <div class="omhoog">{melding}</div>
    {/if}
    {#if omhoog}
      <div class="omhoog">🎉 Level omhoog! Jij wordt steeds sterker!</div>
    {/if}

    {#if pauze}
      <div class="pauze">☕ Tijd voor een pauze!</div>
      <div class="knoppen">
        <button class="knop-goud" onclick={opPauze}>Klaar voor vandaag 👋</button>
      </div>
    {:else}
      <div class="knoppen">
        <button class="knop-goud ander" onclick={opTerug}>{terugTekst}</button>
        <button class="knop-goud" onclick={opNogEens}>Nog een keer! ✨</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .scherm {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    background: radial-gradient(circle, rgba(46, 16, 101, 0.85), rgba(10, 2, 30, 0.92));
    animation: fade 0.4s ease-out;
  }
  .kaart {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 60px 30px;
  }
  .lana {
    margin: 0;
    font-size: 34px;
    font-weight: 600;
    color: #f9a8d4;
    text-shadow: 0 0 18px rgba(236, 72, 153, 0.8);
    animation: pop-in 0.5s ease-out;
  }
  h2 {
    margin: 0;
    font-size: 72px;
    animation: pop-in 0.6s ease-out;
  }
  .sterren {
    display: flex;
    gap: 18px;
  }
  .sterren svg {
    width: 72px;
    height: 72px;
    animation: pop-in 0.5s ease-out backwards;
  }
  .sterren svg.aan {
    filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.9));
  }
  .lid {
    animation: lid-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    animation-delay: calc(0.5s + var(--d));
  }
  @keyframes lid-in {
    from { transform: translateY(120px) scale(0.6); opacity: 0; }
  }
  .groep {
    display: flex;
    align-items: end;
    gap: 22px;
  }
  .noten {
    font-size: 36px;
    font-weight: 700;
    color: #fde68a;
    text-shadow: 0 0 16px rgba(251, 191, 36, 0.8);
  }
  .omhoog {
    padding: 6px 22px;
    border-radius: 999px;
    background: linear-gradient(90deg, #ec4899, #8b5cf6);
    font-size: 26px;
    font-weight: 600;
    animation: pop-in 0.6s ease-out 1s backwards;
  }
  .pauze {
    font-size: 30px;
    font-weight: 700;
    color: #a5f3fc;
    text-shadow: 0 0 14px rgba(6, 182, 212, 0.8);
    animation: pop-in 0.6s ease-out 1.2s backwards;
  }
  .knoppen {
    display: flex;
    gap: 26px;
    margin-top: 14px;
  }
  .ander {
    background: linear-gradient(180deg, #f5f3ff, #c4b5fd);
    box-shadow: 0 6px 0 #6d28d9;
    color: #2e1065;
  }
  @keyframes fade {
    from { opacity: 0; }
  }
</style>
