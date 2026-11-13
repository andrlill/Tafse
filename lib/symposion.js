// SYMPOSION: regler og serverlogikk for den felles greske byen.
// Alt regnes ut på serveren, så ingen kan jukse med klokka. Tallene under kan justeres fritt.

const TIME = 3600000;

export const REGLER = {
  maksNiva: 10,
  vekst: 1.65,             // hvert nivå koster så mye mer enn det forrige
  startOliven: 120,
  takGrunn: 3,             // lageret rommer (3 + villanivå) timer med produksjon
  monumentBonus: 0.1,      // hvert ferdige monument gir alle +10 % produksjon
  skjenkOliven: 10,        // det du får for å skjenke
  skjenkAere: 5,
  naskPerDag: 3,
  naskAndel: 0.3,
  naskMaks: 150,
  naskMin: 5,
  vekt: { oliven: 1, vin: 1.5, marmor: 2.5 }, // verdi når man gir til monumentet
  bygg: {
    lund: { navn: "Olivenlund", gir: "oliven", perTime: 20 },
    vingard: { navn: "Vingård", gir: "vin", perTime: 14, krever: ["lund", 2] },
    brudd: { navn: "Marmorbrudd", gir: "marmor", perTime: 9, krever: ["vingard", 2] },
    villa: { navn: "Villa" },
  },
  monumenter: [
    { id: "agora", navn: "Agoraen", tekst: "Torget der brødrene møtes.", krav: { oliven: 1500, vin: 800, marmor: 400 } },
    { id: "tempel", navn: "Dionysos' tempel", tekst: "Til vinens og festens gud.", krav: { oliven: 5000, vin: 3500, marmor: 2500 } },
    { id: "teater", navn: "Amfiteateret", tekst: "For taler, sang og dårlige vitser.", krav: { oliven: 12000, vin: 9000, marmor: 7000 } },
    { id: "koloss", navn: "Tafsekolossen", tekst: "En bror i bronse, med hevet beger.", krav: { oliven: 30000, vin: 24000, marmor: 20000 } },
  ],
};

