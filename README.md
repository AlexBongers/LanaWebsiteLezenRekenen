# Lana's Gouden Missie ✨

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
- Het niveau past zich vanzelf aan: boven 85% goed gaat het een stapje moeilijker, onder 60% een stapje makkelijker.
- Een fout antwoord geeft eerst een hint. Bij een tweede fout wordt het antwoord rustig uitgelegd en komt de opgave later terug.
- **Ouderhoek:** houd het slotje linksboven 3 seconden vast en reken de keersom uit. Hier vind je het overzicht, kun je het niveau zelf zetten, de stem kiezen en een back-up maken.
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

De app staat dan op `https://lanas-gouden-missie.<jouw-subdomein>.workers.dev`. Lokaal kan dit ook: `npx wrangler login` en dan `npm run deploy`.

## Op de Samsung-tablet zetten

1. Open het adres in **Chrome** op de tablet.
2. Menu (⋮) → **App installeren** of **Toevoegen aan startscherm**.
3. Open de app via het icoon (gouden schild). Hij draait schermvullend en werkt ook zonder internet.
4. Tip: zet "Niet storen" aan, en gebruik **app vastzetten** (Instellingen → Beveiliging → Overige → App vastzetten) zodat Lana in de app blijft.

## De stem

Tot de stemgenerator is gebruikt, spreekt de **tablet zelf** (kies de mooiste stem in de ouderhoek). Het script `npm run audio` ondersteunt drie diensten; kies in `content/stem.json` bij `provider`:

| Dienst | Kwaliteit Nederlands | Gratis per maand | Opmerking |
|---|---|---|---|
| **Google Cloud TTS** (Chirp 3 HD), aanbevolen | Zeer natuurlijk, echte Nederlandse stemmen | 1 miljoen tekens | Factureringsaccount (creditcard) nodig. Bereikbaar vanuit de Claude-omgeving zonder extra netwerkinstelling. |
| ElevenLabs | Meest expressief | 10.000 tekens | Geen creditcard. Losse woorden klinken soms minder Nederlands. |
| Microsoft Azure | Zeer goed (Fenna, Colette) | 500.000 tekens | Azure-account met creditcard. |

Dit project gebruikt ongeveer 5.600 tekens.

**Google-sleutel maken:**
1. <https://console.cloud.google.com> → nieuw project `gouden-missie`.
2. ☰ → **Facturering** → factureringsaccount koppelen (tip: stel een budget van €1 met e-mailmelding in).
3. Zet de [Cloud Text-to-Speech API](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com) aan (**Inschakelen**).
4. ☰ → **API's en services** → **Inloggegevens** → **Inloggegevens maken** → **API-sleutel**. Beperk de sleutel tot *Cloud Text-to-Speech API*.
5. Zet hem als omgevingsvariabele `GOOGLE_TTS_API_KEY` (of in `.env`, zie `.env.example`).

**Inspreken:**
1. `npm run audio -- --proef` maakt proefstemmen. Laat Lana kiezen in Ouderhoek → Stem.
2. Zet de gekozen stem in `content/stem.json` bij `stem`.
3. `npm run audio` spreekt alles in. Daarna `npm run deploy`.

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
npm run deploy     # bouwen en uitrollen naar Cloudflare
```

Techniek: Vite, Svelte 5 en TypeScript, als PWA (vite-plugin-pwa). Voortgang wordt bewaard in IndexedDB op de tablet. De tekeningen zijn eigen SVG's en de geluidseffecten worden gemaakt met de Web Audio API.

De figuren zijn eigen tekeningen, geïnspireerd op de film. Er worden geen officiële afbeeldingen of muziek gebruikt. Deze site is bedoeld voor privégebruik.
