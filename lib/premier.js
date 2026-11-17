// PREMIER: hvert spill gir sin egen premie, og alle premiene kan brukes i Tafse Hotell.
// Symposion gir oliven, vin og marmor, Tartaros gir drakmer. De andre spillene gir premie
// etter poengsummen hver gang et resultat lagres. Dagens første spill i hvert spill gir dobbelt.

export const VALUTA = {
  oliven: { navn: "oliven", fra: "Symposion", side: "symposion.html", farge: "#9db36a", slik: "Høstes i olivenlunden" },
  vin: { navn: "vin", fra: "Symposion", side: "symposion.html", farge: "#b0507a", slik: "Høstes i vingården" },
  marmor: { navn: "marmor", fra: "Symposion", side: "symposion.html", farge: "#ece4d2", slik: "Hentes i marmorbruddet" },
  drakmer: { navn: "drakmer", fra: "Tartaros", side: "tartaros.html", farge: "#e2c174", slik: "Mynter, bosser og tid i hvert tokt" },
  mosaikk: { navn: "mosaikkbiter", fra: "2048", side: "2048.html", farge: "#6fc3c9", slik: "1 per 100 poeng" },
  tegl: { navn: "teglstein", fra: "Murbrekker", side: "murbrekker.html", farge: "#c8683f", slik: "1 per 50 poeng" },
  blokker: { navn: "steinblokker", fra: "Tetris", side: "tetris.html", farge: "#9a8fd0", slik: "1 per 300 poeng" },
  skinn: { navn: "slangeskinn", fra: "Snake", side: "snake.html", farge: "#7fb04f", slik: "1 per 5 poeng" },
  dolker: { navn: "dolker", fra: "Idus Martiae", side: "spill.html", farge: "#c9c9d2", slik: "1 per 2 poeng" },
};

// Hvor mange poeng som gir én premie i hvert spill (endres her, og i teksten over)
export const SATS = {
  "2048": { valuta: "mosaikk", per: 100 },
  murbrekker: { valuta: "tegl", per: 50 },
  tetris: { valuta: "blokker", per: 300 },
  snake: { valuta: "skinn", per: 5 },
  spill: { valuta: "dolker", per: 2 },
};
const MAKS_PER_SPILL = 400;   // før dobling

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS premier (
    navn TEXT NOT NULL, valuta TEXT NOT NULL, antall INTEGER NOT NULL, sist_dag TEXT,
    PRIMARY KEY (navn, valuta)
  )`,
];

const dag = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(ms));

// Gir premie for et lagret resultat. Svaret sendes med tilbake til spillet, som viser det på sluttskjermen.
export async function premie(db, navn, spill, poeng) {
  const s = SATS[spill];
  if (!s) return null;
  let antall = Math.min(MAKS_PER_SPILL, Math.floor(Math.max(0, Number(poeng) || 0) / s.per));
  if (antall <= 0) return null;
  const idag = dag(Date.now());
  const rad = await db.prepare("SELECT antall, sist_dag FROM premier WHERE navn = ? AND valuta = ?").bind(navn, s.valuta).first();
  const dobbel = !rad || rad.sist_dag !== idag;
  if (dobbel) antall *= 2;
  await db.prepare(`INSERT INTO premier (navn, valuta, antall, sist_dag) VALUES (?, ?, ?, ?)
    ON CONFLICT(navn, valuta) DO UPDATE SET antall = antall + excluded.antall, sist_dag = excluded.sist_dag`)
    .bind(navn, s.valuta, antall, idag).run();
  return { valuta: s.valuta, navn: VALUTA[s.valuta].navn, antall, dobbel, saldo: (rad ? rad.antall : 0) + antall };
}

// Alt en spiller har å handle for, samlet fra Symposion, Tartaros og premiene
export async function lommebok(db, navn) {
  const [gods, profil, rader] = await Promise.all([
    db.prepare("SELECT oliven, vin, marmor FROM symposion_gods WHERE navn = ?").bind(navn).first(),
    db.prepare("SELECT drakmer FROM tartaros_profil WHERE navn = ?").bind(navn).first(),
    db.prepare("SELECT valuta, antall FROM premier WHERE navn = ?").bind(navn).all(),
  ]);
  const bok = Object.fromEntries(Object.keys(VALUTA).map((v) => [v, 0]));
  if (gods) for (const v of ["oliven", "vin", "marmor"]) bok[v] = Math.floor(gods[v]);
  if (profil) bok.drakmer = profil.drakmer;
  for (const r of rader.results) if (r.valuta in bok) bok[r.valuta] = r.antall;
  return bok;
}

// Hva som mangler for å betale en pris. Tom liste betyr at spilleren har råd.
export const mangler = (bok, pris) => Object.entries(pris).filter(([v, n]) => (bok[v] || 0) < n).map(([v, n]) => `${n - (bok[v] || 0)} ${VALUTA[v].navn}`);

// Trekker en pris fra lommeboka. Sjekk med mangler() først.
export async function betal(db, navn, pris) {
  const p = { oliven: 0, vin: 0, marmor: 0, ...pris };
  const jobber = [];
  if (p.oliven || p.vin || p.marmor) jobber.push(db.prepare("UPDATE symposion_gods SET oliven = oliven - ?, vin = vin - ?, marmor = marmor - ? WHERE navn = ?").bind(p.oliven, p.vin, p.marmor, navn));
  if (p.drakmer) jobber.push(db.prepare("UPDATE tartaros_profil SET drakmer = drakmer - ? WHERE navn = ?").bind(p.drakmer, navn));
  for (const [v, n] of Object.entries(pris)) if (!["oliven", "vin", "marmor", "drakmer"].includes(v)) jobber.push(db.prepare("UPDATE premier SET antall = antall - ? WHERE navn = ? AND valuta = ?").bind(n, navn, v));
  if (jobber.length) await db.batch(jobber);
}
