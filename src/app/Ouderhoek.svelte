<script lang="ts">
  import { onMount } from 'svelte';
  import { bewaar, exporteer, importeer, vg, wisAlles } from '../store/voortgang.svelte';
  import { percentage, zetNiveau } from '../engine/adaptief';
  import { inDoosjes } from '../engine/herhaling';
  import { lastigsteSommen, vaakVerwisseld } from '../engine/overzicht';
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

  const lastig = $derived(lastigsteSommen(vg.stats).slice(0, 5));
  const verwisseld = $derived(vaakVerwisseld(vg.stats));
  const doosSommen = $derived(inDoosjes(vg.herhaling, 'som.'));
  const doosWoorden = $derived(inDoosjes(vg.herhaling, 'woord.'));

  const toonSom = (id: string) => id.slice(4).replace('+', ' + ').replace('-', ' − ');

  async function kiesNiveau(vak: 'rekenen' | 'flits', e: Event) {
    vg.vaardigheden[vak] = zetNiveau(vg.vaardigheden[vak], Number((e.target as HTMLSelectElement).value));
    vg.auditie[vak] = true;
    await bewaar();
  }

  async function auditieOpnieuw(vak: 'rekenen' | 'flits') {
    vg.auditie[vak] = false;
    await bewaar();
    melding = `De auditie ${vak === 'rekenen' ? 'rekenen (Mira)' : 'flitslezen (Rumi)'} komt bij het volgende concert.`;
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
      <h3>Wat is lastig?</h3>
      {#if lastig.length === 0 && verwisseld.length === 0}
        <p class="uitleg">Na een paar concerten zie je hier welke sommen en woorden lastig zijn.</p>
      {/if}
      {#if lastig.length}
        <table class="smal">
          <tbody>
            {#each lastig as l}
              <tr class:rood={l.pct < 60} class:groen={l.pct >= 85}>
                <th>{l.soort}</th><td>{l.pct}% meteen goed <small>({l.totaal}×)</small></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
      {#if verwisseld.length}
        <p>Verwisselt vaak:
          {#each verwisseld as v, i}{i > 0 ? ', ' : ' '}<strong>{v.woord}</strong> → {v.gekozen} <small>({v.keer}×)</small>{/each}
        </p>
      {/if}
      <h3>Herhalingsdoosjes</h3>
      {#if doosSommen.length + doosWoorden.length === 0}
        <p class="uitleg">Leeg. Wat niet meteen goed gaat, komt hier en wordt vaker herhaald tot het gekend is.</p>
      {:else}
        <p class="uitleg">Komt vaker terug tot het 5 keer goed ging (doos 1 = net fout, doos 5 = bijna gekend).</p>
        <div class="doosjes">
          {#each doosSommen.slice(0, 16) as d}<span class="doos" title="doos {d.item.doos}">{toonSom(d.id)} <small>{d.item.doos}</small></span>{/each}
          {#each doosWoorden.slice(0, 16) as d}<span class="doos" title="doos {d.item.doos}">{d.id.slice(6)} <small>{d.item.doos}</small></span>{/each}
        </div>
      {/if}
      {#if vg.sessies.length}
        <h3>Laatste concerten</h3>
        <ul class="sessies">
          {#each vg.sessies.slice(-6).reverse() as s}
            <li>
              {new Date(s.datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
              · {s.heldin}{s.auditie ? ' (auditie)' : ''} · {s.goed}/{s.totaal} meteen goed · {Math.round(s.seconden / 60)} min
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section>
      <h2>Niveau</h2>
      <p class="uitleg">De eerste keer doet Lana per wereld een korte auditie. Daarna past de site het niveau zelf aan: na 8 opgaven op haar niveau gaat het bij meer dan 85% goed een stapje omhoog en onder 60% een stapje omlaag. Elk concert heeft ongeveer 70% opgaven op haar niveau, 20% iets makkelijker en 10% iets moeilijker. Hier kun je het niveau zelf zetten.</p>
      <label>
        Rekenen
        <select value={vg.vaardigheden.rekenen.niveau} onchange={(e) => kiesNiveau('rekenen', e)}>
          {#each REKENEN as r, i}<option value={i}>{r}</option>{/each}
        </select>
      </label>
      <label>
        Flitslezen
        <select value={vg.vaardigheden.flits.niveau} onchange={(e) => kiesNiveau('flits', e)}>
          {#each FLITS as f, i}<option value={i}>{f}</option>{/each}
        </select>
      </label>
      <div class="rij">
        <button class="klein" onclick={() => auditieOpnieuw('rekenen')}>Auditie rekenen opnieuw</button>
        <button class="klein" onclick={() => auditieOpnieuw('flits')}>Auditie flitsen opnieuw</button>
      </div>
      <button class="klein" onclick={() => { vg.flitstijd = FLITS_START; bewaar(); }}>Flitstijd terug naar 1,5 s</button>

      <h2>Instellingen</h2>
      <label>
        Opdrachten per concert
        <select bind:value={vg.instellingen.opgavenPerSessie} onchange={bewaar}>
          {#each [6, 8, 10, 12] as n}<option value={n}>{n}</option>{/each}
        </select>
      </label>
      <label>
        Pauze na
        <select bind:value={vg.instellingen.sessieMinuten} onchange={bewaar}>
          <option value={10}>10 minuten</option>
          <option value={15}>15 minuten</option>
          <option value={20}>20 minuten</option>
          <option value={0}>geen pauze</option>
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
  table.smal th {
    width: 60%;
    font-weight: 500;
  }
  tr.rood td {
    color: #b91c1c;
    font-weight: 600;
  }
  tr.groen td {
    color: #15803d;
  }
  .doosjes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .doos {
    padding: 3px 10px;
    border-radius: 8px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    font-size: 15px;
  }
  .doos small {
    color: #92400e;
    font-size: 11px;
    vertical-align: super;
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
