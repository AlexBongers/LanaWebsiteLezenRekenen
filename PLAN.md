# Plan: Lana's Gouden Missie

Een tablet-website waarop Lana (7 jaar) spelenderwijs beter leert **lezen** en **rekenen**, met de drie demon hunters uit *KPop Demon Hunters* (de groep van het nummer "Golden") als rode draad.

Dit document is de bouwopzet: concept, didactiek, spellen, techniek, en een bouwvolgorde in fases. Het is zo geschreven dat iemand (of Claude) het daarna stap voor stap kan bouwen.

---

## 1. Uitgangspunten

| Punt | Keuze |
|---|---|
| Speler | Lana, 7 jaar (augustus 2019). Waarschijnlijk groep 4, misschien eind groep 3 (zomerkind). De moeilijkheid past zich daarom zelf aan. |
| Apparaat | Tablet, liggend (landscape), alleen aanraken. Werkt ook op laptop. |
| Sessieduur | 10 tot 15 minuten per keer. Daarna een natuurlijk eindpunt ("het concert is voorbij!"). |
| Taal | Nederlands, alle instructies ook **hardop** (ze hoeft de instructie niet zelf te kunnen lezen). |
| Toon | Stoer, vrolijk, muziek en glitter. Nooit straffend: fouten zijn "bijna!", niet "fout". |
| Privé | Alleen voor eigen gebruik. Geen account, geen tracking, geen reclame. Voortgang blijft op de tablet. |

### Over de personages en het auteursrecht

De film en het nummer zijn van Sony/Netflix. Omdat dit een privésite voor je dochter is:

- **Geen** officiële plaatjes, filmfragmenten of het echte nummer in de site stoppen. Dat voorkomt problemen als de site ooit openbaar wordt, en het houdt de site licht.
- **Wel**: eigen getekende versies in dezelfde sfeer (drie meiden, haarkleuren, outfits, microfoons, zwaarden, paars-goud schild). Die maken we als simpele SVG-tekeningen. Leuk alternatief: laat Lana ze zelf tekenen, scan of fotografeer ze, en gebruik háár tekeningen in de site. Dan is het echt haar site.
- De voornamen van de drie meiden (Rumi, Mira, Zoey) kunnen we in een privéversie gebruiken. Wordt de site ooit openbaar, dan vervangen we ze door eigen namen. Daarom staan alle namen op één plek in de code (`content/characters.json`).
- Muziek: eigen korte deuntjes en geluidseffecten (zelf gemaakt of rechtenvrij). Het echte "Golden" kan ze als beloning thuis luisteren, buiten de site om.

---

## 2. Het concept (verhaal)

**Lana is het vierde lid van de groep.** De demonen proberen het gouden schild boven de stad te breken. Elke keer dat Lana een opdracht goed doet, zingt de groep een noot en wordt het schild sterker.

- **Wereldkaart = tourkaart.** Een kaart met concertzalen (Seoel, Amsterdam, Tokio, …). Elke zaal is een level. Een zaal "uitspelen" geeft een gouden ster en opent de volgende.
- **Gouden noten** zijn de munten. Die verdient ze met opdrachten.
- **Kleedkamer**: met gouden noten koopt ze outfits, microfoons, stickers en podiumlichten voor haar eigen figuur (het vierde lid) en voor de drie meiden. Dit is de belangrijkste motivator: alleen cosmetisch, nooit nodig om verder te komen.
- **Demonen** zijn grappig en een beetje sukkelig, niet eng. Bij een goed antwoord worden ze weggezongen (poef, glitter).
- **Het schild** is een voortgangsbalk die zichtbaar groeit tijdens een sessie. Vol = concert gewonnen = einde sessie.

### Elke heldin heeft een eigen vak

| Heldin | Rol in de groep | Vak in de site | Wereld |
|---|---|---|---|
| **Rumi** | leider, zangeres | **Lezen**: letters, klanken, woorden | Het Klankpodium |
| **Mira** | danseres, sterk | **Rekenen**: getallen, plussen, minnen | De Danszaal van de Getallen |
| **Zoey** | rapper, schrijft de teksten | **Woorden en zinnen**: rijmen, zinnen begrijpen, verhaaltjes | De Songtekst-studio |

