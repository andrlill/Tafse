// SNAKE: styr slangen, spis druer og bli lengre. Treffer du muren eller deg selv, er det slutt.
// Slangen går litt fortere for hver drue. Hver femte drue legger en gulldrakme på brettet en kort stund.

(() => {
  const N = 20, C = 24, W = N * C, H = N * C;
  const LAGRING = "tafse-snake";
  const lerret = document.getElementById("s-lerret");
  const ctx = lerret.getContext("2d");
  const poengEl = document.getElementById("s-poeng");
  const rekordEl = document.getElementById("s-rekord");
  const meldingEl = document.getElementById("s-melding");
  const tavle = document.getElementById("s-tavle");

  // ---------- Regler (endres her) ----------
  const START_TAKT = 0.15;     // sekunder per steg i starten
  const MIN_TAKT = 0.09;       // raskeste fart (rundt elleve steg i sekundet)
  const TAKT_PER_DRUE = 0.0012; // full fart nås etter femti druer
  const DRUE_POENG = 10;
  const DRAKME_HVER = 5;       // en drakme dukker opp etter hver femte drue
  const DRAKME_TID = 6;        // sekunder før drakmen forsvinner
  const DRAKME_POENG = 50;     // minst halvparten, mer jo raskere du er

  let slange, retning, ko, drue, drakme, poeng, spist, tilstand, akk, lagret, beskjed, beskjedTid, dodsarsak;
  let rekord = 0, rekordSpilt = false, startRekord = 0, data = null;
  const tall = (n) => n.toLocaleString("nb-NO");
  try { rekord = Number(localStorage.getItem(LAGRING)) || 0; } catch (_) {}

  // ---------- Oppsett ----------
  const opptatt = (x, y) => slange.some((s) => s.x === x && s.y === y);
  function ledigRute() {
    const ledige = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
      if (!opptatt(x, y) && !(drue && drue.x === x && drue.y === y) && !(drakme && drakme.x === x && drakme.y === y)) ledige.push({ x, y });
    return ledige.length ? ledige[Math.floor(Math.random() * ledige.length)] : null;
  }
  function nyttSpill() {
    slange = [{ x: 7, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 10 }];
    retning = { x: 1, y: 0 };
    ko = [];
    drue = null; drakme = null;
    drue = ledigRute();
    poeng = 0; spist = 0; akk = 0; lagret = false; rekordSpilt = false;
    startRekord = Math.max(rekord, minRekordServer());
    tilstand = "klar";
    beskjedTid = 0;
    meldingEl.hidden = true;
    oppdaterTall();
  }
  const takt = () => Math.max(MIN_TAKT, START_TAKT - spist * TAKT_PER_DRUE);
  function visBeskjed(t) { beskjed = t; beskjedTid = 1.3; }
  function oppdaterTall() {
    poengEl.textContent = tall(poeng);
    rekordEl.textContent = tall(Math.max(rekord, poeng, minRekordServer()));
  }

  // ---------- Styring ----------
  function styr(dx, dy) {
    if (tilstand === "over") return;
    if (tilstand === "pause") { tilstand = "spiller"; return; }
    const siste = ko.length ? ko[ko.length - 1] : retning;
    if ((dx === siste.x && dy === siste.y) || (dx === -siste.x && dy === -siste.y)) {
      if (tilstand === "klar" && dx === siste.x && dy === siste.y) start();
      return;
    }
    if (ko.length < 3) ko.push({ x: dx, y: dy });
    if (tilstand === "klar") start();
  }
  function start() {
    tilstand = "spiller";
    akk = 0;
    lerret.focus({ preventScroll: true });
  }

  // ---------- Ett steg ----------
  function steg() {
    if (ko.length) retning = ko.shift();
    const hode = slange[0];
    const ny = { x: hode.x + retning.x, y: hode.y + retning.y };
    if (ny.x < 0 || ny.y < 0 || ny.x >= N || ny.y >= N) return slutt("Rett i muren");
    const vokser = drue && ny.x === drue.x && ny.y === drue.y;
    const kropp = vokser ? slange : slange.slice(0, -1);
    if (kropp.some((s) => s.x === ny.x && s.y === ny.y)) return slutt("Slangen bet seg selv");
    slange.unshift(ny);
    if (vokser) {
      spist += 1;
      poeng += DRUE_POENG;
      LYD.spill("spis", spist);
      drue = ledigRute();
      if (spist % DRAKME_HVER === 0 && !drakme) {
        const r = ledigRute();
        if (r) drakme = { ...r, tid: DRAKME_TID };
      }
      if (spist % 10 === 0) visBeskjed(`${slange.length} lang`);
      if (!drue) { poeng += 1000; return slutt("Brettet er fullt"); }
    } else slange.pop();
    if (drakme && ny.x === drakme.x && ny.y === drakme.y) {
      const verdi = Math.round(DRAKME_POENG * (0.5 + 0.5 * (drakme.tid / DRAKME_TID)) / 5) * 5;
      poeng += verdi;
      drakme = null;
      LYD.spill("bonus");
      visBeskjed(`+${verdi}`);
    }
    if (!rekordSpilt && startRekord > 0 && poeng > startRekord) { rekordSpilt = true; setTimeout(() => LYD.spill("rekord"), 120); }
    oppdaterTall();
  }

  function oppdater(dt) {
    if (beskjedTid > 0) beskjedTid -= dt;
    if (tilstand !== "spiller") return;
    if (drakme) { drakme.tid -= dt; if (drakme.tid <= 0) drakme = null; }
    akk += dt;
    let n = 0;
    while (akk >= takt() && tilstand === "spiller" && n++ < 4) { akk -= takt(); steg(); }
  }

  // ---------- Tegning ----------
  const GULL = [[243, 220, 155], [111, 90, 44]];
  function segmentFarge(i) {
    const t = slange.length > 1 ? i / (slange.length - 1) : 0;
    const [a, b] = GULL;
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;
  }
  function tegnDrue(x, y) {
    const cx = x * C + C / 2, cy = y * C + C / 2 + 1;
    ctx.fillStyle = "#7d8b3a";
    ctx.fillRect(cx - 1, cy - 10, 2, 5);
    ctx.beginPath(); ctx.ellipse(cx + 4, cy - 8, 4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8e2f45";
    for (const [dx, dy] of [[-4, -3], [4, -3], [0, -3], [-2, 2], [2, 2], [0, 6]]) {
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 3.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.beginPath(); ctx.arc(cx - 5, cy - 4, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  function tegnDrakme(d) {
    const cx = d.x * C + C / 2, cy = d.y * C + C / 2;
    const blink = d.tid < 1.5 && Math.floor(d.tid * 6) % 2 === 0;
    if (blink) return;
    ctx.fillStyle = "#e2c174";
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8c7033"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#6f5a2c";
    ctx.font = "700 9px Cinzel, Georgia, serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Δ", cx, cy + 0.5);
    ctx.textBaseline = "alphabetic";
    // Tiden som er igjen
    ctx.strokeStyle = "#f3dc9b"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (d.tid / DRAKME_TID)); ctx.stroke();
  }
  function tegn() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.018)";
    for (let y = 0; y < N; y++) for (let x = (y % 2); x < N; x += 2) ctx.fillRect(x * C, y * C, C, C);
    if (drue) tegnDrue(drue.x, drue.y);
    if (drakme) tegnDrakme(drakme);
    // Slangen: hvert ledd, og en bro mot neste ledd så kroppen henger sammen
    const inn = 3;
    for (let i = slange.length - 1; i >= 0; i--) {
      const s = slange[i];
      ctx.fillStyle = segmentFarge(i);
      ctx.fillRect(s.x * C + inn, s.y * C + inn, C - 2 * inn, C - 2 * inn);
      const f = slange[i - 1];
      if (f) {
        const x0 = Math.min(s.x, f.x) * C + inn, y0 = Math.min(s.y, f.y) * C + inn;
        if (s.x !== f.x) ctx.fillRect(x0 + C / 2, y0, C - 2 * inn, C - 2 * inn);
        else ctx.fillRect(x0, y0 + C / 2, C - 2 * inn, C - 2 * inn);
      }
    }
    // Øyne
    const h = slange[0], cx = h.x * C + C / 2, cy = h.y * C + C / 2;
    const px = -retning.y, py = retning.x;
    ctx.fillStyle = "#0b0b0a";
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.arc(cx + retning.x * 4 + px * side * 4.5, cy + retning.y * 4 + py * side * 4.5, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.textAlign = "center";
    if (beskjedTid > 0 && tilstand === "spiller") {
      ctx.globalAlpha = Math.min(1, beskjedTid / 0.4);
      ctx.font = "700 30px Cinzel, Georgia, serif";
      ctx.fillStyle = "#e2c174";
      ctx.fillText(beskjed, W / 2, H * 0.3);
      ctx.globalAlpha = 1;
    }
    if (tilstand === "klar" || tilstand === "pause") {
      ctx.fillStyle = "rgba(11,11,10,.55)";
      ctx.fillRect(0, H * 0.36, W, 92);
      ctx.font = "700 26px Cinzel, Georgia, serif";
      ctx.fillStyle = "#e2c174";
      ctx.fillText(tilstand === "pause" ? "Pause" : "Snake", W / 2, H * 0.36 + 38);
      ctx.font = "italic 18px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "#b3a991";
      ctx.fillText(tilstand === "pause" ? "Trykk eller piltast for å fortsette" : "Piltast eller sveip for å starte", W / 2, H * 0.36 + 68);
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
    const dt = Math.min(0.1, (t - forrige) / 1000 || 0);
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
      const svar = await api("snake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poeng, lengde: slange.length }) });
      lastTavle();
      return svar || true;
    } catch (_) { lagret = false; return false; }
  }
  async function slutt(arsak) {
    tilstand = "over";
    dodsarsak = arsak;
    LYD.spill("tapt");
    oppdaterTall();
    meldingEl.innerHTML = `<p class="t-stor">${esc(dodsarsak)}</p><p>${tall(poeng)} poeng · ${slange.length} ledd lang</p><p class="dempet" id="s-lagret"></p><div class="t-knapper"><button class="knapp" type="button" data-ny>Prøv igjen</button></div>`;
    meldingEl.hidden = false;
    const ok = await lagre();
    const l = document.getElementById("s-lagret");
    if (l) l.innerHTML = ok ? "Ført i protokollen." + premieTekst(ok) : (typeof MEG === "undefined" || !MEG) ? `<a href="salongen.html">Logg inn</a> for å komme på tavlen.` : "";
  }
  async function avbryt() {
    if (tilstand !== "over" && poeng >= 50) await lagre();
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
      ? `<table class="tavle t-tavle"><thead><tr><th>#</th><th>Spiller</th><th>Poeng</th><th>Lengde</th></tr></thead><tbody>${rader.map((r, i) =>
          `<tr${r.navn === MEG ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(r.navn)}</td><td>${tall(r.poeng)}</td><td>${r.lengde}</td></tr>`).join("")}</tbody></table>`
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
      data = await api("snake");
      visTavle();
      oppdaterTall();
      if (!rekordSpilt) startRekord = Math.max(startRekord, minRekordServer());
    } catch (e) {
      tavle.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`;
    }
  }

  // ---------- Taster og sveip ----------
  const RETNINGER = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
    const r = RETNINGER[e.key];
    if (r) { e.preventDefault(); styr(r[0], r[1]); return; }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (tilstand === "over") nyttSpill();
      else if (tilstand === "klar" || tilstand === "pause") start();
    } else if (e.key === "p" || e.key === "Escape") {
      if (tilstand === "spiller") tilstand = "pause";
      else if (tilstand === "pause") start();
    }
  });
  let sveip = null;
  lerret.addEventListener("pointerdown", (e) => {
    sveip = { x: e.clientX, y: e.clientY, brukt: false };
    try { lerret.setPointerCapture(e.pointerId); } catch (_) {}
  });
  lerret.addEventListener("pointermove", (e) => {
    if (!sveip || sveip.brukt) return;
    const dx = e.clientX - sveip.x, dy = e.clientY - sveip.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) styr(dx > 0 ? 1 : -1, 0); else styr(0, dy > 0 ? 1 : -1);
    // Nytt utgangspunkt, så man kan svinge flere ganger uten å slippe
    sveip = { x: e.clientX, y: e.clientY, brukt: false };
  });
  lerret.addEventListener("pointerup", () => {
    if (sveip && (tilstand === "klar" || tilstand === "pause")) start();
    sveip = null;
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && tilstand === "spiller") tilstand = "pause"; });
  window.addEventListener("blur", () => { if (tilstand === "spiller") tilstand = "pause"; });
  meldingEl.addEventListener("click", (e) => { if (e.target.closest("[data-ny]")) nyttSpill(); });
  document.getElementById("s-ny").addEventListener("click", (e) => { e.currentTarget.blur(); avbryt(); });
  window.addEventListener("resize", tilpass);

  LYD.knapp(document.getElementById("s-lyd"));
  tilpass();
  nyttSpill();
  requestAnimationFrame(ramme);
  lastTavle();
})();
