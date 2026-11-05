<script lang="ts">
  /** Sessie-einde: de speeltijd is om, de heldinnen zwaaien gedag. */
  import { onMount } from 'svelte';
  import Heldin from '../art/Heldin.svelte';
  import { spreek } from '../audio/stem';
  import teksten from '../../content/teksten.json';
  import { vg } from '../store/voortgang.svelte';

  let { sinds, opOpnieuw }: { sinds: number; opOpnieuw: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const vandaag = vg.sessies.filter((s) => new Date(s.datum).getTime() >= sinds);
  const noten = vandaag.reduce((t, s) => t + s.noten, 0);
  const goed = vandaag.reduce((t, s) => t + s.goed, 0);

  onMount(() => {
    void spreek(teksten.pauze.tot);
  });
</script>

<div class="einde">
  <h1 class="goudtekst">Goed geoefend, Lana!</h1>
  <p class="sub">Het schild is weer super sterk. Rust maar lekker uit.</p>

  <div class="groep">
    <Heldin wie="rumi" stemming="juich" hoogte={300} />
    <Heldin wie="mira" stemming="dans" hoogte={330} />
    <Heldin wie="zoey" stemming="juich" hoogte={300} />
  </div>

  <div class="tellers">
    <div><strong>{vandaag.length}</strong><span>concerten</span></div>
    <div><strong>{goed}</strong><span>meteen goed</span></div>
    <div><strong>+{noten}</strong><span>gouden noten</span></div>
  </div>

  <button class="opnieuw" onclick={opOpnieuw}>Naar het begin</button>
</div>

<style>
  .einde {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  h1 {
    margin: 0;
    font-size: 76px;
    animation: pop-in 0.7s ease-out;
  }
  .sub {
    margin: 0;
    font-size: 28px;
    color: #ddd6fe;
  }
  .groep {
    display: flex;
    align-items: end;
    gap: 30px;
  }
  .tellers {
    display: flex;
    gap: 24px;
  }
  .tellers div {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 150px;
    padding: 10px 20px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(253, 230, 138, 0.5);
  }
  .tellers strong {
    font-size: 44px;
    color: #fde68a;
  }
  .tellers span {
    font-size: 20px;
    color: #ddd6fe;
  }
  .opnieuw {
    margin-top: 8px;
    padding: 12px 26px;
    border-radius: 999px;
    font-size: 20px;
    color: #ddd6fe;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
</style>
