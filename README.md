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
| `velkommen.html` | Registrering fra den personlige invitasjonslenken |
| `invitasjoner.html` | Oversikt over invitasjonslenker (kun administratorer) |
| `moter.html`, `mote.html` | Møtene: kommende og avholdte møter, kalenderfil, og egen side per møte med bilder og poster |
| `fortellingen.html` | Nettversjonen av lanseringspresentasjonen |
| `spill.html`, `assets/spill.js` | Spillet Idus Martiae, med tavle for brødrene |
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

## Saker til behandling

Alle kan melde inn saker. En ny sak knyttes automatisk til det første møtet som er minst én uke frem i
tid (§ 6 nr. 2). Brødrene kan stemme for, mot eller avstå og kommentere. Stemmene er veiledende;
saken avgjøres på Tafsemøtet. Tafsemesterne for neste møte og administratorer registrerer utfallet
(vedtatt eller forkastet). Den som meldte inn saken, kan trekke den.

## Personvern

Forside, kalender, vedtekter, fortellingen og navnelisten over brødrene er åpne for alle.
Salongen, bilder, profilbilder, saker og presentasjoner krever innlogging.
