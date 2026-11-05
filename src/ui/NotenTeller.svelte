<script lang="ts">
  /** Gouden noten (munten), met een sprongetje als er bij komen. */
  let { aantal }: { aantal: number } = $props();
  let pop = $state(false);
  let vorige: number | null = null;
  $effect(() => {
    if (vorige !== null && aantal > vorige) {
      pop = false;
      requestAnimationFrame(() => (pop = true));
      setTimeout(() => (pop = false), 600);
    }
    vorige = aantal;
  });
</script>

<div class="noten" class:pop aria-label="{aantal} gouden noten">
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="noot-goud" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7c2" />
        <stop offset="0.5" stop-color="#fbbf24" />
        <stop offset="1" stop-color="#b45309" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#noot-goud)" stroke="#fff7c2" stroke-width="2" />
    <path d="M17 11 v13 a4.5 3.6 0 1 1 -2.4 -3.2 V9.5 l11 -2.5 v4z" fill="#78350f" />
  </svg>
  <span>{aantal}</span>
</div>

<style>
  .noten {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 18px 6px 6px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    border: 2px solid rgba(253, 230, 138, 0.5);
    font-size: 30px;
    font-weight: 700;
    color: #fde68a;
  }
  svg {
    width: 44px;
    height: 44px;
  }
  .pop svg {
    animation: pop-in 0.5s ease-out;
  }
</style>