Zo kiest Lana zelf "met wie" ze gaat oefenen. Dat geeft haar regie. De ouder kan in het ouderscherm wel instellen dat er bijvoorbeeld eerst gelezen moet worden.

---

## 3. Didactiek

### 3.1 Lezen (Rumi en Zoey)

Opgebouwd langs de route die Nederlandse scholen volgen (methodes als *Veilig Leren Lezen*, en de AVI-niveaus). Startniveau en tempo stem je af op wat de juf zegt; dat is de eerste open vraag (zie §10).

| Niveau | Inhoud | Ongeveer |
|---|---|---|
| L1 | Letters en klanken: klank horen, letter kiezen en andersom. Ook de lastige: `aa/a`, `ee/e`, `oo/o`, `uu/u`, `ie`, `oe`, `eu`, `ui`, `ei/ij`, `au/ou`, `ch/g`, `ng`, `nk`, `sch` | groep 3, start |
| L2 | Klankzuivere korte woorden: mk / km / mkm (`ik`, `maan`, `vis`, `roos`) | groep 3 |
| L3 | Woorden met clusters: mmkm / mkmm (`stoel`, `hond`, `straat`, `sterk`) | groep 3, eind |
| L4 | Langere woorden en lettergrepen (`zin-gen`, `pa-pier`), woorden met `-en`, `-je`, `-tje` | AVI M3 / E3 |
| L5 | Zinnen lezen en begrijpen: korte zin, plaatje kiezen | AVI E3 / M4 |
| L6 | Mini-verhaaltjes (3 tot 6 zinnen) over de groep, met een begripsvraag | AVI M4 / E4 |

Vaste principes:

- **Eerst horen, dan zien, dan zelf doen.** Elk woord kan ze laten voorlezen door op een luidsprekerknop te tikken.
- **Verklanken en samenvoegen** (`m-aa-n` wordt `maan`) is een eigen spelvorm, want dat is precies waar beginnende lezers vastlopen.
- **Flitslezen** (woord kort tonen) pas vanaf L3, en alleen als ze dat niveau goed beheerst. Dat traint vlot lezen (AVI gaat ook over tempo).
- Woordenlijsten staan in losse bestanden, zodat je ze makkelijk kunt aanvullen met woorden van school.

### 3.2 Rekenen (Mira)

| Niveau | Inhoud | Ongeveer |
|---|---|---|
| R1 | Tellen en hoeveelheden tot 20, getalbeelden (dobbelsteen, vingers, rekenrek) | groep 3 |
| R2 | Splitsen tot 10 ("verliefde harten": 3 + ? = 10) | groep 3 |
| R3 | Plus en min tot 10, daarna tot 20 (eerst zonder, dan met tientaloverschrijding) | groep 3 / 4 |
| R4 | Getallen tot 100: tientallen en eenheden, getallenlijn, ervoor/erna | groep 4 |
| R5 | Plus en min tot 100 (eerst met hele tientallen: 30 + 20, dan 34 + 5, dan 34 + 25) | groep 4 |
| R6 | Begin tafels: 1, 2, 5 en 10, als sprongen op de getallenlijn | groep 4 |
| R7 | Extra werelden: klokkijken (hele en halve uren), geld (munten en briefjes tot € 20) | groep 4 |

Vaste principes:

- **Altijd een plaatje of model erbij** op lagere niveaus (rekenrek met 10 + 10 kralen, getallenlijn, groepjes). Het model verdwijnt geleidelijk.
- **Hulpknop** laat het model weer zien in plaats van het antwoord te geven.
- Sommen in verhaaltjes: "Mira heeft 8 lightsticks, Zoey geeft er 5 bij…"

### 3.3 Hoe de site zich aanpast

- **Adaptief niveau per vaardigheid.** Na ongeveer 8 tot 10 opgaven bekijkt de site hoe het ging. Meer dan 85% goed: een stapje moeilijker. Minder dan 60% goed: een stapje makkelijker. Daartussen: blijven.
- **Herhaling op maat.** Letters, woordjes en rekenfeiten die ze fout had, komen vaker terug (eenvoudig "Leitner-doossysteem": goed betekent later terugzien, fout betekent snel terugzien).
- **Mix in een sessie:** ongeveer 70% op haar niveau, 20% herhaling van wat al goed gaat (succeservaring), 10% een stapje erboven (uitdaging).
- **Foutaanpak:** eerste fout krijgt een hint (klank opnieuw, model laten zien). Tweede fout: het goede antwoord wordt rustig getoond en uitgesproken, en die opgave komt later in de sessie terug.
- **Geen tijdsdruk** standaard. Snelheidsspellen (flitslezen, "tafel-ritme") zijn optioneel en alleen voor dingen die ze al beheerst.

