// SYMPOSION: regler og serverlogikk for den felles greske byen.
// Alt regnes ut på serveren, så ingen kan jukse med klokka. Tallene under kan justeres fritt.

const TIME = 3600000;

export const REGLER = {
  maksNiva: 10,
  vekst: 1.65,             // hvert nivå koster så mye mer enn det forrige
  startOliven: 120,
  takGrunn: 3,             // lageret rommer (3 + villanivå) timer med produksjon
  monumentBonus: 0.1,      // hvert ferdige monument gir alle +10 % produksjon
  skjenkAndel: 0.1,        // man gir bort 10 % av det godset produserer i timen, av hver råvare
  // ÆRE gis bare for å gi: skjenke naboene, gi til byggverkene og holde fest for folkene sine.
  // Den kan ikke brukes på noe. All ære man har fått, avgjør rangen.
  skjenkAere: 10,          // ære for å skjenke
  gjengjeldAere: 5,        // ekstra ære for å skjenke tilbake samme dag
  rundeMal: 5,             // så mange man må skjenke på én dag for å ta dagens runde
  rundeAere: 25,           // runden gir også én times avling av alt godset produserer
  naskPerDag: 3,
  naskAndel: 0.3,
  naskMaks: 150,
  naskMin: 5,
  taggPerDag: 2,           // så mange hus man kan tagge om dagen
  taggMaks: 24,            // tegn i en tagg
  taggStraff: 0.15,        // et tagget hus produserer 15 % mindre til det er vasket
  vekt: { oliven: 1, vin: 1.5, marmor: 2.5, honning: 2, solv: 4, krydder: 5, purpur: 6 }, // verdi når man gir til monumentet
  navn: { oliven: "oliven", vin: "vin", marmor: "marmor", honning: "honning", solv: "sølv", purpur: "purpur", krydder: "krydder" },
  // Rang etter all ære man har fått
  ranger: [
    { fra: 0, tittel: "Borger" },
    { fra: 200, tittel: "Rådsmann", pynt: "flagg" },
    { fra: 500, tittel: "Kvestor", pynt: "amforaer" },
    { fra: 1000, tittel: "Senator", pynt: "krans" },
    { fra: 1800, tittel: "Pretor", pynt: "mosaikk" },
    { fra: 3000, tittel: "Arkont", pynt: "statue" },
    { fra: 4500, tittel: "Strateg", pynt: "fontene" },
    { fra: 6500, tittel: "Konsul", pynt: "orn" },
    { fra: 9000, tittel: "Symposiark", pynt: "fakler" },
    { fra: 13000, tittel: "Heros", pynt: "stjerne" },
  ],
  // Da stigen ble utvidet, beholdt alle tittelen de hadde: grensene i den gamle stigen og
  // plassen samme tittel har i den nye. Lagres i rang_min og brukes bare én gang per spiller.
  gammelStige: [[2500, 8], [1200, 5], [500, 3], [150, 1]],
  // Torget: småting som kjøpes for råvarer
  butikk: {
    tagg: { navn: "Ekstra spraybøks", tekst: "Én tagg til i dag.", pris: { vin: 150 }, perDag: 3 },
    nask: { navn: "Lange fingre", tekst: "Ett nask til i dag.", pris: { oliven: 200 }, perDag: 3 },
    slave: { navn: "Vaskeslave", tekst: "I sju dager vasker han bort tagger på huset ditt en time etter at de kom.", pris: { oliven: 600, vin: 300 }, dager: 7 },
    statue: { navn: "Statue på agoraen", tekst: "Deg i marmor, midt i byen. For alltid.", pris: { marmor: 2500, vin: 1000 }, engang: true },
  },
  // Fest for folkene på godset: én gang om dagen, koster en times produksjon av oliven og vin
  // (og honning, om man har bigård). Gir ære etter hvor mange ansatte man har, og alle jobber
  // bedre en stund etterpå.
  fest: { timerKost: 1, minKost: { oliven: 60, vin: 30 }, aereGrunn: 10, aerePerNiva: 2, bonus: 0.1, varer: 8 },
  slaveVenter: 1,          // timer før vaskeslaven vasker
  bygg: {
    lund: { navn: "Olivenlund", gir: "oliven", perTime: 20 },
    vingard: { navn: "Vingård", gir: "vin", perTime: 14, krever: ["lund", 2] },
    brudd: { navn: "Marmorbrudd", gir: "marmor", perTime: 9, krever: ["vingard", 2] },
    bigard: { navn: "Bigård", gir: "honning", perTime: 6, krever: ["lund", 4] },
    gruve: { navn: "Sølvgruve", gir: "solv", perTime: 4, krever: ["brudd", 3] },
    villa: { navn: "Villa" },
    havn: { navn: "Havn", krever: ["villa", 4], maks: 5 },
  },
  // Folk man ansetter på godset. Hver av dem kan forfremmes til nivå 5.
  ansattMaks: 5,
  ansattVekst: 1.8,
  ansattProd: 0.1,         // en arbeider gir 10 % mer i bygget sitt per nivå
  vaktAndel: 0.18,         // nattevakten redder 18 % av det som ellers ble nasket, per nivå
  ansatte: {
    plukker: { en: "en olivenplukker", navn: "Olivenplukkeren", bygg: "lund", tekst: "Rister trærne før sola står opp." },
    vinbonde: { en: "en vinbonde", navn: "Vinbonden", bygg: "vingard", tekst: "Tråkker druer og smaker på alt." },
    steinhugger: { en: "en steinhugger", navn: "Steinhuggeren", bygg: "brudd", tekst: "Snakker lite, hugger mye." },
    birokter: { en: "en birøkter", navn: "Birøkteren", bygg: "bigard", tekst: "Stukket hver dag, like blid." },
    bergmann: { en: "en bergmann", navn: "Bergmannen", bygg: "gruve", tekst: "Ser dagslys på helligdager." },
    forvalter: { en: "en forvalter", navn: "Forvalteren", krever: ["villa", 3], tekst: "Holder orden på lageret. Én time mer plass per nivå." },
    nattevakt: { en: "en nattevakt", navn: "Nattevakten", krever: ["villa", 2], tekst: "Jager naskere. De slipper unna med mindre for hvert nivå." },
  },
  // Tokt fra havnen. Lasten vokser med 25 % for hvert havnenivå over det første.
  toktLast: 0.25,
  fyrFart: 0.8,            // med Fyrtårnet reist tar toktene 20 % kortere tid
  tokt: {
    kreta: { navn: "Kreta", timer: 1, pris: { oliven: 80, vin: 40 }, gir: { krydder: [8, 14] } },
    tyros: { navn: "Tyros", timer: 8, pris: { oliven: 300, vin: 200, honning: 30 }, gir: { purpur: [30, 45], krydder: [15, 25] } },
    egypt: { navn: "Egypt", timer: 24, havn: 2, pris: { oliven: 600, vin: 400, marmor: 150, honning: 60 }, gir: { purpur: [70, 100], krydder: [70, 100], solv: [20, 40] } },
  },
  monumenter: [
    { id: "agora", navn: "Agoraen", tekst: "Torget der byens folk møtes.", krav: { oliven: 1500, vin: 800, marmor: 400 } },
    { id: "tempel", navn: "Dionysos' tempel", tekst: "Til vinens og festens gud.", krav: { oliven: 5000, vin: 3500, marmor: 2500 } },
    { id: "teater", navn: "Amfiteateret", tekst: "For taler, sang og dårlige vitser.", krav: { oliven: 12000, vin: 9000, marmor: 7000 } },
    { id: "koloss", navn: "Tafsekolossen", tekst: "En borger i bronse, med hevet beger.", krav: { oliven: 30000, vin: 24000, marmor: 20000 } },
    { id: "fyr", navn: "Fyrtårnet", tekst: "Viser skipene hjem. Toktene går 20 % raskere når det står.", krav: { marmor: 12000, solv: 2500, krydder: 2000, purpur: 1200 } },
    { id: "orakel", navn: "Orakelet", tekst: "Svarer på alt, men aldri tydelig.", krav: { honning: 6000, solv: 5000, krydder: 4500, purpur: 3500 } },
  ],
};

