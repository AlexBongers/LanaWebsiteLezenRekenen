<script lang="ts">
  /** Het gouden schild: groeit mee met de voortgang van het concert. */
  let { waarde }: { waarde: number } = $props();
  let procent = $derived(Math.round(Math.max(0, Math.min(1, waarde)) * 100));
</script>

<div class="schildbalk" role="progressbar" aria-valuenow={procent} aria-valuemin="0" aria-valuemax="100" aria-label="Schild">
  <div class="baan">
    <div class="vulling" style="width:{procent}%">
      <div class="glans"></div>
    </div>
  </div>
  <svg class="embleem" class:vol={procent >= 100} viewBox="0 0 60 70" aria-hidden="true">
    <defs>
      <linearGradient id="schild-goud" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7c2" />
        <stop offset="0.5" stop-color="#fbbf24" />
        <stop offset="1" stop-color="#b45309" />
      </linearGradient>
    </defs>
    <path d="M30 3 L56 13 C56 40 46 58 30 67 C14 58 4 40 4 13 Z" fill="url(#schild-goud)" stroke="#fff7c2" stroke-width="3" />
    <path d="M30 18 l4.5 9.2 10.1 1.5 -7.3 7.1 1.7 10 -9 -4.7 -9 4.7 1.7 -10 -7.3 -7.1 10.1 -1.5z" fill="#fff" opacity="0.9" />
  </svg>
</div>

<style>
  .schildbalk {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }
  .baan {
    flex: 1;
    height: 30px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    border: 3px solid rgba(253, 230, 138, 0.6);
    overflow: hidden;
    box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.5);
  }
  .vulling {
    position: relative;
    height: 100%;
    min-width: 24px;
    border-radius: 999px;
    background:
      repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.18) 0 10px, transparent 10px 20px),
      linear-gradient(180deg, #fff3b0, #fbbf24 50%, #f59e0b);
    box-shadow: 0 0 18px rgba(251, 191, 36, 0.8);
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
  }
  .glans {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
    width: 40%;
    animation: veeg 2.2s ease-in-out infinite;
  }
  .embleem {
    width: 54px;
    height: 62px;
    flex: none;
    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6));
  }
  .embleem.vol {
    animation: pop-in 0.6s ease-out;
  }
  @keyframes veeg {
    from { transform: translateX(-120%); }
    to { transform: translateX(320%); }
  }
</style>