---

## 4. De spellen (spelvormen)

Elke spelvorm is een herbruikbaar component dat met verschillende inhoud gevuld wordt. Zo krijg je met ongeveer 10 spelvormen honderden opdrachten.

### Lezen

| # | Spelvorm | Mechaniek (tablet) | Niveaus |
|---|---|---|---|
| 1 | **Klank-vangen** | Rumi zingt een klank, demonen dragen letters. Tik de demon met de goede letter. | L1 |
| 2 | **Woord-bouwer** | Plaatje en uitgesproken woord. Sleep lettertegels in de goede volgorde op de microfoonstandaard. | L2 tot L4 |
| 3 | **Klank-smelten** | Rumi zingt `v - i - s` los. Kies het goede plaatje uit 3. | L2, L3 |
| 4 | **Woord bij plaatje** | Woord staat er (niet voorgelezen!). Tik het juiste plaatje uit 3 of 4. | L2 tot L4 |
| 5 | **Flits-podium** | Woord verschijnt kort in de spotlight. Kies het woord dat je zag uit 3 lijkende woorden (`maan`, `man`, `maak`). | L3 tot L5 |
| 6 | **Rijm-rap** (Zoey) | Zoey rapt een woord. Welk woord rijmt erop? | L2 tot L4 |
| 7 | **Zinnen-show** | Lees een zin, kies het plaatje dat erbij past. Later: sleep woorden tot een goede zin. | L5 |
| 8 | **Songtekst-verhaal** | Kort verhaaltje over de groep, daarna 1 of 2 vragen. Elke zin kan voorgelezen worden, maar kost dan geen noot extra. | L6 |

### Rekenen

| # | Spelvorm | Mechaniek (tablet) | Niveaus |
|---|---|---|---|
| 9 | **Lightstick-tellen** | Publiek zwaait lightsticks (in groepjes van 5). Hoeveel? Tik het getal. | R1 |
| 10 | **Verliefde harten** | Mira heeft 3 lichtjes, hoeveel erbij om 10 te maken? Rekenrek erbij. | R2 |
| 11 | **Dans-sommen** | Som verschijnt, demonen dragen antwoorden. Tik/zing de goede weg. | R3, R5 |
| 12 | **Getallen-spring** | Mira springt over een getallenlijn. Sleep haar naar het juiste getal, of maak sprongen van 2, 5 of 10. | R4, R6 |
| 13 | **Tientallen-kleedkamer** | Bouw een getal met dozen van 10 lightsticks en losse lightsticks. | R4 |
| 14 | **Merch-winkel** | Betaal een T-shirt van € 7 met munten. | R7 |
| 15 | **Hoe laat is het concert?** | Zet de wijzers van een klok goed of kies de juiste tijd. | R7 |

### Speciaal: de baas-demon

Aan het eind van elke concertzaal komt een **baas-demon**: 5 gemengde opdrachten achter elkaar uit die zaal. Lukt dat (4 van 5 goed), dan krijgt ze de gouden ster. Lukt het niet, dan "komt de demon morgen terug". Geen verlies van noten.

---

## 5. Schermen en navigatie

```
Startscherm  ("Tik om te beginnen" - nodig om geluid aan te zetten op tablets)
   │
   ├── Kies je heldin  (Rumi / Mira / Zoey, groot, met animatie)
   │      └── Tourkaart van die wereld (concertzalen als levels)
   │             └── Level: 8 tot 10 opdrachten, schild-balk bovenin
   │                    └── Beloningsscherm (noten, ster, demon verslagen)
   │
   ├── Kleedkamer (outfits, stickers kopen en aantrekken)
   │
   └── Ouderhoek  (achter een "ouder-slot": houd een knop 3 seconden vast
                   en reken een som als 7 x 8 uit)
```

### Ontwerpregels voor de tablet

