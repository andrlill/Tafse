// INNBOKSEN: private meldinger mellom spillerne på spillsiden. Meldingene blir liggende,
// så man kan skrive til noen som ikke er inne. Vinduet ligger i assets/app.js.

const MAKS_TEGN = 500;
const MAKS_PER_MINUTT = 12;
const INNE_ETTER = 30000;   // millisekunder siden siste livstegn på hotellet før man regnes som ute

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS meldinger (
    id INTEGER PRIMARY KEY AUTOINCREMENT, fra TEXT NOT NULL, til TEXT NOT NULL, tekst TEXT NOT NULL,
    lest INTEGER NOT NULL DEFAULT 0, opprettet TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS meldinger_til ON meldinger (til, lest)",
];

export async function innboks({ db, meg, metode, id, request, url, json, feil, lesJson }) {
  const naaMs = Date.now(), naa = new Date(naaMs).toISOString();
  const uleste = async () => (await db.prepare("SELECT COUNT(*) AS n FROM meldinger WHERE til = ? AND lest = 0").bind(meg).first()).n;
  // Alle som har sjekket inn kan få post
  const finnes = (navn) => db.prepare(`SELECT navn FROM hotell_gjest WHERE navn = ? AND utseende LIKE '%"klar":"ja"%'`).bind(String(navn || "")).first();

  if (metode === "POST") {
    const b = await lesJson(request);
    const tekst = (typeof b.tekst === "string" ? b.tekst : "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, MAKS_TEGN);
    if (!tekst) return feil(400, "Meldingen er tom.");
    const til = await finnes(b.til);
    if (!til || til.navn === meg) return feil(404, "Fant ikke mottakeren.");
    const nylig = await db.prepare("SELECT COUNT(*) AS n FROM meldinger WHERE fra = ? AND opprettet > ?").bind(meg, new Date(naaMs - 60000).toISOString()).first();
    if (nylig.n >= MAKS_PER_MINUTT) return feil(429, "Du skriver for fort. Vent litt.");
    await db.prepare("INSERT INTO meldinger (fra, til, tekst, opprettet) VALUES (?, ?, ?, ?)").bind(meg, til.navn, tekst, naa).run();
    return json({ ok: true }, 201);
  }
  if (metode !== "GET") return feil(404, "Ukjent handling.");

  // En samtale: de siste meldingene, og de jeg har fått blir merket som lest
  if (id) {
    const med = decodeURIComponent(id);
    const rader = (await db.prepare("SELECT id, fra, tekst, opprettet FROM meldinger WHERE (fra = ? AND til = ?) OR (fra = ? AND til = ?) ORDER BY id DESC LIMIT 80").bind(meg, med, med, meg).all()).results.reverse();
    await db.prepare("UPDATE meldinger SET lest = 1 WHERE til = ? AND fra = ? AND lest = 0").bind(meg, med).run();
    return json({ med, meldinger: rader.map((m) => ({ id: m.id, min: m.fra === meg, tekst: m.tekst, tid: m.opprettet })), uleste: await uleste() });
  }
  if (url.searchParams.get("tell") === "1") return json({ uleste: await uleste() });

  // Oversikten: samtalene mine, og alle som kan få post (med rommet de står i hvis de er inne nå)
  const [siste, antall, folk] = await Promise.all([
    db.prepare(`SELECT m.fra, m.til, m.tekst, m.opprettet FROM meldinger m JOIN (
        SELECT MAX(id) AS id FROM meldinger WHERE fra = ? OR til = ? GROUP BY CASE WHEN fra = ? THEN til ELSE fra END
      ) s ON s.id = m.id ORDER BY m.id DESC LIMIT 100`).bind(meg, meg, meg).all(),
    db.prepare("SELECT fra, COUNT(*) AS n FROM meldinger WHERE til = ? AND lest = 0 GROUP BY fra").bind(meg).all(),
    db.prepare(`SELECT navn, rom, sist_sett FROM hotell_gjest WHERE utseende LIKE '%"klar":"ja"%' AND navn != ? ORDER BY navn LIMIT 300`).bind(meg).all(),
  ]);
  const ulest = Object.fromEntries(antall.results.map((r) => [r.fra, r.n]));
  const grense = new Date(naaMs - INNE_ETTER).toISOString();
  return json({
    uleste: await uleste(),
    samtaler: siste.results.map((m) => { const med = m.fra === meg ? m.til : m.fra; return { med, tekst: m.tekst, tid: m.opprettet, min: m.fra === meg, uleste: ulest[med] || 0 }; }),
    folk: folk.results.map((f) => ({ navn: f.navn, rom: f.sist_sett > grense ? f.rom : null })),
  });
}
