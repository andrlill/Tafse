// TAFSE HOTELL: rom sett skrått ovenfra, der hver bror styrer sin egen figur.
// Trykk på gulvet for å gå, på en stol for å sette deg og på en dør for å bytte rom.
// Hver bror har også sitt eget rom. Det vokser med villaen i Symposion og innredes
// med møbler kjøpt for oliven, vin og marmor. Serveren (lib/hotell.js) holder orden på alt.

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

  // ---------- Fellesrommene ----------
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
        replikker: ["Velkommen til Tafse Hotell.", "Baren ligger gjennom døra til høyre.", "Terrassen har basseng. Togaen tåler vann.", "Rommet ditt finner du øverst. Det vokser med villaen i Symposion.", "Frokost serveres aldri. Vi er et taffelakademi.", "Rom 1412 er dessverre opptatt."] }],
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
        ["vinfat", 0, 7], ["vinfat", 0, 8], ["plante", 9, 0], ["soyle", 0, 0],
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
  let meg = null, look = null, etter = 0, forste = true, antall = {}, medlemmer = [], gjesterom = [], logg = [];
  let hjem = null, innred = false, valgt = null, melding = "";   // rommet til en bror, og innredning av eget rom
  let bytter = false, romNokkel = "", innredNokkel = "";
  let lerret, ctx, logW = 960, logH = 600, kam = [0, 0], peker = null, mal = null;
  let lagreTid = null;
  let zoom = 1; // små rom forstørres så de fyller bildet
  let TK = 1; // tekst tegnes større når rommet vises lite, som på mobil

  const P = (x, y, z = 0) => [(x - y) * TW / 2, (x + y) * TH / 2 - z];
  const mork = (hex, f) => "#" + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, "0")).join("");
  const rute = (x, y) => (ruter[x] && ruter[x][y]) || null;
  const standard = (navn) => {
    const n = [...navn].reduce((s, c) => s + c.charCodeAt(0), 0);
    return { hud: HUD[n % 3], har: HAR[n % 4], harfarge: HARFARGE[(n >> 1) % 5], skjegg: n % 3 === 0 ? "ja" : "nei", toga: TOGA[n % TOGA.length] };
  };
  const utseende = (u, navn) => ({ ...standard(navn), ...(u || {}) });
  const eier = (navn) => (/[sxz]$/i.test(navn) ? `${navn}'` : `${navn}s`);
  const mittRom = () => `hjem:${MEG}`;
  const erMitt = () => rom === mittRom();
  const romNavn = (id) => (ROM[id] ? ROM[id].navn : id === mittRom() ? "Rommet ditt" : id.endsWith(")") ? `Rommet til ${id.slice(5)}` : `${eier(id.slice(5))} rom`);
  const post = (kropp) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kropp) });

  // ---------- Møbler ----------
  function flate(pkt, farge) {
    ctx.fillStyle = farge;
    ctx.beginPath();
    pkt.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }
  const rombe = (x, y, inn, farge) => flate([P(x + inn, y + inn), P(x + 1 - inn, y + inn), P(x + 1 - inn, y + 1 - inn), P(x + inn, y + 1 - inn)], farge);
  // En kloss som står på flisa. fx/fy er hvor på flisa (0 til 1), z er høyde fra og til.
  function kloss(x, y, fx0, fy0, fx1, fy1, z0, z1, farge) {
    const x0 = x + fx0, x1 = x + fx1, y0 = y + fy0, y1 = y + fy1;
    flate([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)], mork(farge, 0.72));
    flate([P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)], mork(farge, 0.86));
    flate([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], farge);
  }
  // mot = "v" betyr at ryggen står mot venstre vegg (x = 0), ellers mot høyre vegg (y = 0)
  const MOBEL = {
    disk: { blokk: true, tegn(x, y) { kloss(x, y, 0, 0.1, 1, 0.9, 0, 30, "#6b4a2a"); kloss(x, y, 0, 0.05, 1, 0.95, 30, 34, "#c9a24a"); } },
    sofa: { sete: 15, tegn(x, y, mot) {
      if (mot === "v") { kloss(x, y, 0, 0, 0.28, 1, 0, 36, "#7a2843"); kloss(x, y, 0.28, 0, 1, 1, 0, 15, "#8e2f52"); }
      else { kloss(x, y, 0, 0, 1, 0.28, 0, 36, "#7a2843"); kloss(x, y, 0, 0.28, 1, 1, 0, 15, "#8e2f52"); }
    } },
    seng: { sete: 14, tegn(x, y, mot) {
      if (mot === "v") { kloss(x, y, 0, 0.06, 0.14, 0.94, 0, 30, "#5a4630"); kloss(x, y, 0.14, 0.06, 1, 0.94, 0, 13, "#ece4d2"); kloss(x, y, 0.18, 0.16, 0.42, 0.84, 13, 17, "#d8cdb4"); kloss(x, y, 0.55, 0.06, 1, 0.94, 13, 14.5, "#8e2f52"); }
      else { kloss(x, y, 0.06, 0, 0.94, 0.14, 0, 30, "#5a4630"); kloss(x, y, 0.06, 0.14, 0.94, 1, 0, 13, "#ece4d2"); kloss(x, y, 0.16, 0.18, 0.84, 0.42, 13, 17, "#d8cdb4"); kloss(x, y, 0.06, 0.55, 0.94, 1, 13, 14.5, "#8e2f52"); }
    } },
    krakk: { sete: 14, tegn(x, y) { kloss(x, y, 0.3, 0.3, 0.7, 0.7, 0, 11, "#5a4630"); kloss(x, y, 0.2, 0.2, 0.8, 0.8, 11, 14, "#c9a24a"); } },
    bord: { blokk: true, tegn(x, y) { kloss(x, y, 0.4, 0.4, 0.6, 0.6, 0, 18, "#5a4630"); kloss(x, y, 0.08, 0.08, 0.92, 0.92, 18, 22, "#ece4d2"); const [a, b] = P(x + 0.5, y + 0.5, 22); ctx.fillStyle = "#8e2f52"; ctx.fillRect(a - 3, b - 9, 6, 9); ctx.fillStyle = "#c9a24a"; ctx.fillRect(a - 4, b - 11, 8, 2); } },
    solseng: { sete: 10, tegn(x, y) { kloss(x, y, 0.15, 0, 0.85, 1, 0, 9, "#ece4d2"); kloss(x, y, 0.15, 0, 0.85, 0.22, 9, 22, "#d8cdb4"); } },
    teppe: { gulv: true, tegn(x, y) { rombe(x, y, 0.06, "#c9a24a"); rombe(x, y, 0.13, "#8e2f52"); rombe(x, y, 0.36, "#c9a24a"); rombe(x, y, 0.42, "#7a2843"); } },
    soyle: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.15, 0.15, 0.85, 0.85, 0, 7, "#d8cdb4"); kloss(x, y, 0.28, 0.28, 0.72, 0.72, 7, 94, "#ece4d2");
      const [a, b] = P(x + 0.5, y + 0.5, 0); ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 1;
      for (const dx of [-8, -3, 3, 9]) { ctx.beginPath(); ctx.moveTo(a + dx, b - 6); ctx.lineTo(a + dx, b - 92); ctx.stroke(); }
      kloss(x, y, 0.15, 0.15, 0.85, 0.85, 94, 102, "#ece4d2");
    } },
    statue: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.22, 0.22, 0.78, 0.78, 0, 14, "#d8cdb4");
      const [a, b] = P(x + 0.5, y + 0.5, 14);
      ctx.fillStyle = "#ece4d2"; ctx.fillRect(a - 8, b - 36, 16, 36); ctx.fillRect(a - 6, b - 52, 12, 14); ctx.fillRect(a + 8, b - 52, 5, 18); ctx.fillRect(a - 12, b - 34, 4, 14);
      ctx.fillStyle = "#cfc5ad"; ctx.fillRect(a + 3, b - 36, 5, 36); ctx.fillRect(a + 3, b - 52, 3, 14);
      ctx.fillStyle = "#c9a24a"; ctx.fillRect(a + 6, b - 60, 9, 8);
    } },
    vinfat: { blokk: true, tegn(x, y) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(a, b, 16, 7, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#5a3a22"; ctx.beginPath(); ctx.ellipse(a, b - 4, 14, 6, 0, 0, 7); ctx.fill(); ctx.fillRect(a - 14, b - 32, 28, 28);
      ctx.fillStyle = "#6f4a2c"; ctx.fillRect(a - 14, b - 32, 9, 28);
      ctx.fillStyle = "#8a6038"; ctx.beginPath(); ctx.ellipse(a, b - 32, 14, 6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#2b2118"; ctx.lineWidth = 2;
      for (const dy of [-10, -24]) { ctx.beginPath(); ctx.ellipse(a, b + dy, 14, 6, 0, 0, Math.PI); ctx.stroke(); }
      ctx.fillStyle = "#8e2f52"; ctx.beginPath(); ctx.ellipse(a, b - 32, 9, 3.5, 0, 0, 7); ctx.fill();
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

  // Rommet til en bror. Størrelse og stil følger villanivået hans i Symposion.
  function lagHjem(id, h) {
    const n = h.storrelse, trinn = h.niva <= 2 ? 0 : h.niva <= 4 ? 1 : h.niva <= 7 ? 2 : 3;
    return {
      navn: romNavn(id), b: n, d: n, start: [1, 1], vegg: 112, bakgrunn: ["#141110", "#0b0b0a"],
      veggfarge: [["#75624a", "#8a7458"], ["#8c4a2f", "#a25a3a"], ["#9a917b", "#b0a68e"], ["#5a1d2c", "#6f2638"]][trinn],
      gulv: [
        (x, y) => (y % 2 ? "#6b4f36" : "#62482f"),
        (x, y) => ((x + y) % 2 ? "#b5623a" : "#a85832"),
        (x, y) => ((x + y) % 2 ? "#d8cdb4" : "#c2b697"),
        (x, y) => (x === 0 || y === 0 || x === n - 1 || y === n - 1 ? "#c9a24a" : (x + y) % 2 ? "#ece4d2" : "#d8cdb4"),
      ][trinn],
      skilt: { side: "v", pos: n / 2, z: 64, tekst: h.eier.toUpperCase(), font: "600 16px Cinzel, Georgia, serif" },
      dorer: [{ x: 1, y: 0, side: "h", til: "lobbyen" }],
      mobler: h.mobler.map((m) => [m.type, m.x, m.y, m.x === 0 ? "v" : "h"]),
      npc: [],
    };
  }

  function lagRuter() {
    ruter = Array.from({ length: R.b }, (_, x) => Array.from({ length: R.d }, (_, y) => ({ vann: !!(R.vann && R.vann(x, y)) })));
    mobler = [];
    for (const [type, x, y, mot] of R.mobler) {
      const m = MOBEL[type];
      if (!m || !rute(x, y)) continue;
      if (m.blokk) ruter[x][y].blokk = true;
      if (m.sete) ruter[x][y].sete = { h: m.sete };
      mobler.push({ type, x, y, mot, dybde: x + y, gulv: !!m.gulv });
    }
    for (const d of R.dorer) ruter[d.x][d.y].dor = d;
    for (const n of R.npc) { ruter[n.x][n.y].blokk = true; ruter[n.x][n.y].npc = n.navn; }
  }
  function byggRom(navn, def) {
    rom = navn; R = def;
    lagRuter();
    figurer = new Map();
    for (const n of R.npc) figurer.set(n.navn, { navn: n.navn, x: n.x, y: n.y, sti: [], utseende: n.utseende, npc: n });
    mal = null;
  }

  // Korteste vei mellom to fliser. Seter kan bare være mål, ikke gjennomgang.
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
  // Tegner en figur med føttene i origo. c er lerretet, a er utseendet, o sier hva figuren gjør.
  function figur(c, a, o) {
    const u = 2, t = o.t, dans = o.gest === "dans";
    const hud = a.hud, hudM = mork(hud, 0.84), toga = a.toga, togaM = mork(toga, 0.78), har = a.harfarge;
    const kant = toga === "#c9a24a" ? "#8e2f52" : "#c9a24a";
    if (o.flip) c.scale(-1, 1);
    const px = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x * u, y * u, w * u, h * u); };

    if (a.har === "langt") px(-7, -36 + (o.sitter ? 4 : 0), 14, 14, har);
    if (o.sitter) { px(-5, -5, 4, 5, hud); px(1, -5, 4, 5, hudM); px(-5, -1, 5, 1, "#6b4a2a"); px(1, -1, 5, 1, "#6b4a2a"); c.translate(0, 4 * u); }
    else {
      const l = o.gaar ? (Math.sin(t * 11) > 0 ? 1 : -1) : 0;
      px(-5, -9, 4, 9 - (l > 0 ? 2 : 0), hud); px(1, -9, 4, 9 - (l < 0 ? 2 : 0), hudM);
      px(-5, -1 - (l > 0 ? 2 : 0), 5, 1, "#6b4a2a"); px(1, -1 - (l < 0 ? 2 : 0), 5, 1, "#6b4a2a");
    }
    // Toga med skrå kant og belte
    px(-6, -23, 12, 15, toga); px(3, -23, 3, 15, togaM); px(-6, -9, 12, 1, togaM);
    if (!o.bak) for (let i = 0; i < 5; i++) px(-6 + i * 2, -23 + i * 2, 3, 2, kant);
    px(-6, -13, 12, 1, kant);
    // Armer
    if (dans) { px(-10, -31, 3, 9, hud); px(7, -31, 3, 9, hudM); px(-9, -22, 3, 3, toga); px(6, -22, 3, 3, togaM); }
    else {
      px(-9, -22, 3, 4, toga); px(-9, -18, 3, 6, hud);
      if (o.gest === "vink") { px(6, -22, 3, 3, togaM); px(7 + Math.round(Math.sin(t * 14)), -31, 3, 9, hudM); }
      else if (o.gest === "skal") { px(6, -22, 3, 3, togaM); px(7, -30, 3, 8, hudM); px(6, -35, 5, 5, "#e2c174"); px(7, -36, 3, 1, "#8e2f52"); }
      else { px(6, -22, 3, 4, togaM); px(6, -18, 3, 6, hudM); }
    }
    // Hode, ansikt og hår
    px(-2, -25, 4, 2, hudM);
    px(-6, -36, 12, 11, hud); px(4, -36, 2, 11, hudM);
    if (!o.bak) {
      px(-4, -31, 2, 2, "#1c1612"); px(1, -31, 2, 2, "#1c1612");
      if (a.skjegg === "ja") { px(-6, -28, 12, 3, har); px(-2, -27, 3, 1, mork(har, 0.55)); }
      else px(-2, -27, 3, 1, mork(hud, 0.6));
    } else if (a.har !== "skallet") px(-6, -36, 12, 9, har);
    if (a.har === "kort") { px(-6, -38, 12, 3, har); px(-6, -35, 1, 3, har); px(5, -35, 1, 3, har); }
    else if (a.har === "langt") { px(-7, -38, 14, 4, har); px(-7, -34, 2, 10, har); px(5, -34, 2, 10, har); }
    else if (a.har === "krøller") { px(-7, -39, 14, 4, har); px(-8, -37, 2, 5, har); px(6, -37, 2, 5, har); px(-5, -40, 3, 1, har); px(1, -40, 4, 1, har); }
    else if (a.har === "knute") { px(-6, -38, 12, 3, har); px(-2, -41, 4, 3, har); }
    else { px(-6, -34, 1, 3, har); px(5, -34, 1, 3, har); }
  }

  function tegnFigur(f, t) {
    const rt = rute(Math.round(f.x), Math.round(f.y));
    const [sx, sy0] = P(f.x + 0.5, f.y + 0.5);
    const sitter = !f.sti.length && rt && rt.sete;
    const vann = rt && rt.vann;
    const gest = f.gest && f.gestTil > t ? f.gest : null;
    const dans = gest === "dans";
    const gaar = f.sti.length > 0;
    const hopp = dans ? Math.abs(Math.sin(t * 9)) * 6 : gaar ? Math.abs(Math.sin(t * 11)) * 3 : 0;

    if (!vann) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(sx, sy0, 15, 6, 0, 0, 7); ctx.fill(); }
    ctx.save();
    ctx.translate(sx, sy0 - (sitter ? rt.sete.h : 0) + (vann ? 16 : 0) - hopp);
    if (vann) { ctx.beginPath(); ctx.rect(-40, -130, 80, 130 - 20 + hopp); ctx.clip(); }
    figur(ctx, f.utseende, { t, gaar, sitter: !!sitter, gest, flip: dans ? Math.floor(t * 2.5) % 2 === 0 : f.flip, bak: f.bak && gaar });
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
    const x = Math.max(-kam[0] + 6, Math.min(logW / zoom - kam[0] - b - 6, sx - b / 2)), y = f.topp - h;
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
    zoom = Math.max(1, Math.min(1.6, logW / (maxX - minX), logH / (maxY - minY)));
    const vW = logW / zoom, vH = logH / zoom;
    kam = [
      maxX - minX <= vW ? vW / 2 - (minX + maxX) / 2 : Math.max(vW - maxX, Math.min(-minX, vW / 2 - mx)),
      maxY - minY <= vH ? vH / 2 - (minY + maxY) / 2 : Math.max(vH - maxY, Math.min(-minY, vH / 2 - my + 30)),
    ];
    ctx.scale(zoom, zoom);
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
      veggTekst(d.side, pos + 0.5, 90, romNavn(d.til).toUpperCase(), "600 10px Cinzel, Georgia, serif", "#e2c174");
    }
    // Gulv, tepper og markeringer
    flate([P(0, R.d), P(R.b, R.d), P(R.b, R.d, -10), P(0, R.d, -10)], "#3a342a");
    flate([P(R.b, 0), P(R.b, R.d), P(R.b, R.d, -10), P(R.b, 0, -10)], "#4a4336");
    for (let x = 0; x < R.b; x++) for (let y = 0; y < R.d; y++) rombe(x, y, 0, R.gulv(x, y, t));
    for (const m of mobler) if (m.gulv) MOBEL[m.type].tegn(m.x, m.y, m.mot, t);
    for (const d of R.dorer) { ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.12; rombe(d.x, d.y, 0, "#e2c174"); ctx.globalAlpha = 1; }
    const merk = (m, farge, bredde) => {
      ctx.strokeStyle = farge; ctx.lineWidth = bredde; ctx.beginPath();
      [P(m[0] + 0.06, m[1] + 0.06), P(m[0] + 0.94, m[1] + 0.06), P(m[0] + 0.94, m[1] + 0.94), P(m[0] + 0.06, m[1] + 0.94)].forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.closePath(); ctx.stroke();
    };
    const pr = peker && rute(peker[0], peker[1]);
    if (pr && (innred || !pr.blokk || pr.npc)) merk(peker, "rgba(226,193,116,.9)", 2);
    if (mal && meg && meg.sti.length) merk(mal, "rgba(236,228,210,.7)", 1.5);

    // Møbler og figurer, bakerst først
    const ting = [...mobler.filter((m) => !m.gulv).map((m) => ({ d: m.dybde, m })), ...[...figurer.values()].map((f) => ({ d: f.x + f.y + 0.5, f }))].sort((a, b) => a.d - b.d);
    for (const e of ting) {
      if (e.m) MOBEL[e.m.type].tegn(e.m.x, e.m.y, e.m.mot, t);
      else tegnFigur(e.f, t);
    }
    // Når du innreder: vis møbelet du holder, der pekeren er
    const holder = innred && valgt && hjem && hjem.lager.find((m) => m.id === valgt);
    if (holder && pr && MOBEL[holder.type] && !mobler.some((m) => m.x === peker[0] && m.y === peker[1])) {
      ctx.globalAlpha = 0.6;
      MOBEL[holder.type].tegn(peker[0], peker[1], peker[0] === 0 ? "v" : "h", t);
      ctx.globalAlpha = 1;
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
      if (f === meg && !f.sti.length && !bytter) {
        const r = rute(Math.round(f.x), Math.round(f.y));
        if (r && r.dor) gaTil(r.dor.til, rom);
      }
    }
  }

  function ga(tx, ty) {
    if (!meg || bytter) return;
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
    if (bytter) return;
    const erHjem = til.startsWith("hjem:");
    if (!erHjem && !ROM[til]) til = "lobbyen";
    bytter = true;
    let feilet = false;
    try {
      let def = erHjem ? null : ROM[til], pos = [1, 1];
      if (def) { const d = fra && def.dorer.find((x) => x.til === fra); pos = d ? (d.side === "h" ? [d.x, 1] : [1, d.y]) : def.start; }
      const svar = await api("hotell/flytt", post({ rom: til, x: pos[0], y: pos[1] }));
      hjem = erHjem ? svar.hjem : null;
      if (erHjem) def = lagHjem(til, hjem);
      innred = false; valgt = null; melding = "";
      byggRom(til, def);
      meg = { navn: MEG, x: pos[0], y: pos[1], sti: [], utseende: look };
      figurer.set(MEG, meg);
      visRomliste(); visInnred();
      leggILogg(null, ROM[til] ? `Du er i ${R.navn.toLowerCase()}.` : til === mittRom() ? "Du er i rommet ditt." : `Du er på besøk hos ${til.slice(5)}.`, "info");
    } catch (e) {
      feilet = true;
      leggILogg(null, e.message, "info");
      if (meg) { meg.x = R.start[0]; meg.y = R.start[1]; meg.sti = []; }
    } finally { bytter = false; }
    if (feilet && !meg && til !== "lobbyen") return gaTil("lobbyen", null);
    hent();
  }

  // ---------- Samtale med serveren ----------
  let henter = false;
  async function hent() {
    if (henter || bytter || document.hidden || !meg) return;
    henter = true;
    const spurtRom = rom;
    try {
      const s = await api(`hotell?rom=${encodeURIComponent(rom)}&etter=${etter}${forste ? "&forste=1" : ""}`);
      if (spurtRom !== rom || bytter) return;
      const t = performance.now() / 1000;
      if (s.hjem && hjem) oppdaterHjem(s.hjem);
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
      antall = s.antall; medlemmer = s.medlemmer || medlemmer; gjesterom = s.gjesterom || gjesterom;
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

  // ---------- Innredning av eget rom ----------
  function oppdaterHjem(h) {
    const nokkel = (x) => JSON.stringify([x.mobler, x.storrelse, x.niva]);
    const endret = !hjem || nokkel(hjem) !== nokkel(h);
    hjem = h;
    if (endret) { R = lagHjem(rom, h); lagRuter(); }
    visInnred();
  }
  async function innredning(sti, kropp, etterpa) {
    try {
      const s = await api(sti, post(kropp));
      melding = "";
      if (etterpa) etterpa(s);
      oppdaterHjem(s.hjem);
    } catch (e) { melding = e.message; visInnred(); }
  }
  function innredKlikk(x, y) {
    if (!rute(x, y)) return;
    const star = hjem.mobler.find((m) => m.x === x && m.y === y);
    if (star) innredning("hotell/mobel", { id: star.id, x: null }, () => { valgt = star.id; });
    else if (valgt) innredning("hotell/mobel", { id: valgt, x, y }, () => { valgt = null; });
  }
  const prisTekst = (pris) => Object.entries(pris).map(([r, n]) => `${n} ${r}`).join(", ");
  function visInnred() {
    const boks = document.getElementById("h-innred");
    if (!boks) return;
    if (!erMitt() || !hjem || !hjem.katalog) { if (innredNokkel) { boks.innerHTML = ""; innredNokkel = ""; } return; }
    const nokkel = JSON.stringify([hjem.lager, hjem.beholdning, hjem.niva, innred, valgt, melding]);
    if (nokkel === innredNokkel) return;
    innredNokkel = nokkel;
    const b = hjem.beholdning, K = hjem.katalog;
    const rad = (v) => Object.entries(v.pris).every(([r, n]) => b[r] >= n);
    boks.innerHTML = `<section class="h-boks h-innred">
      <div class="h-innredhode">
        <div><p class="h-etikett">Rommet ditt</p>
          <p>${hjem.harGods ? `Villaen din i Symposion er på nivå ${hjem.niva}, og det gir et rom på ${hjem.storrelse} × ${hjem.storrelse} fliser. <a href="symposion.html">Bygg ut villaen</a> for å få større rom.` : `Du har ikke flyttet inn i <a href="symposion.html">Symposion</a> ennå. Der høster du oliven, vin og marmor, som du handler møbler for.`}</p>
          <p class="h-saldo">Du har <strong>${b.oliven.toLocaleString("nb-NO")}</strong> oliven · <strong>${b.vin.toLocaleString("nb-NO")}</strong> vin · <strong>${b.marmor.toLocaleString("nb-NO")}</strong> marmor</p></div>
        <button class="knapp${innred ? "" : " sekundar"}" type="button" data-innred>${innred ? "Ferdig" : "Innred rommet"}</button>
      </div>
      ${melding ? `<p class="melding feil">${esc(melding)}</p>` : ""}
      ${innred ? `<p class="h-etikett">På lager</p>
        <div class="h-lager">${hjem.lager.length ? hjem.lager.map((m) => `<button type="button" class="h-valg${m.id === valgt ? " valgt" : ""}" data-velg="${m.id}">${esc(K[m.type] ? K[m.type].navn : m.type)}</button>`).join("") : `<span class="dempet">Tomt. Kjøp noe i butikken under.</span>`}</div>
        <p class="dempet h-hjelp">Velg et møbel og trykk på en ledig flis for å sette det ut. Trykk på et møbel i rommet for å ta det ned igjen.</p>` : ""}
      <p class="h-etikett" style="margin-top:16px">Møbelbutikken</p>
      <div class="h-butikk">${Object.entries(K).map(([id, v]) => `<div class="h-vare"><strong>${esc(v.navn)}</strong><span>${prisTekst(v.pris)}</span><button class="liten-knapp" type="button" data-kjop="${id}" ${rad(v) ? "" : "disabled"}>Kjøp</button></div>`).join("")}</div>
    </section>`;
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
    const nokkel = JSON.stringify([rom, antall, medlemmer, gjesterom]);
    if (nokkel === romNokkel) return;
    romNokkel = nokkel;
    const knapp = (id, navn) => `<button type="button" class="h-romknapp${id === rom ? " aktiv" : ""}" data-rom="${esc(id)}">${esc(navn)}<span>${antall[id] || 0}</span></button>`;
    const valg = (n) => `<option value="hjem:${esc(n)}"${rom === `hjem:${n}` ? " selected" : ""}>${esc(n)}${antall[`hjem:${n}`] ? ` (${antall[`hjem:${n}`]} inne)` : ""}</option>`;
    const brodre = medlemmer.filter((n) => n !== MEG), gjester = gjesterom.filter((n) => n !== MEG);
    l.innerHTML = Object.entries(ROM).map(([id, r]) => knapp(id, r.navn)).join("") + knapp(mittRom(), "Rommet mitt") +
      (brodre.length || gjester.length ? `<select id="h-besok" class="h-besok${rom.startsWith("hjem:") && !erMitt() ? " aktiv" : ""}" aria-label="Besøk noen">
        <option value="">Besøk noen …</option>
        ${brodre.length ? `<optgroup label="Brødrene">${brodre.map(valg).join("")}</optgroup>` : ""}
        ${gjester.length ? `<optgroup label="Gjestene">${gjester.map(valg).join("")}</optgroup>` : ""}</select>` : "");
  }
  function visGarderobe() {
    const g = document.getElementById("h-garderobe");
    if (!g || !look) return;
    const a = look;
    const farger = (felt, liste) => liste.map((f) => `<button type="button" class="h-farge${a[felt] === f ? " valgt" : ""}" data-felt="${felt}" data-verdi="${f}" style="background:${f}" aria-label="${felt}"></button>`).join("");
    const valg = (felt, liste) => liste.map((v) => `<button type="button" class="h-valg${a[felt] === v ? " valgt" : ""}" data-felt="${felt}" data-verdi="${v}">${v}</button>`).join("");
    g.innerHTML = `
      <div class="h-rad"><span>Toga</span><div>${farger("toga", TOGA)}</div></div>
      <div class="h-rad"><span>Hud</span><div>${farger("hud", HUD)}</div></div>
      <div class="h-rad"><span>Hår</span><div>${valg("har", HAR)}</div></div>
      <div class="h-rad"><span>Hårfarge</span><div>${farger("harfarge", HARFARGE)}</div></div>
      <div class="h-rad"><span>Skjegg</span><div>${valg("skjegg", ["ja", "nei"])}</div></div>`;
  }

  function tilpass() {
    if (!lerret) return;
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
    const a = (((e.clientX - r.left) / r.width) * logW / zoom - kam[0]) / (TW / 2), b = (((e.clientY - r.top) / r.height) * logH / zoom - kam[1]) / (TH / 2);
    return [Math.floor((a + b) / 2), Math.floor((b - a) / 2)];
  }

  // Rull rommet inn i bildet, så det nye møbelet kan settes ut med en gang
  const visRommet = () => lerret && lerret.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Knapper utenfor lerretet. Gjelder både innsjekkingen og selve hotellet.
  rot.addEventListener("click", (e) => {
    const k = e.target.closest("button");
    if (!k || k.disabled) return;
    if (k.dataset.gest) send("gest", k.dataset.gest);
    else if (k.dataset.rom && k.dataset.rom !== rom) gaTil(k.dataset.rom, null);
    else if (k.dataset.felt && look) {
      look = { ...look, [k.dataset.felt]: k.dataset.verdi };
      if (meg) meg.utseende = look;
      visGarderobe();
      clearTimeout(lagreTid);
      if (meg) lagreTid = setTimeout(() => api("hotell/utseende", post(look)).catch(() => {}), 500);
    }
    else if (k.dataset.innred !== undefined) { innred = !innred; valgt = null; melding = ""; visInnred(); }
    else if (k.dataset.velg) { valgt = valgt === Number(k.dataset.velg) ? null : Number(k.dataset.velg); visInnred(); if (valgt) visRommet(); }
    else if (k.dataset.kjop) innredning("hotell/kjop", { type: k.dataset.kjop }, (s) => { innred = true; valgt = s.id; visRommet(); });
  });
  rot.addEventListener("change", (e) => { if (e.target.id === "h-besok" && e.target.value) gaTil(e.target.value, null); });

  function bygg() {
    rot.innerHTML = `
      <div class="h-rom" id="h-rom"></div>
      <div class="h-ramme"><canvas id="h-lerret" aria-label="Rommet. Trykk på gulvet for å gå."></canvas></div>
      <form class="h-prat" id="h-prat">
        <input id="h-tekst" maxlength="140" placeholder="Si noe til rommet …" autocomplete="off" aria-label="Si noe">
        <button class="knapp" type="submit">Si</button>
        <div class="h-gester">${Object.keys(GESTER).map((g) => `<button class="liten-knapp" type="button" data-gest="${g}">${{ vink: "Vink", skal: "Skål", dans: "Dans" }[g]}</button>`).join("")}</div>
      </form>
      <div id="h-innred"></div>
      <div class="h-to">
        <section class="h-boks"><p class="h-etikett">Praten</p><ul class="h-logg" id="h-logg"></ul></section>
        <section class="h-boks"><p class="h-etikett">Garderoben</p><div id="h-garderobe"></div>
          <p class="dempet h-hjelp">Trykk på gulvet for å gå, på en stol for å sette deg og på en dør for å bytte rom.</p></section>
      </div>`;
    lerret = document.getElementById("h-lerret");
    ctx = lerret.getContext("2d");
    tilpass();
    visGarderobe();

    lerret.addEventListener("click", (e) => {
      const [x, y] = tilFlis(e);
      if (innred && erMitt() && hjem) innredKlikk(x, y); else ga(x, y);
    });
    lerret.addEventListener("pointermove", (e) => { peker = tilFlis(e); });
    lerret.addEventListener("pointerleave", () => { peker = null; });
    document.getElementById("h-prat").addEventListener("submit", (e) => {
      e.preventDefault();
      const felt = document.getElementById("h-tekst");
      const tekst = felt.value.replace(/\s+/g, " ").trim();
      if (tekst) send("si", tekst);
      felt.value = "";
    });
    window.addEventListener("resize", tilpass);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && meg && !bytter) api("hotell/flytt", post({ rom, x: Math.round(meg.x), y: Math.round(meg.y) })).then(hent).catch(() => {});
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

  // Første gang: lag figuren din før du slipper inn
  function visInnsjekk() {
    rot.innerHTML = `<div class="h-innsjekk">
      <canvas id="h-speil" width="480" height="640" aria-hidden="true"></canvas>
      <div>
        <p class="overline">Innsjekking</p>
        <h2>Lag figuren din</h2>
        <p>Før portieren slipper deg inn, må du bestemme hvordan du ser ut. Du kan bytte om i garderoben senere.</p>
        <div id="h-garderobe"></div>
        <button class="knapp" type="button" id="h-sjekkinn">Sjekk inn som ${esc(MEG)}</button>
        <p class="melding feil" id="h-innfeil" hidden></p>
      </div></div>`;
    visGarderobe();
    const speil = document.getElementById("h-speil"), c = speil.getContext("2d");
    let aktiv = true;
    const ramme = (ms) => {
      if (!aktiv || !speil.isConnected) return;
      const t = ms / 1000;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.clearRect(0, 0, 240, 320);
      c.fillStyle = "#c2b697"; c.beginPath(); c.moveTo(120, 248); c.lineTo(216, 280); c.lineTo(120, 312); c.lineTo(24, 280); c.closePath(); c.fill();
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(120, 280, 44, 14, 0, 0, 7); c.fill();
      c.save(); c.translate(120, 280); c.scale(3, 3);
      figur(c, look, { t, gaar: false, sitter: false, gest: t % 7 < 2.2 ? "vink" : null, flip: false, bak: false });
      c.restore();
      requestAnimationFrame(ramme);
    };
    requestAnimationFrame(ramme);
    document.getElementById("h-sjekkinn").addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      look = { ...look, klar: "ja" };
      try { await api("hotell/utseende", post(look)); aktiv = false; start(); }
      catch (err) { const f = document.getElementById("h-innfeil"); f.textContent = err.message; f.hidden = false; e.currentTarget.disabled = false; }
    });
  }

  function start() {
    bygg();
    const onsket = new URLSearchParams(location.search).get("rom") || "";
    gaTil(ROM[onsket] || onsket.startsWith("hjem:") ? onsket : "lobbyen", null);
  }

  (async () => {
    if (!(await hvemErJeg())) {
      rot.innerHTML = `<p class="tomt">Hotellet er bare for brødrene. <a href="salongen.html">Logg inn</a> for å sjekke inn.</p>`;
      return;
    }
    let profil = null;
    try { profil = (await api("hotell/profil")).utseende; } catch (_) {}
    look = utseende(profil, MEG);
    if (!profil || profil.klar !== "ja") visInnsjekk(); else start();
  })();
})();
