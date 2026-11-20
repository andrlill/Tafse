// HOTELLETS ØKONOMI: hotellet har sin egen mynt, denarer. Man tjener dem ved å bruke hotellet,
// og bruker dem på avtaler som får godset i Symposion til å gå bedre.
//
//   1. Leie:    rommet tjener denarer hele døgnet etter hvor godt det er innredet. Hentes på rommet.
//   2. Baren:   kjøper råvarer fra godset, opp til en kvote per dag. Dagens ønske gir dobbel pris.
//   3. Avtaler: kjøpes i lobbyen, varer en uke og virker på godset i Symposion (lib/symposion.js).
//
// Denarene ligger i lommeboka sammen med premiene (lib/premier.js). Alle tall står i OKONOMI.

import { lommebok, betal } from "./premier.js";

export const OKONOMI = {
  leie: {
    grunn: 20,            // et tomt rom tjener så mye om dagen
    faktor: 2.2,          // pluss faktor × kvadratroten av standarden (verdien av møblene som står ute)
    perStjerne: 0.05,     // hver stjerne fra en gjest gir 5 % mer
    maksStjerner: 10,
    kasseTimer: 48,       // kassa på rommet rommer to døgn med leie
    forsteTimer: 12,      // første gang ligger det en halv dags leie og venter
  },
  // Verdien av en vare i standarden, etter hva den kostet i butikken
  vekt: { oliven: 1, vin: 1.5, marmor: 2.5 },
  vektEllers: 3,
  bar: {
    kvote: 200,           // så mange denarer baren handler for per gjest per dag, før dobling
    onske: 2,             // dagens ønske gir dobbel pris
    pris: { oliven: 0.1, vin: 0.15, marmor: 0.25, honning: 0.2, solv: 0.4, krydder: 0.8, purpur: 1.2 },
    navn: { oliven: "oliven", vin: "vin", marmor: "marmor", honning: "honning", solv: "sølv", krydder: "krydder", purpur: "purpur" },
  },
  // Avtalene virker på godset i Symposion så lenge de varer
  avtaler: {
    handel: { navn: "Handelsavtale", tekst: "Hotellet handler fast fra godset ditt. Alt godset lager, øker med 10 %.", pris: 600, dager: 7, bonus: 0.1 },
    lager: { navn: "Lagerleie", tekst: "Du leier kjelleren i hotellet. Lageret på godset rommer 3 timer mer.", pris: 400, dager: 7, timer: 3 },
    los: { navn: "Los i havna", tekst: "Hotellets los tar imot skipene dine. Toktene går 25 % raskere.", pris: 400, dager: 7, fart: 0.75, krever: "havn" },
  },
  maksForlenget: 21,      // en avtale kan ikke forlenges lenger enn tre uker fram
};

export const SKJEMA = [
  `CREATE TABLE IF NOT EXISTS hotell_kasse (navn TEXT PRIMARY KEY, sist_hentet TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS hotell_salg (navn TEXT NOT NULL, dag TEXT NOT NULL, verdi REAL NOT NULL DEFAULT 0, PRIMARY KEY (navn, dag))`,
  `CREATE TABLE IF NOT EXISTS hotell_avtale (navn TEXT NOT NULL, type TEXT NOT NULL, til TEXT NOT NULL, PRIMARY KEY (navn, type))`,
];

const TIME = 3600000, DOGN = 24 * TIME;
const dagen = (ms) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date(ms));
// Dagens ønske i baren: samme vare for alle, ny hver dag
export function onske(dag) {
  let h = 7;
  for (const c of dag) h = (h * 31 + c.charCodeAt(0)) % 100003;
  const varer = Object.keys(OKONOMI.bar.pris);
  return varer[h % varer.length];
}
// Spørringen som legger denarer i lommeboka. Kjøres sammen med resten i db.batch().
const gi = (db, navn, n) => db.prepare(`INSERT INTO premier (navn, valuta, antall, sist_dag) VALUES (?, 'denarer', ?, NULL)
  ON CONFLICT(navn, valuta) DO UPDATE SET antall = antall + excluded.antall`).bind(navn, n);

