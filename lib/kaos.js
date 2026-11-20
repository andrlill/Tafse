// KAOS: serverlogikk. Holder orden på oppdagelsene, dagens oppdrag og galleriet,
// og deler ut gnister. Selve spillet ligger i assets/kaos.js, stoffene og fysikken i assets/kaos-motor.js.

// Alt som kan oppdages. Må være de samme nøklene som FUNN i assets/kaos-motor.js
// (scripts/kaos-test.mjs sjekker at listene stemmer overens).
export const FUNN = ["royk", "damp", "aske", "gjorme", "saltvann", "kull", "plante", "blomst", "drue", "vin", "sprit", "glass", "tegl", "lava",
  "obsidian", "svovel", "syre", "gass", "rust", "sno", "krutt", "greskild", "diamant", "menneske", "gull",
  "gress", "mose", "oliven", "fisk",
  "regn", "frost", "strom", "eksplosjon", "rus", "lovverk", "pressing", "gullstatue"];

// Tallene (endres her, og i teksten i assets/kaos.js og lib/premier.js)
export const REGLER = {
  funn: 10,                 // gnister for en ny oppdagelse
  forst: 15,                // ekstra til den som finner noe først av alle
  oppdrag: [0, 15, 25, 40], // gnister for dagens oppdrag med én, to og tre stjerner
  rekke: 3,                 // ekstra per dag på rad med løst oppdrag
  rekkeMaks: 21,
  stjerne: 5,               // gnister til den som får en stjerne på et verk i galleriet
  verkPerDag: 5,
  maksData: 300000,
  maksBilde: 60000,
};

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS kaos_funn (
    navn TEXT NOT NULL, funn TEXT NOT NULL, opprettet TEXT NOT NULL, PRIMARY KEY (navn, funn)
  )`,
  `CREATE TABLE IF NOT EXISTS kaos_oppdrag (
    navn TEXT NOT NULL, dag TEXT NOT NULL, korn INTEGER NOT NULL, tikk INTEGER NOT NULL, stjerner INTEGER NOT NULL,
    opprettet TEXT NOT NULL, PRIMARY KEY (navn, dag)
  )`,
  `CREATE TABLE IF NOT EXISTS kaos_verk (
    id INTEGER PRIMARY KEY AUTOINCREMENT, navn TEXT NOT NULL, tittel TEXT NOT NULL, data TEXT NOT NULL, bilde TEXT,
    opprettet TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS kaos_stjerne (
    verk INTEGER NOT NULL, fra TEXT NOT NULL, eier TEXT NOT NULL, opprettet TEXT NOT NULL, PRIMARY KEY (verk, fra)
  )`,
];

const osloDag = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(ms));
const heltall = (v, min, maks) => Math.max(min, Math.min(maks, Math.round(Number(v) || 0)));

// Legger gnister i lommeboka (tabellen premier, se lib/premier.js) og gir saldoen tilbake
async function giGnister(db, navn, antall) {
  if (antall > 0) {
    await db.prepare(`INSERT INTO premier (navn, valuta, antall, sist_dag) VALUES (?, 'gnister', ?, NULL)
      ON CONFLICT(navn, valuta) DO UPDATE SET antall = antall + excluded.antall`).bind(navn, antall).run();
  }
  const rad = await db.prepare("SELECT antall FROM premier WHERE navn = ? AND valuta = 'gnister'").bind(navn).first();
  return rad ? rad.antall : 0;
}

// Antall dager på rad med løst oppdrag, til og med i dag (eller i går, hvis dagens ikke er løst ennå)
async function rekke(db, navn, idag) {
  const { results } = await db.prepare("SELECT dag FROM kaos_oppdrag WHERE navn = ? ORDER BY dag DESC LIMIT 400").bind(navn).all();
  const dager = new Set(results.map((r) => r.dag));
  const forrige = (d) => new Date(Date.parse(d + "T12:00:00Z") - 86400000).toISOString().slice(0, 10);
  let d = dager.has(idag) ? idag : forrige(idag), n = 0;
  while (dager.has(d)) { n++; d = forrige(d); }
  return n;
}

const tavle = async (db, dag) => (await db.prepare("SELECT navn, korn, tikk, stjerner FROM kaos_oppdrag WHERE dag = ? ORDER BY korn, tikk, opprettet LIMIT 50").bind(dag).all()).results;

export async function kaos({ db, meg, metode, handling, request, url, json, feil, lesJson, erAdmin }) {
  const naaMs = Date.now(), naa = new Date(naaMs).toISOString(), idag = osloDag(naaMs);

  // ---------- Oversikten: mine funn, hvem som var først, dagens tavle og saldoen ----------
  if (metode === "GET" && !handling) {
    const [mine, forste, oppdagere] = await db.batch([
      db.prepare("SELECT funn FROM kaos_funn WHERE navn = ?").bind(meg),
      db.prepare("SELECT funn, navn, MIN(opprettet) AS opprettet FROM kaos_funn GROUP BY funn"),
      db.prepare("SELECT navn, COUNT(*) AS antall FROM kaos_funn GROUP BY navn ORDER BY antall DESC, MAX(opprettet) LIMIT 30"),
    ]);
    return json({
      funn: mine.results.map((r) => r.funn),
      forste: Object.fromEntries(forste.results.map((r) => [r.funn, r.navn])),
      oppdagere: oppdagere.results,
      gnister: await giGnister(db, meg, 0),
      dag: idag,
      oppdrag: { tavle: await tavle(db, idag), rekke: await rekke(db, meg, idag) },
      regler: REGLER,
    });
  }

  // ---------- En ny oppdagelse ----------
  if (metode === "POST" && handling === "funn") {
    const b = await lesJson(request);
    if (!FUNN.includes(b.id)) return feil(400, "Ukjent oppdagelse.");
    const har = await db.prepare("SELECT 1 AS ja FROM kaos_funn WHERE navn = ? AND funn = ?").bind(meg, b.id).first();
    if (har) return json({ ny: false, gnister: 0, saldo: await giGnister(db, meg, 0) });
    const andre = await db.prepare("SELECT navn FROM kaos_funn WHERE funn = ? ORDER BY opprettet LIMIT 1").bind(b.id).first();
    await db.prepare("INSERT OR IGNORE INTO kaos_funn (navn, funn, opprettet) VALUES (?, ?, ?)").bind(meg, b.id, naa).run();
    const gnister = REGLER.funn + (andre ? 0 : REGLER.forst);
    return json({ ny: true, forst: !andre, forsteNavn: andre ? andre.navn : meg, gnister, saldo: await giGnister(db, meg, gnister) }, 201);
  }

  // ---------- Dagens oppdrag ----------
  // Beste forsøk per spiller teller: færrest korn, så færrest steg. Premien følger stjernene,
  // og den som forbedrer seg, får mellomlegget.
  if (metode === "POST" && handling === "oppdrag") {
    const b = await lesJson(request);
    if (b.dag !== idag) return feil(409, "Dagens oppdrag er byttet ut. Last siden på nytt.");
    const korn = heltall(b.korn, 1, 5000), tikk = heltall(b.tikk, 1, 20000), stjerner = heltall(b.stjerner, 1, 3);
    const gammel = await db.prepare("SELECT korn, tikk, stjerner FROM kaos_oppdrag WHERE navn = ? AND dag = ?").bind(meg, idag).first();
    let gnister = 0, forbedret = false;
    if (!gammel) {
      await db.prepare("INSERT INTO kaos_oppdrag (navn, dag, korn, tikk, stjerner, opprettet) VALUES (?, ?, ?, ?, ?, ?)").bind(meg, idag, korn, tikk, stjerner, naa).run();
      const n = await rekke(db, meg, idag);
      gnister = REGLER.oppdrag[stjerner] + Math.min(REGLER.rekkeMaks, (n - 1) * REGLER.rekke);
      forbedret = true;
    } else if (korn < gammel.korn || (korn === gammel.korn && tikk < gammel.tikk)) {
      const nye = Math.max(stjerner, gammel.stjerner);
      await db.prepare("UPDATE kaos_oppdrag SET korn = ?, tikk = ?, stjerner = ?, opprettet = ? WHERE navn = ? AND dag = ?").bind(korn, tikk, nye, naa, meg, idag).run();
      gnister = REGLER.oppdrag[nye] - REGLER.oppdrag[gammel.stjerner];
      forbedret = true;
    }
    return json({ forbedret, forste: !gammel, gnister, saldo: await giGnister(db, meg, gnister), rekke: await rekke(db, meg, idag), tavle: await tavle(db, idag) }, 201);
  }

  // ---------- Galleriet ----------
  if (metode === "GET" && handling === "galleri") {
    const sort = url.searchParams.get("sort");
    const hvor = sort === "mine" ? "WHERE v.navn = ?2" : "";
    const orden = sort === "topp" ? "stjerner DESC, v.id DESC" : "v.id DESC";
    const { results } = await db.prepare(`SELECT v.id, v.navn, v.tittel, v.bilde, v.opprettet,
        (SELECT COUNT(*) FROM kaos_stjerne s WHERE s.verk = v.id) AS stjerner,
        (SELECT COUNT(*) FROM kaos_stjerne s WHERE s.verk = v.id AND s.fra = ?1) AS gitt
      FROM kaos_verk v ${hvor} ORDER BY ${orden} LIMIT 36`).bind(...(hvor ? [meg, meg] : [meg])).all();
    return json({ verk: results });
  }
  if (metode === "GET" && handling === "verk") {
    const rad = await db.prepare("SELECT id, navn, tittel, data FROM kaos_verk WHERE id = ?").bind(Number(url.searchParams.get("id")) || 0).first();
    return rad ? json(rad) : feil(404, "Fant ikke verket.");
  }
  if (metode === "POST" && handling === "verk") {
    const b = await lesJson(request);
    const tittel = (typeof b.tittel === "string" ? b.tittel : "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (!tittel) return feil(400, "Gi verket en tittel.");
    if (typeof b.data !== "string" || b.data.length > REGLER.maksData) return feil(400, "Verket er for stort til å lagres.");
    let gyldig = false;
    try { const o = JSON.parse(b.data); gyldig = o && o.v === 1 && typeof o.t === "string"; } catch (_) {}
    if (!gyldig) return feil(400, "Verket lot seg ikke lese.");
    const bilde = typeof b.bilde === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.bilde) && b.bilde.length <= REGLER.maksBilde ? b.bilde : null;
    const nylig = await db.prepare("SELECT COUNT(*) AS n FROM kaos_verk WHERE navn = ? AND opprettet > ?").bind(meg, new Date(naaMs - 86400000).toISOString()).first();
    if (nylig.n >= REGLER.verkPerDag) return feil(429, `Du kan dele ${REGLER.verkPerDag} verk i døgnet. Prøv igjen i morgen.`);
    const r = await db.prepare("INSERT INTO kaos_verk (navn, tittel, data, bilde, opprettet) VALUES (?, ?, ?, ?, ?)").bind(meg, tittel, b.data, bilde, naa).run();
    return json({ id: r.meta.last_row_id }, 201);
  }
  if (metode === "POST" && handling === "stjerne") {
    const b = await lesJson(request);
    const verk = await db.prepare("SELECT id, navn FROM kaos_verk WHERE id = ?").bind(Number(b.id) || 0).first();
    if (!verk) return feil(404, "Fant ikke verket.");
    if (verk.navn === meg) return feil(400, "Du kan ikke gi stjerne til ditt eget verk.");
    const har = await db.prepare("SELECT 1 AS ja FROM kaos_stjerne WHERE verk = ? AND fra = ?").bind(verk.id, meg).first();
    if (!har) {
      await db.prepare("INSERT OR IGNORE INTO kaos_stjerne (verk, fra, eier, opprettet) VALUES (?, ?, ?, ?)").bind(verk.id, meg, verk.navn, naa).run();
      await giGnister(db, verk.navn, REGLER.stjerne);
    }
    const antall = await db.prepare("SELECT COUNT(*) AS n FROM kaos_stjerne WHERE verk = ?").bind(verk.id).first();
    return json({ stjerner: antall.n, gitt: 1 });
  }
  if (metode === "POST" && handling === "slett") {
    const b = await lesJson(request);
    const verk = await db.prepare("SELECT id, navn FROM kaos_verk WHERE id = ?").bind(Number(b.id) || 0).first();
    if (!verk) return feil(404, "Fant ikke verket.");
    if (verk.navn !== meg && !(await erAdmin())) return feil(403, "Du kan bare slette dine egne verk.");
    await db.batch([
      db.prepare("DELETE FROM kaos_verk WHERE id = ?").bind(verk.id),
      db.prepare("DELETE FROM kaos_stjerne WHERE verk = ?").bind(verk.id),
    ]);
    return json({ ok: true });
  }
  return feil(404, "Fant ikke siden.");
}
