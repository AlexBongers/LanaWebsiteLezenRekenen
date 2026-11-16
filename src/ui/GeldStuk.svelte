<script lang="ts">
  /**
   * Een euromunt of eurobriefje in de echte kleuren (bedrag in centen):
   * koperkleurig 5 cent, goudkleurig 10/20/50 cent, tweekleurig € 1 en € 2,
   * briefjes: € 5 grijs, € 10 rood, € 20 blauw, € 50 oranje.
   */
  import { isBriefje, stukTekst } from '../engine/generator-lana';

  let { cent, klein = false }: { cent: number; klein?: boolean } = $props();
  const soort = $derived(isBriefje(cent) ? `b${cent / 100}` : cent >= 100 ? `e${cent / 100}` : cent === 5 ? 'koper' : 'goud');
</script>

<span class="stuk {soort}" class:briefje={isBriefje(cent)} class:klein style="--maat:{cent === 5 ? 58 : cent === 10 ? 60 : cent === 20 ? 66 : cent === 50 ? 72 : cent === 100 ? 70 : 76}px">
  {stukTekst(cent)}
</span>

<style>
  .stuk {
    display: inline-grid;
    place-items: center;
    width: var(--maat);
    height: var(--maat);
    border-radius: 50%;
    font-family: var(--font-titel);
    font-size: 23px;
    font-weight: 700;
    color: #422006;
    box-shadow: 0 5px 0 rgba(0, 0, 0, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.35);
  }
  .koper {
    background: radial-gradient(circle at 35% 30%, #fdba74, #c2410c 60%, #7c2d12);
    border: 3px solid #9a3412;
    color: #fff7ed;
  }
  .goud {
    background: radial-gradient(circle at 35% 30%, #fff7c2, #eab308 55%, #a16207);
    border: 3px solid #ca8a04;
  }
  /* € 1: zilver in het midden, gouden rand. € 2: goud in het midden, zilveren rand. */
  .e1 {
    background: radial-gradient(circle at 40% 35%, #f9fafb 0 48%, #d1d5db 56%, #eab308 60%, #a16207);
    border: 3px solid #ca8a04;
  }
  .e2 {
    background: radial-gradient(circle at 40% 35%, #fff7c2 0 40%, #eab308 56%, #e5e7eb 60%, #9ca3af);
    border: 3px solid #9ca3af;
  }
  .briefje {
    width: 118px;
    height: 64px;
    border-radius: 9px;
    color: #fff;
    font-size: 26px;
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
    border: 3px solid rgba(255, 255, 255, 0.7);
  }
  .b5 {
    background: linear-gradient(135deg, #cbd5e1, #64748b);
  }
  .b10 {
    background: linear-gradient(135deg, #fca5a5, #dc2626);
  }
  .b20 {
    background: linear-gradient(135deg, #93c5fd, #2563eb);
  }
  .b50 {
    background: linear-gradient(135deg, #fdba74, #ea580c);
  }
  .klein {
    transform: scale(0.78);
    margin: -6px;
  }
</style>
