<script lang="ts">
  import DansSommen from '../games/DansSommen.svelte';
  import FlitsPodium from '../games/FlitsPodium.svelte';
  import Verhaal from '../games/Verhaal.svelte';
  import SchildBalk from '../ui/SchildBalk.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import Beloning from './Beloning.svelte';
  import characters from '../../content/characters.json';
  import { REKEN_NIVEAUS } from '../engine/generator-rekenen';
  import { LEES_NIVEAUS } from '../engine/generator-lezen';
  import { verwerkSessie } from '../engine/adaptief';
  import { bewaar, vg, type HeldinId } from '../store/voortgang.svelte';
  import { stopSpreken } from '../audio/stem';
  import { speelCombo } from '../audio/geluid';
  import { vliegNoten } from '../ui/vlieg';

  let { heldin, opTerug, opStop }: { heldin: HeldinId; opTerug: () => void; opStop: () => void } = $props();

  const SPEL = { mira: DansSommen, rumi: FlitsPodium, zoey: Verhaal };
  const VAARDIGHEID = { mira: 'rekenen', rumi: 'flits', zoey: 'verhaal' } as const;
  const MAX = { mira: REKEN_NIVEAUS.length - 1, rumi: LEES_NIVEAUS.length - 1, zoey: 0 };

  let ronde = $state(0);
  let voortgang = $state(0);
  let verdiend = $state(0);
  let eerste = $state(true);
  let start = Date.now();
  let uitslag: { goed: number; totaal: number; omhoog: boolean } | null = $state(null);

  let Spel = $derived(SPEL[heldin]);

  let tellerEl: HTMLElement | undefined = $state();
  let reeks = 0;
  let combo: number | null = $state(null);
  let comboTimer: ReturnType<typeof setTimeout> | undefined;
  const COMBO = [3, 5, 8, 12];

  function opNoten(n: number, bron?: Element | null) {
    vliegNoten(n, bron, tellerEl);
    verdiend += n;
    // De teller springt pas op als de noten aankomen.
    setTimeout(() => {
      vg.noten += n;
      void bewaar();
    }, 800);
    // Reeks van meteen-goede antwoorden (2 noten = bij de eerste poging goed).
    if (n === 2) reeks++;
    else if (n === 1) reeks = 0;
    if (COMBO.includes(reeks)) {
      clearTimeout(comboTimer);
      combo = reeks;
      speelCombo();
      verdiend += 1;
      setTimeout(() => (vg.noten += 1), 800);
      comboTimer = setTimeout(() => (combo = null), 1800);
    }
  }

  function opKlaar(resultaten: boolean[]) {
    const sleutel = VAARDIGHEID[heldin];
    const voor = vg.vaardigheden[sleutel].niveau;
    vg.vaardigheden[sleutel] = verwerkSessie(vg.vaardigheden[sleutel], resultaten, MAX[heldin]);
    const bonus = 5;
    vg.noten += bonus;
    verdiend += bonus;
    const goed = resultaten.filter(Boolean).length;
    vg.sessies = [
      ...vg.sessies.slice(-199),
      {
        datum: new Date().toISOString(),
        heldin,
        goed,
        totaal: resultaten.length,
        noten: verdiend,
        seconden: Math.round((Date.now() - start) / 1000),
      },
    ];
    void bewaar();
    voortgang = 1;
    setTimeout(() => {
      uitslag = { goed, totaal: resultaten.length, omhoog: vg.vaardigheden[sleutel].niveau > voor };
    }, 700);
  }

  function nogEens() {
    uitslag = null;
    reeks = 0;
    voortgang = 0;
    verdiend = 0;
    eerste = false;
    start = Date.now();
    ronde++;
  }

  function terug() {
    stopSpreken();
    if (uitslag || voortgang === 0) opTerug();
    else opStop();
  }
</script>

<div class="level">
  <header>
    <button class="knop-rond" onclick={terug} aria-label="Terug">
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="schild"><SchildBalk waarde={voortgang} /></div>
    <div bind:this={tellerEl}><NotenTeller aantal={vg.noten} /></div>
  </header>

  {#if combo}
    {#key combo}
      <div class="combo" style="--kleur:{characters[heldin].kleur}">
        <span class="vuur">🔥</span>
        <span>{combo} op rij!</span>
        <span class="bonus">+1 ♪</span>
      </div>
    {/key}
  {/if}

  <main>
    {#key ronde}
      <Spel
        {opNoten}
        opVoortgang={(f: number) => (voortgang = f)}
        {opKlaar}
        intro={eerste ? characters[heldin].intro : undefined}
      />
    {/key}
  </main>

  {#if uitslag}
    <Beloning {heldin} {...uitslag} noten={verdiend} opNogEens={nogEens} opTerug={opTerug} />
  {/if}
</div>

<style>
  .level {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  header {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 14px 24px 6px;
  }
  .schild {
    flex: 1;
  }
  main {
    position: relative;
    flex: 1;
  }
  .combo {
    position: absolute;
    left: 50%;
    top: 92px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 30px;
    border-radius: 999px;
    font-size: 42px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(90deg, var(--kleur), #f59e0b);
    box-shadow: 0 0 40px var(--kleur), 0 8px 0 rgba(0, 0, 0, 0.25);
    text-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
    animation: combo 1.8s ease-out forwards;
    pointer-events: none;
  }
  .vuur {
    animation: pop-in 0.5s ease-out;
  }
  .bonus {
    font-size: 26px;
    color: #fff7c2;
  }
  @keyframes combo {
    0% { transform: translateX(-50%) scale(0.2) rotate(-10deg); opacity: 0; }
    15% { transform: translateX(-50%) scale(1.15) rotate(3deg); opacity: 1; }
    25% { transform: translateX(-50%) scale(1) rotate(0); }
    80% { transform: translateX(-50%) scale(1); opacity: 1; }
    100% { transform: translateX(-50%) translateY(-30px) scale(0.9); opacity: 0; }
  }
</style>
