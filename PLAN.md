# Plan: Lana's Gouden Missie

Een tablet-website waarop Lana (7 jaar, groep 4) spelenderwijs beter leert **lezen** en **rekenen**, met de drie demon hunters uit *KPop Demon Hunters* (de groep van het nummer "Golden") als rode draad.

> **Stand van zaken:** (3D-spellen met three.js, lichte modus voor trage tablets) fase 0, 1, 2 en 3 zijn gebouwd (fase 3: acht nieuwe spellen, een spelmenu per heldin en een leestempo-grafiek) (fase 2: auditie, adaptief niveau, herhalingsdoosjes, mix 70/20/10, pauze en overzicht in de ouderhoek) (zie [README.md](README.md)). De drie spellen werken, er is basis-niveau-aanpassing (deel van fase 2) en een eerste ouderhoek. Het stemscript voor Azure is klaar; zodra er een sleutel is, wordt de mooie stem ingesproken. Tot die tijd spreekt de tablet zelf.

Dit document is de bouwopzet: concept, didactiek, spellen, stem, techniek, en een bouwvolgorde in fases. Het is zo geschreven dat iemand (of Claude) het daarna stap voor stap kan bouwen.

---

## 1. Uitgangspunten

| Punt | Keuze |
|---|---|
| Speler | Lana, 7 jaar (augustus 2019), **groep 4**, leest op **AVI-niveau 4** (M4). |
| School | WereldKidz De Bongerd, groep 3/4 combinatie. De schoolsite kon tijdens het plannen niet worden geopend, dus de gebruikte methodes zijn nog niet bekend. Daarom is de lesstof in te stellen in de ouderhoek (zie §8). |
| Apparaat | **Samsung Android-tablet, 11 inch**, in Chrome, liggend (landscape), aanraken (en eventueel S Pen). |
| Sessieduur | 10 tot 15 minuten per keer, met een duidelijk einde ("het concert is voorbij!"). |
| Taal en stem | Nederlands. Alle instructies, woorden, zinnen en verhaaltjes worden **voorgelezen door een natuurlijke vrouwenstem** uit een stemgenerator (zie §6). Geen eigen opnames. |
| Toon | Stoer, vrolijk, muziek en glitter. Nooit straffend: fouten zijn "bijna!", niet "fout". |
| Privé | Alleen voor eigen gebruik. Geen account, geen tracking, geen reclame. Voortgang blijft op de tablet. |

### Over de personages en het auteursrecht

De film en het nummer zijn van Sony/Netflix. Omdat dit een privésite voor je dochter is:

- **Geen** officiële plaatjes, filmfragmenten of het echte nummer in de site. Dat voorkomt problemen als de site ooit openbaar wordt, en het houdt de site licht.
- **Wel** eigen getekende versies in dezelfde sfeer: drie meiden met hun herkenbare haar en outfits, microfoons, zwaarden, een paars-gouden schild. Die maken we als simpele SVG-tekeningen. Optie: Lana tekent ze zelf en die tekeningen komen in de site.
- De voornamen (Rumi, Mira, Zoey) staan op één plek in de code (`content/characters.json`), zodat ze makkelijk te vervangen zijn als de site ooit openbaar wordt.
- Muziek: eigen korte deuntjes en rechtenvrije geluidseffecten. Het echte "Golden" kan ze als beloning thuis luisteren, buiten de site om.

---

## 2. Het concept (verhaal)

**Lana is het vierde lid van de groep.** De demonen proberen het gouden schild boven de stad te breken. Elke keer dat Lana een opdracht goed doet, zingt de groep een noot en wordt het schild sterker.

- **Tourkaart.** Een kaart met concertzalen (Seoel, Amsterdam, Tokio, …). Elke zaal is een level. Een zaal uitspelen geeft een gouden ster en opent de volgende.
- **Gouden noten** zijn de munten. Die verdient ze met opdrachten.
- **Kleedkamer**: met gouden noten koopt ze outfits, microfoons, stickers en podiumlichten voor haar eigen figuur en voor de drie meiden. Alleen cosmetisch, nooit nodig om verder te komen.
- **Demonen** zijn grappig en een beetje sukkelig, niet eng. Bij een goed antwoord worden ze weggezongen (poef, glitter).
- **Het schild** is een voortgangsbalk die tijdens een sessie zichtbaar groeit. Vol = concert gewonnen = einde sessie.

### Elke heldin heeft een eigen vak

