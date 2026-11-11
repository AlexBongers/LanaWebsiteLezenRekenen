<script lang="ts">
  /**
   * Geeft een platte figuur diepte, alsof ze echt op een 3D-podium staat:
   *  - een glanzend podiumschijfje en een zachte schaduw onder de voeten
   *  - een lichte draai heen en weer (sterker bij dansen en juichen, schuin bij nadenken)
   *  - een randlicht in de eigen kleur (via --rand, gebruikt door de figuur zelf)
   *  - een spotlicht dat langzaam over de figuur glijdt
   * In de lichte modus blijven alleen de goedkope dingen over (schijf, schaduw, draai).
   */
  import type { Snippet } from 'svelte';

  let {
    kleur = '#a78bfa',
    stemming = 'rust',
    aan = true,
    schijf = true,
    children,
  }: {
    kleur?: string;
    stemming?: string;
    aan?: boolean;
    schijf?: boolean;
    children: Snippet;
  } = $props();

  // Elke figuur een eigen ritme, zodat een groep niet als één blok beweegt
  const vertraging = -Math.random() * 6;
</script>

{#if aan}
  <div class="diepte {stemming}" style="--kleur:{kleur}; --vertraging:{vertraging}s">
    {#if schijf}<div class="schijf" aria-hidden="true"></div>{/if}
    <div class="schaduw" aria-hidden="true"></div>
    <div class="kantel">
      {@render children()}
      <div class="spot" aria-hidden="true"></div>
    </div>
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .diepte {
    --rand: color-mix(in srgb, var(--kleur) 75%, white);
    position: relative;
    display: inline-block;
    line-height: 0;
    perspective: 900px;
    perspective-origin: 50% 35%;
  }
  .kantel {
    position: relative;
    transform-origin: 50% 96%;
    animation: zwenk 7s ease-in-out infinite;
    animation-delay: var(--vertraging);
  }
  .dans .kantel,
  .juich .kantel,
  .draai .kantel {
    animation: zwenk-dans 1.9s ease-in-out infinite;
    animation-delay: var(--vertraging);
  }
  .denk .kantel {
    animation: none;
    transform: rotateY(-16deg) rotateZ(-1deg);
    transition: transform 0.5s;
  }
  /* Podiumschijfje onder de voeten */
  .schijf {
    position: absolute;
    left: 50%;
    bottom: -2.5%;
    width: 62%;
    aspect-ratio: 4 / 1;
    translate: -50% 0;
    border-radius: 50%;
    background:
      radial-gradient(ellipse at 50% 35%, rgba(255, 255, 255, 0.35), transparent 60%),
      radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--kleur) 55%, #1b0b3a), #1b0b3a 75%);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--kleur) 80%, white),
      0 0 18px color-mix(in srgb, var(--kleur) 70%, transparent),
      0 6px 10px rgba(0, 0, 0, 0.5);
    opacity: 0.9;
  }
  /* Zachte schaduw die meeademt met de beweging */
  .schaduw {
    position: absolute;
    left: 50%;
    bottom: -0.5%;
    width: 46%;
    aspect-ratio: 5 / 1;
    translate: -50% 0;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(8, 2, 20, 0.7), transparent 70%);
    animation: adem 7s ease-in-out infinite;
    animation-delay: var(--vertraging);
  }
  .dans .schaduw,
  .juich .schaduw,
  .draai .schaduw {
    animation: adem 0.95s ease-in-out infinite;
  }
  /* Spotlicht dat over de figuur glijdt */
  .spot {
    position: absolute;
    inset: 0 -20%;
    pointer-events: none;
    background: radial-gradient(ellipse 30% 55% at 50% 35%, rgba(255, 255, 255, 0.55), transparent 70%);
    mix-blend-mode: soft-light;
    animation: spot 9s ease-in-out infinite;
    animation-delay: var(--vertraging);
  }
  @keyframes zwenk {
    0%, 100% { transform: rotateY(-11deg); }
    50% { transform: rotateY(11deg); }
  }
  @keyframes zwenk-dans {
    0%, 100% { transform: rotateY(-18deg) translateZ(0); }
    50% { transform: rotateY(18deg) translateZ(20px); }
  }
  @keyframes adem {
    0%, 100% { transform: scaleX(1); opacity: 1; }
    50% { transform: scaleX(0.88); opacity: 0.75; }
  }
  @keyframes spot {
    0%, 100% { transform: translateX(-35%); opacity: 0.5; }
    50% { transform: translateX(35%); opacity: 1; }
  }
  :global(.licht) .spot {
    display: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .kantel,
    .schaduw,
    .spot {
      animation: none !important;
    }
  }
</style>
