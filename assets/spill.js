// IDUS MARTIAE – et lite spill om Cæsars siste dag.
// Beveg Cæsar med piltaster/WASD (eller fingeren), sidesteg med mellomrom.
// Overlev 60 sekunder til Marcus Antonius kommer. 23 sår eller Brutus' dolk, og det er over.
// Poeng: +1 per sekund overlevd, +1 per kollega som blir truffet, −1 per knivstikk.

(() => {
  const lerret = document.getElementById("spill");
  const ctx = lerret.getContext("2d");
  const skjerm = document.getElementById("skjerm");
  const sidestegKnapp = document.getElementById("sidesteg");

  const FARGE = {
    bunn: "#0b0b0a",
    gull: "#c9a24a",
    gullLys: "#e2c174",
    toga: "#ece4d2",
    dempet: "#7d7462",
    blod: "#c0473a",
  };
  const MAKS_SAR = 23;
  const SEIERSTID = 60;
  const BRUTUS_TID = 32;
  const STEG_NED = 1.6; // sekunder før sidesteget er ladet igjen
  const poeng = () => Math.floor(Math.min(tid, SEIERSTID)) + kolleger - sar;

  let B = 0, H = 0, skala = 1; // logisk størrelse
  let arena = { x: 0, y: 0, r: 0 };

  function tilpass() {
    const bredde = lerret.parentElement.clientWidth;
    const smal = bredde < 640;
    const hoyde = smal
      ? Math.max(440, Math.min(Math.round(bredde * 1.35), Math.round(window.innerHeight * 0.75)))
      : Math.min(Math.round(bredde * 0.72), Math.round(window.innerHeight * 0.72));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lerret.style.width = bredde + "px";
    lerret.style.height = hoyde + "px";
    lerret.width = Math.round(bredde * dpr);
    lerret.height = Math.round(hoyde * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    B = bredde; H = hoyde;
    arena = { x: B / 2, y: H / 2 + 6, r: Math.min(B, H) / 2 - 18 };
    skala = Math.max(0.7, Math.min(1.15, arena.r / 300));
  }

  // ---------- Tilstand ----------
  let tilstand = "meny"; // meny | spiller | pause | slutt
  let tid, sar, kolleger, senatorer, partikler, tekster, cæsar, gytTimer, brutusKommet, sluttÅrsak, sisteTid;

  function nyttSpill() {
    tid = 0; sar = 0; kolleger = 0;
    senatorer = []; partikler = []; tekster = [];
    gytTimer = 1.2; brutusKommet = false; sluttÅrsak = null;
    cæsar = { x: arena.x, y: arena.y + arena.r * 0.15, r: 13, fart: 230, usårbar: 0, blink: 0, steg: 0, stegNed: 0, stegRetning: { x: 0, y: 0 } };
    tilstand = "spiller";
    skjerm.hidden = true;
    sisteTid = performance.now();
    lagTekst("15. mars 44 f.Kr.", arena.x, arena.y - arena.r * 0.35, FARGE.gull, 2.2, 18);
  }

  // ---------- Kontroller ----------
  const taster = new Set();
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(k) && tilstand === "spiller") e.preventDefault();
    taster.add(k);
    if (k === " " && tilstand === "spiller") sidesteg();
    if ((k === "enter" || k === " ") && (tilstand === "meny" || tilstand === "slutt") && document.activeElement === document.body) { e.preventDefault(); nyttSpill(); }
    if (k === "p" && (tilstand === "spiller" || tilstand === "pause")) tilstand = tilstand === "pause" ? "spiller" : "pause";
  });
  window.addEventListener("keyup", (e) => taster.delete(e.key.toLowerCase()));

  let finger = null;
  function fingerPos(e) {
    const r = lerret.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  lerret.addEventListener("pointerdown", (e) => {
    if (tilstand !== "spiller") return;
    if (e.pointerType !== "mouse") { finger = fingerPos(e); lerret.setPointerCapture(e.pointerId); }
  });
  lerret.addEventListener("pointermove", (e) => { if (finger) finger = fingerPos(e); });
  ["pointerup", "pointercancel"].forEach((t) => lerret.addEventListener(t, () => (finger = null)));
  sidestegKnapp.addEventListener("click", () => sidesteg());

  document.addEventListener("visibilitychange", () => { if (document.hidden && tilstand === "spiller") tilstand = "pause"; });
  lerret.addEventListener("click", () => { if (tilstand === "pause") { tilstand = "spiller"; sisteTid = performance.now(); } });

  function retning() {
    let x = 0, y = 0;
    if (taster.has("arrowleft") || taster.has("a")) x -= 1;
    if (taster.has("arrowright") || taster.has("d")) x += 1;
    if (taster.has("arrowup") || taster.has("w")) y -= 1;
    if (taster.has("arrowdown") || taster.has("s")) y += 1;
    if (!x && !y && finger) {
      const dx = finger.x - cæsar.x, dy = finger.y - cæsar.y;
      const l = Math.hypot(dx, dy);
      if (l > 6) return { x: dx / l, y: dy / l, styrke: Math.min(1, l / 40) };
    }
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l, styrke: x || y ? 1 : 0 };
  }

  function sidesteg() {
    if (tilstand !== "spiller" || cæsar.stegNed > 0) return;
    const r = retning();
    let x = r.x, y = r.y;
    if (!r.styrke) {
      // Uten retning: hopp vekk fra nærmeste senator
      const n = senatorer.filter((s) => !s.ute).sort((a, b) => avstand(a, cæsar) - avstand(b, cæsar))[0];
      if (n) { const l = avstand(n, cæsar) || 1; x = (cæsar.x - n.x) / l; y = (cæsar.y - n.y) / l; }
      else { x = 0; y = -1; }
    }
    cæsar.steg = 0.17;
    cæsar.stegNed = STEG_NED;
    cæsar.stegRetning = { x, y };
    for (let i = 0; i < 6; i++) partikkel(cæsar.x, cæsar.y, FARGE.gull, 60, 0.35, 1.5);
  }

  // ---------- Hjelpere ----------
  const avstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const tilfeldig = (a, b) => a + Math.random() * (b - a);

  function iArena(o, margin = 0) {
    const dx = o.x - arena.x, dy = o.y - arena.y;
    const l = Math.hypot(dx, dy);
    const maks = arena.r - o.r - margin;
    if (l > maks) { o.x = arena.x + (dx / l) * maks; o.y = arena.y + (dy / l) * maks; }
  }

  function partikkel(x, y, farge, fart, liv, str = 2) {
    const v = tilfeldig(0, Math.PI * 2), f = tilfeldig(fart * 0.3, fart);
    partikler.push({ x, y, vx: Math.cos(v) * f, vy: Math.sin(v) * f, liv, maksLiv: liv, farge, str });
  }

  function lagTekst(tekst, x, y, farge, liv = 1.2, str = 14) {
    tekster.push({ tekst, x, y, farge, liv, maksLiv: liv, str });
  }

  // ---------- Senatorer ----------
  function gyt(erBrutus = false) {
    const v = tilfeldig(0, Math.PI * 2);
    const f = Math.min(1, tid / 55);
    senatorer.push({
      x: arena.x + Math.cos(v) * (arena.r - 14),
      y: arena.y + Math.sin(v) * (arena.r - 14),
      r: erBrutus ? 12 : 11,
      brutus: erBrutus,
      fart: (erBrutus ? 112 : 68 + f * 52) * tilfeldig(0.9, 1.1),
      fase: "nærmer", // nærmer | løfter | støter | henter
      t: 0,
      støtRetning: { x: 0, y: 0 },
      sikte: 0,
      ute: 0,
      kurs: tilfeldig(-0.5, 0.5),
      inn: 0.4,
    });
  }

  function oppdaterSenator(s, dt) {
    if (s.ute) { s.ute -= dt; return; }
    if (s.inn > 0) s.inn -= dt;
    const dx = cæsar.x - s.x, dy = cæsar.y - s.y;
    const l = Math.hypot(dx, dy) || 1;
    s.sikte = Math.atan2(dy, dx);
    const f = Math.min(1, tid / 55);

    if (s.fase === "nærmer") {
      s.kurs += tilfeldig(-1, 1) * dt;
      s.kurs = Math.max(-0.6, Math.min(0.6, s.kurs));
      const v = s.sikte + s.kurs;
      s.x += Math.cos(v) * s.fart * dt;
      s.y += Math.sin(v) * s.fart * dt;
      if (l < 95 * skala && s.inn <= 0) { s.fase = "løfter"; s.t = s.brutus ? 0.42 : 0.48 - f * 0.12; }
    } else if (s.fase === "løfter") {
      s.t -= dt;
      s.x -= (dx / l) * 18 * dt; // tar sats bakover
      s.y -= (dy / l) * 18 * dt;
      if (s.t <= 0) { s.fase = "støter"; s.t = 0.2; s.støtRetning = { x: dx / l, y: dy / l }; }
    } else if (s.fase === "støter") {
      s.t -= dt;
      const fart = (s.brutus ? 640 : 560) * skala;
      s.x += s.støtRetning.x * fart * dt;
      s.y += s.støtRetning.y * fart * dt;
      if (Math.random() < 0.6) partikkel(s.x, s.y, FARGE.dempet, 20, 0.25, 1.2);
      // Treffer Cæsar?
      if (avstand(s, cæsar) < s.r + cæsar.r && cæsar.usårbar <= 0 && cæsar.steg <= 0) {
        if (s.brutus) return avslutt("brutus");
        sar += 1;
        cæsar.usårbar = 0.7;
        cæsar.blink = 0.7;
        for (let i = 0; i < 14; i++) partikkel(cæsar.x, cæsar.y, FARGE.blod, 140, 0.6, 2);
        lagTekst(romertall(sar), cæsar.x, cæsar.y - 26, FARGE.blod, 0.9, 15);
        s.fase = "henter"; s.t = 0.8;
        if (sar >= MAKS_SAR) return avslutt("sar");
      }
      // Treffer en kollega?
      for (const k of senatorer) {
        if (k === s || k.ute || k.brutus) continue;
        if (avstand(s, k) < s.r + k.r) {
          k.ute = 0.8;
          if (!s.brutus) s.ute = 0.8;
          kolleger += 1;
          for (let i = 0; i < 12; i++) partikkel(k.x, k.y, FARGE.toga, 110, 0.6, 1.6);
          lagTekst(s.brutus ? "Brutus traff en kollega" : "Kollega truffet", k.x, k.y - 22, FARGE.gullLys, 1.1, 13);
          break;
        }
      }
      if (s.t <= 0) { s.fase = "henter"; s.t = 0.7; }
    } else if (s.fase === "henter") {
      s.t -= dt;
      s.x += Math.cos(s.sikte) * s.fart * 0.3 * dt;
      s.y += Math.sin(s.sikte) * s.fart * 0.3 * dt;
      if (s.t <= 0) s.fase = "nærmer";
    }
    iArena(s);
  }

  function romertall(n) {
    const t = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let r = "";
    for (const [v, s] of t) while (n >= v) { r += s; n -= v; }
    return r;
  }

  // ---------- Hovedløkke ----------
  function oppdater(dt) {
    tid += dt;

    // Cæsar
    if (cæsar.steg > 0) {
      cæsar.steg -= dt;
      cæsar.x += cæsar.stegRetning.x * 680 * skala * dt;
      cæsar.y += cæsar.stegRetning.y * 680 * skala * dt;
    } else {
      const r = retning();
      cæsar.x += r.x * cæsar.fart * skala * r.styrke * dt;
      cæsar.y += r.y * cæsar.fart * skala * r.styrke * dt;
    }
    cæsar.stegNed = Math.max(0, cæsar.stegNed - dt);
    cæsar.usårbar = Math.max(0, cæsar.usårbar - dt);
    cæsar.blink = Math.max(0, cæsar.blink - dt);
    iArena(cæsar, 2);

    // Nye senatorer
    gytTimer -= dt;
    const aktive = senatorer.filter((s) => !s.ute).length;
    const intervall = Math.max(0.55, 2.0 - tid * 0.028);
    if (gytTimer <= 0 && aktive < 4 + Math.floor(tid / 9)) { gyt(); gytTimer = intervall; }
    if (!brutusKommet && tid >= BRUTUS_TID) {
      brutusKommet = true;
      gyt(true);
      lagTekst("Brutus har kommet inn", arena.x, arena.y - arena.r * 0.35, FARGE.gullLys, 2.2, 17);
    }

    for (const s of senatorer) {
      oppdaterSenator(s, dt);
      if (tilstand !== "spiller") return;
    }
    // Hold avstand mellom senatorer som ikke støter
    for (let i = 0; i < senatorer.length; i++) for (let j = i + 1; j < senatorer.length; j++) {
      const a = senatorer[i], b = senatorer[j];
      if (a.ute || b.ute || a.fase === "støter" || b.fase === "støter") continue;
      const d = avstand(a, b), min = a.r + b.r + 4;
      if (d < min && d > 0) {
        const p = (min - d) / 2, nx = (a.x - b.x) / d, ny = (a.y - b.y) / d;
        a.x += nx * p; a.y += ny * p; b.x -= nx * p; b.y -= ny * p;
      }
    }
    senatorer = senatorer.filter((s) => !(s.ute && s.ute <= 0));

    for (const p of partikler) { p.liv -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; }
    partikler = partikler.filter((p) => p.liv > 0);
    for (const t of tekster) { t.liv -= dt; t.y -= 14 * dt; }
    tekster = tekster.filter((t) => t.liv > 0);

    if (tid >= SEIERSTID) avslutt("seier");
  }

  // ---------- Tegning ----------
  function tegnArena() {
    ctx.fillStyle = FARGE.bunn;
    ctx.fillRect(0, 0, B, H);
    // Senatets benkerader
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(201,162,74,${0.1 + i * 0.06})`;
      ctx.setLineDash(i === 2 ? [] : [2, 6]);
      ctx.beginPath();
      ctx.arc(arena.x, arena.y, arena.r - i * 9 + 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(201,162,74,.55)";
    ctx.beginPath();
    ctx.arc(arena.x, arena.y, arena.r, 0, Math.PI * 2);
    ctx.stroke();
    // Pompeius' statue
    const sx = arena.x, sy = arena.y - arena.r + 26;
    ctx.fillStyle = "rgba(201,162,74,.22)";
    ctx.fillRect(sx - 14, sy - 6, 28, 12);
    ctx.fillStyle = "rgba(201,162,74,.5)";
    ctx.font = `500 9px Cinzel, Georgia, serif`;
    ctx.textAlign = "center";
    ctx.fillText("POMPEIUS", sx, sy + 22);
  }

  function tegnCæsar() {
    const c = cæsar;
    if (c.blink > 0 && Math.floor(c.blink * 14) % 2 === 0) return;
    // Sår som små streker langs kanten
    ctx.strokeStyle = FARGE.blod;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < sar; i++) {
      const v = (i / MAKS_SAR) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(c.x + Math.cos(v) * (c.r + 3), c.y + Math.sin(v) * (c.r + 3));
      ctx.lineTo(c.x + Math.cos(v) * (c.r + 7), c.y + Math.sin(v) * (c.r + 7));
      ctx.stroke();
    }
    // Ladering for sidesteget: fylles rundt Cæsar til det er klart igjen
    if (c.stegNed > 0) {
      ctx.strokeStyle = "rgba(201,162,74,.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = FARGE.gullLys;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r + 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - c.stegNed / STEG_NED));
      ctx.stroke();
    }
    ctx.fillStyle = c.steg > 0 ? FARGE.gullLys : FARGE.gull;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    // Laurbærkrans
    ctx.strokeStyle = FARGE.bunn;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r - 4, Math.PI * 0.75, Math.PI * 1.25 + Math.PI * 1);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const v = Math.PI * 0.85 + i * 0.26;
      ctx.beginPath();
      ctx.ellipse(c.x + Math.cos(v) * (c.r - 4), c.y + Math.sin(v) * (c.r - 4), 2.4, 1.1, v + 0.9, 0, Math.PI * 2);
      ctx.fillStyle = FARGE.bunn;
      ctx.fill();
      const v2 = Math.PI * 2.15 - i * 0.26;
      ctx.beginPath();
      ctx.ellipse(c.x + Math.cos(v2) * (c.r - 4), c.y + Math.sin(v2) * (c.r - 4), 2.4, 1.1, v2 - 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tegnSenator(s) {
    const alfa = s.ute ? Math.max(0, s.ute / 0.8) * 0.5 : s.inn > 0 ? 1 - s.inn / 0.4 : 1;
    ctx.globalAlpha = alfa;
    // Dolk
    const lengde = s.fase === "løfter" ? 17 : 13;
    const v = s.fase === "støter" ? Math.atan2(s.støtRetning.y, s.støtRetning.x) : s.sikte;
    ctx.strokeStyle = s.fase === "løfter" ? (Math.floor(s.t * 20) % 2 ? FARGE.toga : FARGE.gullLys) : "#9b927f";
    ctx.lineWidth = s.fase === "løfter" ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.moveTo(s.x + Math.cos(v) * s.r, s.y + Math.sin(v) * s.r);
    ctx.lineTo(s.x + Math.cos(v) * (s.r + lengde), s.y + Math.sin(v) * (s.r + lengde));
    ctx.stroke();
    // Kropp (toga)
    ctx.fillStyle = s.ute ? FARGE.dempet : FARGE.toga;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    // Purpurstripe (senatorens latus clavus)
    ctx.strokeStyle = s.brutus ? FARGE.gull : "#6e3b4e";
    ctx.lineWidth = s.brutus ? 2.4 : 2;
    ctx.beginPath();
    ctx.moveTo(s.x - s.r * 0.6, s.y - s.r * 0.6);
    ctx.lineTo(s.x + s.r * 0.6, s.y + s.r * 0.6);
    ctx.stroke();
    if (s.brutus) {
      ctx.strokeStyle = FARGE.gull;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = FARGE.gullLys;
      ctx.font = `600 10px Cinzel, Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText("BRUTUS", s.x, s.y - s.r - 9);
    }
    ctx.globalAlpha = 1;
  }

  function tegnHud() {
    ctx.textAlign = "left";
    ctx.fillStyle = FARGE.gull;
    ctx.font = `600 13px Cinzel, Georgia, serif`;
    ctx.fillText(`SÅR ${sar} / ${MAKS_SAR}`, 16, 26);
    ctx.textAlign = "center";
    ctx.fillStyle = FARGE.gullLys;
    ctx.font = `700 15px Cinzel, Georgia, serif`;
    ctx.fillText(`${poeng()} POENG`, B / 2, B < 560 ? 58 : 26);
    ctx.font = `600 13px Cinzel, Georgia, serif`;
    ctx.fillStyle = FARGE.gull;
    ctx.textAlign = "right";
    const igjen = Math.max(0, SEIERSTID - tid);
    ctx.fillText(`ANTONIUS OM ${Math.ceil(igjen)} S`, B - 16, 26);
    // Fremdriftslinje
    ctx.fillStyle = "rgba(201,162,74,.18)";
    ctx.fillRect(16, 36, B - 32, 2);
    ctx.fillStyle = FARGE.gull;
    ctx.fillRect(16, 36, (B - 32) * Math.min(1, tid / SEIERSTID), 2);
    // Sidesteg: ladelinje nederst til venstre
    const lad = 1 - cæsar.stegNed / STEG_NED;
    const lb = Math.min(150, B * 0.3);
    ctx.textAlign = "left";
    ctx.font = `500 11px Cinzel, Georgia, serif`;
    ctx.fillStyle = cæsar.stegNed > 0 ? FARGE.dempet : FARGE.gullLys;
    ctx.fillText(cæsar.stegNed > 0 ? `SIDESTEG ${cæsar.stegNed.toFixed(1).replace(".", ",")} S` : "SIDESTEG KLAR", 16, H - 26);
    ctx.fillStyle = "rgba(201,162,74,.18)";
    ctx.fillRect(16, H - 18, lb, 5);
    ctx.fillStyle = cæsar.stegNed > 0 ? FARGE.gull : FARGE.gullLys;
    ctx.fillRect(16, H - 18, lb * lad, 5);
    if (sidestegKnapp) {
      sidestegKnapp.style.setProperty("--lad", `${Math.round(lad * 100)}%`);
      sidestegKnapp.classList.toggle("klar", lad >= 1);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = FARGE.dempet;
    ctx.fillText(`KOLLEGER TRUFFET ${kolleger}`, B - 16, H - 18);
  }

  function tegn() {
    tegnArena();
    if (tilstand === "meny") return;
    for (const p of partikler) {
      ctx.globalAlpha = Math.max(0, p.liv / p.maksLiv);
      ctx.fillStyle = p.farge;
      ctx.fillRect(p.x - p.str / 2, p.y - p.str / 2, p.str, p.str);
    }
    ctx.globalAlpha = 1;
    senatorer.forEach(tegnSenator);
    tegnCæsar();
    for (const t of tekster) {
      ctx.globalAlpha = Math.min(1, t.liv / (t.maksLiv * 0.5));
      ctx.fillStyle = t.farge;
      ctx.font = `600 ${t.str}px Cinzel, Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(t.tekst, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    tegnHud();
    if (tilstand === "pause") {
      ctx.fillStyle = "rgba(11,11,10,.7)";
      ctx.fillRect(0, 0, B, H);
      ctx.fillStyle = FARGE.gull;
      ctx.font = `600 20px Cinzel, Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText("PAUSE", B / 2, H / 2);
      ctx.font = `400 13px Cinzel, Georgia, serif`;
      ctx.fillText("Trykk P eller klikk for å fortsette", B / 2, H / 2 + 26);
    }
  }

  function løkke(n) {
    const dt = Math.min(0.05, (n - sisteTid) / 1000 || 0);
    sisteTid = n;
    if (tilstand === "spiller") oppdater(dt);
    tegn();
    requestAnimationFrame(løkke);
  }

  // ---------- Slutt ----------
  const SLUTT = {
    sar: {
      tittel: "Tjuetre sår",
      tekst: () => `Du falt ved foten av Pompeius' statue etter ${Math.floor(tid)} sekunder. Suetonius forteller at bare ett av de tjuetre sårene var dødelig.`,
    },
    brutus: {
      tittel: "Et tu, Brute?",
      tekst: () => `Brutus' dolk avgjorde saken etter ${Math.floor(tid)} sekunder og ${sar} sår. Ifølge Suetonius sa du heller «kai sy, teknon?», og du, mitt barn?`,
    },
    seier: {
      tittel: "Du overlevde marsidene",
      tekst: () => `Marcus Antonius slapp forbi Trebonius ved døren. Du kom deg ut med ${sar} sår, og ${kolleger} senator${kolleger === 1 ? "" : "er"} traff hverandre i stedet. Historien er herved omskrevet.`,
    },
  };

  async function avslutt(årsak) {
    if (tilstand !== "spiller") return;
    tilstand = "slutt";
    sluttÅrsak = årsak;
    const seier = årsak === "seier";
    const s = SLUTT[årsak];
    try {
      const nøkkel = "tafse-spill-beste";
      const beste = Number(localStorage.getItem(nøkkel) || 0);
      if (tid > beste) localStorage.setItem(nøkkel, String(Math.min(tid, SEIERSTID)));
    } catch (_) {}
    skjerm.innerHTML = `
      <p class="overline">${seier ? "Victoria" : "Idus Martiae"}</p>
      <h2>${s.tittel}</h2>
      <p>${s.tekst()}</p>
      <p class="spill-poeng">${poeng()} poeng</p>
      <p class="dempet spill-regnestykke">${Math.floor(Math.min(tid, SEIERSTID))} sekunder + ${kolleger} kolleger truffet − ${sar} knivstikk</p>
      <p class="dempet" id="lagret"></p>
      <button class="knapp" type="button" id="igjen">Prøv igjen</button>`;
    skjerm.hidden = false;
    document.getElementById("igjen").addEventListener("click", nyttSpill);
    document.getElementById("igjen").focus();
    const lagret = document.getElementById("lagret");
    if (typeof MEG !== "undefined" && MEG) {
      try {
        await api("spill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sekunder: Math.min(tid, SEIERSTID), sar, kolleger, seier }) });
        lagret.textContent = `Resultatet er lagret på tavlen for ${MEG}.`;
        window.lastToppliste && window.lastToppliste();
      } catch (_) {
        lagret.textContent = "Klarte ikke å lagre resultatet.";
      }
    } else {
      lagret.innerHTML = `<a href="salongen.html">Logg inn</a> for å komme på tavlen.`;
    }
  }

  // ---------- Start ----------
  document.getElementById("start").addEventListener("click", nyttSpill);
  window.addEventListener("resize", () => { tilpass(); if (cæsar) iArena(cæsar); });
  tilpass();
  sisteTid = performance.now();
  requestAnimationFrame(løkke);
})();
