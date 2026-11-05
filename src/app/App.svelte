<script lang="ts">
  import { onMount } from 'svelte';
  import Achtergrond from '../ui/Achtergrond.svelte';
  import Bevestig from '../ui/Bevestig.svelte';
  import Start from './Start.svelte';
  import HeldinKeuze from './HeldinKeuze.svelte';
  import Level from './Level.svelte';
  import Ouderhoek from './Ouderhoek.svelte';
  import characters from '../../content/characters.json';
  import teksten from '../../content/teksten.json';
  import { laadVoortgang, vg, type HeldinId } from '../store/voortgang.svelte';
  import { laadStemManifest, spreek, stopSpreken, zetApparaatStem } from '../audio/stem';
  import { ontgrendelGeluid, zetEffectenAan } from '../audio/geluid';

  type Scherm = 'start' | 'keuze' | 'level' | 'ouder';
  let scherm = $state<Scherm>('start');
  let heldin = $state<HeldinId>('rumi');
  let vraagStop = $state(false);
  let wakeLock: WakeLockSentinel | null = null;

  let accent = $derived(scherm === 'level' ? characters[heldin].kleur : '#8b5cf6');

  onMount(() => {
    void laadVoortgang().then(() => {
      zetApparaatStem(vg.instellingen.apparaatStem);
      zetEffectenAan(vg.instellingen.effecten);
    });
    void laadStemManifest();

    // Android-terugknop: niet de app sluiten, maar netjes terug.
    history.replaceState({ basis: true }, '');
    history.pushState({ app: true }, '');
    const opTerugknop = () => {
      history.pushState({ app: true }, '');
      if (scherm === 'level') vraagStop = true;
      else if (scherm === 'ouder') scherm = 'keuze';
    };
    addEventListener('popstate', opTerugknop);

    const opZichtbaar = () => {
      if (document.visibilityState === 'visible' && scherm !== 'start') void houdSchermAan();
      if (document.visibilityState === 'hidden') stopSpreken();
    };
    document.addEventListener('visibilitychange', opZichtbaar);

    return () => {
      removeEventListener('popstate', opTerugknop);
      document.removeEventListener('visibilitychange', opZichtbaar);
    };
  });

  async function houdSchermAan() {
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null;
    }
  }

  async function begin() {
    ontgrendelGeluid();
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
    } catch {
      // Volledig scherm of draaien vastzetten mag niet overal; geen probleem.
    }
    void houdSchermAan();
    scherm = 'keuze';
    void spreek(teksten.welkom);
  }

  function kies(h: HeldinId) {
    heldin = h;
    scherm = 'level';
  }

  function naarKeuze() {
    stopSpreken();
    vraagStop = false;
    scherm = 'keuze';
  }
</script>

<Achtergrond {accent} />

{#if scherm === 'start'}
  <Start opStart={begin} />
{:else if scherm === 'keuze'}
  <HeldinKeuze opKies={kies} opOuder={() => (scherm = 'ouder')} />
{:else if scherm === 'level'}
  {#key heldin}
    <Level {heldin} opTerug={naarKeuze} opStop={() => (vraagStop = true)} />
  {/key}
{:else if scherm === 'ouder'}
  <Ouderhoek opSluit={() => (scherm = 'keuze')} />
{/if}

{#if vraagStop}
  <Bevestig vraag={teksten.stoppen} ja="Ja, stoppen" nee="Nee, verder!" opJa={naarKeuze} opNee={() => (vraagStop = false)} />
{/if}

<div class="draai" aria-hidden={true}>
  <div class="tablet">📱</div>
  <p>{teksten.draaien}</p>
</div>

<style>
  .draai {
    display: none;
  }
  @media (orientation: portrait) and (max-width: 1000px) {
    .draai {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      background: #1b0b3a;
      font-size: 32px;
      text-align: center;
      padding: 40px;
    }
    .tablet {
      font-size: 120px;
      animation: draai 2s ease-in-out infinite;
    }
  }
  @keyframes draai {
    0%, 30% { transform: rotate(0); }
    60%, 100% { transform: rotate(-90deg); }
  }
</style>
