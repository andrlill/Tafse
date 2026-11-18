// MØBELBYTTE på Tafse Hotell, etter modell av Habbo: to gjester i samme rom legger møbler fra
// lageret i hver sin skål, begge godtar, og så bytter møblene eier. Endrer noen innholdet, må begge godta på nytt.
// Her ligger også stjernene gjestene gir rommene.

const MAKS_TING = 12;          // møbler per side i ett bytte
const UTLOPER = 180000;        // millisekunder uten at noe skjer før byttet avbrytes
const VIS_ETTER = 12000;       // så lenge vises et ferdig eller avbrutt bytte for den andre

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS hotell_bytte (
    id INTEGER PRIMARY KEY AUTOINCREMENT, a TEXT NOT NULL, b TEXT NOT NULL, a_ting TEXT NOT NULL DEFAULT '[]', b_ting TEXT NOT NULL DEFAULT '[]',
    a_ok INTEGER NOT NULL DEFAULT 0, b_ok INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'apen', oppdatert TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS hotell_romstjerne (
    eier TEXT NOT NULL, fra TEXT NOT NULL, opprettet TEXT NOT NULL, PRIMARY KEY (eier, fra)
  )`,
];

const tolk = (s) => { try { const l = JSON.parse(s); return Array.isArray(l) ? l : []; } catch (_) { return []; } };
const vis = (navn) => String(navn).replace(/ \(gjest\)$/, "");
const iso = (ms) => new Date(ms).toISOString();

const finn = (db, meg, naaMs) => db.prepare("SELECT * FROM hotell_bytte WHERE (a = ? OR b = ?) AND ((status = 'apen' AND oppdatert > ?) OR (status != 'apen' AND oppdatert > ?)) ORDER BY id DESC LIMIT 1")
  .bind(meg, meg, iso(naaMs - UTLOPER), iso(naaMs - VIS_ETTER)).first();

// Byttet jeg er med i akkurat nå, sett fra min side. Sendes med hver gang siden spør om rommet.
export async function mittBytte(db, meg, naaMs) {
  const r = await finn(db, meg, naaMs);
  if (!r) return null;
  const erA = r.a === meg, mine = tolk(erA ? r.a_ting : r.b_ting), deres = tolk(erA ? r.b_ting : r.a_ting);
  const alle = [...mine, ...deres];
  const typer = alle.length ? Object.fromEntries((await db.prepare(`SELECT id, type FROM hotell_mobel WHERE id IN (${alle.map(() => "?").join(",")})`).bind(...alle).all()).results.map((m) => [m.id, m.type])) : {};
  const liste = (l) => l.filter((id) => typer[id]).map((id) => ({ id, type: typer[id] }));
  return { id: r.id, med: erA ? r.b : r.a, mine: liste(mine), deres: liste(deres), minOk: !!(erA ? r.a_ok : r.b_ok), deresOk: !!(erA ? r.b_ok : r.a_ok), status: r.status };
}

export async function bytte({ db, meg, b, naaMs, json, feil, KATALOG, MAKS_MOBLER }) {
  const naa = iso(naaMs);
  const svar = async (kode = 200) => json({ ok: true, bytte: await mittBytte(db, meg, naaMs) }, kode);
  const apent = async (navn) => { const r = await finn(db, navn, naaMs); return r && r.status === "apen" ? r : null; };

  if (b.gjor === "start") {
    const [jeg, den] = await Promise.all([
      db.prepare("SELECT rom FROM hotell_gjest WHERE navn = ? AND sist_sett > ?").bind(meg, iso(naaMs - 30000)).first(),
      db.prepare("SELECT navn, rom FROM hotell_gjest WHERE navn = ? AND sist_sett > ?").bind(String(b.med || ""), iso(naaMs - 30000)).first(),
    ]);
    if (!jeg || !den || den.navn === meg || den.rom !== jeg.rom) return feil(400, "Dere må stå i samme rom for å bytte.");
    if (await apent(meg)) return feil(409, "Du er allerede midt i et bytte.");
    if (await apent(den.navn)) return feil(409, `${vis(den.navn)} er opptatt med et annet bytte.`);
    await db.prepare("INSERT INTO hotell_bytte (a, b, oppdatert) VALUES (?, ?, ?)").bind(meg, den.navn, naa).run();
    return svar(201);
  }

  const r = await apent(meg);
  if (!r) return feil(404, "Byttet er ikke åpent lenger.");
  const erA = r.a === meg, min = erA ? "a" : "b";
  let ting = tolk(r[`${min}_ting`]);
  const lagre = (sett, ...verdier) => db.prepare(`UPDATE hotell_bytte SET ${sett}, oppdatert = ? WHERE id = ? AND status = 'apen'`).bind(...verdier, naa, r.id).run();

  if (b.gjor === "avbryt") { await lagre("status = 'avbrutt'"); return svar(); }
  if (b.gjor === "legg" || b.gjor === "fjern") {
    const id = Math.round(Number(b.id)) || 0;
    if (b.gjor === "legg") {
      if (ting.includes(id)) return svar();
      if (ting.length >= MAKS_TING) return feil(409, `Du kan legge høyst ${MAKS_TING} møbler i ett bytte.`);
      const m = await db.prepare("SELECT id FROM hotell_mobel WHERE id = ? AND eier = ? AND x IS NULL").bind(id, meg).first();
      if (!m) return feil(404, "Du kan bare bytte bort møbler som ligger på lageret ditt.");
      ting.push(id);
    } else ting = ting.filter((t) => t !== id);
    // Når innholdet endres, må begge godta på nytt
    await lagre(`${min}_ting = ?, a_ok = 0, b_ok = 0`, JSON.stringify(ting));
    return svar();
  }
  if (b.gjor === "angre") { await lagre(`${min}_ok = 0`); return svar(); }
  if (b.gjor === "ok") {
    const deresOk = erA ? r.b_ok : r.a_ok;
    if (!deresOk) { await lagre(`${min}_ok = 1`); return svar(); }
    // Begge har godtatt: sjekk at alt fortsatt ligger på lagrene, og bytt eier
    const aTing = tolk(r.a_ting), bTing = tolk(r.b_ting);
    if (!aTing.length && !bTing.length) return feil(400, "Det ligger ingenting i byttet.");
    const eies = async (liste, eier) => !liste.length || (await db.prepare(`SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ? AND x IS NULL AND id IN (${liste.map(() => "?").join(",")})`).bind(eier, ...liste).first()).n === liste.length;
    if (!(await eies(aTing, r.a)) || !(await eies(bTing, r.b))) { await lagre("status = 'avbrutt'"); return feil(409, "Noe i byttet ligger ikke på lageret lenger. Byttet er avbrutt."); }
    const antall = async (n) => (await db.prepare("SELECT COUNT(*) AS n FROM hotell_mobel WHERE eier = ?").bind(n).first()).n;
    const [nA, nB] = await Promise.all([antall(r.a), antall(r.b)]);
    if (nA - aTing.length + bTing.length > MAKS_MOBLER || nB - bTing.length + aTing.length > MAKS_MOBLER) return feil(409, `Ingen kan ha mer enn ${MAKS_MOBLER} møbler.`);
    const flytt = (liste, til) => liste.map((id) => db.prepare("UPDATE hotell_mobel SET eier = ?, retning = NULL WHERE id = ?").bind(til, id));
    const rom = await db.prepare("SELECT rom FROM hotell_gjest WHERE navn = ?").bind(meg).first();
    await db.batch([
      db.prepare("UPDATE hotell_bytte SET status = 'ferdig', a_ok = 1, b_ok = 1, oppdatert = ? WHERE id = ?").bind(naa, r.id),
      ...flytt(aTing, r.b), ...flytt(bTing, r.a),
      db.prepare("INSERT INTO hotell_prat (rom, navn, type, tekst, opprettet) VALUES (?, ?, 'hendelse', ?, ?)").bind(rom ? rom.rom : "lobbyen", meg, `${vis(r.a)} og ${vis(r.b)} byttet møbler.`, naa),
    ]);
    return svar();
  }
  return feil(400, "Ukjent handling.");
}

// Stjerner til rommene: én per gjest per rom. Trykker man igjen, tas stjernen tilbake.
export async function stjerne({ db, meg, eier, naaMs, json, feil }) {
  if (!eier || eier === meg) return feil(400, "Du kan ikke gi ditt eget rom en stjerne.");
  const har = await db.prepare("SELECT 1 AS ja FROM hotell_romstjerne WHERE eier = ? AND fra = ?").bind(eier, meg).first();
  if (har) await db.prepare("DELETE FROM hotell_romstjerne WHERE eier = ? AND fra = ?").bind(eier, meg).run();
  else await db.prepare("INSERT INTO hotell_romstjerne (eier, fra, opprettet) VALUES (?, ?, ?)").bind(eier, meg, iso(naaMs)).run();
  return json({ ok: true, ...(await stjerner(db, eier, meg)) });
}
export async function stjerner(db, eier, meg) {
  const [n, min] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM hotell_romstjerne WHERE eier = ?").bind(eier).first(),
    db.prepare("SELECT 1 AS ja FROM hotell_romstjerne WHERE eier = ? AND fra = ?").bind(eier, meg).first(),
  ]);
  return { stjerner: n.n, minStjerne: !!min };
}
export const alleStjerner = async (db) => Object.fromEntries((await db.prepare("SELECT eier, COUNT(*) AS n FROM hotell_romstjerne GROUP BY eier").all()).results.map((r) => [r.eier, r.n]));
