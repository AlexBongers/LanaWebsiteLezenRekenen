<script lang="ts">
  /** De heldin van het spel, met Lana (in haar eigen look uit de kleedkamer) naast haar. */
  import Heldin from './Heldin.svelte';
  import Lana from './Lana.svelte';
  import { vg, type HeldinId } from '../store/voortgang.svelte';

  let {
    wie,
    stemming = 'rust',
    hoogte = 420,
  }: { wie: HeldinId; stemming?: 'rust' | 'dans' | 'juich' | 'denk' | 'draai'; hoogte?: number } = $props();

  // Lana is wat kleiner, staat iets voor de heldin en beweegt een tikje later mee.
  let lanaHoogte = $derived(Math.round(hoogte * 0.64));
</script>

<div class="duo">
  <Heldin {wie} {stemming} {hoogte} />
  <div class="lana" style="margin-left:{-Math.round(hoogte * 0.09)}px">
    <Lana avatar={vg.avatar} {stemming} hoogte={lanaHoogte} licht />
  </div>
</div>

<style>
  .duo {
    display: inline-flex;
    align-items: flex-end;
  }
  .lana {
    position: relative;
    z-index: 1;
    margin-bottom: 4px;
  }
</style>
