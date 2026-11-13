# Slik legger du til et nytt oppdrag i Honningfella

Alle oppdragene ligger i `oppdrag.json`. Et nytt oppdrag er en ny blokk i lista `oppdrag`.
Siden og tavlen plukker det opp av seg selv. Skåren brødrene allerede har, blir stående:
karriereskåren er summen av beste skår per oppdrag, så den vokser når nye oppdrag kommer.

**Ikke endre `id` på et oppdrag som er spilt.** Da mister brødrene skåren sin for det oppdraget.

## Et oppdrag

| Felt | Betydning |
| --- | --- |
| `id` | Kort navn med små bokstaver og bindestrek, for eksempel `styremotet`. Endres aldri. |
| `nummer` | Rekkefølgen i menyen. |
| `tittel`, `undertittel`, `ingress` | Teksten i menyen. |
| `vanskelighet` | 1 til 3 stjerner. |
| `moter` | Hvor mange personer man møter i ett forsøk. Trekkes tilfeldig fra `kort`. |
| `sekunder` | Tid per møte. Lavere er vanskeligere. |
| `avslorBonus` | Poeng for å avsløre en felle (ganges med multiplikatoren). |
| `kort` | Personene. Ha gjerne flere enn `moter`, så blir hvert forsøk ulikt. |

Mellom 35 og 55 prosent av møtene i et forsøk blir feller, så sørg for nok av begge slag.

## En person

| Felt | Betydning |
| --- | --- |
| `navn`, `rolle` | Hvem det er. |
| `felle` | `true` for honningfelle, `false` for ærlig. |
| `tilbud`, `tilbudTekst` | Hva som loves (i millioner dollar). Ærlige gir dette når de godtas. Feller koster minst like mye. |
| `replikk` | Det personen sier. |
| `detaljer` | To ting spilleren legger merke til. Her ligger ledetrådene. |
| `rapport` | Det bakgrunnssjekken avslører. |
| `godta`, `avslor` | Hva som skjer etter hvert valg. |
| `utseende` | Portrettet, se under. |

**Godt håndverk:** La noen ærlige personer flørte og være glamorøse, og la noen feller være beskjedne.
Det er hva de ber om som avslører dem (tilgang, hemmelighold, utstyret ditt, ingen advokater),
ikke hvor sjarmerende de er.

## Utseende

```json
{ "hud": "#e9c9a8", "har": "langt", "harfarge": "#5a1414",
  "antrekk": "kjole", "antrekksfarge": "#9b1b30",
  "tilbehor": ["leppestift", "champagne", "oredobb"] }
```

- `har`: `kort`, `pannelugg`, `langt`, `knute`, `krøller`, `skallet`
- `antrekk`: `kjole`, `dress`, `skinnjakke`, `genser`, `uniform`
- `tilbehor`: `briller`, `solbriller`, `monokkel`, `leppestift`, `oredobb`, `perler`, `hatt`,
  `headset`, `slips`, `champagne`, `blomst`, `startnummer`
