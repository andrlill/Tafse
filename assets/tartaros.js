// TARTAROS: overlev ti minutter i underverdenen.
// Du styrer bare helten. Våpnene skyter selv, fiendene slipper sjeler som gir nye nivåer,
// og på hvert nivå velger du ett av tre: et nytt våpen, et sterkere våpen eller en gudegave.
// Drakmer du finner, brukes i leiren på varige oppgraderinger (lib/tartaros.js holder regnskapet).

(() => {
  const lerret = document.getElementById("ta-lerret"), ctx = lerret.getContext("2d");
  const lag = document.getElementById("ta-lag"), leir = document.getElementById("ta-leir"), tavle = document.getElementById("ta-tavle");
  const TAU = Math.PI * 2;
  const tilf = (a, b) => a + Math.random() * (b - a);
  const tall = (n) => Math.round(n).toLocaleString("nb-NO");
  const klokke = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const innlogget = () => typeof MEG !== "undefined" && !!MEG;

  // ---------- Regler (endres her) ----------
  const SEIERSTID = 600;
  const MAKS_FIENDER = 230;
  const VAPENPLASSER = 5, GAVEPLASSER = 5, MAKS_VAPEN = 6, MAKS_GAVE = 5;
  const behov = (l) => Math.floor(4 + l * 3 + l * l * 0.3);   // sjeler til neste nivå
  const hpFaktor = (m) => 1 + m * 0.22 + Math.max(0, m - 6) * 0.25;
  const takt = (t) => 1.1 + (t / 60) * 0.75;                     // fiender i sekundet
  const tak = (t) => Math.min(MAKS_FIENDER, 40 + (t / 60) * 22);
  const BOSSER = [[150, "kyklop"], [300, "kerberos"], [480, "kronos"]];
  const SVERMER = [[60, "skygge", 18], [120, "skygge", 24], [210, "harpy", 22], [330, "skjelett", 30], [420, "harpy", 34], [510, "skjelett", 40], [570, "kentaur", 26]];

  const VAPEN = {
    spyd: { navn: "Spyd", tegn: "S", farge: "#e2c174",
      p: (l) => ({ skade: 12 + (l >= 3 ? 6 : 0) + (l >= 5 ? 8 : 0), ant: 1 + (l >= 2) + (l >= 4) + (l >= 6), gjennom: 1 + (l >= 3) + (l >= 6 ? 2 : 0), cd: 1.0 }),
      tekst: ["Kaster et spyd mot nærmeste fiende.", "Ett spyd til.", "Mer skade, og spydene går gjennom én fiende til.", "Ett spyd til.", "Mye mer skade.", "Ett spyd til, og de går gjennom to fiender til."] },
    diskos: { navn: "Diskos", tegn: "D", farge: "#d19f76",
      p: (l) => ({ skade: 9 + (l >= 3 ? 5 : 0) + (l >= 6 ? 8 : 0), sprett: 3 + (l >= 2 ? 2 : 0) + (l >= 5 ? 3 : 0), ant: 1 + (l >= 4) + (l >= 6), cd: 1.7 }),
      tekst: ["En diskos som spretter mellom fiendene.", "To sprett til.", "Mer skade.", "Én diskos til.", "Tre sprett til.", "Én diskos til og mye mer skade."] },
    lyn: { navn: "Zevs' lyn", tegn: "Z", farge: "#bfe3ff",
      p: (l) => ({ skade: 22 + (l >= 3 ? 10 : 0) + (l >= 6 ? 15 : 0), ant: 1 + (l >= 2) + (l >= 5), r: 46 + (l >= 4 ? 20 : 0), cd: l >= 6 ? 1.9 : 2.4 }),
      tekst: ["Lynet slår ned i en tilfeldig fiende og alle rundt.", "Ett lyn til.", "Mer skade.", "Større nedslag.", "Ett lyn til.", "Mye mer skade, og lynet kommer oftere."] },
    ild: { navn: "Gresk ild", tegn: "G", farge: "#f08a4b",
      p: (l) => ({ skade: 14 + (l >= 3 ? 8 : 0) + (l >= 6 ? 8 : 0), r: 44 + (l >= 2 ? 14 : 0), ant: 1 + (l >= 4) + (l >= 6), var: 3 + (l >= 5 ? 1.5 : 0), cd: 3.2 }),
      tekst: ["Kaster en amfora som etterlater et brennende basseng.", "Større basseng.", "Mer skade.", "Én amfora til.", "Ilden brenner lenger.", "Én amfora til og mer skade."] },
    lyre: { navn: "Orfeus' lyre", tegn: "O", farge: "#c9a4f0",
      p: (l) => ({ skade: 10 + (l >= 2 ? 6 : 0) + (l >= 5 ? 10 : 0), r: 90 + (l >= 3 ? 25 : 0) + (l >= 6 ? 25 : 0), cd: l >= 4 ? 1.7 : 2.2, dobbel: l >= 6 }),
      tekst: ["En tone som skader og skyver unna alle rundt deg.", "Mer skade.", "Større rekkevidde.", "Tonen kommer oftere.", "Mye mer skade.", "Større rekkevidde og et ekko."] },
    aegis: { navn: "Aigis", tegn: "A", farge: "#8fd3c0",
      p: (l) => ({ skade: 8 + (l >= 3 ? 6 : 0) + (l >= 6 ? 8 : 0), ant: 2 + (l >= 2) + (l >= 4) + (l >= 6), r: 70 + (l >= 5 ? 20 : 0), fart: 2.6 + (l >= 5 ? 0.8 : 0) }),
      tekst: ["To skjold som kretser rundt deg.", "Ett skjold til.", "Mer skade.", "Ett skjold til.", "Større og raskere bane.", "Ett skjold til og mer skade."] },
  };
  const GAVER = {
    sandaler: { navn: "Hermes' sandaler", tegn: "H", farge: "#9ad0f5", tekst: "+8 % fart" },
    styrke: { navn: "Herakles' styrke", tegn: "K", farge: "#e0533d", tekst: "+10 % skade" },
    ambrosia: { navn: "Ambrosia", tegn: "B", farge: "#f2a6c8", tekst: "+20 liv, og du leges sakte" },
    laurbar: { navn: "Laurbærkrans", tegn: "L", farge: "#9db36a", tekst: "Trekker sjeler fra lenger unna, og +8 % sjeler" },
    esse: { navn: "Hefaistos' esse", tegn: "E", farge: "#f2c14e", tekst: "Våpnene lader 7 % fortere" },
    omrade: { navn: "Gaias favn", tegn: "F", farge: "#b5895a", tekst: "+10 % rekkevidde og størrelse" },
  };
  const HELTER = {
    akilles: { navn: "Akilles", vapen: "spyd", farge: "#b5282a", tekst: "Spyd · +10 % skade" },
    atalanta: { navn: "Atalanta", vapen: "diskos", farge: "#2f9d8a", tekst: "Diskos · +12 % fart" },
    orfeus: { navn: "Orfeus", vapen: "lyre", farge: "#8e5bd0", tekst: "Lyre · +15 % rekkevidde" },
    odyssevs: { navn: "Odyssevs", vapen: "ild", farge: "#2f6fb5", tekst: "Gresk ild · +15 % sjeler" },
  };
  const GUNST = {
    styrke: { navn: "Ares' velsignelse", tekst: "+5 % skade per kjøp" },
    liv: { navn: "Hestias arne", tekst: "+10 liv per kjøp" },
    fart: { navn: "Vind i ryggen", tekst: "+3 % fart per kjøp" },
    visdom: { navn: "Athenes visdom", tekst: "+5 % sjeler per kjøp" },
    magnet: { navn: "Sjelefanger", tekst: "+10 % rekkevidde på sjeler per kjøp" },
    rustning: { navn: "Hefaistos' rustning", tekst: "Du tar 4 % mindre skade per kjøp" },
    midas: { navn: "Midas' berøring", tekst: "+10 % drakmer fra hvert tokt per kjøp" },
    orakel: { navn: "Orakelet i Delfi", tekst: "Når du får velge gave og ikke liker kortene, kan du bytte dem ut med tre nye. Du får ett bytte per tokt for hvert kjøp" },
    arsenal: { navn: "Våpenbærer", tekst: "Du starter hvert tokt med ett tilfeldig våpen i tillegg" },
    fjaer: { navn: "Føniksfjær", tekst: "Du reiser deg én gang per tokt" },
  };
  // hp, fart, skade ved berøring, radius, sjeler, poeng
  const FIENDER = {
    skygge: { hp: 8, fart: 52, skade: 6, r: 11, xp: 1, poeng: 1 },
    skjelett: { hp: 18, fart: 62, skade: 8, r: 12, xp: 1, poeng: 2 },
    harpy: { hp: 12, fart: 112, skade: 6, r: 11, xp: 1, poeng: 2 },
    kentaur: { hp: 42, fart: 78, skade: 12, r: 15, xp: 3, poeng: 5 },
    gorgon: { hp: 34, fart: 48, skade: 8, r: 13, xp: 3, poeng: 6 },
    minotaur: { hp: 150, fart: 58, skade: 18, r: 21, xp: 10, poeng: 15 },
    kyklop: { hp: 900, fart: 46, skade: 22, r: 38, xp: 60, poeng: 200, boss: "Kyklopen" },
    kerberos: { hp: 2600, fart: 70, skade: 24, r: 36, xp: 120, poeng: 500, boss: "Kerberos" },
    kronos: { hp: 7000, fart: 54, skade: 30, r: 44, xp: 250, poeng: 1500, boss: "Kronos" },
  };
  const vekter = (m) => ({
    skygge: Math.max(0, 5 - m * 0.6) + 1, skjelett: m >= 0.75 ? 3 : 0, harpy: m >= 1.5 ? 2 : 0,
    kentaur: m >= 3 ? 1.5 : 0, gorgon: m >= 4.5 ? 1 : 0, minotaur: m >= 5.5 ? 0.5 + (m - 5.5) * 0.25 : 0,
  });

  // ---------- Tilstand ----------
  let S = null;                       // toktet som pågår (eller bakgrunnen i menyen)
  let PROFIL = { drakmer: 0, gunst: {}, helter: [] }, PRISER = null, data = null;
  let valgtHelt = "akilles";
  let vW = 992, vH = 620, nid = 1;
  const taster = {};
  let styr = null;                    // fingeren eller musa som drar
  const sistLyd = {};
  try { valgtHelt = localStorage.getItem("tafse-tartaros-helt") || "akilles"; } catch (_) {}

  function lyd(navn, mellomrom, ...arg) {
    const naa = performance.now();
    if (naa - (sistLyd[navn] || 0) < mellomrom * 1000) return;
    sistLyd[navn] = naa;
    LYD.spill(navn, ...arg);
  }

  function regnUt() {
    const g = PROFIL.gunst, p = S.gaver, h = S.helt;
    S.st = {
      skade: (1 + 0.1 * (p.styrke || 0)) * (1 + 0.05 * (g.styrke || 0)) * (h === "akilles" ? 1.1 : 1),
      fart: 150 * (1 + 0.08 * (p.sandaler || 0)) * (1 + 0.03 * (g.fart || 0)) * (h === "atalanta" ? 1.12 : 1),
      omrade: (1 + 0.1 * (p.omrade || 0)) * (h === "orfeus" ? 1.15 : 1),
      cd: Math.pow(0.93, p.esse || 0),
      magnet: 60 * (1 + 0.25 * (p.laurbar || 0)) * (1 + 0.1 * (g.magnet || 0)),
      xp: (1 + 0.08 * (p.laurbar || 0)) * (1 + 0.05 * (g.visdom || 0)) * (h === "odyssevs" ? 1.15 : 1),
      maksLiv: 100 + 20 * (p.ambrosia || 0) + 10 * (g.liv || 0),
      regen: 0.4 * (p.ambrosia || 0),
    };
  }

  function nyTilstand(helt, meny) {
    S = {
      meny, helt, t: 0, x: 0, y: 0, fx: 1, fy: 0, gaar: false, hp: 100, niva: 1, xp: 0, behov: behov(1), drap: 0, poeng: 0, drakmer: 0,
      vapen: {}, gaver: {}, fiender: [], skudd: [], fskudd: [], soner: [], kast: [], perler: [], ting: [], eff: [], tallene: [],
      gyt: 0, bossNr: 0, svermNr: 0, boss: null, usarbar: 0, rist: 0, blink: 0, kombo: 0, komboT: 0, lyre2: 0,
      fjaer: !!PROFIL.gunst.fjaer, valgKo: [], valg: null, pause: false, slutt: false, beskjed: null,
    };
    regnUt();
    S.hp = S.st.maksLiv;
    S.vapen[HELTER[helt].vapen] = { l: 1, cd: 0.4, v: 0 };
    S.omkast = PROFIL.gunst.orakel || 0;
    if (PROFIL.gunst.arsenal && !meny) { const andre = Object.keys(VAPEN).filter((id) => !S.vapen[id]); S.vapen[andre[Math.floor(Math.random() * andre.length)]] = { l: 1, cd: 0.8, v: 0 }; }
  }
  function nyttTokt() {
    nyTilstand(valgtHelt, false);
    lag.hidden = true; lag.innerHTML = "";
    visBeskjed("Hold ut til daggry");
    lerret.focus({ preventScroll: true });
  }
  const visBeskjed = (tekst) => { S.beskjed = { tekst, t: 2.6 }; };

  // ---------- Fiender ----------
  function lagFiende(type, x, y) {
    const def = FIENDER[type], hp = def.boss ? def.hp : def.hp * hpFaktor(S.t / 60);
    const e = { id: nid++, type, def, x, y, hp, maks: hp, r: def.r, fart: def.fart * tilf(0.92, 1.08), t: tilf(0, 10), flash: 0, kx: 0, ky: 0, acd: 0, fase: 0, tt: tilf(2, 4), ang: 0, dod: false };
    S.fiender.push(e);
    return e;
  }
  const gyteradius = () => Math.hypot(vW, vH) / 2 + 50;
  function gytVedKanten(type, v) {
    const a = v === undefined ? tilf(0, TAU) : v, r = gyteradius();
    return lagFiende(type, S.x + Math.cos(a) * r, S.y + Math.sin(a) * r);
  }
  function gyt(dt) {
    const t = S.t;
    S.gyt += takt(t) * dt;
    while (S.gyt >= 1) {
      S.gyt -= 1;
      if (S.fiender.length >= tak(t)) continue;
      const v = vekter(t / 60);
      let sum = 0; for (const k in v) sum += v[k];
      let r = Math.random() * sum, type = "skygge";
      for (const k in v) { r -= v[k]; if (r <= 0) { type = k; break; } }
      gytVedKanten(type);
    }
    if (S.bossNr < BOSSER.length && t >= BOSSER[S.bossNr][0]) {
      const e = gytVedKanten(BOSSER[S.bossNr][1]);
      S.boss = e; S.bossNr += 1;
      visBeskjed(`${e.def.boss} nærmer seg`);
      lyd("brutus", 1);
    }
    if (S.svermNr < SVERMER.length && t >= SVERMER[S.svermNr][0]) {
      const [, type, n] = SVERMER[S.svermNr];
      for (let i = 0; i < n; i++) gytVedKanten(type, (i / n) * TAU);
      S.svermNr += 1;
      visBeskjed("En sverm lukker seg rundt deg");
    }
  }

  function fiendeskudd(x, y, vx, vy, r, skade, farge) { S.fskudd.push({ x, y, vx, vy, r, skade, farge, liv: 6 }); }

  function oppdaterFiender(dt) {
    const F = S.fiender, m = S.t / 60, grense = gyteradius() * 1.7;
    for (const e of F) {
      const dx = S.x - e.x, dy = S.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      let vx = ux * e.fart, vy = uy * e.fart;
      e.t += dt; e.flash -= dt; e.acd -= dt; e.ang = Math.atan2(uy, ux);
      if (e.type === "harpy") { const s = Math.sin(e.t * 5) * 0.9; vx += -uy * e.fart * s; vy += ux * e.fart * s; }
      else if (e.type === "kentaur" || e.type === "kerberos") {
        // Stormløp: stopp opp, sikt og storm rett fram
        e.tt -= dt;
        if (e.fase === 0 && e.tt <= 0 && d < 420) {
          e.fase = 1; e.tt = 0.55; e.sx = ux; e.sy = uy;
          if (e.type === "kerberos") for (const o of [-0.35, 0, 0.35]) { const a = e.ang + o; fiendeskudd(e.x, e.y, Math.cos(a) * 190, Math.sin(a) * 190, 9, 14, "#f08a4b"); }
        } else if (e.fase === 1) { vx = vy = 0; if (e.tt <= 0) { e.fase = 2; e.tt = 0.7; } }
        else if (e.fase === 2) { vx = e.sx * e.fart * 3.6; vy = e.sy * e.fart * 3.6; if (e.tt <= 0) { e.fase = 0; e.tt = e.type === "kerberos" ? 2.2 : 3.6; } }
      } else if (e.type === "gorgon") {
        if (d < 250) { vx = -uy * e.fart * 0.7; vy = ux * e.fart * 0.7; }
        e.tt -= dt;
        if (e.tt <= 0 && d < 420) { e.tt = 2.8; fiendeskudd(e.x, e.y, ux * 150, uy * 150, 6, 9, "#9ad15a"); }
      } else if (e.type === "kyklop") {
        e.tt -= dt;
        if (e.tt <= 0) { e.tt = 3.4; fiendeskudd(e.x, e.y, ux * 200, uy * 200, 14, 20, "#9a917b"); }
      } else if (e.type === "kronos") {
        e.tt -= dt;
        if (e.tt <= 0) {
          e.tt = 3; e.fase += 1;
          for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + e.fase * 0.26; fiendeskudd(e.x, e.y, Math.cos(a) * 140, Math.sin(a) * 140, 8, 14, "#b07cf0"); }
          if (e.fase % 2 === 0) for (let i = 0; i < 6; i++) lagFiende("skygge", e.x + tilf(-60, 60), e.y + tilf(-60, 60));
        }
      }
      e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
      const brems = Math.max(0, 1 - 7 * dt); e.kx *= brems; e.ky *= brems;
      if (d < e.r + 11) skadHelt(e.def.skade * (1 + m * 0.05));
      else if (d > grense && !e.def.boss) { const a = tilf(0, TAU), r = gyteradius(); e.x = S.x + Math.cos(a) * r; e.y = S.y + Math.sin(a) * r; }
    }
    // Fiendene skyver hverandre unna, så de ikke står oppå hverandre
    for (let i = 0, n = F.length; i < n; i++) {
      const a = F[i];
      for (let j = i + 1; j < n; j++) {
        const b = F[j], dx = b.x - a.x;
        if (dx > 90 || dx < -90) continue;
        const dy = b.y - a.y;
        if (dy > 90 || dy < -90) continue;
        const rr = a.r + b.r, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 0.01) { const d = Math.sqrt(d2), o = ((rr - d) / d) * 0.25; a.x -= dx * o; a.y -= dy * o; b.x += dx * o; b.y += dy * o; }
      }
    }
  }

  function naermest(x, y, maks, unntak) {
    let best = null, bd = maks * maks;
    for (const e of S.fiender) {
      if (e.dod || (unntak && unntak.has(e.id))) continue;
      const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function skad(e, skade, kraft, fx, fy, stille) {
    if (e.dod) return;
    skade *= S.st.skade;
    e.hp -= skade; e.flash = 0.09;
    if (kraft) { const k = e.def.boss ? kraft * 0.08 : kraft; e.kx += fx * k; e.ky += fy * k; }
    if (!stille && S.tallene.length < 50) S.tallene.push({ x: e.x + tilf(-6, 6), y: e.y - e.r, v: Math.round(skade), t: 0.6 });
    if (e.hp <= 0) drep(e);
  }
  function drep(e) {
    e.dod = true; S.drap += 1; S.poeng += e.def.poeng;
    slippSjel(e.x, e.y, e.def.xp);
    const r = Math.random();
    if (r < 0.05) S.ting.push({ type: "mynt", x: e.x + tilf(-8, 8), y: e.y + tilf(-8, 8) });
    else if (r < 0.057) S.ting.push({ type: "vin", x: e.x, y: e.y });
    else if (r < 0.0585) S.ting.push({ type: "magnet", x: e.x, y: e.y });
    if (S.eff.length < 160) for (let i = 0; i < (e.def.boss ? 26 : 4); i++) { const a = tilf(0, TAU), f = tilf(40, e.def.boss ? 260 : 140); S.eff.push({ type: "gnist", x: e.x, y: e.y, vx: Math.cos(a) * f, vy: Math.sin(a) * f, t: 0.45, T: 0.45, farge: e.def.boss ? "#e2c174" : "#6b5a86" }); }
    if (e.def.boss) {
      S.ting.push({ type: "kiste", x: e.x, y: e.y });
      for (let i = 0; i < 8; i++) S.ting.push({ type: "mynt", x: e.x + tilf(-50, 50), y: e.y + tilf(-50, 50) });
      if (S.boss === e) S.boss = null;
      S.rist = 12;
      visBeskjed(`${e.def.boss} er felt`);
      lyd("kollega", 0.1);
    } else lyd("felt", 0.06);
  }
  function slippSjel(x, y, v) {
    if (S.perler.length > 340) { const p = S.perler[Math.floor(Math.random() * S.perler.length)]; p.v += v; return; }
    S.perler.push({ x: x + tilf(-5, 5), y: y + tilf(-5, 5), v, dratt: false });
  }

  function skadHelt(skade) {
    if (S.usarbar > 0 || S.slutt) return;
    S.hp -= skade * (1 - 0.04 * (PROFIL.gunst.rustning || 0)); S.usarbar = 0.45; S.rist = 7;
    lyd("stikk", 0.1);
    if (S.hp > 0) return;
    if (S.fjaer) {
      S.fjaer = false; S.hp = S.st.maksLiv * 0.5; S.usarbar = 2.5;
      for (const e of S.fiender) { const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1; if (d < 260) { e.kx += (dx / d) * 900; e.ky += (dy / d) * 900; if (!e.def.boss) skad(e, 40, 0, 0, 0, true); } }
      S.eff.push({ type: "ring", x: S.x, y: S.y, r: 260, t: 0.6, T: 0.6, farge: "#f2c14e" });
      visBeskjed("Føniksfjæren reiser deg");
      lyd("kiste", 0.1);
    } else avslutt(false);
  }

  // ---------- Våpen ----------
  function oppdaterVapen(dt) {
    const st = S.st;
    for (const id in S.vapen) {
      const w = S.vapen[id], p = VAPEN[id].p(w.l);
      w.cd -= dt;
      if (id === "aegis") {
        w.v += p.fart * dt;
        const r = p.r * st.omrade;
        for (let i = 0; i < p.ant; i++) {
          const a = w.v + (i / p.ant) * TAU, ox = S.x + Math.cos(a) * r, oy = S.y + Math.sin(a) * r;
          for (const e of S.fiender) {
            if (e.dod || e.acd > 0) continue;
            const dx = e.x - ox, dy = e.y - oy, rr = e.r + 13;
            if (dx * dx + dy * dy < rr * rr) { e.acd = 0.45; const d = Math.hypot(e.x - S.x, e.y - S.y) || 1; skad(e, p.skade, 160, (e.x - S.x) / d, (e.y - S.y) / d); }
          }
        }
        continue;
      }
      if (w.cd > 0) continue;
      if (id === "spyd") {
        const mal = naermest(S.x, S.y, 520);
        if (!mal) { w.cd = 0.15; continue; }
        const a0 = Math.atan2(mal.y - S.y, mal.x - S.x);
        for (let i = 0; i < p.ant; i++) { const a = a0 + (i - (p.ant - 1) / 2) * 0.16; S.skudd.push({ type: "spyd", x: S.x, y: S.y, vx: Math.cos(a) * 540, vy: Math.sin(a) * 540, r: 7, skade: p.skade, igjen: p.gjennom + 1, liv: 1.1, truffet: new Set() }); }
        lyd("sidesteg", 0.25);
      } else if (id === "diskos") {
        const brukt = new Set();
        for (let i = 0; i < p.ant; i++) {
          const mal = naermest(S.x, S.y, 460, brukt);
          if (!mal) break;
          brukt.add(mal.id);
          const a = Math.atan2(mal.y - S.y, mal.x - S.x);
          S.skudd.push({ type: "diskos", x: S.x, y: S.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, r: 9, skade: p.skade, igjen: p.sprett + 1, liv: 2.2, truffet: new Set() });
        }
        if (!brukt.size) { w.cd = 0.15; continue; }
      } else if (id === "lyn") {
        const synlige = S.fiender.filter((e) => !e.dod && Math.abs(e.x - S.x) < vW / 2 && Math.abs(e.y - S.y) < vH / 2);
        if (!synlige.length) { w.cd = 0.2; continue; }
        const r = p.r * st.omrade;
        for (let i = 0; i < p.ant; i++) {
          const mal = synlige[Math.floor(Math.random() * synlige.length)];
          for (const e of S.fiender) { const dx = e.x - mal.x, dy = e.y - mal.y; if (dx * dx + dy * dy < (r + e.r) * (r + e.r)) skad(e, p.skade, 0, 0, 0); }
          S.eff.push({ type: "lyn", x: mal.x, y: mal.y, r, t: 0.22, T: 0.22, fro: Math.random() * 1000 });
        }
        S.blink = 0.12;
        lyd("lyn", 0.15);
      } else if (id === "ild") {
        for (let i = 0; i < p.ant; i++) {
          const naer = S.fiender.filter((e) => !e.dod && Math.hypot(e.x - S.x, e.y - S.y) < 330);
          const mal = naer.length ? naer[Math.floor(Math.random() * naer.length)] : { x: S.x + tilf(-130, 130), y: S.y + tilf(-130, 130) };
          S.kast.push({ x0: S.x, y0: S.y, x1: mal.x, y1: mal.y, t: 0, T: 0.45, r: p.r * st.omrade, skade: p.skade, var: p.var });
        }
      } else if (id === "lyre") {
        lyrePuls(p.r * st.omrade, p.skade);
        if (p.dobbel) S.lyre2 = 0.3;
      }
      w.cd = p.cd * st.cd;
    }
    if (S.lyre2 > 0) { S.lyre2 -= dt; if (S.lyre2 <= 0 && S.vapen.lyre) { const p = VAPEN.lyre.p(S.vapen.lyre.l); lyrePuls(p.r * S.st.omrade * 1.3, p.skade * 0.6); } }
  }
  function lyrePuls(r, skade) {
    for (const e of S.fiender) { const dx = e.x - S.x, dy = e.y - S.y, d = Math.hypot(dx, dy) || 1; if (d < r + e.r) skad(e, skade, 260, dx / d, dy / d); }
    S.eff.push({ type: "ring", x: S.x, y: S.y, r, t: 0.35, T: 0.35, farge: "#c9a4f0", folg: true });
    lyd("puls", 0.2);
  }

  function oppdaterSkudd(dt) {
    for (const s of S.skudd) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.liv -= dt;
      for (const e of S.fiender) {
        if (e.dod || s.truffet.has(e.id)) continue;
        const dx = e.x - s.x, dy = e.y - s.y, rr = e.r + s.r;
        if (dx * dx + dy * dy > rr * rr) continue;
        const f = Math.hypot(s.vx, s.vy) || 1;
        skad(e, s.skade, 120, s.vx / f, s.vy / f);
        s.truffet.add(e.id); s.igjen -= 1;
        if (s.igjen <= 0) { s.liv = 0; break; }
        if (s.type === "diskos") {
          const neste = naermest(s.x, s.y, 300, s.truffet);
          if (!neste) { s.liv = Math.min(s.liv, 0.25); break; }
          const a = Math.atan2(neste.y - s.y, neste.x - s.x); s.vx = Math.cos(a) * 400; s.vy = Math.sin(a) * 400; s.liv = Math.max(s.liv, 0.9);
          break;
        }
      }
    }
    for (const s of S.fskudd) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.liv -= dt;
      const dx = S.x - s.x, dy = S.y - s.y;
      if (dx * dx + dy * dy < (s.r + 10) * (s.r + 10)) { skadHelt(s.skade); s.liv = 0; }
    }
    for (const k of S.kast) {
      k.t += dt;
      if (k.t >= k.T) { S.soner.push({ x: k.x1, y: k.y1, r: k.r, skade: k.skade, liv: k.var, tikk: 0 }); k.ferdig = true; lyd("ild", 0.2); }
    }
    for (const z of S.soner) {
      z.liv -= dt; z.tikk -= dt;
      if (z.tikk > 0) continue;
      z.tikk = 0.25;
      for (const e of S.fiender) { const dx = e.x - z.x, dy = e.y - z.y; if (dx * dx + dy * dy < (z.r + e.r) * (z.r + e.r)) skad(e, z.skade * 0.25, 0, 0, 0, true); }
    }
  }

  // ---------- Sjeler og ting på bakken ----------
  function oppdaterTing(dt) {
    const m2 = S.st.magnet * S.st.magnet;
    for (const p of S.perler) {
      const dx = S.x - p.x, dy = S.y - p.y, d2 = dx * dx + dy * dy;
      if (!p.dratt && d2 < m2) p.dratt = true;
      if (p.dratt) {
        const d = Math.sqrt(d2) || 1, f = 420 + (p.t = (p.t || 0) + dt) * 500;
        p.x += (dx / d) * f * dt; p.y += (dy / d) * f * dt;
        if (d < 16) {
          p.tatt = true; S.xp += p.v * S.st.xp;
          S.kombo = S.komboT > 0 ? S.kombo + 1 : 0; S.komboT = 0.5;
          lyd("perle", 0.04, S.kombo);
        }
      }
    }
    for (const g of S.ting) {
      const dx = S.x - g.x, dy = S.y - g.y, d2 = dx * dx + dy * dy;
      if (g.type !== "kiste" && d2 < m2 * 0.6) { const d = Math.sqrt(d2) || 1; g.x += (dx / d) * 300 * dt; g.y += (dy / d) * 300 * dt; }
      if (d2 > 22 * 22) continue;
      g.tatt = true;
      if (g.type === "mynt") { S.drakmer += 1; lyd("mynt", 0.08); }
      else if (g.type === "vin") { S.hp = Math.min(S.st.maksLiv, S.hp + 30); S.eff.push({ type: "ring", x: S.x, y: S.y, r: 40, t: 0.4, T: 0.4, farge: "#b0507a", folg: true }); lyd("klar", 0.1); }
      else if (g.type === "magnet") { for (const p of S.perler) p.dratt = true; lyd("klar", 0.1); }
      else if (g.type === "kiste") { S.drakmer += 20; S.valgKo.push("kiste"); lyd("kiste", 0.1); }
    }
    while (S.xp >= S.behov) { S.xp -= S.behov; S.niva += 1; S.behov = behov(S.niva); S.valgKo.push("niva"); }
  }

  // ---------- Valg ved nytt nivå ----------
  function muligheter() {
    const ut = [], nv = Object.keys(S.vapen).length, ng = Object.keys(S.gaver).length;
    for (const id in VAPEN) {
      const l = S.vapen[id] ? S.vapen[id].l : 0;
      if (l > 0 && l < MAKS_VAPEN) ut.push({ type: "vapen", id, l: l + 1, vekt: 3 });
      else if (l === 0 && nv < VAPENPLASSER) ut.push({ type: "vapen", id, l: 1, vekt: 2 });
    }
    for (const id in GAVER) {
      const l = S.gaver[id] || 0;
      if (l > 0 && l < MAKS_GAVE) ut.push({ type: "gave", id, l: l + 1, vekt: 2.5 });
      else if (l === 0 && ng < GAVEPLASSER) ut.push({ type: "gave", id, l: 1, vekt: 2 });
    }
    return ut;
  }
  function trekk(n) {
    const pool = muligheter(), ut = [];
    while (ut.length < n && pool.length) {
      let r = Math.random() * pool.reduce((s, v) => s + v.vekt, 0), i = 0;
      for (; i < pool.length - 1; i++) { r -= pool[i].vekt; if (r <= 0) break; }
      ut.push(pool.splice(i, 1)[0]);
    }
    for (const reserve of [{ type: "vin" }, { type: "drakmer" }]) if (ut.length < n) ut.push(reserve);
    return ut;
  }
  function bruk(v) {
    if (v.type === "vapen") { if (S.vapen[v.id]) S.vapen[v.id].l += 1; else S.vapen[v.id] = { l: 1, cd: 0.3, v: 0 }; }
    else if (v.type === "gave") { S.gaver[v.id] = (S.gaver[v.id] || 0) + 1; regnUt(); if (v.id === "ambrosia") S.hp = Math.min(S.st.maksLiv, S.hp + 20); }
    else if (v.type === "vin") S.hp = Math.min(S.st.maksLiv, S.hp + 40);
    else S.drakmer += 15;
  }
  const merke = (d, liten) => `<span class="ta-merke${liten ? " liten" : ""}" style="border-color:${d.farge};color:${d.farge}">${d.tegn}</span>`;
  function kort(v, i) {
    let d, tittel, under, tekst;
    if (v.type === "vapen") { d = VAPEN[v.id]; tittel = d.navn; under = v.l === 1 ? "Nytt våpen" : `Nivå ${v.l}`; tekst = d.tekst[v.l - 1]; }
    else if (v.type === "gave") { d = GAVER[v.id]; tittel = d.navn; under = v.l === 1 ? "Ny gudegave" : `Nivå ${v.l}`; tekst = d.tekst; }
    else if (v.type === "vin") { d = { tegn: "V", farge: "#b0507a" }; tittel = "Et beger vin"; under = "Styrkedrikk"; tekst = "+40 liv"; }
    else { d = { tegn: "Δ", farge: "#e2c174" }; tittel = "En pung drakmer"; under = "Til leiren"; tekst = "+15 drakmer"; }
    return `<button type="button" class="ta-kort" data-valg="${i}"><span class="ta-nr">${i + 1}</span>${merke(d)}<span class="ta-korttekst"><strong>${tittel}</strong><em>${under}</em><span>${tekst}</span></span></button>`;
  }
  function visValg() {
    S.pause = true;
    S.valg = trekk(3);
    tegnValg();
    if (S.valgKo[0] !== "kiste") lyd("niva", 0.2);
  }
  function tegnValg() {
    const kiste = S.valgKo[0] === "kiste";
    lag.className = "ta-lag ta-valg";
    lag.innerHTML = `<p class="overline">${kiste ? "Skattekiste" : `Nivå ${S.niva - S.valgKo.filter((k) => k === "niva").length + (kiste ? 0 : 1)}`}</p><h2>${kiste ? "Gudene belønner deg" : "Velg en gave"}</h2><div class="ta-kortliste">${S.valg.map(kort).join("")}</div>${S.omkast > 0 ? `<button type="button" class="liten-knapp" data-omkast>Spør orakelet om nye kort (${S.omkast} igjen) · R</button>` : ""}`;
    lag.hidden = false;
  }
  function omkast() {
    if (!S || !S.valg || S.omkast <= 0) return;
    S.omkast -= 1; S.valg = trekk(3); tegnValg(); lyd("klar", 0.1);
  }
  function taValg(i) {
    if (!S || !S.valg || !S.valg[i]) return;
    bruk(S.valg[i]);
    S.valg = null; S.valgKo.shift();
    lag.hidden = true; lag.innerHTML = "";
    S.pause = false; S.usarbar = Math.max(S.usarbar, 0.6);
  }

  // ---------- Hovedløkka ----------
  function oppdater(dt) {
    if (!S) return;
    if (S.meny) { S.t += dt; S.x += 16 * dt; return; }
    if (S.pause || S.slutt) return;
    if (S.valgKo.length) return visValg();
    S.t += dt;
    // Helten
    let mx = (taster.hoyre ? 1 : 0) - (taster.venstre ? 1 : 0), my = (taster.ned ? 1 : 0) - (taster.opp ? 1 : 0);
    if (styr) { const dx = styr.x - styr.x0, dy = styr.y - styr.y0, d = Math.hypot(dx, dy); if (d > 6) { const k = Math.min(1, d / 40) / d; mx = dx * k; my = dy * k; } }
    const ml = Math.hypot(mx, my);
    S.gaar = ml > 0.05;
    if (S.gaar) { const k = ml > 1 ? 1 / ml : 1; S.x += mx * k * S.st.fart * dt; S.y += my * k * S.st.fart * dt; S.fx = mx / ml; S.fy = my / ml; }
    S.hp = Math.min(S.st.maksLiv, S.hp + S.st.regen * dt);
    S.usarbar -= dt; S.rist = Math.max(0, S.rist - 30 * dt); S.blink -= dt; S.komboT -= dt;
    if (S.beskjed && (S.beskjed.t -= dt) <= 0) S.beskjed = null;

    gyt(dt);
    oppdaterVapen(dt);
    oppdaterFiender(dt);
    oppdaterSkudd(dt);
    oppdaterTing(dt);
    for (const e of S.eff) { e.t -= dt; if (e.vx !== undefined) { e.x += e.vx * dt; e.y += e.vy * dt; } }
    for (const n of S.tallene) { n.t -= dt; n.y -= 30 * dt; }

    if (S.fiender.some((e) => e.dod)) S.fiender = S.fiender.filter((e) => !e.dod);
    S.skudd = S.skudd.filter((s) => s.liv > 0);
    S.fskudd = S.fskudd.filter((s) => s.liv > 0);
    S.kast = S.kast.filter((k) => !k.ferdig);
    S.soner = S.soner.filter((z) => z.liv > 0);
    S.perler = S.perler.filter((p) => !p.tatt);
    S.ting = S.ting.filter((g) => !g.tatt);
    S.eff = S.eff.filter((e) => e.t > 0);
    S.tallene = S.tallene.filter((n) => n.t > 0);
    if (S.t >= SEIERSTID && !S.slutt) avslutt(true);
  }

  // ---------- Tegning ----------
  const sirkel = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
  function tegnBakke() {
    const C = 96, x0 = Math.floor((S.x - vW / 2) / C), x1 = Math.floor((S.x + vW / 2) / C), y0 = Math.floor((S.y - vH / 2) / C), y1 = Math.floor((S.y + vH / 2) / C);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const h = ((gx * 73856093) ^ (gy * 19349663)) >>> 0, x = gx * C, y = gy * C;
      ctx.fillStyle = ["#191712", "#1b1914", "#17150f", "#1d1a14"][h % 4];
      ctx.fillRect(x, y, C + 0.5, C + 0.5);
      const v = h % 23, cx = x + 20 + ((h >> 5) % 56), cy = y + 20 + ((h >> 11) % 56);
      if (v === 0) { ctx.fillStyle = "#2c2920"; sirkel(cx, cy, 17); ctx.fill(); ctx.fillStyle = "#3a362a"; sirkel(cx, cy, 12); ctx.fill(); ctx.strokeStyle = "#221f18"; ctx.lineWidth = 1.5; sirkel(cx, cy, 7); ctx.stroke(); }
      else if (v === 1 || v === 2) { ctx.strokeStyle = "#0f0e0b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 18, cy - 6); ctx.lineTo(cx - 4, cy + 2); ctx.lineTo(cx + 3, cy - 5); ctx.lineTo(cx + 19, cy + 6); ctx.stroke(); }
      else if (v === 3) { ctx.strokeStyle = "#57503c"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx - 9, cy - 3); ctx.lineTo(cx + 9, cy + 3); ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx + 7, cy - 6); ctx.stroke(); ctx.lineCap = "butt"; }
      else if (v === 4) { ctx.strokeStyle = "rgba(201,162,74,.13)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 14, cy + 14); ctx.lineTo(cx - 14, cy - 14); ctx.lineTo(cx + 14, cy - 14); ctx.lineTo(cx + 14, cy + 7); ctx.lineTo(cx - 6, cy + 7); ctx.lineTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy - 6); ctx.stroke(); }
    }
    ctx.strokeStyle = "rgba(201,162,74,.045)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = x0; gx <= x1 + 1; gx++) { ctx.moveTo(gx * C, y0 * C); ctx.lineTo(gx * C, (y1 + 1) * C); }
    for (let gy = y0; gy <= y1 + 1; gy++) { ctx.moveTo(x0 * C, gy * C); ctx.lineTo((x1 + 1) * C, gy * C); }
    ctx.stroke();
  }

  function tegnFiende(e) {
    const r = e.r, hvit = e.flash > 0, f = (farge) => (hvit ? "#ffffff" : farge);
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.7, r * 0.9, r * 0.35, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(e.x, e.y);
    const t = e.t;
    if (e.type === "skygge") {
      ctx.fillStyle = f("#4a3a66"); ctx.beginPath(); ctx.arc(0, -2, r, Math.PI, 0);
      for (let i = 0; i <= 4; i++) ctx.lineTo(r - (i * r) / 2, r * 0.7 + (i % 2 ? -4 : 3) + Math.sin(t * 6 + i) * 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e2c174"; ctx.fillRect(-5, -5, 3, 4); ctx.fillRect(2, -5, 3, 4);
    } else if (e.type === "skjelett") {
      ctx.fillStyle = f("#8f8872"); ctx.fillRect(-5, 0, 10, r);
      ctx.fillStyle = f("#e8e0cc"); sirkel(0, -3, r * 0.78); ctx.fill();
      ctx.fillStyle = "#17150f"; ctx.fillRect(-5, -6, 3.5, 4.5); ctx.fillRect(1.5, -6, 3.5, 4.5); ctx.fillRect(-3, 2, 6, 1.5);
      ctx.strokeStyle = "#17150f"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(5, 6); ctx.moveTo(-5, 9); ctx.lineTo(5, 9); ctx.stroke();
    } else if (e.type === "harpy") {
      const v = Math.sin(t * 16) * 0.6;
      ctx.fillStyle = f("#2f7d7a");
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 3, -2); ctx.lineTo(s * (r + 9), -8 - v * 9); ctx.lineTo(s * (r + 4), 5 - v * 3); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = f("#3fa39f"); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.85, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#e2c174"; ctx.beginPath(); ctx.moveTo(-2.5, 1); ctx.lineTo(2.5, 1); ctx.lineTo(0, 6); ctx.fill();
      ctx.fillStyle = "#17150f"; ctx.fillRect(-4, -4, 2.5, 2.5); ctx.fillRect(1.5, -4, 2.5, 2.5);
    } else if (e.type === "kentaur") {
      if (e.fase === 1) ctx.translate(tilf(-1.5, 1.5), 0);
      ctx.rotate(e.fase === 2 ? Math.atan2(e.sy, e.sx) : e.ang);
      ctx.fillStyle = f(e.fase === 1 ? "#a8452a" : "#6b4423"); ctx.beginPath(); ctx.ellipse(-4, 0, r * 1.15, r * 0.7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = f("#d19f76"); sirkel(r * 0.7, 0, r * 0.52); ctx.fill();
      ctx.fillStyle = "#2a1a0e"; sirkel(r * 0.7, 0, r * 0.3); ctx.fill();
    } else if (e.type === "gorgon") {
      ctx.strokeStyle = f("#7fb04f"); ctx.lineWidth = 2.5; ctx.lineCap = "round";
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI, w = Math.sin(t * 5 + i) * 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7 - 2); ctx.quadraticCurveTo(Math.cos(a) * (r + 3) + w, Math.sin(a) * (r + 3), Math.cos(a) * (r + 8), Math.sin(a) * (r + 8) - 2 + w); ctx.stroke(); }
      ctx.lineCap = "butt";
      ctx.fillStyle = f("#4f7a3a"); sirkel(0, 0, r); ctx.fill();
      ctx.fillStyle = "#f2e36a"; ctx.fillRect(-6, -3, 4, 3); ctx.fillRect(2, -3, 4, 3);
      ctx.fillStyle = "#24381a"; ctx.fillRect(-3, 5, 6, 1.5);
    } else if (e.type === "minotaur") {
      ctx.strokeStyle = f("#ece4d2"); ctx.lineWidth = 4; ctx.lineCap = "round";
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.6, -r * 0.5); ctx.quadraticCurveTo(s * (r + 6), -r * 0.6, s * (r + 3), -r - 6); ctx.stroke(); }
      ctx.lineCap = "butt";
      ctx.fillStyle = f("#5a2a22"); sirkel(0, 0, r); ctx.fill();
      ctx.fillStyle = f("#7a3a2e"); ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.55, r * 0.4, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 2; sirkel(0, r * 0.55, 4); ctx.stroke();
      ctx.fillStyle = "#ff5a3a"; ctx.fillRect(-9, -6, 5, 4); ctx.fillRect(4, -6, 5, 4);
    } else if (e.type === "kyklop") {
      ctx.fillStyle = f("#8a6a4a"); sirkel(0, 0, r); ctx.fill();
      ctx.fillStyle = f("#a07f5c"); sirkel(-4, -5, r * 0.82); ctx.fill();
      ctx.fillStyle = "#f5efe0"; sirkel(0, -6, 14); ctx.fill();
      ctx.fillStyle = "#3a2410"; sirkel(Math.cos(e.ang) * 6, -6 + Math.sin(e.ang) * 5, 6.5); ctx.fill();
      ctx.strokeStyle = "#3a2410"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-13, 17); ctx.quadraticCurveTo(0, 22, 13, 17); ctx.stroke();
      ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-16, -22); ctx.lineTo(16, -24); ctx.stroke();
    } else if (e.type === "kerberos") {
      if (e.fase === 1) ctx.translate(tilf(-2, 2), 0);
      ctx.rotate(e.fase === 2 ? Math.atan2(e.sy, e.sx) : e.ang);
      ctx.fillStyle = f("#2a2224"); ctx.beginPath(); ctx.ellipse(-8, 0, r * 0.95, r * 0.72, 0, 0, TAU); ctx.fill();
      for (const o of [-1, 0, 1]) {
        const hx = r * 0.62 + (o === 0 ? 9 : 0), hy = o * r * 0.62;
        ctx.fillStyle = f(e.fase === 1 ? "#7a2a22" : "#3a2f32"); sirkel(hx, hy, 13); ctx.fill();
        ctx.fillStyle = "#ff4a2a"; ctx.fillRect(hx + 3, hy - 6, 4, 3); ctx.fillRect(hx + 3, hy + 3, 4, 3);
        ctx.fillStyle = "#ece4d2"; ctx.fillRect(hx + 10, hy - 2, 4, 4);
      }
    } else if (e.type === "kronos") {
      ctx.fillStyle = "rgba(176,124,240,.16)"; sirkel(0, 0, r + 14 + Math.sin(t * 3) * 4); ctx.fill();
      ctx.fillStyle = f("#2b2433"); sirkel(0, 0, r); ctx.fill();
      ctx.fillStyle = "#c9a24a"; ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const x = -24 + i * 8; ctx.lineTo(x, i % 2 ? -r - 14 : -r + 4); }
      ctx.lineTo(24, -r + 12); ctx.lineTo(-24, -r + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d9b3ff"; ctx.fillRect(-16, -10, 10, 6); ctx.fillRect(6, -10, 10, 6);
      ctx.strokeStyle = "#8f8a9c"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, r + 16, t * 1.6, t * 1.6 + 1.5); ctx.stroke();
      ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 1.6) * (r + 16), Math.sin(t * 1.6) * (r + 16)); ctx.stroke();
    }
    ctx.restore();
  }

  function tegnHelt(t) {
    const h = HELTER[S.helt], bob = S.gaar ? Math.sin(t * 15) * 1.5 : 0;
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(S.x, S.y + 9, 13, 5, 0, 0, TAU); ctx.fill();
    if (S.usarbar > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.45;
    ctx.save(); ctx.translate(S.x, S.y + bob); ctx.rotate(Math.atan2(S.fy, S.fx));
    ctx.strokeStyle = "#8a6a45"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-9, 10); ctx.lineTo(19, 10); ctx.stroke();
    ctx.fillStyle = "#d8d2c2"; ctx.beginPath(); ctx.moveTo(19, 7); ctx.lineTo(27, 10); ctx.lineTo(19, 13); ctx.fill();
    ctx.fillStyle = h.farge; ctx.beginPath(); ctx.ellipse(-5, 0, 9, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#b08d57"; sirkel(0, 0, 10.5); ctx.fill();
    ctx.fillStyle = "#c9a24a"; sirkel(2, -9, 8.5); ctx.fill();
    ctx.strokeStyle = "#8a6f33"; ctx.lineWidth = 1.5; sirkel(2, -9, 8.5); ctx.stroke();
    ctx.fillStyle = h.farge; sirkel(2, -9, 3); ctx.fill();
    ctx.fillStyle = "#e2c174"; sirkel(1, 0, 6.5); ctx.fill();
    ctx.fillStyle = h.farge; ctx.fillRect(-8, -1.8, 14, 3.6);
    ctx.restore(); ctx.globalAlpha = 1;
    // Livslinje under helten
    const b = 34, a = Math.max(0, S.hp / S.st.maksLiv);
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(S.x - b / 2 - 1, S.y + 19, b + 2, 6);
    ctx.fillStyle = a > 0.35 ? "#b5282a" : "#ff5a3a"; ctx.fillRect(S.x - b / 2, S.y + 20, b * a, 4);
  }

  function tegnVerden(t) {
    tegnBakke();
    ctx.globalCompositeOperation = "lighter";
    for (const z of S.soner) {
      const g = ctx.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r), a = Math.min(1, z.liv * 2) * (0.75 + Math.sin(t * 18 + z.x) * 0.12);
      g.addColorStop(0, `rgba(255,190,90,${0.55 * a})`); g.addColorStop(0.6, `rgba(240,110,40,${0.35 * a})`); g.addColorStop(1, "rgba(240,90,30,0)");
      ctx.fillStyle = g; sirkel(z.x, z.y, z.r); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    for (const p of S.perler) {
      ctx.fillStyle = p.v < 3 ? "#6fc3c9" : p.v < 10 ? "#e2c174" : "#c77dff";
      const r = p.v < 3 ? 3.5 : p.v < 10 ? 4.5 : 6;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - r - 1); ctx.lineTo(p.x + r, p.y); ctx.lineTo(p.x, p.y + r + 1); ctx.lineTo(p.x - r, p.y); ctx.fill();
    }
    for (const g of S.ting) {
      const o = Math.sin(t * 5 + g.x) * 2;
      if (g.type === "mynt") { ctx.fillStyle = "#e2c174"; sirkel(g.x, g.y + o, 5); ctx.fill(); ctx.strokeStyle = "#8a6f33"; ctx.lineWidth = 1; ctx.stroke(); }
      else if (g.type === "vin") { ctx.fillStyle = "#b0507a"; ctx.beginPath(); ctx.ellipse(g.x, g.y + o, 6, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = "#c9a24a"; ctx.fillRect(g.x - 3, g.y + o - 12, 6, 5); }
      else if (g.type === "magnet") { ctx.strokeStyle = "#9db36a"; ctx.lineWidth = 3; sirkel(g.x, g.y + o, 7); ctx.stroke(); ctx.fillStyle = "#c3d28e"; sirkel(g.x, g.y + o, 2.5); ctx.fill(); }
      else { ctx.fillStyle = "rgba(226,193,116,.25)"; sirkel(g.x, g.y, 24 + Math.sin(t * 4) * 4); ctx.fill(); ctx.fillStyle = "#6b4a2a"; ctx.fillRect(g.x - 13, g.y - 8, 26, 17); ctx.fillStyle = "#c9a24a"; ctx.fillRect(g.x - 13, g.y - 11, 26, 5); ctx.fillRect(g.x - 2.5, g.y - 5, 5, 7); }
    }
    for (const e of S.fiender) if (Math.abs(e.x - S.x) < vW / 2 + 60 && Math.abs(e.y - S.y) < vH / 2 + 60) tegnFiende(e);
    if (!S.slutt || S.t >= SEIERSTID) tegnHelt(t);
    if (S.vapen.aegis) {
      const w = S.vapen.aegis, p = VAPEN.aegis.p(w.l), r = p.r * S.st.omrade;
      for (let i = 0; i < p.ant; i++) {
        const a = w.v + (i / p.ant) * TAU, x = S.x + Math.cos(a) * r, y = S.y + Math.sin(a) * r;
        ctx.fillStyle = "#8fd3c0"; sirkel(x, y, 11); ctx.fill(); ctx.strokeStyle = "#e2c174"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#2f6d6a"; sirkel(x, y, 4); ctx.fill();
      }
    }
    for (const s of S.skudd) {
      ctx.save(); ctx.translate(s.x, s.y);
      if (s.type === "spyd") { ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.strokeStyle = "#8a6a45"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(8, 0); ctx.stroke(); ctx.fillStyle = "#f5efe0"; ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(19, 0); ctx.lineTo(8, 4); ctx.fill(); }
      else { ctx.rotate(S.t * 14); ctx.fillStyle = "#d19f76"; ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = "#f5e3c2"; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.restore();
    }
    for (const k of S.kast) {
      const a = k.t / k.T, x = k.x0 + (k.x1 - k.x0) * a, y = k.y0 + (k.y1 - k.y0) * a - Math.sin(a * Math.PI) * 46;
      ctx.fillStyle = "#b5623a"; ctx.beginPath(); ctx.ellipse(x, y, 6, 8, a * 8, 0, TAU); ctx.fill(); ctx.fillStyle = "#f2c14e"; sirkel(x, y - 6, 2.5); ctx.fill();
    }
    for (const s of S.fskudd) { ctx.fillStyle = s.farge; ctx.globalAlpha = 0.3; sirkel(s.x, s.y, s.r + 5); ctx.fill(); ctx.globalAlpha = 1; sirkel(s.x, s.y, s.r); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.6)"; sirkel(s.x - s.r * 0.25, s.y - s.r * 0.25, s.r * 0.4); ctx.fill(); }
    for (const e of S.eff) {
      const a = e.t / e.T;
      if (e.type === "gnist") { ctx.globalAlpha = a; ctx.fillStyle = e.farge; ctx.fillRect(e.x - 2, e.y - 2, 4, 4); }
      else if (e.type === "ring") { const x = e.folg ? S.x : e.x, y = e.folg ? S.y : e.y; ctx.globalAlpha = a; ctx.strokeStyle = e.farge; ctx.lineWidth = 2 + a * 5; sirkel(x, y, e.r * (1 - a * 0.75)); ctx.stroke(); }
      else if (e.type === "lyn") {
        ctx.globalAlpha = a; ctx.fillStyle = "rgba(191,227,255,.35)"; sirkel(e.x, e.y, e.r); ctx.fill();
        ctx.strokeStyle = "#f5fbff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, e.y);
        let x = e.x, y = e.y, fro = e.fro;
        while (y > S.y - vH / 2 - 20) { fro = (fro * 9301 + 49297) % 233280; x += (fro / 233280 - 0.5) * 34; y -= 26; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.font = "700 13px Cinzel, Georgia, serif"; ctx.textAlign = "center";
    for (const n of S.tallene) { ctx.globalAlpha = Math.min(1, n.t * 3); ctx.fillStyle = "#f5efe0"; ctx.fillText(n.v, n.x, n.y); }
    ctx.globalAlpha = 1;
  }

  function tegnHud() {
    const liten = vW < 600;
    // Sjelelinje øverst
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, vW, 10);
    ctx.fillStyle = "#6fc3c9"; ctx.fillRect(0, 0, vW * Math.min(1, S.xp / S.behov), 8);
    ctx.fillStyle = "#c9a24a"; ctx.fillRect(0, 8, vW, 2);
    ctx.textAlign = "left"; ctx.font = "600 14px Cinzel, Georgia, serif"; ctx.fillStyle = "#e2c174";
    ctx.fillText(`NIVÅ ${S.niva}`, 14, 32);
    ctx.textAlign = "right"; ctx.fillText(`${tall(S.drap)} FELT  ·  ${tall(S.drakmer)} Δ`, vW - 14, 32);
    ctx.textAlign = "center"; ctx.font = `700 ${liten ? 22 : 26}px Cinzel, Georgia, serif`; ctx.fillStyle = "#f5efe0";
    ctx.fillText(klokke(Math.max(0, SEIERSTID - S.t)), vW / 2, liten ? 62 : 38);
    if (S.boss && !S.boss.dod) {
      const b = Math.min(360, vW - 60), y = liten ? 74 : 52;
      ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(vW / 2 - b / 2 - 2, y - 2, b + 4, 12);
      ctx.fillStyle = "#8e2f52"; ctx.fillRect(vW / 2 - b / 2, y, b * Math.max(0, S.boss.hp / S.boss.maks), 8);
      ctx.font = "600 11px Cinzel, Georgia, serif"; ctx.fillStyle = "#e2c174"; ctx.fillText(S.boss.def.boss.toUpperCase(), vW / 2, y + 26);
    }
    if (S.beskjed) {
      ctx.globalAlpha = Math.min(1, S.beskjed.t / 0.5);
      ctx.font = `700 ${liten ? 20 : 26}px Cinzel, Georgia, serif`; ctx.fillStyle = "#e2c174";
      ctx.fillText(S.beskjed.tekst, vW / 2, vH * 0.27);
      ctx.globalAlpha = 1;
    }
    // Våpen og gudegaver nederst til venstre
    let x = 22;
    const brikke = (d, l, r) => {
      ctx.fillStyle = "rgba(11,11,10,.75)"; sirkel(x, vH - 24, r); ctx.fill();
      ctx.strokeStyle = d.farge; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = d.farge; ctx.font = `700 ${r}px Cinzel, Georgia, serif`; ctx.textAlign = "center"; ctx.fillText(d.tegn, x, vH - 24 + r * 0.36);
      ctx.fillStyle = "#f5efe0"; ctx.font = "700 10px Cinzel, Georgia, serif"; ctx.fillText(l, x + r - 1, vH - 24 + r + 2);
      x += r * 2 + 8;
    };
    for (const id in S.vapen) brikke(VAPEN[id], S.vapen[id].l, 14);
    x += 4;
    for (const id in S.gaver) brikke(GAVER[id], S.gaver[id], 10);
    if (S.fjaer) { ctx.fillStyle = "#f2c14e"; ctx.font = "600 11px Cinzel, Georgia, serif"; ctx.textAlign = "right"; ctx.fillText("FØNIKSFJÆR", vW - 14, vH - 18); }
    if (styr && styr.finger) {
      const k = vW / lerret.clientWidth, r = lerret.getBoundingClientRect();
      ctx.strokeStyle = "rgba(226,193,116,.5)"; ctx.lineWidth = 2; sirkel((styr.x0 - r.left) * k, (styr.y0 - r.top) * k, 40 * k); ctx.stroke();
      ctx.fillStyle = "rgba(226,193,116,.5)"; sirkel((styr.x - r.left) * k, (styr.y - r.top) * k, 14 * k); ctx.fill();
    }
  }

  function tegn(ms) {
    if (!S) return;
    const t = ms / 1000, k = lerret.width / vW;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.save();
    ctx.translate(vW / 2 - S.x + (S.rist ? tilf(-S.rist, S.rist) * 0.5 : 0), vH / 2 - S.y + (S.rist ? tilf(-S.rist, S.rist) * 0.5 : 0));
    tegnVerden(t);
    ctx.restore();
    // Mørket i Tartaros: lys rundt helten, svart mot kantene
    const g = ctx.createRadialGradient(vW / 2, vH / 2, 70, vW / 2, vH / 2, Math.max(vW, vH) * 0.62), m = S.blink > 0 ? 0.3 : 0.66;
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(4,3,8,${m})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vW, vH);
    if (S.usarbar > 0.3 && !S.meny) { ctx.fillStyle = "rgba(181,40,42,.16)"; ctx.fillRect(0, 0, vW, vH); }
    if (!S.meny) tegnHud();
  }

  function tilpass() {
    const b = lerret.parentElement.clientWidth || 992, stor = b >= 700;
    vW = stor ? 992 : 480; vH = stor ? 620 : 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lerret.width = Math.round(b * dpr); lerret.height = Math.round(b * (vH / vW) * dpr);
  }

  // ---------- Slutt, pause og meny ----------
  function bygging() {
    return [...Object.keys(S.vapen).map((id) => `${merke(VAPEN[id], true)} ${VAPEN[id].navn} ${S.vapen[id].l}`), ...Object.keys(S.gaver).map((id) => `${merke(GAVER[id], true)} ${GAVER[id].navn} ${S.gaver[id]}`)].map((x) => `<span>${x}</span>`).join("");
  }
  async function avslutt(seier) {
    S.slutt = true; S.pause = true;
    const sekunder = Math.min(SEIERSTID, Math.floor(S.t));
    const poeng = Math.round(S.poeng + sekunder * 2 + (seier ? 2000 : 0));
    const drakmer = Math.round((S.drakmer + Math.floor(sekunder / 20) + (seier ? 50 : 0)) * (1 + 0.1 * (PROFIL.gunst.midas || 0)));
    lyd(seier ? "seier" : "dod", 0.1);
    lag.className = "ta-lag ta-slutt";
    lag.innerHTML = `<p class="overline">${seier ? "Daggry" : `Felt etter ${klokke(sekunder)}`}</p>
      <h2>${seier ? "Du slapp ut av Tartaros" : "Skyggene tok deg"}</h2>
      <p class="ta-poeng">${tall(poeng)} <span>poeng</span></p>
      <p class="ta-tall">Nivå ${S.niva} · ${tall(S.drap)} felt · <strong>+${tall(drakmer)} drakmer</strong></p>
      <div class="ta-bygging">${bygging()}</div>
      <p class="ta-beholder"><strong>Blir med videre:</strong> drakmene. <strong>Blir igjen her nede:</strong> våpen, gudegaver og nivå.</p>
      <p class="dempet" id="ta-lagret">${innlogget() ? "" : `<a href="gjest.html">Logg inn</a> for å komme på tavlen og beholde drakmene.`}</p>
      <div class="ta-rad"><button class="knapp" type="button" data-start>Nytt tokt</button><button class="knapp sekundar" type="button" data-leir>Til leiren</button></div>`;
    lag.hidden = false;
    if (!innlogget()) return;
    try {
      const svar = await api("tartaros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poeng, sekunder, niva: S.niva, drap: S.drap, helt: S.helt, seier, drakmer }) });
      PROFIL = svar.profil;
      const l = document.getElementById("ta-lagret");
      if (l) l.textContent = `Ført i protokollen.${svar.bytte ? ` Dagens bytte: ${svar.bytte} oliven til godset ditt i Symposion.` : ""}`;
      visLeir(); lastTavle();
    } catch (e) { const l = document.getElementById("ta-lagret"); if (l) l.textContent = "Klarte ikke å lagre toktet."; }
  }
  function visPause() {
    if (!S || S.meny || S.slutt || S.pause) return;
    S.pause = true;
    lag.className = "ta-lag ta-pausen";
    lag.innerHTML = `<p class="overline">Pause</p><h2>${klokke(Math.max(0, SEIERSTID - S.t))} igjen</h2><div class="ta-bygging">${bygging()}</div>
      <div class="ta-rad"><button class="knapp" type="button" data-fortsett>Fortsett</button><button class="knapp sekundar" type="button" data-giopp>Gi opp</button></div>`;
    lag.hidden = false;
  }
  const harHelt = (id) => id === "akilles" || PROFIL.helter.includes(id);
  function visMeny() {
    if (!harHelt(valgtHelt)) valgtHelt = "akilles";
    nyTilstand(valgtHelt, true);
    lag.className = "ta-lag ta-meny";
    lag.innerHTML = `<p class="overline">Underverdenens dypeste avgrunn</p><h2>Tartaros</h2>
      <p class="ta-ingress">Hold ut i ti minutter. Våpnene skyter selv. Du styrer bare beina.</p>
      <div class="ta-helter">${Object.entries(HELTER).map(([id, h]) => {
        const har = harHelt(id), pris = PRISER ? PRISER.helter[id] : null;
        return `<button type="button" class="ta-helt${id === valgtHelt ? " valgt" : ""}${har ? "" : " last"}" data-helt="${id}" style="--farge:${h.farge}"><strong>${h.navn}</strong><span>${h.tekst}</span>${har ? "" : `<em>${pris ? `Lås opp: ${pris} Δ` : "Låst"}</em>`}</button>`;
      }).join("")}</div>
      <p class="melding feil" id="ta-menyfeil" hidden></p>
      <button class="knapp ta-start" type="button" data-start>Gå ned i Tartaros</button>`;
    lag.hidden = false;
  }

  // ---------- Leiren: varige oppgraderinger ----------
  function visLeir() {
    if (!innlogget()) { leir.innerHTML = `<h2 class="t-tittel">Leiren</h2><p class="dempet">Du kan spille uten å være innlogget, men drakmer, oppgraderinger og tavlen krever at du <a href="gjest.html">logger inn</a>.</p>`; return; }
    const g = PROFIL.gunst;
    leir.innerHTML = `<div class="ta-leirhode"><h2 class="t-tittel">Leiren</h2><p class="ta-saldo"><strong>${tall(PROFIL.drakmer)}</strong> drakmer</p></div>
      <dl class="ta-regler"><dt>Beholdes for alltid</dt><dd>Drakmene dine, alt du kjøper her i leiren, heltene du har låst opp og plassen på tavlen.</dd>
        <dt>Nullstilles hvert tokt</dt><dd>Våpen, gudegaver og nivå. Du starter alltid med heltens ene våpen og bygger opp på nytt.</dd>
        <dt>Slik tjener du drakmer</dt><dd>Mynter på bakken, 20 for hver boss, 1 for hvert 20. sekund du holder ut og 50 for daggry.</dd></dl>
      <p class="melding feil" id="ta-leirfeil" hidden></p>
      <div class="ta-gunst">${Object.entries(GUNST).map(([id, v]) => {
        const n = g[id] || 0, regel = PRISER ? PRISER.gunst[id] : { maks: 0, pris: 0 }, full = n >= regel.maks, pris = regel.pris * (n + 1);
        return `<article class="ta-vare"><h4>${v.navn}</h4><p>${v.tekst}</p><p class="ta-pips">${Array.from({ length: regel.maks }, (_, i) => `<i class="${i < n ? "full" : ""}"></i>`).join("")}</p>
          <button class="liten-knapp" type="button" data-gunst="${id}" ${full || PROFIL.drakmer < pris ? "disabled" : ""}>${full ? "Fullt" : `Kjøp · ${pris} Δ`}</button></article>`;
      }).join("")}</div>`;
  }
  async function kjop(type, id, feilboks) {
    try {
      PROFIL = (await api("tartaros/kjop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) })).profil;
      lyd("mynt", 0.05);
      if (type === "helt") { valgtHelt = id; try { localStorage.setItem("tafse-tartaros-helt", id); } catch (_) {} }
      visLeir(); if (S && S.meny) visMeny();
    } catch (e) { const f = document.getElementById(feilboks); if (f) { f.textContent = e.message; f.hidden = false; } }
  }

  // ---------- Tavlen ----------
  function liste(rader, tom) {
    return rader.length
      ? `<div class="tabell-boks"><table class="tavle t-tavle"><thead><tr><th>#</th><th>Navn</th><th>Poeng</th><th>Tid</th><th>Nivå</th></tr></thead><tbody>${rader.map((r, i) =>
          `<tr${r.navn === MEG ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(r.navn)}</td><td>${tall(r.poeng)}</td><td>${r.seier ? "Daggry" : klokke(r.sekunder)}</td><td>${r.niva}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="tomt">${tom}</p>`;
  }
  async function lastTavle() {
    if (!(await hvemErJeg())) { tavle.innerHTML = `<p class="dempet">Tavlen krever at du <a href="gjest.html">logger inn</a>.</p>`; visLeir(); return; }
    try {
      data = await api("tartaros");
      PROFIL = data.profil; PRISER = { gunst: data.gunst, helter: data.helter };
      const krone = (tittel, r) => `<div class="t-krone"><span>${tittel}</span>${r ? `<strong>${tall(r.poeng)}</strong><em>${esc(r.navn)}</em>` : `<strong>·</strong><em>Ledig</em>`}</div>`;
      tavle.innerHTML = `<div class="t-kroner">${krone("Rekorden", data.alle[0])}${krone("Ukens leder", data.uke[0])}</div>
        <h3 class="t-undertittel">Denne uka</h3>${liste(data.uke, "Ingen har vært nede denne uka.")}
        <h3 class="t-undertittel">Alle tider</h3>${liste(data.alle, "Ingen har vært nede ennå.")}
        <p class="dempet t-fot">${tall(data.antall)} tokt totalt. «Daggry» betyr at man holdt ut alle ti minuttene.</p>`;
      visLeir();
      if (S && S.meny) visMeny();
    } catch (e) { tavle.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`; }
  }

  const INFO = `
    <p>Du er en helt som har havnet i Tartaros, og må holde ut i ti minutter til daggry. Du styrer bare hvor helten går. Våpnene skyter av seg selv.</p>
    <h3>Styring</h3>
    <p>WASD eller piltaster på tastatur. På mobil drar du fingeren hvor som helst på skjermen. P eller Escape gir pause.</p>
    <h3>Sjeler og nivåer</h3>
    <p>Fiendene slipper sjeler når de faller. Gå bort til dem for å samle dem. Den blå linja øverst viser hvor langt du er fra neste nivå. På hvert nivå velger du ett av tre: et nytt våpen, et sterkere våpen eller en gudegave. Du kan ha fem våpen og fem gudegaver.</p>
    <h3>Våpnene</h3>
    <ul>${Object.values(VAPEN).map((v) => `<li><strong>${v.navn}:</strong> ${v.tekst[0]}</li>`).join("")}</ul>
    <h3>Gudegavene</h3>
    <ul>${Object.values(GAVER).map((v) => `<li><strong>${v.navn}:</strong> ${v.tekst}.</li>`).join("")}</ul>
    <h3>Fiendene</h3>
    <p>Skygger og skjeletter kommer i flokk. Harpyene er raske, kentaurene stormer rett fram, gorgonene skyter og minotaurene tåler mye. Kyklopen kommer etter to og et halvt minutt, Kerberos etter fem og Kronos etter åtte. En felt boss etterlater en skattekiste.</p>
    <h3>På bakken</h3>
    <p>Vinkrukker gir liv, mynter gir drakmer, og den grønne ringen trekker til seg alle sjeler på en gang.</p>
    <h3>Leiren</h3>
    <p>Våpen, gudegaver og nivå gjelder bare toktet du er på. Når du faller eller når daggry, starter neste tokt fra bunnen.</p>
    <p>Det du beholder, er drakmene. De bruker du i leiren under spillet, og alt du kjøper der varer for alltid: mer skade, liv og fart, rustning, flere drakmer per tokt, omkast av kortene, et ekstra startvåpen, føniksfjæra og nye helter. Hver helt starter med sitt eget våpen. Første tokt hver dag gir også oliven til godset ditt i Symposion.</p>
    <h3>Poeng</h3>
    <p>Du får poeng for hver fiende, to poeng per sekund og 2 000 for å holde ut til daggry.</p>`;

  // ---------- Styring ----------
  const TAST = { arrowleft: "venstre", a: "venstre", arrowright: "hoyre", d: "hoyre", arrowup: "opp", w: "opp", arrowdown: "ned", s: "ned" };
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    if (!S || S.meny) return;
    if (S.valg && /^[1-3]$/.test(k)) { e.preventDefault(); return taValg(Number(k) - 1); }
    if (S.valg && k === "r") { e.preventDefault(); return omkast(); }
    if (TAST[k]) { taster[TAST[k]] = true; e.preventDefault(); }
    else if (k === "p" || k === "escape") { e.preventDefault(); if (S.pause && lag.classList.contains("ta-pausen")) fortsett(); else visPause(); }
  });
  window.addEventListener("keyup", (e) => { const k = TAST[e.key.toLowerCase()]; if (k) taster[k] = false; });
  window.addEventListener("blur", () => { for (const k in taster) taster[k] = false; styr = null; });
  document.addEventListener("visibilitychange", () => { if (document.hidden) visPause(); });
  lerret.addEventListener("pointerdown", (e) => { styr = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId, finger: e.pointerType !== "mouse" }; try { lerret.setPointerCapture(e.pointerId); } catch (_) {} });
  lerret.addEventListener("pointermove", (e) => { if (styr && styr.id === e.pointerId) { styr.x = e.clientX; styr.y = e.clientY; } });
  for (const h of ["pointerup", "pointercancel"]) lerret.addEventListener(h, () => { styr = null; });
  const fortsett = () => { lag.hidden = true; lag.innerHTML = ""; S.pause = false; };
  lag.addEventListener("click", (e) => {
    const k = e.target.closest("button");
    if (!k || k.disabled) return;
    if (k.dataset.valg !== undefined) taValg(Number(k.dataset.valg));
    else if (k.dataset.omkast !== undefined) omkast();
    else if (k.dataset.start !== undefined) nyttTokt();
    else if (k.dataset.leir !== undefined) visMeny();
    else if (k.dataset.fortsett !== undefined) fortsett();
    else if (k.dataset.giopp !== undefined) { lag.hidden = true; S.pause = false; avslutt(false); }
    else if (k.dataset.helt) {
      const id = k.dataset.helt;
      if (harHelt(id)) { valgtHelt = id; try { localStorage.setItem("tafse-tartaros-helt", id); } catch (_) {} visMeny(); }
      else if (innlogget() && PRISER) kjop("helt", id, "ta-menyfeil");
      else { const f = document.getElementById("ta-menyfeil"); f.textContent = "Logg inn for å låse opp flere helter."; f.hidden = false; }
    }
  });
  leir.addEventListener("click", (e) => { const k = e.target.closest("[data-gunst]"); if (k && !k.disabled) kjop("gunst", k.dataset.gunst, "ta-leirfeil"); });
  document.getElementById("ta-info").addEventListener("click", () => { visPause(); visInfo("Slik spiller du Tartaros", INFO); });
  window.addEventListener("resize", tilpass);

  LYD.knapp(document.getElementById("ta-lyd"));
  tilpass();
  visMeny();
  visLeir();
  let forrige = 0;
  const ramme = (ms) => { oppdater(Math.min(0.05, (ms - forrige) / 1000 || 0)); forrige = ms; tegn(ms); requestAnimationFrame(ramme); };
  requestAnimationFrame(ramme);
  lastTavle();
})();
