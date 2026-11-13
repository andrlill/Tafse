// TAFSE – API for brukere, forslag, poster og bilder.
// Kjører som Cloudflare Pages Function. Krever:
//   - en D1-database koblet til med variabelnavnet DB
//   - en hemmelighet (secret) TAFSE_PASSORD. Den brukes til å signere innlogginger
//     og invitasjonslenker, og fungerer som reservepassord ved registrering.

const MAKS_BILDE = 1_900_000; // byte, D1 tåler rundt 2 MB per rad
const BILDETYPER = ["image/jpeg", "image/png", "image/webp"];
const STATUSER = ["innmeldt", "oppfolging", "vedtatt", "forkastet", "trukket"];
const SAKSTYPER = ["Vedtektsendring", "Medlemsopptak", "Møtested", "Annen sak"];
const STEMMER = ["for", "mot", "avstar"];
const OKT_DAGER = 365;

let skjemaKlart = false;

async function sikreSkjema(db) {
  if (skjemaKlart) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS brukere (
      navn TEXT PRIMARY KEY,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS forslag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      navn TEXT NOT NULL,
      paragraf TEXT,
      tittel TEXT NOT NULL,
      tekst TEXT NOT NULL,
      begrunnelse TEXT,
      status TEXT NOT NULL DEFAULT 'innmeldt',
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS bilder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mote TEXT NOT NULL,
      navn TEXT NOT NULL,
      tekst TEXT,
      type TEXT NOT NULL,
      storrelse INTEGER NOT NULL,
      data BLOB NOT NULL,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS poster (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      navn TEXT NOT NULL,
      mote TEXT,
      tekst TEXT NOT NULL,
      bilde_id INTEGER,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS svar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      navn TEXT NOT NULL,
      tekst TEXT NOT NULL,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS skal (
      post_id INTEGER NOT NULL,
      navn TEXT NOT NULL,
      PRIMARY KEY (post_id, navn)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS stemmer (
      sak_id INTEGER NOT NULL,
      navn TEXT NOT NULL,
      stemme TEXT NOT NULL,
      PRIMARY KEY (sak_id, navn)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sakskommentarer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sak_id INTEGER NOT NULL,
      navn TEXT NOT NULL,
      tekst TEXT NOT NULL,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS spillresultater (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      navn TEXT NOT NULL,
      sekunder REAL NOT NULL,
      sar INTEGER NOT NULL,
      kolleger INTEGER NOT NULL,
      seier INTEGER NOT NULL,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS honningfella (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      navn TEXT NOT NULL,
      oppdrag TEXT NOT NULL,
      skar INTEGER NOT NULL,
      riktige INTEGER NOT NULL,
      moter INTEGER NOT NULL,
      prikker INTEGER NOT NULL,
      fullfort INTEGER NOT NULL,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS varsler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mottaker TEXT NOT NULL,
      avsender TEXT NOT NULL,
      type TEXT NOT NULL,
      tekst TEXT NOT NULL,
      lenke TEXT NOT NULL,
      lest INTEGER NOT NULL DEFAULT 0,
      opprettet TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS varsler_mottaker ON varsler (mottaker, id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS profiler (
      navn TEXT PRIMARY KEY,
      tekst TEXT NOT NULL,
      tafse TEXT,
      bilde_id INTEGER,
      oppdatert TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS bilder_mote ON bilder (mote)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS poster_mote ON poster (mote)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS svar_post ON svar (post_id)`),
  ]);
  // Eldre databaser mangler kolonnen tafse
  try { await db.prepare("ALTER TABLE profiler ADD COLUMN tafse TEXT").run(); } catch (_) {}
  try { await db.prepare("ALTER TABLE profiler ADD COLUMN bilde_id INTEGER").run(); } catch (_) {}
  try { await db.prepare("ALTER TABLE profiler ADD COLUMN info TEXT").run(); } catch (_) {}
  try { await db.prepare("ALTER TABLE profiler ADD COLUMN partner TEXT").run(); } catch (_) {}
  try { await db.prepare("ALTER TABLE forslag ADD COLUMN type TEXT").run(); } catch (_) {}
  try { await db.prepare("ALTER TABLE forslag ADD COLUMN mote TEXT").run(); } catch (_) {}
  skjemaKlart = true;
}

// ---------- Hjelpere ----------

function json(data, status = 200, ekstra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...ekstra },
  });
}
const feil = (status, tekst) => json({ feil: tekst }, status);
const tekst = (v, maks) => (typeof v === "string" ? v.trim().slice(0, maks) : "");
const gyldigMote = (m) => typeof m === "string" && /^[a-z0-9-]{1,40}$/.test(m);
const naa = () => new Date().toISOString();
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const vent = (ms) => new Promise((r) => setTimeout(r, ms));

function likt(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function lesJson(request) {
  try { return await request.json(); } catch (_) { return {}; }
}

async function hmac(nokkel, melding) {
  const k = await crypto.subtle.importKey("raw", enc.encode(nokkel), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(melding)));
}

async function hashPassord(passord, saltHex) {
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const k = await crypto.subtle.importKey("raw", enc.encode(passord), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, k, 256));
}

const b64 = (s) => btoa(String.fromCharCode(...enc.encode(s))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

function lesCookie(request) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(/(?:^|;\s*)tafse=([^;]+)/);
  return m ? m[1] : null;
}

async function lagOkt(env, bruker, url) {
  const utloper = Date.now() + OKT_DAGER * 86400000;
  const sig = await hmac(env.TAFSE_PASSORD, `${bruker.navn}|${utloper}|${bruker.hash.slice(0, 16)}`);
  const verdi = `${b64(bruker.navn)}.${utloper}.${sig}`;
  const sikker = url.protocol === "https:" ? "; Secure" : "";
  return `tafse=${verdi}; Path=/; Max-Age=${OKT_DAGER * 86400}; HttpOnly; SameSite=Lax${sikker}`;
}

// Returnerer navnet til den innloggede, eller null.
async function hvemErInnlogget(request, env, db) {
  const c = lesCookie(request);
  if (!c) return null;
  const [n64, utloper, sig] = c.split(".");
  if (!n64 || !utloper || !sig || Number(utloper) < Date.now()) return null;
  let navn;
  try { navn = unb64(n64); } catch (_) { return null; }
  const bruker = await db.prepare("SELECT navn, hash FROM brukere WHERE navn = ?").bind(navn).first();
  if (!bruker) return null;
  const forventet = await hmac(env.TAFSE_PASSORD, `${navn}|${utloper}|${bruker.hash.slice(0, 16)}`);
  return likt(sig, forventet) ? navn : null;
}

async function lesData(env, url) {
  try {
    const r = await env.ASSETS.fetch(new URL("/data/moter.json", url));
    return await r.json();
  } catch (_) {
    return {};
  }
}
const medlemsliste = async (env, url) => (await lesData(env, url)).medlemmer || [];
const erAdmin = async (env, url, navn) => ((await lesData(env, url)).administratorer || []).includes(navn);

// Møtet en ny sak skal behandles på: det første møtet med dato minst sju dager frem
// i tid (§ 6 nr. 2), ellers det første møtet uten fastsatt dato.
function behandlesPa(moter) {
  const frist = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return (moter || []).find((m) => m.dato && m.dato >= frist) || (moter || []).find((m) => !m.dato) || null;
}

// Neste møte som ikke er avholdt
function nesteMote(moter) {
  const idag = new Date().toISOString().slice(0, 10);
  return (moter || []).find((m) => !m.dato || m.dato >= idag) || null;
}

// Sender et varsel til hver mottaker (unntatt avsenderen selv, og hver mottaker bare én gang)
async function varsle(db, mottakere, { avsender, type, tekst: t, lenke }) {
  const unike = [...new Set(mottakere.filter((m) => m && m !== avsender))];
  if (!unike.length) return;
  const naa = new Date().toISOString();
  await db.batch(unike.map((m) =>
    db.prepare("INSERT INTO varsler (mottaker, avsender, type, tekst, lenke, opprettet) VALUES (?, ?, ?, ?, ?, ?)").bind(m, avsender, type, t, lenke, naa)));
}
const utdrag = (t, n = 80) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);
const postLenke = (post) => (post.mote && post.mote !== "salongen" ? `mote.html?id=${encodeURIComponent(post.mote)}#post-${post.id}` : `salongen.html#post-${post.id}`);

// Personlig invitasjonskode, avledet av navnet og akademipassordet
const invitasjonskode = async (env, navn) => (await hmac(env.TAFSE_PASSORD, `invitasjon|${navn}`)).slice(0, 20);

async function lagreBilde(db, fil, mote, navn, bildetekst) {
  if (!fil || typeof fil === "string") return { feil: "Fant ikke bildet." };
  if (!BILDETYPER.includes(fil.type)) return { feil: "Bare JPG, PNG og WebP støttes." };
  if (fil.size > MAKS_BILDE) return { feil: "Bildet er for stort." };
  const data = await fil.arrayBuffer();
  const r = await db
    .prepare("INSERT INTO bilder (mote, navn, tekst, type, storrelse, data, opprettet) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(mote, navn, bildetekst, fil.type, data.byteLength, data, naa())
    .run();
  return { id: r.meta.last_row_id };
}

// ---------- Ruter ----------

export async function onRequest({ request, env, params }) {
  if (!env.TAFSE_PASSORD) return feil(500, "Akademipassordet er ikke satt opp. Legg til hemmeligheten TAFSE_PASSORD i Cloudflare.");
  if (!env.DB) return feil(500, "Databasen er ikke koblet til. Koble en D1-database til med navnet DB i Cloudflare.");

  const db = env.DB;
  await sikreSkjema(db);

  const deler = Array.isArray(params.sti) ? params.sti : [params.sti].filter(Boolean);
  const [ressurs, id, under] = deler;
  const metode = request.method;
  const url = new URL(request.url);

  // --- Innlogging og brukere ---
  if (ressurs === "brukere" && metode === "GET") {
    const { results } = await db.prepare("SELECT navn FROM brukere").all();
    return json(results.map((r) => r.navn));
  }
  if (ressurs === "meg" && metode === "GET") {
    const navn = await hvemErInnlogget(request, env, db);
    return json({ innlogget: !!navn, navn, admin: !!navn && (await erAdmin(env, url, navn)) });
  }
  if (ressurs === "invitasjon" && metode === "GET") {
    const navn = tekst(url.searchParams.get("navn"), 60);
    const kode = String(url.searchParams.get("kode") || "");
    const gyldig = (await medlemsliste(env, url)).includes(navn) && likt(kode, await invitasjonskode(env, navn));
    if (!gyldig) { await vent(400); return json({ gyldig: false }); }
    const registrert = !!(await db.prepare("SELECT 1 FROM brukere WHERE navn = ?").bind(navn).first());
    return json({ gyldig: true, registrert });
  }
  if (ressurs === "registrer" && metode === "POST") {
    let skjema;
    try { skjema = await request.formData(); } catch (_) { return feil(400, "Kunne ikke lese skjemaet."); }
    const b = Object.fromEntries([...skjema.entries()].filter(([, v]) => typeof v === "string"));
    const fil = skjema.get("fil");
    const navn = tekst(b.navn, 60);
    if (!(await medlemsliste(env, url)).includes(navn)) return feil(400, "Navnet står ikke i medlemslisten.");
    const medKode = b.kode && likt(String(b.kode), await invitasjonskode(env, navn));
    const medPassord = b.akademipassord && likt(String(b.akademipassord), env.TAFSE_PASSORD);
    if (!medKode && !medPassord) { await vent(600); return feil(401, b.kode ? "Invitasjonslenken er ugyldig. Be om en ny." : "Feil akademipassord."); }
    const om = tekst(b.om, 3000), betyr = tekst(b.tafse, 3000);
    if (!om || !betyr) return feil(400, "Skriv litt om deg selv og hva TAFSE betyr for deg.");
    if (typeof b.passord !== "string" || b.passord.length < 6) return feil(400, "Passordet må ha minst seks tegn.");
    if (!fil || typeof fil === "string") return feil(400, "Velg et profilbilde.");
    if (await db.prepare("SELECT 1 FROM brukere WHERE navn = ?").bind(navn).first()) return feil(409, "Du har allerede en bruker. Logg inn i stedet.");
    const bilde = await lagreBilde(db, fil, "profil", navn, "Profilbilde");
    if (bilde.feil) return feil(400, bilde.feil);
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await hashPassord(b.passord, salt);
    await db.batch([
      db.prepare("INSERT INTO brukere (navn, salt, hash, opprettet) VALUES (?, ?, ?, ?)").bind(navn, salt, hash, naa()),
      db.prepare("INSERT INTO profiler (navn, tekst, tafse, bilde_id, oppdatert) VALUES (?, ?, ?, ?, ?) ON CONFLICT(navn) DO UPDATE SET tekst = excluded.tekst, tafse = excluded.tafse, bilde_id = excluded.bilde_id, oppdatert = excluded.oppdatert").bind(navn, om, betyr, bilde.id, naa()),
    ]);
    return json({ innlogget: true, navn }, 201, { "Set-Cookie": await lagOkt(env, { navn, hash }, url) });
  }
  if (ressurs === "logginn" && metode === "POST") {
    const b = await lesJson(request);
    const bruker = await db.prepare("SELECT navn, salt, hash FROM brukere WHERE navn = ?").bind(tekst(b.navn, 60)).first();
    if (!bruker || !likt(await hashPassord(String(b.passord || ""), bruker.salt), bruker.hash)) {
      await vent(600);
      return feil(401, "Feil navn eller passord.");
    }
    return json({ innlogget: true, navn: bruker.navn }, 200, { "Set-Cookie": await lagOkt(env, bruker, url) });
  }
  if (ressurs === "loggut" && metode === "POST") {
    return json({ innlogget: false }, 200, { "Set-Cookie": "tafse=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax" });
  }

  // Alt under krever innlogging
  const meg = await hvemErInnlogget(request, env, db);
  if (!meg) return feil(401, "Ikke innlogget");

  if (ressurs === "invitasjoner" && metode === "GET") {
    if (!(await erAdmin(env, url, meg))) return feil(403, "Bare administratorer kan se invitasjonene.");
    const { results } = await db.prepare("SELECT navn FROM brukere").all();
    const registrerte = new Set(results.map((r) => r.navn));
    const liste = [];
    for (const navn of await medlemsliste(env, url)) {
      liste.push({ navn, registrert: registrerte.has(navn), kode: await invitasjonskode(env, navn) });
    }
    return json(liste);
  }

  if (ressurs === "byttpassord" && metode === "POST") {
    const b = await lesJson(request);
    const bruker = await db.prepare("SELECT salt, hash FROM brukere WHERE navn = ?").bind(meg).first();
    if (!likt(await hashPassord(String(b.gammelt || ""), bruker.salt), bruker.hash)) { await vent(600); return feil(401, "Feil nåværende passord."); }
    if (typeof b.nytt !== "string" || b.nytt.length < 6) return feil(400, "Det nye passordet må ha minst seks tegn.");
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await hashPassord(b.nytt, salt);
    await db.prepare("UPDATE brukere SET salt = ?, hash = ? WHERE navn = ?").bind(salt, hash, meg).run();
    return json({ ok: true }, 200, { "Set-Cookie": await lagOkt(env, { navn: meg, hash }, url) });
  }

  // --- Saker til behandling ---
  if (ressurs === "forslag") {
    if (!id && metode === "GET") {
      const [{ results: saker }, { results: stemmer }, { results: kommentarer }] = await db.batch([
        db.prepare("SELECT id, navn, type, paragraf, tittel, tekst, begrunnelse, status, mote, opprettet FROM forslag ORDER BY id DESC"),
        db.prepare("SELECT sak_id, navn, stemme FROM stemmer"),
        db.prepare("SELECT id, sak_id, navn, tekst, opprettet FROM sakskommentarer ORDER BY id ASC"),
      ]);
      const data = await lesData(env, url);
      const neste = nesteMote(data.moter);
      const kanBehandle = (await erAdmin(env, url, meg)) || (neste && neste.tafsemestere.includes(meg));
      return json({
        kanBehandle: !!kanBehandle,
        nesteFrist: behandlesPa(data.moter),
        saker: saker.map((s) => ({
          ...s,
          type: s.type || "Vedtektsendring",
          stemmer: stemmer.filter((v) => v.sak_id === s.id).map(({ navn, stemme }) => ({ navn, stemme })),
          kommentarer: kommentarer.filter((k) => k.sak_id === s.id),
        })),
      });
    }
    if (!id && metode === "POST") {
      const b = await lesJson(request);
      const tittel = tekst(b.tittel, 160), innhold = tekst(b.tekst, 5000);
      const type = SAKSTYPER.includes(b.type) ? b.type : "Annen sak";
      if (!tittel || !innhold) return feil(400, "Tittel og beskrivelse må fylles ut.");
      const mote = behandlesPa((await lesData(env, url)).moter);
      const r = await db
        .prepare("INSERT INTO forslag (navn, type, paragraf, tittel, tekst, begrunnelse, mote, opprettet) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(meg, type, type === "Vedtektsendring" ? tekst(b.paragraf, 40) : "", tittel, innhold, tekst(b.begrunnelse, 5000), mote ? mote.id : null, naa())
        .run();
      const { results: alle } = await db.prepare("SELECT navn FROM brukere").all();
      await varsle(db, alle.map((x) => x.navn), { avsender: meg, type: "ny-sak", tekst: `meldte inn en ny sak: «${utdrag(tittel)}»`, lenke: `saker.html#sak-${r.meta.last_row_id}` });
      return json({ id: r.meta.last_row_id }, 201);
    }
    if (id && !under && metode === "PATCH") {
      const b = await lesJson(request);
      const sak = await db.prepare("SELECT navn, tittel FROM forslag WHERE id = ?").bind(Number(id)).first();
      if (!sak) return feil(404, "Fant ikke saken.");
      if (!STATUSER.includes(b.status)) return feil(400, "Ugyldig status.");
      const data = await lesData(env, url);
      const neste = nesteMote(data.moter);
      const kan = (await erAdmin(env, url, meg)) || (neste && neste.tafsemestere.includes(meg)) || (b.status === "trukket" && sak.navn === meg);
      if (!kan) return feil(403, "Bare Tafsemesterne kan registrere utfallet av en sak.");
      await db.prepare("UPDATE forslag SET status = ? WHERE id = ?").bind(b.status, Number(id)).run();
      const utfall = { vedtatt: "som vedtatt", forkastet: "som forkastet", oppfolging: "som vedtatt, til oppfølging", innmeldt: "som åpen igjen" }[b.status];
      if (utfall) await varsle(db, [sak.navn], { avsender: meg, type: "status", tekst: `registrerte saken din «${utdrag(sak.tittel)}» ${utfall}`, lenke: `saker.html#sak-${Number(id)}` });
      return json({ ok: true });
    }
    if (id && !under && metode === "DELETE") {
      const r = await db.prepare("DELETE FROM forslag WHERE id = ? AND navn = ?").bind(Number(id), meg).run();
      if (!r.meta.changes) return feil(403, "Du kan bare slette dine egne saker.");
      await db.batch([
        db.prepare("DELETE FROM stemmer WHERE sak_id = ?").bind(Number(id)),
        db.prepare("DELETE FROM sakskommentarer WHERE sak_id = ?").bind(Number(id)),
      ]);
      return json({ ok: true });
    }
    if (id && under === "stem" && metode === "POST") {
      const { stemme } = await lesJson(request);
      const sak = await db.prepare("SELECT status, navn, tittel FROM forslag WHERE id = ?").bind(Number(id)).first();
      if (!sak) return feil(404, "Fant ikke saken.");
      if (sak.status !== "innmeldt") return feil(400, "Saken er ferdigbehandlet.");
      if (stemme === null || stemme === "") {
        await db.prepare("DELETE FROM stemmer WHERE sak_id = ? AND navn = ?").bind(Number(id), meg).run();
        return json({ ok: true });
      }
      if (!STEMMER.includes(stemme)) return feil(400, "Ugyldig stemme.");
      const forste = !(await db.prepare("SELECT 1 FROM stemmer WHERE sak_id = ? AND navn = ?").bind(Number(id), meg).first());
      if (forste) await varsle(db, [sak.navn], { avsender: meg, type: "stemme", tekst: `stemte på saken din «${utdrag(sak.tittel)}»`, lenke: `saker.html#sak-${Number(id)}` });
      await db.prepare("INSERT INTO stemmer (sak_id, navn, stemme) VALUES (?, ?, ?) ON CONFLICT(sak_id, navn) DO UPDATE SET stemme = excluded.stemme").bind(Number(id), meg, stemme).run();
      return json({ ok: true });
    }
    if (id && under === "kommentar" && metode === "POST") {
      const t = tekst((await lesJson(request)).tekst, 3000);
      if (!t) return feil(400, "Kommentaren er tom.");
      const sak = await db.prepare("SELECT navn, tittel FROM forslag WHERE id = ?").bind(Number(id)).first();
      if (!sak) return feil(404, "Fant ikke saken.");
      const { results: andre } = await db.prepare("SELECT DISTINCT navn FROM sakskommentarer WHERE sak_id = ?").bind(Number(id)).all();
      await db.prepare("INSERT INTO sakskommentarer (sak_id, navn, tekst, opprettet) VALUES (?, ?, ?, ?)").bind(Number(id), meg, t, naa()).run();
      const lenke = `saker.html#sak-${Number(id)}`;
      await varsle(db, [sak.navn], { avsender: meg, type: "sakskommentar", tekst: `kommenterte saken din «${utdrag(sak.tittel, 50)}»: «${utdrag(t, 60)}»`, lenke });
      await varsle(db, andre.map((x) => x.navn).filter((n) => n !== sak.navn), { avsender: meg, type: "sakskommentar", tekst: `kommenterte også saken «${utdrag(sak.tittel, 50)}»: «${utdrag(t, 60)}»`, lenke });
      return json({ ok: true }, 201);
    }
  }
  if (ressurs === "sakskommentar" && id && metode === "DELETE") {
    const r = await db.prepare("DELETE FROM sakskommentarer WHERE id = ? AND navn = ?").bind(Number(id), meg).run();
    return r.meta.changes ? json({ ok: true }) : feil(403, "Du kan bare slette dine egne kommentarer.");
  }

  // --- Salongen: poster, svar og skåler ---
  if (ressurs === "poster") {
    if (!id && metode === "GET") {
      const mote = url.searchParams.get("mote");
      const forfatter = tekst(url.searchParams.get("navn"), 60);
      if (mote && !gyldigMote(mote)) return feil(400, "Ugyldig møte.");
      const for_ = Number(url.searchParams.get("for")) || 2 ** 31;
      const { results: poster } = mote
        ? await db.prepare("SELECT * FROM poster WHERE mote = ? AND id < ? ORDER BY id DESC LIMIT 30").bind(mote, for_).all()
        : forfatter
          ? await db.prepare("SELECT * FROM poster WHERE navn = ? AND id < ? ORDER BY id DESC LIMIT 30").bind(forfatter, for_).all()
          : await db.prepare("SELECT * FROM poster WHERE id < ? ORDER BY id DESC LIMIT 30").bind(for_).all();
      if (!poster.length) return json([]);
      const ider = poster.map((p) => p.id);
      const plass = ider.map(() => "?").join(",");
      const [{ results: svar }, { results: skal }] = await db.batch([
        db.prepare(`SELECT id, post_id, navn, tekst, opprettet FROM svar WHERE post_id IN (${plass}) ORDER BY id ASC`).bind(...ider),
        db.prepare(`SELECT post_id, navn FROM skal WHERE post_id IN (${plass})`).bind(...ider),
      ]);
      return json(poster.map((p) => ({
        ...p,
        svar: svar.filter((s) => s.post_id === p.id),
        skal: skal.filter((s) => s.post_id === p.id).map((s) => s.navn),
      })));
    }
    if (!id && metode === "POST") {
      let skjema;
      try { skjema = await request.formData(); } catch (_) { return feil(400, "Kunne ikke lese posten."); }
      const innhold = tekst(skjema.get("tekst"), 5000);
      const mote = tekst(skjema.get("mote"), 40) || null;
      if (mote && !gyldigMote(mote)) return feil(400, "Ugyldig møte.");
      const fil = skjema.get("fil");
      if (!innhold && !(fil && typeof fil !== "string")) return feil(400, "Skriv noe eller legg ved et bilde.");
      let bildeId = null;
      if (fil && typeof fil !== "string") {
        const b = await lagreBilde(db, fil, mote || "salongen", meg, innhold.slice(0, 300));
        if (b.feil) return feil(400, b.feil);
        bildeId = b.id;
      }
      const r = await db.prepare("INSERT INTO poster (navn, mote, tekst, bilde_id, opprettet) VALUES (?, ?, ?, ?, ?)").bind(meg, mote, innhold, bildeId, naa()).run();
      return json({ id: r.meta.last_row_id }, 201);
    }
    if (id && !under && metode === "DELETE") {
      const post = await db.prepare("SELECT navn, bilde_id FROM poster WHERE id = ?").bind(Number(id)).first();
      if (!post) return feil(404, "Fant ikke posten.");
      if (post.navn !== meg) return feil(403, "Du kan bare slette dine egne poster.");
      const steg = [
        db.prepare("DELETE FROM poster WHERE id = ?").bind(Number(id)),
        db.prepare("DELETE FROM svar WHERE post_id = ?").bind(Number(id)),
        db.prepare("DELETE FROM skal WHERE post_id = ?").bind(Number(id)),
      ];
      if (post.bilde_id) steg.push(db.prepare("DELETE FROM bilder WHERE id = ?").bind(post.bilde_id));
      await db.batch(steg);
      return json({ ok: true });
    }
    if (id && under === "svar" && metode === "POST") {
      const { tekst: t } = await lesJson(request);
      const innhold = tekst(t, 3000);
      if (!innhold) return feil(400, "Svaret er tomt.");
      const post = await db.prepare("SELECT id, navn, mote FROM poster WHERE id = ?").bind(Number(id)).first();
      if (!post) return feil(404, "Fant ikke posten.");
      const { results: andre } = await db.prepare("SELECT DISTINCT navn FROM svar WHERE post_id = ?").bind(Number(id)).all();
      await db.prepare("INSERT INTO svar (post_id, navn, tekst, opprettet) VALUES (?, ?, ?, ?)").bind(Number(id), meg, innhold, naa()).run();
      const lenke = postLenke(post);
      await varsle(db, [post.navn], { avsender: meg, type: "svar", tekst: `svarte på posten din: «${utdrag(innhold)}»`, lenke });
      await varsle(db, andre.map((x) => x.navn).filter((n) => n !== post.navn), { avsender: meg, type: "svar", tekst: `svarte også på en post du har kommentert: «${utdrag(innhold)}»`, lenke });
      return json({ ok: true }, 201);
    }
    if (id && under === "skal" && metode === "POST") {
      const post = await db.prepare("SELECT id, navn, mote, tekst FROM poster WHERE id = ?").bind(Number(id)).first();
      if (!post) return feil(404, "Fant ikke posten.");
      const finnes = await db.prepare("SELECT 1 FROM skal WHERE post_id = ? AND navn = ?").bind(Number(id), meg).first();
      await db.prepare(finnes ? "DELETE FROM skal WHERE post_id = ? AND navn = ?" : "INSERT INTO skal (post_id, navn) VALUES (?, ?)").bind(Number(id), meg).run();
      const lenke = postLenke(post);
      if (finnes) {
        // Angret skål: fjern varselet hvis det ikke er lest ennå
        await db.prepare("DELETE FROM varsler WHERE type = 'skal' AND avsender = ? AND lenke = ? AND lest = 0").bind(meg, lenke).run();
      } else {
        await varsle(db, [post.navn], { avsender: meg, type: "skal", tekst: post.tekst ? `skålte for posten din: «${utdrag(post.tekst, 60)}»` : "skålte for bildet ditt", lenke });
      }
      return json({ skalt: !finnes });
    }
  }
  if (ressurs === "svar" && id && metode === "DELETE") {
    const r = await db.prepare("DELETE FROM svar WHERE id = ? AND navn = ?").bind(Number(id), meg).run();
    return r.meta.changes ? json({ ok: true }) : feil(403, "Du kan bare slette dine egne svar.");
  }

  // --- Bilder fra møter ---
  if (ressurs === "bilder") {
    if (!id && metode === "GET") {
      const mote = url.searchParams.get("mote");
      if (mote && !gyldigMote(mote)) return feil(400, "Ugyldig møte.");
      const sporring = mote
        ? db.prepare("SELECT id, mote, navn, tekst, opprettet FROM bilder WHERE mote = ? ORDER BY id ASC").bind(mote)
        : db.prepare("SELECT mote, COUNT(*) AS antall FROM bilder GROUP BY mote");
      const { results } = await sporring.all();
      return json(results);
    }
    if (!id && metode === "POST") {
      let skjema;
      try { skjema = await request.formData(); } catch (_) { return feil(400, "Fant ikke bildet."); }
      const mote = skjema.get("mote");
      if (!gyldigMote(mote)) return feil(400, "Ugyldig møte.");
      const b = await lagreBilde(db, skjema.get("fil"), mote, meg, tekst(skjema.get("tekst"), 300));
      return b.feil ? feil(400, b.feil) : json({ id: b.id }, 201);
    }
    if (id && metode === "GET") {
      const rad = await db.prepare("SELECT type, data FROM bilder WHERE id = ?").bind(Number(id)).first();
      if (!rad) return feil(404, "Fant ikke bildet.");
      const bytes = rad.data instanceof ArrayBuffer ? rad.data : new Uint8Array(rad.data);
      return new Response(bytes, {
        headers: { "Content-Type": rad.type, "Cache-Control": "private, max-age=31536000, immutable" },
      });
    }
    if (id && metode === "DELETE") {
      const r = await db.prepare("DELETE FROM bilder WHERE id = ? AND navn = ?").bind(Number(id), meg).run();
      if (!r.meta.changes) return feil(403, "Du kan bare slette dine egne bilder.");
      await db.prepare("UPDATE poster SET bilde_id = NULL WHERE bilde_id = ?").bind(Number(id)).run();
      return json({ ok: true });
    }
  }

  // --- Profilbilde ---
  if (ressurs === "profilbilde" && metode === "POST") {
    let skjema;
    try { skjema = await request.formData(); } catch (_) { return feil(400, "Fant ikke bildet."); }
    const nytt = await lagreBilde(db, skjema.get("fil"), "profil", meg, "Profilbilde");
    if (nytt.feil) return feil(400, nytt.feil);
    const gammel = await db.prepare("SELECT bilde_id FROM profiler WHERE navn = ?").bind(meg).first();
    const steg = [
      db.prepare("INSERT INTO profiler (navn, tekst, bilde_id, oppdatert) VALUES (?, '', ?, ?) ON CONFLICT(navn) DO UPDATE SET bilde_id = excluded.bilde_id, oppdatert = excluded.oppdatert").bind(meg, nytt.id, naa()),
    ];
    if (gammel && gammel.bilde_id) steg.push(db.prepare("DELETE FROM bilder WHERE id = ?").bind(gammel.bilde_id));
    await db.batch(steg);
    return json({ bilde_id: nytt.id });
  }

  // --- Spillet: Idus Martiae ---
  if (ressurs === "spill") {
    if (metode === "GET") {
      const { results } = await db.prepare("SELECT navn, sekunder, sar, kolleger, seier, opprettet FROM spillresultater ORDER BY seier DESC, sekunder DESC, sar ASC, kolleger DESC").all();
      const beste = [];
      const sett = new Set();
      for (const r of results) if (!sett.has(r.navn)) { sett.add(r.navn); beste.push(r); }
      return json({ toppliste: beste, antallSpill: results.length });
    }
    if (metode === "POST") {
      const b = await lesJson(request);
      const sek = Math.max(0, Math.min(60, Number(b.sekunder) || 0));
      const sar = Math.max(0, Math.min(23, Math.round(Number(b.sar) || 0)));
      const kol = Math.max(0, Math.min(60, Math.round(Number(b.kolleger) || 0)));
      const seier = b.seier && sek >= 60 && sar < 23 ? 1 : 0;
      await db.prepare("INSERT INTO spillresultater (navn, sekunder, sar, kolleger, seier, opprettet) VALUES (?, ?, ?, ?, ?, ?)").bind(meg, sek, sar, kol, seier, naa()).run();
      return json({ ok: true }, 201);
    }
  }

  // --- Spillet: Honningfella ---
  // Alle forsøk lagres for alltid. Tavlen viser beste skår per bror og oppdrag.
  if (ressurs === "honningfella") {
    if (metode === "GET") {
      const { results } = await db.prepare("SELECT navn, oppdrag, MAX(skar) AS beste, COUNT(*) AS forsok FROM honningfella GROUP BY navn, oppdrag").all();
      const totalt = await db.prepare("SELECT COUNT(*) AS n FROM honningfella").first();
      return json({ resultater: results, antallSpill: totalt ? totalt.n : 0 });
    }
    if (metode === "POST") {
      const b = await lesJson(request);
      const oppdrag = typeof b.oppdrag === "string" && /^[a-z0-9-]{1,40}$/.test(b.oppdrag) ? b.oppdrag : null;
      if (!oppdrag) return feil(400, "Ukjent oppdrag.");
      const heltall = (v, min, maks) => Math.max(min, Math.min(maks, Math.round(Number(v) || 0)));
      const moter = heltall(b.moter, 0, 50);
      await db
        .prepare("INSERT INTO honningfella (navn, oppdrag, skar, riktige, moter, prikker, fullfort, opprettet) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(meg, oppdrag, heltall(b.skar, -100000, 200000), heltall(b.riktige, 0, moter), moter, heltall(b.prikker, 0, 3), b.fullfort ? 1 : 0, naa())
        .run();
      return json({ ok: true }, 201);
    }
  }

  // --- Varsler ---
  if (ressurs === "varsler") {
    if (!id && metode === "GET") {
      const [{ results }, ulest] = await db.batch([
        db.prepare("SELECT id, avsender, type, tekst, lenke, lest, opprettet FROM varsler WHERE mottaker = ? ORDER BY id DESC LIMIT 40").bind(meg),
        db.prepare("SELECT COUNT(*) AS n FROM varsler WHERE mottaker = ? AND lest = 0").bind(meg),
      ]);
      return json({ varsler: results, uleste: ulest.results[0].n });
    }
    if (id === "lest" && metode === "POST") {
      const b = await lesJson(request);
      if (Number(b.id)) await db.prepare("UPDATE varsler SET lest = 1 WHERE id = ? AND mottaker = ?").bind(Number(b.id), meg).run();
      else await db.prepare("UPDATE varsler SET lest = 1 WHERE mottaker = ? AND lest = 0").bind(meg).run();
      // Rydder bort gamle, leste varsler
      await db.prepare("DELETE FROM varsler WHERE mottaker = ? AND lest = 1 AND opprettet < ?").bind(meg, new Date(Date.now() - 90 * 86400000).toISOString()).run();
      return json({ ok: true });
    }
  }

  // --- Aktivitetsskår for brødrene ---
  if (ressurs === "aktivitet" && metode === "GET") {
    // Poeng per handling. Endres her.
    const VEKT = { poster: 1, bilder: 2, svar: 1, saker: 5, stemmer: 1, skalMottatt: 1, profil: 3, seier: 5 };
    const telling = (sql) => db.prepare(sql);
    const [poster, bilder, svar, sakskom, saker, stemmer, skal, profil, seier] = (await db.batch([
      telling("SELECT navn, COUNT(*) AS n FROM poster GROUP BY navn"),
      // Bilder gir poeng én gang per møte, uansett hvor mange som er lastet opp
      telling("SELECT navn, COUNT(DISTINCT mote) AS n FROM bilder WHERE mote NOT IN ('profil', 'salongen') GROUP BY navn"),
      telling("SELECT navn, COUNT(*) AS n FROM svar GROUP BY navn"),
      telling("SELECT navn, COUNT(*) AS n FROM sakskommentarer GROUP BY navn"),
      telling("SELECT navn, COUNT(*) AS n FROM forslag WHERE status != 'trukket' GROUP BY navn"),
      telling("SELECT navn, COUNT(*) AS n FROM stemmer GROUP BY navn"),
      telling("SELECT p.navn AS navn, COUNT(*) AS n FROM skal s JOIN poster p ON p.id = s.post_id WHERE s.navn != p.navn GROUP BY p.navn"),
      telling("SELECT navn, 1 AS n FROM profiler WHERE COALESCE(tekst, '') != '' OR COALESCE(tafse, '') != ''"),
      telling("SELECT navn, 1 AS n FROM spillresultater WHERE seier = 1 GROUP BY navn"),
    ])).map((r) => Object.fromEntries(r.results.map((x) => [x.navn, x.n])));
    const ut = {};
    for (const navn of await medlemsliste(env, url)) {
      const d = {
        poster: poster[navn] || 0,
        bilder: bilder[navn] || 0,
        svar: (svar[navn] || 0) + (sakskom[navn] || 0),
        saker: saker[navn] || 0,
        stemmer: stemmer[navn] || 0,
        skalMottatt: skal[navn] || 0,
        profil: profil[navn] || 0,
        seier: seier[navn] || 0,
      };
      ut[navn] = { skar: Object.entries(d).reduce((sum, [k, n]) => sum + n * VEKT[k], 0), detaljer: d };
    }
    return json({ vekt: VEKT, brodre: ut });
  }

  // --- Presentasjoner av brødrene ---
  if (ressurs === "profiler") {
    if (!id && metode === "GET") {
      const { results } = await db.prepare("SELECT navn, tekst, tafse, bilde_id, info, partner, oppdatert FROM profiler").all();
      const tolk = (v) => { try { return v ? JSON.parse(v) : null; } catch (_) { return null; } };
      return json(results.map((r) => ({ ...r, info: tolk(r.info), partner: tolk(r.partner) })));
    }
    if (id && metode === "PUT") {
      // Oppdaterer bare feltene som er med, så de ulike skjemaene ikke overskriver hverandre
      const b = await lesJson(request);
      const gml = (await db.prepare("SELECT tekst, tafse, info, partner FROM profiler WHERE navn = ?").bind(meg).first()) || {};
      const somJson = (v, maks) => {
        if (v === null) return null;
        const s = JSON.stringify(v);
        if (!v || typeof v !== "object" || Array.isArray(v) || s.length > maks) throw new Error("ugyldig");
        return s;
      };
      let info, partner;
      try {
        info = "info" in b ? somJson(b.info, 4000) : gml.info ?? null;
        partner = "partner" in b ? somJson(b.partner, 4000) : gml.partner ?? null;
      } catch (_) {
        return feil(400, "Ugyldige profildata.");
      }
      const t = "tekst" in b ? tekst(b.tekst, 3000) : gml.tekst || "";
      const betyr = "tafse" in b ? tekst(b.tafse, 3000) : gml.tafse ?? null;
      await db
        .prepare("INSERT INTO profiler (navn, tekst, tafse, info, partner, oppdatert) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(navn) DO UPDATE SET tekst = excluded.tekst, tafse = excluded.tafse, info = excluded.info, partner = excluded.partner, oppdatert = excluded.oppdatert")
        .bind(meg, t, betyr, info, partner, naa())
        .run();
      return json({ ok: true });
    }
  }

  return feil(404, "Ukjent adresse.");
}