// [ressurs, grunnpris, fra og med hvilket nivå ressursen kreves]
const KOST = {
  lund: [["oliven", 30, 0], ["vin", 10, 3]],
  vingard: [["oliven", 60, 0], ["vin", 20, 1]],
  brudd: [["oliven", 80, 0], ["vin", 50, 0], ["marmor", 15, 1]],
  villa: [["oliven", 100, 0], ["vin", 40, 2], ["marmor", 25, 3]],
  bigard: [["oliven", 150, 0], ["vin", 60, 0], ["marmor", 30, 2]],
  gruve: [["oliven", 250, 0], ["vin", 120, 0], ["marmor", 120, 0], ["honning", 30, 1]],
  havn: [["oliven", 600, 0], ["vin", 400, 0], ["marmor", 300, 0], ["honning", 80, 1], ["solv", 60, 1]],
};
// Lønn for å ansette (nivå 0) og forfremme
const LONN = {
  plukker: { oliven: 200, vin: 80 },
  vinbonde: { oliven: 250, vin: 120 },
  steinhugger: { oliven: 300, vin: 150, marmor: 80 },
  birokter: { oliven: 300, honning: 60 },
  bergmann: { vin: 300, marmor: 200, honning: 80 },
  forvalter: { oliven: 400, vin: 200, solv: 30 },
  nattevakt: { oliven: 300, solv: 20 },
};
const RESSURSER = ["oliven", "vin", "marmor", "honning", "solv"]; // det godset produserer
const HANDEL = ["purpur", "krydder"];                             // det skipene henter hjem
const ALLE = [...RESSURSER, ...HANDEL];
const rn = (r) => REGLER.navn[r] || r;
const maksNiva = (id) => REGLER.bygg[id].maks || REGLER.maksNiva;

export function lonn(hvem, niva) {
  return Object.fromEntries(Object.entries(LONN[hvem]).map(([r, n]) => [r, Math.round((n * Math.pow(REGLER.ansattVekst, niva)) / 5) * 5]));
}
// De ansatte ligger som JSON i én kolonne: { plukker: 2, forvalter: 1 }
const folk = (g) => {
  if (!g._folk) { try { g._folk = JSON.parse(g.ansatte || "{}") || {}; } catch (_) { g._folk = {}; } }
  return g._folk;
};
const toktNaa = (g) => { try { return g.tokt ? JSON.parse(g.tokt) : null; } catch (_) { return null; } };

export function kost(bygg, niva) {
  const k = {};
  for (const [r, grunn, fra] of KOST[bygg]) if (niva >= fra) k[r] = Math.round((grunn * Math.pow(REGLER.vekst, niva)) / 5) * 5;
  return k;
}

