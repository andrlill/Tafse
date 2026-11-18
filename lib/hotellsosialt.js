// TAFSE HOTELL, det sosiale: profilkort med respekt og merker, hvisking, gaver, gjestebok,
// terning, jukeboks og skattejakt. Kalles fra lib/hotell.js.

import { lommebok, mangler, betal } from "./premier.js";

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS hotell_respekt (
    id INTEGER PRIMARY KEY AUTOINCREMENT, fra TEXT NOT NULL, til TEXT NOT NULL, dag TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS hotell_respekt_til ON hotell_respekt (til)`,
  `CREATE TABLE IF NOT EXISTS hotell_gave (
    id INTEGER PRIMARY KEY AUTOINCREMENT, fra TEXT NOT NULL, til TEXT NOT NULL, type TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hotell_gjestebok (
    id INTEGER PRIMARY KEY AUTOINCREMENT, eier TEXT NOT NULL, navn TEXT NOT NULL, tekst TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS hotell_gjestebok_eier ON hotell_gjestebok (eier, id)`,
  `CREATE TABLE IF NOT EXISTS hotell_skatt (
    luke TEXT PRIMARY KEY, navn TEXT NOT NULL, valuta TEXT NOT NULL, antall INTEGER NOT NULL, opprettet TEXT NOT NULL
  )`,
];

export const RESPEKT_PER_DAG = 3;
export const SANGER = { sirtaki: "Sirtaki", vals: "Vinvalsen", marsj: "Legionærmarsjen", vugge: "Vuggesang for Bacchus" };
// «Gi en slibrig kommentar» fra profilkortet. Koster oliven, og hele rommet hører den.
export const SLIBRIG_PRIS = { oliven: 14 };
const SLIBRIGE = [
  "{navn}, den togaen kler deg. Den hadde kledd gulvet mitt enda bedre.",
  "{navn}, er du en amfora? For de formene ville antikken misunt deg.",
  "{navn}, jeg er ikke rørlegger, men jeg ser gjerne på rørene dine.",
  "{navn}, du får olivenene mine til å miste steinen.",
  "{navn}, Dionysos ringte. Han vil ha tilbake kroppen sin.",
  "{navn}, skal vi gå opp på rommet mitt og se på mosaikken?",
  "{navn}, du er grunnen til at togaen ble oppfunnet. Og grunnen til at den faller av.",
  "{navn}, hos meg er det alltid vannbåren varme.",
  "{navn}, de søylene dine holder oppe mer enn taket.",
  "{navn}, jeg har 14 oliven mindre nå, og du var verdt hver eneste en.",
  "{navn}, jeg har lest vedtektene. Ingenting der forbyr det jeg tenker på nå.",
  "{navn}, er det en skriftrull du har under togaen, eller er du bare glad for å se meg?",
];
const SKILLE = "\u0001";   // skiller mottaker fra tekst i en hvisking

// Skatten: hver halvtime ligger det en kiste på en fast, tilfeldig flis i et av fellesrommene.
// Den første som stiller seg på flisa, får den.
const SKATT_MINUTTER = 30;
const SKATTEFLISER = {
  lobbyen: [[4, 5], [6, 8], [3, 9], [9, 3], [5, 3]],
  baren: [[4, 4], [7, 5], [8, 2], [6, 7], [3, 5]],
  terrassen: [[5, 2], [9, 5], [4, 9], [1, 2], [7, 1], [4, 5]],
  auditoriet: [[5, 4], [10, 6], [1, 5], [5, 8], [10, 2]],
};
const SKATTEVALUTA = { mosaikk: "mosaikkbiter", tegl: "teglstein", blokker: "steinblokker", skinn: "slangeskinn", dolker: "dolker" };
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export function skattNaa(naaMs) {
  const luke = String(Math.floor(naaMs / (SKATT_MINUTTER * 60000)));
  const h = hash("skatt" + luke), rom = Object.keys(SKATTEFLISER)[h % 4], fliser = SKATTEFLISER[rom];
  const [x, y] = fliser[(h >>> 8) % fliser.length];
  const valuta = Object.keys(SKATTEVALUTA)[(h >>> 16) % 5];
  return { luke, rom, x, y, valuta, antall: 30 + ((h >>> 20) % 51) };
}
// Skatten i dette rommet, hvis ingen har tatt den
export async function ledigSkatt(db, rom, naaMs) {
  const s = skattNaa(naaMs);
  if (s.rom !== rom) return null;
  return (await db.prepare("SELECT 1 FROM hotell_skatt WHERE luke = ?").bind(s.luke).first()) ? null : { x: s.x, y: s.y };
}

// Hvisking lagres i praten som «mottaker + skille + tekst». Bare de to ser den.
export function filtrerPrat(prat, meg) {
  const ut = [];
  for (const m of prat) {
    if (m.type !== "hvisk") { ut.push(m); continue; }
    const i = m.tekst.indexOf(SKILLE), til = m.tekst.slice(0, i);
    if (m.navn === meg || til === meg) ut.push({ ...m, til, tekst: m.tekst.slice(i + 1) });
  }
  return ut;
}

// Merkene en gjest har gjort seg fortjent til
async function merker(db, navn, KRAV) {
  const en = async (sql, ...a) => { try { return await db.prepare(sql).bind(...a).first(); } catch (_) { return null; } };
  const [villa, mobler, respekt, gave, prof, skatt, bok, ...bragd] = await Promise.all([
    en("SELECT villa FROM symposion_gods WHERE navn = ?", navn),
    en("SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ?", navn),
    en("SELECT COUNT(*) AS n FROM hotell_respekt WHERE til = ?", navn),
    en("SELECT COUNT(*) AS n FROM hotell_gave WHERE fra = ?", navn),
    en("SELECT COUNT(*) AS n FROM auditoriet_samtale WHERE navn = ? AND rolle = 'professor'", navn),
    en("SELECT COUNT(*) AS n FROM hotell_skatt WHERE navn = ?", navn),
    en("SELECT COUNT(*) AS n FROM hotell_gjestebok WHERE navn = ? AND eier != ?", navn, navn),
    ...Object.values(KRAV).map((k) => en(k.sql, navn)),
  ]);
  const n = (r) => (r && r.n) || 0;
  const liste = [{ id: "gjest", navn: "Innsjekket", tekst: "Har sjekket inn på Tafse Hotell" }];
  const legg = (ok, id, tittel, tekst) => { if (ok) liste.push({ id, navn: tittel, tekst }); };
  legg(villa && villa.villa >= 1, "godseier", "Godseier", "Har flyttet inn i Symposion");
  legg(villa && villa.villa >= 8, "patrisier", "Patrisier", "Villa på nivå 8 eller høyere");
  legg(n(mobler) >= 10, "innreder", "Innreder", "Eier ti møbler");
  legg(n(mobler) >= 40, "samler", "Samler", "Eier førti møbler");
  legg(n(respekt) >= 5, "respektert", "Respektert", "Har fått respekt fem ganger");
  legg(n(respekt) >= 25, "aeret", "Høyt æret", "Har fått respekt 25 ganger");
  legg(n(gave) >= 1, "gavmild", "Gavmild", "Har gitt bort et møbel");
  legg(n(prof) >= 10, "disputert", "Disputert", "Har holdt ut ti svar fra professoren");
  legg(n(skatt) >= 1, "skattejeger", "Skattejeger", "Har funnet en skatt");
  legg(n(skatt) >= 10, "sjorover", "Sjørøver", "Har funnet ti skatter");
  legg(n(bok) >= 3, "hoflig", "Høflig gjest", "Har skrevet i tre gjestebøker");
  const BRAGD = { "2048": "Mosaikkmester", tetris: "Byggmester", snake: "Slangetemmer", murbrekker: "Murbrekker", spill: "Overlevde Idus", tartaros: "Så daggry" };
  Object.keys(KRAV).forEach((k, i) => legg(!!bragd[i], "bragd_" + k, BRAGD[k] || k, KRAV[k].tekst.replace(/^Krever (at du har )?/, "Har ").replace(/^Har (\d)/, "$1")));
  return { merker: liste, respekt: n(respekt) };
}

const ren = (v, maks) => (typeof v === "string" ? v : "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maks);
const vis = (navn) => String(navn).replace(/ \(gjest\)$/, "");

// POST-handlingene. Gir null hvis handlingen ikke hører hjemme her.
export async function sosialPost({ db, meg, handling, b, naaMs, json, feil, KATALOG, MAKS_MOBLER, hjem }) {
  const iso = (ms) => new Date(ms).toISOString(), naa = iso(naaMs);
  const dag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(naaMs));
  const jeg = () => db.prepare("SELECT rom, x, y FROM hotell_gjest WHERE navn = ?").bind(meg).first();
  const finnes = (navn) => db.prepare("SELECT navn, rom FROM hotell_gjest WHERE navn = ?").bind(String(navn || "")).first();
  const prat = (rom, type, tekst, navn = meg) => db.prepare("INSERT INTO hotell_prat (rom, navn, type, tekst, opprettet) VALUES (?, ?, ?, ?, ?)").bind(rom, navn, type, tekst, naa).run();
  const forMye = async () => (await db.prepare("SELECT COUNT(*) AS n FROM hotell_prat WHERE navn = ? AND opprettet > ?").bind(meg, iso(naaMs - 10000)).first()).n >= 8;

  if (handling === "hvisk") {
    const [j, til] = await Promise.all([jeg(), finnes(b.til)]);
    const tekst = ren(b.tekst, 140);
    if (!j) return feil(400, "Du må sjekke inn først.");
    if (!til || til.navn === meg) return feil(400, "Fant ikke den du vil hviske til.");
    if (til.rom !== j.rom) return feil(400, `${vis(til.navn)} er ikke i rommet lenger.`);
    if (!tekst) return feil(400, "Skriv noe først.");
    if (await forMye()) return feil(429, "Rolig nå. Trekk pusten før du sier mer.");
    await prat(j.rom, "hvisk", til.navn + SKILLE + tekst);
    return json({ ok: true }, 201);
  }
  if (handling === "slibrig") {
    const [j, til] = await Promise.all([jeg(), finnes(b.til)]);
    if (!j || !til || til.navn === meg) return feil(400, "Fant ikke den du vil si noe til.");
    if (til.rom !== j.rom) return feil(400, `${vis(til.navn)} er ikke i rommet lenger.`);
    if (await forMye()) return feil(429, "Rolig nå. Trekk pusten før du sier mer.");
    const mangel = mangler(await lommebok(db, meg), SLIBRIG_PRIS);
    if (mangel.length) return feil(400, `Slibrigheter koster ${SLIBRIG_PRIS.oliven} oliven. Du mangler ${mangel.join(", ")}. Høst i Symposion.`);
    await betal(db, meg, SLIBRIG_PRIS);
    const tekst = SLIBRIGE[Math.floor(Math.random() * SLIBRIGE.length)].replace("{navn}", vis(til.navn));
    await prat(j.rom, "si", tekst);
    return json({ ok: true, tekst }, 201);
  }
  if (handling === "terning") {
    const j = await jeg();
    if (!j) return feil(400, "Du må sjekke inn først.");
    if (await forMye()) return feil(429, "Terningen er varm. Vent litt.");
    const verdi = 1 + Math.floor(Math.random() * 6);
    await prat(j.rom, "terning", String(verdi));
    return json({ verdi }, 201);
  }
  if (handling === "musikk") {
    const j = await jeg();
    if (!j || j.rom !== "baren") return feil(400, "Jukeboksen står i baren.");
    if (!SANGER[b.sang]) return feil(400, "Den sangen har vi ikke.");
    const nylig = await db.prepare("SELECT 1 FROM hotell_prat WHERE rom = 'baren' AND type = 'musikk' AND opprettet > ? LIMIT 1").bind(iso(naaMs - 15000)).first();
    if (nylig) return feil(429, "La sangen spille ferdig først.");
    await prat("baren", "musikk", b.sang);
    return json({ ok: true }, 201);
  }
  if (handling === "respekt") {
    const [j, til] = await Promise.all([jeg(), finnes(b.til)]);
    if (!j || !til || til.navn === meg) return feil(400, "Fant ikke den du vil gi respekt.");
    const gitt = (await db.prepare("SELECT til FROM hotell_respekt WHERE fra = ? AND dag = ?").bind(meg, dag).all()).results;
    if (gitt.length >= RESPEKT_PER_DAG) return feil(429, "Du har delt ut all respekten din for i dag.");
    if (gitt.some((r) => r.til === til.navn)) return feil(409, `Du har allerede gitt ${vis(til.navn)} respekt i dag.`);
    await db.prepare("INSERT INTO hotell_respekt (fra, til, dag) VALUES (?, ?, ?)").bind(meg, til.navn, dag).run();
    await prat(j.rom, "hendelse", `${vis(meg)} ga respekt til ${vis(til.navn)}.`);
    return json({ ok: true, igjen: RESPEKT_PER_DAG - gitt.length - 1 }, 201);
  }
  if (handling === "gave") {
    const [j, til] = await Promise.all([jeg(), finnes(b.til)]);
    if (!j || !til || til.navn === meg) return feil(400, "Fant ikke den du vil gi en gave.");
    const m = await db.prepare("SELECT id, type FROM hotell_mobel WHERE id = ? AND eier = ? AND x IS NULL").bind(Math.round(Number(b.id)) || 0, meg).first();
    if (!m) return feil(404, "Du kan bare gi bort møbler som ligger på lageret ditt.");
    const antall = await db.prepare("SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ?").bind(til.navn).first();
    if (antall.n >= MAKS_MOBLER) return feil(409, `${vis(til.navn)} har ikke plass til flere møbler.`);
    const hva = (KATALOG[m.type] && KATALOG[m.type].navn) || m.type;
    await db.batch([
      db.prepare("UPDATE hotell_mobel SET eier = ? WHERE id = ?").bind(til.navn, m.id),
      db.prepare("INSERT INTO hotell_gave (fra, til, type, opprettet) VALUES (?, ?, ?, ?)").bind(meg, til.navn, m.type, naa),
    ]);
    await prat(j.rom, "hendelse", `${vis(meg)} ga ${vis(til.navn)} en gave: ${hva.toLowerCase()}.`);
    return json({ ok: true, hva, hjem: await hjem(meg) }, 201);
  }
  if (handling === "gjestebok") {
    const j = await jeg();
    if (b.slett) {
      await db.prepare("DELETE FROM hotell_gjestebok WHERE id = ? AND (eier = ? OR navn = ?)").bind(Math.round(Number(b.slett)) || 0, meg, meg).run();
      return json({ ok: true, hjem: j && j.rom.startsWith("hjem:") ? await hjem(j.rom.slice(5)) : null });
    }
    if (!j || !j.rom.startsWith("hjem:")) return feil(400, "Gjesteboka ligger i rommene til folk.");
    const eier = j.rom.slice(5), tekst = ren(b.tekst, 200);
    if (!tekst) return feil(400, "Skriv noe først.");
    const idag = await db.prepare("SELECT COUNT(*) AS n FROM hotell_gjestebok WHERE eier = ? AND navn = ? AND opprettet > ?").bind(eier, meg, iso(naaMs - 86400000)).first();
    if (idag.n >= 3) return feil(429, "Tre hilsener om dagen får holde.");
    await db.batch([
      db.prepare("INSERT INTO hotell_gjestebok (eier, navn, tekst, opprettet) VALUES (?, ?, ?, ?)").bind(eier, meg, tekst, naa),
      db.prepare("DELETE FROM hotell_gjestebok WHERE eier = ? AND id NOT IN (SELECT id FROM hotell_gjestebok WHERE eier = ? ORDER BY id DESC LIMIT 60)").bind(eier, eier),
    ]);
    if (eier !== meg) await prat(j.rom, "hendelse", `${vis(meg)} skrev i gjesteboka.`);
    return json({ ok: true, hjem: await hjem(eier) }, 201);
  }
  if (handling === "skatt") {
    const [j, s] = [await jeg(), skattNaa(naaMs)];
    if (!j || j.rom !== s.rom || j.x !== s.x || j.y !== s.y) return feil(400, "Det ligger ingen skatt der.");
    try { await db.prepare("INSERT INTO hotell_skatt (luke, navn, valuta, antall, opprettet) VALUES (?, ?, ?, ?, ?)").bind(s.luke, meg, s.valuta, s.antall, naa).run(); }
    catch (_) { return feil(409, "Noen kom deg i forkjøpet."); }
    await db.prepare(`INSERT INTO premier (navn, valuta, antall, sist_dag) VALUES (?, ?, ?, NULL)
      ON CONFLICT(navn, valuta) DO UPDATE SET antall = antall + excluded.antall`).bind(meg, s.valuta, s.antall).run();
    await prat(j.rom, "hendelse", `${vis(meg)} fant skatten: ${s.antall} ${SKATTEVALUTA[s.valuta]}!`);
    return json({ ok: true, antall: s.antall, hva: SKATTEVALUTA[s.valuta] }, 201);
  }
  return null;
}

// GET hotell/kort?navn=…: profilkortet til en gjest
export async function kort({ db, meg, navn, naaMs, KRAV }) {
  const g = await db.prepare("SELECT navn, utseende FROM hotell_gjest WHERE navn = ?").bind(String(navn || "")).first();
  if (!g) return null;
  const dag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(naaMs));
  const [m, gitt, lager] = await Promise.all([
    merker(db, g.navn, KRAV),
    db.prepare("SELECT til FROM hotell_respekt WHERE fra = ? AND dag = ?").bind(meg, dag).all(),
    db.prepare("SELECT id, type FROM hotell_mobel WHERE eier = ? AND x IS NULL ORDER BY id LIMIT 40").bind(meg).all(),
  ]);
  let utseende = null; try { utseende = JSON.parse(g.utseende); } catch (_) {}
  return { navn: g.navn, utseende, ...m, respektIgjen: RESPEKT_PER_DAG - gitt.results.length, gittIDag: gitt.results.some((r) => r.til === g.navn), lager: lager.results, slibrigPris: SLIBRIG_PRIS.oliven };
}

export const gjestebok = async (db, eier) =>
  (await db.prepare("SELECT id, navn, tekst, opprettet FROM hotell_gjestebok WHERE eier = ? ORDER BY id DESC LIMIT 20").bind(eier).all()).results;
