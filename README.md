# TAFSE

Nettsiden til Taffelakademiet for Samvær og Etegilder.

## Hva ligger hvor

| Fil | Innhold |
| --- | --- |
| `index.html` | Forsiden |
| `kalender.html` | Videresender til Møtene (slått sammen) |
| `vedtekter.html` | Vedtektene (§ 1–12) |
| `salongen.html` | Salongen: poster, bilder, svar og skåler (krever innlogging) |
| `saker.html` | Saker til behandling: innmelding, veiledende avstemning og kommentarer (krever innlogging) |
| `medlemmer.html` | Brødrene, med profilbilde, presentasjon og bytte av passord |
| `bror.html` | Profilsiden til hver bror: presentasjon, fakta, skår, siste poster og drømmelandet |
| `assets/land-modell.js`, `assets/land-kart.js`, `assets/land-editor.js` | Drømmelandet: fagmodellen (klima, geologi, valgordning, vetospillere, Lijphart, ressursforbannelse), kart og flagg, og veiviseren i åtte steg |
| `gjest.html` | Gjester i spillhallen: brødrenes gjestelenker, registrering og innlogging for gjester |
| `velkommen.html` | Registrering fra den personlige invitasjonslenken |
| `nyttpassord.html` | Nytt passord fra en lenke som administratoren lager på `invitasjoner.html` (under «Glemt passord?»). Lenken virker i tre dager og bare til passordet er byttet |
| `invitasjoner.html` | Oversikt over invitasjonslenker (kun administratorer) |
| `moter.html`, `mote.html` | Møtene: kommende og avholdte møter, kalenderfil, og egen side per møte med bilder og poster |
| `fortellingen.html` | Nettversjonen av lanseringspresentasjonen |
| `spill.html`, `assets/spill.js` | Spillet Idus Martiae, med tavle for brødrene |
| `symposion.html`, `assets/symposion.js`, `lib/symposion.js` | Spillet Symposion, den felles byen. Regler og serverlogikk ligger i `lib/symposion.js` |
| `hotell.html`, `assets/hotell.js`, `lib/hotell.js` | Tafse Hotell: rom der brødrene styrer hver sin figur og prater. Hver bror har et eget rom som vokser med villaen i Symposion og innredes fra butikken: møbler, veggpynt, tepper, trofeer, gulv- og veggstiler, klær og kjæledyr. Katalogen, prisene og kravene til trofeene ligger i `lib/hotell.js`, tegningene i `assets/hotell.js` |
| `lib/hotellsosialt.js` | Det sosiale i Tafse Hotell: profilkort med respekt og merker, hvisking, gaver, gjestebok, terning, jukeboks, skattejakt (en kiste hver halvtime) og «Gi en slibrig kommentar» (14 oliven, replikkene står i `SLIBRIGE`) |
| `lib/auditoriet.js` | Auditoriet i Tafse Hotell: Professor Sokrates Lund, som øver disputas med den som står på talerstolen. Hvem han er (en professor som er interessert i forskning, Kurt Nilsen og rørleggerfaget) står i `INSTRUKS`, og oppsettet ved OsloMet, UiO og Aix-Marseille i `LAERESTEDER`. Bruker Cloudflare Workers AI (se oppsett, punkt 7) |
| `lib/premier.js` | Premiene fra spillene, som brukes i Tafse Hotell: hvilken premie hvert spill gir, hvor mange poeng som gir én premie, og lommeboka som samler oliven, vin og marmor (Symposion), drakmer (Tartaros) og resten |
| `tartaros.html`, `assets/tartaros.js`, `lib/tartaros.js` | Spillet Tartaros: overlev ti minutter i underverdenen. Våpen, fiender og tall ligger øverst i `assets/tartaros.js`, drakmer, gunst og tavle i `lib/tartaros.js` |
| `murbrekker.html`, `assets/murbrekker.js` | Spillet Murbrekker (Breakout), med toppliste for uka og for alle tider |
| `2048.html`, `assets/2048.js` | Spillet 2048, med toppliste for uka og for alle tider |
| `tetris.html`, `assets/tetris.js` | Spillet Tetris, med toppliste for uka og for alle tider |
| `snake.html`, `assets/snake.js` | Spillet Snake, med toppliste for uka og for alle tider |
| `honningfella.html`, `assets/honningfella.js` | Spillet Honningfella (gjemt: ikke i spillmenyen og ikke for gjester, men siden virker). Oppdragene ligger i `data/honningfella/oppdrag.json`, se `data/honningfella/OPPSKRIFT.md` |
| `verden.html`, `data/steder/` | «Hva skjer?»: ukens tilfeldige sted, med arkiv. Se `data/steder/OPPSKRIFT.md` |
| `data/moter.json` | **Møtedatoer, Tafsemestere og medlemsliste. Endre her.** |
| `assets/style.css` | Farger og utseende |
| `functions/api/` | Serverkoden som lagrer forslag, kommentarer og bilder |