- Knoppen en sleepbare tegels minimaal **64 x 64 pixels**, ruim uit elkaar.
- Liggende stand. Bij staand houden: een vriendelijk "draai je tablet" scherm.
- Slepen én tikken moeten allebei werken (tik tegel, tik plek), want slepen is voor sommige kinderen lastig.
- Geen tekst die ze moet lezen om de site te bedienen: iconen en gesproken instructie.
- Groot, duidelijk lettertype met kinder-vriendelijke vormen (bijv. **Andika** of **Lexend** via Google Fonts, met een "a" en "g" zoals op school). Leesteksten minimaal 32 px.
- Hoog contrast voor leesteksten (donker op licht), ook al is de rest van de site paars, roze en goud.
- Geen pop-ups, geen links naar buiten, geen per ongeluk wegtikken (bevestiging bij "terug naar kaart").

---

## 6. Geluid en stem

Geluid is cruciaal: een 7-jarige moet de instructie kunnen horen.

| Optie | Voordeel | Nadeel |
|---|---|---|
| **A. Ingesproken door jou** (aanbevolen voor klanken en instructies) | Klinkt warm, uitspraak van klanken precies zoals op school (`mmm`, niet `em`). Lana vindt het leuk dat papa/mama in de site zit. | Opnamewerk: ongeveer 40 klanken en 30 vaste zinnen. |
| **B. Computerstem** (Web Speech API, `nl-NL`) | Gratis, elk woord meteen beschikbaar. | Kwaliteit verschilt per tablet. Klanken los uitspreken lukt slecht. |
| **C. Vooraf gegenereerde stem** (een tekst-naar-spraak dienst, opgeslagen als mp3) | Goede kwaliteit, consequent. | Eenmalig genereren, bestanden groter. |

**Advies:** combineer A en C. Losse klanken en vaste zinnen ("Goed zo!", "Welke letter hoor je?") neem jij op. Woorden en zinnen worden vooraf gegenereerd en als mp3 bewaard, met B als noodoplossing als een bestand ontbreekt.

Verder: korte geluidseffecten (glitter, demon-poef, applaus), en een rustig, eigen achtergrondloopje dat aan/uit kan. Achtergrondmuziek staat zachter of uit tijdens het luisteren naar klanken.

---

## 7. Techniek

### 7.1 Keuzes

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Soort app | **Statische website als PWA** (installeerbaar op het beginscherm, werkt offline) | Geen server nodig, opent als een app, werkt ook in de auto. |
| Bouwtool | **Vite + TypeScript** | Snel, simpel, goede foutmeldingen. |
| UI | **Svelte** (of zonder framework) | Weinig code, makkelijke animaties, klein bestand. |
| Tekeningen | **SVG** (personages, demonen, decor) | Scherp op elke tablet, klein, makkelijk te animeren en van kleur te wisselen. |
| Animatie | CSS-animaties, eventueel `canvas-confetti` voor feestjes | Licht en vloeiend. |
| Geluid | Web Audio API (via een kleine wrapper of **Howler.js**) | Werkt het best op iPad Safari. |
| Opslag voortgang | `localStorage` (of IndexedDB) op de tablet | Geen account nodig, privé. Export/import-knop in de ouderhoek als back-up. |
| Inhoud | JSON-bestanden in `content/` | Woordenlijsten aanpassen zonder code te snappen. |
| Hosting | **GitHub Pages**, **Cloudflare Pages** of **Netlify** (gratis) | Push naar GitHub, site staat online. Met `noindex` zodat hij niet in Google verschijnt. |
| Testen | Vitest voor de logica (sommen, niveau-aanpassing), Playwright voor een paar schermtests op tabletformaat | Zekerheid dat de leer-logica klopt. |

Let op bij hosting: GitHub Pages vanuit een **privé** repository kan alleen met een betaald GitHub-account. Cloudflare Pages en Netlify kunnen dat gratis.

### 7.2 Mappenstructuur

