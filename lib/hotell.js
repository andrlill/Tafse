// TAFSE HOTELL: serverlogikk. Holder orden på hvem som er i hvilket rom, hvor de står,
// hvordan de ser ut, hva som blir sagt og hvordan brødrene har innredet rommene sine.
// Fellesrommene er tegnet i assets/hotell.js. Rommet til en bror heter «hjem:Navn»,
// vokser med villaen hans i Symposion og innredes med oliven, vin og marmor derfra.

const FELLESROM = ["lobbyen", "baren", "terrassen"];
const GESTER = ["vink", "skal", "dans"];
const BORTE_ETTER = 25000;   // millisekunder uten livstegn før en gjest regnes som gått
const PULS = 8000;           // så ofte oppdateres «sist sett» mens man står stille
const MAKS_MOBLER = 40;
const UTSEENDE = { hud: /^#[0-9a-f]{6}$/i, harfarge: /^#[0-9a-f]{6}$/i, toga: /^#[0-9a-f]{6}$/i, har: /^[a-zæøå]{1,12}$/, skjegg: /^(ja|nei)$/, klar: /^ja$/ };

// Møbelbutikken. Prisene betales med det man har høstet i Symposion.
export const KATALOG = {
  krakk: { navn: "Krakk", pris: { oliven: 40 } },
  plante: { navn: "Plante", pris: { oliven: 60 } },
  teppe: { navn: "Teppe", pris: { oliven: 60, vin: 30 } },
  bord: { navn: "Bord", pris: { oliven: 80, vin: 20 } },
  amfora: { navn: "Amfora", pris: { oliven: 30, vin: 40 } },
  fakkel: { navn: "Fakkel", pris: { oliven: 50, vin: 20 } },
  sofa: { navn: "Sofa", pris: { oliven: 120, vin: 60 } },
  seng: { navn: "Seng", pris: { oliven: 150, vin: 50 } },
  vinfat: { navn: "Vinfat", pris: { vin: 120 } },
  solseng: { navn: "Solseng", pris: { oliven: 100, marmor: 30 } },
  tre: { navn: "Oliventre", pris: { oliven: 200 } },
  soyle: { navn: "Søyle", pris: { marmor: 150 } },
  statue: { navn: "Statue", pris: { marmor: 300 } },
};
// Rommet er kvadratisk. Størrelsen følger villanivået i Symposion (0 = ikke flyttet inn).
const storrelse = (niva) => (niva <= 0 ? 4 : niva <= 2 ? 5 : niva <= 4 ? 6 : niva <= 7 ? 7 : 8);
const RESERVERT = [[1, 0], [1, 1]]; // døra og flisa foran den

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
];

const tolk = (s) => { try { return s ? JSON.parse(s) : null; } catch (_) { return null; } };
const heltall = (v, maks) => Math.max(0, Math.min(maks, Math.round(Number(v) || 0)));

