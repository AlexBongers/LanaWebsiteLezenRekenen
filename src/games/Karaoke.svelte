<script lang="ts">
  /**
   * Rumi: Karaoke-podium (herhaald lezen).
   * Ronde 1: de stem zingt voor en de woorden lichten op.
   * Ronde 2 en 3: Lana leest zelf hardop en tikt na elke regel; de tijd wordt gemeten.
   * Geen klok die afloopt: alleen laten zien dat ze sneller wordt dan zichzelf.
   */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import Tekstballon from '../ui/Tekstballon.svelte';
  import karaoke from '../../content/fase3/karaoke.json';
  import { spreek, stopSpreken } from '../audio/stem';
  import { speelGoed, speelTik, speelFanfare } from '../audio/geluid';
  import { glitterOp } from '../ui/feest';
  import { bewaar, vg } from '../store/voortgang.svelte';
  import { teksten, wacht } from './teksten';
  import type { SpelProps } from './types';

  let { opNoten, opVoortgang, opKlaar }: SpelProps = $props();

  // Het liedje dat het langst niet gezongen is.
  const liedje =
    karaoke.liedjes.find((l) => !vg.gezongen.includes(l.id)) ??
    karaoke.liedjes.find((l) => l.id === vg.gezongen[0]) ??
    karaoke.liedjes[0];
  vg.gezongen = [...vg.gezongen.filter((id) => id !== liedje.id), liedje.id];

  const regels = liedje.regels;
  const woordenPerRegel = regels.map((r) => r.split(' '));
  const totaalWoorden = woordenPerRegel.reduce((n, w) => n + w.length, 0);

  let ronde = $state(1);
  let regel = $state(0);
  let actiefWoord = $state(-1);
  let fase: 'voorzingen' | 'klaarzetten' | 'lezen' | 'uitslag' = $state('voorzingen');
  let start = 0;
  let tijden: number[] = $state([]);
  let stemming: 'rust' | 'dans' | 'juich' | 'denk' = $state('dans');
  let podiumEl: HTMLElement | undefined = $state();
  let gestopt = false;

  onMount(() => {
    void zingVoor();
    return () => {
      gestopt = true;
      stopSpreken();
    };
  });

  /** Woord-index bij een fractie van de regel (op basis van het aantal letters). */
  function woordBij(r: number, fractie: number): number {
    const w = woordenPerRegel[r];
    const totaal = w.reduce((n, x) => n + x.length + 1, 0);
    let tel = 0;
    for (let i = 0; i < w.length; i++) {
      tel += w[i].length + 1;
      if (fractie * totaal < tel) return i;
    }
    return w.length - 1;
  }

  async function zingVoor() {
    await spreek(teksten.karaoke.ronde1);
    for (let r = 0; r < regels.length; r++) {
      if (gestopt) return;
      regel = r;
      actiefWoord = 0;
      await spreek(regels[r], 'zin', (f) => (actiefWoord = woordBij(r, f)));
      actiefWoord = woordenPerRegel[r].length;
      opVoortgang((r + 1) / (regels.length * 3));
      await wacht(250);
    }
    if (gestopt) return;
    opNoten(2, podiumEl);
    volgendeRonde();
  }

  function volgendeRonde() {
    ronde++;
    regel = 0;
    actiefWoord = -1;
    fase = 'klaarzetten';
    stemming = 'rust';
    void spreek(teksten.karaoke.zelf);
  }

  function begin() {
    stopSpreken();
    speelTik();
    fase = 'lezen';
    stemming = 'dans';
    start = performance.now();
  }

  async function volgendeRegel() {
    speelTik();
    opVoortgang(((ronde - 1) * regels.length + regel + 1) / (regels.length * 3));
    if (regel < regels.length - 1) {
      regel++;
      return;
    }
    const seconden = Math.round((performance.now() - start) / 100) / 10;
    tijden = [...tijden, seconden];
    vg.leestempo = [
      ...vg.leestempo.slice(-199),
      { datum: new Date().toISOString(), liedje: liedje.id, ronde, seconden, woorden: totaalWoorden },
    ];
    void bewaar();
    fase = 'uitslag';
    speelGoed();
    glitterOp(podiumEl ?? null);
    stemming = 'juich';
    opNoten(3, podiumEl);
    const sneller = tijden.length > 1 && seconden < tijden[tijden.length - 2];
    if (sneller) await spreek(teksten.karaoke.sneller);
    else await spreek(teksten.complimenten[0]);
  }

  async function verder() {
    if (ronde < 3) {
      volgendeRonde();
      return;
    }
    speelFanfare();
    await spreek(teksten.karaoke.klaar);
    opKlaar([]);
  }

  const wpm = (s: number) => Math.round((totaalWoorden / s) * 60);