```
/
├── index.html
├── public/
│   ├── manifest.webmanifest       PWA: naam, icoon, liggende stand
│   ├── icons/
│   └── audio/
│       ├── klanken/               aa.mp3, m.mp3, sch.mp3 ...
│       ├── woorden/               maan.mp3, vis.mp3 ...
│       ├── zinnen/                instructies en complimenten
│       └── sfx/                   glitter.mp3, poef.mp3, applaus.mp3
├── content/
│   ├── characters.json            namen, kleuren, vak per heldin
│   ├── lezen/
│   │   ├── klanken.json           alle klanken + audiobestand
│   │   ├── woorden-L2.json        { woord, plaatje, klanken[], afleiders[] }
│   │   ├── woorden-L3.json
│   │   ├── zinnen-L5.json
│   │   └── verhalen-L6.json
│   ├── rekenen/
│   │   └── niveaus.json           per niveau: bereik, soort som, model
│   ├── wereld/
│   │   └── tour.json              concertzalen, volgorde, welke spelvormen
│   └── kleedkamer.json            items en prijzen
└── src/
    ├── main.ts
    ├── app/                       router, schermen (Start, Heldin, Kaart, Level, Beloning, Kleedkamer, Ouderhoek)
    ├── games/                     één map per spelvorm (KlankVangen, WoordBouwer, DansSommen ...)
    ├── engine/
    │   ├── generator-rekenen.ts   maakt sommen per niveau
    │   ├── generator-lezen.ts     kiest woorden en afleiders
    │   ├── adaptief.ts            niveau omhoog/omlaag
    │   ├── herhaling.ts           Leitner-doosjes
    │   └── sessie.ts              mix 70/20/10, sessieduur, schild-balk
    ├── ui/                        knoppen, tegels, sleep-logica, schild-balk, luidsprekerknop
    ├── art/                       SVG-componenten van de personages en demonen
    ├── audio/                     afspelen, voorladen, ontgrendelen bij eerste tik
    └── store/                     voortgang opslaan, export/import
```

### 7.3 Datamodel (voortgang)

```ts
type Voortgang = {
  speler: { naam: "Lana"; avatar: AvatarKeuzes };
  noten: number;                         // munten
  gekocht: string[];                     // kleedkamer-items
  sterren: Record<ZaalId, boolean>;      // uitgespeelde concertzalen
  vaardigheden: Record<VaardigheidId, {  // bijv. "lezen.mkm", "rekenen.plus-tot-20"
    niveau: number;
    recent: boolean[];                   // laatste 10 antwoorden goed/fout
  }>;
  herhaling: Record<ItemId, {            // bijv. "klank.eu", "som.7+5"
    doos: 1 | 2 | 3 | 4 | 5;
    volgendeKeer: number;                // datum
  }>;
  sessies: { datum: string; minuten: number; goed: number; fout: number; vaardigheden: string[] }[];
  instellingen: OuderInstellingen;
};
```

### 7.4 Valkuilen op tablets (meteen goed doen)

- **iPad Safari speelt pas geluid af na een eerste tik.** Daarom het startscherm "Tik om te beginnen".
- Dubbeltik-zoom en "trekken om te verversen" uitzetten (`touch-action: manipulation`, `overscroll-behavior: none`).
- Schermhoogte: `100dvh` gebruiken, niet `100vh`.
- Slepen met **Pointer Events** (werkt voor vinger, pen en muis).
- Lang indrukken mag geen tekst selecteren of menu openen (`user-select: none`, `-webkit-touch-callout: none`).
- Audio en plaatjes van het volgende level vooraf laden, zodat er geen wachttijd is.
- Na installatie als PWA: werkt offline via een service worker (Vite PWA-plugin).

---

## 8. Ouderhoek

Achter het ouder-slot:

- **Overzicht**: hoeveel minuten per dag geoefend, wat gaat goed, wat is lastig (bijv. "verwisselt vaak `ei` en `ui`", "plus met tientaloverschrijding: 55% goed").
- **Instellingen**:
  - startniveau per vak (zodat het aansluit op school)
  - welke werelden open staan
  - sessieduur (10, 15 of 20 minuten)
  - computerstem aan/uit, muziek aan/uit
  - "eerst lezen, dan pas kiezen"
- **Eigen woorden toevoegen**: de woordjes van school van deze week typen. De site maakt er automatisch Woord-bouwer en Flits-podium opdrachten van (met computerstem voor de uitspraak).
- **Back-up**: voortgang exporteren als bestand en terugzetten (bijv. naar een nieuwe tablet).

---

## 9. Bouwvolgorde (fases)

Elke fase levert iets op wat Lana al kan spelen. Zo krijg je snel feedback van de belangrijkste tester.

