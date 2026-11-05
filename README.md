# Lana's Gouden Missie ✨

**Spelen:** https://lanas-gouden-missie.exl999.workers.dev (op de tablet installeren: zie hieronder)

Een tablet-app (website) waarmee Lana spelenderwijs beter leert **lezen** en **rekenen**, samen met de drie demon hunters. Zie [PLAN.md](PLAN.md) voor het volledige plan.

## Wat zit er nu in (fase 0 en 1)

| Heldin | Spel | Wat oefent het |
|---|---|---|
| **Rumi** | Flits-podium | Een woord flitst in de spotlight; welk woord zag je? Lastige klanken (ei/ij, au/ou, ng/nk …) en woorden van groep 4. De flitstijd wordt vanzelf korter als het goed gaat. |
| **Mira** | Dans-sommen | Plus en min tot 20 en tot 100, met en zonder overschrijding, soms als verhaaltjessom. Bij een fout verschijnt een getallenlijn met sprongen (47 → 50 → 55). |
| **Zoey** | Songtekst-verhaal | Een verhaaltje op AVI E4-niveau zelf lezen (tik op een zin voor hulp), daarna 3 vragen. |

Verder:
- Gouden noten die naar de teller vliegen, een gouden schild dat groeit, "3 op rij!"-combo's, sterren en confetti.
- Een tekstballon bij de heldin laat zien wat de stem zegt, zodat Lana kan meelezen.
- **Auditie:** de eerste keer bij Mira en Rumi 8 opgaven die steeds moeilijker worden. Daarmee kiest de site het startniveau.
- Het niveau past zich vanzelf aan: na 8 opgaven op haar niveau gaat het bij meer dan 85% goed een stapje moeilijker, onder 60% een stapje makkelijker.
- **Mix per concert:** ongeveer 70% op haar niveau, 20% iets makkelijker (altijd beginnen met een opwarmer) en 10% een uitdaging.
- **Herhalingsdoosjes:** wat niet meteen goed ging, komt het volgende concert terug, en daarna na 1, 3, 7 en 14 dagen tot het gekend is.
- **Pauze:** na 10, 15 of 20 minuten (instelbaar) eindigt het na het lopende concert met een pauzescherm.
- Een fout antwoord geeft eerst een hint. Bij een tweede fout wordt het antwoord rustig uitgelegd en komt de opgave later terug.
- **Ouderhoek:** houd het slotje linksboven 3 seconden vast en reken de keersom uit. Hier vind je het overzicht (welke sommen lastig zijn, welke woorden ze verwisselt, wat er in de doosjes zit), kun je het niveau zelf zetten, de stem kiezen en een back-up maken.
- Werkt offline, als app op het startscherm, liggend en schermvullend. De Android-terugknop vraagt eerst "wil je stoppen?".

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

## Op de Samsung-tablet zetten

1. Open het adres in **Chrome** op de tablet.
2. Menu (⋮) → **App installeren** of **Toevoegen aan startscherm**.
3. Open de app via het icoon (gouden schild). Hij draait schermvullend en werkt ook zonder internet.
4. Tip: zet "Niet storen" aan, en gebruik **app vastzetten** (Instellingen → Beveiliging → Overige → App vastzetten) zodat Lana in de app blijft.

## De stem

Alle vaste teksten (instructies, complimenten, flitswoorden, verhaaltjes en de getallen 0 tot 100) zijn ingesproken met **ElevenLabs**, stem **Roos**: een jonge, vrolijke Nederlandse stem. De bestanden staan in `public/audio/tts/` en werken ook offline. Ook de verhaaltjessommen: die komen uit een vaste verzameling van 72 (24 per niveau, `content/verhaaltjessommen.json`), zodat alles vooraf is ingesproken en de tabletstem niet meer nodig is. Een test bewaakt dat elke gesproken som en elk verhaaltje een bestand heeft. Nieuwe verzameling maken: `npm run verhaalsommen` en dan `npm run audio`.

- **Vlot tempo:** instructies op 1,15, zinnen op 1,05 en getallen op 1,1 (instelbaar in `content/stem.json`). De app knipt bovendien de stilte aan begin en eind van elk fragment weg, zodat de stukjes van een som direct op elkaar aansluiten.
- **Modellen:** `eleven_multilingual_v2` voor zinnen (ondersteunt tempo), `eleven_flash_v2_5` met Nederlands afgedwongen voor losse woorden en getallen.
- **Verbruik:** alles inspreken kostte ongeveer 4.500 credits.
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
