# TAFSE

Nettsiden til Taffelakademiet for Samvær og Etegilder.

## Hva ligger hvor

| Fil | Innhold |
| --- | --- |
| `index.html` | Forsiden |
| `kalender.html` | Alle møtedatoer |
| `vedtekter.html` | Vedtektene (§ 1–12) |
| `forslag.html` | Innsending av vedtektsforslag (krever passord) |
| `moter.html`, `mote.html` | Møtene, med bilder og kommentarer (krever passord) |
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
4. **Sett passordet:** Pages-prosjektet › Settings › Variables and Secrets › Add.
   Type: Secret, navn: `TAFSE_PASSORD`, verdi: passordet brødrene skal bruke.
5. **Publiser på nytt:** Deployments › «Retry deployment» på den siste, så bindingene tas i bruk.
6. **Domene:** Pages-prosjektet › Custom domains › legg til `tafse.no` og følg instruksene.

Tabellene i databasen lages automatisk første gang noen logger inn.

## Personvern

Forside, kalender, vedtekter og fortellingen er åpne for alle. Forslag, bilder og kommentarer krever passordet.
Bytter dere passord, blir alle logget ut og må skrive inn det nye.