| Heldin | Rol in de groep | Vak in de site | Wereld |
|---|---|---|---|
| **Rumi** | leider, zangeres | **Vlot lezen**: woorden snel en goed lezen, leestempo | Het Karaoke-podium |
| **Mira** | danseres, sterk | **Rekenen**: getallen tot 100, plus en min, tafels, klok, geld | De Danszaal van de Getallen |
| **Zoey** | rapper, schrijft de teksten | **Begrijpend lezen en woorden**: zinnen, verhaaltjes, rijmen, moeilijke woorden | De Songtekst-studio |

Lana kiest zelf "met wie" ze gaat oefenen. Dat geeft haar regie. In de ouderhoek kun je wel instellen dat er bijvoorbeeld eerst gelezen moet worden.

---

## 3. Didactiek

### 3.1 Waar staat Lana?

AVI-niveau 4 in november van groep 4 betekent dat ze **op schema of iets voor** ligt. M4 is het niveau dat in januari/februari van groep 4 verwacht wordt. Ze kan dus al lezen. De site richt zich daarom niet op losse letters, maar op:

1. **Vlotter lezen** (tempo en nauwkeurigheid): van M4 naar **E4**, en daarna richting **M5**.
2. **Lastige woordtypes** uit groep 4 snel herkennen.
3. **Begrijpen wat je leest**: zinnen en korte verhaaltjes.

Rekenen sluit aan op de leerlijn van groep 4: getallen tot 100, plus en min tot 100, de eerste tafels, klokkijken en geld.

### 3.2 Lezen (Rumi en Zoey)

| Niveau | Inhoud | AVI |
|---|---|---|
| L1 | **Opwarmniveau.** Korte woorden met lastige klanken die vaak verwisseld worden: `ei/ij`, `au/ou`, `ui/eu`, `ng/nk`, `ch/g`, `aai/ooi/oei`, `eeuw/ieuw` | M3–E3 (herhaling) |
| L2 | **Woorden van groep 4**: clusters (`straat`, `sprong`, `herfst`), `-cht` (`lucht`), `-ig` / `-lijk` (`lastig`, `vrolijk`), `-d` aan het eind (`hond`), verkleinwoorden (`liedje`, `sterretje`) | M4 |
| L3 | **Woorden met 2 en 3 klankgroepen**: open en dichte lettergrepen (`ra-men` / `kam-men`), samenstellingen (`zang-groep`, `licht-stok`) | M4–E4 |
| L4 | **Zinnen vlot lezen** en begrijpen: zinnen van 6 tot 12 woorden, ook met "hij/zij/het" die naar iemand verwijzen | E4 |
| L5 | **Korte verhaaltjes** (60 tot 120 woorden) over de groep, met vragen: wie, wat, waar, waarom, wat gebeurt er hierna? | E4–M5 |
| L6 | **Langere verhaaltjes** (120 tot 200 woorden) in 2 of 3 delen, met moeilijkere vragen (wat betekent dit woord hier, waarom doet Mira dat?) | M5 |

Vaste principes:

- **Zelf lezen eerst, dan pas hulp.** Bij leesopdrachten wordt de tekst niet meteen voorgelezen. Er is een luidsprekerknop als hulp. Bij begripsvragen mag de vraag zelf wel voorgelezen worden.
- **Herhaald lezen** is de best onderbouwde manier om vlotter te lezen: dezelfde tekst een paar keer lezen, steeds sneller. Dat zit in het Karaoke-spel (zie §4).
- **Flitslezen** (woord kort tonen, kiezen uit woorden die erop lijken) traint snelle woordherkenning.
- **Eigen woordjes van school** kun je toevoegen in de ouderhoek (zie §8). De stem wordt dan automatisch aangemaakt.

### 3.3 Rekenen (Mira)

| Niveau | Inhoud | Ongeveer |
|---|---|---|
| R1 | **Opwarmniveau.** Plus en min tot 20, ook over het tiental (`8 + 5`, `13 − 6`), splitsen tot 10 en 20 | groep 3 (herhaling) |
| R2 | **Getallen tot 100**: tientallen en eenheden, getallenlijn, honderdveld, ervoor/erna, groter/kleiner | groep 4 begin |
| R3 | **Plus en min tot 100 zonder overschrijding**: eerst hele tientallen (`30 + 40`), dan `34 + 5`, dan `34 + 25` | groep 4 |
| R4 | **Plus en min tot 100 met overschrijding**: `47 + 8` (via 50), `52 − 7` (via 50), daarna `38 + 27` | groep 4 midden/eind |
| R5 | **Tafels**: eerst groepjes en sprongen (herhaald optellen), dan tafels van 1, 2, 5 en 10, daarna 3 en 4. Ook eerlijk verdelen als eerste stap naar delen | groep 4 |
| R6 | **Klokkijken**: hele en halve uren, daarna kwartier over en voor; analoog en digitaal | groep 4 |
| R7 | **Geld**: munten en briefjes tot € 100, betalen en wisselgeld (eerst tot € 20) | groep 4 |