// Aktive avtaler for alle, til Symposion: Map(navn → Map(type → utløp))
export async function aktiveAvtaler(db, naa) {
  const ut = new Map();
  try {
    for (const r of (await db.prepare("SELECT navn, type, til FROM hotell_avtale WHERE til > ?").bind(naa).all()).results) {
      if (!ut.has(r.navn)) ut.set(r.navn, new Map());
      ut.get(r.navn).set(r.type, r.til);
    }
  } catch (_) { /* tabellen finnes ikke før hotellet er satt opp */ }
  return ut;
}

async function leie(db, navn, naaMs, KATALOG) {
  const L = OKONOMI.leie;
  const [ute, st, kasse] = await Promise.all([
    db.prepare("SELECT type, COUNT(*) AS n FROM hotell_mobel WHERE eier = ? AND x IS NOT NULL GROUP BY type").bind(navn).all(),
    db.prepare("SELECT COUNT(*) AS n FROM hotell_romstjerne WHERE eier = ?").bind(navn).first(),
    db.prepare("SELECT sist_hentet FROM hotell_kasse WHERE navn = ?").bind(navn).first(),
  ]);
  const verdi = (pris) => Object.entries(pris || {}).reduce((a, [v, n]) => a + n * (OKONOMI.vekt[v] || OKONOMI.vektEllers), 0);
  const standard = Math.round(ute.results.reduce((a, r) => a + (KATALOG[r.type] ? verdi(KATALOG[r.type].pris) * r.n : 0), 0));
  const stjerner = Math.min(L.maksStjerner, st ? st.n : 0);
  const perDag = Math.round((L.grunn + L.faktor * Math.sqrt(standard)) * (1 + L.perStjerne * stjerner));
  const sist = kasse ? Date.parse(kasse.sist_hentet) : naaMs - L.forsteTimer * TIME;
  const timer = Math.min(L.kasseTimer, Math.max(0, (naaMs - sist) / TIME));
  return { standard, stjerner, perDag, kasse: Math.floor((perDag * timer) / 24), full: timer >= L.kasseTimer, timerTilFull: Math.max(0, L.kasseTimer - timer) };
}

// GET hotell/okonomi: alt kontoret viser
export async function okonomi({ db, meg, naaMs, KATALOG }) {
  const B = OKONOMI.bar, idag = dagen(naaMs), naa = new Date(naaMs).toISOString();
  const [bok, gods, salg, avt, jeg, l] = await Promise.all([
    lommebok(db, meg),
    db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first(),
    db.prepare("SELECT verdi FROM hotell_salg WHERE navn = ? AND dag = ?").bind(meg, idag).first(),
    db.prepare("SELECT type, til FROM hotell_avtale WHERE navn = ? AND til > ?").bind(meg, naa).all(),
    db.prepare("SELECT rom FROM hotell_gjest WHERE navn = ?").bind(meg).first(),
    leie(db, meg, naaMs, KATALOG),
  ]);
  const brukt = salg ? salg.verdi : 0, rest = Math.max(0, B.kvote - brukt), dagens = onske(idag);
  const aktive = Object.fromEntries(avt.results.map((r) => [r.type, r.til]));
  return {
    denarer: bok.denarer || 0, rom: jeg ? jeg.rom : null, harGods: !!gods, leie: l,
    bar: {
      onske: dagens, kvote: B.kvote, rest: Math.floor(rest),
      varer: Object.entries(B.pris).map(([id, pris]) => {
        const har = gods ? Math.floor(gods[id] || 0) : 0;
        const antall = Math.min(har, Math.floor(rest / pris + 1e-9));
        return { id, navn: B.navn[id], har, pris, onske: id === dagens, antall, gir: Math.floor(antall * pris * (id === dagens ? B.onske : 1) + 1e-9) };
      }),
    },
    avtaler: Object.entries(OKONOMI.avtaler).map(([id, a]) => ({
      id, navn: a.navn, tekst: a.tekst, pris: a.pris, dager: a.dager, til: aktive[id] || null,
      apen: !!gods && (!a.krever || (gods[a.krever] || 0) > 0), krever: a.krever || null,
    })),
  };
}

