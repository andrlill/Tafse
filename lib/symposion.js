// SYMPOSION: regler og serverlogikk for den felles greske byen.
// Alt regnes ut på serveren, så ingen kan jukse med klokka. Tallene under kan justeres fritt.

const TIME = 3600000;

import { OKONOMI, PAUSE as OKONOMI_PAUSE, aktiveAvtaler } from "./hotellokonomi.js";

export const REGLER = {
  maksNiva: 10,
  vekst: 1.65,             // hvert nivå koster så mye mer enn det forrige
  startOliven: 120,
  takGrunn: 3,             // lageret rommer (3 + villanivå) timer med produksjon
  monumentBonus: 0.1,      // hvert ferdige monument gir alle +10 % produksjon
  skjenkAndel: 0.1,        // man gir bort 10 % av det godset produserer i timen, av hver råvare
  skjenkMinst: 10,         // men aldri mindre enn 10 av det godset lager mest av
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
  // Blindt grep: nask man har kjøpt på torget, tar en tilfeldig råvare fra naboens lager, mellom 0 og
  // 50 % av den. Høye andeler er sjeldne: andelen er maks × (tilfeldig tall)^skjevhet. Med skjevhet 3
  // er snittet 12,5 %, halvparten av grepene gir under 6 %, og 7 % av dem gir over 40 % (et kupp).
  grep: { maks: 0.5, skjevhet: 3, kupp: 0.4 },
  taggPerDag: 2,           // så mange hus man kan tagge om dagen
  taggMaks: 24,            // tegn i en tagg
  taggStraff: 0.15,        // et tagget hus produserer 15 % mindre til det er vasket
  vekt: { oliven: 1, vin: 1.5, marmor: 2.5, honning: 2, solv: 4, krydder: 5, purpur: 6 }, // verdi når man gir til monumentet
  aerePerVerdi: 10,        // gaver til byggverkene gir 1 ære per 10 i verdi (10 oliven, 4 marmor ...)
  navn: { oliven: "oliven", vin: "vin", marmor: "marmor", honning: "honning", solv: "sølv", purpur: "purpur", krydder: "krydder" },
  // Rang etter all ære man har fått
  ranger: [
    { fra: 0, tittel: "Borger" },
    { fra: 200, tittel: "Rådsmann", pynt: "flagg" },
    { fra: 500, tittel: "Kvestor", pynt: "amforaer" },
    { fra: 1000, tittel: "Senator", pynt: "krans" },
    { fra: 1800, tittel: "Pretor", pynt: "mosaikk" },
    // Titlene over Pretor gir ingen pynt av seg selv. De åpner retten til å bygge et nytt hus (REGLER.hus).
    { fra: 3000, tittel: "Arkont" },
    { fra: 4500, tittel: "Strateg" },
    { fra: 6500, tittel: "Konsul" },
    { fra: 9000, tittel: "Symposiark" },
    { fra: 13000, tittel: "Heros" },
  ],
  // HUSENE: etter Pretor åpner hver ny tittel retten til et nytt hus, som må betales med alle sju
  // råvarene. Fordelene og pynten legger seg oppå hverandre. rang er plassen i REGLER.ranger.
  hus: [
    { id: "domus", navn: "Domus", rang: 5, pynt: "statue", pris: { oliven: 8000, vin: 5000, marmor: 3000, honning: 600, solv: 200, krydder: 150, purpur: 60 },
      fordeler: ["Lageret rommer 2 timer mer", "De ansatte kan forfremmes til nivå 6"] },
    { id: "palass", navn: "Palass", rang: 6, pynt: "fontene", pris: { oliven: 14000, vin: 9000, marmor: 5500, honning: 1100, solv: 350, krydder: 250, purpur: 100 },
      fordeler: ["Ett ekstra gratis nask og én ekstra tagg om dagen", "Festen varer 12 timer i stedet for 8"] },
    { id: "kongsgard", navn: "Kongsgård", rang: 7, pynt: "orn", pris: { oliven: 25000, vin: 16000, marmor: 10000, honning: 2000, solv: 650, krydder: 450, purpur: 200 },
      fordeler: ["Et andre skip, så du kan ha to tokt ute samtidig"] },
    { id: "hall", navn: "Symposiarkens hall", rang: 8, pynt: "fakler", pris: { oliven: 45000, vin: 29000, marmor: 18000, honning: 3500, solv: 1200, krydder: 800, purpur: 350 },
      fordeler: ["Dagens offer gir dobbelt", "Alt godset lager, øker med 5 %"] },
    { id: "olympos", navn: "Olympos", rang: 9, pynt: "stjerne", pris: { oliven: 80000, vin: 52000, marmor: 32000, honning: 6500, solv: 2100, krydder: 1500, purpur: 650 },
      fordeler: ["Alt godset lager, øker med 5 % til", "Huset ditt lyser over hele øya"] },
  ],

  // Torget: småting som kjøpes for råvarer
  butikk: {
    tagg: { navn: "Ekstra spraybøks", tekst: "Én tagg til i dag.", pris: { vin: 150 }, perDag: 3 },
    nask: { navn: "Lange fingre", tekst: "Ett blindt grep i lageret til hvem du vil, også naboer du har nasket fra i dag. Du ser først etterpå hva du fikk.", pris: { oliven: 200 }, perDag: 3 },
    slave: { navn: "Vaskeslave", tekst: "I sju dager vasker han bort tagger på huset ditt en time etter at de kom.", pris: { oliven: 600, vin: 300 }, dager: 7 },
    statue: { navn: "Statue på agoraen", tekst: "Deg i marmor, midt i byen. For alltid.", pris: { marmor: 2500, vin: 1000 }, engang: true },
  },
  // Fest for folkene på godset: én gang om dagen, koster en times produksjon av oliven og vin
  // (og honning, om man har bigård). Gir ære etter hvor mange ansatte man har, og alle jobber
  // bedre en stund etterpå.
  // Praktfesten koster krydder og purpur fra toktene i tillegg, gir dobbel ære og varer dobbelt så lenge.
  // Festen koster en times oliven, vin og honning og gir 15 % mer av alt i 8 timer, altså 1,2 timer av alt.
  // Den går dermed litt i pluss, så lenge man høster før lageret blir fullt.
  fest: { timerKost: 1, aereGrunn: 10, aerePerNiva: 2, bonus: 0.15, varer: 8, prakt: { pris: { krydder: 30, purpur: 15 }, ganger: 2 } },
  slaveVenter: 1,          // timer før vaskeslaven vasker
  bygg: {
    lund: { navn: "Olivenlund", gir: "oliven", perTime: 20 },
    vingard: { navn: "Vingård", gir: "vin", perTime: 14, krever: ["lund", 2] },
    brudd: { navn: "Marmorbrudd", gir: "marmor", perTime: 9, krever: ["vingard", 2] },
    bigard: { navn: "Bigård", gir: "honning", perTime: 6, krever: ["lund", 4] },
    gruve: { navn: "Sølvgruve", gir: "solv", perTime: 4, krever: ["brudd", 3] },
    // Villaen bygges opp til nivå 6. Etter det tar husene over (REGLER.hus). De som kom høyere før, beholder nivået.
    villa: { navn: "Villa", maks: 6 },
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
    // Fyrtårnet kommer tidlig, så det skipene henter hjem, får et formål
    { id: "fyr", navn: "Fyrtårnet", tekst: "Viser skipene hjem. Toktene går 20 % raskere når det står.", krav: { marmor: 8000, solv: 1500, krydder: 1500, purpur: 800 } },
    { id: "teater", navn: "Amfiteateret", tekst: "For taler, sang og dårlige vitser.", krav: { oliven: 12000, vin: 9000, marmor: 7000 } },
    { id: "koloss", navn: "Tafsekolossen", tekst: "En borger i bronse, med hevet beger.", krav: { oliven: 30000, vin: 24000, marmor: 20000 } },
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
const toktNaa = (g, kol = "tokt") => { try { return g[kol] ? JSON.parse(g[kol]) : null; } catch (_) { return null; } };
// Husenes fordeler. h er antall hus man har bygget (0 til 5).
const husNiva = (g) => (g && g.hus) || 0;
const HUSFORDEL = {
  lager: (h) => (h >= 1 ? 2 : 0),
  ansattMaks: (h) => REGLER.ansattMaks + (h >= 1 ? 1 : 0),
  nask: (h) => REGLER.naskPerDag + (h >= 2 ? 1 : 0),
  tagg: (h) => REGLER.taggPerDag + (h >= 2 ? 1 : 0),
  festTimer: (h) => (h >= 2 ? 4 : 0),
  skip: (h) => (h >= 3 ? 2 : 1),
  offer: (h) => (h >= 4 ? 2 : 1),
  produksjon: (h) => 1 + (h >= 4 ? 0.05 : 0) + (h >= 5 ? 0.05 : 0),
};
const TOKTKOL = ["tokt", "tokt2"];
const skipene = (g) => (g.havn ? TOKTKOL.slice(0, HUSFORDEL.skip(husNiva(g))) : []);

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
  // Husene etter Pretor, og det andre skipet som følger med Kongsgården
  "ALTER TABLE symposion_gods ADD COLUMN hus INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE symposion_gods ADD COLUMN tokt2 TEXT",
  ...["honning", "solv", "purpur", "krydder"].map((k) => `ALTER TABLE symposion_bidrag ADD COLUMN ${k} INTEGER NOT NULL DEFAULT 0`),
];

export const rang = (aere) => {
  let i = 0;
  REGLER.ranger.forEach((r, j) => { if (aere >= r.fra) i = j; });
  return i;
};
// Rangen til et gods følger æren på dagens stige. (Kolonnen rang_min, som en stund beskyttet
// titler fra den gamle stigen, brukes ikke lenger.)
const rangAv = (g) => rang(g.aere);

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
// Gaven når g skjenker: 10 % av timesproduksjonen av hver råvare, og minst 10 av den godset lager
// mest av. Gaven trekkes fra beholdningen. Har man ikke nok av hovedråvaren, kan man ikke skjenke;
// de andre råvarene blir med når man har dem.
const skjenkGave = (g, bonus) => {
  const r = Object.entries(rater(g, bonus)).filter(([, n]) => n > 0);
  const hoved = r.reduce((a, x) => (x[1] > a[1] ? x : a), ["oliven", 0])[0];
  const gave = Object.fromEntries(r.map(([x, n]) => [x, Math.max(x === hoved ? REGLER.skjenkMinst : 1, Math.round(n * REGLER.skjenkAndel))]).filter(([x, n]) => Math.floor(g[x] || 0) >= n));
  return { gave, hoved, kan: hoved in gave };
};
const rundeGave = (g, bonus) => Object.fromEntries(Object.entries(rater(g, bonus)).map(([r, n]) => [r, Math.floor(n)]).filter(([, n]) => n > 0));
// _lagerleie settes på godset når eieren har leid kjelleren i hotellet (se merk() i symposion())
const takTimer = (g) => REGLER.takGrunn + g.villa + (folk(g).forvalter || 0) + (g._lagerleie || 0) + HUSFORDEL.lager(husNiva(g));
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
function festInfo(g, bonus, prakt = false) {
  const F = REGLER.fest, r = rater(g, bonus, false), f = folk(g);
  const pris = {};
  for (const x of ["oliven", "vin", "honning"]) {
    const n = Math.round((r[x] || 0) * F.timerKost / 5) * 5;
    if (n > 0) pris[x] = n;
  }
  const nivaer = Object.values(f).reduce((a, n) => a + (n || 0), 0);
  const aere = nivaer ? F.aereGrunn + F.aerePerNiva * nivaer : 0;
  if (prakt) Object.assign(pris, F.prakt.pris);
  const timer = (F.varer + HUSFORDEL.festTimer(husNiva(g))) * (prakt ? F.prakt.ganger : 1);
  // Det festen gir i ekstra produksjon, hvis man høster før lageret er fullt
  const gevinst = Object.fromEntries(Object.entries(r).filter(([, n]) => n > 0).map(([x, n]) => [x, Math.round(n * F.bonus * timer)]));
  return { pris, gevinst, aere: aere * (prakt ? F.prakt.ganger : 1), timer, ansatte: nivaer };
}

const KOLONNER = [...ALLE, ...RESSURSER.map((r) => `l_${r}`), "lund", "vingard", "brudd", "bigard", "gruve", "villa", "havn", "aere", "aere_brukt", "slave_til", "ansatte", "tokt", "tokt2", "hus", "fest_til", "streak", "sist_offer", "oppdatert", "sist_sett"];
const lagre = (db, g) => {
  if (g._folk) g.ansatte = JSON.stringify(g._folk);
  const verdi = (k) => (g[k] === undefined || g[k] === null ? (["slave_til", "ansatte", "tokt", "tokt2", "fest_til", "sist_offer"].includes(k) ? null : 0) : g[k]);
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
  // Avtaler fra hotellet (lib/hotellokonomi.js): handelsavtalen gir mer av alt, lagerleien større lager, losen raskere tokt
  const avtaler = await aktiveAvtaler(db, naa);
  const harAvtale = (navn, type) => !!(avtaler.get(navn) && avtaler.get(navn).has(type));
  const merk = (x) => { if (x && harAvtale(x.navn, "lager")) x._lagerleie = OKONOMI.avtaler.lager.timer; return x; };
  // Husene gir de to øverste mer produksjon
  const husAv = new Map((await db.prepare("SELECT navn, hus FROM symposion_gods").all()).results.map((x) => [x.navn, x.hus || 0]));
  const bonus = (navn) => HUSFORDEL.produksjon(husAv.get(navn) || 0) * (1 + REGLER.monumentBonus * ferdige.length) * (navn && tagger.has(navn) ? 1 - REGLER.taggStraff : 1) * (navn && harAvtale(navn, "handel") ? 1 + OKONOMI.avtaler.handel.bonus : 1);
  // Vaskeslavene gjør jobben sin: tagger eldre enn en time på hus med aktiv slave vaskes bort
  for (const t of [...tagger.values()]) {
    if (naaMs - Date.parse(t.opprettet) < REGLER.slaveVenter * TIME) continue;
    const eier = merk(await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(t.til).first());
    if (!eier || !eier.slave_til || eier.slave_til < t.opprettet) continue;
    gjorOpp(eier, naaMs, bonus(t.til));
    await lagre(db, eier);
    await db.prepare("DELETE FROM symposion_tagg WHERE til = ?").bind(t.til).run();
    tagger.delete(t.til);
    await logg(db, t.til, `fikk vaskeslaven sin til å fjerne «${t.tekst}» fra huset`);
  }
  // Skip som er kommet hjem: eieren får beskjed i bjella, én gang. Den som selv er inne nå, ser det på siden.
  for (const x of (await db.prepare("SELECT navn, tokt, tokt2 FROM symposion_gods WHERE tokt IS NOT NULL OR tokt2 IS NOT NULL").all()).results) {
    for (const kol of TOKTKOL) {
      const t = toktNaa(x, kol);
      if (!t || t.varslet || Date.parse(t.hjem) > naaMs) continue;
      t.varslet = true;
      await db.prepare(`UPDATE symposion_gods SET ${kol} = ? WHERE navn = ? AND ${kol} = ?`).bind(JSON.stringify(t), x.navn, x[kol]).run();
      if (x.navn !== meg) await varsle(db, [x.navn], { avsender: "Havnefogden", type: "symposion", tekst: `melder at skipet ditt er hjemme fra ${REGLER.tokt[t.mal].navn}. Loss det i Symposion`, lenke: "symposion.html" });
    }
  }
  let g = merk(await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first());
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
      const regel = Object.hasOwn(REGLER.bygg, id) ? REGLER.bygg[id] : null;
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
      const gave = Object.fromEntries(Object.entries(offergave(g.streak)).map(([r, n]) => [r, n * HUSFORDEL.offer(husNiva(g))]));
      for (const [r, n] of Object.entries(gave)) g[r] += n;
      sist = { type: "offer", streak: g.streak, fikk: gave };
    } else if (handling === "skjenk" || handling === "nask") {
      const til = typeof b.til === "string" ? b.til : "";
      const mal = til && til !== meg ? merk(await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(til).first()) : null;
      if (!mal) return feil(404, "Den spilleren har ikke flyttet inn ennå.");
      if (handling === "skjenk") {
        const { gave, hoved, kan } = skjenkGave(g, bonus(meg));
        if (!kan) return feil(400, `Du har for lite ${rn(hoved)} til å skjenke. Høst først.`);
        try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'skjenk', ?)").bind(meg, til, idag).run(); }
        catch (_) { return feil(409, `Du har allerede skjenket ${til} i dag.`); }
        // Har naboen allerede skjenket meg i dag, er dette en gjengjeldt skål og gir mer ære
        const gjengjeld = !!(await db.prepare("SELECT 1 AS ja FROM symposion_handling WHERE fra = ? AND til = ? AND type = 'skjenk' AND dag = ?").bind(til, meg, idag).first());
        const aere = REGLER.skjenkAere + (gjengjeld ? REGLER.gjengjeldAere : 0);
        for (const [r, n] of Object.entries(gave)) g[r] -= n;
        await db.prepare(`UPDATE symposion_gods SET ${Object.keys(gave).map((r) => `${r} = ${r} + ?`).join(", ")} WHERE navn = ?`).bind(...Object.values(gave), til).run();
        g.aere += aere;
        const gaveTekst = prisTekst(gave);
        await varsle(db, [til], { avsender: meg, type: "symposion", tekst: gjengjeld ? `skjenket tilbake i Symposion og ga deg ${gaveTekst}. Skål!` : `skjenket deg i Symposion og ga deg ${gaveTekst}. Skjenk tilbake i dag for ekstra ære`, lenke: "symposion.html" });
        // Bare gjengjeldte skåler og dagens runde kommer i Byens røst, ellers drukner alt annet
        if (gjengjeld) await logg(db, meg, `skålte med ${til}`);
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
        // Gratis nask: tre om dagen, ett per nabo. Kjøpte nask (blinde grep) kan brukes på hvem som helst,
        // også naboer man allerede har nasket. De lagres som grep-1, grep-2 ... så hvert grep er en egen rad.
        const [gratis, grep, alleredeNasket] = await Promise.all([
          db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = 'nask' AND dag = ?").bind(meg, idag).first(),
          db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type LIKE 'grep-%' AND dag = ?").bind(meg, idag).first(),
          db.prepare("SELECT 1 AS ja FROM symposion_handling WHERE fra = ? AND til = ? AND type = 'nask' AND dag = ?").bind(meg, til, idag).first(),
        ]);
        const kjoptIgjen = (await kjopt("nask")) - grep.n;
        const brukGratis = gratis.n < HUSFORDEL.nask(husNiva(g)) && !alleredeNasket;
        if (!brukGratis && kjoptIgjen <= 0) return feil(409, alleredeNasket && gratis.n < HUSFORDEL.nask(husNiva(g)) ? `Du har allerede nasket fra ${til} i dag. Kjøp lange fingre for å ta et blindt grep.` : "Du har nasket nok for i dag. Gudene ser deg.");
        gjorOpp(mal, naaMs, bonus(til));
        if (brukGratis) {
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
        } else {
          // Blindt grep: tilfeldig råvare og mengde, avgjort her på serveren
          try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, ?, ?)").bind(meg, til, `grep-${grep.n + 1}`, idag).run(); }
          catch (_) { return feil(409, "Prøv igjen."); }
          const G = REGLER.grep;
          const vakt = Math.max(0, 1 - REGLER.vaktAndel * (folk(mal).nattevakt || 0));
          const fylt = RESSURSER.filter((x) => (mal[`l_${x}`] || 0) >= 1);
          let utfall = "tomt", fikk = {}, andel = 0;
          if (fylt.length) {
            const x = fylt[Math.floor(Math.random() * fylt.length)];
            andel = G.maks * Math.pow(Math.random(), G.skjevhet);
            const n = Math.floor(mal[`l_${x}`] * andel * vakt);
            if (n >= 1) { utfall = andel >= G.kupp ? "kupp" : "grep"; fikk = { [x]: n }; mal[`l_${x}`] -= n; g[x] += n; await lagre(db, mal); }
          }
          const tekst = utfall === "tomt" ? `rotet i lageret ditt i Symposion, men fant ingenting`
            : `stakk hånden i lageret ditt i Symposion og tok ${prisTekst(fikk)}`;
          await varsle(db, [til], { avsender: meg, type: "symposion", tekst, lenke: "symposion.html" });
          if (utfall === "kupp") await logg(db, meg, `gjorde et kupp hos ${til}: ${prisTekst(fikk)}`);
          sist = { type: "grep", til, fikk, utfall, prosent: Math.round(andel * 100) };
        }
      }
    } else if (handling === "tagg") {
      const til = typeof b.til === "string" ? b.til : "";
      const mal = til && til !== meg ? merk(await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(til).first()) : null;
      if (!mal) return feil(404, "Den spilleren har ikke flyttet inn ennå.");
      const tekst = (typeof b.tekst === "string" ? b.tekst : "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, REGLER.taggMaks);
      if (!tekst) return feil(400, "Skriv noe først.");
      if (tagger.has(til)) return feil(409, `Huset til ${til} er allerede tagget. Han må vaske først.`);
      const brukt = await db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = 'tagg' AND dag = ?").bind(meg, idag).first();
      if (brukt.n >= HUSFORDEL.tagg(husNiva(g)) + (await kjopt("tagg"))) return feil(409, "Spraybøksa er tom for i dag.");
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
      const vare = Object.hasOwn(REGLER.butikk, id) ? REGLER.butikk[id] : null;
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
      const regel = typeof hvem === "string" && Object.hasOwn(REGLER.ansatte, hvem) ? REGLER.ansatte[hvem] : null;
      if (!regel) return feil(400, "Ukjent stilling.");
      const f = folk(g), niva = f[hvem] || 0;
      if (niva >= HUSFORDEL.ansattMaks(husNiva(g))) return feil(400, niva < REGLER.ansattMaks + 1 ? `${regel.navn} kan forfremmes til nivå 6 når du har bygget Domus.` : `${regel.navn} kan ikke forfremmes mer.`);
      const krav = regel.bygg ? [regel.bygg, 1] : regel.krever;
      if ((g[krav[0]] || 0) < krav[1]) return feil(400, regel.bygg ? `Du trenger ${REGLER.bygg[krav[0]].navn.toLowerCase()} først.` : `Krever ${REGLER.bygg[krav[0]].navn.toLowerCase()} på nivå ${krav[1]}.`);
      const pris = lonn(hvem, niva);
      if (!har(g, pris)) return feil(400, `Du har ikke råd. Det koster ${prisTekst(pris)}.`);
      for (const [r, n] of Object.entries(pris)) g[r] -= n;
      // Lageret gjøres opp med gammel fart før den nye gjelder (gjorOpp er allerede kjørt for denne forespørselen)
      f[hvem] = niva + 1;
      if (niva === 0) await logg(db, meg, `ansatte ${regel.en}`);
      sist = { type: "ansett", hvem, navn: regel.navn, niva: f[hvem] };
    } else if (handling === "hus") {
      const h = husNiva(g), neste = REGLER.hus[h];
      if (!neste) return feil(400, "Du har bygget alle husene.");
      if (rangAv(g) < neste.rang) return feil(400, `${neste.navn} krever tittelen ${REGLER.ranger[neste.rang].tittel.toLowerCase()}.`);
      if (!har(g, neste.pris)) return feil(400, `Du har ikke råd. ${neste.navn} koster ${prisTekst(neste.pris)}.`);
      for (const [r, n] of Object.entries(neste.pris)) g[r] -= n;
      g.hus = h + 1;
      await logg(db, meg, `bygde seg ${neste.id === "hall" ? "en " : neste.id === "olympos" ? "" : "et "}${neste.navn}`);
      sist = { type: "hus", navn: neste.navn, niva: g.hus };
    } else if (handling === "fest") {
      const fi = festInfo(g, bonus(meg), b.prakt === true);
      if (!fi.ansatte) return feil(400, "Du har ingen å feste med ennå. Ansett noen først.");
      if (await db.prepare("SELECT 1 AS ja FROM symposion_handling WHERE fra = ? AND type = 'fest' AND dag = ?").bind(meg, idag).first()) return feil(409, "Folkene dine har festet nok for i dag.");
      if (!har(g, fi.pris)) return feil(400, `Du har ikke råd. Festen koster ${prisTekst(fi.pris)}.`);
      await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'fest', ?)").bind(meg, meg, idag).run();
      for (const [r, n] of Object.entries(fi.pris)) g[r] -= n;
      // Lageret er allerede gjort opp til nå, så festen gjelder bare fra nå av
      g.fest_til = new Date(naaMs + fi.timer * TIME).toISOString();
      g.aere += fi.aere;
      await logg(db, meg, b.prakt === true ? "holdt praktfest for folkene, med krydder og purpur" : "holdt fest for folkene på godset");
      sist = { type: "fest", aere: fi.aere, pris: fi.pris, prakt: b.prakt === true, timer: fi.timer };
    } else if (handling === "tokt") {
      const t = typeof b.mal === "string" && Object.hasOwn(REGLER.tokt, b.mal) ? REGLER.tokt[b.mal] : null;
      if (!t) return feil(400, "Ukjent reisemål.");
      if (!g.havn) return feil(400, "Du må bygge havn først.");
      const ledig = skipene(g).find((kol) => !toktNaa(g, kol));
      if (!ledig) return feil(409, skipene(g).length > 1 ? "Begge skipene dine er ute." : "Skipet ditt er allerede ute.");
      if (t.havn && g.havn < t.havn) return feil(400, `${t.navn} krever havn på nivå ${t.havn}.`);
      if (!har(g, t.pris)) return feil(400, `Du har ikke råd. Toktet koster ${prisTekst(t.pris)}.`);
      for (const [r, n] of Object.entries(t.pris)) g[r] -= n;
      // Lasten trekkes når skipet legger fra, så ingen kan prøve seg fram
      const terning = Math.random();
      const hendelse = terning < 0.12 ? "storm" : terning < 0.24 ? "medvind" : null;
      const faktor = (1 + REGLER.toktLast * (g.havn - 1)) * (hendelse === "storm" ? 0.5 : hendelse === "medvind" ? 1.5 : 1);
      const last = Object.fromEntries(Object.entries(t.gir).map(([r, [fra, til]]) => [r, Math.max(1, Math.round((fra + Math.random() * (til - fra)) * faktor))]));
      const timer = t.timer * (ferdige.includes("fyr") ? REGLER.fyrFart : 1) * (harAvtale(meg, "los") ? OKONOMI.avtaler.los.fart : 1);
      g[ledig] = JSON.stringify({ mal: b.mal, ut: naa, hjem: new Date(naaMs + timer * TIME).toISOString(), last, hendelse });
      sist = { type: "tokt", mal: t.navn };
    } else if (handling === "loss") {
      // Losser alle skip som er hjemme
      const ute = TOKTKOL.filter((kol) => toktNaa(g, kol));
      if (!ute.length) return feil(400, "Skipet ligger allerede til kai.");
      const hjemme = ute.filter((kol) => Date.parse(toktNaa(g, kol).hjem) <= naaMs);
      if (!hjemme.length) return feil(409, "Skipet er ikke hjemme ennå.");
      const fikk = {}, navn = [];
      let hendelse = null;
      for (const kol of hjemme) {
        const t = toktNaa(g, kol), regel = REGLER.tokt[t.mal];
        for (const [r, n] of Object.entries(t.last)) { g[r] = (g[r] || 0) + n; fikk[r] = (fikk[r] || 0) + n; }
        g[kol] = null;
        navn.push(regel.navn);
        hendelse = hendelse || t.hendelse;
        if (regel.timer >= 8) await logg(db, meg, `fikk skipet hjem fra ${regel.navn} med ${prisTekst(t.last)}${t.hendelse === "storm" ? ", etter storm" : t.hendelse === "medvind" ? ", i strålende medvind" : ""}`);
      }
      sist = { type: "loss", mal: navn.join(" og "), fikk, hendelse: hjemme.length > 1 ? null : hendelse };
    } else if (handling === "gi") {
      const m = await monumentStatus(db, ferdige);
      if (!m) return feil(400, "Alle monumentene er ferdige.");
      const r = b.ressurs;
      if (typeof r !== "string" || !Object.hasOwn(m.krav, r)) return feil(400, "Monumentet trenger ikke det.");
      const n = Math.min(Math.floor(Number(b.antall) || 0), Math.floor(g[r] || 0), m.krav[r] - m.gitt[r]);
      if (n <= 0) return feil(400, m.krav[r] - m.gitt[r] <= 0 ? `Monumentet trenger ikke mer ${rn(r)}.` : `Du har ikke ${rn(r)} å gi.`);
      g[r] -= n;
      const aere = Math.max(1, Math.round((n * REGLER.vekt[r]) / REGLER.aerePerVerdi));
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
    const kopi = gjorOpp(merk({ ...x }), naaMs, bonus(x.navn));
    const t = tagger.get(x.navn);
    return {
      navn: x.navn, aere: x.aere, rang: rangAv(x), slave: !!(x.slave_til && x.slave_til > naa),
      fest: festPaa(x, naaMs), bygg: { lund: x.lund, vingard: x.vingard, brudd: x.brudd, bigard: x.bigard || 0, gruve: x.gruve || 0, villa: x.villa, havn: x.havn || 0 },
      hus: x.hus || 0, skip: x.havn ? (skipene(x).every((kol) => x[kol]) ? "ute" : "kai") : null, ansatte: Object.values(folk(x)).reduce((a, n) => a + (n > 0 ? 1 : 0), 0),
      hjemme: naaMs - Date.parse(x.sist_sett) < 24 * TIME,
      skjenket: gjort(x.navn, "skjenk"), skjenketMeg: tilMeg.results.some((h) => h.fra === x.navn), nasket: gjort(x.navn, "nask"),
      bytte: naskBytte(kopi), vaktet: (folk(kopi).nattevakt || 0) > 0 && naskBytte(kopi) < REGLER.naskMin && kopi.l_oliven * REGLER.naskAndel >= REGLER.naskMin,
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
      return [id, { niva, apen: (g[krav[0]] || 0) >= krav[1], krever: krav, kost: niva < HUSFORDEL.ansattMaks(husNiva(g)) ? lonn(id, niva) : null }];
    }));
    const toktInfo = (t) => t ? { mal: t.mal, navn: REGLER.tokt[t.mal].navn, ut: t.ut, hjem: t.hjem, hjemme: Date.parse(t.hjem) <= naaMs } : null;
    const skip = skipene(g).map((kol) => toktInfo(toktNaa(g, kol)));
    const h = husNiva(g);
    const lastFaktor = 1 + REGLER.toktLast * Math.max(0, g.havn - 1), fart = (ferdige.includes("fyr") ? REGLER.fyrFart : 1) * (harAvtale(meg, "los") ? OKONOMI.avtaler.los.fart : 1);
    const reisemal = Object.fromEntries(Object.entries(REGLER.tokt).map(([id, x]) => [id, {
      navn: x.navn, timer: x.timer * fart, pris: x.pris, apen: !x.havn || g.havn >= x.havn, havn: x.havn || 1,
      gir: Object.fromEntries(Object.entries(x.gir).map(([rr, [a, b]]) => [rr, [Math.round(a * lastFaktor), Math.round(b * lastFaktor)]])),
    }]));
    const skjenketIdag = mine.results.filter((h) => h.type === "skjenk").length, rundeMal = Math.min(REGLER.rundeMal, alle.results.length - 1);
    const fi = festInfo(g, bonus(meg));
    jeg = {
      // Avtalene fra hotellet som gjelder godset nå
      avtaler: OKONOMI_PAUSE ? [] : Object.entries(OKONOMI.avtaler).map(([id, a]) => ({ id, navn: a.navn, tekst: a.tekst, til: (avtaler.get(meg) && avtaler.get(meg).get(id)) || null })),
      fest: { ...fi, prakt: g.havn ? festInfo(g, bonus(meg), true) : null, holdt: mine.results.some((h) => h.type === "fest"), til: festPaa(g, naaMs) ? g.fest_til : null, bonus: REGLER.fest.bonus, varer: REGLER.fest.varer },
      skjenk: { ...skjenkGave(g, bonus(meg)), aere: REGLER.skjenkAere, gjengjeldAere: REGLER.gjengjeldAere,
        runde: { gjort: skjenketIdag, mal: rundeMal, fikk: rundeGave(g, bonus(meg)), aere: REGLER.rundeAere } },
      // tokt er det skipet som kommer hjem først (for kartet og tipsene), skip er alle skipene
      ansatte, reisemal, skip, tokt: skip.filter(Boolean).sort((a, b) => Date.parse(a.hjem) - Date.parse(b.hjem))[0] || null,
      hus: { niva: h, neste: REGLER.hus[h] ? { ...REGLER.hus[h], tittel: REGLER.ranger[REGLER.hus[h].rang].tittel, apen: rangAv(g) >= REGLER.hus[h].rang } : null, navn: h ? REGLER.hus[h - 1].navn : null },
      ansattMaks: HUSFORDEL.ansattMaks(h), naskPerDag: HUSFORDEL.nask(h), taggPerDag: HUSFORDEL.tagg(h),
      navn: meg, aere: g.aere, streak: g.streak, kanOfre: g.sist_offer !== idag,
      nesteOffer: Object.fromEntries(Object.entries(offergave(g.sist_offer === dag(naaMs - 86400000) || g.sist_offer === idag ? Math.min(7, g.streak + (g.sist_offer === idag ? 0 : 1)) : 1)).map(([r, n]) => [r, n * HUSFORDEL.offer(husNiva(g))])),
      beholdning: Object.fromEntries(ALLE.map((x) => [x, g[x] || 0])),
      lager: Object.fromEntries(RESSURSER.map((x) => [x, g[`l_${x}`] || 0])),
      // Hva hvert bygg gir i timen etter neste utvidelse, med de samme bonusene som nå
      nesteRater: Object.fromEntries(Object.entries(REGLER.bygg).filter(([id, b]) => b.gir && g[id] < maksNiva(id)).map(([id, b]) => [b.gir, rater({ ...g, [id]: (g[id] || 0) + 1 }, bonus(meg))[b.gir]])),
      rater: r, tak: Object.fromEntries(RESSURSER.map((x) => [x, r[x] * takTimer(g)])), takTimer: takTimer(g),
      bygg: Object.fromEntries(Object.keys(REGLER.bygg).map((id) => [id, g[id] || 0])),
      kost: kostnader, apen,
      naskGratis: Math.max(0, HUSFORDEL.nask(husNiva(g)) - mine.results.filter((h) => h.type === "nask").length),
      naskKjopt: Math.max(0, mine.results.filter((h) => h.type === "kjop-nask").length - mine.results.filter((h) => h.type.startsWith("grep-")).length),
      naskIgjen: Math.max(0, HUSFORDEL.nask(husNiva(g)) - mine.results.filter((h) => h.type === "nask").length)
        + Math.max(0, mine.results.filter((h) => h.type === "kjop-nask").length - mine.results.filter((h) => h.type.startsWith("grep-")).length),
      taggIgjen: HUSFORDEL.tagg(husNiva(g)) + mine.results.filter((h) => h.type === "kjop-tagg").length - mine.results.filter((h) => h.type === "tagg").length,
      rang: rangAv(g), slaveTil: g.slave_til && g.slave_til > naa ? g.slave_til : null,
      kjopt: { tagg: mine.results.filter((h) => h.type === "kjop-tagg").length, nask: mine.results.filter((h) => h.type === "kjop-nask").length, statue: statuer.includes(meg) },
    };
  }
  return json({
    naa, meg: jeg, spillere, statuer, monument, bidrag, ferdige, bonus: bon, sist,
    regler: { bygg: REGLER.bygg, maksNiva: REGLER.maksNiva, navn: REGLER.navn, produsert: RESSURSER, alle: ALLE, ansatte: REGLER.ansatte, ansattMaks: REGLER.ansattMaks, hus: REGLER.hus, ansattProd: REGLER.ansattProd, vaktAndel: REGLER.vaktAndel, toktLast: REGLER.toktLast,
      monumenter: REGLER.monumenter.map(({ id, navn }) => ({ id, navn })), fest: REGLER.fest, naskPerDag: REGLER.naskPerDag, rundeMal: REGLER.rundeMal, rundeAere: REGLER.rundeAere, skjenkMinst: REGLER.skjenkMinst, skjenkAere: REGLER.skjenkAere, gjengjeldAere: REGLER.gjengjeldAere, ranger: REGLER.ranger, butikk: REGLER.butikk, taggPerDag: REGLER.taggPerDag, taggMaks: REGLER.taggMaks, taggStraff: REGLER.taggStraff },
    logg: loggRader.results,
  });
}
