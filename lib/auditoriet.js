// AUDITORIET: Professor Sokrates Lund, som øver disputas med den som står på talerstolen.
// Han svarer også når noen i salen sier «professor» (ex auditorio). Alt han sier, havner i
// praten i rommet, så hele salen ser det. Språkmodellen er Cloudflare Workers AI, koblet til
// siden med navnet AI (Pages-prosjektet › Settings › Bindings › Workers AI).
// Personligheten og disputaskunnskapen hans står i INSTRUKS under. Endre den der.

export const PROFESSOR = "Professor Lund";
export const TALERSTOL = [3, 1];   // flisa doktoranden står på. Samme tall står i assets/hotell.js

// Modellene som prøves, i rekkefølge. Variabelen PROFESSOR_MODELL i Cloudflare går foran.
const MODELLER = ["@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"];
const HISTORIKK = 24;          // så mange av de siste replikkene han husker per person
const MAKS_PER_PERSON = 100;   // svar per person per døgn
const MAKS_TOTALT = 500;       // svar i alt per døgn, så gratiskvoten holder
const MAKS_LENGDE = 420;       // tegn per svar

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS auditoriet_samtale (
    id INTEGER PRIMARY KEY AUTOINCREMENT, navn TEXT NOT NULL, rolle TEXT NOT NULL,
    tekst TEXT NOT NULL, modell TEXT, opprettet TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS auditoriet_samtale_navn ON auditoriet_samtale (navn, id)`,
];

const INSTRUKS = `Du er Professor Sokrates Lund. Du står ved kateteret fremst i Auditoriet i Tafse Hotell, et spill på nettsiden til TAFSE (Taffelakademiet for Samvær og Etegilder), en vennegjeng med høytidelige middager. Folk kommer til deg for å øve på disputas. Alt du sier, vises i snakkebobler for alle i salen.

PERSONLIGHET
Du er vennlig i bunnen, men sassy: tørrvittig, litt teatralsk, med et hevet øyenbryn i stemmen. Du erter arbeidet og svarene, aldri personen. Av og til er du nostalgisk («I min tid disputerte vi med gåsefjær og frykt»), men ikke i hver replikk. Du kan kommentere salen. Du gir ros når den er fortjent, og kort.

SLIK SNAKKER DU
Norsk bokmål, muntlig og naturlig, som en ekte person i en samtale. Høyst tre korte setninger per replikk, og bare ett spørsmål om gangen. Ingen lister, ingen overskrifter, ingen fet skrift, ingen tankestreker, ingen emojier. Ikke start med navnet ditt. Bytt til fransk hvis personen øver på soutenance ved Aix-Marseille og ber om det, eller til engelsk hvis personen ber om det. Finn aldri på fakta om personen eller avhandlingen. Spør heller.

SAMTALENS GANG
1. Hils, og spør hvem du har æren av. Du ser navnet på navneskiltet, men vil vite hvem de er og hva de driver med.
2. Spør hvor de tar doktorgraden, og i hvilket fag.
3. Be om tittelen og en forklaring med egne ord, «som til en førsteårsstudent».
4. Spør når disputasen er, og hva de gruer seg mest til.
5. Spør om dere skal øve, eller om de lurer på noe om disputasen.
6. Øving: gå inn i rollen etter lærestedet. Grav i det personen selv har sagt. Når svarene blir vage, følg opp («Det var mange ord. Hva betyr det?»). Typiske tema: problemstilling, metode og teori, data og dokumentasjon, funn og begrensninger, og hva avhandlingen bidrar med.
7. Når personen vil stoppe, eller etter rundt ti spørsmål: gi to eller tre konkrete råd, ett av dem om å svare kortere.
Kjenner du personen fra før, hopper du over det du allerede vet og spør hvordan det har gått siden sist.

LÆRESTEDENE
OsloMet: Prøveforelesning på 45 minutter klokka 10. Disputasen begynner klokka 12, og bare hvis prøveforelesningen er godkjent. Disputasleder går først i prosesjonen, i kappe. Førsteopponenten presenterer avhandlingens formål og resultater på 15 til 20 minutter, og diskuterer så konkrete innvendinger, inntil 1,5 time i alt. Så kommer 15 minutters pause, der de som vil opponere ex auditorio, melder seg. Andreopponenten tar opp særskilte tema i inntil én time. Ex auditorio-innlegg varer inntil 5 minutter. Doktoranden får si noen avsluttende ord, og komiteen går ut og avgjør om forsvaret godkjennes.
UiO (Det samfunnsvitenskapelige fakultet): Disputasen ledes av dekanen eller en stedfortreder og varer normalt inntil tre timer. Førsteopponenten oppsummerer problemstilling og hovedfunn og innleder diskusjonen. Begge opponentene diskuterer problemstilling, metode og teori, dokumentasjon og framstilling. Ex auditorio kommer etter begge opponentene. Disputasen holdes på avhandlingens språk, i pent antrekk. Kandidaten avslutter med en kort takk.
Aix-Marseille Université (soutenance de thèse): To eksterne rapportører skriver rapporter som skal foreligge fire uker før. Juryen har 4 til 8 medlemmer, og en av dem, som må være professor, velges til president. Veilederen sitter i juryen, men er ikke med på avgjørelsen. Doktoranden presenterer først arbeidet sitt uavbrutt i 45 til 60 minutter, og så stiller jurymedlemmene spørsmål etter tur. Juryen trekker seg tilbake og avgjør «admis» eller «ajourné». Det gis ingen karakter («mention»).
Andre steder: spør hvordan det foregår der, og bruk det norske oppsettet hvis personen ikke vet.
I øvingen spiller du førsteopponent ved OsloMet og UiO, og jurymedlemmer etter tur ved Aix-Marseille.

GRENSER
Ikke spør om helse, økonomi eller andre private forhold. Sier noen at de gruer seg, svar kort og varmt og gå videre. Er spørsmålet ikke om disputas eller avhandlingen, svar kort og vittig og led samtalen tilbake. Spør noen om reglene gjelder akkurat dem: «Sjekk med fakultetet ditt. Jeg er bare en professor i et hotell.» Ex auditorio-innspill fra salen besvarer du kort, og så går du tilbake til den som står på talerstolen.`;

const iso = (ms) => new Date(ms).toISOString();
const dato = (ms) => new Intl.DateTimeFormat("nb-NO", { timeZone: "Europe/Oslo", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(ms));
const vis = (navn) => String(navn).replace(/ \(gjest\)$/, "");

// Teksten i svaret, uansett hvilken form modellen svarer i
function tekstFra(r) {
  if (!r) return "";
  if (typeof r === "string") return r;
  if (typeof r.response === "string") return r.response;
  const c = r.choices && r.choices[0];
  if (c) {
    const m = c.message || {};
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) return m.content.map((d) => d.text || "").join("");
    if (typeof c.text === "string") return c.text;
  }
  if (typeof r.output_text === "string") return r.output_text;
  if (r.result) return tekstFra(r.result);
  return "";
}

// Gjør svaret til én pen replikk: uten tanker, navn foran, markdown og tankestreker
export function rens(t) {
  let s = String(t || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*<\/think>/i, "");
  s = s.replace(/^\s*(\*\*)?(Professor(en)?( Sokrates)?( Lund)?|Sokrates)(\*\*)?\s*:\s*/i, "");
  s = s.replace(/\*\*|__|[*#`]/g, "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();
  s = s.replace(/^["«]([\s\S]*)["»]$/, "$1").trim();
  if (s.length > MAKS_LENGDE) {
    const kutt = s.slice(0, MAKS_LENGDE);
    const slutt = Math.max(kutt.lastIndexOf(". "), kutt.lastIndexOf("? "), kutt.lastIndexOf("! "));
    s = slutt > 80 ? kutt.slice(0, slutt + 1) : kutt.trimEnd() + " …";
  }
  return s;
}

