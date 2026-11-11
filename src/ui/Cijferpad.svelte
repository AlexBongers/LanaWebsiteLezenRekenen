<script lang="ts">
  /** Groot cijferpaneel om zelf een antwoord te typen (raden kan niet). */
  import { speelTik } from '../audio/geluid';

  let {
    waarde = $bindable(''),
    max = 3,
    uit = false,
    opOk,
  }: { waarde?: string; max?: number; uit?: boolean; opOk: () => void } = $props();

  function typ(c: string) {
    if (uit || waarde.length >= max) return;
    speelTik();
    waarde = waarde === '0' ? c : waarde + c;
  }
  function wis() {
    if (uit) return;
    speelTik();
    waarde = waarde.slice(0, -1);
  }
  function ok() {
    if (uit || waarde === '') return;
    opOk();
  }
</script>

<div class="pad" class:uit>
  {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as c}
    <button class="toets" onclick={() => typ(c)}>{c}</button>
  {/each}
  <button class="toets wis" onclick={wis} aria-label="Wissen">⌫</button>
  <button class="toets" onclick={() => typ('0')}>0</button>
  <button class="toets ok" onclick={ok} disabled={waarde === ''} aria-label="Klaar">✓</button>
</div>

<style>
  .pad {
    display: grid;
    grid-template-columns: repeat(3, 96px);
    gap: 12px;
  }
  .pad.uit {
    opacity: 0.55;
    pointer-events: none;
  }
  .toets {
    height: 78px;
    border-radius: 22px;
    font-family: var(--font-titel);
    font-size: 44px;
    font-weight: 700;
    color: var(--inkt);
    background: linear-gradient(180deg, #fffaf0, #fde68a);
    border: 3px solid #fff;
    box-shadow: 0 6px 0 #b45309, 0 10px 18px rgba(0, 0, 0, 0.35);
    transition: transform 0.08s;
  }
  .toets:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #b45309;
  }
  .wis {
    background: linear-gradient(180deg, #f5f3ff, #c4b5fd);
    box-shadow: 0 6px 0 #6d28d9, 0 10px 18px rgba(0, 0, 0, 0.35);
  }
  .ok {
    color: #fff;
    background: linear-gradient(180deg, #4ade80, #16a34a);
    box-shadow: 0 6px 0 #166534, 0 10px 18px rgba(0, 0, 0, 0.35);
  }
  .ok:disabled {
    opacity: 0.5;
  }
</style>
