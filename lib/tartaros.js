// TARTAROS: serverlogikk. Holder orden på drakmer, gudenes gunst, heltene man har låst opp,
// og tavlen. Selve spillet ligger i assets/tartaros.js.

// Varige oppgraderinger. Nivå n koster pris × n.
export const GUNST = {
  styrke: { maks: 5, pris: 30 },
  liv: { maks: 5, pris: 30 },
  fart: { maks: 5, pris: 30 },
  visdom: { maks: 5, pris: 30 },
  magnet: { maks: 3, pris: 40 },
  fjaer: { maks: 1, pris: 250 },
};
export const HELTER = { akilles: 0, atalanta: 120, orfeus: 200, odyssevs: 300 };
const MAKS_DRAKMER_PER_TOKT = 500;
const BYTTE_MAKS = 150;      // oliven til godset i Symposion, første tokt hver dag
const BYTTE_MIN_DRAP = 20;

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS tartaros_profil (
    navn TEXT PRIMARY KEY, drakmer INTEGER NOT NULL, kjop TEXT NOT NULL, sist_bytte TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS tartaros (
    id INTEGER PRIMARY KEY AUTOINCREMENT, navn TEXT NOT NULL, poeng INTEGER NOT NULL, sekunder INTEGER NOT NULL,
    niva INTEGER NOT NULL, drap INTEGER NOT NULL, helt TEXT NOT NULL, seier INTEGER NOT NULL, opprettet TEXT NOT NULL
  )`,
];

const dag = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(ms));
const heltall = (v, min, maks) => Math.max(min, Math.min(maks, Math.round(Number(v) || 0)));

export async function tartaros({ db, meg, metode, handling, request, json, feil, lesJson }) {
  const hentProfil = async () => {
    const rad = await db.prepare("SELECT drakmer, kjop, sist_bytte FROM tartaros_profil WHERE navn = ?").bind(meg).first();
    let kjop = {};
    try { kjop = rad ? JSON.parse(rad.kjop) : {}; } catch (_) {}
    return { drakmer: rad ? rad.drakmer : 0, gunst: kjop.gunst || {}, helter: kjop.helter || [], sistBytte: rad ? rad.sist_bytte : null };
  };
  const lagreProfil = (p) => db
    .prepare(`INSERT INTO tartaros_profil (navn, drakmer, kjop, sist_bytte) VALUES (?, ?, ?, ?)
      ON CONFLICT(navn) DO UPDATE SET drakmer = excluded.drakmer, kjop = excluded.kjop, sist_bytte = excluded.sist_bytte`)
    .bind(meg, p.drakmer, JSON.stringify({ gunst: p.gunst, helter: p.helter }), p.sistBytte).run();
  const ut = (p) => ({ drakmer: p.drakmer, gunst: p.gunst, helter: p.helter });

  if (metode === "POST" && handling === "kjop") {
    const b = await lesJson(request);
    const p = await hentProfil();
    let pris;
    if (b.type === "gunst" && GUNST[b.id]) {
      const n = p.gunst[b.id] || 0;
      if (n >= GUNST[b.id].maks) return feil(409, "Den er allerede på høyeste nivå.");
      pris = GUNST[b.id].pris * (n + 1);
      if (p.drakmer < pris) return feil(400, `Du mangler ${pris - p.drakmer} drakmer.`);
      p.gunst[b.id] = n + 1;
    } else if (b.type === "helt" && HELTER[b.id] !== undefined) {
      if (HELTER[b.id] === 0 || p.helter.includes(b.id)) return feil(409, "Den helten har du allerede.");
      pris = HELTER[b.id];
      if (p.drakmer < pris) return feil(400, `Du mangler ${pris - p.drakmer} drakmer.`);
      p.helter.push(b.id);
    } else return feil(400, "Ukjent vare.");
    p.drakmer -= pris;
    await lagreProfil(p);
    return json({ profil: ut(p) });
  }

  if (metode === "POST" && !handling) {
    const b = await lesJson(request);
    const helt = HELTER[b.helt] !== undefined ? b.helt : "akilles";
    const sekunder = heltall(b.sekunder, 0, 600), drap = heltall(b.drap, 0, 20000);
    const naa = Date.now();
    await db.prepare("INSERT INTO tartaros (navn, poeng, sekunder, niva, drap, helt, seier, opprettet) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(meg, heltall(b.poeng, 0, 200000), sekunder, heltall(b.niva, 1, 200), drap, helt, b.seier && sekunder >= 600 ? 1 : 0, new Date(naa).toISOString()).run();
    const p = await hentProfil();
    p.drakmer += heltall(b.drakmer, 0, MAKS_DRAKMER_PER_TOKT);
    // Første tokt hver dag gir bytte til godset i Symposion
    let bytte = 0;
    const idag = dag(naa);
    if (p.sistBytte !== idag && drap >= BYTTE_MIN_DRAP) {
      const gods = await db.prepare("SELECT navn FROM symposion_gods WHERE navn = ?").bind(meg).first();
      if (gods) {
        bytte = Math.min(BYTTE_MAKS, Math.floor(drap / 4));
        await db.prepare("UPDATE symposion_gods SET oliven = oliven + ? WHERE navn = ?").bind(bytte, meg).run();
        p.sistBytte = idag;
      }
    }
    await lagreProfil(p);
    return json({ profil: ut(p), bytte }, 201);
  }

  if (metode !== "GET") return feil(404, "Ukjent handling.");
  // Uka starter mandag kl. 00 norsk tid (regnet grovt som UTC+1)
  const n = new Date(Date.now() + 3600000);
  const mandag = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() - ((n.getUTCDay() + 6) % 7)) - 3600000).toISOString();
  const beste = (hvor) => `SELECT t.navn, t.poeng, t.sekunder, t.niva, t.helt, t.seier FROM tartaros t JOIN (SELECT navn, MAX(poeng) AS p FROM tartaros ${hvor} GROUP BY navn) m ON m.navn = t.navn AND m.p = t.poeng ${hvor ? "AND t.opprettet >= ?" : ""} GROUP BY t.navn ORDER BY t.poeng DESC`;
  const [alle, uke, antall] = await Promise.all([
    db.prepare(beste("")).all(),
    db.prepare(beste("WHERE opprettet >= ?")).bind(mandag, mandag).all(),
    db.prepare("SELECT COUNT(*) AS n FROM tartaros").first(),
  ]);
  return json({ alle: alle.results, uke: uke.results, antall: antall.n, profil: ut(await hentProfil()), gunst: GUNST, helter: HELTER });
}
