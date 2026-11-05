<script lang="ts">
  import { onMount } from 'svelte';
  import { bewaar, exporteer, importeer, vg, wisAlles } from '../store/voortgang.svelte';
  import { percentage } from '../engine/adaptief';
  import { FLITS_START } from '../engine/generator-lezen';
  import { aantalStemBestanden, nederlandseStemmen, spreek, zetApparaatStem } from '../audio/stem';
  import { zetEffectenAan } from '../audio/geluid';
  import stemInfo from '../../content/stem.json';

  let { opSluit }: { opSluit: () => void } = $props();

  const REKENEN = ['R1 · plus en min tot 20 (herhaling)', 'R3 · tot 100 zonder overschrijding', 'R4 · tot 100 met overschrijding'];
  const FLITS = ['L1 · lastige klanken (ei/ij, au/ou, ng/nk …)', 'L2 · woorden van groep 4 (lucht, straat, vrolijk …)'];

  let stemmen: SpeechSynthesisVoice[] = $state([]);
  let melding = $state('');
  let proefstemmen: { id: string; naam: string; url: string }[] = $state([]);

  onMount(() => {
    const laad = () => (stemmen = nederlandseStemmen());
    laad();
    speechSynthesis?.addEventListener?.('voiceschanged', laad);
    // Proefstemmen van de stemgenerator (alleen als ze gemaakt zijn met: npm run audio -- --proef)
    Promise.all(
      stemInfo.proefstemmen.map(async (p) => {
        const url = `${import.meta.env.BASE_URL}audio/proef/${p.provider}-${p.id}.mp3`;
        try {
          const r = await fetch(url, { method: 'HEAD' });
          return r.ok && (r.headers.get('content-type') ?? '').includes('audio') ? { ...p, url } : null;
        } catch {
          return null;
        }
      }),
    ).then((l) => (proefstemmen = l.filter((x) => x !== null)));
    return () => speechSynthesis?.removeEventListener?.('voiceschanged', laad);
  });

  const week = $derived(vg.sessies.filter((s) => Date.now() - new Date(s.datum).getTime() < 7 * 864e5));
  const minutenWeek = $derived(Math.round(week.reduce((t, s) => t + s.seconden, 0) / 60));

  function pct(v: { recent: boolean[]; niveau: number }) {
    const p = percentage(v);
    return p === null ? 'nog geen gegevens' : `${p}% goed (laatste ${v.recent.length})`;
  }

  async function kiesStem(uri: string | null) {
    vg.instellingen.apparaatStem = uri;
    zetApparaatStem(uri);
    await bewaar();
    await spreek(stemInfo.proefzin);
  }

  function download() {
    const blob = new Blob([exporteer()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gouden-missie-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(e: Event) {
    const bestand = (e.target as HTMLInputElement).files?.[0];
    if (!bestand) return;
    try {
      await importeer(await bestand.text());
      melding = 'Back-up teruggezet.';
    } catch (err) {
      melding = (err as Error).message;
    }
  }

  async function wis() {
    if (confirm('Weet je zeker dat je alle voortgang en gouden noten wilt wissen?')) {
      await wisAlles();
      melding = 'Alles is gewist.';
    }
  }
</script>

<div class="ouder">
  <header>
    <h1>Ouderhoek</h1>
    <button class="sluit" onclick={opSluit}>Sluiten ✕</button>
  </header>

  <div class="raster">
    <section>
      <h2>Overzicht</h2>
      <p><strong>{vg.noten}</strong> gouden noten · <strong>{week.length}</strong> concerten en <strong>{minutenWeek}</strong> minuten in de afgelopen 7 dagen</p>
      <table>
        <tbody>
          <tr><th>Rekenen (Mira)</th><td>{REKENEN[vg.vaardigheden.rekenen.niveau]}</td><td>{pct(vg.vaardigheden.rekenen)}</td></tr>
          <tr><th>Flitslezen (Rumi)</th><td>{FLITS[vg.vaardigheden.flits.niveau]}<br /><small>flitstijd nu {(vg.flitstijd / 1000).toFixed(2)} s</small></td><td>{pct(vg.vaardigheden.flits)}</td></tr>
          <tr><th>Verhalen (Zoey)</th><td>{vg.gelezenVerhalen.length} van 5 verhalen gelezen (AVI E4)</td><td>{pct(vg.vaardigheden.verhaal)}</td></tr>
        </tbody>
      </table>
      {#if vg.sessies.length}
        <h3>Laatste concerten</h3>
        <ul class="sessies">
          {#each vg.sessies.slice(-6).reverse() as s}
            <li>
              {new Date(s.datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
              · {s.heldin} · {s.goed}/{s.totaal} meteen goed · {Math.round(s.seconden / 60)} min
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section>
      <h2>Niveau</h2>
      <p class="uitleg">De site past het niveau zelf aan (boven 85% goed: moeilijker, onder 60%: makkelijker). Hier kun je het zelf zetten.</p>
      <label>
        Rekenen
        <select bind:value={vg.vaardigheden.rekenen.niveau} onchange={bewaar}>
          {#each REKENEN as r, i}<option value={i}>{r}</option>{/each}
        </select>
      </label>
      <label>
        Flitslezen
        <select bind:value={vg.vaardigheden.flits.niveau} onchange={bewaar}>
          {#each FLITS as f, i}<option value={i}>{f}</option>{/each}
        </select>
      </label>
      <button class="klein" onclick={() => { vg.flitstijd = FLITS_START; bewaar(); }}>Flitstijd terug naar 1,5 s</button>

      <h2>Instellingen</h2>
      <label>
        Opdrachten per concert
        <select bind:value={vg.instellingen.opgavenPerSessie} onchange={bewaar}>
          {#each [6, 8, 10, 12] as n}<option value={n}>{n}</option>{/each}
        </select>
      </label>
      <label class="vink">
        <input type="checkbox" bind:checked={vg.instellingen.effecten} onchange={() => { zetEffectenAan(vg.instellingen.effecten); bewaar(); }} />
        Geluidseffecten
      </label>
      <label class="vink">
        <input type="checkbox" bind:checked={vg.instellingen.verhaaltjesSommen} onchange={bewaar} />
        Verhaaltjessommen bij rekenen
      </label>
    </section>

    <section>
      <h2>Stem</h2>
      {#if aantalStemBestanden() > 0}
        <p>✅ {aantalStemBestanden()} teksten zijn ingesproken door de stemgenerator ({stemInfo.stem}).</p>
      {:else}
        <p class="uitleg">De stemgenerator (ElevenLabs of Azure) is nog niet gebruikt. Tot die tijd spreekt de tablet zelf. Kies hieronder de mooiste Nederlandse stem van deze tablet.</p>
      {/if}
      {#if proefstemmen.length}
        <h3>Proefstemmen (laat Lana kiezen!)</h3>
        {#each proefstemmen as p}
          <button class="klein" onclick={() => new Audio(p.url).play()}>▶ {p.naam}</button>
        {/each}
      {/if}
      <h3>Stem van deze tablet</h3>
      {#if stemmen.length === 0}
        <p class="uitleg">Geen Nederlandse stem gevonden. Op Android: Instellingen → Algemeen beheer → Tekst-naar-spraak → kies "Spraakservices van Google" en installeer Nederlands.</p>
      {/if}
      {#each stemmen as v}
        <button class="stem" class:actief={vg.instellingen.apparaatStem === v.voiceURI} onclick={() => kiesStem(v.voiceURI)}>
          ▶ {v.name} <small>({v.lang})</small>
        </button>
      {/each}

      <h2>Back-up</h2>
      <div class="rij">
        <button class="klein" onclick={download}>Voortgang downloaden</button>
        <label class="klein bestand">Back-up terugzetten<input type="file" accept="application/json" onchange={upload} /></label>
        <button class="klein gevaar" onclick={wis}>Alles wissen</button>
      </div>
      {#if melding}<p class="melding">{melding}</p>{/if}
    </section>
  </div>
</div>

<style>
  .ouder {
    position: fixed;
    inset: 0;
    z-index: 30;
    overflow-y: auto;
    padding: 20px 28px 40px;
    background: #f8fafc;
    color: #0f172a;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    user-select: text;
    color-scheme: light;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    margin: 0;
    font-size: 30px;
  }
  h2 {
    margin: 0 0 8px;
    font-size: 21px;
  }
  h3 {
    margin: 14px 0 6px;
    font-size: 16px;
  }
  .raster {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1fr;
    gap: 18px;
    margin-top: 16px;
  }
  section {
    padding: 18px;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
    font-size: 16px;
  }
  section h2:not(:first-child) {
    margin-top: 22px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    text-align: left;
    vertical-align: top;
    padding: 8px 6px;
    border-top: 1px solid #e2e8f0;
  }
  th {
    width: 26%;
  }
  .uitleg {
    color: #475569;
    font-size: 15px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 10px 0;
    font-weight: 600;
  }
  label.vink {
    flex-direction: row;
    align-items: center;
    font-weight: 400;
  }
  select {
    min-height: 44px;
    font-size: 15px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    padding: 0 8px;
    background: #fff;
    color: #0f172a;
  }
  input[type='checkbox'] {
    width: 24px;
    height: 24px;
  }
  .sluit, .klein, .stem {
    min-height: 44px;
    padding: 0 16px;
    border-radius: 10px;
    background: #e2e8f0;
    color: #0f172a;
    font-size: 15px;
    margin: 4px 6px 4px 0;
  }
  .sluit {
    background: #1e1b4b;
    color: #fff;
    font-size: 18px;
  }
  .stem {
    display: block;
    width: 100%;
    text-align: left;
  }
  .stem.actief {
    background: #ddd6fe;
    outline: 2px solid #7c3aed;
  }
  .rij {
    display: flex;
    flex-wrap: wrap;
  }
  .bestand {
    display: inline-flex;
    justify-content: center;
    font-weight: 400;
    margin: 4px 6px 4px 0;
  }
  .bestand input {
    display: none;
  }
  .gevaar {
    background: #fee2e2;
    color: #991b1b;
  }
  .sessies {
    padding-left: 18px;
    margin: 0;
    color: #334155;
  }
  .melding {
    font-weight: 600;
    color: #15803d;
  }
</style>
