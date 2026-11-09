# Lana's Gouden Missie ✨

**Spelen:** https://lanas-gouden-missie.exl999.workers.dev (op de tablet installeren: zie hieronder)

Een tablet-app (website) waarmee Lana spelenderwijs beter leert **lezen** en **rekenen**, samen met de drie demon hunters. Zie [PLAN.md](PLAN.md) voor het volledige plan.

## Wat zit er nu in (fase 0 tot en met 3)

Na het kiezen van een heldin kiest Lana een spel. De snelle spellen staan bovenaan.

| Heldin | Spel | Wat oefent het |
|---|---|---|
| **Rumi** | ⚡ Flits-podium | Een woord flitst; welk woord zag je? De flitstijd wordt korter als het goed gaat. |
| | 🖼️ Woord bij plaatje | Lees het woord (niet voorgelezen) en tik het plaatje. Niveau 2: plaatjes van woorden die erop lijken. |
| | 🗡️ Klankgroepen-zwaard | Tik tussen de letters om een woord in klankgroepen te hakken (ra\|men, zon\|ne\|bril). |
| | 🎤 Karaoke-podium | Herhaald lezen: de stem zingt voor (woorden lichten op), daarna leest Lana twee keer zelf. De tijd wordt gemeten. |
| **Mira** | 💃 Dans-sommen | Plus en min tot 100 in vijf rustige stapjes, met getallenlijn-hint. |
| | 🥁 Tafel-ritme | Op een beat: 2, 4, 6, … welk getal komt hierna? Tafels van 1, 2, 10, dan 5, dan 3 en 4. |
| | 🦘 Getallen-spring (3D) | Tik op de lichtgevende catwalk waar een getal staat; later sommen via het hele tiental (47 + 8: eerst naar 50). De gouden ster springt mee. |
| | 📦 Lightstick-dozen (3D) | Maak een getal met glazen dozen van 10 en losse lichtstokken op een 3D-podium (slepen draait het podium), of tel hoeveel het er zijn. |
| **Zoey** | 🎧 Rijm-rap | Zoey rapt een woord; welk geschreven woord rijmt erop? |
| | 🎬 Zinnen-show | Lees een zin en kies het plaatje dat erbij past (de plaatjes lijken op elkaar). |
| | 📖 Songtekst-verhaal | Een verhaaltje in korte stukjes lezen, daarna 3 vragen. |

Verder:
- Gouden noten die naar de teller vliegen, een gouden schild dat groeit, "3 op rij!"-combo's, sterren en confetti.
- Een tekstballon bij de heldin laat zien wat de stem zegt, zodat Lana kan meelezen.
- **Auditie:** de eerste keer bij Mira en Rumi 8 opgaven die steeds moeilijker worden. Daarmee kiest de site het startniveau.
- Het niveau past zich vanzelf aan: na 8 opgaven op haar niveau gaat het bij meer dan 85% goed een stapje moeilijker, onder 60% een stapje makkelijker.
- **Rekenen gaat rustiger:** vijf kleine stapjes (tot 20 → tot 100 makkelijk → zonder overschrijding → over het tiental met één getal → met twee getallen). Pas omhoog bij 9 van de 10 goed, al terug onder 70%, geen uitdagingssommen en 30% makkelijke sommen.
- **Verhaal in kleine stukjes:** hooguit 3 zinnen per bladzijde, grote letters, elke zin op een eigen regel.
- **Past op elk scherm:** de app schaalt mee (ontworpen voor 1280 × 800, zoals de Galaxy Tab A9+).
- **Stoppen:** rode knop op het keuzescherm, of de terugknop van de tablet. Volledig scherm staat standaard uit (aan te zetten in de ouderhoek).
- **Mix per concert:** ongeveer 70% op haar niveau, 20% iets makkelijker (altijd beginnen met een opwarmer) en 10% een uitdaging.
- **Herhalingsdoosjes:** wat niet meteen goed ging, komt het volgende concert terug, en daarna na 1, 3, 7 en 14 dagen tot het gekend is.
- **Pauze:** na 10, 15 of 20 minuten (instelbaar) eindigt het na het lopende concert met een pauzescherm.
- Een fout antwoord geeft eerst een hint. Bij een tweede fout wordt het antwoord rustig uitgelegd en komt de opgave later terug.
- **Ouderhoek:** houd het slotje linksboven 3 seconden vast en reken de keersom uit. Hier vind je het overzicht (niveau per spel, leestempo-grafiek van de karaoke, welke sommen lastig zijn, welke woorden ze verwisselt, wat er in de doosjes zit), kun je het niveau zelf zetten, de stem kiezen en een back-up maken.
- Werkt offline, als app op het startscherm, liggend en schermvullend. De Android-terugknop vraagt eerst "wil je stoppen?".

## 3D en lichte modus

- **3D:** Getallen-spring en Lightstick-dozen zijn echte 3D-spellen (three.js). three.js wordt pas geladen als zo'n spel opent. Heeft een apparaat geen WebGL of verliest het de tekening, dan krijgt Lana vanzelf de platte 2D-versie.
- **Soepel op elke tablet:** bij de eerste keer starten meet de app hoe vlot hij draait. Is de tablet traag (onder 42 beeldjes per seconde), dan gaat de **lichte modus** aan: minder schaduwen, filters en confetti. De 3D-scherpte zakt ook vanzelf als het stottert. In de ouderhoek kun je de lichte modus op Automatisch, Altijd aan of Altijd uit zetten.

## Online zetten op Cloudflare (Worker)

De app draait als **Cloudflare Worker met Static Assets** (`wrangler.jsonc`). Dat is gratis en kan ook de vele stem-bestandjes aan.

