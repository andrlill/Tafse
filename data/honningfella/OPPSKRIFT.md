# Slik legger du til et nytt oppdrag i Honningfella

Alle oppdragene ligger i `oppdrag.json`. Et nytt oppdrag er en ny blokk i lista `oppdrag`.
Siden og tavlen plukker det opp av seg selv. Skåren brødrene allerede har, blir stående:
karriereskåren er summen av beste skår per oppdrag, så den vokser når nye oppdrag kommer.

**Ikke endre `id` på et oppdrag som er spilt.** Da mister brødrene skåren sin for det oppdraget.

## Et oppdrag

| Felt | Betydning |
| --- | --- |
| `id` | Kort navn med små bokstaver og bindestrek, for eksempel `washington`. Endres aldri. |
| `nummer` | Rekkefølgen i menyen. |
| `tittel`, `undertittel`, `ingress` | Teksten i menyen. |
| `vanskelighet` | 1 til 3 stjerner. |
| `moter` | Hvor mange samtaler ett forsøk har. Personene trekkes tilfeldig. |
| `avslorBonus` | Poeng for å avsløre en felle (ganges med multiplikatoren). |
| `personer` | Personene. Ha gjerne flere enn `moter`, så blir hvert forsøk ulikt. |

Mellom 40 og 60 prosent av samtalene i et forsøk blir feller, så sørg for nok av begge slag.

## En person

| Felt | Betydning |
| --- | --- |
| `navn`, `rolle` | Hvem det er. |
| `felle` | `true` for honningfelle, `false` for ærlig. |
| `tilbud`, `tilbudTekst` | Hva som loves, i millioner dollar. |
| `rapport` | Det bakgrunnssjekken avslører. |
| `godta`, `avslor` | Standardutfallet når man godtar eller avslører. |
| `utseende` | Portrettet, se under. |
| `runder` | Tre runder samtale, se under. |

## Rundene

Hver runde har en `replikk` (det personen sier) og en liste `svar` med fem eller seks svar.
Svarene stokkes, så rekkefølgen i fila spiller ingen rolle.

**Runde 1 og 2** er sondering. Hvert svar har:

- `tekst`: det Jens sier
- `reaksjon`: det personen svarer
- `poeng`: fra −200 til +150. Gode, avslørende spørsmål gir pluss, uforsiktige svar (flørte tilbake, røpe ting) gir minus. Spilleren ser poengene først når samtalen er over.

**Runde 3** er avgjørelsen. Hvert svar har `tekst` og `type`, og eventuelt `utfall` (egen tekst for hva som skjer):

| Type | Ærlig person | Honningfelle |
| --- | --- | --- |
| `godta` | Hele tilbudet × multiplikator | Taper tilbudet (minst 600), prikk |
| `forsiktig` | 70 % av tilbudet × multiplikator | +100 |
| `avslor` | −300 | Bonus × multiplikator |
| `avvis` | 0 | 40 % av bonusen |
| `fristelse` | −300 | 1,5 × tapet, prikk |

Ha gjerne med alle fem typene, og gjerne to varianter av den riktige.
Poengreglene kan justeres øverst i `assets/honningfella.js`.

**Godt håndverk:** La noen ærlige personer flørte og være glamorøse, og la noen feller være beskjedne.
Det er hva de ber om som avslører dem (tilgang, hemmelighold, utstyret ditt, ingen advokater),
ikke hvor sjarmerende de er. Reaksjonene i runde 1 og 2 er stedet å gjemme ledetrådene.

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