## Slik endrer du en møtedato

1. Åpne `data/moter.json` her på GitHub og trykk på blyanten.
2. Endre datoen (format `ÅÅÅÅ-MM-DD`). Er datoen ikke bestemt, skriv `null` og fyll inn `"periode"`.
3. Trykk «Commit changes». Siden oppdateres av seg selv etter et minutt.

## Oppsett i Cloudflare (gjøres én gang)

1. **Koble repoet:** Cloudflare › Workers & Pages › Create › Pages › Connect to Git › velg `Tafse`.
   Build command: *(tom)*. Build output directory: `/`.
2. **Lag databasen:** Workers & Pages › D1 SQL Database › Create › kall den `tafse`.
3. **Koble databasen til siden:** Pages-prosjektet › Settings › Bindings › Add › D1 database.
   Variable name: `DB`, database: `tafse`.
4. **Sett akademipassordet:** Pages-prosjektet › Settings › Variables and Secrets › Add.
   Type: Secret, navn: `TAFSE_PASSORD`, verdi: et felles passord som brødrene bruker
   én gang, når de lager sin egen bruker.
5. **Publiser på nytt:** Deployments › «Retry deployment» på den siste, så bindingene tas i bruk.
6. **Domene:** Pages-prosjektet › Custom domains › legg til `tafse.no` og følg instruksene.
7. **Professoren i auditoriet:** Pages-prosjektet › Settings › Bindings › Add › Workers AI.
   Variable name: `AI`. Publiser på nytt (punkt 5). Gratiskvoten er 10 000 «Neurons» i døgnet,
   og professoren stopper selv etter 500 svar i døgnet. Vil du prøve en annen språkmodell, legg til
   variabelen `PROFESSOR_MODELL` (for eksempel `@cf/zai-org/glm-4.7-flash`) under Variables and Secrets.

Tabellene i databasen lages automatisk første gang noen logger inn.

## Brukere, invitasjoner og innlogging

Administratorer (listet under `administratorer` i `data/moter.json`) finner lenken **Invitasjoner**
nederst på siden når de er logget inn. Der ligger en personlig lenke til hver bror, med knapper for å
kopiere meldingen eller sende den som SMS.

Når en bror åpner lenken sin, må han velge profilbilde, skrive om seg selv og hva TAFSE betyr for
ham, og lage et passord. Det han skriver vises på siden Brødrene. Etter det logger han inn med navn
og eget passord. Navnet settes automatisk på poster, bilder og forslag, og man kan bare slette sitt eget.

Den første administratoren registrerer seg med akademipassordet (`TAFSE_PASSORD`): velg navnet ditt
på innloggingen og trykk «registrer deg med akademipassordet».

**Glemt passord?** Gå til D1-databasen `tafse` i Cloudflare › Console og kjør
`DELETE FROM brukere WHERE navn = 'Navnet';`. Da virker invitasjonslenken igjen.
Profil og innhold blir liggende.

**Nytt medlem?** Legg navnet til i `medlemmer` i `data/moter.json`. Lenken dukker opp under Invitasjoner.

**Bytter dere akademipassordet**, blir alle logget ut og alle gamle invitasjonslenker slutter å virke.

## Gjester i spillhallen

