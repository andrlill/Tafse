// Tester for Kaos-motoren. Kjør: node scripts/kaos-test.mjs [navn på test]
// Motoren er et vanlig nettleserskript, så den lastes inn med vm.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sandkasse = { btoa, atob, Math, Date, JSON, console };
sandkasse.globalThis = sandkasse;
vm.createContext(sandkasse);
vm.runInContext(readFileSync(path.join(rot, "assets/kaos-motor.js"), "utf8"), sandkasse, { filename: "kaos-motor.js" });
export const K = sandkasse.KAOS;
const { E, EL, B, H } = K;

const TEGN = {};
for (const e of EL) TEGN[e.id] = e.nokkel[0];
Object.assign(TEGN, { [E.TOM]: " ", [E.STEIN]: "#", [E.VANN]: "~", [E.ILD]: "*", [E.LAVA]: "L", [E.TRE]: "T", [E.SAND]: ".", [E.OLJE]: "o", [E.GLO]: "%", [E.METALL]: "=", [E.KRUTT]: "k", [E.TEGL]: "H", [E.DAMP]: "'", [E.ROYK]: "\"", [E.KILDE]: "K", [E.PLANTE]: "p", [E.OBSIDIAN]: "O", [E.GJORME]: "g", [E.JORD]: ":" });
export function vis(v, steg = 2) {
  const linjer = [];
  for (let y = 0; y < H; y += steg) {
    let l = "";
    for (let x = 0; x < B; x += steg) l += TEGN[v.T[y * B + x]] || "?";
    linjer.push(l.replace(/\s+$/, ""));
  }
  for (const m of v.folk) console.log("menneske", m.x, m.y);
  console.log(linjer.join("\n"));
}
export const kjor = (v, n) => { for (let i = 0; i < n; i++) v.steg(); };
export function opptelling(v) {
  const ut = {};
  for (let i = 0; i < v.T.length; i++) if (v.T[i]) ut[EL[v.T[i]].nokkel] = (ut[EL[v.T[i]].nokkel] || 0) + 1;
  return ut;
}