// Spør modellene etter tur til en svarer
async function spor(ai, onsket, messages) {
  const liste = [...new Set([onsket, ...MODELLER].filter(Boolean))];
  for (const modell of liste) {
    const ekstra = /gemma|glm|qwen/.test(modell) ? { chat_template_kwargs: { enable_thinking: false } } : {};
    for (const input of [{ messages, max_tokens: 400, temperature: 0.8, ...ekstra }, { messages, max_tokens: 400 }]) {
      try {
        const tekst = rens(tekstFra(await ai.run(modell, input)));
        if (tekst) return { tekst, modell };
        break;   // tomt svar: prøv neste modell
      } catch (_) { /* prøv uten ekstra valg, så neste modell */ }
    }
  }
  return null;
}

// Modellene vil ha bruker og professor annenhver gang
function vekselvis(liste) {
  const ut = [];
  for (const m of liste) {
    const forrige = ut[ut.length - 1];
    if (forrige && forrige.role === m.role) forrige.content += "\n" + m.content;
    else ut.push({ ...m });
  }
  if (ut.length && ut[0].role === "assistant") ut.unshift({ role: "user", content: "[Kommer inn i auditoriet.]" });
  return ut;
}

// Lager et svar fra professoren og legger det i praten i rommet.
// hendelse: «talerstol» (går opp på talerstolen), «si» (fra talerstolen) eller «salen» (ex auditorio).
export async function professorSvarer({ db, ai, modell, meg, erGjest, tekst, hendelse }) {
  const naaMs = Date.now(), naa = iso(naaMs), dogn = iso(naaMs - 86400000);
  const legg = async (svar) => {
    await db.prepare("INSERT INTO hotell_prat (rom, navn, type, tekst, opprettet) VALUES ('auditoriet', ?, 'si', ?, ?)").bind(PROFESSOR, svar, naa).run();
    return svar;
  };
  if (!ai) return legg("Jeg har mistet stemmen. Noen må koble meg til i Cloudflare før jeg kan opponere.");

  const [minne, mine, alle] = await Promise.all([
    db.prepare("SELECT rolle, tekst, opprettet FROM auditoriet_samtale WHERE navn = ? ORDER BY id DESC LIMIT ?").bind(meg, HISTORIKK).all(),
    db.prepare("SELECT COUNT(*) AS n FROM auditoriet_samtale WHERE navn = ? AND rolle = 'professor' AND opprettet > ?").bind(meg, dogn).first(),
    db.prepare("SELECT COUNT(*) AS n FROM auditoriet_samtale WHERE rolle = 'professor' AND opprettet > ?").bind(dogn).first(),
  ]);
  if (mine.n >= MAKS_PER_PERSON || alle.n >= MAKS_TOTALT) return legg("Nok for i dag. Selv Sokrates trengte søvn. Kom tilbake i morgen.");
  const tidligere = minne.results.reverse();
  // En ny hilsen like etter forrige replikk er bare at noen trippet av og på talerstolen
  if (hendelse === "talerstol" && tidligere.length && naaMs - Date.parse(tidligere[tidligere.length - 1].opprettet) < 90000) return null;

  // Det som nylig er sagt i salen, også av professoren selv, så han vet hva som foregår på talerstolen
  const salen = (await db.prepare("SELECT navn, tekst FROM hotell_prat WHERE rom = 'auditoriet' AND type = 'si' AND navn != ? AND opprettet > ? ORDER BY id DESC LIMIT 6")
    .bind(meg, iso(naaMs - 180000)).all()).results.reverse();
  const sist = tidligere.length ? Date.parse(tidligere[tidligere.length - 1].opprettet) : null;
  const dager = sist ? Math.floor((naaMs - sist) / 86400000) : null;
  const kontekst = [
    `I dag er det ${dato(naaMs)}.`,
    `Navneskiltet sier ${vis(meg)}${erGjest ? ", som er gjest i hotellet" : ", som er medlem av TAFSE"}.`,
    sist === null ? "Dere har aldri snakket sammen før." : dager === 0 ? "Dere har snakket sammen tidligere i dag." : `Dere snakket sist sammen for ${dager} ${dager === 1 ? "dag" : "dager"} siden.`,
    hendelse === "salen" ? `${vis(meg)} sitter i salen og kommer med et innspill ex auditorio.` : `${vis(meg)} står på talerstolen.`,
    salen.length ? `Nylig sagt i salen: ${salen.map((m) => `${m.navn === PROFESSOR ? "Du" : vis(m.navn)}: «${m.tekst}»`).join(" ")}` : "",
  ].filter(Boolean).join(" ");

  const ny = hendelse === "talerstol" ? `[${vis(meg)} går opp på talerstolen.]` : hendelse === "salen" ? `[Ex auditorio fra ${vis(meg)}:] ${tekst}` : tekst;
  const messages = [
    { role: "system", content: `${INSTRUKS}\n\nAKKURAT NÅ\n${kontekst}` },
    ...vekselvis([...tidligere.map((m) => ({ role: m.rolle === "professor" ? "assistant" : "user", content: m.tekst })), { role: "user", content: ny }]),
  ];
  const svar = await spor(ai, modell, messages);
  if (!svar) return legg("Hm. Jeg mistet tråden. Si det en gang til?");

  await db.batch([
    db.prepare("INSERT INTO auditoriet_samtale (navn, rolle, tekst, modell, opprettet) VALUES (?, 'person', ?, NULL, ?)").bind(meg, ny, naa),
    db.prepare("INSERT INTO auditoriet_samtale (navn, rolle, tekst, modell, opprettet) VALUES (?, 'professor', ?, ?, ?)").bind(meg, svar.tekst, svar.modell, naa),
    db.prepare("DELETE FROM auditoriet_samtale WHERE navn = ? AND id NOT IN (SELECT id FROM auditoriet_samtale WHERE navn = ? ORDER BY id DESC LIMIT 80)").bind(meg, meg),
  ]);
  return legg(svar.tekst);
}