Vaste principes:

- **Een plaatje of model erbij** waar dat helpt (getallenlijn, honderdveld, dozen van 10 lightsticks). Het model verdwijnt geleidelijk naarmate het beter gaat.
- **Hulpknop** laat het model of een tussenstap zien ("eerst naar 50"), niet het antwoord.
- **Verhaaltjessommen** die ze zelf leest, zodat lezen en rekenen samen geoefend worden: "Mira heeft 36 lightsticks. Zoey geeft er 7 bij. Hoeveel heeft Mira nu?"
- **Tafels automatiseren** pas als ze ze snapt: eerst met sprongen op de getallenlijn, daarna pas sneller.

### 3.4 Hoe de site zich aanpast

- **Adaptief niveau per vaardigheid.** Na ongeveer 8 tot 10 opgaven kijkt de site hoe het ging. Meer dan 85% goed: een stapje moeilijker. Minder dan 60% goed: een stapje makkelijker. Daartussen: blijven.
- **Startniveau bepalen.** De eerste keer per wereld doet ze een korte "auditie" van 8 opgaven die oplopen in moeilijkheid. Daarmee bepaalt de site waar ze begint.
- **Herhaling op maat.** Woorden en sommen die ze fout had, komen vaker terug (eenvoudig doosjessysteem: goed = later terugzien, fout = snel terugzien).
- **Mix in een sessie:** ongeveer 70% op haar niveau, 20% herhaling van wat al goed gaat (succeservaring), 10% een stapje erboven (uitdaging).
- **Bij een fout:** eerst een hint (het woord in klankgroepen laten zien, of het model). Tweede fout: het goede antwoord wordt rustig getoond en voorgelezen, en die opgave komt later in de sessie terug.
- **Geen tijdsdruk** standaard. Tempospellen (Flits-podium, Karaoke, Tafel-ritme) meten wel de snelheid, maar laten alleen zien dat ze **sneller wordt dan zichzelf**, nooit een klok die afloopt.

---

## 4. De spellen (spelvormen)

Elke spelvorm is een herbruikbaar onderdeel dat met verschillende inhoud gevuld wordt. Zo krijg je met ongeveer 14 spelvormen honderden opdrachten.

### Lezen

| # | Spelvorm | Mechaniek (tablet) | Niveaus |
|---|---|---|---|
| 1 | **Karaoke-podium** (Rumi) | Een "songtekst" (zinnen of een kort verhaaltje) verschijnt regel voor regel, zoals bij karaoke. Ronde 1: de stem leest voor en de woorden lichten op. Ronde 2 en 3: Lana leest zelf hardop en tikt op "volgende regel". De site meet haar tijd en laat zien dat ze steeds sneller wordt ("je was 12 seconden sneller!"). | L3–L6 |
| 2 | **Flits-podium** (Rumi) | Een woord verschijnt kort in de spotlight. Kies het woord dat je zag uit 3 woorden die erop lijken (`lucht` / `licht` / `lacht`). De flitstijd past zich aan. | L1–L3 |
| 3 | **Woord bij plaatje** (Rumi) | Een woord staat er (niet voorgelezen). Tik het goede plaatje uit 3 of 4. | L1–L3 |
| 4 | **Klankgroepen-zwaard** (Rumi) | Een lang woord staat er. Hak het met het zwaard in klankgroepen (tik tussen de letters: `zang│groep`, `ra│men`). Daarna leest de stem het woord voor ter controle. | L2–L3 |
| 5 | **Rijm-rap** (Zoey) | Zoey rapt een woord. Welke van de geschreven woorden rijmt erop? Lana leest de keuzes zelf. | L1–L3 |
| 6 | **Zinnen-show** (Zoey) | Lees een zin en kies het plaatje dat erbij past. Later: sleep woorden tot een goede zin, of kies welk woord niet in de zin past. | L4 |
| 7 | **Songtekst-verhaal** (Zoey) | Een kort verhaaltje over de groep (door Lana zelf gelezen), daarna 2 tot 4 vragen. Zinnen kunnen als hulp voorgelezen worden. | L5–L6 |
| 8 | **Woordbetekenis** (Zoey) | "Wat betekent *nerveus*?" Kies de goede uitleg of het goede plaatje. Woorden komen uit de verhaaltjes. | L4–L6 |

