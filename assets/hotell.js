// TAFSE HOTELL: rom sett skrått ovenfra, der hver bror styrer sin egen figur.
// Trykk på gulvet for å gå, på en stol for å sette deg og på en dør for å bytte rom.
// Serveren (lib/hotell.js) holder orden på hvem som er hvor og hva som blir sagt.

(() => {
  const rot = document.getElementById("h");
  const TW = 64, TH = 32;          // en gulvflis på skjermen
  const FART = 3.4;                // fliser i sekundet
  const HENT_HVERT = 1600;         // millisekunder mellom hver gang vi spør serveren

  const HUD = ["#f6d7bd", "#eac19f", "#d19f76", "#a8734d", "#6e4a30"];
  const HAR = ["kort", "langt", "krøller", "knute", "skallet"];
  const HARFARGE = ["#1c1612", "#4a2f1c", "#8a5a2b", "#c9a35a", "#b5482a", "#9a9a9a", "#ece4d2"];
  const TOGA = ["#ece4d2", "#8e2f52", "#2f5d8e", "#2f7d5b", "#c9a24a", "#5b3a8e", "#b5482a", "#2b2b2b"];
  const GESTER = { vink: "vinker", skal: "skåler", dans: "danser" };

  // ---------- Rommene ----------
  // Koordinater: x går ned mot høyre, y ned mot venstre. Veggene står langs x = 0 og y = 0.
  const ROM = {
    lobbyen: {
      navn: "Lobbyen", b: 11, d: 11, start: [5, 9], vegg: 112, veggfarge: ["#5a1d2c", "#6f2638"], bakgrunn: ["#141110", "#0b0b0a"],
      gulv: (x, y) => (x === 5 && y >= 1 ? (y % 2 ? "#8e2f52" : "#842a4b") : (x + y) % 2 ? "#d8cdb4" : "#c2b697"),
      skilt: { side: "h", pos: 3.6, z: 62, tekst: "TAFSE HOTELL", font: "700 22px Cinzel, Georgia, serif" },
      dorer: [{ x: 9, y: 0, side: "h", til: "baren" }, { x: 0, y: 8, side: "v", til: "terrassen" }],
      mobler: [
        ["disk", 6, 1], ["disk", 7, 1], ["disk", 8, 1],
        ["sofa", 0, 2, "v"], ["sofa", 0, 3, "v"], ["sofa", 0, 4, "v"], ["bord", 2, 3],
        ["bord", 8, 7], ["krakk", 7, 7], ["krakk", 9, 7], ["krakk", 8, 6], ["krakk", 8, 8],
        ["soyle", 0, 0], ["soyle", 0, 6], ["soyle", 10, 0], ["plante", 0, 1], ["plante", 10, 1], ["plante", 1, 10],
        ["amfora", 10, 5], ["amfora", 10, 6],
      ],
      npc: [{ navn: "Portieren", x: 7, y: 0, utseende: { hud: HUD[1], har: "kort", harfarge: "#9a9a9a", skjegg: "ja", toga: "#2b2b2b" },
        replikker: ["Velkommen til Tafse Hotell.", "Baren ligger gjennom døra til høyre.", "Terrassen har basseng. Togaen tåler vann.", "Frokost serveres aldri. Vi er et taffelakademi.", "Rom 1412 er dessverre opptatt."] }],
    },
    baren: {
      navn: "Baren", b: 10, d: 9, start: [7, 2], vegg: 112, veggfarge: ["#16302f", "#1d3d3b"], bakgrunn: ["#0f1413", "#0b0b0a"],
      gulv: (x, y, t) => (x >= 6 && x <= 8 && y >= 4 && y <= 6 ? `hsl(${(x * 70 + y * 45 + Math.floor(t * 1.6) * 55) % 360} 55% 42%)` : y % 2 ? "#5d3f2a" : "#543826"),
      skilt: { side: "h", pos: 3.6, z: 62, tekst: "IN VINO VERITAS", font: "600 18px Cinzel, Georgia, serif" },
      dorer: [{ x: 8, y: 0, side: "h", til: "lobbyen" }],
      mobler: [
        ["disk", 1, 2], ["disk", 1, 3], ["disk", 1, 4], ["disk", 1, 5],
        ["krakk", 2, 2], ["krakk", 2, 3], ["krakk", 2, 4], ["krakk", 2, 5],
        ["bord", 5, 1], ["krakk", 4, 1], ["krakk", 6, 1], ["bord", 3, 7], ["krakk", 2, 7], ["krakk", 4, 7],
        ["amfora", 0, 7], ["amfora", 0, 8], ["plante", 9, 0], ["soyle", 0, 0],
      ],
      npc: [{ navn: "Dionysos", x: 0, y: 3, utseende: { hud: HUD[2], har: "krøller", harfarge: "#1c1612", skjegg: "ja", toga: "#8e2f52" },
        replikker: ["Hva skal det være? Vi har vin, vin og vin.", "Skål, bror!", "Dansegulvet lyser ikke for ingenting.", "Jeg blander aldri vinen med vann. Det er det dere som gjør.", "Siste runde var for to tusen år siden."] }],
    },
    terrassen: {
      navn: "Terrassen", b: 11, d: 10, start: [5, 2], vegg: 30, veggfarge: ["#8f8672", "#a39a84"], bakgrunn: ["#0a0d18", "#1c2136"], himmel: true,
      vann: (x, y) => x >= 3 && x <= 6 && y >= 4 && y <= 7,
      gulv: (x, y, t) => (x >= 3 && x <= 6 && y >= 4 && y <= 7 ? `hsl(198 ${52 + Math.sin(t * 2 + x + y) * 6}% ${38 + Math.sin(t * 1.5 + x * 2 - y) * 3}%)` : (x + y) % 2 ? "#b9ae97" : "#aa9f88"),
      dorer: [{ x: 5, y: 0, side: "h", til: "lobbyen" }],
      mobler: [
        ["solseng", 8, 4], ["solseng", 8, 6], ["solseng", 1, 5], ["solseng", 1, 7],
        ["tre", 0, 0], ["tre", 10, 0], ["tre", 0, 9], ["fakkel", 2, 3], ["fakkel", 7, 3], ["fakkel", 2, 8], ["fakkel", 7, 8],
        ["bord", 9, 9], ["krakk", 8, 9], ["krakk", 10, 9], ["amfora", 10, 2],
      ],
      npc: [],
    },
  };

  // ---------- Tilstand ----------
  let rom = "lobbyen", R = ROM[rom], ruter = [], mobler = [];
  let figurer = new Map();   // navn → figur (brødre og hotellets egne)
  let meg = null, etter = 0, forste = true, antall = {}, logg = [];
  let lerret, ctx, logW = 960, logH = 600, kam = [0, 0], peker = null, mal = null;
  let lagreTid = null;
  let TK = 1; // tekst tegnes større når rommet vises lite, som på mobil

  const P = (x, y, z = 0) => [(x - y) * TW / 2, (x + y) * TH / 2 - z];
  const mork = (hex, f) => "#" + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, "0")).join("");
  const rute = (x, y) => (ruter[x] && ruter[x][y]) || null;
  const standard = (navn) => {
    const n = [...navn].reduce((s, c) => s + c.charCodeAt(0), 0);
    return { hud: HUD[n % 3], har: HAR[n % 4], harfarge: HARFARGE[(n >> 1) % 5], skjegg: n % 3 === 0 ? "ja" : "nei", toga: TOGA[n % TOGA.length] };
  };
  const utseende = (u, navn) => ({ ...standard(navn), ...(u || {}) });

  // ---------- Møbler ----------
  function flate(pkt, farge) {
    ctx.fillStyle = farge;
    ctx.beginPath();
    pkt.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }
  // En kloss som står på flisa. fx/fy er hvor på flisa (0 til 1), z er høyde fra og til.
  function kloss(x, y, fx0, fy0, fx1, fy1, z0, z1, farge) {
    const x0 = x + fx0, x1 = x + fx1, y0 = y + fy0, y1 = y + fy1;
    flate([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)], mork(farge, 0.72));
    flate([P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)], mork(farge, 0.86));
    flate([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], farge);
  }
  const MOBEL = {
    disk: { blokk: true, tegn(x, y) { kloss(x, y, 0, 0.1, 1, 0.9, 0, 30, "#6b4a2a"); kloss(x, y, 0, 0.05, 1, 0.95, 30, 34, "#c9a24a"); } },
    sofa: { sete: 15, tegn(x, y, mot) {
      if (mot === "v") { kloss(x, y, 0, 0, 0.28, 1, 0, 36, "#7a2843"); kloss(x, y, 0.28, 0, 1, 1, 0, 15, "#8e2f52"); }
      else { kloss(x, y, 0, 0, 1, 0.28, 0, 36, "#7a2843"); kloss(x, y, 0, 0.28, 1, 1, 0, 15, "#8e2f52"); }
    } },
    krakk: { sete: 14, tegn(x, y) { kloss(x, y, 0.3, 0.3, 0.7, 0.7, 0, 11, "#5a4630"); kloss(x, y, 0.2, 0.2, 0.8, 0.8, 11, 14, "#c9a24a"); } },
    bord: { blokk: true, tegn(x, y) { kloss(x, y, 0.4, 0.4, 0.6, 0.6, 0, 18, "#5a4630"); kloss(x, y, 0.08, 0.08, 0.92, 0.92, 18, 22, "#ece4d2"); const [a, b] = P(x + 0.5, y + 0.5, 22); ctx.fillStyle = "#8e2f52"; ctx.fillRect(a - 3, b - 9, 6, 9); ctx.fillStyle = "#c9a24a"; ctx.fillRect(a - 4, b - 11, 8, 2); } },
    solseng: { sete: 10, tegn(x, y) { kloss(x, y, 0.15, 0, 0.85, 1, 0, 9, "#ece4d2"); kloss(x, y, 0.15, 0, 0.85, 0.22, 9, 22, "#d8cdb4"); } },
    soyle: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.15, 0.15, 0.85, 0.85, 0, 7, "#d8cdb4"); kloss(x, y, 0.28, 0.28, 0.72, 0.72, 7, 94, "#ece4d2");
      const [a, b] = P(x + 0.5, y + 0.5, 0); ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1;
      for (const dx of [-8, -3, 3, 9]) { ctx.beginPath(); ctx.moveTo(a + dx, b - 6); ctx.lineTo(a + dx, b - 92); ctx.stroke(); }
      kloss(x, y, 0.15, 0.15, 0.85, 0.85, 94, 102, "#ece4d2");
    } },
    plante: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.3, 0.3, 0.7, 0.7, 0, 13, "#a9603c");
      const [a, b] = P(x + 0.5, y + 0.5, 13);
      for (const [dx, dy, r, c] of [[-9, -10, 10, "#4f6a34"], [9, -12, 11, "#5f7d3d"], [0, -22, 12, "#6b8a45"], [-4, -8, 8, "#5f7d3d"], [5, -28, 7, "#7a9a52"]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a + dx, b + dy, r, 0, 7); ctx.fill(); }
    } },
    tre: { blokk: true, tegn(x, y) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ctx.fillStyle = "#5a4630"; ctx.fillRect(a - 4, b - 46, 8, 46);
      for (const [dx, dy, r, c] of [[-16, -50, 17, "#4f6a34"], [15, -54, 18, "#5f7339"], [0, -72, 20, "#6b8344"], [-6, -48, 13, "#5f7339"], [8, -82, 11, "#7d9550"]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a + dx, b + dy, r, 0, 7); ctx.fill(); }
    } },
    amfora: { blokk: true, tegn(x, y) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(a, b, 12, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#b5623a"; ctx.beginPath(); ctx.ellipse(a, b - 16, 11, 15, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#9a4f2c"; ctx.fillRect(a - 4, b - 38, 8, 10); ctx.fillRect(a - 7, b - 40, 14, 3);
      ctx.fillStyle = "#1c1612"; ctx.fillRect(a - 9, b - 20, 18, 3);
    } },
    fakkel: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ctx.fillStyle = "#3a2a18"; ctx.fillRect(a - 2, b - 50, 4, 50); ctx.fillStyle = "#c9a24a"; ctx.fillRect(a - 6, b - 54, 12, 5);
      const f = 1 + Math.sin(t * 9 + x) * 0.15;
      const g = ctx.createRadialGradient(a, b - 62, 2, a, b - 62, 46); g.addColorStop(0, "rgba(242,193,78,.4)"); g.addColorStop(1, "rgba(242,193,78,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a, b - 62, 46, 0, 7); ctx.fill();
      ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.ellipse(a, b - 62, 5, 10 * f, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff0b8"; ctx.beginPath(); ctx.ellipse(a, b - 59, 2.5, 5 * f, 0, 0, 7); ctx.fill();
    } },
  };

  function byggRom(navn) {
    rom = navn; R = ROM[navn];
    ruter = Array.from({ length: R.b }, (_, x) => Array.from({ length: R.d }, (_, y) => ({ vann: !!(R.vann && R.vann(x, y)) })));
    mobler = R.mobler.map(([type, x, y, mot]) => {
      const m = MOBEL[type];
      if (m.blokk) ruter[x][y].blokk = true;
      if (m.sete) ruter[x][y].sete = { h: m.sete };
      return { type, x, y, mot, dybde: x + y };
    });
    for (const d of R.dorer) ruter[d.x][d.y].dor = d;
    figurer = new Map();
    for (const n of R.npc) {
      ruter[n.x][n.y].blokk = true;
      ruter[n.x][n.y].npc = n.navn;
      figurer.set(n.navn, { navn: n.navn, x: n.x, y: n.y, sti: [], utseende: n.utseende, npc: n });
    }
    mal = null;
  }

  // Korteste vei mellom to fliser. Seter og dører kan bare være mål, ikke gjennomgang.
  function finnSti(fx, fy, tx, ty) {
    const m = rute(tx, ty);
    if (!m || m.blokk) return null;
    if (fx === tx && fy === ty) return [];
    const fra = new Map([[`${fx},${fy}`, null]]);
    const ko = [[fx, fy]];
    while (ko.length) {
      const [x, y] = ko.shift();
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = x + dx, ny = y + dy, n = rute(nx, ny), k = `${nx},${ny}`;
        if (!n || n.blokk || fra.has(k)) continue;
        const erMal = nx === tx && ny === ty;
        if (n.sete && !erMal) continue;
        fra.set(k, [x, y]);
        if (erMal) {
          const sti = [];
          for (let p = [nx, ny]; p && !(p[0] === fx && p[1] === fy); p = fra.get(`${p[0]},${p[1]}`)) sti.unshift(p);
          return sti;
        }
        ko.push([nx, ny]);
      }
    }
    return null;
  }

  // ---------- Figurene ----------
  function tegnFigur(f, t) {
    const rt = rute(Math.round(f.x), Math.round(f.y));
    const [sx, sy0] = P(f.x + 0.5, f.y + 0.5);
    const sitter = !f.sti.length && rt && rt.sete;
    const vann = rt && rt.vann;
    const gest = f.gest && f.gestTil > t ? f.gest : null;
    const dans = gest === "dans";
    const a = f.utseende, u = 2;
    const gaar = f.sti.length > 0;
    const hopp = dans ? Math.abs(Math.sin(t * 9)) * 6 : gaar ? Math.abs(Math.sin(t * 11)) * 3 : 0;
    const flip = dans ? Math.floor(t * 2.5) % 2 === 0 : f.flip;
    const bak = f.bak && gaar;
    const hud = a.hud, hudM = mork(hud, 0.84), toga = a.toga, togaM = mork(toga, 0.78), har = a.harfarge;
    const kant = toga === "#c9a24a" ? "#8e2f52" : "#c9a24a";

    if (!vann) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(sx, sy0, 15, 6, 0, 0, 7); ctx.fill(); }
    ctx.save();
    ctx.translate(sx, sy0 - (sitter ? rt.sete.h : 0) + (vann ? 16 : 0) - hopp);
    if (vann) { ctx.beginPath(); ctx.rect(-40, -130, 80, 130 - 20 + hopp); ctx.clip(); }
    if (flip) ctx.scale(-1, 1);
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * u, y * u, w * u, h * u); };

    if (a.har === "langt") px(-7, -36 + (sitter ? 4 : 0), 14, 14, har);
    if (sitter) { px(-5, -5, 4, 5, hud); px(1, -5, 4, 5, hudM); px(-5, -1, 5, 1, "#6b4a2a"); px(1, -1, 5, 1, "#6b4a2a"); ctx.translate(0, 4 * u); }
    else {
      const l = gaar ? (Math.sin(t * 11) > 0 ? 1 : -1) : 0;
      px(-5, -9, 4, 9 - (l > 0 ? 2 : 0), hud); px(1, -9, 4, 9 - (l < 0 ? 2 : 0), hudM);
      px(-5, -1 - (l > 0 ? 2 : 0), 5, 1, "#6b4a2a"); px(1, -1 - (l < 0 ? 2 : 0), 5, 1, "#6b4a2a");
    }
    // Toga med skrå kant og belte
    px(-6, -23, 12, 15, toga); px(3, -23, 3, 15, togaM); px(-6, -9, 12, 1, togaM);
    if (!bak) for (let i = 0; i < 5; i++) px(-6 + i * 2, -23 + i * 2, 3, 2, kant);
    px(-6, -13, 12, 1, kant);
    // Armer
    if (dans) { px(-10, -31, 3, 9, hud); px(7, -31, 3, 9, hudM); px(-9, -22, 3, 3, toga); px(6, -22, 3, 3, togaM); }
    else {
      px(-9, -22, 3, 4, toga); px(-9, -18, 3, 6, hud);
      if (gest === "vink") { px(6, -22, 3, 3, togaM); px(7 + Math.round(Math.sin(t * 14)), -31, 3, 9, hudM); }
      else if (gest === "skal") { px(6, -22, 3, 3, togaM); px(7, -30, 3, 8, hudM); px(6, -35, 5, 5, "#e2c174"); px(7, -36, 3, 1, "#8e2f52"); }
      else { px(6, -22, 3, 4, togaM); px(6, -18, 3, 6, hudM); }
    }
    // Hode, ansikt og hår
    px(-2, -25, 4, 2, hudM);
    px(-6, -36, 12, 11, hud); px(4, -36, 2, 11, hudM);
    if (!bak) {
      px(-4, -31, 2, 2, "#1c1612"); px(1, -31, 2, 2, "#1c1612");
      if (a.skjegg === "ja") { px(-6, -28, 12, 3, har); px(-2, -27, 3, 1, mork(har, 0.55)); }
      else px(-2, -27, 3, 1, mork(hud, 0.6));
    } else if (a.har !== "skallet") px(-6, -36, 12, 9, har);
    if (a.har === "kort") { px(-6, -38, 12, 3, har); px(-6, -35, 1, 3, har); px(5, -35, 1, 3, har); }
    else if (a.har === "langt") { px(-7, -38, 14, 4, har); px(-7, -34, 2, 10, har); px(5, -34, 2, 10, har); }
    else if (a.har === "krøller") { px(-7, -39, 14, 4, har); px(-8, -37, 2, 5, har); px(6, -37, 2, 5, har); px(-5, -40, 3, 1, har); px(1, -40, 4, 1, har); }
    else if (a.har === "knute") { px(-6, -38, 12, 3, har); px(-2, -41, 4, 3, har); }
    else { px(-6, -34, 1, 3, har); px(5, -34, 1, 3, har); }
    ctx.restore();
    if (vann) { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy0 - 4, 16 + Math.sin(t * 4) * 2, 6, 0, 0, 7); ctx.stroke(); }
    f.topp = sy0 - (sitter ? rt.sete.h - 8 : 0) + (vann ? 16 : 0) - 84;
  }

  function tegnNavnOgBoble(f, t) {
    const [sx, sy] = P(f.x + 0.5, f.y + 0.5);
    ctx.textAlign = "center";
    ctx.font = `600 ${Math.round(11 * TK)}px Cinzel, Georgia, serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(11,11,10,.85)";
    ctx.strokeText(f.navn, sx, sy + 13 + 4 * TK);
    ctx.fillStyle = f === meg ? "#e2c174" : f.npc ? "#b9ae97" : "#ece4d2";
    ctx.fillText(f.navn, sx, sy + 13 + 4 * TK);
    if (!f.boble || f.boble.til < t) return;
    ctx.font = `${Math.round(16 * TK)}px 'EB Garamond', Georgia, serif`;
    const b = Math.max(...f.boble.linjer.map((l) => ctx.measureText(l).width)) + 20, lh = 19 * TK, h = f.boble.linjer.length * lh + 12;
    const x = Math.max(-kam[0] + 6, Math.min(logW - kam[0] - b - 6, sx - b / 2)), y = f.topp - h;
    ctx.globalAlpha = Math.min(1, (f.boble.til - t) / 0.4);
    ctx.fillStyle = "#f5efe0"; ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, b, h, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 6, y + h - 1); ctx.lineTo(sx, y + h + 7); ctx.lineTo(sx + 6, y + h - 1); ctx.fillStyle = "#f5efe0"; ctx.fill();
    ctx.fillStyle = "#1c1612";
    f.boble.linjer.forEach((l, i) => ctx.fillText(l, x + b / 2, y + 2 + lh * (i + 0.9)));
    ctx.globalAlpha = 1;
  }

  function si(f, tekst, t) {
    ctx.font = `${Math.round(16 * TK)}px 'EB Garamond', Georgia, serif`;
    const linjer = [];
    let linje = "";
    for (const ord of tekst.split(" ")) {
      const ny = linje ? `${linje} ${ord}` : ord;
      if (ctx.measureText(ny).width > 190 * TK && linje) { linjer.push(linje); linje = ord; } else linje = ny;
    }
    if (linje) linjer.push(linje);
    f.boble = { linjer: linjer.slice(0, 5), til: t + 4 + tekst.length * 0.06 };
  }

  // ---------- Tegn rommet ----------
  function veggTekst(side, pos, z, tekst, font, farge) {
    ctx.save();
    ctx.transform(1, side === "h" ? 0.5 : -0.5, 0, 1, 0, 0);
    ctx.font = font; ctx.textAlign = "center"; ctx.fillStyle = farge;
    ctx.fillText(tekst, (side === "h" ? 1 : -1) * pos * TW / 2, -z);
    ctx.restore();
  }
  const veggP = (side, pos, z) => (side === "h" ? P(pos, 0, z) : P(0, pos, z));

  function tegn(tMs) {
    const t = tMs / 1000;
    const k = lerret.width / logW;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, logH);
    g.addColorStop(0, R.bakgrunn[0]); g.addColorStop(1, R.bakgrunn[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, logW, logH);
    if (R.himmel) {
      ctx.fillStyle = "#f2e3b4";
      for (let i = 0; i < 60; i++) { const x = (i * 197) % logW, y = (i * 89) % (logH * 0.55); ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 0.8 + i)); ctx.fillRect(x, y, i % 7 ? 1.5 : 2.5, i % 7 ? 1.5 : 2.5); }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(logW * 0.82, 70, 24, 0, 7); ctx.fill();
    }
    // Kamera: hele rommet hvis det får plass, ellers følger det figuren din
    const minX = -R.d * TW / 2 - 16, maxX = R.b * TW / 2 + 16, minY = -Math.max(R.vegg, 100) - 26, maxY = (R.b + R.d) * TH / 2 + 30;
    const [mx, my] = meg ? P(meg.x + 0.5, meg.y + 0.5) : [0, 0];
    kam = [
      maxX - minX <= logW ? logW / 2 - (minX + maxX) / 2 : Math.max(logW - maxX, Math.min(-minX, logW / 2 - mx)),
      maxY - minY <= logH ? logH / 2 - (minY + maxY) / 2 : Math.max(logH - maxY, Math.min(-minY, logH / 2 - my + 30)),
    ];
    ctx.translate(kam[0], kam[1]);

    // Vegger
    const V = R.vegg;
    flate([P(0, 0), P(0, R.d), P(0, R.d, V), P(0, 0, V)], R.veggfarge[0]);
    flate([P(0, 0), P(R.b, 0), P(R.b, 0, V), P(0, 0, V)], R.veggfarge[1]);
    if (V > 60) {
      flate([P(0, 0), P(0, R.d), P(0, R.d, 34), P(0, 0, 34)], mork(R.veggfarge[0], 0.8));
      flate([P(0, 0), P(R.b, 0), P(R.b, 0, 34), P(0, 0, 34)], mork(R.veggfarge[1], 0.8));
    }
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 2; ctx.beginPath();
    let p = P(0, R.d, V); ctx.moveTo(p[0], p[1]); p = P(0, 0, V); ctx.lineTo(p[0], p[1]); p = P(R.b, 0, V); ctx.lineTo(p[0], p[1]); ctx.stroke();
    if (R.skilt) veggTekst(R.skilt.side, R.skilt.pos, R.skilt.z, R.skilt.tekst, R.skilt.font, "#c9a24a");
    for (const d of R.dorer) {
      const pos = d.side === "h" ? d.x : d.y;
      if (V < 90) flate([veggP(d.side, pos - 0.1, 0), veggP(d.side, pos + 1.1, 0), veggP(d.side, pos + 1.1, 104), veggP(d.side, pos - 0.1, 104)], R.veggfarge[d.side === "h" ? 1 : 0]);
      flate([veggP(d.side, pos + 0.08, 0), veggP(d.side, pos + 0.92, 0), veggP(d.side, pos + 0.92, 84), veggP(d.side, pos + 0.08, 84)], "#c9a24a");
      flate([veggP(d.side, pos + 0.14, 0), veggP(d.side, pos + 0.86, 0), veggP(d.side, pos + 0.86, 80), veggP(d.side, pos + 0.14, 80)], "#0b0b0a");
      veggTekst(d.side, pos + 0.5, 90, ROM[d.til].navn.toUpperCase(), "600 10px Cinzel, Georgia, serif", "#e2c174");
    }
    // Gulv
    flate([P(0, R.d), P(R.b, R.d), P(R.b, R.d, -10), P(0, R.d, -10)], "#3a342a");
    flate([P(R.b, 0), P(R.b, R.d), P(R.b, R.d, -10), P(R.b, 0, -10)], "#4a4336");
    for (let x = 0; x < R.b; x++) for (let y = 0; y < R.d; y++) flate([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], R.gulv(x, y, t));
    for (const d of R.dorer) { ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.12; flate([P(d.x, d.y), P(d.x + 1, d.y), P(d.x + 1, d.y + 1), P(d.x, d.y + 1)], "#e2c174"); ctx.globalAlpha = 1; }
    const merk = (m, farge, bredde) => {
      ctx.strokeStyle = farge; ctx.lineWidth = bredde; ctx.beginPath();
      [P(m[0] + 0.06, m[1] + 0.06), P(m[0] + 0.94, m[1] + 0.06), P(m[0] + 0.94, m[1] + 0.94), P(m[0] + 0.06, m[1] + 0.94)].forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.closePath(); ctx.stroke();
    };
    if (peker && rute(peker[0], peker[1]) && (!rute(peker[0], peker[1]).blokk || rute(peker[0], peker[1]).npc)) merk(peker, "rgba(226,193,116,.9)", 2);
    if (mal && meg && meg.sti.length) merk(mal, "rgba(236,228,210,.7)", 1.5);

    // Møbler og figurer, bakerst først
    const ting = [...mobler.map((m) => ({ d: m.dybde, m })), ...[...figurer.values()].map((f) => ({ d: f.x + f.y + 0.5, f }))].sort((a, b) => a.d - b.d);
    for (const e of ting) {
      if (e.m) MOBEL[e.m.type].tegn(e.m.x, e.m.y, e.m.mot, t);
      else tegnFigur(e.f, t);
    }
    for (const f of figurer.values()) tegnNavnOgBoble(f, t);
  }

  // ---------- Bevegelse ----------
  function oppdater(dt) {
    for (const f of figurer.values()) {
      let igjen = FART * dt;
      while (f.sti.length && igjen > 0) {
        const [tx, ty] = f.sti[0];
        const dx = tx - f.x, dy = ty - f.y, lengde = Math.hypot(dx, dy);
        if (dx || dy) { f.flip = dx - dy < 0; f.bak = dx + dy < 0; }
        if (lengde <= igjen) { f.x = tx; f.y = ty; f.sti.shift(); igjen -= lengde; }
        else { f.x += (dx / lengde) * igjen; f.y += (dy / lengde) * igjen; igjen = 0; }
      }
      if (f === meg && !f.sti.length) {
        const r = rute(Math.round(f.x), Math.round(f.y));
        if (r && r.dor) gaTil(r.dor.til, rom);
      }
    }
  }

  function ga(tx, ty) {
    if (!meg) return;
    const r = rute(tx, ty);
    if (!r) return;
    if (r.npc) { const n = figurer.get(r.npc); si(n, n.npc.replikker[Math.floor(Math.random() * n.npc.replikker.length)], performance.now() / 1000); return; }
    // Start fra flisa figuren er på vei inn i, så den ikke hopper
    const fx = Math.round(meg.x), fy = Math.round(meg.y);
    const sti = finnSti(fx, fy, tx, ty);
    if (!sti) return;
    meg.sti = meg.x === fx && meg.y === fy ? sti : [[fx, fy], ...sti];
    mal = [tx, ty];
    meg.gestTil = 0;
    api("hotell/flytt", post({ rom, x: tx, y: ty })).catch(() => {});
  }

  // Bytt rom. Kommer man gjennom en dør, havner man foran døra på den andre siden.
  async function gaTil(til, fra) {
    if (!ROM[til]) return;
    byggRom(til);
    const d = fra && R.dorer.find((x) => x.til === fra);
    const [x, y] = d ? (d.side === "h" ? [d.x, 1] : [1, d.y]) : R.start;
    meg = { navn: MEG, x, y, sti: [], utseende: meg ? meg.utseende : standard(MEG) };
    figurer.set(MEG, meg);
    visRomliste();
    leggILogg(null, `Du er i ${R.navn.toLowerCase()}.`, "info");
    try {
      const svar = await api("hotell/flytt", post({ rom: til, x, y }));
      if (!meg.lastet) {
        meg.utseende = utseende(svar.utseende, MEG);
        if (!svar.utseende) api("hotell/utseende", post(meg.utseende)).catch(() => {});
        visGarderobe();
      }
      meg.lastet = true;
    } catch (_) {}
    hent();
  }

  // ---------- Samtale med serveren ----------
  const post = (kropp) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kropp) });
  let henter = false;
  async function hent() {
    if (henter || document.hidden || !meg) return;
    henter = true;
    const spurtRom = rom;
    try {
      const s = await api(`hotell?rom=${rom}&etter=${etter}${forste ? "&forste=1" : ""}`);
      if (spurtRom !== rom) return;
      const t = performance.now() / 1000;
      const sett = new Set([MEG]);
      for (const g of s.gjester) {
        if (g.navn === MEG) continue;
        sett.add(g.navn);
        let f = figurer.get(g.navn);
        if (!f) { f = { navn: g.navn, x: g.x, y: g.y, sti: [], mx: g.x, my: g.y }; figurer.set(g.navn, f); }
        f.utseende = utseende(g.utseende, g.navn);
        if (f.mx !== g.x || f.my !== g.y) {
          f.mx = g.x; f.my = g.y;
          const fx = Math.round(f.x), fy = Math.round(f.y);
          const sti = finnSti(fx, fy, g.x, g.y);
          if (sti) f.sti = f.x === fx && f.y === fy ? sti : [[fx, fy], ...sti];
          else { f.x = g.x; f.y = g.y; f.sti = []; }
        }
      }
      for (const [navn, f] of figurer) if (!f.npc && !sett.has(navn)) figurer.delete(navn);
      for (const m of s.prat) {
        if (m.navn === MEG && !s.forste) continue; // egne meldinger er allerede vist
        const f = figurer.get(m.navn);
        if (m.type === "gest") { if (f && !s.forste) { f.gest = m.tekst; f.gestTil = t + (m.tekst === "dans" ? 7 : 3); } if (!s.forste) leggILogg(m.navn, GESTER[m.tekst] || "", "gest"); }
        else { if (f && !s.forste) si(f, m.tekst, t); leggILogg(m.navn, m.tekst); }
      }
      etter = s.sisteId; forste = false;
      antall = s.antall;
      visRomliste();
    } catch (_) {
    } finally { henter = false; }
  }

  async function send(type, tekst) {
    if (!meg) return;
    const t = performance.now() / 1000;
    if (type === "gest") { meg.gest = tekst; meg.gestTil = t + (tekst === "dans" ? 7 : 3); leggILogg(MEG, GESTER[tekst], "gest"); }
    else { si(meg, tekst, t); leggILogg(MEG, tekst); }
    try { await api("hotell/si", post({ type, tekst })); }
    catch (e) { leggILogg(null, e.message, "info"); }
  }

  // ---------- Det rundt lerretet ----------
  function leggILogg(navn, tekst, type) {
    logg.push({ navn, tekst, type });
    if (logg.length > 40) logg.shift();
    const l = document.getElementById("h-logg");
    if (!l) return;
    l.innerHTML = logg.map((m) => m.type === "info" ? `<li class="info">${esc(m.tekst)}</li>` : m.type === "gest" ? `<li class="gest">${esc(m.navn)} ${esc(m.tekst)}</li>` : `<li><strong>${esc(m.navn)}</strong> ${esc(m.tekst)}</li>`).join("");
    l.scrollTop = l.scrollHeight;
  }
  function visRomliste() {
    const l = document.getElementById("h-rom");
    if (!l) return;
    l.innerHTML = Object.entries(ROM).map(([id, r]) => `<button type="button" class="h-romknapp${id === rom ? " aktiv" : ""}" data-rom="${id}">${esc(r.navn)}<span>${antall[id] || 0}</span></button>`).join("");
  }
  function visGarderobe() {
    const g = document.getElementById("h-garderobe");
    if (!g || !meg) return;
    const a = meg.utseende;
    const farger = (felt, liste) => liste.map((f) => `<button type="button" class="h-farge${a[felt] === f ? " valgt" : ""}" data-felt="${felt}" data-verdi="${f}" style="background:${f}" aria-label="${felt}"></button>`).join("");
    const valg = (felt, liste, navn) => liste.map((v, i) => `<button type="button" class="h-valg${a[felt] === v ? " valgt" : ""}" data-felt="${felt}" data-verdi="${v}">${navn ? navn[i] : v}</button>`).join("");
    g.innerHTML = `
      <div class="h-rad"><span>Toga</span><div>${farger("toga", TOGA)}</div></div>
      <div class="h-rad"><span>Hud</span><div>${farger("hud", HUD)}</div></div>
      <div class="h-rad"><span>Hår</span><div>${valg("har", HAR)}</div></div>
      <div class="h-rad"><span>Hårfarge</span><div>${farger("harfarge", HARFARGE)}</div></div>
      <div class="h-rad"><span>Skjegg</span><div>${valg("skjegg", ["ja", "nei"])}</div></div>`;
  }

  function tilpass() {
    const bredde = lerret.parentElement.clientWidth || 960;
    const stor = bredde >= 720;
    logW = stor ? 960 : 540; logH = stor ? 600 : 640;
    TK = stor ? 1 : 1.4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    lerret.width = Math.round(bredde * dpr);
    lerret.height = Math.round(bredde * (logH / logW) * dpr);
  }
  function tilFlis(e) {
    const r = lerret.getBoundingClientRect();
    const a = (((e.clientX - r.left) / r.width) * logW - kam[0]) / (TW / 2), b = (((e.clientY - r.top) / r.height) * logH - kam[1]) / (TH / 2);
    return [Math.floor((a + b) / 2), Math.floor((b - a) / 2)];
  }

  function bygg() {
    rot.innerHTML = `
      <div class="h-rom" id="h-rom"></div>
      <div class="h-ramme"><canvas id="h-lerret" aria-label="Rommet. Trykk på gulvet for å gå."></canvas></div>
      <form class="h-prat" id="h-prat">
        <input id="h-tekst" maxlength="140" placeholder="Si noe til rommet …" autocomplete="off" aria-label="Si noe">
        <button class="knapp" type="submit">Si</button>
        <div class="h-gester">${Object.keys(GESTER).map((g) => `<button class="liten-knapp" type="button" data-gest="${g}">${{ vink: "Vink", skal: "Skål", dans: "Dans" }[g]}</button>`).join("")}</div>
      </form>
      <div class="h-to">
        <section class="h-boks"><p class="h-etikett">Praten</p><ul class="h-logg" id="h-logg"></ul></section>
        <section class="h-boks"><p class="h-etikett">Garderoben</p><div id="h-garderobe"></div>
          <p class="dempet h-hjelp">Trykk på gulvet for å gå, på en stol for å sette deg og på en dør for å bytte rom.</p></section>
      </div>`;
    lerret = document.getElementById("h-lerret");
    ctx = lerret.getContext("2d");
    tilpass();

    lerret.addEventListener("click", (e) => { const [x, y] = tilFlis(e); ga(x, y); });
    lerret.addEventListener("pointermove", (e) => { peker = tilFlis(e); });
    lerret.addEventListener("pointerleave", () => { peker = null; });
    document.getElementById("h-prat").addEventListener("submit", (e) => {
      e.preventDefault();
      const felt = document.getElementById("h-tekst");
      const tekst = felt.value.replace(/\s+/g, " ").trim();
      if (tekst) send("si", tekst);
      felt.value = "";
    });
    rot.addEventListener("click", (e) => {
      const k = e.target.closest("button");
      if (!k) return;
      if (k.dataset.gest) send("gest", k.dataset.gest);
      else if (k.dataset.rom && k.dataset.rom !== rom) gaTil(k.dataset.rom, null);
      else if (k.dataset.felt && meg) {
        meg.utseende = { ...meg.utseende, [k.dataset.felt]: k.dataset.verdi };
        visGarderobe();
        clearTimeout(lagreTid);
        lagreTid = setTimeout(() => api("hotell/utseende", post(meg.utseende)).catch(() => {}), 500);
      }
    });
    window.addEventListener("resize", tilpass);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && meg) api("hotell/flytt", post({ rom, x: Math.round(meg.x), y: Math.round(meg.y) })).then(hent).catch(() => {});
    });
    window.addEventListener("pagehide", () => { try { navigator.sendBeacon("/api/hotell/ut"); } catch (_) {} });

    let forrige = 0;
    const ramme = (ms) => {
      oppdater(Math.min(0.05, (ms - forrige) / 1000 || 0));
      forrige = ms;
      tegn(ms);
      requestAnimationFrame(ramme);
    };
    requestAnimationFrame(ramme);
    setInterval(hent, HENT_HVERT);
  }

  (async () => {
    if (!(await hvemErJeg())) {
      rot.innerHTML = `<p class="tomt">Hotellet er bare for brødrene. <a href="salongen.html">Logg inn</a> for å sjekke inn.</p>`;
      return;
    }
    bygg();
    gaTil("lobbyen", null);
  })();
})();
