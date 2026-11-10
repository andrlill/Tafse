// TAFSE – API for forslag, kommentarer og bilder.
// Kjører som Cloudflare Pages Function. Krever:
//   - en D1-database koblet til med variabelnavnet DB
//   - en hemmelighet (secret) TAFSE_PASSORD med akademiets passord

const MAKS_BILDE = 1_900_000; // byte, D1 tåler rundt 2 MB per rad
const BILDETYPER = ["image/jpeg", "image/png", "image/webp"];
const STATUSER = ["innmeldt", "vedtatt", "forkastet"];

let skjemaKlart = false;

async function sikreSkjema(db) {
  if (skjemaKlart) return;
  await db.batch([
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
    db.prepare(`CREATE TABLE IF NOT EXISTS kommentarer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mote TEXT NOT NULL,
      navn TEXT NOT NULL,
      tekst TEXT NOT NULL,
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
    db.prepare(`CREATE TABLE IF NOT EXISTS profiler (
      navn TEXT PRIMARY KEY,
      tekst TEXT NOT NULL,
      oppdatert TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS kommentarer_mote ON kommentarer (mote)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS bilder_mote ON bilder (mote)`),
  ]);
  skjemaKlart = true;
}

function json(data, status = 200, ekstra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...ekstra },
  });
}
const feil = (status, tekst) => json({ feil: tekst }, status);

async function token(passord) {
  const nokkel = await crypto.subtle.importKey("raw", new TextEncoder().encode(passord), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", nokkel, new TextEncoder().encode("tafse-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function likt(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function cookie(request, navn) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp(`(?:^|;\\s*)${navn}=([^;]+)`));
  return m ? m[1] : null;
}

async function erInnlogget(request, env) {
  return likt(cookie(request, "tafse"), await token(env.TAFSE_PASSORD));
}

const tekst = (v, maks) => (typeof v === "string" ? v.trim().slice(0, maks) : "");
const gyldigMote = (m) => typeof m === "string" && /^[a-z0-9-]{1,40}$/.test(m);
const naa = () => new Date().toISOString();

async function lesJson(request) {
  try { return await request.json(); } catch (_) { return {}; }
}

export async function onRequest({ request, env, params }) {
  if (!env.TAFSE_PASSORD) return feil(500, "Passordet er ikke satt opp. Legg til hemmeligheten TAFSE_PASSORD i Cloudflare.");
  if (!env.DB) return feil(500, "Databasen er ikke koblet til. Koble en D1-database til med navnet DB i Cloudflare.");

  const deler = Array.isArray(params.sti) ? params.sti : [params.sti].filter(Boolean);
  const [ressurs, id] = deler;
  const metode = request.method;
  const url = new URL(request.url);

  // --- Innlogging ---
  if (ressurs === "meg" && metode === "GET") {
    return json({ innlogget: await erInnlogget(request, env) });
  }
  if (ressurs === "logginn" && metode === "POST") {
    const { passord } = await lesJson(request);
    if (!likt(String(passord || ""), env.TAFSE_PASSORD)) {
      await new Promise((r) => setTimeout(r, 600));
      return feil(401, "Feil passord");
    }
    const t = await token(env.TAFSE_PASSORD);
    const sikker = url.protocol === "https:" ? "; Secure" : "";
    return json({ innlogget: true }, 200, {
      "Set-Cookie": `tafse=${t}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${sikker}`,
    });
  }
  if (ressurs === "loggut" && metode === "POST") {
    return json({ innlogget: false }, 200, { "Set-Cookie": "tafse=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax" });
  }

  // Alt under krever innlogging
  if (!(await erInnlogget(request, env))) return feil(401, "Ikke innlogget");

  const db = env.DB;
  await sikreSkjema(db);

  // --- Vedtektsforslag ---
  if (ressurs === "forslag") {
    if (!id && metode === "GET") {
      const { results } = await db.prepare("SELECT id, navn, paragraf, tittel, tekst, begrunnelse, status, opprettet FROM forslag ORDER BY id DESC").all();
      return json(results);
    }
    if (!id && metode === "POST") {
      const b = await lesJson(request);
      const navn = tekst(b.navn, 60), tittel = tekst(b.tittel, 160), innhold = tekst(b.tekst, 5000);
      if (!navn || !tittel || !innhold) return feil(400, "Navn, tittel og forslag må fylles ut.");
      const r = await db
        .prepare("INSERT INTO forslag (navn, paragraf, tittel, tekst, begrunnelse, opprettet) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(navn, tekst(b.paragraf, 40), tittel, innhold, tekst(b.begrunnelse, 5000), naa())
        .run();
      return json({ id: r.meta.last_row_id }, 201);
    }
    if (id && metode === "PATCH") {
      const { status } = await lesJson(request);
      if (!STATUSER.includes(status)) return feil(400, "Ugyldig status.");
      await db.prepare("UPDATE forslag SET status = ? WHERE id = ?").bind(status, Number(id)).run();
      return json({ ok: true });
    }
    if (id && metode === "DELETE") {
      await db.prepare("DELETE FROM forslag WHERE id = ?").bind(Number(id)).run();
      return json({ ok: true });
    }
  }

  // --- Kommentarer til møter ---
  if (ressurs === "kommentarer") {
    if (!id && metode === "GET") {
      const mote = url.searchParams.get("mote");
      if (!gyldigMote(mote)) return feil(400, "Ugyldig møte.");
      const { results } = await db.prepare("SELECT id, navn, tekst, opprettet FROM kommentarer WHERE mote = ? ORDER BY id ASC").bind(mote).all();
      return json(results);
    }
    if (!id && metode === "POST") {
      const b = await lesJson(request);
      const navn = tekst(b.navn, 60), innhold = tekst(b.tekst, 5000);
      if (!gyldigMote(b.mote) || !navn || !innhold) return feil(400, "Navn og kommentar må fylles ut.");
      const r = await db.prepare("INSERT INTO kommentarer (mote, navn, tekst, opprettet) VALUES (?, ?, ?, ?)").bind(b.mote, navn, innhold, naa()).run();
      return json({ id: r.meta.last_row_id }, 201);
    }
    if (id && metode === "DELETE") {
      await db.prepare("DELETE FROM kommentarer WHERE id = ?").bind(Number(id)).run();
      return json({ ok: true });
    }
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
      const fil = skjema.get("fil");
      const mote = skjema.get("mote");
      const navn = tekst(skjema.get("navn"), 60);
      if (!gyldigMote(mote) || !navn) return feil(400, "Velg navn før du laster opp.");
      if (!fil || typeof fil === "string") return feil(400, "Fant ikke bildet.");
      if (!BILDETYPER.includes(fil.type)) return feil(400, "Bare JPG, PNG og WebP støttes.");
      if (fil.size > MAKS_BILDE) return feil(413, "Bildet er for stort.");
      const data = await fil.arrayBuffer();
      const r = await db
        .prepare("INSERT INTO bilder (mote, navn, tekst, type, storrelse, data, opprettet) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(mote, navn, tekst(skjema.get("tekst"), 300), fil.type, data.byteLength, data, naa())
        .run();
      return json({ id: r.meta.last_row_id }, 201);
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
      await db.prepare("DELETE FROM bilder WHERE id = ?").bind(Number(id)).run();
      return json({ ok: true });
    }
  }

  // --- Presentasjoner av brødrene ---
  if (ressurs === "profiler") {
    if (!id && metode === "GET") {
      const { results } = await db.prepare("SELECT navn, tekst, oppdatert FROM profiler").all();
      return json(results);
    }
    if (id && metode === "PUT") {
      const navn = tekst(decodeURIComponent(id), 60);
      const { tekst: innhold } = await lesJson(request);
      const t = tekst(innhold, 3000);
      if (!navn) return feil(400, "Mangler navn.");
      if (!t) {
        await db.prepare("DELETE FROM profiler WHERE navn = ?").bind(navn).run();
        return json({ ok: true });
      }
      await db
        .prepare("INSERT INTO profiler (navn, tekst, oppdatert) VALUES (?, ?, ?) ON CONFLICT(navn) DO UPDATE SET tekst = excluded.tekst, oppdatert = excluded.oppdatert")
        .bind(navn, t, naa())
        .run();
      return json({ ok: true });
    }
  }

  return feil(404, "Ukjent adresse.");
}