### Rekenen

| # | Spelvorm | Mechaniek (tablet) | Niveaus |
|---|---|---|---|
| 9 | **Dans-sommen** | Een som verschijnt, demonen dragen mogelijke antwoorden. Tik de goede. Hint: tussenstap op de getallenlijn. | R1, R3, R4 |
| 10 | **Getallen-spring** | Mira springt over een getallenlijn tot 100. Sleep haar naar het goede getal, of maak de som in sprongen (`47 + 8`: eerst +3 naar 50, dan +5). | R2–R5 |
| 11 | **Lightstick-dozen** | Bouw een getal met dozen van 10 lightsticks en losse lightsticks. Later: tellen hoeveel er in een plaatje staan. | R2 |
| 12 | **Tafel-ritme** | Een beat speelt, Mira danst in sprongen (3, 6, 9, …). Tik op de maat het volgende getal, of beantwoord tafelsommen. | R5 |
| 13 | **Merch-winkel** | Betaal een T-shirt van € 23 met munten en briefjes, of bereken het wisselgeld. | R7 |
| 14 | **Hoe laat is het concert?** | Zet de wijzers van een klok goed of kies de juiste tijd (analoog en digitaal). | R6 |

Verhaaltjessommen kunnen in alle rekenspellen voorkomen.

### Speciaal: de baas-demon

Aan het eind van elke concertzaal komt een **baas-demon**: 5 gemengde opdrachten uit die zaal achter elkaar. Lukt dat (4 van 5 goed), dan krijgt ze de gouden ster. Lukt het niet, dan "komt de demon morgen terug". Ze verliest geen noten.

---

## 5. Schermen en navigatie

```
Startscherm  ("Tik om te beginnen" - zet geluid aan en schakelt volledig scherm in)
   │
   ├── Kies je heldin  (Rumi / Mira / Zoey, groot, met animatie)
   │      └── Tourkaart van die wereld (concertzalen als levels)
   │             └── Level: 8 tot 10 opdrachten, schild-balk bovenin
   │                    └── Beloningsscherm (noten, ster, demon verslagen)
   │
   ├── Kleedkamer (outfits, stickers kopen en aantrekken)
   │
   └── Ouderhoek  (achter een "ouder-slot": houd een knop 3 seconden vast
                   en los een som als 7 x 8 op)
```

### Ontwerpregels voor de tablet

- Ontwerpen voor een schermformaat van ongeveer **1280 x 800 CSS-pixels** in liggende stand (een Samsung-tablet van 11 inch). Het moet ook netjes schalen naar andere formaten.
- Knoppen en sleepbare tegels minimaal **64 x 64 pixels**, ruim uit elkaar.
- Liggende stand vastzetten via het manifest. Bij staand houden: een vriendelijk "draai je tablet" scherm.
- Slepen én tikken moeten allebei werken (tik tegel, tik plek).
- Bediening werkt met iconen en gesproken instructies, zodat de leesopdrachten de enige plek zijn waar ze moet lezen.
- Duidelijk lettertype dat lijkt op schoolletters, bijvoorbeeld **Andika** of **Lexend** (Google Fonts). Leesteksten minimaal 28 tot 32 px, ruime regelafstand, korte regels.
- Hoog contrast voor leesteksten (donker op licht), ook al is de rest van de site paars, roze en goud.
- Geen pop-ups, geen links naar buiten, geen per ongeluk wegtikken (bevestiging bij "terug naar kaart").

---

## 6. De stem: een generator met een natuurlijke vrouwenstem

Alle gesproken tekst wordt **vooraf gemaakt** met een stemgenerator en als geluidsbestandjes (mp3) in de site gezet. Zo klinkt de stem altijd hetzelfde en mooi, werkt hij offline, en hoeft de tablet niets naar internet te sturen.

### Keuze van de generator