Hver bror har en egen gjestelenke på `gjest.html` (lenken «Inviter en gjest» nederst på spillsidene).
Den som åpner lenken, velger navn og passord og kan spille Symposion, Idus Martiae, 2048, Murbrekker,
Tetris, Snake og Tafse Hotell. I Symposion har ingen fast tomt: man får plass på øya når man flytter inn. Gjester får også eget rom i Tafse Hotell, på lik linje med brødrene. Gjester står på tavlene som «Navn (gjest)». De har egen tabell (`gjester`) og egen
innloggingskapsel, og serveren avviser dem overalt ellers. Hvilke spill de slipper inn i, styres av
`GJESTESPILL` i `functions/api/` og `assets/app.js`. Administratorer ser og fjerner gjester under Invitasjoner. Innloggede gjester ser bare spillhallen i menyen, og sendes til `gjest.html` hvis de åpner andre sider.

## Saker til behandling

Alle kan melde inn saker. En ny sak knyttes automatisk til det første møtet som er minst én uke frem i
tid (§ 6 nr. 2). Brødrene kan stemme for, mot eller avstå og kommentere. Stemmene er veiledende;
saken avgjøres på Tafsemøtet. Tafsemesterne for neste møte og administratorer registrerer utfallet
(vedtatt eller forkastet). Den som meldte inn saken, kan trekke den.

## Varsler

Bjellen i toppmenyen viser varsler til den som er logget inn: svar på egne poster, svar på poster
man har kommentert, skåler, nye saker, stemmer og kommentarer på egne saker, og utfallet av egne saker.
Varslene lages i `functions/api/` (søk etter `varsle(`). Leste varsler eldre enn 90 dager ryddes bort.

## To nettsteder: Tafse og Tafse-spill

Hovedsiden (tafse.pages.dev) og spillsiden (tafsespill.pages.dev) bygges fra den samme koden og
deler den samme D1-databasen, så brukere, passord, poeng, Symposion og hotellet er felles.
Porten i `functions/_middleware.js` bestemmer hva hver side viser:

- **Spillsiden** kjenner seg igjen på variabelen `NETTSTED=spill`. Man må være logget inn (bror eller
  gjest) for å komme inn, og første gang sjekker man inn på hotellet: lager figur og får hus i
  Symposion. Før det slipper man ikke inn i de andre spillene, og man vises ikke for de andre.
  Alt som ikke er spill, sendes til hovedsiden. Siden har eget preg (TAFSE SPILL, turkis ramme).
- **Hovedsiden** sender spillene og spillhallen videre til spillsiden når variabelen `SPILLSIDE`
  (adressen til spillsiden) er satt. Uten den virker alt som før.
- Innloggingen følger med mellom sidene med en billett (`/api/billett`) som gjelder i ett minutt.

Oppsett av spillsiden i Cloudflare:

1. Workers & Pages › Create › Pages › koble til `andrlill/Tafse`, prosjektnavn `tafsespill`, ingen byggekommando, utdatamappe `/`.
2. I det nye prosjektet › Settings: koble D1-databasen som `DB` (den samme som hovedsiden), Workers AI som `AI`,
   legg inn hemmeligheten `TAFSE_PASSORD` (samme verdi som hovedsiden) og variabelen `NETTSTED` = `spill`.
   Har hovedsiden `PROFESSOR_MODELL`, legg den inn her også. Bygg på nytt.
3. Når spillsiden virker: legg til variabelen `SPILLSIDE` = `https://tafsespill.pages.dev` i hovedsidens prosjekt, og bygg hovedsiden på nytt.
   Har spillsiden fått en annen adresse, legg også `HOVEDSIDE` = `https://tafse.pages.dev` inn i spillsidens prosjekt.

## Personvern og tilgang

Hele nettstedet er stengt for alle som ikke er innlogget som bror. Porten ligger i
`functions/_middleware.js` og gjelder alle sider og filer, også vedtektene, forsiden og `data/`.
Andre (gjester og ukjente) slipper bare inn i spillhallen (`gjest.html` og spillene i `GJESTESPILL`),
og sendes dit fra alt annet. Brødre og gjester logger inn i samme skjema i spillhallen; er navnet en
bror, havner man på forsiden. Invitasjonslenkene til nye brødre (`velkommen.html`) og lenkene for nytt passord (`nyttpassord.html`) er åpne.
