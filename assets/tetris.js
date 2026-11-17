// TETRIS: flytt og snu brikkene, fyll hele rader. Fire rader på en gang gir mest.
// Vanlige regler: 7-pose (alle sju brikkene kommer før noen gjentas), skyggebrikke, hold, SRS-rotasjon med vegghopp.

(() => {
  const KOL = 10, RAD = 20, C = 30, BW = KOL * C, SIDE = 132, W = BW + SIDE, H = RAD * C;
  const LAGRING = "tafse-tetris";
  const lerret = document.getElementById("te-lerret");
  const ctx = lerret.getContext("2d");
  const poengEl = document.getElementById("te-poeng");
  const rekordEl = document.getElementById("te-rekord");
  const meldingEl = document.getElementById("te-melding");
  const tavle = document.getElementById("te-tavle");

  // ---------- Regler (endres her) ----------
  const LINJEPOENG = [0, 100, 300, 500, 800];  // ganges med nivået
  const LINJER_PER_NIVA = 10;
  const LAASETID = 0.5, MAKS_UTSETT = 15;     // sekunder før brikken låses, og hvor mange ganger det kan utsettes
  const DAS = 0.17, ARR = 0.05;               // tastetrykk: ventetid før gjentakelse, og fart på gjentakelsen
  const fallTid = (niva) => Math.max(0.012, Math.pow(0.8 - (niva - 1) * 0.007, niva - 1)); // sekunder per rad

  // Gresk palett: marmor, gull, vin, oliven, terrakotta og bronse
  const FARGE = { I: "#ece4d2", O: "#f3dc9b", T: "#8e2f45", S: "#7d8b3a", Z: "#b0563a", J: "#8c7033", L: "#c9a24a" };
  const FORM = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  };
  const snu = (m) => m[0].map((_, x) => m.map((rad) => rad[x]).reverse());
  const ROT = {};
  for (const [t, m] of Object.entries(FORM)) { ROT[t] = [m]; for (let i = 1; i < 4; i++) ROT[t].push(snu(ROT[t][i - 1])); }
  // SRS-vegghopp, (x, y) med y oppover slik tabellene vanligvis skrives
  const HOPP = {
    "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const HOPP_I = {
    "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };

  let brett, brikke, pose, neste, holdt, holdBrukt, poeng, linjer, niva, b2b, tilstand, fallAkk, laas, utsatt, lavest;
  let rydder, rydderTid, lagret, beskjed, beskjedTid, flash;
  let rekord = 0, rekordSpilt = false, startRekord = 0, data = null;
  const tall = (n) => n.toLocaleString("nb-NO");
  try { rekord = Number(localStorage.getItem(LAGRING)) || 0; } catch (_) {}

  // ---------- Brikker ----------
  function fyllPose() {
    const p = Object.keys(FORM);
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    pose.push(...p);
  }
  function trekk() {
    while (pose.length < 4) fyllPose();
    return pose.shift();
  }
  const celler = (b, rot = b.rot, x = b.x, y = b.y) => {
    const ut = [];
    ROT[b.type][rot].forEach((rad, r) => rad.forEach((v, k) => { if (v) ut.push([x + k, y + r]); }));
    return ut;
  };
  const kolliderer = (b, rot, x, y) => celler(b, rot, x, y).some(([cx, cy]) => cx < 0 || cx >= KOL || cy >= RAD || (cy >= 0 && brett[cy][cx]));
  function nyBrikke(type) {
    const b = { type, rot: 0, x: type === "O" ? 4 : 3, y: type === "I" ? -1 : 0 };
    if (kolliderer(b, 0, b.x, b.y)) b.y -= 1;
    if (kolliderer(b, 0, b.x, b.y)) return slutt();
    brikke = b;
    fallAkk = 0; laas = 0; utsatt = 0; lavest = b.y;
  }
  function neste1() {
    holdBrukt = false;
    nyBrikke(trekk());
  }
  const paBakken = () => kolliderer(brikke, brikke.rot, brikke.x, brikke.y + 1);
  function etterTrekk() {
    // Et vellykket trekk på bakken utsetter låsingen, men bare et visst antall ganger
    if (paBakken() && utsatt < MAKS_UTSETT) { laas = 0; utsatt += 1; }
  }
  function flytt(dx) {
    if (!kanStyre()) return false;
    if (kolliderer(brikke, brikke.rot, brikke.x + dx, brikke.y)) return false;
    brikke.x += dx;
    LYD.spill("skyv");
    etterTrekk();
    return true;
  }
  function roter(retning) {
    if (!kanStyre() || brikke.type === "O") return;
    const fra = brikke.rot, til = (fra + retning + 4) % 4;
    const tabell = (brikke.type === "I" ? HOPP_I : HOPP)[`${fra}${til}`];
    for (const [kx, ky] of tabell) {
      if (!kolliderer(brikke, til, brikke.x + kx, brikke.y - ky)) {
        brikke.rot = til; brikke.x += kx; brikke.y -= ky;
        LYD.spill("roter");
        etterTrekk();
        return;
      }
    }
  }
  function myktFall() {
    if (!kanStyre()) return false;
    if (kolliderer(brikke, brikke.rot, brikke.x, brikke.y + 1)) return false;
    brikke.y += 1;
    poeng += 1;
    nyLavest();
    oppdaterTall();
    return true;
  }
  function hardtFall() {
    if (!kanStyre()) return;
    let n = 0;
    while (!kolliderer(brikke, brikke.rot, brikke.x, brikke.y + 1)) { brikke.y += 1; n++; }
    poeng += 2 * n;
    LYD.spill("fall");
    laasBrikke();
  }
  function hold() {
    if (!kanStyre() || holdBrukt) return;
    const t = brikke.type;
    if (holdt) nyBrikke(holdt); else nyBrikke(trekk());
    holdt = t;
    holdBrukt = true;
    LYD.spill("hold");
  }
  function nyLavest() {
    if (brikke.y > lavest) { lavest = brikke.y; utsatt = 0; laas = 0; }
  }
  const kanStyre = () => tilstand === "spiller" && !rydder && brikke;

  function laasBrikke() {
    const c = celler(brikke);
    if (c.every(([, y]) => y < 0)) return slutt();
    for (const [x, y] of c) if (y >= 0) brett[y][x] = brikke.type;
    brikke = null;
    const fulle = [];
    for (let y = 0; y < RAD; y++) if (brett[y].every(Boolean)) fulle.push(y);
    if (c.some(([, y]) => y < 0) && !fulle.length) return slutt();
    if (fulle.length) {
      const n = fulle.length;
      let p = LINJEPOENG[n] * niva;
      const tetris = n === 4;
      if (tetris && b2b) p = Math.round(p * 1.5);
      b2b = tetris ? true : false;
      poeng += p;
      linjer += n;
      rydder = fulle; rydderTid = 0.2;
      LYD.spill(tetris ? "tetris" : "linje", n);
      if (tetris) visBeskjed(p > LINJEPOENG[4] * niva ? "Tetris ×1,5" : "Tetris!");
      const nyttNiva = 1 + Math.floor(linjer / LINJER_PER_NIVA);
      if (nyttNiva > niva) { niva = nyttNiva; setTimeout(() => LYD.spill("niva"), 200); visBeskjed(`Nivå ${niva}`); }
    } else {
      LYD.spill("land");
      neste1();
    }
    if (!rekordSpilt && startRekord > 0 && poeng > startRekord) { rekordSpilt = true; setTimeout(() => LYD.spill("rekord"), 150); }
    oppdaterTall();
  }

  // ---------- Spillet ----------
  function nyttSpill() {
    brett = Array.from({ length: RAD }, () => Array(KOL).fill(null));
    pose = []; holdt = null; holdBrukt = false;
    poeng = 0; linjer = 0; niva = 1; b2b = false;
    rydder = null; lagret = false; rekordSpilt = false; beskjedTid = 0; flash = 0;
    startRekord = Math.max(rekord, minRekordServer());
    tilstand = "klar";
    brikke = null;
    meldingEl.hidden = true;
    oppdaterTall();
  }
  function start() {
    if (tilstand === "klar") { tilstand = "spiller"; neste1(); }
    else if (tilstand === "pause") tilstand = "spiller";
    lerret.focus({ preventScroll: true });
  }
  function visBeskjed(t) { beskjed = t; beskjedTid = 1.4; }
  function oppdaterTall() {
    poengEl.textContent = tall(poeng);
    rekordEl.textContent = tall(Math.max(rekord, poeng, minRekordServer()));
  }

  const taster = { venstre: null, hoyre: null, ned: false };
  function oppdater(dt) {
    if (beskjedTid > 0) beskjedTid -= dt;
    if (tilstand !== "spiller") return;
    if (rydder) {
      rydderTid -= dt;
      if (rydderTid <= 0) {
        for (const y of rydder) { brett.splice(y, 1); brett.unshift(Array(KOL).fill(null)); }
        rydder = null;
        neste1();
      }
      return;
    }
    if (!brikke) return;
    // Holdte piltaster
    for (const [navn, dx] of [["venstre", -1], ["hoyre", 1]]) {
      const t = taster[navn];
      if (!t) continue;
      t.tid += dt;
      while (t.tid >= DAS + t.n * ARR) { t.n += 1; if (!flytt(dx)) break; }
    }
    // Tyngdekraft
    const g = taster.ned ? Math.min(fallTid(niva), 0.04) : fallTid(niva);
    fallAkk += dt;
    let n = 0;
    while (fallAkk >= g && n++ < 30 && brikke) {
      fallAkk -= g;
      if (paBakken()) { fallAkk = 0; break; }
      brikke.y += 1;
      if (taster.ned) poeng += 1;
      nyLavest();
    }
    if (taster.ned) oppdaterTall();
    if (brikke && paBakken()) {
      laas += dt;
      if (laas >= LAASETID) laasBrikke();
    } else laas = 0;
  }

  // ---------- Tegning ----------
  function kloss(x, y, farge, str = C) {
    ctx.fillStyle = farge;
    ctx.fillRect(x + 1, y + 1, str - 2, str - 2);
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fillRect(x + 1, y + 1, str - 2, Math.max(2, str * 0.1));
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(x + 1, y + str - 1 - Math.max(2, str * 0.12), str - 2, Math.max(2, str * 0.12));
  }
  function miniBrikke(type, cx, cy, str, dempet) {
    const m = FORM[type];
    const fylt = [];
    m.forEach((rad, r) => rad.forEach((v, k) => { if (v) fylt.push([k, r]); }));
    const xs = fylt.map(([k]) => k), ys = fylt.map(([, r]) => r);
    const bx = Math.max(...xs) - Math.min(...xs) + 1, by = Math.max(...ys) - Math.min(...ys) + 1;
    ctx.globalAlpha = dempet ? 0.35 : 1;
    for (const [k, r] of fylt) kloss(cx - (bx * str) / 2 + (k - Math.min(...xs)) * str, cy - (by * str) / 2 + (r - Math.min(...ys)) * str, FARGE[type], str);
    ctx.globalAlpha = 1;
  }
  function tegn() {
    ctx.clearRect(0, 0, W, H);
    // Brettet
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    for (let x = 1; x < KOL; x++) { ctx.beginPath(); ctx.moveTo(x * C + 0.5, 0); ctx.lineTo(x * C + 0.5, H); ctx.stroke(); }
    for (let y = 1; y < RAD; y++) { ctx.beginPath(); ctx.moveTo(0, y * C + 0.5); ctx.lineTo(BW, y * C + 0.5); ctx.stroke(); }
    for (let y = 0; y < RAD; y++) for (let x = 0; x < KOL; x++) {
      const t = brett[y][x];
      if (!t) continue;
      if (rydder && rydder.includes(y)) {
        ctx.fillStyle = Math.floor(rydderTid * 30) % 2 ? "#fff4cf" : "#e2c174";
        ctx.fillRect(x * C, y * C, C, C);
      } else kloss(x * C, y * C, FARGE[t]);
    }
    if (brikke && tilstand !== "over") {
      // Skyggen viser hvor brikken lander
      let sy = brikke.y;
      while (!kolliderer(brikke, brikke.rot, brikke.x, sy + 1)) sy++;
      ctx.strokeStyle = FARGE[brikke.type];
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      for (const [x, y] of celler(brikke, brikke.rot, brikke.x, sy)) if (y >= 0) ctx.strokeRect(x * C + 2.5, y * C + 2.5, C - 5, C - 5);
      ctx.globalAlpha = 1;
      for (const [x, y] of celler(brikke)) if (y >= 0) kloss(x * C, y * C, FARGE[brikke.type]);
    }
    // Sidepanelet
    ctx.fillStyle = "#2c2820";
    ctx.fillRect(BW, 0, 1, H);
    const mx = BW + SIDE / 2;
    ctx.textAlign = "center";
    ctx.font = "600 12px Cinzel, Georgia, serif";
    ctx.fillStyle = "#c9a24a";
    ctx.fillText("NESTE", mx, 28);
    const kommende = pose.length ? pose.slice(0, 3) : [];
    kommende.forEach((t, i) => miniBrikke(t, mx, 66 + i * 62, i === 0 ? 22 : 17, false));
    ctx.fillStyle = "#c9a24a";
    ctx.fillText("HOLD", mx, 262);
    ctx.strokeStyle = "#2c2820";
    ctx.strokeRect(BW + 20.5, 274.5, SIDE - 41, 70);
    if (holdt) miniBrikke(holdt, mx, 310, 20, holdBrukt);
    ctx.fillStyle = "#c9a24a";
    ctx.fillText("NIVÅ", mx, 392);
    ctx.fillText("LINJER", mx, 462);
    ctx.font = "700 28px Cinzel, Georgia, serif";
    ctx.fillStyle = "#ece4d2";
    ctx.fillText(String(niva), mx, 424);
    ctx.fillText(String(linjer), mx, 494);
    if (b2b) {
      ctx.font = "italic 15px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "#e2c174";
      ctx.fillText("Neste tetris ×1,5", mx, 540);
    }
    // Beskjeder
    if (beskjedTid > 0 && tilstand === "spiller") {
      ctx.globalAlpha = Math.min(1, beskjedTid / 0.4);
      ctx.font = "700 30px Cinzel, Georgia, serif";
      ctx.fillStyle = "#e2c174";
      ctx.fillText(beskjed, BW / 2, H * 0.32);
      ctx.globalAlpha = 1;
    }
    if (tilstand === "klar" || tilstand === "pause") {
      ctx.fillStyle = "rgba(11,11,10,.6)";
      ctx.fillRect(0, H * 0.38, BW, 96);
      ctx.font = "700 26px Cinzel, Georgia, serif";
      ctx.fillStyle = "#e2c174";
      ctx.fillText(tilstand === "pause" ? "Pause" : "Tetris", BW / 2, H * 0.38 + 40);
      ctx.font = "italic 18px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "#b3a991";
      ctx.fillText(tilstand === "pause" ? "Trykk for å fortsette" : "Trykk eller mellomrom for å starte", BW / 2, H * 0.38 + 70);
    }
  }

  function tilpass() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const b = lerret.clientWidth || W;
    lerret.width = Math.round(b * dpr);
    lerret.height = Math.round(b * (H / W) * dpr);
    ctx.setTransform(lerret.width / W, 0, 0, lerret.height / H, 0, 0);
  }

  let forrige = 0;
  function ramme(t) {
    const dt = Math.min(0.05, (t - forrige) / 1000 || 0);
    forrige = t;
    oppdater(dt);
    tegn();
    requestAnimationFrame(ramme);
  }

  // ---------- Slutt og lagring ----------
  async function lagre() {
    if (lagret || poeng <= 0) return false;
    if (poeng > rekord) { rekord = poeng; try { localStorage.setItem(LAGRING, String(rekord)); } catch (_) {} }
    if (typeof MEG === "undefined" || !MEG) return false;
    lagret = true;
    try {
      const svar = await api("tetris", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poeng, linjer, niva }) });
      lastTavle();
      return svar || true;
    } catch (_) { lagret = false; return false; }
  }
  async function slutt() {
    tilstand = "over";
    brikke = null;
    taster.venstre = taster.hoyre = null; taster.ned = false;
    LYD.spill("tapt");
    oppdaterTall();
    meldingEl.innerHTML = `<p class="t-stor">Tårnet raste</p><p>${tall(poeng)} poeng · ${tall(linjer)} linjer · nivå ${niva}</p><p class="dempet" id="te-lagret"></p><div class="t-knapper"><button class="knapp" type="button" data-ny>Prøv igjen</button></div>`;
    meldingEl.hidden = false;
    const ok = await lagre();
    const l = document.getElementById("te-lagret");
    if (l) l.innerHTML = ok ? "Ført i protokollen." + premieTekst(ok) : (typeof MEG === "undefined" || !MEG) ? `<a href="salongen.html">Logg inn</a> for å komme på tavlen.` : "";
  }
  async function avbryt() {
    if (tilstand !== "over" && poeng >= 500) await lagre();
    nyttSpill();
  }

  // ---------- Tavlen ----------
  function minRekordServer() {
    if (!data || typeof MEG === "undefined" || !MEG) return 0;
    const r = data.alle.find((x) => x.navn === MEG);
    return r ? r.poeng : 0;
  }
  function liste(rader, tom) {
    return rader.length
      ? `<table class="tavle t-tavle"><thead><tr><th>#</th><th>Spiller</th><th>Poeng</th><th>Linjer</th></tr></thead><tbody>${rader.map((r, i) =>
          `<tr${r.navn === MEG ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(r.navn)}</td><td>${tall(r.poeng)}</td><td>${tall(r.linjer)}</td></tr>`).join("")}</tbody></table>`
      : `<p class="tomt">${tom}</p>`;
  }
  function visTavle() {
    const topp = data.alle[0], leder = data.uke[0];
    const krone = (tittel, r) => `<div class="t-krone"><span>${tittel}</span>${r ? `<strong>${tall(r.poeng)}</strong><em>${esc(r.navn)}</em>` : `<strong>·</strong><em>Ledig</em>`}</div>`;
    tavle.innerHTML = `<div class="t-kroner">${krone("Rekorden", topp)}${krone("Ukens leder", leder)}</div>
      <h3 class="t-undertittel">Denne uka</h3>${liste(data.uke, "Ingen har spilt denne uka. Ledig førsteplass.")}
      <p class="dempet t-fot">Uka starter mandag.</p>
      <h3 class="t-undertittel">Alle tider</h3>${liste(data.alle, "Ingen har spilt ennå.")}
      <p class="dempet t-fot">${tall(data.antall)} spill totalt.</p>`;
  }
  async function lastTavle() {
    if (!(await hvemErJeg())) {
      tavle.innerHTML = `<p class="dempet">Tavlen er bare for brødrene. <a href="salongen.html">Logg inn</a> for å se den og komme på den.</p>`;
      return;
    }
    try {
      data = await api("tetris");
      visTavle();
      oppdaterTall();
      if (!rekordSpilt) startRekord = Math.max(startRekord, minRekordServer());
    } catch (e) {
      tavle.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`;
    }
  }

  // ---------- Taster ----------
  function trykkSide(navn, dx) {
    if (taster[navn]) return;
    taster[navn] = { tid: 0, n: 0 };
    flytt(dx);
  }
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
    const k = e.key;
    const spillTast = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "Enter", "x", "z", "c", "Shift", "p", "Escape"].includes(k);
    if (!spillTast) return;
    e.preventDefault();
    if (tilstand === "over") { if (k === " " || k === "Enter") nyttSpill(); return; }
    if (tilstand === "klar" || tilstand === "pause") { if (k !== "Shift") start(); return; }
    if (e.repeat && ["ArrowLeft", "ArrowRight", "ArrowUp", "x", "z", " ", "c", "Shift"].includes(k)) return;
    if (k === "ArrowLeft") trykkSide("venstre", -1);
    else if (k === "ArrowRight") trykkSide("hoyre", 1);
    else if (k === "ArrowDown") taster.ned = true;
    else if (k === "ArrowUp" || k === "x") roter(1);
    else if (k === "z") roter(-1);
    else if (k === " ") hardtFall();
    else if (k === "c" || k === "Shift") hold();
    else if (k === "p" || k === "Escape") tilstand = "pause";
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") taster.venstre = null;
    else if (e.key === "ArrowRight") taster.hoyre = null;
    else if (e.key === "ArrowDown") taster.ned = false;
  });
  const pause = () => { taster.venstre = taster.hoyre = null; taster.ned = false; if (tilstand === "spiller") tilstand = "pause"; };
  window.addEventListener("blur", pause);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  // ---------- Berøring: dra for å flytte, trykk for å snu, sveip ned for å slippe ----------
  let dra = null;
  lerret.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const r = lerret.getBoundingClientRect();
    dra = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), flyttet: false, celle: r.width / W * C, lx: ((e.clientX - r.left) / r.width) * W };
    try { lerret.setPointerCapture(e.pointerId); } catch (_) {}
  });
  lerret.addEventListener("pointermove", (e) => {
    if (!dra || !kanStyre()) return;
    while (e.clientX - dra.x >= dra.celle) { dra.x += dra.celle; flytt(1); dra.flyttet = true; }
    while (dra.x - e.clientX >= dra.celle) { dra.x -= dra.celle; flytt(-1); dra.flyttet = true; }
    while (e.clientY - dra.y >= dra.celle) { dra.y += dra.celle; myktFall(); dra.flyttet = true; }
    if (dra.y - e.clientY > dra.celle) dra.y = e.clientY;
  });
  lerret.addEventListener("pointerup", (e) => {
    if (!dra) return;
    const tid = performance.now() - dra.t, dx = e.clientX - dra.x0, dy = e.clientY - dra.y0;
    const d = dra; dra = null;
    if (tilstand === "over") return;
    if (tilstand !== "spiller") { start(); return; }
    if (tid < 260 && dy > 70 && Math.abs(dy) > Math.abs(dx) * 1.5) { hardtFall(); return; }
    if (tid < 260 && -dy > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) { hold(); return; }
    if (!d.flyttet && Math.hypot(dx, dy) < 12) {
      if (d.lx > BW) hold();
      else roter(d.lx < BW * 0.33 && e.pointerType !== "mouse" ? -1 : 1);
    }
  });
  lerret.addEventListener("pointercancel", () => { dra = null; });

  // Knapper under brettet (vises på mobil)
  const knappeRad = document.getElementById("te-knapper");
  if (knappeRad) {
    let gjenta = null;
    const stopp = () => { clearTimeout(gjenta); clearInterval(gjenta); gjenta = null; taster.ned = false; };
    knappeRad.addEventListener("pointerdown", (e) => {
      const b = e.target.closest("button[data-g]");
      if (!b) return;
      e.preventDefault();
      if (tilstand === "klar" || tilstand === "pause") { start(); return; }
      const g = b.dataset.g;
      stopp();
      if (g === "v" || g === "h") {
        const dx = g === "v" ? -1 : 1;
        flytt(dx);
        gjenta = setTimeout(() => { gjenta = setInterval(() => flytt(dx), ARR * 1000); }, DAS * 1000);
      } else if (g === "ned") taster.ned = true;
      else if (g === "snu") roter(1);
      else if (g === "slipp") hardtFall();
      else if (g === "hold") hold();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((t) => knappeRad.addEventListener(t, stopp));
  }

  meldingEl.addEventListener("click", (e) => { if (e.target.closest("[data-ny]")) nyttSpill(); });
  document.getElementById("te-ny").addEventListener("click", (e) => { e.currentTarget.blur(); avbryt(); });
  window.addEventListener("resize", tilpass);

  LYD.knapp(document.getElementById("te-lyd"));
  tilpass();
  nyttSpill();
  requestAnimationFrame(ramme);
  lastTavle();
})();