| Generator | Stem (Nederlands, vrouw) | Oordeel |
|---|---|---|
| **Microsoft Azure AI Speech** (aanbevolen) | **Fenna** (`nl-NL-FennaNeural`) of **Colette** (`nl-NL-ColetteNeural`) | Natuurlijke Nederlandse stemmen. Via SSML in te stellen: rustiger tempo, vrolijke toon, nadruk, pauzes. Er is een gratis laag die voor dit project waarschijnlijk ruim genoeg is. |
| **ElevenLabs** (alternatief) | Een vrouwenstem uit de stemmenbibliotheek, met het meertalige model | Klinkt het meest levendig en expressief, mooi voor verhaaltjes. Betaald zodra je meer tekst maakt dan de kleine gratis laag. Uitspraak van losse Nederlandse woorden soms minder precies. |
| **Google Cloud Text-to-Speech** (alternatief) | De nieuwste Nederlandse vrouwenstemmen (`nl-NL`) | Ook goed. Vergelijkbaar met Azure. |

**Advies:** bouw de generator **uitwisselbaar** (één klein script met een "provider"-instelling) en begin met **Azure, stem Fenna**. Laat Lana bij de start 3 of 4 proefstemmen horen en kies samen. De stem die zij het leukst vindt, wordt "de stem van de groep".

Prijzen en gratis lagen veranderen. Controleer ze bij het aanmaken van het account.

### Hoe het werkt

1. Alle tekst die uitgesproken moet worden staat in de `content/`-bestanden (instructies, complimenten, woorden, zinnen, verhaaltjes, vragen).
2. Een script `tools/maak-audio.ts` loopt alle tekst langs en vraagt voor elke nieuwe of gewijzigde tekst een mp3 aan bij de generator.
3. Elk bestandje krijgt een naam op basis van de tekst (een "hash"). Ongewijzigde tekst wordt niet opnieuw gemaakt. Dat bespaart geld en tijd.
4. Het script maakt een lijst (`audio-manifest.json`) die de site gebruikt om bij elke tekst het juiste bestandje te vinden.
5. De API-sleutel staat in een `.env`-bestand dat **niet** in GitHub komt.

Geschatte hoeveelheid: ongeveer 1.500 woorden, 300 zinnen en vragen, 40 verhaaltjes en 100 vaste instructies. Samen ongeveer 40.000 tot 60.000 tekens. Dat is weinig voor deze diensten.

### Stem-instellingen

- **Instructies en complimenten**: vrolijke toon, normaal tempo. Meerdere varianten van complimenten ("Goed zo!", "Wauw, wat een stem!", "Het schild wordt sterker!") zodat het niet saai wordt.
- **Woorden voorlezen**: iets langzamer (ongeveer 85% tempo), met een korte pauze ervoor en erna.
- **Karaoke-voorlezen**: natuurlijk tempo, en per woord een tijdstempel, zodat de site het woord kan laten oplichten dat wordt uitgesproken. Azure geeft die tijdstempels mee (word boundaries); die worden opgeslagen naast de mp3.
- **Uitspraakcontrole**: na het genereren een luisterpagina in de ouderhoek (alleen in ontwikkelmodus) om alle bestandjes snel af te luisteren. Foute uitspraak verbeter je met een uitspraakregel in SSML en opnieuw genereren.

### Noodoplossing

Ontbreekt een bestandje (bijvoorbeeld bij een net toegevoegd eigen woord zonder internet), dan gebruikt de site de ingebouwde stem van de tablet (Web Speech API, `nl-NL`, vrouwenstem als die er is). Op een Samsung met Google-spraakservices is die redelijk.

Eigen woorden uit de ouderhoek: als er internet is, kan de site die via een kleine serverfunctie (bijv. een Cloudflare Worker die de API-sleutel veilig bewaart) direct laten inspreken door dezelfde stem en op de tablet bewaren. Dat is een uitbreiding voor fase 5. Tot die tijd gebruikt de site de tabletstem voor eigen woorden.

### Overig geluid

Korte geluidseffecten (glitter, demon-poef, applaus, een "ting" bij een goed antwoord) en een eigen rustig achtergrondloopje dat aan en uit kan. Muziek staat zachter (of uit) zodra de stem iets zegt.

---

## 7. Techniek

