# Oppskrift: «Hva skjer i …?»

Denne filen styrer den ukentlige oppgaven som lager en ny utgave av fanen «Hva skjer?» på tafse.no.
Endrer du noe her, gjelder det fra neste kjøring.

## 1. Trekk et sted

```bash
node scripts/trekk-sted.mjs 5
```

Skriptet trekker fem kandidater: først et tilfeldig land (alle land har lik sjanse), så et tilfeldig
tettsted med 5 000 til 20 000 innbyggere i det landet. Steder som er brukt eller forkastet før,
kommer ikke opp igjen.

Bruk den første kandidaten som holder mål. Forkast et sted hvis

- innbyggertallet i GeoNames viser seg å være helt feil (for eksempel en grend på noen hundre), eller
- du etter et par grundige søk ikke finner minst to konkrete, daterte saker fra de siste månedene.

Søk gjerne på lokalspråket og i lokale aviser, ikke bare på engelsk. Legg forkastede steder i
`forkastet` i `index.json` (med `sted`, `landkode` og en kort `grunn`), så de ikke trekkes igjen.

## 2. Finn stoff

Se etter det som faktisk har skjedd på stedet nylig: lokalpolitikk, arrangementer, ulykker, vær,
næringsliv, idrett, kultur, kuriositeter. Les kildene selv; ikke skriv noe du ikke har funnet belegg
for. Hver sak må ha en kilde med lenke. Sjekk innbyggertall og andre fakta mot en oppdatert kilde.

Ta ikke med navn på privatpersoner som er ofre for kriminalitet eller ulykker, med mindre de er
offentlige personer som er omtalt med navn i flere medier.

## 3. Skriv utgaven

Skriv på norsk bokmål, saklig og presist, gjerne med et lett glimt i øyet der det passer.
Ingen tankestreker (–) som skilletegn i løpende tekst; bruk komma, kolon eller punktum.

Lagre som `data/steder/ÅÅÅÅ-MM-DD-stedsnavn.json` (dato = onsdagens dato, stedsnavn i små bokstaver
uten mellomrom eller spesialtegn), med denne formen:

```json
{
  "id": "2026-11-11-okahao",
  "dato": "2026-11-11",
  "sted": "Okahao",
  "land": "Namibia",
  "landkode": "NA",
  "region": "Omusati-regionen",
  "lat": -17.8876,
  "lon": 15.0668,
  "ingress": "3–5 setninger: hvor stedet ligger, hva det er kjent for, og hva som har preget den siste tiden.",
  "fakta": [ { "tittel": "Innbyggere", "verdi": "7 486 (folketelling 2023)" } ],
  "saker": [
    {
      "dato": "1. november 2026",
      "tittel": "Kort, presis overskrift",
      "tekst": "2–4 setninger.",
      "kilde": { "navn": "Avisens navn", "url": "https://…" }
    }
  ],
  "kuriosa": "Ett avsnitt med noe overraskende eller morsomt om stedet.",
  "kilder": [ { "navn": "Kilde: tittel", "url": "https://…" } ]
}
```

- `fakta`: 3–6 korte punkter (innbyggere, språk, ordfører eller leder, klima, næring, høyde over havet).
- `saker`: 3–6 saker, nyeste først.
- `id` og filnavn må være like.

Legg utgaven øverst i `utgaver` i `data/steder/index.json` med feltene `id`, `dato`, `sted`, `land`
og `landkode`. Eldre utgaver skal ligge urørt; de vises i arkivet på siden.

## 4. Sjekk og publiser

```bash
node -e "for (const f of ['data/steder/index.json', process.argv[1]]) JSON.parse(require('fs').readFileSync(f,'utf8'))" data/steder/<id>.json
git add data/steder && git commit -m "Hva skjer i <sted>?" && git push origin HEAD:main
```

Cloudflare publiserer siden automatisk et minutt eller to etter push.