export async function hotell({ db, meg, metode, handling, request, url, medlemmer, json, feil, lesJson }) {
  const naaMs = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const naa = iso(naaMs);
  const eierAv = (rom) => (typeof rom === "string" && rom.startsWith("hjem:") && medlemmer.includes(rom.slice(5)) ? rom.slice(5) : null);
  const gyldig = (rom) => FELLESROM.includes(rom) || !!eierAv(rom);

  // Alt siden trenger for å tegne rommet til en bror. Eieren får også lager, beholdning og butikk.
  async function hjem(eier) {
    const gods = await db.prepare("SELECT villa, oliven, vin, marmor FROM symposion_gods WHERE navn = ?").bind(eier).first();
    const alle = (await db.prepare("SELECT id, type, x, y FROM hotell_mobel WHERE eier = ? ORDER BY id").bind(eier).all()).results;
    const niva = gods ? gods.villa : 0;
    const info = { eier, niva, storrelse: storrelse(niva), mobler: alle.filter((m) => m.x !== null) };
    if (eier === meg) {
      info.lager = alle.filter((m) => m.x === null).map(({ id, type }) => ({ id, type }));
      info.harGods = !!gods;
      info.beholdning = gods ? { oliven: Math.floor(gods.oliven), vin: Math.floor(gods.vin), marmor: Math.floor(gods.marmor) } : { oliven: 0, vin: 0, marmor: 0 };
      info.katalog = KATALOG;
    }
    return info;
  }

  if (metode === "POST") {
    const b = await lesJson(request);
    if (handling === "flytt") {
      if (!gyldig(b.rom)) return feil(400, "Det rommet finnes ikke.");
      const eier = eierAv(b.rom);
      const h = eier ? await hjem(eier) : null;
      const maks = h ? h.storrelse - 1 : 19;
      await db.prepare(`INSERT INTO hotell_gjest (navn, rom, x, y, utseende, sist_sett) VALUES (?, ?, ?, ?, NULL, ?)
        ON CONFLICT(navn) DO UPDATE SET rom = excluded.rom, x = excluded.x, y = excluded.y, sist_sett = excluded.sist_sett`)
        .bind(meg, b.rom, heltall(b.x, maks), heltall(b.y, maks), naa).run();
      return json({ ok: true, hjem: h });
    }
    if (handling === "si") {
      const jeg = await db.prepare("SELECT rom FROM hotell_gjest WHERE navn = ?").bind(meg).first();
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
      return json({ id }, 201);
    }
    if (handling === "utseende") {
      const u = {};
      for (const [k, regel] of Object.entries(UTSEENDE)) if (typeof b[k] === "string" && regel.test(b[k])) u[k] = b[k];
      await db.prepare(`INSERT INTO hotell_gjest (navn, rom, x, y, utseende, sist_sett) VALUES (?, 'lobbyen', 5, 9, ?, '')
        ON CONFLICT(navn) DO UPDATE SET utseende = excluded.utseende`).bind(meg, JSON.stringify(u)).run();
      return json({ ok: true });
    }
    if (handling === "kjop") {
      const vare = KATALOG[b.type];
      if (!vare) return feil(400, "Den varen finnes ikke.");
      const gods = await db.prepare("SELECT oliven, vin, marmor FROM symposion_gods WHERE navn = ?").bind(meg).first();
      if (!gods) return feil(400, "Du må flytte inn i Symposion før du kan handle. Møblene betales med det du høster der.");
      const mangler = Object.entries(vare.pris).filter(([r, n]) => gods[r] < n).map(([r, n]) => `${Math.ceil(n - gods[r])} ${r}`);
      if (mangler.length) return feil(400, `Du mangler ${mangler.join(" og ")}.`);
      const antall = await db.prepare("SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ?").bind(meg).first();
      if (antall.n >= MAKS_MOBLER) return feil(409, `Du kan ha høyst ${MAKS_MOBLER} møbler.`);
      const p = { oliven: 0, vin: 0, marmor: 0, ...vare.pris };
      await db.prepare("UPDATE symposion_gods SET oliven = oliven - ?, vin = vin - ?, marmor = marmor - ? WHERE navn = ?").bind(p.oliven, p.vin, p.marmor, meg).run();
      const r = await db.prepare("INSERT INTO hotell_mobel (eier, type, x, y) VALUES (?, ?, NULL, NULL)").bind(meg, b.type).run();
      return json({ ok: true, id: r.meta.last_row_id, hjem: await hjem(meg) }, 201);
    }
    if (handling === "mobel") {
      const m = await db.prepare("SELECT id FROM hotell_mobel WHERE id = ? AND eier = ?").bind(heltall(b.id, 1e12), meg).first();
      if (!m) return feil(404, "Det møbelet er ikke ditt.");
      if (b.x === null || b.x === undefined) {
        await db.prepare("UPDATE hotell_mobel SET x = NULL, y = NULL WHERE id = ?").bind(m.id).run();
      } else {
        const h = await hjem(meg);
        const x = Math.round(Number(b.x)), y = Math.round(Number(b.y));
        if (!(x >= 0 && y >= 0 && x < h.storrelse && y < h.storrelse)) return feil(400, "Det er utenfor rommet.");
        if (RESERVERT.some(([rx, ry]) => rx === x && ry === y)) return feil(400, "Du kan ikke sperre døra.");
        if (h.mobler.some((a) => a.x === x && a.y === y && a.id !== m.id)) return feil(409, "Det står allerede noe der.");
        await db.prepare("UPDATE hotell_mobel SET x = ?, y = ? WHERE id = ?").bind(x, y, m.id).run();
      }
      return json({ ok: true, hjem: await hjem(meg) });
    }
    if (handling === "ut") {
      await db.prepare("UPDATE hotell_gjest SET sist_sett = '' WHERE navn = ?").bind(meg).run();
      return json({ ok: true });
    }
    return feil(404, "Ukjent handling.");
  }

  // GET hotell/profil: har broren laget figuren sin?
  if (handling === "profil") {
    const rad = await db.prepare("SELECT utseende FROM hotell_gjest WHERE navn = ?").bind(meg).first();
    return json({ utseende: tolk(rad && rad.utseende) });
  }

  // GET hotell: hvem er i rommet, og hva er sagt siden sist
  const rom = gyldig(url.searchParams.get("rom")) ? url.searchParams.get("rom") : "lobbyen";
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
  } else {
    // Første gang: litt av det som nettopp er sagt, til loggen
    prat = (await db.prepare("SELECT id, navn, type, tekst FROM hotell_prat WHERE rom = ? AND type = 'si' AND opprettet > ? ORDER BY id DESC LIMIT 12").bind(rom, iso(naaMs - 600000)).all()).results.reverse();
    const maks = await db.prepare("SELECT COALESCE(MAX(id), 0) AS id FROM hotell_prat").first();
    sisteId = maks.id;
  }
  const antall = {};
  for (const r of (await db.prepare("SELECT rom, COUNT(*) AS n FROM hotell_gjest WHERE sist_sett > ? GROUP BY rom").bind(aktiv).all()).results) antall[r.rom] = r.n;
  const eier = eierAv(rom);
  return json({ rom, gjester, prat, sisteId, forste, antall, medlemmer, hjem: eier ? await hjem(eier) : null });
}
