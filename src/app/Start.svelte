<script lang="ts">
  import Heldin from '../art/Heldin.svelte';
  let { opStart }: { opStart: () => void } = $props();
</script>

<div class="start">
  <h1>
    <span class="klein">Lana's</span>
    <span class="goudtekst groot">Gouden Missie</span>
  </h1>
  <p class="sub">Lezen en rekenen met de demon hunters</p>

  <div class="groep">
    <div class="d1"><Heldin wie="rumi" stemming="dans" hoogte={330} /></div>
    <div class="d2"><Heldin wie="mira" stemming="dans" hoogte={330} /></div>
    <div class="d3"><Heldin wie="zoey" stemming="dans" hoogte={330} /></div>
  </div>

  <button class="knop-goud begin" onclick={opStart}>✨ Tik om te beginnen ✨</button>
</div>

<style>
  .start {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  h1 {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
    animation: pop-in 0.8s ease-out;
  }
  .klein {
    font-size: 44px;
    font-weight: 600;
    color: #f9a8d4;
    text-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
  }
  .groot {
    font-size: 104px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .sub {
    margin: 4px 0 0;
    font-size: 26px;
    color: #ddd6fe;
  }
  .groep {
    display: flex;
    align-items: end;
    gap: 40px;
    margin: 4px 0 10px;
  }
  .d1 { animation-delay: 0s; }
  .d2 :global(.lijf) { animation-delay: -0.3s !important; }
  .d3 :global(.lijf) { animation-delay: -0.6s !important; }
  .begin {
    min-height: 88px;
    font-size: 36px;
    padding: 0 48px;
    animation: puls 1.8s ease-in-out infinite;
  }
  @keyframes puls {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
</style>