**Eenmalig instellen:**
1. **API-token maken:** Cloudflare-dashboard → profiel (rechtsboven) → **API Tokens** → **Create Token** → sjabloon **Edit Cloudflare Workers** → *Use template* → kies je account → **Create Token**. Kopieer het token.
2. **Account-ID:** Cloudflare-dashboard → **Workers & Pages**. Het *Account ID* staat rechts in de zijbalk.
3. **Toegang geven** (in een Claude-cloudomgeving, via het omgevingsmenu in de titelbalk → *Bewerken*):
   - omgevingsvariabelen `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID` (niet in de chat plakken),
   - bij *Netwerktoegang* de domeinen `api.cloudflare.com` en `workers.dev` toestaan (vinkje *package managers* aan laten).
   - Daarna een nieuwe sessie starten.

**Uitrollen:**

```bash
npm run deploy
```

De app staat op **https://lanas-gouden-missie.exl999.workers.dev**. Lokaal kan dit ook: `npx wrangler login` en dan `npm run deploy`.

## Wereldtour en kleedkamer (fase 4)

- **Wereldtour:** 6 steden (Seoel, Tokio, Amsterdam, Parijs, New York, de Gouden Finale). In elke stad speelt Lana bij Rumi, Mira en Zoey (elk spel telt mee voor de sterren van die heldin in die stad). Daarna komt de **baas-demon** met 5 hartjes: gemengde sommen en flitswoorden. Is hij weggezongen, dan gaat de volgende stad open.
- **Kleedkamer:** Lana maakt haar eigen figuur, het vierde lid van de groep, in dezelfde stijl als de heldinnen: kapsel, haarkleur, outfit, accessoire, podiumlicht, huid- en oogkleur. Eerst passen, dan kopen met gouden noten. Haar figuur staat op het startscherm, de tourkaart, in het baas-gevecht en bij de beloning.
- **Aanmoedigingen:** ruim 60 verschillende zinnen (veel met Lana's naam, en eigen zinnetjes per heldin), via een "zakje": een zin komt pas terug als de andere geweest zijn.
- **Beweging:** glitter bij elke tik, heldinnen die een rondje draaien bij een goed antwoord, zwevende knoppen, vallende sterren, een levende tourkaart.

## Op de Samsung-tablet zetten

1. Open het adres in **Chrome** op de tablet.
2. Menu (⋮) → **App installeren** of **Toevoegen aan startscherm**.
3. Open de app via het icoon (gouden schild). Hij draait schermvullend en werkt ook zonder internet.
4. Tip: zet "Niet storen" aan, en gebruik **app vastzetten** (Instellingen → Beveiliging → Overige → App vastzetten) zodat Lana in de app blijft.

## De stem

Alle vaste teksten (instructies, complimenten, flitswoorden, verhaaltjes en de getallen 0 tot 100) zijn ingesproken met **ElevenLabs**, stem **Roos**: een jonge, vrolijke Nederlandse stem. De bestanden staan in `public/audio/tts/` en werken ook offline. Ook de verhaaltjessommen: die komen uit een vaste verzameling van 72 (24 per niveau, `content/verhaaltjessommen.json`), zodat alles vooraf is ingesproken en de tabletstem niet meer nodig is. Een test bewaakt dat elke gesproken som en elk verhaaltje een bestand heeft. Nieuwe verzameling maken: `npm run verhaalsommen` en dan `npm run audio`.

- **Tempo:** instructies op 1,0, zinnen en getallen op 0,95, losse woorden op 0,9 (instelbaar in `content/stem.json`; verhoog daar `versie` als je het tempo wijzigt). De app knipt de stilte aan begin en eind van elk fragment weg, zodat de stukjes van een som direct op elkaar aansluiten. **Volume:** elke opname staat op dezelfde luidheid (-16 LUFS, met ffmpeg). Het stemscript doet dit automatisch bij nieuwe opnames; bestaande opnames gelijk trekken: `npm run audio:volume`.
- **Modellen:** `eleven_multilingual_v2` voor zinnen, `eleven_flash_v2_5` met Nederlands afgedwongen voor losse woorden, en voor getallen en plus/min/is het model uit `nederlandsAfdwingen` met Nederlands afgedwongen (een los woord als "dertig" klonk anders soms Engels). Getallen opnieuw inspreken: `npm run audio -- --getallen`.
- **Verbruik:** alles inspreken kost ongeveer 5.000 credits.
- **Andere stem kiezen:** in de ouderhoek staan proefstemmen (Roos, Ruth, Emma, Melanie). Zet de id van de gekozen stem in `content/stem.json` en draai `npm run audio`.

**Opnieuw inspreken** (bijv. na nieuwe woorden of verhalen):
1. Eenmalig per computer: `npx -y @elevenlabs/cli@latest onboard init` (logt in en zet de sleutel in `.env.local`).
2. `npm run audio:proef` laat zien hoeveel tekens het kost (gratis).
3. `npm run audio` spreekt alleen de nieuwe teksten in. Na een tempowijziging: `npm run audio -- --opnieuw`.
4. Overige opties: `npm run audio -- --stemmen` (Nederlandse vrouwenstemmen zoeken) en `npm run audio -- --proef` (proefstemmen maken).

Google Cloud TTS en Azure worden nog steeds ondersteund via `provider` in `content/stem.json`.

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
npm run deploy     # bouwen en uitrollen naar Cloudflare
```

Techniek: Vite, Svelte 5 en TypeScript, als PWA (vite-plugin-pwa). Voortgang wordt bewaard in IndexedDB op de tablet. De tekeningen zijn eigen SVG's en de geluidseffecten worden gemaakt met de Web Audio API.

De figuren zijn eigen tekeningen, geïnspireerd op de film. Er worden geen officiële afbeeldingen of muziek gebruikt. Deze site is bedoeld voor privégebruik.