### 7.1 Keuzes

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Soort app | **Statische website als PWA** (installeerbaar op het startscherm van de Samsung, opent schermvullend, werkt offline) | Geen server nodig, voelt als een app. |
| Browser | **Chrome** op de tablet (daarmee installeren via "Toevoegen aan startscherm" / "App installeren") | Beste ondersteuning voor PWA, geluid en volledig scherm. Samsung Internet werkt ook, maar is minder getest. |
| Bouwtool | **Vite + TypeScript** | Snel, simpel, goede foutmeldingen. |
| UI | **Svelte** | Weinig code, makkelijke animaties, klein bestand. |
| Tekeningen | **SVG** (personages, demonen, decor) | Scherp op het scherm, klein, makkelijk te animeren en van kleur te wisselen. |
| Animatie | CSS-animaties, `canvas-confetti` voor feestjes | Licht en vloeiend. |
| Geluid | **Howler.js** (of een kleine eigen Web Audio-wrapper) | Betrouwbaar voorladen en afspelen, ook offline. |
| Stem | Vooraf gemaakte mp3's via Azure AI Speech (zie §6) | Mooie, vaste stem, offline. |
| Opslag voortgang | **IndexedDB** (via een klein hulpje zoals `idb-keyval`) op de tablet | Geen account nodig, privé, ruimer dan localStorage. Export/import-knop in de ouderhoek als back-up. |
| Inhoud | JSON-bestanden in `content/` | Woordenlijsten en verhaaltjes aanpassen zonder code te snappen. |
| Hosting | **Cloudflare Pages** of **Netlify** (gratis, ook vanuit een privé GitHub-repository), of GitHub Pages als de repository openbaar is | Push naar GitHub, site staat online. Met `noindex` zodat hij niet in Google verschijnt. |
| Testen | Vitest voor de logica (somgenerator, niveau-aanpassing, herhaling), Playwright voor schermtests op 1280 x 800 met touch | Zekerheid dat de leerlogica klopt. |

### 7.2 Mappenstructuur

```
/
├── index.html
├── .env.example                   AZURE_SPEECH_KEY=..., AZURE_SPEECH_REGION=westeurope
├── public/
│   ├── manifest.webmanifest       PWA: naam, icoon, "display": "fullscreen", "orientation": "landscape"
│   ├── icons/
│   └── audio/
│       ├── tts/                   gegenereerde mp3's (naam = hash van de tekst) + woord-tijdstempels
│       ├── audio-manifest.json    tekst → bestand
│       └── sfx/                   glitter.mp3, poef.mp3, applaus.mp3, achtergrondloop.mp3
├── content/
│   ├── characters.json            namen, kleuren, vak per heldin
│   ├── stem.json                  provider, stemnaam, tempo per soort tekst
│   ├── teksten.json               instructies en complimenten
│   ├── lezen/
│   │   ├── woorden-L1.json        { woord, plaatje, categorie, lijktOp[] }
│   │   ├── woorden-L2.json
│   │   ├── woorden-L3.json        + klankgroepen: ["zang", "groep"]
│   │   ├── zinnen-L4.json
│   │   ├── verhalen-L5.json       { titel, regels[], vragen[] }
│   │   └── verhalen-L6.json
│   ├── rekenen/
│   │   └── niveaus.json           per niveau: bereik, soort som, model, hints
│   ├── wereld/
│   │   └── tour.json              concertzalen, volgorde, welke spelvormen
│   └── kleedkamer.json            items en prijzen
├── tools/
│   ├── maak-audio.ts              genereert ontbrekende mp3's via de stemgenerator
│   └── controleer-inhoud.ts       controleert JSON (ontbrekende plaatjes, dubbele woorden)
└── src/
    ├── main.ts
    ├── app/                       router, schermen (Start, Heldin, Kaart, Level, Beloning, Kleedkamer, Ouderhoek)
    ├── games/                     één map per spelvorm (Karaoke, FlitsPodium, DansSommen, GetallenSpring ...)
    ├── engine/
    │   ├── generator-rekenen.ts   maakt sommen per niveau
    │   ├── generator-lezen.ts     kiest woorden en lijkende afleiders
    │   ├── adaptief.ts            niveau omhoog/omlaag, auditie
    │   ├── herhaling.ts           doosjessysteem
    │   ├── tempo.ts               leestijd per regel/woord bijhouden
    │   └── sessie.ts              mix 70/20/10, sessieduur, schild-balk
    ├── ui/                        knoppen, tegels, sleep-logica, schild-balk, luidsprekerknop
    ├── art/                       SVG-componenten van de personages en demonen
    ├── audio/                     afspelen, voorladen, noodstem, ontgrendelen bij eerste tik
    └── store/                     voortgang opslaan, export/import
```

### 7.3 Datamodel (voortgang)