// [ressurs, grunnpris, fra og med hvilket nivå ressursen kreves]
const KOST = {
  lund: [["oliven", 30, 0], ["vin", 10, 3]],
  vingard: [["oliven", 60, 0], ["vin", 20, 1]],
  brudd: [["oliven", 80, 0], ["vin", 50, 0], ["marmor", 15, 1]],
  villa: [["oliven", 100, 0], ["vin", 40, 2], ["marmor", 25, 3]],
};
const RESSURSER = ["oliven", "vin", "marmor"];

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
  `CREATE TABLE IF NOT EXISTS symposion_ferdig (monument TEXT PRIMARY KEY, ferdig TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS symposion_logg (
    id INTEGER PRIMARY KEY AUTOINCREMENT, navn TEXT NOT NULL, tekst TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
];

// Dagen skifter ved midnatt norsk tid
const dag = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(ms));

function rater(g, bonus) {
  const r = {};
  for (const [id, b] of Object.entries(REGLER.bygg)) if (b.gir) r[b.gir] = b.perTime * g[id] * bonus;
  return r;
}
const takTimer = (g) => REGLER.takGrunn + g.villa;

// Fyller lageret med det som er produsert siden sist, opp til taket
function gjorOpp(g, naaMs, bonus) {
  const timer = Math.max(0, (naaMs - Date.parse(g.oppdatert)) / TIME);
  const r = rater(g, bonus);
  for (const x of RESSURSER) g[`l_${x}`] = Math.min(r[x] * takTimer(g), g[`l_${x}`] + r[x] * timer);
  g.oppdatert = new Date(naaMs).toISOString();
  return g;
}

const lagre = (db, g) => db
  .prepare(`UPDATE symposion_gods SET oliven = ?, vin = ?, marmor = ?, l_oliven = ?, l_vin = ?, l_marmor = ?,
    lund = ?, vingard = ?, brudd = ?, villa = ?, aere = ?, streak = ?, sist_offer = ?, oppdatert = ?, sist_sett = ? WHERE navn = ?`)
  .bind(g.oliven, g.vin, g.marmor, g.l_oliven, g.l_vin, g.l_marmor, g.lund, g.vingard, g.brudd, g.villa, g.aere, g.streak, g.sist_offer, g.oppdatert, g.sist_sett, g.navn)
  .run();

const logg = (db, navn, tekst) => db
  .prepare("INSERT INTO symposion_logg (navn, tekst, opprettet) VALUES (?, ?, ?)").bind(navn, tekst, new Date().toISOString()).run();

const har = (g, pris) => Object.entries(pris).every(([r, n]) => g[r] >= n);
const prisTekst = (pris) => Object.entries(pris).map(([r, n]) => `${n} ${r}`).join(", ");

async function monumentStatus(db, ferdige) {
  const m = REGLER.monumenter.find((x) => !ferdige.includes(x.id));
  if (!m) return null;
  const sum = await db.prepare("SELECT COALESCE(SUM(oliven), 0) AS oliven, COALESCE(SUM(vin), 0) AS vin, COALESCE(SUM(marmor), 0) AS marmor FROM symposion_bidrag WHERE monument = ?").bind(m.id).first();
  return { ...m, gitt: { oliven: sum.oliven, vin: sum.vin, marmor: sum.marmor } };
}

export async function symposion({ db, meg, metode, handling, request, medlemmer, json, feil, lesJson, varsle }) {
  const naaMs = Date.now();
  const naa = new Date(naaMs).toISOString();
  const idag = dag(naaMs);
  let ferdige = (await db.prepare("SELECT monument FROM symposion_ferdig").all()).results.map((r) => r.monument);
  const bonus = () => 1 + REGLER.monumentBonus * ferdige.length;
  let g = await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first();
  if (g) { gjorOpp(g, naaMs, bonus()); g.sist_sett = naa; }
  let sist = null; // det som nettopp skjedde, så siden kan vise det

  if (metode === "POST") {
    const b = await lesJson(request);
    if (handling === "flytt-inn") {
      if (!g) {
        await db.prepare(`INSERT INTO symposion_gods (navn, oliven, vin, marmor, l_oliven, l_vin, l_marmor, lund, vingard, brudd, villa, aere, streak, sist_offer, oppdatert, sist_sett, opprettet)
          VALUES (?, ?, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, NULL, ?, ?, ?)`).bind(meg, REGLER.startOliven, naa, naa, naa).run();
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
      if (niva >= REGLER.maksNiva) return feil(400, "Bygget er allerede på høyeste nivå.");
      if (regel.krever && g[regel.krever[0]] < regel.krever[1]) return feil(400, `Krever ${REGLER.bygg[regel.krever[0]].navn.toLowerCase()} på nivå ${regel.krever[1]}.`);
      const pris = kost(id, niva);
      if (!har(g, pris)) return feil(400, `Du har ikke råd. Det koster ${prisTekst(pris)}.`);
      for (const [r, n] of Object.entries(pris)) g[r] -= n;
      g[id] = niva + 1;
      g.aere += 10 * g[id];
      if (niva === 0) await logg(db, meg, `anla ${id === "vingard" ? "en vingård" : "et marmorbrudd"}`);
      else if (id === "villa" && [3, 5, 8].includes(g[id])) await logg(db, meg, g[id] === 8 ? "reiste et palass" : g[id] === 5 ? "bygde en villa med søyler" : "bygde seg et ordentlig hus");
      sist = { type: "bygg", bygg: id, niva: g[id] };
    } else if (handling === "offer") {
      if (g.sist_offer === idag) return feil(409, "Du har allerede ofret til gudene i dag.");
      g.streak = g.sist_offer === dag(naaMs - 86400000) ? Math.min(7, g.streak + 1) : 1;
      g.sist_offer = idag;
      const gave = offergave(g.streak);
      for (const [r, n] of Object.entries(gave)) g[r] += n;
      g.aere += 2 * g.streak;
      sist = { type: "offer", streak: g.streak, fikk: gave };
    } else if (handling === "skjenk" || handling === "nask") {
      const til = typeof b.til === "string" ? b.til : "";
      const mal = til && til !== meg ? await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(til).first() : null;
      if (!mal) return feil(404, "Den broren har ikke flyttet inn ennå.");
      if (handling === "skjenk") {
        try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'skjenk', ?)").bind(meg, til, idag).run(); }
        catch (_) { return feil(409, `Du har allerede skjenket ${til} i dag.`); }
        const vin = 10 + 5 * g.villa;
        await db.prepare("UPDATE symposion_gods SET vin = vin + ? WHERE navn = ?").bind(vin, til).run();
        g.oliven += REGLER.skjenkOliven;
        g.aere += REGLER.skjenkAere;
        await varsle(db, [til], { avsender: meg, type: "symposion", tekst: `skjenket deg ${vin} vin i Symposion`, lenke: "symposion.html" });
        await logg(db, meg, `skjenket vin til ${til}`);
        sist = { type: "skjenk", til, fikk: { oliven: REGLER.skjenkOliven }, aere: REGLER.skjenkAere };
      } else {
        const brukt = await db.prepare("SELECT COUNT(*) AS n FROM symposion_handling WHERE fra = ? AND type = 'nask' AND dag = ?").bind(meg, idag).first();
        if (brukt.n >= REGLER.naskPerDag) return feil(409, "Du har nasket nok for i dag. Gudene ser deg.");
        gjorOpp(mal, naaMs, bonus());
        const bytte = Math.floor(Math.min(mal.l_oliven * REGLER.naskAndel, REGLER.naskMaks));
        if (bytte < REGLER.naskMin) return feil(409, `${til} har nettopp høstet. Det er ingenting å naske.`);
        try { await db.prepare("INSERT INTO symposion_handling (fra, til, type, dag) VALUES (?, ?, 'nask', ?)").bind(meg, til, idag).run(); }
        catch (_) { return feil(409, `Du har allerede nasket fra ${til} i dag.`); }
        mal.l_oliven -= bytte;
        await lagre(db, mal);
        g.oliven += bytte;
        await varsle(db, [til], { avsender: meg, type: "symposion", tekst: `nasket ${bytte} oliven fra lunden din i Symposion. Høst oftere!`, lenke: "symposion.html" });
        await logg(db, meg, `nasket ${bytte} oliven fra ${til}`);
        sist = { type: "nask", til, fikk: { oliven: bytte } };
      }
    } else if (handling === "gi") {
      const m = await monumentStatus(db, ferdige);
      if (!m) return feil(400, "Alle monumentene er ferdige.");
      const r = b.ressurs;
      if (!RESSURSER.includes(r)) return feil(400, "Ukjent ressurs.");
      const n = Math.min(Math.floor(Number(b.antall) || 0), Math.floor(g[r]), m.krav[r] - m.gitt[r]);
      if (n <= 0) return feil(400, m.krav[r] - m.gitt[r] <= 0 ? `Monumentet trenger ikke mer ${r}.` : `Du har ikke ${r} å gi.`);
      g[r] -= n;
      const aere = Math.max(1, Math.round((n * REGLER.vekt[r]) / 10));
      g.aere += aere;
      await db.prepare("INSERT INTO symposion_bidrag (navn, monument, oliven, vin, marmor, opprettet) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(meg, m.id, r === "oliven" ? n : 0, r === "vin" ? n : 0, r === "marmor" ? n : 0, naa).run();
      m.gitt[r] += n;
      sist = { type: "gi", ressurs: r, antall: n, aere };
      if (RESSURSER.every((x) => m.gitt[x] >= m.krav[x])) {
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
  if (g) await lagre(db, g);

  // ---------- Tilstanden siden skal tegne ----------
  const [alle, mine, loggRader] = await Promise.all([
    db.prepare("SELECT * FROM symposion_gods").all(),
    db.prepare("SELECT til, type FROM symposion_handling WHERE fra = ? AND dag = ?").bind(meg, idag).all(),
    db.prepare("SELECT navn, tekst, opprettet FROM symposion_logg ORDER BY id DESC LIMIT 14").all(),
  ]);
  const monument = await monumentStatus(db, ferdige);
  let bidrag = [];
  if (monument) {
    const v = REGLER.vekt;
    bidrag = (await db.prepare(`SELECT navn, SUM(oliven * ${v.oliven} + vin * ${v.vin} + marmor * ${v.marmor}) AS verdi FROM symposion_bidrag WHERE monument = ? GROUP BY navn ORDER BY verdi DESC`).bind(monument.id).all()).results;
  }
  const gjort = (til, type) => mine.results.some((h) => h.til === til && h.type === type);
  const bon = bonus();
  const spillere = alle.results.map((x) => {
    const kopi = gjorOpp({ ...x }, naaMs, bon);
    return {
      navn: x.navn, aere: x.aere,
      bygg: { lund: x.lund, vingard: x.vingard, brudd: x.brudd, villa: x.villa },
      hjemme: naaMs - Date.parse(x.sist_sett) < 24 * TIME,
      skjenket: gjort(x.navn, "skjenk"), nasket: gjort(x.navn, "nask"),
      bytte: Math.floor(Math.min(kopi.l_oliven * REGLER.naskAndel, REGLER.naskMaks)),
    };
  });
  let jeg = null;
  if (g) {
    const kostnader = {}, apen = {};
    for (const [id, regel] of Object.entries(REGLER.bygg)) {
      kostnader[id] = g[id] < REGLER.maksNiva ? kost(id, g[id]) : null;
      apen[id] = !regel.krever || g[regel.krever[0]] >= regel.krever[1];
    }
    const r = rater(g, bon);
    jeg = {
      navn: meg, aere: g.aere, streak: g.streak, kanOfre: g.sist_offer !== idag,
      nesteOffer: offergave(g.sist_offer === dag(naaMs - 86400000) || g.sist_offer === idag ? Math.min(7, g.streak + (g.sist_offer === idag ? 0 : 1)) : 1),
      beholdning: { oliven: g.oliven, vin: g.vin, marmor: g.marmor },
      lager: { oliven: g.l_oliven, vin: g.l_vin, marmor: g.l_marmor },
      rater: r, tak: Object.fromEntries(RESSURSER.map((x) => [x, r[x] * takTimer(g)])), takTimer: takTimer(g),
      bygg: { lund: g.lund, vingard: g.vingard, brudd: g.brudd, villa: g.villa },
      kost: kostnader, apen,
      naskIgjen: REGLER.naskPerDag - mine.results.filter((h) => h.type === "nask").length,
    };
  }
  return json({
    naa, meg: jeg, spillere, medlemmer, monument, bidrag, ferdige, bonus: bon, sist,
    regler: { bygg: REGLER.bygg, maksNiva: REGLER.maksNiva, monumenter: REGLER.monumenter.map(({ id, navn }) => ({ id, navn })), naskPerDag: REGLER.naskPerDag },
    logg: loggRader.results,
  });
}
