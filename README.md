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
| `gjester.html` | Administratorens oversikt over gjestene på spillsiden: hvem som har sjekket inn, lenke for nytt passord, og «Fjern helt», som også sletter alt gjesten har gjort i spillene (listen over tabeller står i `FJERN_GJEST` i API-et) Administratoren kan også gi en gjest nytt navn («Endre navn»): navnet byttes overalt i spillene, og gjesten logger inn med det nye navnet og samme passord |
| `nyttpassord.html` | Nytt passord fra en lenke som administratoren lager på `invitasjoner.html` (under «Glemt passord?»). Lenken virker i tre dager og bare til passordet er byttet |
| `invitasjoner.html` | Oversikt over invitasjonslenker (kun administratorer) |
| `moter.html`, `mote.html` | Møtene: kommende og avholdte møter, kalenderfil, og egen side per møte med bilder og poster |
| `fortellingen.html` | Nettversjonen av lanseringspresentasjonen |
| `spill.html`, `assets/spill.js` | Spillet Idus Martiae, med tavle for brødrene |
| `symposion.html`, `assets/symposion.js`, `lib/symposion.js` | Spillet Symposion, den felles byen. Regler og serverlogikk ligger i `lib/symposion.js`: bygg, råvarer (oliven, vin, marmor, honning, sølv, og purpur og krydder fra toktene), ansatte, havn og felles byggverk. Alle tall står i `REGLER` øverst i fila. Kartet kan zoomes og dras (`assets/symposion.js`) |
| `lib/hotellokonomi.js` | Hotellets økonomi: denarer, leie fra rommet, salg til baren og avtaler som virker på godset i Symposion. Alle tall står i `OKONOMI` øverst i fila. Vises under «Kontoret» i hotellet (`assets/hotell.js`) |
| `hotell.html`, `assets/hotell.js`, `lib/hotell.js` | Tafse Hotell: rom der brødrene styrer hver sin figur og prater. Hver bror har et eget rom som vokser med villaen i Symposion og innredes fra butikken: møbler, veggpynt, tepper, trofeer, gulv- og veggstiler, klær og kjæledyr. Katalogen, prisene og kravene til trofeene ligger i `lib/hotell.js`, tegningene i `assets/hotell.js` |
| `lib/hotellsosialt.js` | Det sosiale i Tafse Hotell: profilkort med respekt og merker, hvisking, gaver, gjestebok, terning, jukeboks, skattejakt (en kiste hver halvtime) og «Gi en slibrig kommentar» (14 oliven, replikkene står i `SLIBRIGE`) |
| `lib/auditoriet.js` | Auditoriet i Tafse Hotell: Professor Sokrates Lund, som øver disputas med den som står på talerstolen. Hvem han er (en professor som er interessert i forskning, Kurt Nilsen og rørleggerfaget) står i `INSTRUKS`, og oppsettet ved OsloMet, UiO og Aix-Marseille i `LAERESTEDER`. Bruker Cloudflare Workers AI (se oppsett, punkt 7) |
| `lib/innboks.js` | Innboksen på spillsiden: private meldinger mellom spillerne og hvem som er på hotellet nå. Vinduet ligger i `assets/app.js` |
| `lib/hotellbytte.js` | Møbelbytte mellom to gjester på hotellet, og stjernene gjestene gir rommene |
| `lib/premier.js` | Premiene fra spillene, som brukes i Tafse Hotell: hvilken premie hvert spill gir, hvor mange poeng som gir én premie, og lommeboka som samler oliven, vin og marmor (Symposion), drakmer (Tartaros), gnister (Kaos) og resten |
| `tartaros.html`, `assets/tartaros.js`, `lib/tartaros.js` | Spillet Tartaros: overlev ti minutter i underverdenen. To baner: Tartaros og den vanskeligere Flegeton (ildelven), som åpnes etter fem minutter i Tartaros. Våpen, fiender, baner (`BANER`) og tall ligger øverst i `assets/tartaros.js`, drakmer, gunst og tavle i `lib/tartaros.js` |
| `kaos.html`, `assets/kaos.js`, `assets/kaos-motor.js`, `lib/kaos.js` | Spillet Kaos: en sandkasse med stoffer som faller, renner, brenner og reagerer (i slekt med Powder Game). Stoffene, reaksjonene, oppdagelsene (`FUNN`) og dagens oppdrag (`MALER`) ligger i `assets/kaos-motor.js`, siden rundt i `assets/kaos.js`, og gnister, tavle og galleri i `lib/kaos.js` (tallene står i `REGLER`). Se eget avsnitt under |
| `scripts/kaos-test.mjs` | Tester for Kaos-motoren: fysikken, oppdagelsene og at dagens oppdrag lar seg løse. Kjør `node scripts/kaos-test.mjs` |
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
Den som åpner lenken, velger navn og passord og kan spille Tartaros, Kaos, Symposion, Idus Martiae, 2048, Murbrekker,
Tetris, Snake og Tafse Hotell. I Symposion har ingen fast tomt: man får plass på øya når man flytter inn. Gjester får også eget rom i Tafse Hotell, på lik linje med brødrene. Gjester står på tavlene som «Navn (gjest)». De har egen tabell (`gjester`) og egen
innloggingskapsel, og serveren avviser dem overalt ellers. Hvilke spill de slipper inn i, styres av
`GJESTESPILL` i `functions/api/` og `assets/app.js`. Administratorer ser og fjerner gjester under Invitasjoner. Innloggede gjester ser bare spillhallen i menyen, og sendes til `gjest.html` hvis de åpner andre sider.

