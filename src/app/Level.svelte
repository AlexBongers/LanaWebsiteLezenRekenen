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

  function opNoten(n: number) {
    vg.noten += n;
    verdiend += n;
    void bewaar();
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
    <NotenTeller aantal={vg.noten} />
  </header>

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
</style>
