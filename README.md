# TAFSE

Nettsiden til Taffelakademiet for Samvær og Etegilder.

## Hva ligger hvor

| Fil | Innhold |
| --- | --- |
| `index.html` | Forsiden |
| `kalender.html` | Alle møtedatoer |
| `vedtekter.html` | Vedtektene (§ 1–12) |
| `salongen.html` | Salongen: poster, bilder, svar og skåler (krever innlogging) |
| `forslag.html` | Innsending av vedtektsforslag (krever innlogging) |
| `medlemmer.html` | Brødrene, med egne presentasjoner og bytte av passord |
| `moter.html`, `mote.html` | Møtene, med bilder og kommentarer (krever innlogging) |
| `fortellingen.html` | Nettversjonen av lanseringspresentasjonen |
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

## Brukere og innlogging

Hver bror velger navnet sitt og lager sitt eget passord første gang, med akademipassordet som
nøkkel. Etter det logger man inn med navn og eget passord. Navnet settes automatisk på poster,
bilder og forslag, og man kan bare slette sitt eget.

**Glemt passord?** Gå til D1-databasen `tafse` i Cloudflare › Console og kjør
`DELETE FROM brukere WHERE navn = 'Navnet';`. Da kan vedkommende lage bruker på nytt.
Innhold de har skrevet blir liggende.

**Nytt medlem?** Legg navnet til i `medlemmer` i `data/moter.json`.

## Personvern

Forside, kalender, vedtekter, fortellingen og navnelisten over brødrene er åpne for alle.
Salongen, bilder, forslag og presentasjoner krever innlogging.
Bytter dere akademipassordet, blir alle logget ut og må logge inn på nytt med sitt eget passord.
