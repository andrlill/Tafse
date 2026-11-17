// TAFSE HOTELL: serverlogikk. Holder orden på hvem som er i hvilket rom, hvor de står,
// hvordan de ser ut og hva som blir sagt. Rommene selv er tegnet i assets/hotell.js.

const ROM = ["lobbyen", "baren", "terrassen"];
const GESTER = ["vink", "skal", "dans"];
const BORTE_ETTER = 25000;   // millisekunder uten livstegn før en gjest regnes som gått
const PULS = 8000;           // så ofte oppdateres «sist sett» mens man står stille
const UTSEENDE = { hud: /^#[0-9a-f]{6}$/i, harfarge: /^#[0-9a-f]{6}$/i, toga: /^#[0-9a-f]{6}$/i, har: /^[a-zæøå]{1,12}$/, skjegg: /^(ja|nei)$/ };

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS hotell_gjest (
    navn TEXT PRIMARY KEY, rom TEXT NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL,
    utseende TEXT, sist_sett TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hotell_prat (
    id INTEGER PRIMARY KEY AUTOINCREMENT, rom TEXT NOT NULL, navn TEXT NOT NULL,
    type TEXT NOT NULL, tekst TEXT NOT NULL, opprettet TEXT NOT NULL
  )`,
];

const tolk = (s) => { try { return s ? JSON.parse(s) : null; } catch (_) { return null; } };
const heltall = (v, maks) => Math.max(0, Math.min(maks, Math.round(Number(v) || 0)));

export async function hotell({ db, meg, metode, handling, request, url, json, feil, lesJson }) {
  const naaMs = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const naa = iso(naaMs);

  if (metode === "POST") {
    const b = await lesJson(request);
    if (handling === "flytt") {
      if (!ROM.includes(b.rom)) return feil(400, "Ukjent rom.");
      await db.prepare(`INSERT INTO hotell_gjest (navn, rom, x, y, utseende, sist_sett) VALUES (?, ?, ?, ?, NULL, ?)
        ON CONFLICT(navn) DO UPDATE SET rom = excluded.rom, x = excluded.x, y = excluded.y, sist_sett = excluded.sist_sett`)
        .bind(meg, b.rom, heltall(b.x, 19), heltall(b.y, 19), naa).run();
      const rad = await db.prepare("SELECT utseende FROM hotell_gjest WHERE navn = ?").bind(meg).first();
      return json({ ok: true, utseende: tolk(rad && rad.utseende) });
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
      await db.prepare("UPDATE hotell_gjest SET utseende = ? WHERE navn = ?").bind(JSON.stringify(u), meg).run();
      return json({ ok: true });
    }
    if (handling === "ut") {
      await db.prepare("UPDATE hotell_gjest SET sist_sett = '' WHERE navn = ?").bind(meg).run();
      return json({ ok: true });
    }
    return feil(404, "Ukjent handling.");
  }

  // GET: hvem er i rommet, og hva er sagt siden sist
  const rom = ROM.includes(url.searchParams.get("rom")) ? url.searchParams.get("rom") : "lobbyen";
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
  const antall = Object.fromEntries(ROM.map((r) => [r, 0]));
  for (const r of (await db.prepare("SELECT rom, COUNT(*) AS n FROM hotell_gjest WHERE sist_sett > ? GROUP BY rom").bind(aktiv).all()).results) antall[r.rom] = r.n;
  return json({ rom, gjester, prat, sisteId, forste, antall });
}
