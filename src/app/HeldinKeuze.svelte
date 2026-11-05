<script lang="ts">
  import Heldin from '../art/Heldin.svelte';
  import NotenTeller from '../ui/NotenTeller.svelte';
  import OuderSlot from './OuderSlot.svelte';
  import characters from '../../content/characters.json';
  import { vg, type HeldinId } from '../store/voortgang.svelte';
  import { speelTik } from '../audio/geluid';

  let { opKies, opOuder }: { opKies: (h: HeldinId) => void; opOuder: () => void } = $props();

  const volgorde: HeldinId[] = ['rumi', 'mira', 'zoey'];
  const vaardigheid = { rumi: 'flits', mira: 'rekenen', zoey: 'verhaal' } as const;
  let gekozen: HeldinId | null = $state(null);

  function kies(h: HeldinId) {
    if (gekozen) return;
    speelTik();
    gekozen = h;
    setTimeout(() => opKies(h), 750);
  }
</script>

<div class="keuze">
  <header>
    <OuderSlot opOpen={opOuder} />
    <h1>Met wie ga je oefenen?</h1>
    <NotenTeller aantal={vg.noten} />
  </header>

  <div class="kaarten">
    {#each volgorde as h, i}
      {@const c = characters[h]}
      <button
        class="kaart"
        class:gekozen={gekozen === h}
        class:weg={gekozen !== null && gekozen !== h}
        style="--kleur:{c.kleur}; animation-delay:{i * 0.12}s"
        onclick={() => kies(h)}
      >
        <div class="figuur">
          <Heldin wie={h} stemming={gekozen === h ? 'juich' : 'rust'} hoogte={450} />
        </div>
        <div class="naambord">
          <span class="naam">{c.naam}</span>
          <span class="vak">{c.vak}</span>
          <span class="uitleg">{c.uitleg} · level {vg.vaardigheden[vaardigheid[h]].niveau + 1}</span>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .keuze {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 18px 28px 24px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h1 {
    margin: 0;
    font-size: 46px;
    text-shadow: 0 0 24px rgba(167, 139, 250, 0.8);
  }
  .kaarten {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
    padding-top: 16px;
  }
  .kaart {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
    padding: 0 0 18px;
    border-radius: 36px;
    background:
      radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--kleur) 55%, transparent), transparent 70%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03));
    border: 3px solid color-mix(in srgb, var(--kleur) 70%, white);
    box-shadow: 0 0 30px color-mix(in srgb, var(--kleur) 50%, transparent), inset 0 0 40px rgba(255, 255, 255, 0.05);
    animation: kaart-in 0.6s ease-out backwards;
    transition: transform 0.3s, opacity 0.3s;
  }
  .kaart:active {
    transform: scale(0.97);
  }
  .kaart.gekozen {
    transform: scale(1.05);
    box-shadow: 0 0 60px var(--kleur), 0 0 0 6px #fde68a;
  }
  .kaart.weg {
    opacity: 0.25;
    transform: scale(0.94);
  }
  .figuur {
    flex: 1;
    display: flex;
    align-items: flex-end;
  }
  .naambord {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-top: 6px;
  }
  .naam {
    font-size: 46px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    text-shadow: 0 3px 0 color-mix(in srgb, var(--kleur) 60%, black), 0 0 20px var(--kleur);
  }
  .vak {
    font-size: 26px;
    font-weight: 600;
    color: #fde68a;
  }
  .uitleg {
    font-size: 19px;
    color: #e9d5ff;
  }
  @keyframes kaart-in {
    from { transform: translateY(60px); opacity: 0; }
  }
</style>
