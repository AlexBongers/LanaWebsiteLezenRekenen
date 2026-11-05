# Lana's Gouden Missie ✨

Een tablet-app (website) waarmee Lana spelenderwijs beter leert **lezen** en **rekenen**, samen met de drie demon hunters. Zie [PLAN.md](PLAN.md) voor het volledige plan.

## Wat zit er nu in (fase 0 en 1)

| Heldin | Spel | Wat oefent het |
|---|---|---|
| **Rumi** | Flits-podium | Een woord flitst in de spotlight; welk woord zag je? Lastige klanken (ei/ij, au/ou, ng/nk …) en woorden van groep 4. De flitstijd wordt vanzelf korter als het goed gaat. |
| **Mira** | Dans-sommen | Plus en min tot 20 en tot 100, met en zonder overschrijding, soms als verhaaltjessom. Bij een fout verschijnt een getallenlijn met sprongen (47 → 50 → 55). |
| **Zoey** | Songtekst-verhaal | Een verhaaltje op AVI E4-niveau zelf lezen (tik op een zin voor hulp), daarna 3 vragen. |

Verder:
- Gouden noten, een gouden schild dat groeit, sterren en confetti.
- Het niveau past zich vanzelf aan: boven 85% goed gaat het een stapje moeilijker, onder 60% een stapje makkelijker.
- Een fout antwoord geeft eerst een hint. Bij een tweede fout wordt het antwoord rustig uitgelegd en komt de opgave later terug.
- **Ouderhoek:** houd het slotje linksboven 3 seconden vast en reken de keersom uit. Hier vind je het overzicht, kun je het niveau zelf zetten, de stem kiezen en een back-up maken.
- Werkt offline, als app op het startscherm, liggend en schermvullend. De Android-terugknop vraagt eerst "wil je stoppen?".

## Op de Samsung-tablet zetten

1. Zet de site online (zie hieronder) en open het adres in **Chrome** op de tablet.
2. Menu (⋮) → **App installeren** of **Toevoegen aan startscherm**.
3. Open de app via het icoon (gouden schild). Hij draait dan schermvullend en werkt ook zonder internet.
4. Tip: zet "Niet storen" aan, en gebruik **app vastzetten** (Instellingen → Beveiliging → Overige → App vastzetten) zodat Lana in de app blijft.

### Online zetten (gratis)

De map `dist/` (gemaakt met `npm run build`) is een gewone statische website.
- **Netlify:** sleep de map `dist` naar <https://app.netlify.com/drop>. Je krijgt meteen een adres.
- **Cloudflare Pages** of **Netlify** gekoppeld aan deze GitHub-repository: build-commando `npm run build`, uitvoermap `dist`.
- De site staat op `noindex` en verschijnt dus niet in Google.

## De stem

Tot de stemgenerator is ingesteld, spreekt de **tablet zelf** (kies de mooiste stem in de ouderhoek). Zo maak je de mooie vrouwenstem van Azure:

1. Maak een gratis Azure-account en een **Speech**-resource aan (regio bijv. *West Europe*). Kopieer de sleutel.
2. Kopieer `.env.example` naar `.env` en vul `AZURE_SPEECH_KEY` en `AZURE_SPEECH_REGION` in. Dit bestand gaat **niet** naar GitHub.
3. `npm run audio -- --proef` maakt 4 proefstemmen. Laat Lana kiezen (Ouderhoek → Stem) en zet de gekozen stem in `content/stem.json`.
4. `npm run audio` spreekt alle teksten in (ongeveer 5.600 tekens, ruim binnen de gratis laag). Daarna `npm run build` en opnieuw online zetten.

Verhaaltjessommen worden steeds anders gemaakt; die worden voorgelezen door de tabletstem.

## Inhoud aanpassen

Alles staat in `content/`:
- `lezen/woorden-flits.json`: groepjes van 3 woorden die op elkaar lijken.
- `lezen/verhalen-E4.json`: verhaaltjes met vragen.
- `teksten.json`: instructies en complimenten.
- `characters.json`: namen en kleuren van de heldinnen.

Draai na een wijziging `npm test` (controleert de inhoud) en eventueel `npm run audio`.

## Voor ontwikkelaars

```bash
npm install
npm run dev        # ontwikkelserver (ook bereikbaar op het netwerk, handig om op de tablet te testen)
npm test           # unit-tests van sommen, flitswoorden, verhalen en niveau-aanpassing
npm run check      # type-controle
npm run build      # productieversie in dist/
```

Techniek: Vite, Svelte 5 en TypeScript, als PWA (vite-plugin-pwa). Voortgang wordt bewaard in IndexedDB op de tablet. De tekeningen zijn eigen SVG's en de geluidseffecten worden gemaakt met de Web Audio API.

De figuren zijn eigen tekeningen, geïnspireerd op de film. Er worden geen officiële afbeeldingen of muziek gebruikt. Deze site is bedoeld voor privégebruik.