### Fase 0: Fundament (½ tot 1 dag)
- Vite + TypeScript + Svelte project, PWA-instellingen, hosting, `noindex`.
- Startscherm met audio-ontgrendeling, liggende stand, tablet-CSS-basis.
- Opslag-module met export/import.
- **Klaar als:** de lege app op de tablet aan het beginscherm toegevoegd kan worden en offline opent.

### Fase 1: Eerste speelbare versie (MVP) (2 tot 4 dagen)
- Drie heldinnen als eenvoudige SVG, heldin-keuzescherm.
- **Mira: Dans-sommen** (R3, plus en min tot 20) met som-generator.
- **Rumi: Woord-bouwer** (L2, mkm-woorden) met 30 woorden + plaatjes (emoji of eenvoudige SVG's mogen voor de start).
- Schild-balk, gouden noten, beloningsscherm met confetti.
- Gesproken instructies (eerst computerstem).
- **Klaar als:** Lana zelfstandig 10 minuten kan spelen zonder hulp bij de bediening.
- **Testmoment met Lana:** begrijpt ze wat ze moet doen? Wat vindt ze het leukst? Te makkelijk/moeilijk?

### Fase 2: Leren dat zich aanpast (2 tot 3 dagen)
- Adaptief niveau, herhalingsdoosjes, sessie-mix 70/20/10, sessie-einde.
- Ouderhoek met overzicht en startniveau-instelling.
- Unit-tests voor generators en adaptief systeem.

### Fase 3: Meer spellen (doorlopend, 1 spelvorm per 0,5 tot 1 dag)
- Lezen: Klank-vangen, Klank-smelten, Woord bij plaatje, Rijm-rap (Zoey).
- Rekenen: Lightstick-tellen, Verliefde harten, Getallen-spring, Tientallen-kleedkamer.
- Ingesproken klanken en vaste zinnen (opnamesessie).

### Fase 4: Tourkaart en kleedkamer (2 tot 3 dagen)
- Concertzalen als levels, baas-demonen, sterren.
- Kleedkamer met 20 tot 30 items om te verdienen.
- Eigen figuur (vierde groepslid) samenstellen.

### Fase 5: Verdieping (later)
- Zinnen-show, Songtekst-verhalen (L5, L6), Flits-podium.
- Tafels (R6), klok en geld (R7).
- Eigen woorden van school toevoegen via de ouderhoek.
- Lana's eigen tekeningen in de site verwerken.

---

## 10. Open vragen (graag invullen voor het bouwen)

1. **Groep en niveau:** zit Lana in groep 3 of 4? Welk AVI-niveau heeft ze nu (staat op het rapport)? Waar loopt ze vast: letters, woorden samenvoegen, of tempo?
2. **Leesmethode school:** welke methode gebruikt de school (bijv. *Veilig Leren Lezen*, *Lijn 3*)? Dan nemen we dezelfde volgorde van letters en dezelfde schrijfletter.
3. **Rekenen:** rekent ze al tot 20 of tot 100? Gebruikt de school een rekenrek, getallenlijn, of iets anders?
4. **Tablet:** iPad of Android? Welke versie ongeveer?
5. **Stem:** wil jij (een deel van) de klanken en zinnen inspreken?
6. **Tekeningen:** zelf (laten) tekenen door Lana, of eenvoudige SVG-figuren die wij maken?
7. **Naam van de site:** "Lana's Gouden Missie" is een werktitel. Misschien wil Lana zelf een naam (en een groepsnaam voor haar figuur) kiezen.
8. **Hosting:** mag de site online staan (met onvindbaar adres), of alleen lokaal op de tablet?

---

## 11. Waarom dit werkt (samengevat)

- **Motivatie komt uit haar eigen fandom**: ze speelt met haar helden, niet met "oefeningen".
- **Korte sessies met een duidelijk eind**: geen eindeloos scrollen, wel elke dag een beetje.
- **Precies op haar niveau** dankzij aanpassing en herhaling, met veel succeservaringen.
- **Gesproken instructies**: ze kan alles zelfstandig, ook als lezen nog moeilijk is.
- **Aansluiting op school**: dezelfde opbouw, eigen woordjes van school toe te voegen.
- **Veilig en privé**: geen reclame, geen accounts, geen links naar buiten.