```ts
type Voortgang = {
  speler: { naam: "Lana"; avatar: AvatarKeuzes };
  noten: number;                         // munten
  gekocht: string[];                     // kleedkamer-items
  sterren: Record<ZaalId, boolean>;      // uitgespeelde concertzalen
  vaardigheden: Record<VaardigheidId, {  // bijv. "lezen.ei-ij", "rekenen.plus-tot-100-over"
    niveau: number;
    recent: boolean[];                   // laatste 10 antwoorden goed/fout
  }>;
  herhaling: Record<ItemId, {            // bijv. "woord.lucht", "som.47+8"
    doos: 1 | 2 | 3 | 4 | 5;
    volgendeKeer: number;                // datum
  }>;
  leestempo: { datum: string; tekstId: string; ronde: number; seconden: number; woorden: number }[];
  sessies: { datum: string; minuten: number; goed: number; fout: number; vaardigheden: string[] }[];
  eigenWoorden: { woord: string; toegevoegd: string }[];
  instellingen: OuderInstellingen;
};
```

### 7.4 Aandachtspunten voor Android en Chrome (meteen goed doen)

- **Geluid speelt pas na een eerste tik.** Daarom het startscherm "Tik om te beginnen". Die tik zet ook volledig scherm aan.
- **Scherm aan houden** tijdens een sessie met de Screen Wake Lock API, zodat het scherm niet uitgaat tijdens het lezen.
- **Terugknop van Android** opvangen: die moet terug naar de kaart gaan (met bevestiging), niet de app sluiten.
- Dubbeltik-zoom en "trekken om te verversen" uitzetten (`touch-action: manipulation`, `overscroll-behavior: none`).
- Schermhoogte: `100dvh` gebruiken, niet `100vh`.
- Slepen met **Pointer Events** (werkt voor vinger, S Pen en muis).
- Lang indrukken mag geen tekst selecteren of menu openen (`user-select: none`).
- Geluid en plaatjes van het volgende level vooraf laden, zodat er geen wachttijd is.
- Offline werken via een service worker (Vite PWA-plugin). Alle mp3's van de gekozen wereld worden bij eerste gebruik opgeslagen.
- Tip voor ouders: zet de tablet tijdens het spelen op "Niet storen" en gebruik eventueel **Samsung Kids** of **app vastzetten** (scherm vastpinnen) zodat Lana in de app blijft.

---

## 8. Ouderhoek

Achter het ouder-slot:

- **Overzicht**: minuten per dag, wat gaat goed, wat is lastig (bijv. "verwisselt vaak `ei` en `ij`", "min met overschrijding: 55% goed").
- **Leestempo-grafiek**: hoeveel woorden per minuut bij het Karaoke-podium, per week. Zo zie je of ze vlotter gaat lezen.
- **Instellingen**:
  - startniveau per vak (overschrijft de auditie, als je van de juf iets anders hoort)
  - welke onderdelen aan staan (bijv. klok en geld pas later, of tafels 3 en 4 pas als de school eraan begint)
  - sessieduur (10, 15 of 20 minuten)
  - muziek aan/uit, voorleeshulp aan/uit
  - "eerst lezen, dan pas kiezen"
- **Eigen woorden toevoegen**: de woorden of het "woordpakket" van school van deze week typen. De site maakt er automatisch Flits-podium- en Woord-bij-plaatje-opdrachten van.
- **Back-up**: voortgang exporteren als bestand en terugzetten.

---

## 9. Bouwvolgorde (fases)

Elke fase levert iets op wat Lana al kan spelen. Zo krijg je snel feedback van de belangrijkste tester.

### Fase 0: Fundament (½ tot 1 dag)
- Vite + TypeScript + Svelte project, PWA-instellingen (landscape, fullscreen), hosting, `noindex`.
- Startscherm met geluidsontgrendeling, wake lock, Android-terugknop.
- Opslag-module met export/import.
- **Stemscript** `tools/maak-audio.ts` met Azure en een proefpagina met 4 stemmen. **Lana kiest de stem.**
- **Klaar als:** de lege app op de Samsung als app geïnstalleerd kan worden, offline opent, en de gekozen stem "Hoi Lana!" zegt.

