<script lang="ts">
  import DansSommen from '../games/DansSommen.svelte';
  import FlitsPodium from '../games/FlitsPodium.svelte';
  import Verhaal from '../games/Verhaal.svelte';
  import WoordPlaatje from '../games/WoordPlaatje.svelte';
  import Zwaard from '../games/Zwaard.svelte';
  import Karaoke from '../games/Karaoke.svelte';
  import RijmRap from '../games/RijmRap.svelte';
  import ZinnenShow from '../games/ZinnenShow.svelte';
  import GetallenSpring from '../games/GetallenSpring.svelte';
  import Dozen from '../games/Dozen.svelte';
  import TafelRitme from '../games/TafelRitme.svelte';
  import Sterrenregen from '../games/Sterrenregen.svelte';
  import BallonnenRij from '../games/BallonnenRij.svelte';
  import KlokShow from '../games/KlokShow.svelte';
  import BlokkenBouwer from '../games/BlokkenBouwer.svelte';
  import { SPEL, type SpelId } from '../games/spellen';
  import SchildBalk from '../ui/SchildBalk.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import Beloning from './Beloning.svelte';
  import characters from '../../content/characters.json';
  import { maakSommen, REKEN_NIVEAUS, somId, somUitId, type Som } from '../engine/generator-rekenen';
  import {
    flitsUitId,
    groepSleutel,
    LEES_NIVEAUS,
    maakFlitsOpgaven,
    woordId,
    type FlitsOpgave,
  } from '../engine/generator-lezen';
  import { REKEN_REGELS, verwerkSessie } from '../engine/adaptief';
  import { aanDeBeurt, verwerkAntwoord } from '../engine/herhaling';
  import { AUDITIE, auditieUitslag, planAuditie, planSessie, type Gepland, type Resultaat } from '../engine/sessie';
  import { werkStatsBij } from '../engine/overzicht';
  import { bewaar, vg, type HeldinId } from '../store/voortgang.svelte';
  import { stopSpreken } from '../audio/stem';
  import { speelCombo } from '../audio/geluid';
  import { vliegNoten } from '../ui/vlieg';
  import { noteerSterren, sterrenVoor } from '../engine/tour';

  let {
    spel,
    stadId,
    opTerug,
    opStop,
    pauzeNodig = () => false,
    opPauze = opTerug,
  }: {
    spel: SpelId;
    /** Stad op de wereldtour: daar komen de sterren van dit concert bij. */
    stadId?: string;
    opTerug: () => void;
    opStop: () => void;
    /** Is de speeltijd om? Dan volgt na dit concert een pauze. */
    pauzeNodig?: () => boolean;
    opPauze?: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const def = SPEL[spel];
  const heldin: HeldinId = def.heldin;
  /** Het niveau waarop dit concert gespeeld wordt (voor de spellen die zelf hun opgaven maken). */
  let niveau = $state(0);

  let ronde = $state(0);
  let voortgang = $state(0);
  let verdiend = $state(0);
  let eerste = $state(true);
  let start = Date.now();
  let uitslag: {
    goed: number;
    totaal: number;
    omhoog: boolean;
    titel?: string;
    melding?: string;
    pauze: boolean;
  } | null = $state(null);

  const NIEUW = {
    plaatje: WoordPlaatje,
    zwaard: Zwaard,
    karaoke: Karaoke,
    rijm: RijmRap,
    zinnen: ZinnenShow,
    springen: GetallenSpring,
    dozen: Dozen,
    tafels: TafelRitme,
    sterren: Sterrenregen,
    ballonnen: BallonnenRij,
    klok: KlokShow,
    bouwen: BlokkenBouwer,
  } as const;

  // ---------- Het concert plannen ----------
  let auditie = $state(false);
  let sommen: Gepland<Som>[] = $state([]);
  let woorden: Gepland<FlitsOpgave>[] = $state([]);

  const maakReken = (niveau: number, n: number) =>
    maakSommen(REKEN_NIVEAUS[niveau], n, { verhaalKans: !auditie && vg.instellingen.verhaaltjesSommen ? 0.25 : 0 });
  const maakFlits = (niveau: number, n: number) => maakFlitsOpgaven(LEES_NIVEAUS[niveau], n);

  function planRonde() {
    const aantal = vg.instellingen.opgavenPerSessie;
    const nu = Date.now();
    niveau = vg.vaardigheden[def.vaardigheid].niveau;
    if (spel === 'sommen') {
      auditie = !vg.auditie.rekenen;
      sommen = auditie
        ? planAuditie(AUDITIE.rekenen, maakReken, somId)
        : planSessie({
            aantal,
            niveau: vg.vaardigheden.rekenen.niveau,
            maxNiveau: def.maxNiveau,
            herhaling: aanDeBeurt(vg.herhaling, 'som.', nu),
            maak: maakReken,
            herbouw: (id) => somUitId(id),
            id: somId,
            // Rekenen niet te snel moeilijk: geen uitdaging, meer makkelijke sommen.
            uitdaging: false,
            makkelijk: 0.3,
          });
    } else if (spel === 'flits') {
      auditie = !vg.auditie.flits;
      woorden = auditie
        ? planAuditie(AUDITIE.flits, maakFlits, (o) => woordId(o.woord))
        : planSessie({
            aantal,
            niveau: vg.vaardigheden.flits.niveau,
            maxNiveau: def.maxNiveau,
            herhaling: aanDeBeurt(vg.herhaling, 'woord.', nu),
            maak: maakFlits,
            herbouw: (id) => flitsUitId(id),
            id: (o) => woordId(o.woord),
            sleutel: groepSleutel,
          });
    } else {
      auditie = false;
    }
  }
  planRonde();

  // ---------- Noten en combo's ----------
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

  // ---------- Concert klaar ----------
  let afgerond = false;

  function opKlaar(resultaten: Resultaat[]) {
    // Snel dubbel tikken aan het eind mag het concert niet twee keer tellen.
    if (afgerond) return;
    afgerond = true;
    const nu = Date.now();
    const sleutel = def.vaardigheid;
    const voor = vg.vaardigheden[sleutel].niveau;

    // Herhalingsdoosjes (niet voor verhaalvragen) en overzicht voor de ouderhoek.
    let h = vg.herhaling;
    // Alleen sommen en flitswoorden komen terug via de doosjes (die spellen plannen herhaling).
    for (const r of resultaten) {
      if (r.id.startsWith('som.') || r.id.startsWith('woord.')) h = verwerkAntwoord(h, r.id, r.goed, r.niveau, nu);
    }
    vg.herhaling = h;
    vg.stats = werkStatsBij(vg.stats, resultaten);

    let titel: string | undefined;
    let melding: string | undefined;
    if (auditie && (sleutel === 'rekenen' || sleutel === 'flits')) {
      // Rekenen: alleen een niveau verder als alles op dat niveau meteen goed was.
      const niveau =
        spel === 'sommen'
          ? auditieUitslag(resultaten, Math.max(...AUDITIE.rekenen), 1)
          : auditieUitslag(resultaten, def.maxNiveau);
      vg.vaardigheden[sleutel] = { niveau, recent: vg.vaardigheden[sleutel].recent, opNiveau: [] };
      vg.auditie[sleutel] = true;
      titel = 'Auditie gehaald!';
      melding = `⭐ Jij begint op level ${niveau + 1}!`;
    } else {
      // Alleen opgaven op haar eigen niveau tellen mee voor omhoog of omlaag.
      const eigen = resultaten.filter((r) => r.niveau === voor).map((r) => r.goed);
      vg.vaardigheden[sleutel] = verwerkSessie(
        vg.vaardigheden[sleutel],
        eigen,
        def.maxNiveau,
        def.rekenen ? REKEN_REGELS : undefined,
      );
    }

    const bonus = 5;
    vg.noten += bonus;
    verdiend += bonus;
    const goed = resultaten.filter((r) => r.goed).length;
    if (stadId) vg.tour = noteerSterren(vg.tour, stadId, heldin, sterrenVoor(goed, resultaten.length));
    vg.sessies = [
      ...vg.sessies.slice(-199),
      {
        datum: new Date().toISOString(),
        heldin,
        spel,
        stad: stadId,
        goed,
        totaal: resultaten.length,
        noten: verdiend,
        seconden: Math.round((nu - start) / 1000),
        auditie,
      },
    ];
    void bewaar();
    voortgang = 1;
    const omhoog = !auditie && vg.vaardigheden[sleutel].niveau > voor;
    const pauze = pauzeNodig();
    setTimeout(() => {
      uitslag = { goed, totaal: resultaten.length, omhoog, titel, melding, pauze };
    }, 700);
  }

  function nogEens() {
    afgerond = false;
    uitslag = null;
    reeks = 0;
    voortgang = 0;
    verdiend = 0;
    eerste = false;
    start = Date.now();
    planRonde();
    ronde++;
  }

  // De heldin heeft in het spelmenu al gegroet: geen extra wachttijd.
  const intro = undefined;

  const zetVoortgang = (f: number) => (voortgang = f);

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
    {#if auditie}<div class="auditie" style="--kleur:{characters[heldin].kleur}">🎤 Auditie</div>{/if}
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
      {#if spel === 'sommen'}
        <DansSommen {opNoten} opVoortgang={zetVoortgang} {opKlaar} {intro} opgaven={sommen} {auditie} />
      {:else if spel === 'flits'}
        <FlitsPodium {opNoten} opVoortgang={zetVoortgang} {opKlaar} {intro} opgaven={woorden} {auditie} />
      {:else if spel === 'verhaal'}
        <Verhaal {opNoten} opVoortgang={zetVoortgang} {opKlaar} {intro} />
      {:else}
        {@const Spel = NIEUW[spel]}
        <Spel {opNoten} opVoortgang={zetVoortgang} {opKlaar} {niveau} aantal={vg.instellingen.opgavenPerSessie} />
      {/if}
    {/key}
  </main>

  {#if uitslag}
    <Beloning {heldin} {...uitslag} noten={verdiend} opNogEens={nogEens} {opTerug} {opPauze} />
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
  .auditie {
    padding: 8px 20px;
    border-radius: 999px;
    font-size: 26px;
    font-weight: 700;
    background: linear-gradient(90deg, var(--kleur), #f59e0b);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
    animation: pop-in 0.5s ease-out;
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
