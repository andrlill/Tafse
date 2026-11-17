// MURBREKKER: styr plattformen, hold ballen i spill og knus muren.
// Tre liv. Hvert nivå har flere rader, raskere ball og flere marmorklosser som tåler to slag.

(() => {
  const W = 480, H = 600;
  const LAGRING = "tafse-murbrekker";
  const lerret = document.getElementById("m-lerret");
  const ctx = lerret.getContext("2d");
  const poengEl = document.getElementById("m-poeng");
  const rekordEl = document.getElementById("m-rekord");
  const meldingEl = document.getElementById("m-melding");
  const tavle = document.getElementById("m-tavle");

  // ---------- Regler (endres her) ----------
  const LIV = 3;
  const KOL = 10, KANT = 12, GLIPE = 4, KLOSS_H = 16, MUR_TOPP = 58;
  const KLOSS_B = (W - 2 * KANT - (KOL - 1) * GLIPE) / KOL;
  const BALL_R = 6;
  const GRUNNFART = 310;       // piksler i sekundet på nivå 1
  const FART_PER_NIVA = 0.07;  // ballen går så mye fortere for hvert nivå
  const FART_PER_KLOSS = 0.004;
  const PLATTFORM_Y = H - 38, PLATTFORM_H = 10;
  const TASTEFART = 560;
  const FARGER = ["#f3dc9b", "#e2c174", "#c9a24a", "#a8863b", "#8c7033", "#6f5a2c", "#5a4a26", "#4a3f25"];

  let klosser, ball, plattform, poeng, liv, niva, tilstand, knust, lagret, beskjed, beskjedTid;
  let rekord = 0, rekordSpilt = false, startRekord = 0, data = null;
  const taster = { venstre: false, hoyre: false };
  const tall = (n) => n.toLocaleString("nb-NO");

  try { rekord = Number(localStorage.getItem(LAGRING)) || 0; } catch (_) {}

  // ---------- Oppsett ----------
  function byggMur() {
    const rader = Math.min(4 + niva, 8);
    klosser = [];
    for (let r = 0; r < rader; r++) for (let k = 0; k < KOL; k++) {
      const marmor = (niva >= 2 && r === 0) || (niva >= 4 && r === 1) || (niva >= 6 && (r + k) % 2 === 0);
      klosser.push({
        x: KANT + k * (KLOSS_B + GLIPE), y: MUR_TOPP + r * (KLOSS_H + GLIPE),
        slag: marmor ? 2 : 1, marmor, poeng: (rader - r) * 10, farge: FARGER[Math.min(r + (8 - rader), 7)],
      });
    }
    knust = 0;
  }
  function leggBallPaPlattform() {
    ball = { x: plattform.x, y: PLATTFORM_Y - BALL_R, vx: 0, vy: 0 };
    tilstand = "klar";
  }
  function nyttSpill() {
    poeng = 0; liv = LIV; niva = 1; lagret = false; rekordSpilt = false;
    startRekord = Math.max(rekord, minRekordServer());
    plattform = { x: W / 2, b: 86 };
    byggMur();
    leggBallPaPlattform();
    visBeskjed("Nivå 1");
    meldingEl.hidden = true;
    oppdaterTall();
  }
  const fart = () => GRUNNFART * (1 + FART_PER_NIVA * (niva - 1)) * Math.min(1.3, 1 + FART_PER_KLOSS * knust);
  function visBeskjed(t) { beskjed = t; beskjedTid = 1.6; }
  function oppdaterTall() {
    poengEl.textContent = tall(poeng);
    rekordEl.textContent = tall(Math.max(rekord, poeng, minRekordServer()));
  }

  function send() {
    if (tilstand !== "klar") return;
    const v = (Math.random() * 0.5 - 0.25);
    ball.vx = Math.sin(v) * fart();
    ball.vy = -Math.cos(v) * fart();
    tilstand = "spiller";
    lerret.focus({ preventScroll: true });
  }

  // ---------- Fysikk ----------
  function settFart() {
    const f = fart(), n = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = (ball.vx / n) * f;
    ball.vy = (ball.vy / n) * f;
    // Unngå at ballen går nesten vannrett
    if (Math.abs(ball.vy) < f * 0.18) {
      ball.vy = (ball.vy < 0 ? -1 : 1) * f * 0.18;
      ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(f * f - ball.vy * ball.vy);
    }
  }

  function steg(dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    // Vegger
    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); LYD.spill("vegg"); }
    else if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); LYD.spill("vegg"); }
    if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); LYD.spill("vegg"); }
    // Plattformen: vinkelen avhenger av hvor på plattformen ballen treffer
    if (ball.vy > 0 && ball.y + BALL_R >= PLATTFORM_Y && ball.y - BALL_R <= PLATTFORM_Y + PLATTFORM_H &&
        ball.x >= plattform.x - plattform.b / 2 - BALL_R && ball.x <= plattform.x + plattform.b / 2 + BALL_R) {
      const rel = Math.max(-1, Math.min(1, (ball.x - plattform.x) / (plattform.b / 2)));
      const v = rel * (Math.PI / 3);
      ball.vx = Math.sin(v) * fart();
      ball.vy = -Math.cos(v) * fart();
      ball.y = PLATTFORM_Y - BALL_R;
      LYD.spill("sprett");
    }
    // Klosser: én per steg
    for (const k of klosser) {
      if (k.slag <= 0) continue;
      const nx = Math.max(k.x, Math.min(ball.x, k.x + KLOSS_B)), ny = Math.max(k.y, Math.min(ball.y, k.y + KLOSS_H));
      const dx = ball.x - nx, dy = ball.y - ny;
      if (dx * dx + dy * dy > BALL_R * BALL_R) continue;
      if (Math.abs(dx) > Math.abs(dy)) ball.vx = Math.sign(dx) * Math.abs(ball.vx);
      else ball.vy = (dy === 0 ? -Math.sign(ball.vy) : Math.sign(dy)) * Math.abs(ball.vy);
      k.slag -= 1;
      if (k.slag <= 0) {
        poeng += k.poeng;
        knust += 1;
        LYD.spill("kloss", k.poeng / 10);
        settFart();
        if (!rekordSpilt && startRekord > 0 && poeng > startRekord) { rekordSpilt = true; setTimeout(() => LYD.spill("rekord"), 150); }
      } else LYD.spill("marmor");
      oppdaterTall();
      break;
    }
    // Mistet ballen
    if (ball.y - BALL_R > H) {
      liv -= 1;
      if (liv <= 0) return slutt();
      LYD.spill("mistet");
      leggBallPaPlattform();
      visBeskjed(liv === 1 ? "Siste ball" : `${liv} baller igjen`);
      return;
    }
    // Muren er knust
    if (klosser.every((k) => k.slag <= 0)) {
      poeng += 100 * niva;
      niva += 1;
      plattform.b = Math.max(62, 86 - (niva - 1) * 4);
      byggMur();
      leggBallPaPlattform();
      LYD.spill("niva");
      visBeskjed(`Nivå ${niva}`);
      oppdaterTall();
    }
  }

  function oppdater(dt) {
    const retning = (taster.hoyre ? 1 : 0) - (taster.venstre ? 1 : 0);
    if (retning && tilstand !== "over") flyttPlattform(plattform.x + retning * TASTEFART * dt);
    if (beskjedTid > 0) beskjedTid -= dt;
    if (tilstand === "klar") { ball.x = plattform.x; ball.y = PLATTFORM_Y - BALL_R; }
    if (tilstand !== "spiller") return;
    // Små steg, så ballen ikke går tvers gjennom en kloss
    const n = Math.max(1, Math.ceil((fart() * dt) / 4));
    for (let i = 0; i < n && tilstand === "spiller"; i++) steg(dt / n);
  }
  function flyttPlattform(x) {
    plattform.x = Math.max(plattform.b / 2, Math.min(W - plattform.b / 2, x));
  }

  // ---------- Tegning ----------
  function tegn() {
    ctx.clearRect(0, 0, W, H);
    for (const k of klosser) {
      if (k.slag <= 0) continue;
      if (k.marmor && k.slag === 2) {
        ctx.fillStyle = "#ece4d2";
        ctx.fillRect(k.x, k.y, KLOSS_B, KLOSS_H);
        ctx.fillStyle = "rgba(11,11,10,.18)";
        ctx.fillRect(k.x, k.y + KLOSS_H - 4, KLOSS_B, 4);
      } else if (k.marmor) {
        ctx.strokeStyle = "#ece4d2";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(k.x + 0.75, k.y + 0.75, KLOSS_B - 1.5, KLOSS_H - 1.5);
        ctx.beginPath(); ctx.moveTo(k.x + 8, k.y + 2); ctx.lineTo(k.x + 16, k.y + 8); ctx.lineTo(k.x + 12, k.y + KLOSS_H - 2); ctx.stroke();
      } else {
        ctx.fillStyle = k.farge;
        ctx.fillRect(k.x, k.y, KLOSS_B, KLOSS_H);
      }
    }
    // Plattform og ball
    ctx.fillStyle = "#c9a24a";
    ctx.fillRect(plattform.x - plattform.b / 2, PLATTFORM_Y, plattform.b, PLATTFORM_H);
    ctx.fillStyle = "#e2c174";
    ctx.fillRect(plattform.x - plattform.b / 2, PLATTFORM_Y, plattform.b, 2);
    ctx.fillStyle = "#ece4d2";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    // Liv og nivå
    ctx.fillStyle = "#c9a24a";
    for (let i = 0; i < LIV; i++) {
      ctx.beginPath(); ctx.arc(KANT + 6 + i * 18, 26, 5, 0, Math.PI * 2);
      if (i < liv) ctx.fill(); else { ctx.strokeStyle = "#4a3f25"; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    ctx.font = "600 13px Cinzel, Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText(`NIVÅ ${niva}`, W - KANT, 31);
    ctx.textAlign = "center";
    if (beskjedTid > 0 && tilstand !== "over") {
      ctx.globalAlpha = Math.min(1, beskjedTid / 0.5);
      ctx.font = "700 30px Cinzel, Georgia, serif";
      ctx.fillStyle = "#e2c174";
      ctx.fillText(beskjed, W / 2, H * 0.56);
      ctx.globalAlpha = 1;
    }
    if (tilstand === "klar") {
      ctx.font = "italic 18px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "#9c937e";
      ctx.fillText("Trykk for å sende ballen", W / 2, H * 0.56 + 34);
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
    const dt = Math.min(0.033, (t - forrige) / 1000 || 0);
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
      const svar = await api("murbrekker", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poeng, niva }) });
      lastTavle();
      return svar || true;
    } catch (_) { lagret = false; return false; }
  }
  async function slutt() {
    tilstand = "over";
    LYD.spill("tapt");
    oppdaterTall();
    meldingEl.innerHTML = `<p class="t-stor">Muren vant</p><p>${tall(poeng)} poeng · nivå ${niva}</p><p class="dempet" id="m-lagret"></p><div class="t-knapper"><button class="knapp" type="button" data-ny>Prøv igjen</button></div>`;
    meldingEl.hidden = false;
    const ok = await lagre();
    const l = document.getElementById("m-lagret");
    if (l) l.innerHTML = ok ? "Ført i protokollen." + premieTekst(ok) : (typeof MEG === "undefined" || !MEG) ? `<a href="salongen.html">Logg inn</a> for å komme på tavlen.` : "";
  }
  // Et spill som avbrytes teller også, hvis det er verdt noe
  async function avbryt() {
    if (tilstand !== "over" && poeng >= 200) await lagre();
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
      ? `<table class="tavle t-tavle"><thead><tr><th>#</th><th>Spiller</th><th>Poeng</th><th>Nivå</th></tr></thead><tbody>${rader.map((r, i) =>
          `<tr${r.navn === MEG ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(r.navn)}</td><td>${tall(r.poeng)}</td><td>${r.niva}</td></tr>`).join("")}</tbody></table>`
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
      data = await api("murbrekker");
      visTavle();
      oppdaterTall();
      if (!rekordSpilt) startRekord = Math.max(startRekord, minRekordServer());
    } catch (e) {
      tavle.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`;
    }
  }

  // ---------- Styring ----------
  const tilX = (e) => { const r = lerret.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W; };
  lerret.addEventListener("pointermove", (e) => { if (tilstand !== "over") flyttPlattform(tilX(e)); });
  lerret.addEventListener("pointerdown", (e) => { if (tilstand !== "over") flyttPlattform(tilX(e)); try { lerret.setPointerCapture(e.pointerId); } catch (_) {} });
  lerret.addEventListener("pointerup", () => send());
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
    if (e.key === "ArrowLeft" || e.key === "a") { taster.venstre = true; e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d") { taster.hoyre = true; e.preventDefault(); }
    else if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp") { e.preventDefault(); if (tilstand === "over") nyttSpill(); else send(); }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") taster.venstre = false;
    else if (e.key === "ArrowRight" || e.key === "d") taster.hoyre = false;
  });
  window.addEventListener("blur", () => { taster.venstre = taster.hoyre = false; });
  meldingEl.addEventListener("click", (e) => { if (e.target.closest("[data-ny]")) nyttSpill(); });
  document.getElementById("m-ny").addEventListener("click", (e) => { e.currentTarget.blur(); avbryt(); });
  window.addEventListener("resize", tilpass);

  LYD.knapp(document.getElementById("m-lyd"));
  tilpass();
  nyttSpill();
  requestAnimationFrame(ramme);
  lastTavle();
})();