### Fase 1: Eerste speelbare versie (2 tot 4 dagen)
- Drie heldinnen als eenvoudige SVG, heldin-keuzescherm.
- **Mira: Dans-sommen** (R1, R3, R4: plus en min tot 100) met somgenerator en hint op de getallenlijn.
- **Rumi: Flits-podium** (L1 en L2) met ongeveer 150 woorden en plaatjes (emoji of eenvoudige SVG's zijn genoeg voor de start).
- **Zoey: Songtekst-verhaal** met 5 verhaaltjes op E4-niveau.
- Schild-balk, gouden noten, beloningsscherm met confetti.
- **Klaar als:** Lana zelfstandig 10 minuten kan spelen zonder hulp bij de bediening.
- **Testmoment met Lana:** snapt ze wat ze moet doen? Wat vindt ze het leukst? Te makkelijk of te moeilijk?

### Fase 2: Leren dat zich aanpast (2 tot 3 dagen)
- Auditie, adaptief niveau, herhalingsdoosjes, sessie-mix 70/20/10, sessie-einde.
- Ouderhoek met overzicht en instellingen.
- Unit-tests voor generators en het adaptieve systeem.

### Fase 3: Meer spellen (1 spelvorm per ½ tot 1 dag)
- Lezen: **Karaoke-podium** (met woord-tijdstempels en tempometing), Klankgroepen-zwaard, Woord bij plaatje, Rijm-rap, Zinnen-show.
- Rekenen: Getallen-spring, Lightstick-dozen, Tafel-ritme.
- Leestempo-grafiek in de ouderhoek.

### Fase 4: Tourkaart en kleedkamer (2 tot 3 dagen)
- Concertzalen als levels, baas-demonen, sterren.
- Kleedkamer met 20 tot 30 items om te verdienen.
- Eigen figuur (vierde groepslid) samenstellen.

### Fase 5: Verdieping (later)
- Langere verhaaltjes (L6), Woordbetekenis.
- Klok (R6) en geld (R7).
- Eigen woorden van school direct laten inspreken door de gekozen stem (via een kleine serverfunctie).
- Lana's eigen tekeningen in de site verwerken.

---

## 10. Antwoorden en nog open vragen

### Beantwoord

| Vraag | Antwoord | Gevolg voor het plan |
|---|---|---|
| Groep en niveau | Groep 4, AVI 4 | Geen letterles meer. Focus op vlot lezen (M4 → E4 → M5), groep 4-woorden, begrijpend lezen, en rekenen tot 100 met tafels. |
| School | WereldKidz De Bongerd | De schoolsite kon niet geopend worden vanaf de bouwomgeving. De lesstof is daarom instelbaar in de ouderhoek. |
| Tablet | Samsung Android, 11 inch | Ontwerp voor 1280 x 800 liggend, Chrome-PWA, Android-terugknop, wake lock, S Pen werkt via Pointer Events. |
| Zelf inspreken | Nee | Alle spraak via een generator met een natuurlijke Nederlandse vrouwenstem (Azure, stem Fenna als start, Lana kiest uit proefstemmen). |

### Nog open (niet nodig om te beginnen, wel handig)

1. **Methodes van school:** welke methode voor technisch lezen, begrijpend lezen, spelling en rekenen? Dit staat meestal in de schoolgids of de informatiebrief van groep 4. Dan stemmen we de woordtypes en de volgorde van rekenstappen daarop af.
2. **AVI M4 of E4?** "AVI 4" kan M4 of E4 zijn. Dat staat op het rapport of in het ouderportaal. De auditie vangt dit ook op.
3. **Waar loopt ze tegenaan?** Tempo, nauwkeurigheid (woorden raden) of begrijpen? En bij rekenen: tafels, of over het tiental rekenen?
4. **Tekeningen:** zelf (laten) tekenen door Lana, of eenvoudige SVG-figuren die wij maken?
5. **Naam van de site:** "Lana's Gouden Missie" is een werktitel. Misschien wil Lana zelf een naam (en een naam voor haar eigen figuur) kiezen.
6. **Stemaccount:** wie maakt het Azure-account aan (gratis laag)? De sleutel is nodig in fase 0.

---

## 11. Waarom dit werkt (samengevat)

- **Motivatie komt uit haar eigen fandom**: ze speelt met haar helden, niet met "oefeningen".
- **Precies op haar niveau**: groep 4 en AVI 4 als start, en daarna past de site zich aan.
- **Vlotter lezen door herhaald lezen**, verpakt als karaoke, met zichtbare vooruitgang ten opzichte van zichzelf.
- **Een mooie, vaste vrouwenstem** die alles uitlegt, zodat ze zelfstandig kan spelen.
- **Korte sessies met een duidelijk einde**: elke dag een beetje, geen eindeloos scrollen.
- **Veilig en privé**: geen reclame, geen accounts, geen links naar buiten.