// ---------- Selve testene (kjøres bare når fila startes direkte) ----------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { FUNN } = await import(path.join(rot, "lib/kaos.js"));
  let feil = 0;
  const sjekk = (navn, ok, mer = "") => { console.log(`${ok ? "ok  " : "FEIL"} ${navn}${mer ? "  " + mer : ""}`); if (!ok) feil++; };
  const ny = (fro = 1) => { const v = K.lagVerden(fro); v.funn = new Set(); v.vedFunn = (n) => v.funn.add(n); v.settKjent([]); v.fyll(0, 140, B - 1, H - 1, E.STEIN); return v; };
  const linje = (v, x0, y0, x1, y1, t) => { let n = 0; const s = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= s; k++) n += v.mal(Math.round(x0 + ((x1 - x0) * k) / s), Math.round(y0 + ((y1 - y0) * k) / s), 0, t); return n; };

  sjekk("serveren og motoren har de samme oppdagelsene", JSON.stringify([...FUNN].sort()) === JSON.stringify(K.FUNN.map((f) => f.nokkel).sort()));

  // Olje flyter på vann, sand synker
  { const v = ny(); v.fyll(20, 100, 22, 139, E.STEIN); v.fyll(80, 100, 82, 139, E.STEIN); v.fyll(23, 120, 79, 129, E.OLJE); v.fyll(23, 110, 79, 119, E.VANN); v.fyll(40, 90, 60, 95, E.SAND); kjor(v, 900);
    sjekk("olje legger seg over vann, sand på bunnen", v.hent(50, 139) === E.SAND && v.tellOmraade(E.OLJE, 23, 115, 79, 124) > 400 && v.tellOmraade(E.VANN, 23, 125, 79, 139) > 400); }
  // Bål: røyk og aske, og kull når det slukkes
  { const v = ny(); v.fyll(40, 110, 70, 139, E.TRE); v.mal(55, 108, 2, E.ILD); kjor(v, 1500);
    sjekk("tre brenner opp til røyk og aske", v.tell(E.TRE) === 0 && v.funn.has("royk") && v.funn.has("aske")); }
  { const v = ny(); v.fyll(40, 120, 70, 139, E.TRE); v.mal(55, 118, 2, E.ILD); kjor(v, 150); v.fyll(30, 60, 80, 100, E.VANN); kjor(v, 400);
    sjekk("glør som slukkes blir til kull, vannet til damp", v.funn.has("kull") && v.funn.has("damp")); }
  // Vekst og vin
  { const v = ny(); v.fyll(30, 130, 90, 139, E.JORD); v.fyll(40, 122, 80, 129, E.VANN); kjor(v, 60); for (let x = 35; x < 90; x += 5) v.mal(x, 110, 0, E.FRO); kjor(v, 600); v.fyll(40, 60, 80, 80, E.VANN); kjor(v, 2500);
    sjekk("frø gir plante, blomst, drue og vin", ["gjorme", "plante", "blomst", "drue", "vin"].every((n) => v.funn.has(n)), [...v.funn].join(",")); }
  // Lyn: glass, lava, strøm og eksplosjon
  { const v = ny(); v.fyll(10, 130, 40, 139, E.SAND); v.lyn(25, 20); v.lyn(100, 20); v.fyll(120, 139, 170, 139, E.METALL); v.fyll(171, 134, 176, 139, E.KRUTT); v.lyn(140, 50); kjor(v, 120);
    sjekk("lyn gir glass, lava, strøm og eksplosjon", ["glass", "lava", "strom", "eksplosjon"].every((n) => v.funn.has(n)) && v.tell(E.KRUTT) === 0, [...v.funn].join(",")); }
  // Mennesker
  { const v = ny(); v.fyll(60, 130, 100, 139, E.GJORME); v.lyn(80, 50); kjor(v, 5); const levende = v.folk.length; v.fyll(110, 138, 150, 139, E.VIN); kjor(v, 1500); if (v.folk[0]) v.mal(v.folk[0].x, v.folk[0].y - 10, 2, E.MIDAS); kjor(v, 80);
    sjekk("lyn i gjørme gir et menneske, som blir fullt og til slutt en gullstatue", levende === 1 && ["menneske", "rus", "gull", "gullstatue"].every((n) => v.funn.has(n)), [...v.funn].join(",")); }
  // Lagring
  { const v = ny(3); v.fyll(10, 10, 60, 60, E.SAND); v.settKilde(100, 50, E.VANN); v.menneske(150, 100); const kode = v.kod(); const u = K.lagVerden(4);
    sjekk("et brett kan lagres og leses inn igjen", u.les(kode) && u.tell(E.SAND) === v.tell(E.SAND) && u.X[50 * B + 100] === E.VANN && u.folk.length === 1 && !u.les("tull") && !u.les('{"v":1,"t":"AAAA"}')); }

  // Dagens oppdrag: alle malene lar seg bygge i hundre dager, og er de samme hver gang for samme dato
  { let ok = true; const sett = new Set();
    for (let d = 0; d < 100; d++) { const dag = new Date(Date.UTC(2026, 10, 20 + d)).toISOString().slice(0, 10); const a = K.lagOppdrag(dag), b = K.lagOppdrag(dag); const v = K.lagVerden(1), w = K.lagVerden(2); a.bygg(v); b.bygg(w); sett.add(a.mal);
      const lik = v.T.every((t, i) => t === w.T[i]); if (!lik || !(a.par[0] > 0 && a.par[0] < a.par[1]) || a.maal(v, 0).klart) { ok = false; console.log("  avvik", dag, a.mal, a.par); } }
    sjekk("hundre dager med oppdrag lar seg bygge, og er like for alle", ok && sett.size === K.MALER.length); }
  const spill = (o, bot, fro = 5) => { const v = K.lagVerden(fro); o.bygg(v); const korn = bot(v, o); for (let t = 1; t <= o.tid; t++) { if (o.vedSteg) o.vedSteg(v, t); v.steg(); if (t % 10 === 0 || t === o.tid) { const m = o.maal(v, t); if (m.klart) return { korn, klart: true }; if (m.tapt) break; } } return { korn, klart: false }; };
  const dager = (mal, antall) => { const ut = []; for (let d = 0; ut.length < antall && d < 400; d++) { const o = K.lagOppdrag(new Date(Date.UTC(2026, 10, 20 + d)).toISOString().slice(0, 10)); if (o.mal === mal) ut.push(o); } return ut; };
  // Akvedukten: bruer via klippene gir tre stjerner
  for (const o of dager("akvedukten", 4)) {
    const r = spill(o, (v) => { const { y1, y2, k1, b1, k2, b2, kl1, kl2 } = o.info; let n = 0; const bro = (x0, b, kl, yb) => { const k = kl[0]; n += linje(v, x0, k.y, k.x - 1, k.y, E.STEIN) + linje(v, k.x + k.b, yb, x0 + b - 1, yb, E.STEIN) + v.mal(k.x + k.b - 1, yb, 0, E.STEIN) + v.mal(k.x + k.b - 1, yb - 1, 0, E.STEIN); }; bro(k1, b1, kl1, y1); bro(k2, b2, kl2, y2); return n; });
    sjekk(`akvedukten ${o.dag} kan løses med tre stjerner`, r.klart && K.stjerner(o, r.korn) === 3, `${r.korn} korn, par ${o.par}`);
  }
  // Zevs: korteste ledning gir tre stjerner
  for (const o of dager("zevs", 4)) {
    const r = spill(o, (v) => { const { xs, tx, ty } = o.info, fra = 34 * B + xs, til = (ty - 6) * B + tx + 4, forr = new Int32Array(B * H).fill(-1), ko = [fra]; forr[fra] = fra;
      for (let h = 0; h < ko.length && ko[h] !== til; h++) { const i = ko[h], x = i % B, y = (i / B) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= B || ny >= H) continue; const j = ny * B + nx; if (forr[j] >= 0 || v.T[j] !== E.TOM) continue; forr[j] = i; ko.push(j); } }
      let n = 0; for (let i = til; i !== fra; i = forr[i]) n += v.mal(i % B, (i / B) | 0, 0, E.METALL); return n + v.mal(xs, 34, 0, E.METALL); });
    sjekk(`zevs ${o.dag} kan løses med tre stjerner`, r.klart && K.stjerner(o, r.korn) === 3, `${r.korn} korn, par ${o.par}`);
  }
  // Flåten: to lag olje mellom alle skipene holder (ilden kan slukne, så flere forsøk er lov)
  for (const o of dager("flaaten", 3)) {
    let r; for (let f = 1; f <= 4 && !(r && r.klart); f++) r = spill(o, (v) => { const { skip, hav } = o.info; let n = 0; for (let k = 0; k + 1 < skip.length; k++) for (let l = 0; l < 2; l++) n += linje(v, skip[k].x + skip[k].b - 5, hav - 1 - l, skip[k + 1].x + 4, hav - 1 - l, E.OLJE); const m = skip[0].x + (skip[0].b >> 1); return n + v.mal(m - 1, hav - 9, 0, E.ILD); }, f);
    sjekk(`flåten ${o.dag} kan løses`, r.klart, `${r.korn} korn, par ${o.par}`);
  }
  // Vesuv: uten hjelp brenner byen, en høy mur redder den
  for (const o of dager("vesuv", 3)) {
    const uten = spill(o, () => 0), med = spill(o, (v) => linje(v, o.info.hus[0].x - 3, o.info.gulv - 1, o.info.hus[0].x - 3, o.info.gulv - 26, E.STEIN));
    sjekk(`vesuv ${o.dag}: byen brenner uten hjelp og reddes av en mur`, !uten.klart && med.klart, `${med.korn} korn, par ${o.par}`);
  }
  // Muren: krutt på gulvet i alle rom og i tårnene river over halvparten
  for (const o of dager("muren", 3)) {
    const r = spill(o, (v) => { const { rom, romB, romH, x0, x1, taarn, gulv, topp } = o.info; let n = 0; for (const [x, y] of rom) n += linje(v, x, y + romH - 1, x + romB - 1, y + romH - 1, E.KRUTT);
      for (const tx of [x0, x1 - taarn]) for (let y = topp - 3; y < gulv - 4; y += 6) n += linje(v, tx + 3, y, tx + taarn - 4, y, E.KRUTT);
      const y = Math.max(...rom.map((q) => q[1])), nederst = rom.filter((q) => q[1] === y); return n + v.mal(nederst[0][0] + 2, y + romH - 2, 0, E.ILD) + v.mal(nederst[nederst.length - 1][0] + 2, y + romH - 2, 0, E.ILD); });
    sjekk(`muren ${o.dag} kan løses innenfor det man har`, r.klart && r.korn <= o.tillatt[0][1] + 2, `${r.korn} korn, par ${o.par}`);
  }
  console.log(feil ? `\n${feil} feil` : "\nAlt i orden");
  process.exit(feil ? 1 : 0);
}