</script>

<div class="spelvlak">
  <div class="heldin-plek">
    <Tekstballon kleur="#8b5cf6" />
    <Heldin wie="rumi" {stemming} hoogte={420} />
  </div>

  <div class="speelveld">
    <div class="titel">🎤 {liedje.titel} · ronde {ronde} van 3</div>

    <div class="scherm" bind:this={podiumEl}>
      {#each regels as r, i}
        <button
          class="regel"
          class:huidig={i === regel && fase !== 'uitslag'}
          class:gedaan={fase === 'uitslag' || i < regel}
          onclick={() => fase !== 'voorzingen' && spreek(r, 'zin')}
        >
          {#each woordenPerRegel[i] as w, j}
            <span class="w" class:aan={fase === 'voorzingen' && i === regel && j <= actiefWoord}>{w}</span>{' '}
          {/each}
        </button>
      {/each}
    </div>

    {#if fase === 'voorzingen'}
      <p class="tip">Lees mee met de gouden woorden.</p>
    {:else if fase === 'klaarzetten'}
      <button class="knop-goud groot" onclick={begin}>▶ Ik ga lezen!</button>
    {:else if fase === 'lezen'}
      <button class="knop-goud groot" onclick={volgendeRegel}>{regel < regels.length - 1 ? 'Volgende regel ➜' : 'Klaar! ✓'}</button>
    {:else}
      <div class="uitslag">
        {#each tijden as t, i}
          <div class="tijd" class:nieuw={i === tijden.length - 1}>
            <span>Ronde {i + 2}</span>
            <strong>{t.toLocaleString('nl-NL')} s</strong>
            <small>{wpm(t)} woorden per minuut</small>
          </div>
        {/each}
        <button class="knop-goud" onclick={verder}>{ronde < 3 ? 'Nog een keer ➜' : 'Klaar ✓'}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .titel {
    font-size: 28px;
    font-weight: 700;
    color: #ddd6fe;
  }
  .scherm {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-width: 900px;
    padding: 20px 26px;
    border-radius: 28px;
    background: rgba(10, 2, 30, 0.55);
    border: 3px solid rgba(167, 139, 250, 0.6);
    box-shadow: 0 0 40px rgba(139, 92, 246, 0.35);
  }
  .regel {
    text-align: left;
    padding: 8px 14px;
    border-radius: 16px;
    font-family: var(--font-lees);
    font-size: 30px;
    line-height: 1.4;
    word-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.45);
    transition: all 0.25s;
  }
  .regel.huidig {
    font-size: 40px;
    color: #fff;
    background: rgba(139, 92, 246, 0.25);
  }
  .regel.gedaan {
    color: rgba(255, 255, 255, 0.75);
  }
  .w {
    transition: color 0.12s, text-shadow 0.12s;
  }
  .w.aan {
    color: #fde68a;
    text-shadow: 0 0 16px rgba(251, 191, 36, 0.9);
  }
  .tip {
    margin: 0;
    font-size: 24px;
    color: #ddd6fe;
  }
  .groot {
    min-height: 84px;
    font-size: 34px;
  }
  .uitslag {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .tijd {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 22px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(253, 230, 138, 0.4);
  }
  .tijd.nieuw {
    border-color: #fbbf24;
    box-shadow: 0 0 22px rgba(251, 191, 36, 0.6);
    animation: pop-in 0.5s ease-out;
  }
  .tijd strong {
    font-size: 34px;
    color: #fde68a;
  }
  .tijd small {
    font-size: 16px;
    color: #ddd6fe;
  }
</style>
