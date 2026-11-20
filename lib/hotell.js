// TAFSE HOTELL: serverlogikk. Holder orden på hvem som er i hvilket rom, hvor de står,
// hvordan de ser ut, hva som blir sagt og hvordan brødrene har innredet rommene sine.
// Fellesrommene er tegnet i assets/hotell.js. Rommet til en bror heter «hjem:Navn»,
// vokser med villaen hans i Symposion og innredes med premiene fra alle spillene (lib/premier.js).

import { VALUTA, lommebok, mangler, betal } from "./premier.js";
import { bytte, mittBytte, stjerne, stjerner, alleStjerner, SKJEMA as BYTTE_SKJEMA } from "./hotellbytte.js";
import { professorSvarer, TALERSTOL, SKJEMA as AUDITORIET_SKJEMA } from "./auditoriet.js";
import { okonomi, okonomiPost, SKJEMA as OKONOMI_SKJEMA } from "./hotellokonomi.js";
import { sosialPost, kort, gjestebok, filtrerPrat, ledigSkatt, SANGER, SKJEMA as SOSIALT_SKJEMA } from "./hotellsosialt.js";

const FELLESROM = ["lobbyen", "baren", "terrassen", "auditoriet"];
const GESTER = ["vink", "skal", "dans", "klapp", "ler"];
const BORTE_ETTER = 25000;   // millisekunder uten livstegn før en gjest regnes som gått
const PULS = 8000;           // så ofte oppdateres «sist sett» mens man står stille
const MAKS_MOBLER = 80;
const UTSEENDE = { hud: /^#[0-9a-f]{6}$/i, harfarge: /^#[0-9a-f]{6}$/i, toga: /^#[0-9a-f]{6}$/i, har: /^[a-zæøå]{1,12}$/, skjegg: /^(ja|nei|bart|fipp)$/, oyne: /^[a-zæøå]{1,12}$/, munn: /^[a-zæøå]{1,12}$/, plagg: /^[a-zæøå]{1,12}$/, sko: /^[a-zæøå]{1,12}$/, briller: /^(ja|nei)$/, klar: /^ja$/, v: /^2$/ };   // v: figuren er laget med de nye tegningene
const BARES = ["hode", "pynt", "dyr"];
const GRUNNTREKK = ["hud", "har", "harfarge", "toga", "skjegg", "oyne", "munn", "plagg", "sko", "briller"];
const BYTTE_UTSEENDE = { oliven: 100 };   // prisen for å bytte utseende etter innsjekken   // det man kan ha på seg eller med seg, kjøpt i butikken

// Butikken. kat er fanen varen ligger under. slag sier hva varen er:
//   (ingenting) et møbel som settes ut i rommet, gulv/vegg en stil for hele rommet,
//   hode/pynt/dyr noe figuren har på seg eller med seg, utvidelse gjør rommet større.
// lag sier hvor et møbel ligger på flisa: «gulv» under alt annet, «vegg» på veggen bak.
// krav er en bragd i et spill (se KRAV under). Tegningene ligger i assets/hotell.js.
export const KATEGORIER = { mobler: "Møbler", pynt: "Planter og pynt", gulv: "Tepper og fliser", vegg: "Veggpynt", trofe: "Trofeer", rom: "Gulv, vegger og plass", klar: "Garderoben", dyr: "Kjæledyr" };
const ALT = { oliven: 300, vin: 200, marmor: 150, drakmer: 100, mosaikk: 100, tegl: 100, blokker: 100, skinn: 100, dolker: 100, gnister: 100 };
const SEKS = (n) => ({ drakmer: n, mosaikk: n, tegl: n, blokker: n, skinn: n, dolker: n });
export const KATALOG = {
  // Møbler
  krakk: { navn: "Krakk", kat: "mobler", pris: { oliven: 40 } },
  bord: { navn: "Bord", kat: "mobler", pris: { oliven: 80, vin: 20 } },
  sofa: { navn: "Sofa", kat: "mobler", pris: { oliven: 120, vin: 60 } },
  seng: { navn: "Seng", kat: "mobler", pris: { oliven: 150, vin: 50 } },
  solseng: { navn: "Solseng", kat: "mobler", pris: { oliven: 100, marmor: 30 } },
  benk: { navn: "Marmorbenk", kat: "mobler", pris: { marmor: 80 } },
  kline: { navn: "Kline", kat: "mobler", pris: { oliven: 120, vin: 80 } },
  bokhylle: { navn: "Skriftrullhylle", kat: "mobler", pris: { oliven: 100, blokker: 60 } },
  festbord: { navn: "Festbord", kat: "mobler", pris: { vin: 120, oliven: 80, tegl: 40 } },
  spillebord: { navn: "Spillebord", kat: "mobler", pris: { mosaikk: 90, blokker: 60 } },
  kiste: { navn: "Skattekiste", kat: "mobler", pris: { drakmer: 120 } },
  lyre: { navn: "Lyre", kat: "mobler", pris: { drakmer: 60, vin: 60 } },
  ildsted: { navn: "Ildsted", kat: "mobler", pris: { tegl: 150 } },
  badekar: { navn: "Badekar", kat: "mobler", pris: { marmor: 120, tegl: 80 } },
  alkymibord: { navn: "Alkymistens bord", kat: "mobler", pris: { gnister: 120, tegl: 40 } },
  // Planter og pynt
  plante: { navn: "Plante", kat: "pynt", pris: { oliven: 60 } },
  amfora: { navn: "Amfora", kat: "pynt", pris: { oliven: 30, vin: 40 } },
  fakkel: { navn: "Fakkel", kat: "pynt", pris: { oliven: 50, vin: 20 } },
  vinfat: { navn: "Vinfat", kat: "pynt", pris: { vin: 120 } },
  tre: { navn: "Oliventre", kat: "pynt", pris: { oliven: 200 } },
  soyle: { navn: "Søyle", kat: "pynt", pris: { marmor: 150 } },
  statue: { navn: "Statue", kat: "pynt", pris: { marmor: 300 } },
  vase: { navn: "Blomstervase", kat: "pynt", pris: { mosaikk: 50 } },
  kandelaber: { navn: "Kandelaber", kat: "pynt", pris: { tegl: 60, dolker: 30 } },
  ildskal: { navn: "Ildskål", kat: "pynt", pris: { drakmer: 90 } },
  laurbartre: { navn: "Laurbærtre", kat: "pynt", pris: { oliven: 150, dolker: 40 } },
  druestokk: { navn: "Druestokk", kat: "pynt", pris: { vin: 150, skinn: 30 } },
  fontene: { navn: "Fontene", kat: "pynt", pris: { marmor: 200, mosaikk: 100 } },
  lavalampe: { navn: "Lavalampe", kat: "pynt", pris: { gnister: 150 } },
  diamantpute: { navn: "Diamant på pute", kat: "pynt", pris: { gnister: 200 } },
  // Tepper og fliser
  teppe: { navn: "Teppe", kat: "gulv", lag: "gulv", pris: { oliven: 60, vin: 30 } },
  delfin: { navn: "Delfinmosaikk", kat: "gulv", lag: "gulv", pris: { mosaikk: 80 } },
  dansegulv: { navn: "Dansegulv", kat: "gulv", lag: "gulv", pris: { mosaikk: 60, vin: 40 } },
  tetristeppe: { navn: "Tetrominoteppe", kat: "gulv", lag: "gulv", pris: { blokker: 90 } },
  slangeteppe: { navn: "Slangeskinnsteppe", kat: "gulv", lag: "gulv", pris: { skinn: 100 } },
  basseng: { navn: "Basseng", kat: "gulv", lag: "gulv", pris: { marmor: 100, mosaikk: 60 } },
  // Veggpynt
  freske: { navn: "Freske", kat: "vegg", lag: "vegg", pris: { oliven: 100, vin: 50 } },
  vindu: { navn: "Vindu", kat: "vegg", lag: "vegg", pris: { tegl: 80 } },
  vegglampe: { navn: "Vegglampe", kat: "vegg", lag: "vegg", pris: { tegl: 50 } },
  speil: { navn: "Speil", kat: "vegg", lag: "vegg", pris: { mosaikk: 70, marmor: 40 } },
  skjold: { navn: "Hoplittskjold", kat: "vegg", lag: "vegg", pris: { drakmer: 80 } },
  spyd: { navn: "Kryssede spyd", kat: "vegg", lag: "vegg", pris: { drakmer: 60, dolker: 40 } },
  dolksamling: { navn: "Dolksamling", kat: "vegg", lag: "vegg", pris: { dolker: 150 } },
  veggskinn: { navn: "Utspent slangeskinn", kat: "vegg", lag: "vegg", pris: { skinn: 150 } },
  relieff: { navn: "Steinrelieff", kat: "vegg", lag: "vegg", pris: { blokker: 120 } },
  // Trofeer: én valuta og en bragd i spillet
  t2048: { navn: "Den gylne brikken", kat: "trofe", pris: { mosaikk: 600 }, krav: "2048" },
  ttetris: { navn: "Tetristårnet", kat: "trofe", pris: { blokker: 500 }, krav: "tetris" },
  tsnake: { navn: "Slangetemmerens kurv", kat: "trofe", pris: { skinn: 500 }, krav: "snake" },
  tmur: { navn: "Rambukken", kat: "trofe", pris: { tegl: 500 }, krav: "murbrekker" },
  tidus: { navn: "Cæsars byste", kat: "trofe", pris: { dolker: 400 }, krav: "spill" },
  ttartaros: { navn: "Kronos' timeglass", kat: "trofe", pris: { drakmer: 400 }, krav: "tartaros" },
  tkaos: { navn: "Prometevs' fakkel", kat: "trofe", pris: { gnister: 400 }, krav: "kaos" },
  tsymposion: { navn: "Det gylne oliventreet", kat: "trofe", pris: { oliven: 2000, vin: 1000, marmor: 800 } },
  trone: { navn: "Olympens trone", kat: "trofe", pris: ALT },
  // Gulv, vegger og plass
  gulv_sjakk: { navn: "Sjakkmarmor", kat: "rom", slag: "gulv", pris: { marmor: 300 } },
  gulv_hav: { navn: "Havmosaikk", kat: "rom", slag: "gulv", pris: { mosaikk: 300 } },
  gulv_tegl: { navn: "Teglgulv", kat: "rom", slag: "gulv", pris: { tegl: 250 } },
  gulv_tetris: { navn: "Tetrisgulv", kat: "rom", slag: "gulv", pris: { blokker: 300 } },
  gulv_slange: { navn: "Slangeskinnsgulv", kat: "rom", slag: "gulv", pris: { skinn: 300 } },
  gulv_senat: { navn: "Senatsgulv", kat: "rom", slag: "gulv", pris: { dolker: 250 } },
  gulv_lava: { navn: "Tartarosgulv", kat: "rom", slag: "gulv", pris: { drakmer: 300 } },
  vegg_pompeii: { navn: "Pompeiirødt", kat: "rom", slag: "vegg", pris: { tegl: 200 } },
  vegg_natt: { navn: "Stjernehimmel", kat: "rom", slag: "vegg", pris: { drakmer: 200 } },
  vegg_elfenben: { navn: "Elfenben med meander", kat: "rom", slag: "vegg", pris: { marmor: 250 } },
  vegg_vin: { navn: "Vinrødt", kat: "rom", slag: "vegg", pris: { vin: 300 } },
  vegg_mosaikk: { navn: "Mosaikkvegg", kat: "rom", slag: "vegg", pris: { mosaikk: 250 } },
  vegg_tetris: { navn: "Blokkvegg", kat: "rom", slag: "vegg", pris: { blokker: 250 } },
  vegg_jungel: { navn: "Slangegrønt", kat: "rom", slag: "vegg", pris: { skinn: 250 } },
  utvidelse1: { navn: "Utvidelse", kat: "rom", slag: "utvidelse", pris: SEKS(60) },
  utvidelse2: { navn: "Stor utvidelse", kat: "rom", slag: "utvidelse", pris: SEKS(150), etter: "utvidelse1" },
  // Garderoben
  hode_krans: { navn: "Laurbærkrans", kat: "klar", slag: "hode", pris: { dolker: 120 } },
  hode_hjelm: { navn: "Hoplitthjelm", kat: "klar", slag: "hode", pris: { drakmer: 150 } },
  hode_hatt: { navn: "Stråhatt", kat: "klar", slag: "hode", pris: { oliven: 150 } },
  hode_vinlov: { navn: "Vinløvkrans", kat: "klar", slag: "hode", pris: { vin: 200 } },
  hode_medusa: { navn: "Medusahår", kat: "klar", slag: "hode", pris: { skinn: 250 } },
  hode_krone: { navn: "Gullkrone", kat: "klar", slag: "hode", pris: { mosaikk: 100, blokker: 100, tegl: 100 } },
  pynt_dolk: { navn: "Dolk i ryggen", kat: "klar", slag: "pynt", pris: { dolker: 200 } },
  pynt_kappe: { navn: "Purpurkappe", kat: "klar", slag: "pynt", pris: { tegl: 150, vin: 100 } },
  pynt_vinger: { navn: "Ikaros' vinger", kat: "klar", slag: "pynt", pris: { drakmer: 250, skinn: 100 } },
  // Kjæledyr
  dyr_slange: { navn: "Slange", kat: "dyr", slag: "dyr", pris: { skinn: 300 } },
  dyr_ugle: { navn: "Athenes ugle", kat: "dyr", slag: "dyr", pris: { mosaikk: 300 } },
  dyr_kerberos: { navn: "Kerberosvalp", kat: "dyr", slag: "dyr", pris: { drakmer: 350 } },
  dyr_vaer: { navn: "Vær", kat: "dyr", slag: "dyr", pris: { tegl: 300 } },
  dyr_skilpadde: { navn: "Skilpadde", kat: "dyr", slag: "dyr", pris: { blokker: 300 } },
  dyr_ravn: { navn: "Ravn", kat: "dyr", slag: "dyr", pris: { dolker: 300 } },
  dyr_salamander: { navn: "Salamander", kat: "dyr", slag: "dyr", pris: { gnister: 300 } },
  dyr_geit: { navn: "Geit", kat: "dyr", slag: "dyr", pris: { oliven: 600, vin: 300 } },
};
// Bragdene trofeene krever. Spørringen gir en rad hvis broren har klart det.
const KRAV = {
  "2048": { tekst: "Krever at du har nådd brikken 2048", sql: "SELECT 1 AS ok FROM tall2048 WHERE navn = ? AND brikke >= 2048 LIMIT 1" },
  tetris: { tekst: "Krever 100 linjer i ett spill Tetris", sql: "SELECT 1 AS ok FROM tetris WHERE navn = ? AND linjer >= 100 LIMIT 1" },
  snake: { tekst: "Krever en slange på 40 ledd i Snake", sql: "SELECT 1 AS ok FROM snake WHERE navn = ? AND lengde >= 40 LIMIT 1" },
  murbrekker: { tekst: "Krever at du har nådd nivå 5 i Murbrekker", sql: "SELECT 1 AS ok FROM murbrekker WHERE navn = ? AND niva >= 5 LIMIT 1" },
  spill: { tekst: "Krever at du har overlevd Idus Martiae", sql: "SELECT 1 AS ok FROM spillresultater WHERE navn = ? AND seier = 1 LIMIT 1" },
  tartaros: { tekst: "Krever at du har holdt ut til daggry i Tartaros", sql: "SELECT 1 AS ok FROM tartaros WHERE navn = ? AND seier = 1 LIMIT 1" },
  kaos: { tekst: "Krever 20 oppdagelser i Kaos", sql: "SELECT 1 AS ok FROM kaos_funn WHERE navn = ? GROUP BY navn HAVING COUNT(*) >= 20" },
};
// Rommet er kvadratisk. Størrelsen følger villanivået i Symposion (0 = ikke flyttet inn).
// Utvidelser fra butikken legger til én flis hver vei.
const storrelse = (niva) => (niva <= 0 ? 4 : niva <= 2 ? 5 : niva <= 4 ? 6 : niva <= 7 ? 7 : 8);
const MAKS_STORRELSE = 10;
const RESERVERT = [[1, 0], [1, 1]]; // døra og flisa foran den

// Kolonner som er lagt til etter at tabellene ble laget. Kjøres hver for seg, og feiler stille når de finnes.
// retning: hvilken vei møbelet står, 0–3 (se MOT i assets/hotell.js). Tom betyr «mot nærmeste vegg».
export const MIGRERING = ["ALTER TABLE hotell_mobel ADD COLUMN retning INTEGER"];

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS hotell_gjest (
    navn TEXT PRIMARY KEY, rom TEXT NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL,
    utseende TEXT, sist_sett TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hotell_prat (
    id INTEGER PRIMARY KEY AUTOINCREMENT, rom TEXT NOT NULL, navn TEXT NOT NULL,
    type TEXT NOT NULL, tekst TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hotell_mobel (
    id INTEGER PRIMARY KEY AUTOINCREMENT, eier TEXT NOT NULL, type TEXT NOT NULL, x INTEGER, y INTEGER
  )`,
  // Det en bror eier utenom møblene (stiler, klær, kjæledyr, utvidelser), og stilen han har valgt på rommet
  `CREATE TABLE IF NOT EXISTS hotell_rom (
    navn TEXT PRIMARY KEY, gulv TEXT NOT NULL DEFAULT '', vegg TEXT NOT NULL DEFAULT '', eid TEXT NOT NULL DEFAULT '[]'
  )`,
  ...AUDITORIET_SKJEMA,
  ...SOSIALT_SKJEMA, ...BYTTE_SKJEMA, ...OKONOMI_SKJEMA,
];

const tolk = (s) => { try { return s ? JSON.parse(s) : null; } catch (_) { return null; } };
const heltall = (v, maks) => Math.max(0, Math.min(maks, Math.round(Number(v) || 0)));

export async function hotell({ db, ai, modell, meg, metode, handling, request, url, medlemmer, json, feil, lesJson }) {
  const naaMs = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const naa = iso(naaMs);
  // Hvem eier rommet «hjem:Navn»? Både brødre og gjester har eget rom.
  const eierAv = async (rom) => {
    if (typeof rom !== "string" || !rom.startsWith("hjem:")) return null;
    const navn = rom.slice(5);
    if (medlemmer.includes(navn)) return navn;
    if (!navn.endsWith(" (gjest)")) return null;
    const g = await db.prepare("SELECT navn FROM gjester WHERE navn = ?").bind(navn.slice(0, -8)).first();
    return g && `${g.navn} (gjest)` === navn ? navn : null;
  };

  const romdata = async (navn) => {
    const r = await db.prepare("SELECT gulv, vegg, eid FROM hotell_rom WHERE navn = ?").bind(navn).first();
    const eid = tolk(r && r.eid);
    return { gulv: (r && r.gulv) || "", vegg: (r && r.vegg) || "", eid: Array.isArray(eid) ? eid : [] };
  };
  const lagreRom = (rd) => db.prepare(`INSERT INTO hotell_rom (navn, gulv, vegg, eid) VALUES (?, ?, ?, ?)
    ON CONFLICT(navn) DO UPDATE SET gulv = excluded.gulv, vegg = excluded.vegg, eid = excluded.eid`).bind(meg, rd.gulv, rd.vegg, JSON.stringify(rd.eid)).run();
  const oppfylt = async (krav) => { try { return !!(await db.prepare(KRAV[krav].sql).bind(meg).first()); } catch (_) { return false; } };

  // Alt siden trenger for å tegne rommet til en bror. Eieren får også lageret sitt.
  async function hjem(eier) {
    const [gods, rd, alle] = await Promise.all([
      db.prepare("SELECT villa FROM symposion_gods WHERE navn = ?").bind(eier).first(),
      romdata(eier),
      db.prepare("SELECT id, type, x, y, retning FROM hotell_mobel WHERE eier = ? ORDER BY id").bind(eier).all(),
    ]);
    const niva = gods ? gods.villa : 0;
    const ekstra = rd.eid.filter((id) => KATALOG[id] && KATALOG[id].slag === "utvidelse").length;
    const info = { eier, niva, storrelse: Math.min(MAKS_STORRELSE, storrelse(niva) + ekstra), gulv: rd.gulv, vegg: rd.vegg, mobler: alle.results.filter((m) => m.x !== null), gjestebok: await gjestebok(db, eier) };
    Object.assign(info, await stjerner(db, eier, meg));
    if (eier === meg) {
      info.lager = alle.results.filter((m) => m.x === null).map(({ id, type }) => ({ id, type }));
      info.harGods = !!gods;
    }
    return info;
  }
  // Butikken: lommeboka, katalogen og hva broren allerede eier
  async function butikk() {
    const [bok, rd, antall, ...klart] = await Promise.all([
      lommebok(db, meg), romdata(meg),
      db.prepare("SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ?").bind(meg).first(),
      ...Object.keys(KRAV).map(oppfylt),
    ]);
    const krav = Object.fromEntries(Object.keys(KRAV).map((k, i) => [k, { tekst: KRAV[k].tekst, ok: klart[i] }]));
    const lager = (await db.prepare("SELECT id, type FROM hotell_mobel WHERE eier = ? AND x IS NULL ORDER BY id").bind(meg).all()).results;
    return { lommebok: bok, valuta: VALUTA, kategorier: KATEGORIER, katalog: KATALOG, krav, eid: rd.eid, gulv: rd.gulv, vegg: rd.vegg, mobler: antall.n, maksMobler: MAKS_MOBLER, lager, byttepris: BYTTE_UTSEENDE };
  }

  if (metode === "POST") {
    const b = await lesJson(request);
    if (handling === "flytt") {
      const eier = await eierAv(b.rom);
      if (!eier && !FELLESROM.includes(b.rom)) return feil(400, "Det rommet finnes ikke.");
      const h = eier ? await hjem(eier) : null;
      const maks = h ? h.storrelse - 1 : 19;
      await db.prepare(`INSERT INTO hotell_gjest (navn, rom, x, y, utseende, sist_sett) VALUES (?, ?, ?, ?, NULL, ?)
        ON CONFLICT(navn) DO UPDATE SET rom = excluded.rom, x = excluded.x, y = excluded.y, sist_sett = excluded.sist_sett`)
        .bind(meg, b.rom, heltall(b.x, maks), heltall(b.y, maks), naa).run();
      return json({ ok: true, hjem: h });
    }
    // Professoren i auditoriet: den som står på talerstolen, får svar på alt.
    // Fra salen svarer han bare når noen nevner ham (ex auditorio).
    const paTalerstolen = (jeg) => jeg && jeg.rom === "auditoriet" && jeg.x === TALERSTOL[0] && jeg.y === TALERSTOL[1];
    const professor = (hendelse, tekst) => professorSvarer({ db, ai, modell, meg, erGjest: meg.endsWith(" (gjest)"), tekst, hendelse });
    if (handling === "professor") {
      const jeg = await db.prepare("SELECT rom, x, y FROM hotell_gjest WHERE navn = ?").bind(meg).first();
      if (!paTalerstolen(jeg)) return feil(400, "Gå opp på talerstolen først.");
      return json({ ok: true, svar: !!(await professor("talerstol", "")) });
    }
    if (handling === "si") {
      const jeg = await db.prepare("SELECT rom, x, y FROM hotell_gjest WHERE navn = ?").bind(meg).first();
      if (!jeg) return feil(400, "Du må sjekke inn først.");
      const gest = b.type === "gest";
      const tekst = gest ? (GESTER.includes(b.tekst) ? b.tekst : "")
        : (typeof b.tekst === "string" ? b.tekst : "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
      if (!tekst) return feil(400, "Skriv noe først.");
      const nylig = await db.prepare("SELECT COUNT(*) AS n FROM hotell_prat WHERE navn = ? AND opprettet > ?").bind(meg, iso(naaMs - 10000)).first();
      if (nylig.n >= 8) return feil(429, "Rolig nå. Trekk pusten før du sier mer.");
      const r = await db.prepare("INSERT INTO hotell_prat (rom, navn, type, tekst, opprettet) VALUES (?, ?, ?, ?, ?)")
        .bind(jeg.rom, meg, gest ? "gest" : "si", tekst, naa).run();
      const id = r.meta.last_row_id;
      // Praten er flyktig: rydd bort det som er eldre enn to døgn
      if (id % 40 === 0) await db.prepare("DELETE FROM hotell_prat WHERE opprettet < ?").bind(iso(naaMs - 2 * 86400000)).run();
      if (!gest && jeg.rom === "auditoriet") {
        if (paTalerstolen(jeg)) await professor("si", tekst);
        else if (/professor/i.test(tekst)) await professor("salen", tekst);
      }
      return json({ id }, 201);
    }
    if (handling === "utseende") {
      const u = {};
      for (const [k, regel] of Object.entries(UTSEENDE)) if (typeof b[k] === "string" && regel.test(b[k])) u[k] = b[k];
      // Første figur er gratis. Å bytte hud, hår, skjegg eller toga etterpå koster. Klær og dyr fra butikken er fritt.
      const gammel = tolk((await db.prepare("SELECT utseende FROM hotell_gjest WHERE navn = ?").bind(meg).first() || {}).utseende);
      // De som sjekket inn før figurene ble tegnet om (uten v), får lage figuren på nytt én gang uten å betale
      if (gammel && gammel.v === "2") u.v = "2";
      const koster = gammel && gammel.klar === "ja" && gammel.v === "2" && GRUNNTREKK.some((k) => u[k] !== undefined && u[k] !== gammel[k]);
      if (koster) {
        const mangel = mangler(await lommebok(db, meg), BYTTE_UTSEENDE);
        if (mangel.length) return feil(400, `Å bytte utseende koster ${BYTTE_UTSEENDE.oliven} oliven. Du mangler ${mangel.join(" og ")}.`);
        await betal(db, meg, BYTTE_UTSEENDE);
      }
      const { eid } = await romdata(meg);
      for (const k of BARES) if (typeof b[k] === "string" && KATALOG[b[k]] && KATALOG[b[k]].slag === k && eid.includes(b[k])) u[k] = b[k];
      await db.prepare(`INSERT INTO hotell_gjest (navn, rom, x, y, utseende, sist_sett) VALUES (?, 'lobbyen', 5, 9, ?, '')
        ON CONFLICT(navn) DO UPDATE SET utseende = excluded.utseende`).bind(meg, JSON.stringify(u)).run();
      return json({ ok: true, betalt: !!koster });
    }
    if (handling === "bytte") { const svar = await bytte({ db, meg, b, naaMs, json, feil, KATALOG, MAKS_MOBLER }); return svar; }
    if (handling === "stjerne") return stjerne({ db, meg, eier: await eierAv(`hjem:${b.eier}`), naaMs, json, feil });
    if (handling === "kjop") {
      const vare = KATALOG[b.type];
      if (!vare) return feil(400, "Den varen finnes ikke.");
      const rd = await romdata(meg);
      const mobel = !vare.slag;
      if (!mobel && rd.eid.includes(b.type)) return feil(409, "Den har du allerede.");
      if (vare.etter && !rd.eid.includes(vare.etter)) return feil(400, `Du må kjøpe «${KATALOG[vare.etter].navn}» først.`);
      if (vare.krav && !(await oppfylt(vare.krav))) return feil(400, `${KRAV[vare.krav].tekst}.`);
      const mangel = mangler(await lommebok(db, meg), vare.pris);
      if (mangel.length) return feil(400, `Du mangler ${mangel.join(", ").replace(/, ([^,]*)$/, " og $1")}.`);
      let id = null;
      if (mobel) {
        const antall = await db.prepare("SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ?").bind(meg).first();
        if (antall.n >= MAKS_MOBLER) return feil(409, `Du kan ha høyst ${MAKS_MOBLER} møbler.`);
      }
      await betal(db, meg, vare.pris);
      if (mobel) id = (await db.prepare("INSERT INTO hotell_mobel (eier, type, x, y) VALUES (?, ?, NULL, NULL)").bind(meg, b.type).run()).meta.last_row_id;
      else {
        rd.eid.push(b.type);
        if (vare.slag === "gulv" || vare.slag === "vegg") rd[vare.slag] = b.type;   // ny stil tas i bruk med en gang
        await lagreRom(rd);
      }
      return json({ ok: true, id, slag: vare.slag || "mobel", hjem: await hjem(meg), butikk: await butikk() }, 201);
    }
    // Velg mellom stilene man eier. Tom verdi gir stilen som følger villaen.
    if (handling === "stil") {
      const rd = await romdata(meg);
      for (const k of ["gulv", "vegg"]) {
        if (b[k] === "") rd[k] = "";
        else if (typeof b[k] === "string" && KATALOG[b[k]] && KATALOG[b[k]].slag === k && rd.eid.includes(b[k])) rd[k] = b[k];
      }
      await lagreRom(rd);
      return json({ ok: true, hjem: await hjem(meg), butikk: await butikk() });
    }
    if (handling === "mobel") {
      const m = await db.prepare("SELECT id, type FROM hotell_mobel WHERE id = ? AND eier = ?").bind(heltall(b.id, 1e12), meg).first();
      if (!m) return feil(404, "Det møbelet er ikke ditt.");
      if (b.x === null || b.x === undefined) {
        await db.prepare("UPDATE hotell_mobel SET x = NULL, y = NULL WHERE id = ?").bind(m.id).run();
      } else {
        const h = await hjem(meg);
        const x = Math.round(Number(b.x)), y = Math.round(Number(b.y));
        if (!(x >= 0 && y >= 0 && x < h.storrelse && y < h.storrelse)) return feil(400, "Det er utenfor rommet.");
        if (RESERVERT.some(([rx, ry]) => rx === x && ry === y)) return feil(400, "Du kan ikke sperre døra.");
        // Ett møbel per flis, pluss ett teppe under og én ting på veggen bak
        const lag = (type) => (KATALOG[type] && KATALOG[type].lag) || "";
        if (lag(m.type) === "vegg" && x !== 0 && y !== 0) return feil(400, "Veggpynt må henge på en flis inntil veggen.");
        if (h.mobler.some((a) => a.x === x && a.y === y && a.id !== m.id && lag(a.type) === lag(m.type))) return feil(409, "Det er allerede noe der.");
        await db.prepare("UPDATE hotell_mobel SET x = ?, y = ? WHERE id = ?").bind(x, y, m.id).run();
      }
      return json({ ok: true, hjem: await hjem(meg) });
    }
    // Snu et møbel som står i rommet ett kvart omløp
    if (handling === "snu") {
      const m = await db.prepare("SELECT id, x, retning FROM hotell_mobel WHERE id = ? AND eier = ? AND x IS NOT NULL").bind(heltall(b.id, 1e12), meg).first();
      if (!m) return feil(404, "Det møbelet står ikke i rommet ditt.");
      const naa = m.retning === null || m.retning === undefined ? (m.x === 0 ? 1 : 0) : m.retning;
      await db.prepare("UPDATE hotell_mobel SET retning = ? WHERE id = ?").bind((naa + 1) % 4, m.id).run();
      return json({ ok: true, hjem: await hjem(meg) });
    }
    if (handling === "ut") {
      await db.prepare("UPDATE hotell_gjest SET sist_sett = '' WHERE navn = ?").bind(meg).run();
      return json({ ok: true });
    }
    // Hvisking, respekt, gaver, gjestebok, terning, jukeboks og skattejakt (lib/hotellsosialt.js)
    // Leie, salg til baren og avtaler for godset (lib/hotellokonomi.js)
    const penger = await okonomiPost({ db, meg, handling, b, naaMs, json, feil, KATALOG });
    if (penger) return penger;
    const sosialt = await sosialPost({ db, meg, handling, b, naaMs, json, feil, KATALOG, MAKS_MOBLER, hjem });
    if (sosialt) return sosialt;
    return feil(404, "Ukjent handling.");
  }

  if (handling === "butikk") return json(await butikk());
  if (handling === "okonomi") return json(await okonomi({ db, meg, naaMs, KATALOG }));
  if (handling === "kort") {
    const k = await kort({ db, meg, navn: url.searchParams.get("navn"), naaMs, KRAV });
    return k ? json(k) : feil(404, "Fant ikke den gjesten.");
  }

  // GET hotell/profil: har broren laget figuren sin?
  if (handling === "profil") {
    const rad = await db.prepare("SELECT utseende FROM hotell_gjest WHERE navn = ?").bind(meg).first();
    return json({ utseende: tolk(rad && rad.utseende) });
  }

  // GET hotell: hvem er i rommet, og hva er sagt siden sist
  const onsket = url.searchParams.get("rom");
  const eier = await eierAv(onsket);
  const rom = eier || FELLESROM.includes(onsket) ? onsket : "lobbyen";
  const etter = heltall(url.searchParams.get("etter"), 1e12);
  const aktiv = iso(naaMs - BORTE_ETTER);
  await db.prepare("UPDATE hotell_gjest SET sist_sett = ? WHERE navn = ? AND rom = ? AND sist_sett < ? AND sist_sett > ''").bind(naa, meg, rom, iso(naaMs - PULS)).run();
  const gjester = (await db.prepare("SELECT navn, x, y, utseende FROM hotell_gjest WHERE rom = ? AND sist_sett > ?").bind(rom, aktiv).all()).results
    .map((g) => ({ navn: g.navn, x: g.x, y: g.y, utseende: tolk(g.utseende) }));
  const forste = url.searchParams.get("forste") === "1";
  let prat, sisteId;
  if (!forste) {
    prat = (await db.prepare("SELECT id, navn, type, tekst FROM hotell_prat WHERE rom = ? AND id > ? ORDER BY id LIMIT 40").bind(rom, etter).all()).results;
    sisteId = prat.length ? prat[prat.length - 1].id : etter;
    prat = filtrerPrat(prat, meg);
  } else {
    // Første gang: litt av det som nettopp er sagt, til loggen
    prat = (await db.prepare("SELECT id, navn, type, tekst FROM hotell_prat WHERE rom = ? AND type = 'si' AND opprettet > ? ORDER BY id DESC LIMIT 12").bind(rom, iso(naaMs - 600000)).all()).results.reverse();
    const maks = await db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM hotell_prat").first();
    sisteId = maks.id;
  }
  const antall = {};
  for (const r of (await db.prepare("SELECT rom, COUNT(*) AS n FROM hotell_gjest WHERE sist_sett > ? GROUP BY rom").bind(aktiv).all()).results) antall[r.rom] = r.n;
  // Gjester som har sjekket inn, så de også kan få besøk
  const gjesterom = (await db.prepare("SELECT navn FROM hotell_gjest WHERE navn LIKE '% (gjest)' AND substr(navn, 1, length(navn) - 8) IN (SELECT navn FROM gjester) ORDER BY navn LIMIT 200").all()).results.map((r) => r.navn);
  return json({ rom, gjester, prat, sisteId, forste, antall, medlemmer, gjesterom, bytte: await mittBytte(db, meg, naaMs), stjerner: await alleStjerner(db), hjem: eier ? await hjem(eier) : null, skatt: eier ? null : await ledigSkatt(db, rom, naaMs), sanger: SANGER });
}
