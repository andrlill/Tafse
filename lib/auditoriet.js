// AUDITORIET: Professor Sokrates Lund, som øver disputas med den som står på talerstolen.
// Han svarer også når noen i salen sier «professor» (ex auditorio). Alt han sier, havner i
// praten i rommet, så hele salen ser det. Språkmodellen er Cloudflare Workers AI, koblet til
// siden med navnet AI (Pages-prosjektet › Settings › Bindings › Workers AI).
// Hvem han er, står i INSTRUKS, og hvordan disputasen foregår ved hvert lærested i LAERESTEDER.

export const PROFESSOR = "Professor Lund";
export const TALERSTOL = [3, 1];   // flisa doktoranden står på. Samme tall står i assets/hotell.js

// Modellene som prøves, i rekkefølge. Variabelen PROFESSOR_MODELL i Cloudflare går foran.
const MODELLER = ["@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"];
const HISTORIKK = 16;          // så mange av de siste replikkene han husker per person
const NYSTART = "2026-11-18T11:19:56Z";   // det som ble sagt før dette, glemmes (flytt fram for å nullstille hukommelsen hans)
const MAKS_PER_PERSON = 100;   // svar per person per døgn
const MAKS_TOTALT = 500;       // svar i alt per døgn, så gratiskvoten holder (et svar er omtrent 1 000 ord-biter inn)
const MAKS_LENGDE = 160;       // tegn per svar, omtrent 25 ord. Lengre svar kuttes etter hele setninger

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS auditoriet_samtale (
    id INTEGER PRIMARY KEY AUTOINCREMENT, navn TEXT NOT NULL, rolle TEXT NOT NULL,
    tekst TEXT NOT NULL, modell TEXT, opprettet TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS auditoriet_samtale_navn ON auditoriet_samtale (navn, id)`,
];

// Hvem professoren er. Kort med vilje: han skal være en person, ikke en regelbok.
const INSTRUKS = `Du er Professor Sokrates Lund, en gammel professor ved kateteret i Auditoriet i Tafse Hotell, et spill for en vennegjeng. Folk kommer hit for å øve på disputas, og hele salen hører det du sier. Du er oppriktig interessert i forskning og i folkene du snakker med. Men du er også sinnsykt opptatt av Kurt Nilsen og rørleggerfaget, og det skinner stadig gjennom.

Du snakker muntlig og kort, som i en ekte samtale, på norsk.

Det du vet om lidenskapene dine:
Kurt Nilsen er født 29. september 1978 i Bergen og vokste opp i Arna. Han er utdannet rørlegger og jobbet som det før han ble kjent. Han sang i Fenrik Lane fra 1997, vant første norske Idol 23. mai 2003 foran Gaute Ormåsen, med rundt 1,1 millioner seere, og «She's So High» gikk rett til topps på VG-lista. Han vant World Idol i London 1. januar 2004 med U2-låten «Beautiful Day», foran blant andre Kelly Clarkson. Han er en ekte person, så du finner ikke på sitater fra ham eller noe om privatlivet hans.
Rørleggere går vg1 Bygg- og anleggsteknikk og vg2 Rørlegger, og deretter to år i lære. De avlegger svenneprøven, en praktisk prøve som gir svennebrev, og lærer om ledningsnett, sanitæranlegg og vannbåren varme. Faglig leder i den enkleste tiltaksklassen må ha mesterbrev.

Slik høres du ut:
Person: Jeg tar doktorgrad på OsloMet. / Du: OsloMet, jaså. I hva da?
Person: Jeg bruker registerdata. / Du: Alle bruker registerdata nå. Hva vet du som SSB ikke vet?
Person: Jeg gruer meg til disputasen. / Du: Kurt Nilsen sang for 1,1 millioner seere. Du har to opponenter.
Person: Metoden er difference-in-differences. / Du: Hm. Har den fall, som et godt avløp?`;

// Hvordan disputasen foregår. Tas bare med når lærestedet er nevnt i samtalen.
const LAERESTEDER = [
  { navn: /oslomet|storbyuniversitetet/i, tekst: "OsloMet: Prøveforelesning på 45 minutter klokka 10, disputas fra klokka 12 hvis prøveforelesningen er godkjent. Førsteopponenten presenterer avhandlingen på 15 til 20 minutter og diskuterer så innvendinger, inntil 1,5 time i alt. 15 minutters pause, der ex auditorio melder seg. Andreopponenten tar særskilte tema i inntil én time. Ex auditorio inntil 5 minutter. Komiteen går så ut og avgjør om forsvaret godkjennes." },
  { navn: /\buio\b|universitetet i oslo|blindern/i, tekst: "UiO (samfunnsvitenskap): Dekanen eller en stedfortreder leder, normalt inntil tre timer. Førsteopponenten oppsummerer avhandlingen og innleder. Begge opponentene diskuterer problemstilling, metode og teori, dokumentasjon og framstilling. Ex auditorio etter begge opponentene. Avhandlingens språk, pent antrekk." },
  { navn: /aix|marseille|soutenance|frankrike/i, tekst: "Aix-Marseille (soutenance de thèse): To eksterne rapportører skriver rapporter fire uker før. Juryen har 4 til 8 medlemmer med en president som er professor. Veilederen sitter i juryen, men avgjør ikke. Doktoranden presenterer først uavbrutt i 45 til 60 minutter, så spør jurymedlemmene etter tur. Juryen avgjør «admis» eller «ajourné», uten karakter. Øver personen på dette, kan du bytte til fransk hvis de vil." },
];

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
export function rens(t, maks = MAKS_LENGDE) {
  let s = String(t || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*<\/think>/i, "");
  s = s.replace(/^\s*(\*\*)?(Professor(en)?( Sokrates)?( Lund)?|Sokrates)(\*\*)?\s*:\s*/i, "");
  s = s.replace(/\*\*|__|[*#`]/g, "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();
  s = s.replace(/^["«]([\s\S]*)["»]$/, "$1").trim();
  // Typiske høflighetsfraser fra språkmodeller først i svaret
  const for_ = s;
  s = s.replace(/^(godt spørsmål|flott spørsmål|interessant|absolutt|selvfølgelig|takk for (svaret|det)|for et spennende tema|så spennende)[!.,]*\s*/i, "");
  if (s.length < 8) s = for_;
  s = s.charAt(0).toUpperCase() + s.slice(1);
  // Bare ett spørsmål per replikk: stopp etter det første
  let setninger = s.split(/(?<=[.!?…]["»]?)\s+/);
  const forsteSporsmal = setninger.findIndex((x) => /\?["»]?$/.test(x));
  if (forsteSporsmal >= 0) { setninger = setninger.slice(0, forsteSporsmal + 1); s = setninger.join(" "); }
  if (s.length <= maks) return s;
  // For langt: behold hele setninger så lenge de får plass (alltid minst den første)
  let ut = setninger[0];
  let i = 1;
  for (; i < setninger.length && (ut + " " + setninger[i]).length <= maks; i++) ut += " " + setninger[i];
  // Endte vi uten spørsmål, og det kommer et kort spørsmål senere, tas det med
  if (!/\?["»]?$/.test(ut)) {
    const sporsmal = setninger.slice(i).find((x) => /\?["»]?$/.test(x) && x.length <= 60);
    if (sporsmal && (ut + " " + sporsmal).length <= maks) ut += " " + sporsmal;
  }
  // Én eneste lang setning kuttes ved siste komma før grensen
  if (ut.length > maks + 60) {
    const komma = ut.slice(0, maks + 20).lastIndexOf(", ");
    ut = komma > 40 ? ut.slice(0, komma) + "." : ut;
  }
  return ut;
}

// Spør modellene etter tur til en svarer
async function spor(ai, onsket, messages, maks) {
  const liste = [...new Set([onsket, ...MODELLER].filter(Boolean))];
  for (const modell of liste) {
    const ekstra = /gemma|glm|qwen/.test(modell) ? { chat_template_kwargs: { enable_thinking: false } } : {};
    for (const input of [{ messages, max_tokens: 120, temperature: 0.9, ...ekstra }, { messages, max_tokens: 120 }]) {
      try {
        const tekst = rens(tekstFra(await ai.run(modell, input)), maks);
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
    db.prepare("SELECT rolle, tekst, opprettet FROM auditoriet_samtale WHERE navn = ? AND opprettet > ? ORDER BY id DESC LIMIT ?").bind(meg, NYSTART, HISTORIKK).all(),
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


  // Lærestedene som er nevnt i samtalen, så han vet hvordan disputasen foregår der
  const alt = [...tidligere.map((m) => m.tekst), tekst || ""].join(" ");
  const steder = LAERESTEDER.filter((l) => l.navn.test(alt));
  const bakgrunn = steder.length ? `\n\nSlik foregår disputasen der personen tar doktorgraden, hvis det kommer opp:\n${steder.map((l) => l.tekst).join("\n")}` : "";

  const ny = hendelse === "talerstol" ? `[${vis(meg)} går opp på talerstolen.]` : hendelse === "salen" ? `[Ex auditorio fra ${vis(meg)}:] ${tekst}` : tekst;
  const messages = [
    { role: "system", content: `${INSTRUKS}\n\nAKKURAT NÅ\n${kontekst}${bakgrunn}` },
    ...vekselvis([...tidligere.map((m) => ({ role: m.rolle === "professor" ? "assistant" : "user", content: m.tekst })), { role: "user", content: ny }]),
  ];
  const svar = await spor(ai, modell, messages, MAKS_LENGDE);
  if (!svar) return legg("Hm. Jeg mistet tråden. Si det en gang til?");

  await db.batch([
    db.prepare("INSERT INTO auditoriet_samtale (navn, rolle, tekst, modell, opprettet) VALUES (?, 'person', ?, NULL, ?)").bind(meg, ny, naa),
    db.prepare("INSERT INTO auditoriet_samtale (navn, rolle, tekst, modell, opprettet) VALUES (?, 'professor', ?, ?, ?)").bind(meg, svar.tekst, svar.modell, naa),
    db.prepare("DELETE FROM auditoriet_samtale WHERE navn = ? AND id NOT IN (SELECT id FROM auditoriet_samtale WHERE navn = ? ORDER BY id DESC LIMIT 80)").bind(meg, meg),
  ]);
  return legg(svar.tekst);
}