// POST hotell/leie, hotell/selg og hotell/avtale. Gir null hvis handlingen ikke hører hjemme her.
export async function okonomiPost({ db, meg, handling, b, naaMs, json, feil, KATALOG }) {
  if (!["leie", "selg", "avtale"].includes(handling)) return null;
  const naa = new Date(naaMs).toISOString(), idag = dagen(naaMs);
  const jeg = await db.prepare("SELECT rom FROM hotell_gjest WHERE navn = ?").bind(meg).first();
  const rom = jeg ? jeg.rom : null;
  const svar = async (ekstra) => json({ ok: true, ...ekstra, okonomi: await okonomi({ db, meg, naaMs, KATALOG }) });

  if (handling === "leie") {
    if (rom !== `hjem:${meg}`) return feil(400, "Kassa står på rommet ditt. Gå dit først.");
    const l = await leie(db, meg, naaMs, KATALOG);
    if (l.kasse < 1) return feil(409, "Kassa er tom. Kom tilbake litt senere.");
    await db.batch([
      db.prepare("INSERT INTO hotell_kasse (navn, sist_hentet) VALUES (?, ?) ON CONFLICT(navn) DO UPDATE SET sist_hentet = excluded.sist_hentet").bind(meg, naa),
      gi(db, meg, l.kasse),
    ]);
    return svar({ fikk: l.kasse });
  }

  if (handling === "selg") {
    if (rom !== "baren") return feil(400, "Baren kjøper bare over disken. Gå til baren først.");
    const B = OKONOMI.bar, vare = b.vare;
    if (typeof vare !== "string" || !Object.hasOwn(B.pris, vare)) return feil(400, "Baren kjøper ikke det.");
    const gods = await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first();
    if (!gods) return feil(400, "Du har ikke noe gods å selge fra.");
    const salg = await db.prepare("SELECT verdi FROM hotell_salg WHERE navn = ? AND dag = ?").bind(meg, idag).first();
    const rest = B.kvote - (salg ? salg.verdi : 0), pris = B.pris[vare];
    const antall = Math.min(Math.floor(Number(b.antall) || 0), Math.floor(gods[vare] || 0), Math.floor(rest / pris + 1e-9));
    const dobbel = vare === onske(idag);
    const denarer = Math.floor(antall * pris * (dobbel ? B.onske : 1) + 1e-9);
    if (antall < 1 || denarer < 1) return feil(409, rest < pris ? "Baren har kjøpt nok av deg i dag. Kom igjen i morgen." : `Du har for lite ${B.navn[vare]} å selge.`);
    await db.batch([
      db.prepare(`UPDATE symposion_gods SET ${vare} = ${vare} - ? WHERE navn = ?`).bind(antall, meg),
      db.prepare("INSERT INTO hotell_salg (navn, dag, verdi) VALUES (?, ?, ?) ON CONFLICT(navn, dag) DO UPDATE SET verdi = verdi + excluded.verdi").bind(meg, idag, antall * pris),
      gi(db, meg, denarer),
    ]);
    return svar({ solgt: { vare, navn: B.navn[vare], antall, denarer, dobbel } });
  }

  // avtale
  if (rom !== "lobbyen") return feil(400, "Avtaler skrives i resepsjonen. Gå til lobbyen først.");
  const type = b.type;
  const a = typeof type === "string" && Object.hasOwn(OKONOMI.avtaler, type) ? OKONOMI.avtaler[type] : null;
  if (!a) return feil(400, "Den avtalen finnes ikke.");
  const gods = await db.prepare("SELECT * FROM symposion_gods WHERE navn = ?").bind(meg).first();
  if (!gods) return feil(400, "Avtalene gjelder godset ditt i Symposion. Flytt inn der først.");
  if (a.krever && !(gods[a.krever] > 0)) return feil(400, "Du trenger havn i Symposion for denne avtalen.");
  const bok = await lommebok(db, meg);
  if ((bok.denarer || 0) < a.pris) return feil(400, `Du mangler ${a.pris - (bok.denarer || 0)} denarer.`);
  const har = await db.prepare("SELECT til FROM hotell_avtale WHERE navn = ? AND type = ?").bind(meg, type).first();
  const fra = Math.max(naaMs, har ? Date.parse(har.til) : 0);
  if (fra - naaMs > OKONOMI.maksForlenget * DOGN) return feil(409, "Avtalen er allerede forlenget tre uker fram.");
  const til = new Date(fra + a.dager * DOGN).toISOString();
  await betal(db, meg, { denarer: a.pris });
  await db.prepare("INSERT INTO hotell_avtale (navn, type, til) VALUES (?, ?, ?) ON CONFLICT(navn, type) DO UPDATE SET til = excluded.til").bind(meg, type, til).run();
  return svar({ avtale: { type, navn: a.navn, til, forlenget: fra > naaMs } });
}