## Kaos

Kaos er en sandkasse på 200 × 150 celler. Hver celle har ett stoff, og stoffene er pulver, væske, gass eller faste.

- **Sandkassa:** man begynner med elleve stoffer og fire redskaper. Resten låses opp første gang stoffet oppstår på
  ens eget brett (sand truffet av lynet blir glass, og så videre). Oppdagelsesboka viser et hint for hvert stoff
  man mangler, og hvem som fant det først. Sluk, Kilde og Midasstøv låses opp ved 5, 10 og 18 oppdagelser (`LAASER`).
  Brettet lagres i nettleseren, oppdagelsene på serveren.
- **Dagens oppdrag:** alle får det samme brettet, laget av datoen. Fem maler går på rundgang: Brenn flåten, Akvedukten,
  Zevs' vrede, Vesuv våkner og Trojas murer. Færrest brukte korn vinner. Grensene for to og tre stjerner (`par`) settes
  i hver mal. Et nytt oppdrag lages som en funksjon i `assets/kaos-motor.js` og legges til i `MALER`.
- **Galleriet:** et brett kan deles med tittel. Andre kan åpne det og gi én stjerne hver. Oppdagelser teller ikke mens
  man ser på andres verk. Man kan slette sine egne verk, og administratorer kan slette alle.
- **Gnister:** 10 per oppdagelse (15 ekstra til den første), 15, 25 eller 40 for dagens oppdrag etter stjernene,
  3 ekstra per dag på rad (opptil 21), og 5 for hver stjerne man får i galleriet.

Nye stoffer legges til med `stoff(...)` øverst i `assets/kaos-motor.js`, reaksjoner med `regel(a, b, a blir, b blir, sjanse)`.
Skal stoffet kunne oppdages, må nøkkelen også inn i `FUNN` begge steder (`assets/kaos-motor.js` og `lib/kaos.js`).

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
- **Hovedsiden** sender alltid spillene og spillhallen videre til spillsiden (https://tafsespill.pages.dev,
  eller adressen i variabelen `SPILLSIDE` hvis den er satt).
- Innloggingen følger med mellom sidene med en billett (`/api/billett`) som gjelder i ett minutt.

Oppsett av spillsiden i Cloudflare:

1. Workers & Pages › Create › Pages › koble til `andrlill/Tafse`, prosjektnavn `tafsespill`, ingen byggekommando, utdatamappe `/`.
2. I det nye prosjektet › Settings: koble D1-databasen som `DB` (den samme som hovedsiden), Workers AI som `AI`,
   legg inn hemmeligheten `TAFSE_PASSORD` (samme verdi som hovedsiden) og variabelen `NETTSTED` = `spill`.
   Har hovedsiden `PROFESSOR_MODELL`, legg den inn her også. Bygg på nytt.
3. Får sidene andre adresser enn tafse.pages.dev og tafsespill.pages.dev, legg adressene inn som `SPILLSIDE` i hovedsidens
   prosjekt og `HOVEDSIDE` i spillsidens prosjekt.

## Personvern og tilgang

Hele nettstedet er stengt for alle som ikke er innlogget som bror. Porten ligger i
`functions/_middleware.js` og gjelder alle sider og filer, også vedtektene, forsiden og `data/`.
Andre (gjester og ukjente) slipper bare inn i spillhallen (`gjest.html` og spillene i `GJESTESPILL`),
og sendes dit fra alt annet. Brødre og gjester logger inn i samme skjema i spillhallen; er navnet en
bror, havner man på forsiden. Invitasjonslenkene til nye brødre (`velkommen.html`) og lenkene for nytt passord (`nyttpassord.html`) er åpne.