function offergave(streak) {
  const g = { oliven: 40 + 20 * streak };
  if (streak >= 3) g.vin = 10 * streak;
  if (streak >= 5) g.marmor = 5 * streak;
  if (streak >= 7) for (const r of RESSURSER) g[r] *= 2;
  return g;
}

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS symposion_gods (
    navn TEXT PRIMARY KEY,
    oliven REAL NOT NULL, vin REAL NOT NULL, marmor REAL NOT NULL,
    l_oliven REAL NOT NULL, l_vin REAL NOT NULL, l_marmor REAL NOT NULL,
    lund INTEGER NOT NULL, vingard INTEGER NOT NULL, brudd INTEGER NOT NULL, villa INTEGER NOT NULL,
    aere INTEGER NOT NULL, streak INTEGER NOT NULL, sist_offer TEXT,
    oppdatert TEXT NOT NULL, sist_sett TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS symposion_handling (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fra TEXT NOT NULL, til TEXT NOT NULL, type TEXT NOT NULL, dag TEXT NOT NULL,
    UNIQUE (fra, til, type, dag)
  )`,
  `CREATE TABLE IF NOT EXISTS symposion_bidrag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    navn TEXT NOT NULL, monument TEXT NOT NULL,
    oliven INTEGER NOT NULL, vin INTEGER NOT NULL, marmor INTEGER NOT NULL, opprettet TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS symposion_tagg (
    til TEXT PRIMARY KEY, fra TEXT NOT NULL, tekst TEXT NOT NULL, farge TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS symposion_statue (navn TEXT PRIMARY KEY, opprettet TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS symposion_ferdig (monument TEXT PRIMARY KEY, ferdig TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS symposion_logg (
    id INTEGER PRIMARY KEY AUTOINCREMENT, navn TEXT NOT NULL, tekst TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
];

// Kolonner som kom til etter første versjon. Kjøres med try, siden de feiler når kolonnen finnes.
export const MIGRERING = [
  "ALTER TABLE symposion_gods ADD COLUMN aere_brukt INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE symposion_gods ADD COLUMN slave_til TEXT",
  // Utvidelsen med bigård, sølvgruve, havn og ansatte
  ...["honning", "solv", "purpur", "krydder", "l_honning", "l_solv"].map((k) => `ALTER TABLE symposion_gods ADD COLUMN ${k} REAL NOT NULL DEFAULT 0`),
  ...["bigard", "gruve", "havn"].map((k) => `ALTER TABLE symposion_gods ADD COLUMN ${k} INTEGER NOT NULL DEFAULT 0`),
  "ALTER TABLE symposion_gods ADD COLUMN ansatte TEXT",
  "ALTER TABLE symposion_gods ADD COLUMN tokt TEXT",
  "ALTER TABLE symposion_gods ADD COLUMN fest_til TEXT",
  // Laveste rang en spiller kan ha. NULL betyr «ikke regnet ut ennå» og finnes bare på gods fra før utvidelsen.
  "ALTER TABLE symposion_gods ADD COLUMN rang_min INTEGER",
  `UPDATE symposion_gods SET rang_min = CASE ${REGLER.gammelStige.map(([fra, i]) => `WHEN aere >= ${fra} THEN ${i}`).join(" ")} ELSE 0 END WHERE rang_min IS NULL`,
  ...["honning", "solv", "purpur", "krydder"].map((k) => `ALTER TABLE symposion_bidrag ADD COLUMN ${k} INTEGER NOT NULL DEFAULT 0`),
];

export const rang = (aere) => {
  let i = 0;
  REGLER.ranger.forEach((r, j) => { if (aere >= r.fra) i = j; });
  return i;
};
// Rangen til et gods: etter æren, men aldri lavere enn tittelen man hadde før stigen ble utvidet
const rangAv = (g) => Math.max(rang(g.aere), g.rang_min || 0);

// Dagen skifter ved midnatt norsk tid
const dag = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(ms));

const festPaa = (g, ms = Date.now()) => !!(g.fest_til && Date.parse(g.fest_til) > ms);
function rater(g, bonus, fest = festPaa(g)) {
  if (fest) bonus *= 1 + REGLER.fest.bonus;
  const r = {};
  const f = folk(g);
  for (const [id, b] of Object.entries(REGLER.bygg)) {
    if (!b.gir) continue;
    const arbeider = Object.keys(REGLER.ansatte).find((a) => REGLER.ansatte[a].bygg === id);
    r[b.gir] = b.perTime * (g[id] || 0) * bonus * (1 + REGLER.ansattProd * (f[arbeider] || 0));
  }
  return r;
}
// Gaven når g skjenker: 10 % av timesproduksjonen av hver råvare, minst 1 av det godset lager.
// Den trekkes fra beholdningen, så man kan bare gi det man har.
const skjenkGave = (g, bonus) => Object.fromEntries(Object.entries(rater(g, bonus))
  .filter(([, n]) => n > 0)
  .map(([r, n]) => [r, Math.min(Math.floor(g[r] || 0), Math.max(1, Math.round(n * REGLER.skjenkAndel)))])
  .filter(([, n]) => n > 0));
const rundeGave = (g, bonus) => Object.fromEntries(Object.entries(rater(g, bonus)).map(([r, n]) => [r, Math.floor(n)]).filter(([, n]) => n > 0));
const takTimer = (g) => REGLER.takGrunn + g.villa + (folk(g).forvalter || 0);
// Så mye oliven en nasker får med seg fra dette godset
const naskBytte = (g) => Math.floor(Math.min(g.l_oliven * REGLER.naskAndel, REGLER.naskMaks) * Math.max(0, 1 - REGLER.vaktAndel * (folk(g).nattevakt || 0)));

// Fyller lageret med det som er produsert siden sist, opp til taket.
// Slutter en fest underveis, regnes tiden før og etter hver for seg.
function gjorOpp(g, naaMs, bonus) {
  const fra = Date.parse(g.oppdatert), slutt = g.fest_til ? Date.parse(g.fest_til) : 0;
  const biter = slutt > fra && slutt < naaMs ? [[fra, slutt, true], [slutt, naaMs, false]] : [[fra, naaMs, slutt >= naaMs]];
  for (const [a, b, fest] of biter) {
    const timer = Math.max(0, (b - a) / TIME), r = rater(g, bonus, fest);
    for (const x of RESSURSER) {
      const l = g[`l_${x}`] || 0;
      g[`l_${x}`] = Math.max(l, Math.min(r[x] * takTimer(g), l + r[x] * timer));
    }
  }
  g.oppdatert = new Date(naaMs).toISOString();
  return g;
}

// Det festen koster og gir akkurat nå
function festInfo(g, bonus) {
  const F = REGLER.fest, r = rater(g, bonus, false), f = folk(g);
  const pris = {};
  for (const x of ["oliven", "vin", "honning"]) {
    const n = Math.round((r[x] || 0) * F.timerKost / 5) * 5;
    if (n > 0 || F.minKost[x]) pris[x] = Math.max(n, F.minKost[x] || 0);
  }
  const nivaer = Object.values(f).reduce((a, n) => a + (n || 0), 0);
  return { pris, aere: nivaer ? F.aereGrunn + F.aerePerNiva * nivaer : 0, ansatte: nivaer };
}

const KOLONNER = [...ALLE, ...RESSURSER.map((r) => `l_${r}`), "lund", "vingard", "brudd", "bigard", "gruve", "villa", "havn", "aere", "aere_brukt", "slave_til", "ansatte", "tokt", "fest_til", "streak", "sist_offer", "oppdatert", "sist_sett"];
const lagre = (db, g) => {
  if (g._folk) g.ansatte = JSON.stringify(g._folk);
  const verdi = (k) => (g[k] === undefined || g[k] === null ? (["slave_til", "ansatte", "tokt", "fest_til", "sist_offer"].includes(k) ? null : 0) : g[k]);
  return db.prepare(`UPDATE symposion_gods SET ${KOLONNER.map((k) => `${k} = ?`).join(", ")} WHERE navn = ?`).bind(...KOLONNER.map(verdi), g.navn).run();
};

const logg = (db, navn, tekst) => db
  .prepare("INSERT INTO symposion_logg (navn, tekst, opprettet) VALUES (?, ?, ?)").bind(navn, tekst, new Date().toISOString()).run();

const har = (g, pris) => Object.entries(pris).every(([r, n]) => g[r] >= n);
const prisTekst = (pris) => Object.entries(pris).map(([r, n]) => `${n} ${rn(r)}`).join(", ");

async function monumentStatus(db, ferdige) {
  const m = REGLER.monumenter.find((x) => !ferdige.includes(x.id));
  if (!m) return null;
  const sum = await db.prepare(`SELECT ${ALLE.map((r) => `COALESCE(SUM(${r}), 0) AS ${r}`).join(", ")} FROM symposion_bidrag WHERE monument = ?`).bind(m.id).first();
  return { ...m, gitt: Object.fromEntries(Object.keys(m.krav).map((r) => [r, sum[r]])) };
}

export async function symposion({ db, meg, metode, handling, request, json, feil, lesJson, varsle }) {
  const naaMs = Date.now();
  const naa = new Date(naaMs).toISOString();
  const idag = dag(naaMs);
  if (metode === "GET" && handling === "titler") {
    const { results } = await db.prepare("SELECT navn, aere, rang_min FROM symposion_gods").all();
    return json(Object.fromEntries(results.map((r) => [r.navn, REGLER.ranger[rangAv(r)].tittel])));
  }
  let ferdige = (await db.prepare("SELECT monument FROM symposion_ferdig").all()).results.map((r) => r.monument);
  const tagger = new Map((await db.prepare("SELECT til, fra, tekst, farge, opprettet FROM symposion_tagg").all()).results.map((t) => [t.til, t]));
  // Produksjonsfaktor for et gods: monumentene gir mer, en tagg gir mindre
  const bonus = (navn) => (1 + REGLER.monumentBonus * ferdige.length) * (navn && tagger.has(navn) ? 1 - REGLER.taggStraff : 1);
  // Vaskeslavene gjør jobben sin: tagger eldre enn en time på hus med aktiv slave vaskes bort
  for (const t of [...tagger.values()]) {
    if (naaMs - Date.parse(t.opprettet) < REGLER.slaveVenter * TIME) continue;
    const eier = await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(t.til).first();
    if (!eier || !eier.slave_til || eier.slave_til < t.opprettet) continue;
    gjorOpp(eier, naaMs, bonus(t.til));
    await lagre(db, eier);
    await db.prepare("DELETE FROM symposion_tagg WHERE til = ?").bind(t.til).run();
    tagger.delete(t.til);
    await logg(db, t.til, `fikk vaskeslaven sin til å fjerne «${t.tekst}» fra huset`);
  }
  let g = await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first();
  if (g) { gjorOpp(g, naaMs, bonus(meg)); g.sist_sett = naa; }
  const kjopt = async (type) => g ? (await db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = ? AND dag = ?").bind(meg, `kjop-${type}`, idag).first()).n : 0;
  let sist = null; // det som nettopp skjedde, så siden kan vise det

  if (metode === "POST") {
    const b = await lesJson(request);
    if (handling === "flytt-inn") {
      if (!g) {
        await db.prepare(`INSERT INTO symposion_gods (navn, oliven, vin, marmor, l_oliven, l_vin, l_marmor, lund, vingard, brudd, villa, aere, streak, sist_offer, oppdatert, sist_sett, opprettet, rang_min)
          VALUES (?, ?, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, NULL, ?, ?, ?, 0)`).bind(meg, REGLER.startOliven, naa, naa, naa).run();
        g = await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first();
        await logg(db, meg, "flyttet inn i byen");
        const andre = (await db.prepare("SELECT navn FROM symposion_gods").all()).results.map((x) => x.navn);
        await varsle(db, andre, { avsender: meg, type: "symposion", tekst: "flyttet inn i Symposion. Stikk innom og skjenk ham et glass", lenke: "symposion.html" });
        sist = { type: "flytt-inn" };
      }
    } else if (!g) {
      return feil(400, "Du må flytte inn i byen først.");
    } else if (handling === "host") {
      const fikk = {};
      for (const r of RESSURSER) {
        const n = Math.floor(g[`l_${r}`]);
        if (n > 0) { g[r] += n; g[`l_${r}`] -= n; fikk[r] = n; }
      }
      sist = { type: "host", fikk };
    } else if (handling === "bygg") {
      const id = b.bygg;
      const regel = REGLER.bygg[id];
      if (!regel) return feil(400, "Ukjent bygg.");
      const niva = g[id];
      if (niva >= maksNiva(id)) return feil(400, "Bygget er allerede på høyeste nivå.");
      if (regel.krever && g[regel.krever[0]] < regel.krever[1]) return feil(400, `Krever ${REGLER.bygg[regel.krever[0]].navn.toLowerCase()} på nivå ${regel.krever[1]}.`);
      const pris = kost(id, niva);
      if (!har(g, pris)) return feil(400, `Du har ikke råd. Det koster ${prisTekst(pris)}.`);
      for (const [r, n] of Object.entries(pris)) g[r] -= n;
      g[id] = niva + 1;
      if (niva === 0) await logg(db, meg, `anla ${{ vingard: "en vingård", brudd: "et marmorbrudd", bigard: "en bigård", gruve: "en sølvgruve", havn: "en havn" }[id]}`);
      else if (id === "villa" && [3, 5, 8].includes(g[id])) await logg(db, meg, g[id] === 8 ? "reiste et palass" : g[id] === 5 ? "bygde en villa med søyler" : "bygde seg et ordentlig hus");
      sist = { type: "bygg", bygg: id, niva: g[id] };
    } else if (handling === "offer") {
      if (g.sist_offer === idag) return feil(409, "Du har allerede ofret til gudene i dag.");
      g.streak = g.sist_offer === dag(naaMs - 86400000) ? Math.min(7, g.streak + 1) : 1;
      g.sist_offer = idag;
      const gave = offergave(g.streak);
      for (const [r, n] of Object.entries(gave)) g[r] += n;
      sist = { type: "offer", streak: g.streak, fikk: gave };
    } else if (handling === "skjenk" || handling === "nask") {
      const til = typeof b.til === "string" ? b.til : "";
      const mal = til && til !== meg ? await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(til).first() : null;
      if (!mal) return feil(404, "Den spilleren har ikke flyttet inn ennå.");
      if (handling === "skjenk") {
        try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'skjenk', ?)").bind(meg, til, idag).run(); }
        catch (_) { return feil(409, `Du har allerede skjenket ${til} i dag.`); }
        const gave = skjenkGave(g, bonus(meg));
        // Har naboen allerede skjenket meg i dag, er dette en gjengjeldt skål og gir mer ære
        const gjengjeld = !!(await db.prepare("SELECT 1 AS ja FROM symposion_handling WHERE fra = ? AND til = ? AND type = 'skjenk' AND dag = ?").bind(til, meg, idag).first());
        const aere = REGLER.skjenkAere + (gjengjeld ? REGLER.gjengjeldAere : 0);
        for (const [r, n] of Object.entries(gave)) g[r] -= n;
        if (Object.keys(gave).length) await db.prepare(`UPDATE symposion_gods SET ${Object.keys(gave).map((r) => `${r} = ${r} + ?`).join(", ")} WHERE navn = ?`).bind(...Object.values(gave), til).run();
        g.aere += aere;
        const gaveTekst = prisTekst(gave) || "et tomt glass";
        await varsle(db, [til], { avsender: meg, type: "symposion", tekst: gjengjeld ? `skjenket tilbake i Symposion og ga deg ${gaveTekst}. Skål!` : `skjenket deg i Symposion og ga deg ${gaveTekst}. Skjenk tilbake i dag for ekstra ære`, lenke: "symposion.html" });
        await logg(db, meg, gjengjeld ? `skålte med ${til}` : `skjenket ${til}`);
        sist = { type: "skjenk", til, ga: gave, aere, gjengjeld };
        // Dagens runde: den som skjenker mange nok på én dag, får én times avling på toppen
        const [gjort, andre] = await Promise.all([
          db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = 'skjenk' AND dag = ?").bind(meg, idag).first(),
          db.prepare("SELECT COUNT(*) AS n FROM symposion_gods WHERE navn <> ?").bind(meg).first(),
        ]);
        if (gjort.n === Math.min(REGLER.rundeMal, andre.n)) {
          const runde = rundeGave(g, bonus(meg));
          for (const [r, n] of Object.entries(runde)) g[r] += n;
          g.aere += REGLER.rundeAere;
          await logg(db, meg, "tok dagens runde og skjenket hele nabolaget");
          sist.runde = { fikk: runde, aere: REGLER.rundeAere };
        }
      } else {
        const brukt = await db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = 'nask' AND dag = ?").bind(meg, idag).first();
        if (brukt.n >= REGLER.naskPerDag + (await kjopt("nask"))) return feil(409, "Du har nasket nok for i dag. Gudene ser deg.");
        gjorOpp(mal, naaMs, bonus(til));
        const bytte = naskBytte(mal);
        if (bytte < REGLER.naskMin) return feil(409, folk(mal).nattevakt && mal.l_oliven * REGLER.naskAndel >= REGLER.naskMin ? `Nattevakten til ${til} jaget deg bort.` : `${til} har nettopp høstet. Det er ingenting å naske.`);
        try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'nask', ?)").bind(meg, til, idag).run(); }
        catch (_) { return feil(409, `Du har allerede nasket fra ${til} i dag.`); }
        mal.l_oliven -= bytte;
        await lagre(db, mal);
        g.oliven += bytte;
        await varsle(db, [til], { avsender: meg, type: "symposion", tekst: `nasket ${bytte} oliven fra lunden din i Symposion. Høst oftere!`, lenke: "symposion.html" });
        await logg(db, meg, `nasket ${bytte} oliven fra ${til}`);
        sist = { type: "nask", til, fikk: { oliven: bytte } };
      }
    } else if (handling === "tagg") {
      const til = typeof b.til === "string" ? b.til : "";
      const mal = til && til !== meg ? await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(til).first() : null;
      if (!mal) return feil(404, "Den spilleren har ikke flyttet inn ennå.");
      const tekst = (typeof b.tekst === "string" ? b.tekst : "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, REGLER.taggMaks);
      if (!tekst) return feil(400, "Skriv noe først.");
      if (tagger.has(til)) return feil(409, `Huset til ${til} er allerede tagget. Han må vaske først.`);
      const brukt = await db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = 'tagg' AND dag = ?").bind(meg, idag).first();
      if (brukt.n >= REGLER.taggPerDag + (await kjopt("tagg"))) return feil(409, "Spraybøksa er tom for i dag.");
      try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'tagg', ?)").bind(meg, til, idag).run(); }
      catch (_) { return feil(409, `Du har allerede tagget ${til} i dag.`); }
      // Produksjonen fram til nå regnes med full fart, deretter med straff
      gjorOpp(mal, naaMs, bonus(til));
      await lagre(db, mal);
      const FARGER = ["#e0533d", "#4fc3a1", "#f2c14e", "#b07cf0", "#5fa8f0", "#f07cb8"];
      const farge = FARGER.includes(b.farge) ? b.farge : FARGER[Math.floor(Math.random() * FARGER.length)];
      await db.prepare("INSERT INTO symposion_tagg (til, fra, tekst, farge, opprettet) VALUES (?, ?, ?, ?, ?)").bind(til, meg, tekst, farge, naa).run();
      tagger.set(til, { til, fra: meg, tekst, farge, opprettet: naa });
      await varsle(db, [til], { avsender: meg, type: "symposion", tekst: `tagget huset ditt i Symposion: «${tekst}». Vask det bort før det går ut over avlingen`, lenke: "symposion.html" });
      await logg(db, meg, `tagget huset til ${til}: «${tekst}»`);
      sist = { type: "tagg", til };
    } else if (handling === "vask") {
      const t = tagger.get(meg);
      if (!t) return feil(400, "Huset ditt er rent.");
      await db.prepare("DELETE FROM symposion_tagg WHERE til = ?").bind(meg).run();
      tagger.delete(meg);
      await logg(db, meg, `vasket bort «${t.tekst}» fra huset sitt`);
      sist = { type: "vask", fra: t.fra };
    } else if (handling === "kjop") {
      const id = b.vare;
      const vare = REGLER.butikk[id];
      if (!vare) return feil(400, "Ukjent vare.");
      if (!har(g, vare.pris)) return feil(400, `Du har ikke råd. Det koster ${prisTekst(vare.pris)}.`);
      if (vare.perDag) {
        const n = await kjopt(id);
        if (n >= vare.perDag) return feil(409, `Du kan bare kjøpe ${vare.navn.toLowerCase()} ${vare.perDag} ganger om dagen.`);
        await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, ?, ?)").bind(meg, String(n + 1), `kjop-${id}`, idag).run();
      } else if (id === "slave") {
        const fra = g.slave_til && g.slave_til > naa ? Date.parse(g.slave_til) : naaMs;
        g.slave_til = new Date(fra + vare.dager * 24 * TIME).toISOString();
        await logg(db, meg, "ansatte en vaskeslave");
      } else if (id === "statue") {
        try { await db.prepare("INSERT INTO symposion_statue (navn, opprettet) VALUES (?, ?)").bind(meg, naa).run(); }
        catch (_) { return feil(409, "Du har allerede en statue på agoraen."); }
        await logg(db, meg, "reiste en statue av seg selv på agoraen");
        const alle = (await db.prepare("SELECT navn FROM symposion_gods").all()).results.map((x) => x.navn);
        await varsle(db, alle, { avsender: meg, type: "symposion", tekst: "reiste en statue av seg selv på agoraen i Symposion", lenke: "symposion.html" });
      }
      for (const [r, n] of Object.entries(vare.pris)) g[r] -= n;
      sist = { type: "kjop", vare: id, navn: vare.navn };
    } else if (handling === "ansett") {
      const hvem = b.hvem;
      const regel = REGLER.ansatte[hvem];
      if (!regel) return feil(400, "Ukjent stilling.");
      const f = folk(g), niva = f[hvem] || 0;
      if (niva >= REGLER.ansattMaks) return feil(400, `${regel.navn} kan ikke forfremmes mer.`);
      const krav = regel.bygg ? [regel.bygg, 1] : regel.krever;
      if ((g[krav[0]] || 0) < krav[1]) return feil(400, regel.bygg ? `Du trenger ${REGLER.bygg[krav[0]].navn.toLowerCase()} først.` : `Krever ${REGLER.bygg[krav[0]].navn.toLowerCase()} på nivå ${krav[1]}.`);
      const pris = lonn(hvem, niva);
      if (!har(g, pris)) return feil(400, `Du har ikke råd. Det koster ${prisTekst(pris)}.`);
      for (const [r, n] of Object.entries(pris)) g[r] -= n;
      // Lageret gjøres opp med gammel fart før den nye gjelder (gjorOpp er allerede kjørt for denne forespørselen)
      f[hvem] = niva + 1;
      if (niva === 0) await logg(db, meg, `ansatte ${regel.en}`);
      sist = { type: "ansett", hvem, navn: regel.navn, niva: f[hvem] };
    } else if (handling === "fest") {
      const fi = festInfo(g, bonus(meg));
      if (!fi.ansatte) return feil(400, "Du har ingen å feste med ennå. Ansett noen først.");
      if (await db.prepare("SELECT 1 AS ja FROM symposion_handling WHERE fra = ? AND type = 'fest' AND dag = ?").bind(meg, idag).first()) return feil(409, "Folkene dine har festet nok for i dag.");
      if (!har(g, fi.pris)) return feil(400, `Du har ikke råd. Festen koster ${prisTekst(fi.pris)}.`);
      await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'fest', ?)").bind(meg, meg, idag).run();
      for (const [r, n] of Object.entries(fi.pris)) g[r] -= n;
      // Lageret er allerede gjort opp til nå, så festen gjelder bare fra nå av
      g.fest_til = new Date(naaMs + REGLER.fest.varer * TIME).toISOString();
      g.aere += fi.aere;
      await logg(db, meg, "holdt fest for folkene på godset");
      sist = { type: "fest", aere: fi.aere, pris: fi.pris };
    } else if (handling === "tokt") {
      const t = REGLER.tokt[b.mal];
      if (!t) return feil(400, "Ukjent reisemål.");
      if (!g.havn) return feil(400, "Du må bygge havn først.");
      if (toktNaa(g)) return feil(409, "Skipet ditt er allerede ute.");
      if (t.havn && g.havn < t.havn) return feil(400, `${t.navn} krever havn på nivå ${t.havn}.`);
      if (!har(g, t.pris)) return feil(400, `Du har ikke råd. Toktet koster ${prisTekst(t.pris)}.`);
      for (const [r, n] of Object.entries(t.pris)) g[r] -= n;
      // Lasten trekkes når skipet legger fra, så ingen kan prøve seg fram
      const terning = Math.random();
      const hendelse = terning < 0.12 ? "storm" : terning < 0.24 ? "medvind" : null;
      const faktor = (1 + REGLER.toktLast * (g.havn - 1)) * (hendelse === "storm" ? 0.5 : hendelse === "medvind" ? 1.5 : 1);
      const last = Object.fromEntries(Object.entries(t.gir).map(([r, [fra, til]]) => [r, Math.max(1, Math.round((fra + Math.random() * (til - fra)) * faktor))]));
      const timer = t.timer * (ferdige.includes("fyr") ? REGLER.fyrFart : 1);
      g.tokt = JSON.stringify({ mal: b.mal, ut: naa, hjem: new Date(naaMs + timer * TIME).toISOString(), last, hendelse });
      sist = { type: "tokt", mal: t.navn };
    } else if (handling === "loss") {
      const t = toktNaa(g);
      if (!t) return feil(400, "Skipet ligger allerede til kai.");
      if (Date.parse(t.hjem) > naaMs) return feil(409, "Skipet er ikke hjemme ennå.");
      const regel = REGLER.tokt[t.mal];
      for (const [r, n] of Object.entries(t.last)) g[r] = (g[r] || 0) + n;
      g.tokt = null;
      if (regel.timer >= 8) await logg(db, meg, `fikk skipet hjem fra ${regel.navn} med ${prisTekst(t.last)}${t.hendelse === "storm" ? ", etter storm" : t.hendelse === "medvind" ? ", i strålende medvind" : ""}`);
      sist = { type: "loss", mal: regel.navn, fikk: t.last, hendelse: t.hendelse };
    } else if (handling === "gi") {
      const m = await monumentStatus(db, ferdige);
      if (!m) return feil(400, "Alle monumentene er ferdige.");
      const r = b.ressurs;
      if (!(r in m.krav)) return feil(400, "Monumentet trenger ikke det.");
      const n = Math.min(Math.floor(Number(b.antall) || 0), Math.floor(g[r] || 0), m.krav[r] - m.gitt[r]);
      if (n <= 0) return feil(400, m.krav[r] - m.gitt[r] <= 0 ? `Monumentet trenger ikke mer ${rn(r)}.` : `Du har ikke ${rn(r)} å gi.`);
      g[r] -= n;
      const aere = Math.max(1, Math.round((n * REGLER.vekt[r]) / 10));
      g.aere += aere;
      await db.prepare(`INSERT INTO symposion_bidrag (navn, monument, oliven, vin, marmor, ${r === "oliven" || r === "vin" || r === "marmor" ? "" : `${r}, `}opprettet) VALUES (?, ?, ?, ?, ?, ${r === "oliven" || r === "vin" || r === "marmor" ? "" : "?, "}?)`)
        .bind(...[meg, m.id, r === "oliven" ? n : 0, r === "vin" ? n : 0, r === "marmor" ? n : 0, ...(["oliven", "vin", "marmor"].includes(r) ? [] : [n]), naa]).run();
      m.gitt[r] += n;
      sist = { type: "gi", ressurs: r, antall: n, aere };
      if (Object.keys(m.krav).every((x) => m.gitt[x] >= m.krav[x])) {
        await db.prepare("INSERT OR IGNORE INTO symposion_ferdig (monument, ferdig) VALUES (?, ?)").bind(m.id, naa).run();
        ferdige = [...ferdige, m.id];
        await logg(db, meg, `la siste stein på ${m.navn}. Alle får 10 % mer av alt!`);
        const alle = (await db.prepare("SELECT navn FROM symposion_gods").all()).results.map((x) => x.navn);
        await varsle(db, alle, { avsender: meg, type: "symposion", tekst: `la siste stein på ${m.navn} i Symposion. Alle produserer nå 10 % mer`, lenke: "symposion.html" });
        sist.ferdig = m.navn;
      }
    } else {
      return feil(404, "Ukjent handling.");
    }
  }
  if (g) {
    const for_ = await db.prepare("SELECT aere, rang_min FROM symposion_gods WHERE navn = ?").bind(meg).first();
    if (for_ && rangAv(g) > rangAv(for_)) {
      const tittel = REGLER.ranger[rangAv(g)].tittel;
      await logg(db, meg, `ble utnevnt til ${tittel.toLowerCase()}`);
      sist = { ...(sist || {}), nyRang: tittel };
    }
    await lagre(db, g);
  }

  // ---------- Tilstanden siden skal tegne ----------
  const statuer = (await db.prepare("SELECT navn FROM symposion_statue ORDER BY opprettet").all()).results.map((x) => x.navn);
  const [alle, mine, tilMeg, loggRader] = await Promise.all([
    db.prepare("SELECT * FROM symposion_gods ORDER BY opprettet, navn").all(),
    db.prepare("SELECT til, type FROM symposion_handling WHERE fra = ? AND dag = ?").bind(meg, idag).all(),
    db.prepare("SELECT fra FROM symposion_handling WHERE til = ? AND type = 'skjenk' AND dag = ?").bind(meg, idag).all(),
    db.prepare("SELECT navn, tekst, opprettet FROM symposion_logg ORDER BY id DESC LIMIT 14").all(),
  ]);
  const monument = await monumentStatus(db, ferdige);
  let bidrag = [];
  if (monument) {
    const v = REGLER.vekt;
    bidrag = (await db.prepare(`SELECT navn, SUM(${ALLE.map((r) => `${r} * ${v[r]}`).join(" + ")}) AS verdi FROM symposion_bidrag WHERE monument = ? GROUP BY navn ORDER BY verdi DESC`).bind(monument.id).all()).results;
  }
  const gjort = (til, type) => mine.results.some((h) => h.til === til && h.type === type);
  const bon = bonus();
  const spillere = alle.results.map((x) => {
    const kopi = gjorOpp({ ...x }, naaMs, bonus(x.navn));
    const t = tagger.get(x.navn);
    return {
      navn: x.navn, aere: x.aere, rang: rangAv(x), slave: !!(x.slave_til && x.slave_til > naa),
      fest: festPaa(x, naaMs), bygg: { lund: x.lund, vingard: x.vingard, brudd: x.brudd, bigard: x.bigard || 0, gruve: x.gruve || 0, villa: x.villa, havn: x.havn || 0 },
      skip: x.havn ? (x.tokt ? "ute" : "kai") : null, ansatte: Object.values(folk(x)).reduce((a, n) => a + (n > 0 ? 1 : 0), 0),
      hjemme: naaMs - Date.parse(x.sist_sett) < 24 * TIME,
      skjenket: gjort(x.navn, "skjenk"), skjenketMeg: tilMeg.results.some((h) => h.fra === x.navn), nasket: gjort(x.navn, "nask"),
      bytte: naskBytte(kopi),
      tagg: t ? { fra: t.fra, tekst: t.tekst, farge: t.farge, opprettet: t.opprettet } : null,
      tagget: gjort(x.navn, "tagg"),
    };
  });
  let jeg = null;
  if (g) {
    const kostnader = {}, apen = {};
    for (const [id, regel] of Object.entries(REGLER.bygg)) {
      kostnader[id] = g[id] < maksNiva(id) ? kost(id, g[id]) : null;
      apen[id] = !regel.krever || g[regel.krever[0]] >= regel.krever[1];
    }
    const r = rater(g, bonus(meg));
    const f = folk(g);
    const ansatte = Object.fromEntries(Object.entries(REGLER.ansatte).map(([id, a]) => {
      const krav = a.bygg ? [a.bygg, 1] : a.krever, niva = f[id] || 0;
      return [id, { niva, apen: (g[krav[0]] || 0) >= krav[1], krever: krav, kost: niva < REGLER.ansattMaks ? lonn(id, niva) : null }];
    }));
    const t = toktNaa(g);
    const lastFaktor = 1 + REGLER.toktLast * Math.max(0, g.havn - 1), fart = ferdige.includes("fyr") ? REGLER.fyrFart : 1;
    const reisemal = Object.fromEntries(Object.entries(REGLER.tokt).map(([id, x]) => [id, {
      navn: x.navn, timer: x.timer * fart, pris: x.pris, apen: !x.havn || g.havn >= x.havn, havn: x.havn || 1,
      gir: Object.fromEntries(Object.entries(x.gir).map(([rr, [a, b]]) => [rr, [Math.round(a * lastFaktor), Math.round(b * lastFaktor)]])),
    }]));
    const skjenketIdag = mine.results.filter((h) => h.type === "skjenk").length, rundeMal = Math.min(REGLER.rundeMal, alle.results.length - 1);
    const fi = festInfo(g, bonus(meg));
    jeg = {
      fest: { ...fi, holdt: mine.results.some((h) => h.type === "fest"), til: festPaa(g, naaMs) ? g.fest_til : null, bonus: REGLER.fest.bonus, varer: REGLER.fest.varer },
      skjenk: { gave: skjenkGave(g, bonus(meg)), aere: REGLER.skjenkAere, gjengjeldAere: REGLER.gjengjeldAere,
        runde: { gjort: skjenketIdag, mal: rundeMal, fikk: rundeGave(g, bonus(meg)), aere: REGLER.rundeAere } },
      ansatte, reisemal, tokt: t ? { mal: t.mal, navn: REGLER.tokt[t.mal].navn, ut: t.ut, hjem: t.hjem, hjemme: Date.parse(t.hjem) <= naaMs } : null,
      navn: meg, aere: g.aere, streak: g.streak, kanOfre: g.sist_offer !== idag,
      nesteOffer: offergave(g.sist_offer === dag(naaMs - 86400000) || g.sist_offer === idag ? Math.min(7, g.streak + (g.sist_offer === idag ? 0 : 1)) : 1),
      beholdning: Object.fromEntries(ALLE.map((x) => [x, g[x] || 0])),
      lager: Object.fromEntries(RESSURSER.map((x) => [x, g[`l_${x}`] || 0])),
      rater: r, tak: Object.fromEntries(RESSURSER.map((x) => [x, r[x] * takTimer(g)])), takTimer: takTimer(g),
      bygg: Object.fromEntries(Object.keys(REGLER.bygg).map((id) => [id, g[id] || 0])),
      kost: kostnader, apen,
      naskIgjen: REGLER.naskPerDag + mine.results.filter((h) => h.type === "kjop-nask").length - mine.results.filter((h) => h.type === "nask").length,
      taggIgjen: REGLER.taggPerDag + mine.results.filter((h) => h.type === "kjop-tagg").length - mine.results.filter((h) => h.type === "tagg").length,
      rang: rangAv(g), slaveTil: g.slave_til && g.slave_til > naa ? g.slave_til : null,
      kjopt: { tagg: mine.results.filter((h) => h.type === "kjop-tagg").length, nask: mine.results.filter((h) => h.type === "kjop-nask").length, statue: statuer.includes(meg) },
    };
  }
  return json({
    naa, meg: jeg, spillere, statuer, monument, bidrag, ferdige, bonus: bon, sist,
    regler: { bygg: REGLER.bygg, maksNiva: REGLER.maksNiva, navn: REGLER.navn, produsert: RESSURSER, alle: ALLE, ansatte: REGLER.ansatte, ansattMaks: REGLER.ansattMaks, ansattProd: REGLER.ansattProd, vaktAndel: REGLER.vaktAndel, toktLast: REGLER.toktLast,
      monumenter: REGLER.monumenter.map(({ id, navn }) => ({ id, navn })), fest: REGLER.fest, naskPerDag: REGLER.naskPerDag, rundeMal: REGLER.rundeMal, rundeAere: REGLER.rundeAere, skjenkAere: REGLER.skjenkAere, gjengjeldAere: REGLER.gjengjeldAere, ranger: REGLER.ranger, butikk: REGLER.butikk, taggPerDag: REGLER.taggPerDag, taggMaks: REGLER.taggMaks, taggStraff: REGLER.taggStraff },
    logg: loggRader.results,
  });
}
