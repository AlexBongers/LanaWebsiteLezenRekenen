<script lang="ts">
  /** Het gevecht tegen de baas-demon van een stad (fase 4). */
  import BaasGevecht from '../games/BaasGevecht.svelte';
  import SchildBalk from '../ui/SchildBalk.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import Beloning from './Beloning.svelte';
  import teksten from '../../content/teksten.json';
  import { STEDEN, noteerSterren, stadGered, sterrenVoor, tourKlaar } from '../engine/tour';
  import type { Resultaat } from '../engine/sessie';
  import { bewaar, vg } from '../store/voortgang.svelte';
  import { stopSpreken } from '../audio/stem';
  import { vliegNoten } from '../ui/vlieg';

  let {
    stadId,
    opTerug,
    opTour,
    opStop,
    pauzeNodig = () => false,
    opPauze = opTerug,
  }: {
    stadId: string;
    opTerug: () => void;
    opTour: () => void;
    opStop: () => void;
    pauzeNodig?: () => boolean;
    opPauze?: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const stadNr = Math.max(0, STEDEN.findIndex((s) => s.id === stadId));
  const stad = STEDEN[stadNr];
  const volgende = STEDEN[stadNr + 1];

  let ronde = $state(0);
  let voortgang = $state(0);
  let verdiend = $state(0);
  let eerste = $state(true);
  let start = Date.now();
  let tellerEl: HTMLElement | undefined = $state();
  let afgerond = false;
  let uitslag: {
    goed: number;
    totaal: number;
    titel: string;
    melding?: string;
    gesproken?: string;
    gered: boolean;
    pauze: boolean;
  } | null = $state(null);

  function opNoten(n: number, bron?: Element | null) {
    vliegNoten(n, bron, tellerEl);
    verdiend += n;
    setTimeout(() => {
      vg.noten += n;
      void bewaar();
    }, 800);
  }

  function opKlaar(resultaten: Resultaat[]) {
    if (afgerond) return;
    afgerond = true;
    const goed = resultaten.filter((r) => r.goed).length;
    const wasGered = stadGered(stadId, vg.tour);
    vg.tour = noteerSterren(vg.tour, stadId, 'baas', sterrenVoor(goed, resultaten.length));
    const gered = !wasGered;
    const klaar = gered && tourKlaar(vg.tour);
    const bonus = gered ? 20 : 10;
    vg.noten += bonus;
    verdiend += bonus;
    vg.sessies = [
      ...vg.sessies.slice(-199),
      {
        datum: new Date().toISOString(),
        heldin: 'baas',
        spel: 'baas',
        stad: stadId,
        goed,
        totaal: resultaten.length,
        noten: verdiend,
        seconden: Math.round((Date.now() - start) / 1000),
      },
    ];
    void bewaar();
    voortgang = 1;
    const pauze = pauzeNodig();
    setTimeout(() => {
      uitslag = {
        goed,
        totaal: resultaten.length,
        titel: klaar ? 'Wereldtour gered!' : gered ? 'Stad gered!' : 'Weggezongen!',
        melding: gered && volgende && !klaar ? `✈️ ${volgende.naam} is nu open!` : undefined,
        gesproken: klaar ? teksten.tour.klaar : gered ? teksten.tour.gered : undefined,
        gered,
        pauze,
      };
    }, 900);
  }

  function nogEens() {
    afgerond = false;
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
    <div class="baasnaam">👑 {stad.baas}</div>
    <div bind:this={tellerEl}><NotenTeller aantal={vg.noten} /></div>
  </header>

  <main>
    {#key ronde}
      <BaasGevecht {opNoten} opVoortgang={(f: number) => (voortgang = f)} {opKlaar} intro={eerste ? stad.baasIntro : undefined} {stadId} />
    {/key}
  </main>

  {#if uitslag}
    <Beloning
      heldin="baas"
      goed={uitslag.goed}
      totaal={uitslag.totaal}
      noten={verdiend}
      omhoog={false}
      titel={uitslag.titel}
      melding={uitslag.melding}
      gesproken={uitslag.gesproken}
      pauze={uitslag.pauze}
      terugTekst={uitslag.gered ? 'Naar de wereldtour' : `Terug naar ${stad.naam}`}
      baasStad={uitslag.gered ? stadId : undefined}
      opNogEens={nogEens}
      opTerug={uitslag.gered ? opTour : opTerug}
      {opPauze}
    />
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
  .baasnaam {
    padding: 8px 20px;
    border-radius: 999px;
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(90deg, #b91c1c, #f59e0b);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
  }
  main {
    position: relative;
    flex: 1;
  }
</style>
