// TAFSE HOTELL: rom sett skrått ovenfra, der hver bror styrer sin egen figur.
// Trykk på gulvet for å gå, på en stol for å sette deg og på en dør for å bytte rom.
// Hver bror har også sitt eget rom. Det vokser med villaen i Symposion og innredes fra butikken,
// der man betaler med premiene fra alle spillene. Serveren (lib/hotell.js) holder orden på alt,
// også katalogen og prisene. Her ligger tegningene: MOBEL, GULVSTIL, VEGGSTIL, figur() og dyr().

(() => {
  const rot = document.getElementById("h");
  const TW = 64, TH = 32;          // en gulvflis på skjermen
  const FART = 3.4;                // fliser i sekundet
  const HENT_HVERT = 1600;         // millisekunder mellom hver gang vi spør serveren

  const HUD = ["#f6d7bd", "#eac19f", "#d19f76", "#a8734d", "#6e4a30"];
  const HAR = ["kort", "langt", "krøller", "knute", "skallet"];
  const HARFARGE = ["#1c1612", "#4a2f1c", "#8a5a2b", "#c9a35a", "#b5482a", "#9a9a9a", "#ece4d2"];
  const TOGA = ["#ece4d2", "#8e2f52", "#2f5d8e", "#2f7d5b", "#c9a24a", "#5b3a8e", "#b5482a", "#2b2b2b"];
  const GESTER = { vink: "vinker", skal: "skåler", dans: "danser", klapp: "klapper", ler: "ler" };
  const BARES = ["hode", "pynt", "dyr"];   // det figuren kan ha på seg eller med seg
  const PROFESSOR = "Professor Lund", TALERSTOL = [3, 1];   // samme som i lib/auditoriet.js

  // ---------- Fellesrommene ----------
  // Koordinater: x går ned mot høyre, y ned mot venstre. Veggene står langs x = 0 og y = 0.
  const ROM = {
    lobbyen: {
      navn: "Lobbyen", b: 11, d: 11, start: [5, 9], vegg: 112, veggfarge: ["#5a1d2c", "#6f2638"], bakgrunn: ["#141110", "#0b0b0a"],
      gulv: (x, y) => (x === 5 && y >= 1 ? (y % 2 ? "#8e2f52" : "#842a4b") : (x + y) % 2 ? "#d8cdb4" : "#c2b697"),
      skilt: { side: "h", pos: 3.6, z: 62, tekst: "TAFSE HOTELL", font: "700 22px Cinzel, Georgia, serif" },
      dorer: [{ x: 9, y: 0, side: "h", til: "baren" }, { x: 0, y: 8, side: "v", til: "terrassen" }, { x: 0, y: 2, side: "v", til: "auditoriet" }],
      mobler: [
        ["disk", 6, 1], ["disk", 7, 1], ["disk", 8, 1],
        ["sofa", 0, 3, "v"], ["sofa", 0, 4, "v"], ["sofa", 0, 5, "v"], ["bord", 2, 4],
        ["bord", 8, 7], ["krakk", 7, 7], ["krakk", 9, 7], ["krakk", 8, 6], ["krakk", 8, 8],
        ["soyle", 0, 0], ["soyle", 0, 6], ["soyle", 10, 0], ["plante", 0, 1], ["plante", 10, 1], ["plante", 1, 10],
        ["amfora", 10, 5], ["amfora", 10, 6], ["fontene", 2, 7], ["laurbartre", 10, 10], ["kandelaber", 4, 0],
      ],
      npc: [{ navn: "Portieren", x: 7, y: 0, utseende: { hud: HUD[1], har: "kort", harfarge: "#9a9a9a", skjegg: "ja", toga: "#2b2b2b" },
        replikker: ["Velkommen til Tafse Hotell.", "Baren ligger gjennom døra til høyre.", "Terrassen har basseng. Togaen tåler vann.", "Rommet ditt finner du øverst. Det vokser med villaen i Symposion.", "Butikken tar imot premier fra alle spillene. Vi er ikke kresne.", "Frokost serveres aldri. Vi er et taffelakademi.", "Auditoriet ligger bak døra ved sofaen. Professoren biter, men bare faglig.", "Rom 1412 er dessverre opptatt."] }],
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
        ["vinfat", 0, 7], ["vinfat", 0, 8], ["plante", 9, 0], ["soyle", 0, 0], ["lyre", 9, 8], ["festbord", 5, 8], ["jukeboks", 3, 0],
      ],
      npc: [{ navn: "Dionysos", x: 0, y: 3, utseende: { hud: HUD[2], har: "krøller", harfarge: "#1c1612", skjegg: "ja", toga: "#8e2f52" },
        replikker: ["Hva skal det være? Vi har vin, vin og vin.", "Skål, bror!", "Dansegulvet lyser ikke for ingenting.", "Jeg blander aldri vinen med vann. Det er det dere som gjør.", "Siste runde var for to tusen år siden.", "Jukeboksen står ved veggen. Sirtakien er populær."] }],
    },
    terrassen: {
      navn: "Terrassen", b: 11, d: 10, start: [5, 2], vegg: 30, veggfarge: ["#8f8672", "#a39a84"], bakgrunn: ["#0a0d18", "#1c2136"], himmel: true,
      vann: (x, y) => x >= 3 && x <= 6 && y >= 4 && y <= 7,
      gulv: (x, y, t) => (x >= 3 && x <= 6 && y >= 4 && y <= 7 ? `hsl(198 ${52 + Math.sin(t * 2 + x + y) * 6}% ${38 + Math.sin(t * 1.5 + x * 2 - y) * 3}%)` : (x + y) % 2 ? "#b9ae97" : "#aa9f88"),
      dorer: [{ x: 5, y: 0, side: "h", til: "lobbyen" }],
      mobler: [
        ["solseng", 8, 4], ["solseng", 8, 6], ["solseng", 1, 5], ["solseng", 1, 7],
        ["tre", 0, 0], ["tre", 10, 0], ["tre", 0, 9], ["fakkel", 2, 3], ["fakkel", 7, 3], ["fakkel", 2, 8], ["fakkel", 7, 8],
        ["bord", 9, 9], ["krakk", 8, 9], ["krakk", 10, 9], ["amfora", 10, 2], ["ildskal", 9, 1], ["druestokk", 2, 0],
      ],
      npc: [],
    },
    // Auditoriet: Professor Lund (lib/auditoriet.js) svarer den som står på talerstolen
    auditoriet: {
      navn: "Auditoriet", b: 12, d: 11, start: [1, 9], vegg: 112, veggfarge: ["#1f2a36", "#273443"], bakgrunn: ["#0e1116", "#0b0b0a"],
      gulv: (x, y) => (y <= 2 ? ((x + y) % 2 ? "#6f2638" : "#652233") : y % 2 ? "#6b4f36" : "#62482f"),
      skilt: { side: "v", pos: 6.3, z: 90, tekst: "SAPERE AUDE", font: "700 20px Cinzel, Georgia, serif" },
      dorer: [{ x: 0, y: 9, side: "v", til: "lobbyen" }],
      talerstol: TALERSTOL,
      veggpynt: (rom, t) => {
        // Tavla bak kateteret, med kritt
        vf("h", 4.35, 7.65, 38, 104, "#5a4630"); vf("h", 4.45, 7.55, 41, 101, "#1f3a2e");
        vf("h", 4.4, 7.6, 37, 40, "#8a6038");
        const kritt = "#e8e4d8";
        veggTekst("h", 6, 86, "H₀: alt er i orden", "italic 600 13px 'EB Garamond', Georgia, serif", kritt);
        veggTekst("h", 6, 69, "p < 0,05 ?", "italic 600 13px 'EB Garamond', Georgia, serif", kritt);
        veggTekst("h", 6, 52, "∴ Q.E.D.", "italic 600 13px 'EB Garamond', Georgia, serif", kritt);
        vf("h", 7.1, 7.3, 41.5, 43, "#f5efe0");
      },
      mobler: [
        ["talerstol", 3, 2], ["talerstol", 8, 2],
        ...[5, 7, 9].flatMap((y) => [2, 3, 4, 6, 7, 8, 9].map((x) => ["benk", x, y])),
        ["soyle", 0, 0], ["soyle", 11, 0], ["kandelaber", 1, 0], ["kandelaber", 10, 0],
        ["bokhylle", 0, 2, "v"], ["bokhylle", 0, 3, "v"], ["plante", 0, 4], ["statue", 0, 10], ["laurbartre", 11, 10],
        ["vindu", 0, 5], ["vindu", 0, 7], ["vegglampe", 0, 1], ["vegglampe", 0, 9],
      ],
      npc: [{ navn: PROFESSOR, x: 8, y: 1, ai: true, utseende: { hud: HUD[0], har: "skallet", harfarge: "#ece4d2", skjegg: "ja", toga: "#2b2b2b", briller: "ja" },
        replikker: ["Jeg er ikke døv, bare gammel. Skriv i feltet under, så svarer jeg."] }],
    },
  };

  const INFO = `
    <p>Tafse Hotell er et sted der alle kan møtes, prate og vise frem rommene sine. Hver figur styres av den som eier den.</p>
    <h3>Gå og sitte</h3>
    <p>Trykk på gulvet, så går figuren dit og finner veien rundt møblene selv. Trykk på en sofa, krakk, seng eller solseng for å sette deg. Gå gjennom en dør, eller bruk knappene over rommet, for å bytte rom.</p>
    <h3>Prat</h3>
    <p>Det du skriver, kommer som en snakkeboble over hodet ditt og i praten under rommet. Du kan også vinke, skåle og danse. Portieren og Dionysos svarer når du trykker på dem, og i auditoriet venter professoren. Det tar et par sekunder før de andre ser det du gjør.</p>
    <h3>Folk</h3>
    <p>Trykk på en figur for å se profilkortet. Der kan du gi respekt (tre om dagen), hviske, besøke rommet deres, gi bort møbler fra lageret ditt og, for 14 oliven, gi en slibrig kommentar som hele rommet hører. Kortet viser også merkene de har tjent, for eksempel Skattejeger og Disputert. Trykk på deg selv for å se dine egne.</p>
    <h3>Moro</h3>
    <ul>
      <li><strong>Terning:</strong> Trill en terning som hele rommet ser.</li>
      <li><strong>Jukeboksen</strong> står i baren. Alle der inne hører sangen du velger.</li>
      <li><strong>Skattejakt:</strong> Hver halvtime dukker det opp en glitrende kiste et sted i fellesrommene. Den første som stiller seg på den, får premien.</li>
      <li><strong>Gjestebok:</strong> Legg igjen en hilsen når du besøker rommet til noen.</li>
    </ul>
    <h3>Rommene</h3>
    <ul>
      <li><strong>Lobbyen</strong>, <strong>baren</strong> med dansegulv, <strong>terrassen</strong> med basseng og <strong>auditoriet</strong> er felles for alle.</li>
      <li><strong>Rommet mitt</strong> er ditt eget. Tallet på knappene viser hvor mange som er inne.</li>
      <li><strong>Besøk noen</strong> tar deg til rommet til en av de andre.</li>
    </ul>
    <h3>Auditoriet</h3>
    <p>Her kan du øve på disputas med Professor Sokrates Lund. Gå opp på talerstolen til venstre for tavla, eller trykk på professoren, så tar han det derfra. Han spør hvem du er og hvor du tar doktorgraden, og spiller opponent etter oppsettet ved OsloMet, UiO eller Aix-Marseille. Han husker deg til neste gang. Hele salen ser samtalen, og fra benkene kan du komme med innspill ex auditorio ved å nevne professoren. Han er en språkmodell, så sjekk reglene hos ditt eget fakultet.</p>
    <h3>Rommet ditt</h3>
    <p>Størrelsen følger villaen din i Symposion. Uten gods er rommet 4 × 4 fliser, og en villa på høyeste nivå gir 8 × 8. Bygg ut villaen i <a href="symposion.html">Symposion</a>, eller kjøp en utvidelse i butikken, for å få større rom. Med begge utvidelsene kan rommet bli 10 × 10.</p>
    <table class="tavle"><thead><tr><th>Villanivå</th><th>Rommet</th></tr></thead><tbody>
      <tr><td>Ikke flyttet inn</td><td>4 × 4</td></tr><tr><td>1–2</td><td>5 × 5, tregulv</td></tr><tr><td>3–4</td><td>6 × 6, terrakotta</td></tr><tr><td>5–7</td><td>7 × 7, marmor</td></tr><tr><td>8–10</td><td>8 × 8, marmor med gull</td></tr>
    </tbody></table>
    <h3>Premier fra spillene</h3>
    <p>Hvert spill gir sin egen premie, og alle brukes i butikken her. Dagens første spill i hvert spill gir dobbel premie.</p>
    <table class="tavle"><thead><tr><th>Spill</th><th>Premie</th><th>Slik får du den</th></tr></thead><tbody>
      <tr><td>Symposion</td><td>oliven, vin og marmor</td><td>Høstes på godset</td></tr>
      <tr><td>Tartaros</td><td>drakmer</td><td>Mynter, bosser og tid i hvert tokt</td></tr>
      <tr><td>2048</td><td>mosaikkbiter</td><td>1 per 100 poeng</td></tr>
      <tr><td>Murbrekker</td><td>teglstein</td><td>1 per 50 poeng</td></tr>
      <tr><td>Tetris</td><td>steinblokker</td><td>1 per 300 poeng</td></tr>
      <tr><td>Snake</td><td>slangeskinn</td><td>1 per 5 poeng</td></tr>
      <tr><td>Idus Martiae</td><td>dolker</td><td>1 per 2 poeng</td></tr>
    </tbody></table>
    <h3>Butikken</h3>
    <p>Butikken ligger under rommet og er delt i faner. Noen varer koster én premie, andre en blanding. Olympens trone koster litt av alt.</p>
    <ul>
      <li><strong>Møbler, planter og pynt</strong> settes ut i rommet ditt. Du kan ha opptil 80.</li>
      <li><strong>Tepper og fliser</strong> ligger på gulvet, og du kan sette et møbel oppå. Bassenget kan du vasse i.</li>
      <li><strong>Veggpynt</strong> henger på veggen bak en flis inntil veggen.</li>
      <li><strong>Trofeer</strong> koster premien fra ett spill og krever en bragd i det spillet, for eksempel brikken 2048.</li>
      <li><strong>Gulv og vegger</strong> gir hele rommet ny stil. Du bytter mellom stilene du eier i rommet ditt.</li>
      <li><strong>Garderoben</strong> har hodeplagg og tilbehør, og <strong>kjæledyrene</strong> følger deg rundt i hele hotellet.</li>
    </ul>
    <h3>Innredning</h3>
    <p>Gå til rommet ditt og trykk «Innred rommet». Velg noe fra lageret og trykk på en ledig flis for å sette det ut. Trykk på et møbel i rommet for å ta det ned igjen. Døra kan ikke sperres.</p>
    <h3>Garderoben</h3>
    <p>Under rommet kan du når som helst bytte toga, hudfarge, hår og skjegg, og ta på det du har kjøpt.</p>`;

  // ---------- Tilstand ----------
  let rom = "lobbyen", R = ROM[rom], ruter = [], mobler = [];
  let figurer = new Map();   // navn → figur (brødre og hotellets egne)
  let meg = null, look = null, etter = 0, forste = true, antall = {}, medlemmer = [], gjesterom = [], logg = [];
  let hjem = null, innred = false, valgt = null, melding = "";   // rommet til en bror, og innredning av eget rom
  let butikk = null, fane = "mobler", kvittering = null, veggting = [];   // butikken, og det som henger på veggene i rommet
  let bytter = false, romNokkel = "", innredNokkel = "", butikkNokkel = "";
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
  // Hotellet er for alle, så «(gjest)» vises ikke. Unntaket er en gjest som heter det samme som en bror.
  const vis = (navn) => { const kort = String(navn || "").replace(/ \(gjest\)$/, ""); return kort !== navn && (medlemmer.includes(kort) || kort === PROFESSOR) ? navn : kort; };
  const romNavn = (id) => (ROM[id] ? ROM[id].navn : id === mittRom() ? "Rommet ditt" : `${eier(vis(id.slice(5)))} rom`);
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
  // f er posisjonen langs veggen møbelet står mot, g er avstanden ut fra veggen
  const klm = (x, y, mot, f0, g0, f1, g1, z0, z1, farge) => (mot === "v" ? kloss(x, y, g0, f0, g1, f1, z0, z1, farge) : kloss(x, y, f0, g0, f1, g1, z0, z1, farge));
  // En flate på forsiden av et møbel, g ut fra veggen
  const front = (x, y, mot, f0, f1, g, z0, z1, farge) => flate(mot === "v"
    ? [P(x + g, y + f0, z0), P(x + g, y + f1, z0), P(x + g, y + f1, z1), P(x + g, y + f0, z1)]
    : [P(x + f0, y + g, z0), P(x + f1, y + g, z0), P(x + f1, y + g, z1), P(x + f0, y + g, z1)], farge);
  const ell = (a, b, rx, ry, farge) => { ctx.fillStyle = farge; ctx.beginPath(); ctx.ellipse(a, b, rx, ry, 0, 0, 7); ctx.fill(); };
  const rk = (a, b, w, h, farge) => { ctx.fillStyle = farge; ctx.fillRect(a, b, w, h); };
  const flamme = (a, b, t, fro, s = 1) => { const f = 1 + Math.sin(t * 9 + fro) * 0.15; ell(a, b, 5 * s, 10 * s * f, "#f2c14e"); ell(a, b + 3 * s, 2.5 * s, 5 * s * f, "#fff0b8"); };
  const glod = (a, b, r, styrke = 0.4) => { const g = ctx.createRadialGradient(a, b, 2, a, b, r); g.addColorStop(0, `rgba(242,193,78,${styrke})`); g.addColorStop(1, "rgba(242,193,78,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.fill(); };
  const sokkel = (x, y, h = 14) => kloss(x, y, 0.22, 0.22, 0.78, 0.78, 0, h, "#d8cdb4");
  // Veggene: side «h» er veggen langs y = 0, «v» veggen langs x = 0. pos er fliser bortover, z høyden.
  const veggP = (side, pos, z) => (side === "h" ? P(pos, 0, z) : P(0, pos, z));
  const vf = (side, p0, p1, z0, z1, farge) => flate([veggP(side, p0, z0), veggP(side, p1, z0), veggP(side, p1, z1), veggP(side, p0, z1)], farge);
  // Tegner rett på veggen: origo ved pos i høyden z, 32 enheter per flis bortover og y nedover
  const paVegg = (side, pos, z, tegn) => { ctx.save(); ctx.transform(1, side === "h" ? 0.5 : -0.5, 0, 1, 0, 0); ctx.translate((side === "h" ? 1 : -1) * pos * TW / 2, -z); tegn(); ctx.restore(); };
  const hs = (i, k) => (((Math.sin(i * 127.1 + k * 311.7) * 43758.5453) % 1) + 1) % 1;   // fast «tilfeldig» tall mellom 0 og 1
  const TETRIS = ["#4fc3d9", "#edc22e", "#9a5bd0", "#f08a4b", "#6fbf5a", "#e0533d", "#3f6fd0"];
  // mot = "v" betyr at ryggen står mot venstre vegg (x = 0), ellers mot høyre vegg (y = 0)
  const MOBEL = {
    jukeboks: { blokk: true, klikk: "jukeboks", tegn(x, y, _, t) {
      kloss(x, y, 0.14, 0.3, 0.86, 0.74, 0, 46, "#6b1f3a");
      kloss(x, y, 0.2, 0.34, 0.8, 0.7, 46, 58, "#8e2f52");
      const [a, b] = P(x + 0.5, y + 0.74, 0);
      for (let i = 0; i < 5; i++) rk(a - 17 + i * 7.2, b - 40 - Math.abs(Math.sin(t * 4 + i * 1.3)) * 10, 5, 10 + Math.abs(Math.sin(t * 4 + i * 1.3)) * 10, `hsl(${(i * 60 + t * 60) % 360} 70% 60%)`);
      rk(a - 19, b - 22, 38, 3, "#c9a24a"); rk(a - 19, b - 54, 38, 3, "#c9a24a"); glod(a, b - 34, 40, 0.18);
    } },
    talerstol: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.18, 0.24, 0.82, 0.76, 0, 4, "#3a2a18");
      kloss(x, y, 0.26, 0.32, 0.74, 0.68, 4, 34, "#6b4a2a");
      kloss(x, y, 0.25, 0.31, 0.75, 0.69, 18, 21, "#c9a24a");
      kloss(x, y, 0.16, 0.2, 0.84, 0.8, 34, 39, "#8a6038");
      flate([P(x + 0.3, y + 0.3, 39.5), P(x + 0.66, y + 0.3, 39.5), P(x + 0.66, y + 0.62, 39.5), P(x + 0.3, y + 0.62, 39.5)], "#ece4d2");
    } },
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
    // ----- Flere møbler -----
    benk: { sete: 15, tegn(x, y, mot) { klm(x, y, mot, 0.12, 0.3, 0.26, 0.8, 0, 11, "#d8cdb4"); klm(x, y, mot, 0.74, 0.3, 0.88, 0.8, 0, 11, "#d8cdb4"); klm(x, y, mot, 0.05, 0.25, 0.95, 0.85, 11, 15, "#ece4d2"); } },
    kline: { sete: 15, tegn(x, y, mot) {
      klm(x, y, mot, 0.04, 0.1, 0.96, 0.9, 0, 11, "#5a4630"); klm(x, y, mot, 0.04, 0.1, 0.96, 0.9, 11, 15, "#2f5d8e");
      klm(x, y, mot, 0.04, 0.1, 0.24, 0.9, 15, 24, "#c9a24a"); klm(x, y, mot, 0.3, 0.2, 0.5, 0.8, 15, 18, "#ece4d2");
    } },
    bokhylle: { blokk: true, tegn(x, y, mot) {
      klm(x, y, mot, 0.06, 0.04, 0.94, 0.42, 0, 76, "#5a4630");
      const ruller = ["#ece4d2", "#d8cdb4", "#c9a24a", "#8e2f52", "#ece4d2", "#2f5d8e"];
      for (let h = 0; h < 3; h++) {
        const z = 6 + h * 23;
        front(x, y, mot, 0.12, 0.88, 0.42, z, z + 19, "#2b2118");
        for (let i = 0; i < 5; i++) front(x, y, mot, 0.16 + i * 0.145, 0.27 + i * 0.145, 0.42, z, z + 8 + ((i + h) % 3) * 4, ruller[(i + h * 2) % ruller.length]);
      }
    } },
    festbord: { blokk: true, tegn(x, y) {
      for (const [fx, fy] of [[0.1, 0.1], [0.78, 0.1], [0.1, 0.78], [0.78, 0.78]]) kloss(x, y, fx, fy, fx + 0.12, fy + 0.12, 0, 18, "#5a4630");
      kloss(x, y, 0.03, 0.03, 0.97, 0.97, 18, 22, "#7a5532");
      const [a, b] = P(x + 0.5, y + 0.5, 22);
      ell(a - 9, b - 1, 9, 4.5, "#ece4d2"); for (const [dx, dy] of [[-12, -3], [-8, -4], [-10, -1], [-6, -2], [-9, -6]]) ell(a + dx, b + dy, 2.6, 2.6, "#6b2f6e");
      ell(a + 8, b + 6, 8, 3.5, "#c98f4e"); ell(a + 8, b + 5, 6, 2.2, "#e0b070");
      rk(a + 5, b - 14, 6, 8, "#c9a24a"); rk(a + 6.5, b - 6, 3, 4, "#c9a24a"); rk(a + 4, b - 2.5, 8, 1.5, "#c9a24a"); rk(a + 5, b - 14, 6, 2, "#8e2f52");
    } },
    spillebord: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.4, 0.4, 0.6, 0.6, 0, 16, "#5a4630"); kloss(x, y, 0.1, 0.1, 0.9, 0.9, 16, 20, "#2b2118");
      const F = ["#eee4da", "#f2b179", "#edc22e", "#f67c5f", "#ede0c8", "#f59563", "#edcf72", "#f65e3b"];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const fx = x + 0.16 + i * 0.175, fy = y + 0.16 + j * 0.175; flate([P(fx, fy, 20), P(fx + 0.15, fy, 20), P(fx + 0.15, fy + 0.15, 20), P(fx, fy + 0.15, 20)], F[(i * 3 + j * 5) % F.length]); }
    } },
    kiste: { blokk: true, tegn(x, y, mot) {
      klm(x, y, mot, 0.12, 0.25, 0.88, 0.78, 0, 16, "#6b4a2a"); klm(x, y, mot, 0.12, 0.25, 0.88, 0.78, 16, 23, "#8a6038");
      for (const f of [0.12, 0.78]) klm(x, y, mot, f, 0.245, f + 0.1, 0.785, 0, 23.5, "#c9a24a");
      front(x, y, mot, 0.44, 0.56, 0.785, 11, 19, "#e2c174");
    } },
    lyre: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.3, 0.3, 0.7, 0.7, 0, 6, "#5a4630");
      const [a, b] = P(x + 0.5, y + 0.5, 6);
      ell(a, b - 8, 10, 8, "#8a6038"); ell(a, b - 9, 6, 4.5, "#5a3a22");
      ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.beginPath();
      ctx.moveTo(a - 8, b - 12); ctx.quadraticCurveTo(a - 20, b - 34, a - 9, b - 52); ctx.moveTo(a + 8, b - 12); ctx.quadraticCurveTo(a + 20, b - 34, a + 9, b - 52); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a - 13, b - 48); ctx.lineTo(a + 13, b - 48); ctx.stroke(); ctx.lineCap = "butt";
      ctx.strokeStyle = "#ece4d2"; ctx.lineWidth = 1; ctx.beginPath(); for (const dx of [-6, -3, 0, 3, 6]) { ctx.moveTo(a + dx, b - 47); ctx.lineTo(a + dx * 0.7, b - 11); } ctx.stroke();
    } },
    ildsted: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ell(a, b, 22, 11, "#4a4336"); ell(a, b - 4, 22, 11, "#6b6252"); ell(a, b - 4, 15, 7.5, "#1c1612");
      ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a - 9, b - 2); ctx.lineTo(a + 8, b - 7); ctx.moveTo(a - 8, b - 7); ctx.lineTo(a + 9, b - 2); ctx.stroke(); ctx.lineCap = "butt";
      glod(a, b - 14, 50); flamme(a - 5, b - 13, t, x); flamme(a + 5, b - 12, t, x + 2, 0.8); flamme(a, b - 17, t, x + 4, 1.2);
    } },
    badekar: { blokk: true, tegn(x, y, mot, t) {
      klm(x, y, mot, 0.06, 0.18, 0.94, 0.82, 0, 17, "#ece4d2");
      flate(mot === "v" ? [P(x + 0.25, y + 0.12, 17), P(x + 0.75, y + 0.12, 17), P(x + 0.75, y + 0.88, 17), P(x + 0.25, y + 0.88, 17)] : [P(x + 0.12, y + 0.25, 17), P(x + 0.88, y + 0.25, 17), P(x + 0.88, y + 0.75, 17), P(x + 0.12, y + 0.75, 17)], `hsl(198 55% ${44 + Math.sin(t * 2 + x) * 3}%)`);
      klm(x, y, mot, 0.06, 0.18, 0.14, 0.3, 17, 27, "#c9a24a");
    } },
    // ----- Planter og pynt -----
    vase: { blokk: true, tegn(x, y) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ell(a, b, 11, 5, "rgba(0,0,0,.25)"); ell(a, b - 11, 9, 11, "#2f5d8e"); rk(a - 9, b - 13, 18, 3, "#ece4d2"); rk(a - 4, b - 26, 8, 6, "#2f5d8e"); rk(a - 6, b - 28, 12, 2.5, "#ece4d2");
      const B = [[-9, -44, "#b5282a"], [0, -50, "#f2c14e"], [9, -43, "#e88fb0"], [-4, -40, "#f2c14e"], [5, -38, "#b5282a"]];
      ctx.strokeStyle = "#4f6a34"; ctx.lineWidth = 1.5; ctx.beginPath(); for (const [dx, dy] of B) { ctx.moveTo(a, b - 27); ctx.lineTo(a + dx, b + dy); } ctx.stroke();
      for (const [dx, dy, c] of B) ell(a + dx, b + dy, 4, 4, c);
    } },
    kandelaber: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ell(a, b, 10, 4.5, "#8a6f33"); rk(a - 1.5, b - 48, 3, 48, "#c9a24a"); rk(a - 14, b - 40, 28, 2.5, "#c9a24a");
      for (const dx of [-13, 0, 13]) { const h = dx ? 46 : 54; rk(a + dx - 1.5, b - h, 3, dx ? 8 : 6, "#c9a24a"); rk(a + dx - 3.5, b - h - 2, 7, 2.5, "#e2c174"); rk(a + dx - 1.5, b - h - 8, 3, 6, "#ece4d2"); glod(a + dx, b - h - 13, 16, 0.3); flamme(a + dx, b - h - 13, t, x + dx, 0.55); }
    } },
    ildskal: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ctx.strokeStyle = "#8a6f33"; ctx.lineWidth = 3; ctx.beginPath(); for (const dx of [-11, 0, 11]) { ctx.moveTo(a + dx * 0.5, b - 24); ctx.lineTo(a + dx, b + (dx ? 0 : 4)); } ctx.stroke();
      ell(a, b - 26, 15, 7, "#8a6f33"); ell(a, b - 28, 15, 7, "#b08d57"); ell(a, b - 28, 11, 4.5, "#3a2a18");
      glod(a, b - 38, 48); flamme(a - 4, b - 36, t, y); flamme(a + 4, b - 35, t, y + 3, 0.8); flamme(a, b - 40, t, y + 5, 1.1);
    } },
    laurbartre: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.28, 0.28, 0.72, 0.72, 0, 16, "#ece4d2"); kloss(x, y, 0.24, 0.24, 0.76, 0.76, 16, 19, "#c9a24a");
      const [a, b] = P(x + 0.5, y + 0.5, 19);
      rk(a - 2, b - 26, 4, 26, "#5a4630");
      ell(a, b - 40, 19, 19, "#3f5a2e"); ell(a - 5, b - 45, 12, 11, "#4f6a34"); ell(a + 6, b - 36, 8, 7, "#35502a");
      for (const [dx, dy] of [[-9, -48], [4, -52], [10, -40], [-3, -36], [-12, -38]]) ell(a + dx, b + dy, 2.2, 2.2, "#7a9a52");
    } },
    druestokk: { blokk: true, tegn(x, y) {
      kloss(x, y, 0.12, 0.44, 0.2, 0.56, 0, 62, "#6b4a2a"); kloss(x, y, 0.8, 0.44, 0.88, 0.56, 0, 62, "#6b4a2a"); kloss(x, y, 0.08, 0.42, 0.92, 0.58, 62, 66, "#6b4a2a");
      const [a, b] = P(x + 0.5, y + 0.5);
      for (const [dx, dy, r, c] of [[-11, -68, 9, "#4f6a34"], [0, -64, 10, "#5f7d3d"], [11, -58, 9, "#4f6a34"], [-5, -56, 7, "#6b8a45"], [7, -50, 7, "#5f7d3d"]]) ell(a + dx, b + dy, r, r * 0.8, c);
      for (const [dx, dy] of [[-8, -46], [3, -40], [13, -38]]) for (const [ex, ey] of [[0, 0], [-3, -4], [3, -4], [0, -8], [-2, 4], [2, 4]]) ell(a + dx + ex, b + dy + ey, 2.8, 2.8, "#6b2f6e");
    } },
    fontene: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ell(a, b, 26, 13, "#b9ae97"); ell(a, b - 6, 26, 13, "#ece4d2"); ell(a, b - 6, 21, 10, `hsl(198 55% ${44 + Math.sin(t * 2) * 3}%)`);
      rk(a - 3.5, b - 34, 7, 28, "#d8cdb4"); ell(a, b - 34, 12, 5.5, "#ece4d2"); ell(a, b - 35, 9, 3.6, "hsl(198 55% 50%)"); rk(a - 2, b - 46, 4, 11, "#d8cdb4");
      ctx.fillStyle = "rgba(190,230,245,.9)";
      for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) { const f = (t * 0.9 + k / 4 + i * 0.13) % 1, v = (i / 6) * Math.PI * 2, r = f * 19; ctx.beginPath(); ctx.arc(a + Math.cos(v) * r, b - 48 + Math.sin(v) * r * 0.5 - Math.sin(f * Math.PI) * 14 + f * 40, 1.6, 0, 7); ctx.fill(); }
    } },
    // ----- Tepper og fliser (ligger på gulvet, under alt annet) -----
    delfin: { gulv: true, tegn(x, y) {
      rombe(x, y, 0.04, "#ece4d2"); rombe(x, y, 0.1, "#2f6f8e"); rombe(x, y, 0.16, "#3a80a0");
      const [a, b] = P(x + 0.5, y + 0.5);
      ctx.save(); ctx.translate(a, b); ctx.scale(1, 0.5); ctx.fillStyle = "#ece4d2"; ctx.beginPath();
      ctx.moveTo(-15, 6); ctx.quadraticCurveTo(-4, -18, 13, -2); ctx.lineTo(17, -7); ctx.lineTo(16, 3); ctx.quadraticCurveTo(2, -6, -8, 4); ctx.lineTo(-13, 12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-1, -9); ctx.lineTo(4, -18); ctx.lineTo(6, -7); ctx.fill(); ctx.restore();
    } },
    dansegulv: { gulv: true, tegn(x, y, _, t) { rombe(x, y, 0.03, "#1c1612"); rombe(x, y, 0.08, `hsl(${(x * 70 + y * 45 + Math.floor(t * 1.6) * 55) % 360} 60% 46%)`); rombe(x, y, 0.3, "rgba(255,255,255,.14)"); } },
    tetristeppe: { gulv: true, tegn(x, y) {
      rombe(x, y, 0.04, "#1c1c22");
      const F = { I: TETRIS[0], O: TETRIS[1], L: TETRIS[3], J: TETRIS[6] }, M = ["LLLI", "OOLI", "OOJI", "JJJI"];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const fx = x + 0.1 + i * 0.2, fy = y + 0.1 + j * 0.2; flate([P(fx + 0.01, fy + 0.01), P(fx + 0.19, fy + 0.01), P(fx + 0.19, fy + 0.19), P(fx + 0.01, fy + 0.19)], F[M[j][i]]); }
    } },
    slangeteppe: { gulv: true, tegn(x, y) {
      rombe(x, y, 0.04, "#c9a24a"); rombe(x, y, 0.09, "#3f6a2e");
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const fx = x + 0.26 + i * 0.24, fy = y + 0.26 + j * 0.24, r = 0.1; flate([P(fx - r, fy), P(fx, fy - r), P(fx + r, fy), P(fx, fy + r)], (i + j) % 2 ? "#7fb04f" : "#d9c96a"); }
    } },
    basseng: { gulv: true, vann: true, tegn(x, y, _, t) { rombe(x, y, 0, "#ece4d2"); rombe(x, y, 0.07, `hsl(198 ${52 + Math.sin(t * 2 + x + y) * 6}% ${38 + Math.sin(t * 1.5 + x * 2 - y) * 3}%)`); } },
    // ----- Veggpynt (henger på veggen bak flisa; side er veggen, p posisjonen bortover) -----
    freske: { vegg: true, tegn(x, y, side) { const p = side === "v" ? y : x;
      vf(side, p + 0.08, p + 0.92, 44, 96, "#c9a24a"); vf(side, p + 0.13, p + 0.87, 48, 92, "#d9c9a0");
      paVegg(side, p + 0.5, 70, () => { rk(-11.5, 4, 23, 17.5, "#9db36a"); ell(6, -12, 4, 4, "#e0843d"); rk(-9, -6, 3, 14, "#ece4d2"); rk(-10, -8, 5, 2, "#ece4d2"); rk(-3, -2, 3, 10, "#ece4d2"); rk(-4, -4, 5, 2, "#ece4d2"); ctx.fillStyle = "#8e2f52"; ctx.beginPath(); ctx.moveTo(2, 9); ctx.lineTo(6, -1); ctx.lineTo(10, 9); ctx.fill(); ell(6, -3, 2.2, 2.2, "#d19f76"); });
    } },
    vindu: { vegg: true, tegn(x, y, side, t) { const p = side === "v" ? y : x;
      paVegg(side, p + 0.5, 66, () => {
        ctx.fillStyle = "#d8cdb4"; ctx.beginPath(); ctx.moveTo(-12, 20); ctx.lineTo(-12, -10); ctx.arc(0, -10, 12, Math.PI, 0); ctx.lineTo(12, 20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#7fb6d9"; ctx.beginPath(); ctx.moveTo(-9, 17); ctx.lineTo(-9, -10); ctx.arc(0, -10, 9, Math.PI, 0); ctx.lineTo(9, 17); ctx.closePath(); ctx.fill();
        ell(1 + Math.sin(t * 0.3) * 2.5, -7, 4.5, 2.2, "rgba(255,255,255,.8)"); rk(-9, 9, 18, 8, "#6b8a45");
        rk(-0.8, -19, 1.6, 36, "#d8cdb4"); rk(-9, 0, 18, 1.6, "#d8cdb4"); rk(-13, 19, 26, 3, "#ece4d2");
      });
    } },
    vegglampe: { vegg: true, tegn(x, y, side, t) { const [a, b] = veggP(side, (side === "v" ? y : x) + 0.5, 70);
      rk(a - 2, b, 4, 10, "#8a6f33"); rk(a - 6, b - 3, 12, 4, "#c9a24a"); glod(a, b - 12, 34, 0.35); flamme(a, b - 11, t, x + y, 0.8);
    } },
    speil: { vegg: true, tegn(x, y, side) {
      paVegg(side, (side === "v" ? y : x) + 0.5, 68, () => { ell(0, 0, 11, 20, "#c9a24a"); ell(0, 0, 8.5, 17, "#a9cfe0"); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(1, -12); ctx.lineTo(4, -12); ctx.lineTo(-2, 6); ctx.fill(); ell(0, -21, 3, 3, "#e2c174"); });
    } },
    skjold: { vegg: true, tegn(x, y, side) {
      paVegg(side, (side === "v" ? y : x) + 0.5, 68, () => { ell(0, 0, 13, 13, "#8a6f33"); ell(0, 0, 11.5, 11.5, "#b08d57"); ell(0, 0, 9, 9, "#8e2f2f"); ctx.strokeStyle = "#e2c174"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(0, -6); ctx.lineTo(5, 5); ctx.stroke(); });
    } },
    spyd: { vegg: true, tegn(x, y, side) {
      paVegg(side, (side === "v" ? y : x) + 0.5, 68, () => { for (const s of [-1, 1]) { ctx.strokeStyle = "#8a6a45"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12 * s, 22); ctx.lineTo(10 * s, -18); ctx.stroke(); ctx.fillStyle = "#d8d8de"; ctx.beginPath(); ctx.moveTo(8 * s, -17); ctx.lineTo(13.5 * s, -25); ctx.lineTo(12 * s, -15); ctx.fill(); } ell(0, 2, 4, 4, "#c9a24a"); });
    } },
    dolksamling: { vegg: true, tegn(x, y, side) {
      paVegg(side, (side === "v" ? y : x) + 0.5, 70, () => { rk(-14, -14, 28, 5, "#6b4a2a"); for (const dx of [-9, 0, 9]) { rk(dx - 1.5, -11, 3, 7, "#3a2a18"); rk(dx - 4, -4, 8, 2, "#c9a24a"); ctx.fillStyle = "#d8d8de"; ctx.beginPath(); ctx.moveTo(dx - 2.5, -2); ctx.lineTo(dx + 2.5, -2); ctx.lineTo(dx, 17); ctx.fill(); } });
    } },
    veggskinn: { vegg: true, tegn(x, y, side) {
      paVegg(side, (side === "v" ? y : x) + 0.5, 70, () => {
        ctx.fillStyle = "#4f7a3a"; ctx.beginPath(); ctx.moveTo(-3, -24); ctx.quadraticCurveTo(-11, 0, -4, 24); ctx.lineTo(4, 24); ctx.quadraticCurveTo(11, 0, 3, -24); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 6; i++) { const yy = -18 + i * 7.5; ctx.fillStyle = i % 2 ? "#d9c96a" : "#2f4a22"; ctx.beginPath(); ctx.moveTo(0, yy - 3.5); ctx.lineTo(3.5, yy); ctx.lineTo(0, yy + 3.5); ctx.lineTo(-3.5, yy); ctx.fill(); }
        for (const [dx, dy] of [[-5, -23], [5, -23], [-6, 23], [6, 23]]) ell(dx, dy, 1.5, 1.5, "#c9a24a");
      });
    } },
    relieff: { vegg: true, tegn(x, y, side) { const p = side === "v" ? y : x;
      vf(side, p + 0.06, p + 0.94, 46, 94, "#8f8672"); vf(side, p + 0.1, p + 0.9, 49, 91, "#a39a84");
      paVegg(side, p + 0.5, 70, () => { const M = ["..TTT.", "...T..", "L....I", "L.OO.I", "LLOO.I", ".....I"]; for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) if (M[j][i] !== ".") { rk(-12 + i * 4, -20 + j * 6.6, 4, 6.6, "#c9c0a8"); rk(-12 + i * 4, -20 + j * 6.6 + 5.4, 4, 1.2, "#7a7262"); } });
    } },
    // ----- Trofeer -----
    t2048: { blokk: true, tegn(x, y, _, t) {
      sokkel(x, y); kloss(x, y, 0.28, 0.28, 0.72, 0.72, 14, 42, "#e2c174");
      const [a, b] = P(x + 0.5, y + 0.5, 14);
      ctx.fillStyle = "#5a3d10"; ctx.font = "700 9px Cinzel, Georgia, serif"; ctx.textAlign = "center"; ctx.fillText("2048", a, b - 5);
      ctx.fillStyle = `rgba(255,250,220,${0.5 + Math.sin(t * 3) * 0.5})`; ctx.beginPath();
      for (const [dx, dy] of [[10, -44], [12, -38], [18, -36], [12, -34], [10, -28], [8, -34], [2, -36], [8, -38]]) ctx.lineTo(a + dx, b + dy);
      ctx.fill();
    } },
    ttetris: { blokk: true, tegn(x, y) {
      sokkel(x, y, 8);
      for (const [fx, fy, z, c] of [[0.25, 0.25, 8, 0], [0.47, 0.25, 8, 5], [0.25, 0.47, 8, 1], [0.47, 0.47, 8, 4], [0.25, 0.25, 22, 2], [0.25, 0.47, 22, 6], [0.47, 0.47, 22, 3], [0.36, 0.36, 36, 1], [0.36, 0.36, 50, 5], [0.36, 0.36, 64, 0]]) kloss(x, y, fx, fy, fx + 0.22, fy + 0.22, z, z + 14, TETRIS[c]);
    } },
    tsnake: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ell(a, b, 17, 8, "rgba(0,0,0,.25)"); ell(a, b - 3, 15, 7, "#8a6038"); rk(a - 15, b - 20, 30, 17, "#a9763f");
      ctx.strokeStyle = "#7a5530"; ctx.lineWidth = 1; for (const dy of [-7, -12, -17]) { ctx.beginPath(); ctx.ellipse(a, b + dy, 15, 7, 0, 0, Math.PI); ctx.stroke(); }
      ell(a, b - 20, 15, 7, "#c08a4c"); ell(a, b - 20, 11, 5, "#2b2118");
      const s = Math.sin(t * 2) * 5, hx = a + s * 0.6, hy = b - 60;
      ctx.strokeStyle = "#5f8f3a"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a, b - 20); ctx.bezierCurveTo(a - 12 - s, b - 34, a + 12 + s, b - 44, hx, b - 58); ctx.stroke(); ctx.lineCap = "butt";
      ell(hx, hy, 6, 5, "#7fb04f"); rk(hx - 3.5, hy - 2, 1.8, 1.8, "#1c1612"); rk(hx + 1.7, hy - 2, 1.8, 1.8, "#1c1612");
      if (Math.sin(t * 3) > 0.3) rk(hx - 0.5, hy + 4, 1, 4, "#b5282a");
    } },
    tmur: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5), s = Math.sin(t * 1.5) * 3;
      ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.beginPath();
      for (const [dx, dy] of [[-12, -6], [12, 6]]) { ctx.moveTo(a + dx - 8, b + dy + 2); ctx.lineTo(a + dx, b + dy - 44); ctx.lineTo(a + dx + 8, b + dy + 2); }
      ctx.moveTo(a - 12, b - 50); ctx.lineTo(a + 12, b - 38); ctx.stroke();
      ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a - 8, b - 47); ctx.lineTo(a - 8 + s, b - 27); ctx.moveTo(a + 8, b - 39); ctx.lineTo(a + 8 + s, b - 19); ctx.stroke();
      ctx.strokeStyle = "#7a5532"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a - 16 + s, b - 30); ctx.lineTo(a + 14 + s, b - 15); ctx.stroke(); ctx.lineCap = "butt";
      ell(a + 17 + s, b - 13.5, 6, 6, "#b08d57"); ell(a + 19 + s, b - 12.5, 3, 3, "#8a6f33");
    } },
    tidus: { blokk: true, tegn(x, y) {
      sokkel(x, y, 20);
      const [a, b] = P(x + 0.5, y + 0.5, 20);
      rk(a - 11, b - 12, 22, 12, "#ece4d2"); rk(a + 4, b - 12, 7, 12, "#cfc5ad"); rk(a - 4, b - 17, 8, 6, "#ddd4be"); ell(a + 1, b - 26, 9, 11, "#d8cdb4"); ell(a - 1, b - 27, 8, 10.5, "#ece4d2");
      rk(a - 5, b - 28, 2, 1.5, "#9a917b"); rk(a + 1, b - 28, 2, 1.5, "#9a917b"); rk(a - 2, b - 22, 4, 1, "#9a917b");
      for (const [dx, dy] of [[-9, -32], [-6, -36], [-1, -38], [4, -36], [7, -32]]) ell(a + dx, b + dy, 3, 2, "#6b8a45");
      rk(a + 10, b - 9, 7, 2, "#d8d8de"); rk(a + 16, b - 11, 2, 6, "#c9a24a"); rk(a + 18, b - 9, 4, 2, "#3a2a18");
    } },
    ttartaros: { blokk: true, tegn(x, y, _, t) {
      sokkel(x, y, 8);
      const [a, b] = P(x + 0.5, y + 0.5, 8), f = (t * 0.15) % 1;
      glod(a, b - 28, 40, 0.18); ell(a, b - 2, 13, 5.5, "#c9a24a");
      ctx.fillStyle = "rgba(190,215,230,.45)"; ctx.beginPath(); for (const [dx, dy] of [[-11, -52], [11, -52], [2, -28], [11, -4], [-11, -4], [-2, -28]]) ctx.lineTo(a + dx, b + dy); ctx.fill();
      ctx.fillStyle = "#b07cf0"; ctx.beginPath(); ctx.moveTo(a - 9 + f * 7, b - 48 + f * 18); ctx.lineTo(a + 9 - f * 7, b - 48 + f * 18); ctx.lineTo(a + 1.5, b - 29); ctx.lineTo(a - 1.5, b - 29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(a - 10, b - 5); ctx.lineTo(a + 10, b - 5); ctx.lineTo(a + 2 + f * 5, b - 6 - f * 13); ctx.lineTo(a - 2 - f * 5, b - 6 - f * 13); ctx.fill();
      rk(a - 0.6, b - 29, 1.2, 24, "#b07cf0");
      ell(a, b - 53, 13, 5.5, "#e2c174"); rk(a - 12.5, b - 53, 2, 50, "#c9a24a"); rk(a + 10.5, b - 53, 2, 50, "#c9a24a");
    } },
    tsymposion: { blokk: true, tegn(x, y, _, t) {
      const [a, b] = P(x + 0.5, y + 0.5);
      ell(a, b, 14, 6, "rgba(0,0,0,.25)"); rk(a - 4, b - 46, 8, 46, "#8a6f33"); glod(a, b - 62, 52, 0.22);
      for (const [dx, dy, r, c] of [[-16, -50, 17, "#b08d37"], [15, -54, 18, "#c9a24a"], [0, -72, 20, "#e2c174"], [-6, -48, 13, "#c9a24a"], [8, -82, 11, "#f2dc9a"]]) ell(a + dx, b + dy, r, r, c);
      for (let i = 0; i < 5; i++) { const g = Math.max(0, Math.sin(t * 2 + i * 1.7)) * 2; ell(a + [-18, 12, -4, 20, 4][i], b + [-56, -64, -84, -46, -50][i], g, g, "#fffbe6"); }
    } },
    trone: { sete: 17, tegn(x, y, mot) {
      klm(x, y, mot, 0.12, 0.06, 0.88, 0.24, 0, 70, "#c9a24a"); klm(x, y, mot, 0.2, 0.06, 0.8, 0.245, 26, 62, "#8e2f52");
      klm(x, y, mot, 0.12, 0.24, 0.88, 0.92, 0, 14, "#c9a24a"); klm(x, y, mot, 0.18, 0.26, 0.82, 0.9, 14, 17, "#8e2f52");
      klm(x, y, mot, 0.08, 0.24, 0.2, 0.92, 14, 30, "#e2c174"); klm(x, y, mot, 0.8, 0.24, 0.92, 0.92, 14, 30, "#e2c174");
      const [a, b] = mot === "v" ? P(x + 0.15, y + 0.5, 70) : P(x + 0.5, y + 0.15, 70);
      ell(a, b - 5, 6, 6, "#e2c174"); ell(a, b - 5, 3, 3, "#6fc3c9");
    } },
  };

  // Stiler for hele rommet, kjøpt i butikken. Uten stil følger gulv og vegger villaen i Symposion.
  const GULVSTIL = {
    gulv_sjakk: (x, y) => ((x + y) % 2 ? "#ece4d2" : "#2b2b2e"),
    gulv_hav: (x, y, t) => `hsl(${196 + ((x * 3 + y * 5) % 4) * 4} 48% ${34 + ((x * 7 + y * 3) % 5) * 3 + Math.sin(t + x - y) * 1.5}%)`,
    gulv_tegl: (x, y) => ["#b5623a", "#a85832", "#c06c42"][(x + y * 2) % 3],
    gulv_tetris: (x, y) => mork(TETRIS[Math.floor(hs(x, y) * 7)], 0.72),
    gulv_slange: (x, y) => ((x + y) % 2 ? "#4f7a3a" : (x * y) % 3 === 0 ? "#b5a84a" : "#3f6a2e"),
    gulv_senat: (x, y) => (x % 2 === 0 && y % 2 === 0 ? "#7a1f2a" : (x + y) % 2 ? "#d8cdb4" : "#ece4d2"),
    gulv_lava: (x, y, t) => (hs(x, y) > 0.8 ? `hsl(${14 + hs(y, x) * 12} 80% ${30 + Math.sin(t * 1.6 + x * 3 + y) * 8}%)` : ["#231d1b", "#2b2523", "#1c1817", "#262020"][Math.floor(hs(y, x + 3) * 4)]),
  };
  const hverVegg = (rom, tegn) => { for (const side of ["v", "h"]) tegn(side, side === "v" ? rom.d : rom.b); };
  const VEGGSTIL = {
    vegg_pompeii: { farge: ["#7d2a1f", "#93352a"], pynt(rom) { hverVegg(rom, (side, n) => { for (let i = 0; i < n; i++) { vf(side, i + 0.08, i + 0.92, 42, 102, side === "v" ? "#8c3024" : "#a33c2f"); vf(side, i + 0.08, i + 0.92, 100, 102, "#c9a24a"); } }); } },
    vegg_natt: { farge: ["#141a3a", "#1b2350"], pynt(rom, t) { hverVegg(rom, (side, n) => { for (let i = 0; i < n * 6; i++) { const [a, b] = veggP(side, hs(i, side === "v" ? 1 : 6) * n, 40 + hs(i, 2) * 66); ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i)); rk(a, b, i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5, "#f2e3b4"); } ctx.globalAlpha = 1; }); } },
    vegg_elfenben: { farge: ["#cfc5ad", "#e2d9c2"], pynt(rom) { hverVegg(rom, (side, n) => { vf(side, 0, n, 92, 93.5, "#c9a24a"); vf(side, 0, n, 105, 106.5, "#c9a24a"); for (let i = 0; i < n * 4; i++) { vf(side, i / 4 + 0.03, i / 4 + 0.19, 95.5, 103, "#c9a24a"); vf(side, i / 4 + 0.08, i / 4 + 0.14, 97.5, 103, side === "v" ? "#cfc5ad" : "#e2d9c2"); } }); } },
    vegg_vin: { farge: ["#4a1830", "#5c2040"], pynt(rom) { hverVegg(rom, (side, n) => { vf(side, 0, n, 98, 100, "#c9a24a"); vf(side, 0, n, 38, 39.5, "#c9a24a"); }); } },
    vegg_mosaikk: { farge: ["#2a6480", "#34789a"], pynt(rom) { hverVegg(rom, (side, n) => { for (let i = 0; i < n * 2; i++) for (let j = 0; j < 6; j++) if (hs(i + (side === "v" ? 50 : 0), j) > 0.45) vf(side, i / 2 + 0.03, i / 2 + 0.47, 38 + j * 12, 48.5 + j * 12, `hsl(${188 + hs(j, i) * 26} 45% ${36 + hs(i, j * 3) * 22}%)`); }); } },
    vegg_tetris: { farge: ["#26262e", "#30303a"], pynt(rom) { hverVegg(rom, (side, n) => { for (let i = 0; i < n * 3; i++) { const p = hs(i, side === "v" ? 7 : 9) * (n - 0.3), z = 40 + Math.floor(hs(i, 3) * 7) * 9; vf(side, p, p + 0.25, z, z + 8, TETRIS[i % 7]); } }); } },
    vegg_jungel: { farge: ["#2a5234", "#346340"], pynt(rom) { hverVegg(rom, (side, n) => { for (let i = 0; i < n * 2; i++) { const p = i / 2 + 0.1 + hs(i, side === "v" ? 4 : 8) * 0.3, l = 20 + hs(i, 5) * 45; vf(side, p, p + 0.04, 112 - l, 112, "#1f3d26"); for (let k = 0; k < l / 9; k++) vf(side, p + (k % 2 ? 0.04 : -0.1), p + (k % 2 ? 0.14 : 0), 106 - k * 9, 110 - k * 9, "#5f8f3a"); } }); } },
  };

  // Rommet til en bror. Størrelse og stil følger villanivået hans i Symposion.
  function lagHjem(id, h) {
    const n = h.storrelse, trinn = h.niva <= 2 ? 0 : h.niva <= 4 ? 1 : h.niva <= 7 ? 2 : 3;
    const gs = GULVSTIL[h.gulv], vs = VEGGSTIL[h.vegg];
    return {
      navn: romNavn(id), b: n, d: n, start: [1, 1], vegg: 112, bakgrunn: ["#141110", "#0b0b0a"],
      veggfarge: vs ? vs.farge : [["#75624a", "#8a7458"], ["#8c4a2f", "#a25a3a"], ["#9a917b", "#b0a68e"], ["#5a1d2c", "#6f2638"]][trinn],
      veggpynt: vs && vs.pynt,
      gulv: gs ? (x, y, t) => gs(x, y, t) : [
        (x, y) => (y % 2 ? "#6b4f36" : "#62482f"),
        (x, y) => ((x + y) % 2 ? "#b5623a" : "#a85832"),
        (x, y) => ((x + y) % 2 ? "#d8cdb4" : "#c2b697"),
        (x, y) => (x === 0 || y === 0 || x === n - 1 || y === n - 1 ? "#c9a24a" : (x + y) % 2 ? "#ece4d2" : "#d8cdb4"),
      ][trinn],
      skilt: { side: "v", pos: n / 2, z: 96, tekst: vis(h.eier).toUpperCase(), font: "600 12px Cinzel, Georgia, serif", plakett: true },
      dorer: [{ x: 1, y: 0, side: "h", til: "lobbyen" }],
      mobler: h.mobler.map((m) => [m.type, m.x, m.y, m.x === 0 ? "v" : "h"]),
      npc: [],
    };
  }

  function lagRuter() {
    ruter = Array.from({ length: R.b }, (_, x) => Array.from({ length: R.d }, (_, y) => ({ vann: !!(R.vann && R.vann(x, y)) })));
    mobler = []; veggting = [];
    for (const [type, x, y, mot] of R.mobler) {
      const m = MOBEL[type];
      if (!m || !rute(x, y)) continue;
      if (m.vegg) { if (x === 0 || y === 0) veggting.push({ type, x, y, mot: x === 0 ? "v" : "h" }); continue; }
      if (m.vann) ruter[x][y].vann = true;
      if (m.blokk) ruter[x][y].blokk = true;
      if (m.klikk) ruter[x][y].klikk = m.klikk;
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

    // Det som henger bak figuren tegnes først
    const ned = o.sitter ? 4 : 0;
    if (a.pynt === "pynt_vinger") { const v = Math.sin(t * 3); for (const [x1, x2, x3] of [[-12, -14, -11], [6, 7, 6]]) { px(x1, -29 + ned - v, 6, 4, "#f5efe0"); px(x2, -25 + ned - v, 7, 6, "#ece4d2"); px(x3, -19 + ned, 5, 5, "#d8cdb4"); } }
    if (a.pynt === "pynt_kappe" && !o.bak) px(-8, -24 + ned, 16, o.sitter ? 14 : 19, "#6b1f3a");
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
      else if (o.gest === "klapp") { const k = Math.sin(t * 16) > 0 ? 1 : 0; px(6, -22, 3, 3, togaM); px(-4 - k, -21, 3, 3, hud); px(1 + k, -21, 3, 3, hudM); }
      else if (o.gest === "skal") { px(6, -22, 3, 3, togaM); px(7, -30, 3, 8, hudM); px(6, -35, 5, 5, "#e2c174"); px(7, -36, 3, 1, "#8e2f52"); }
      else { px(6, -22, 3, 4, togaM); px(6, -18, 3, 6, hudM); }
    }
    if (a.pynt === "pynt_kappe") { if (o.bak) { px(-7, -24, 14, o.sitter ? 13 : 18, "#8e2f52"); px(-7, -24, 14, 2, "#c9a24a"); } else { px(-6, -24, 12, 2, "#8e2f52"); px(-1, -24, 2, 2, "#e2c174"); } }
    if (a.pynt === "pynt_dolk") { if (o.bak) { px(-1, -25, 2, 5, "#3a2a18"); px(-3, -20, 6, 1, "#c9a24a"); } else { px(5, -29, 2, 5, "#3a2a18"); px(4, -25, 4, 1, "#c9a24a"); } }
    // Hode, ansikt og hår
    px(-2, -25, 4, 2, hudM);
    px(-6, -36, 12, 11, hud); px(4, -36, 2, 11, hudM);
    if (!o.bak) {
      px(-4, -31, 2, 2, "#1c1612"); px(1, -31, 2, 2, "#1c1612");
      if (a.briller === "ja") { const g = "#c9a24a"; px(-5, -32, 4, 1, g); px(0, -32, 4, 1, g); px(-5, -29, 4, 1, g); px(0, -29, 4, 1, g); px(-5, -32, 1, 4, g); px(-2, -32, 1, 4, g); px(0, -32, 1, 4, g); px(3, -32, 1, 4, g); px(-1, -31, 1, 1, g); }
      if (a.skjegg === "ja") { px(-6, -28, 12, 3, har); px(-2, -27, 3, 1, mork(har, 0.55)); }
      else px(-2, -27, 3, 1, mork(hud, 0.6));
    } else if (a.har !== "skallet") px(-6, -36, 12, 9, har);
    if (a.har === "kort") { px(-6, -38, 12, 3, har); px(-6, -35, 1, 3, har); px(5, -35, 1, 3, har); }
    else if (a.har === "langt") { px(-7, -38, 14, 4, har); px(-7, -34, 2, 10, har); px(5, -34, 2, 10, har); }
    else if (a.har === "krøller") { px(-7, -39, 14, 4, har); px(-8, -37, 2, 5, har); px(6, -37, 2, 5, har); px(-5, -40, 3, 1, har); px(1, -40, 4, 1, har); }
    else if (a.har === "knute") { px(-6, -38, 12, 3, har); px(-2, -41, 4, 3, har); }
    else { px(-6, -34, 1, 3, har); px(5, -34, 1, 3, har); }
    // Hodeplagg fra butikken
    const h = a.hode;
    if (h === "hode_krans") { px(-7, -38, 14, 2, "#5f7d3d"); for (const x of [-8, -4, 2, 6]) px(x, -39, 2, 2, "#7a9a52"); px(-1, -39, 2, 1, "#e2c174"); }
    else if (h === "hode_hjelm") { px(-7, -41, 14, 7, "#b08d57"); px(-7, -41, 14, 1, "#c9a66a"); px(-7, -34, 2, 7, "#b08d57"); px(5, -34, 2, 7, "#9a7a48"); if (!o.bak) px(-1, -34, 2, 3, "#b08d57"); px(-3, -45, 7, 4, "#b5282a"); px(-1, -48, 3, 3, "#b5282a"); }
    else if (h === "hode_krone") { px(-6, -39, 12, 2, "#e2c174"); px(-6, -41, 2, 2, "#e2c174"); px(-1, -42, 2, 3, "#e2c174"); px(4, -41, 2, 2, "#e2c174"); px(-1, -39, 2, 1, "#b5282a"); }
    else if (h === "hode_hatt") { px(-10, -38, 20, 2, "#d9b96a"); px(-5, -42, 10, 4, "#e6c97a"); px(-5, -39, 10, 1, "#8e2f52"); }
    else if (h === "hode_vinlov") { px(-7, -38, 14, 2, "#4f6a34"); px(-8, -37, 3, 3, "#6b2f6e"); px(5, -37, 3, 3, "#6b2f6e"); px(-3, -40, 3, 2, "#6b8a45"); px(1, -40, 3, 2, "#5f7d3d"); }
    else if (h === "hode_medusa") { for (let i = 0; i < 6; i++) { const x = -7 + i * 2.5, l = 4 + Math.sin(t * 5 + i * 1.3) * 1.5; px(x, -38 - l, 2, l + 1, i % 2 ? "#5f8f3a" : "#7fb04f"); px(x + (Math.sin(t * 5 + i) > 0 ? 1 : -1), -39 - l, 2, 1.5, "#9ad15a"); } }
  }

  // Kjæledyrene. Tegnes med føttene i origo og snuten mot høyre.
  function dyr(c, id, t, gaar) {
    const u = 2, px = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x * u, y * u, w * u, h * u); };
    const l = gaar ? (Math.sin(t * 11) > 0 ? 1 : 0) : 0;   // annethvert bein løftes
    if (id === "dyr_slange") {
      for (let i = 0; i < 8; i++) px(-9 + i * 2, -2 - Math.sin(t * (gaar ? 10 : 3) + i * 0.9) * 1.2, 2.2, 2, i % 2 ? "#5f8f3a" : "#7fb04f");
      px(6, -6, 4, 4, "#7fb04f"); px(8, -5, 1, 1, "#1c1612");
      if (Math.sin(t * 3) > 0.5) px(10, -4, 2, 0.6, "#b5282a");
    } else if (id === "dyr_ugle") {
      const b = Math.sin(t * 3) * 1.5 - 12, v = Math.sin(t * 12) * 2;
      px(-7, b - 6 + v, 3, 5, "#6b4f36"); px(4, b - 6 + v, 3, 5, "#6b4f36");
      px(-4, b - 9, 8, 9, "#8a6a45"); px(-2, b - 5, 4, 4, "#d9c9a0"); px(-4, b - 10, 1, 1, "#8a6a45"); px(3, b - 10, 1, 1, "#8a6a45");
      px(-3, b - 8, 2.5, 2.5, "#f2e36a"); px(0.5, b - 8, 2.5, 2.5, "#f2e36a"); px(-2, b - 7, 1, 1, "#1c1612"); px(1.5, b - 7, 1, 1, "#1c1612"); px(-0.5, b - 5.5, 1, 1, "#c9a24a");
    } else if (id === "dyr_kerberos") {
      px(-8, -9, 2, 2, "#3a2f32"); px(-6, -8, 10, 5, "#3a2f32"); px(-5, -3 - l, 2, 3 + l, "#2a2224"); px(1, -3 - (1 - l) * (gaar ? 1 : 0), 2, 3, "#2a2224");
      for (const [hx, hy] of [[0, -14], [4, -12], [5, -8]]) { px(hx, hy, 4, 4, "#4a3d40"); px(hx + 3, hy + 2, 2, 1.5, "#3a2f32"); px(hx + 2, hy + 1, 1, 1, "#ff4a2a"); }
    } else if (id === "dyr_geit") {
      px(-7, -11, 1, 2, "#ece4d2"); px(-6, -10, 11, 6, "#ece4d2"); px(-5, -4 - l, 2, 4 + l, "#cfc5ad"); px(2, -4, 2, 4, "#cfc5ad");
      px(4, -14, 5, 5, "#ece4d2"); px(5, -17, 1, 3, "#8a6a45"); px(7, -17, 1, 3, "#8a6a45"); px(8, -9, 1, 2, "#cfc5ad"); px(7, -13, 1, 1, "#1c1612");
    } else if (id === "dyr_skilpadde") {
      px(-5, -2, 2, 2, "#9db36a"); px(3, -2 - l * 0.5, 2, 2, "#9db36a"); px(5, -5, 3, 3, "#9db36a"); px(7, -4.5, 0.8, 0.8, "#1c1612");
      px(-6, -6, 11, 4, "#4f7a3a"); px(-4, -8, 7, 2, "#5f8f3a"); px(-2, -7, 3, 2, "#3f6a2e"); px(-5, -5, 2, 2, "#3f6a2e"); px(2, -5, 2, 2, "#3f6a2e");
    } else if (id === "dyr_vaer") {
      px(-4, -4 - l, 2, 4 + l, "#3a2f28"); px(2, -4, 2, 4, "#3a2f28");
      px(-6, -11, 11, 7, "#e8dfc8"); px(-5, -12, 9, 1, "#e8dfc8"); px(-7, -9, 1, 3, "#e8dfc8");
      px(4, -12, 5, 5, "#3a2f28"); px(3, -13, 4, 4, "#c9a24a"); px(4, -12, 2, 2, "#8a6f33"); px(7, -10, 1, 1, "#ece4d2");
    } else if (id === "dyr_ravn") {
      const h = gaar ? Math.abs(Math.sin(t * 10)) * 2 : 0;
      px(-1, -3, 1, 3, "#4a4a55"); px(2, -3, 1, 3, "#4a4a55");
      px(-7, -7 - h, 3, 2, "#23232e"); px(-4, -8 - h, 8, 5, "#34343f"); px(-3, -7 - h, 5, 2, "#4a4a5a"); px(2, -11 - h, 4, 4, "#34343f"); px(6, -10 - h, 3, 1.2, "#8a8a96"); px(4, -10 - h, 1, 1, "#ece4d2");
    }
  }

  function tegnFigur(f, t) {
    const rt = rute(Math.round(f.x), Math.round(f.y));
    const [sx, sy0] = P(f.x + 0.5, f.y + 0.5);
    const sitter = !f.sti.length && rt && rt.sete;
    const vann = rt && rt.vann;
    const gest = f.gest && f.gestTil > t ? f.gest : null;
    const dans = gest === "dans";
    const gaar = f.sti.length > 0;
    const hopp = dans ? Math.abs(Math.sin(t * 9)) * 6 : gest === "ler" ? Math.abs(Math.sin(t * 15)) * 2.5 : gaar ? Math.abs(Math.sin(t * 11)) * 3 : 0;

    if (!vann) { ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(sx, sy0, 15, 6, 0, 0, 7); ctx.fill(); }
    ctx.save();
    ctx.translate(sx, sy0 - (sitter ? rt.sete.h : 0) + (vann ? 16 : 0) - hopp);
    if (vann) { ctx.beginPath(); ctx.rect(-40, -130, 80, 130 - 20 + hopp); ctx.clip(); }
    figur(ctx, f.utseende, { t, gaar, sitter: !!sitter, gest, flip: dans ? Math.floor(t * 2.5) % 2 === 0 : f.flip, bak: f.bak && gaar });
    ctx.restore();
    if (vann) { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy0 - 4, 16 + Math.sin(t * 4) * 2, 6, 0, 0, 7); ctx.stroke(); }
    f.topp = sy0 - (sitter ? rt.sete.h - 8 : 0) + (vann ? 16 : 0) - 84;
    if (gest === "ler") { ctx.font = "italic 600 13px 'EB Garamond', Georgia, serif"; ctx.textAlign = "center"; ctx.fillStyle = "#e2c174"; for (let i = 0; i < 2; i++) { const f2 = (t * 0.9 + i * 0.5) % 1; ctx.globalAlpha = 1 - f2; ctx.fillText("ha", sx + 16 + i * 12, f.topp + 22 - f2 * 22); } ctx.globalAlpha = 1; }
  }

  function tegnDyr(f, t) {
    const k = f.kjael, [sx, sy] = P(k.x + 0.5, k.y + 0.5);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(sx, sy, 10, 4, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(sx, sy); if (k.flip) ctx.scale(-1, 1);
    dyr(ctx, f.utseende.dyr, t, k.gaar);
    ctx.restore();
  }

  function tegnNavnOgBoble(f, t) {
    const [sx, sy] = P(f.x + 0.5, f.y + 0.5);
    ctx.textAlign = "center";
    ctx.font = `600 ${Math.round(11 * TK)}px Cinzel, Georgia, serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(11,11,10,.85)";
    ctx.strokeText(vis(f.navn), sx, sy + 13 + 4 * TK);
    ctx.fillStyle = f === meg ? "#e2c174" : f.npc ? "#b9ae97" : "#ece4d2";
    ctx.fillText(vis(f.navn), sx, sy + 13 + 4 * TK);
    if (f.tenker > t && (!f.boble || f.boble.til < t)) {
      const x = sx - 22, y = f.topp - 30;
      ctx.fillStyle = "#f5efe0"; ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, 44, 22, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1c1612";
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.3 + 0.7 * Math.max(0, Math.sin(t * 5 - i * 0.9)); ctx.beginPath(); ctx.arc(x + 12 + i * 10, y + 11, 2.6, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }

  // Snakkeboblene tegnes til slutt og legges så de ikke dekker hverandre:
  // den nyeste står over den som snakker, og eldre bobler skyves oppover.
  function tegnBobler(t) {
    const aktive = [...figurer.values()].filter((f) => f.boble && f.boble.til > t).sort((a, b) => b.boble.fra - a.boble.fra);
    if (!aktive.length) return;
    ctx.font = `${Math.round(16 * TK)}px 'EB Garamond', Georgia, serif`;
    ctx.textAlign = "center";
    const lh = 19 * TK, topp = -kam[1] + 4, plassert = [];
    for (const f of aktive) {
      const [sx] = P(f.x + 0.5, f.y + 0.5);
      const b = Math.max(...f.boble.linjer.map((l) => ctx.measureText(l).width)) + 20, h = f.boble.linjer.length * lh + 12;
      const x = Math.max(-kam[0] + 6, Math.min(logW / zoom - kam[0] - b - 6, sx - b / 2));
      let y = f.topp - h;
      for (let n = 0; n < 40; n++) {
        const i = plassert.find((r) => x < r.x + r.b + 4 && x + b + 4 > r.x && y < r.y + r.h + 6 && y + h + 6 > r.y);
        if (!i) break;
        y = i.y - h - 8;
      }
      plassert.push({ x, y, b, h });
      const synlig = Math.max(y, topp);
      ctx.globalAlpha = Math.min(1, (f.boble.til - t) / 0.4) * (synlig > y + h * 0.6 ? 0 : 1);
      if (!ctx.globalAlpha) continue;
      y = synlig;
      const lys = f.boble.hvisk ? "#e9def2" : "#f5efe0";
      ctx.fillStyle = lys; ctx.strokeStyle = f.boble.hvisk ? "#8e6fb0" : "#c9a24a"; ctx.lineWidth = 1.5;
      // Står boblen langt over figuren, går en tynn strek ned til hodet
      if (f.topp - (y + h) > 10) { ctx.beginPath(); ctx.moveTo(sx, y + h); ctx.lineTo(sx, f.topp - 2); ctx.stroke(); }
      ctx.beginPath(); ctx.roundRect(x, y, b, h, 8); ctx.fill(); ctx.stroke();
      const hx = Math.max(x + 10, Math.min(x + b - 10, sx));
      ctx.beginPath(); ctx.moveTo(hx - 6, y + h - 1); ctx.lineTo(hx, y + h + 7); ctx.lineTo(hx + 6, y + h - 1); ctx.fillStyle = lys; ctx.fill();
      ctx.fillStyle = "#1c1612";
      f.boble.linjer.forEach((l, i) => ctx.fillText(l, x + b / 2, y + 2 + lh * (i + 0.9)));
    }
    ctx.globalAlpha = 1;
  }

  function si(f, tekst, t) {
    const prof = f.npc && f.npc.ai, bredde = prof ? 250 : 190, maks = prof ? 8 : 5;
    ctx.font = `${Math.round(16 * TK)}px 'EB Garamond', Georgia, serif`;
    const linjer = [];
    let linje = "";
    for (const ord of tekst.split(" ")) {
      const ny = linje ? `${linje} ${ord}` : ord;
      if (ctx.measureText(ny).width > bredde * TK && linje) { linjer.push(linje); linje = ord; } else linje = ny;
    }
    if (linje) linjer.push(linje);
    const vist = linjer.slice(0, maks);
    if (linjer.length > maks) vist[maks - 1] += " …";
    f.boble = { linjer: vist, fra: t, til: t + 4 + tekst.length * 0.06 };
  }

  // ---------- Tegn rommet ----------
  function veggTekst(side, pos, z, tekst, font, farge) {
    ctx.save();
    ctx.transform(1, side === "h" ? 0.5 : -0.5, 0, 1, 0, 0);
    ctx.font = font; ctx.textAlign = "center"; ctx.fillStyle = farge;
    ctx.fillText(tekst, (side === "h" ? 1 : -1) * pos * TW / 2, -z);
    ctx.restore();
  }
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
    if (R.veggpynt) R.veggpynt(R, t);
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 2; ctx.beginPath();
    let p = P(0, R.d, V); ctx.moveTo(p[0], p[1]); p = P(0, 0, V); ctx.lineTo(p[0], p[1]); p = P(R.b, 0, V); ctx.lineTo(p[0], p[1]); ctx.stroke();
    if (R.skilt) {
      if (R.skilt.plakett) { ctx.font = R.skilt.font; const b = (ctx.measureText(R.skilt.tekst).width / 2 + 9) / (TW / 2); vf(R.skilt.side, R.skilt.pos - b, R.skilt.pos + b, R.skilt.z - 6, R.skilt.z + 13, "#c9a24a"); vf(R.skilt.side, R.skilt.pos - b + 0.04, R.skilt.pos + b - 0.04, R.skilt.z - 4.5, R.skilt.z + 11.5, "#1c1612"); }
      veggTekst(R.skilt.side, R.skilt.pos, R.skilt.z, R.skilt.tekst, R.skilt.font, "#c9a24a");
    }
    for (const d of R.dorer) {
      const pos = d.side === "h" ? d.x : d.y;
      if (V < 90) flate([veggP(d.side, pos - 0.1, 0), veggP(d.side, pos + 1.1, 0), veggP(d.side, pos + 1.1, 104), veggP(d.side, pos - 0.1, 104)], R.veggfarge[d.side === "h" ? 1 : 0]);
      flate([veggP(d.side, pos + 0.08, 0), veggP(d.side, pos + 0.92, 0), veggP(d.side, pos + 0.92, 84), veggP(d.side, pos + 0.08, 84)], "#c9a24a");
      flate([veggP(d.side, pos + 0.14, 0), veggP(d.side, pos + 0.86, 0), veggP(d.side, pos + 0.86, 80), veggP(d.side, pos + 0.14, 80)], "#0b0b0a");
      veggTekst(d.side, pos + 0.5, 90, romNavn(d.til).toUpperCase(), "600 10px Cinzel, Georgia, serif", "#e2c174");
    }
    for (const m of veggting) MOBEL[m.type].tegn(m.x, m.y, m.mot, t);
    // Gulv, tepper og markeringer
    flate([P(0, R.d), P(R.b, R.d), P(R.b, R.d, -10), P(0, R.d, -10)], "#3a342a");
    flate([P(R.b, 0), P(R.b, R.d), P(R.b, R.d, -10), P(R.b, 0, -10)], "#4a4336");
    for (let x = 0; x < R.b; x++) for (let y = 0; y < R.d; y++) rombe(x, y, 0, R.gulv(x, y, t));
    for (const m of mobler) if (m.gulv) MOBEL[m.type].tegn(m.x, m.y, m.mot, t);
    for (const d of R.dorer) { ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.12; rombe(d.x, d.y, 0, "#e2c174"); ctx.globalAlpha = 1; }
    tegnSkatt(t);
    if (R.talerstol) { ctx.globalAlpha = 0.45 + Math.sin(t * 1.5) * 0.15; rombe(R.talerstol[0], R.talerstol[1], 0.08, "#c9a24a"); ctx.globalAlpha = 1; }
    const merk = (m, farge, bredde) => {
      ctx.strokeStyle = farge; ctx.lineWidth = bredde; ctx.beginPath();
      [P(m[0] + 0.06, m[1] + 0.06), P(m[0] + 0.94, m[1] + 0.06), P(m[0] + 0.94, m[1] + 0.94), P(m[0] + 0.06, m[1] + 0.94)].forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
      ctx.closePath(); ctx.stroke();
    };
    const pr = peker && rute(peker[0], peker[1]);
    if (pr && (innred || !pr.blokk || pr.npc)) merk(peker, "rgba(226,193,116,.9)", 2);
    if (mal && meg && meg.sti.length) merk(mal, "rgba(236,228,210,.7)", 1.5);

    // Møbler og figurer, bakerst først
    const ting = [...mobler.filter((m) => !m.gulv).map((m) => ({ d: m.dybde, m })), ...[...figurer.values()].map((f) => ({ d: f.x + f.y + 0.5, f })),
      ...[...figurer.values()].filter((f) => f.kjael).map((f) => ({ d: f.kjael.x + f.kjael.y + 0.45, k: f }))].sort((a, b) => a.d - b.d);
    for (const e of ting) {
      if (e.m) MOBEL[e.m.type].tegn(e.m.x, e.m.y, e.m.mot, t);
      else if (e.k) tegnDyr(e.k, t);
      else tegnFigur(e.f, t);
    }
    // Når du innreder: vis møbelet du holder, der pekeren er
    const holder = innred && valgt && hjem && hjem.lager.find((m) => m.id === valgt);
    if (holder && pr && MOBEL[holder.type] && kanSettes(holder.type, peker[0], peker[1])) {
      ctx.globalAlpha = 0.6;
      MOBEL[holder.type].tegn(peker[0], peker[1], peker[0] === 0 ? "v" : "h", t);
      ctx.globalAlpha = 1;
    }
    for (const f of figurer.values()) { tegnNavnOgBoble(f, t); tegnTerning(f, t); }
    tegnBobler(t);
  }

  // ---------- Professoren ----------
  let varPaStol = false;
  const paTalerstolen = () => !!(meg && R.talerstol && !meg.sti.length && Math.round(meg.x) === R.talerstol[0] && Math.round(meg.y) === R.talerstol[1]);
  // Tre prikker over professoren til svaret kommer (det kan ta noen sekunder)
  const tenk = (pa) => { const p = figurer.get(PROFESSOR); if (p) p.tenker = pa ? performance.now() / 1000 + 25 : 0; };
  function hilsProfessor() {
    tenk(true);
    api("hotell/professor", post({})).then((s) => { if (!s || !s.svar) tenk(false); }).catch(() => tenk(false));
  }

  // ---------- Det sosiale: profilkort, hvisking, gaver, gjestebok, terning, jukeboks og skatt ----------
  let hviskTil = null, skatt = null, tarSkatt = false, sanger = {}, kortNavn = null;
  let lydPa = (() => { try { return localStorage.getItem("tafse-hotell-lyd") !== "av"; } catch (_) { return true; } })();

  // Jukeboksen: små melodier laget med Web Audio. Tall er halvtoner over A (220 Hz), null er pause.
  const MELODIER = {
    sirtaki: { takt: 0.2, form: "triangle", noter: [0, 3, 7, 3, 0, 3, 7, 3, 2, 5, 8, 5, 2, 5, 8, 5, 0, 3, 7, 12, 10, 7, 3, 7, 0, 3, 7, 3, 0, null, 0, null] },
    vals: { takt: 0.26, form: "sine", noter: [3, 7, 7, 3, 7, 7, 5, 8, 8, 5, 8, 8, 7, 10, 10, 7, 10, 10, 12, 10, 8, 7, 5, 3] },
    marsj: { takt: 0.22, form: "square", noter: [0, 0, 7, 7, 5, 5, 7, null, 3, 3, 5, 5, 7, 7, 12, null, 0, 0, 7, 7, 5, 3, 0, null] },
    vugge: { takt: 0.42, form: "sine", noter: [7, 5, 3, null, 7, 5, 3, null, 5, 7, 8, 7, 5, 3, 0, null] },
  };
  let lydCtx = null;
  function spillMelodi(id) {
    const m = MELODIER[id];
    if (!m || !lydPa) return;
    try {
      lydCtx = lydCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (lydCtx.state === "suspended") lydCtx.resume();
      const start = lydCtx.currentTime + 0.05;
      m.noter.forEach((n, i) => {
        if (n === null) return;
        const o = lydCtx.createOscillator(), g = lydCtx.createGain(), t = start + i * m.takt;
        o.type = m.form; o.frequency.value = 220 * Math.pow(2, n / 12);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(m.form === "square" ? 0.05 : 0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + m.takt * 0.95);
        o.connect(g).connect(lydCtx.destination); o.start(t); o.stop(t + m.takt);
      });
    } catch (_) {}
  }
  const plingLyd = () => { if (!lydPa) return; try { lydCtx = lydCtx || new (window.AudioContext || window.webkitAudioContext)(); [12, 16, 19, 24].forEach((n, i) => { const o = lydCtx.createOscillator(), g = lydCtx.createGain(), t = lydCtx.currentTime + i * 0.07; o.frequency.value = 220 * Math.pow(2, n / 12); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g).connect(lydCtx.destination); o.start(t); o.stop(t + 0.26); }); } catch (_) {} };

  // Figuren som står under pekeren, hvis noen (kroppen, ikke bare flisa)
  function figurVed(e) {
    const r = lerret.getBoundingClientRect();
    const a = ((e.clientX - r.left) / r.width) * logW / zoom - kam[0], b = ((e.clientY - r.top) / r.height) * logH / zoom - kam[1];
    let funnet = null;
    for (const f of figurer.values()) {
      if (f.npc) continue;
      const [sx, sy] = P(f.x + 0.5, f.y + 0.5);
      // Andre går foran deg selv, og den som står nærmest, foran dem bak
      if (Math.abs(a - sx) < 17 && b > sy - 82 && b < sy + 6 && (!funnet || funnet === meg || (f !== meg && f.x + f.y > funnet.x + funnet.y))) funnet = f;
    }
    return funnet;
  }

  async function visKort(navn) {
    kortNavn = navn;
    let k;
    try { k = await api(`hotell/kort?navn=${encodeURIComponent(navn)}`); } catch (e) { leggILogg(null, e.message, "info"); return; }
    if (kortNavn !== navn) return;
    const min = navn === MEG, iRommet = figurer.has(navn);
    const lager = !min && k.lager.length ? `<h3>Gi en gave fra lageret ditt</h3><div class="h-kortvalg">${k.lager.map((m) => `<button type="button" class="h-valg" data-h-gave="${m.id}">${esc(varenavn(m.type))}</button>`).join("")}</div>` : "";
    visInfo(vis(navn), `
      <div class="h-kort">
        <canvas id="h-kortbilde" width="200" height="240" aria-hidden="true"></canvas>
        <div>
          <p class="h-korttall"><strong>${k.respekt}</strong> respekt · <strong>${k.merker.length}</strong> merker</p>
          ${min ? `<p class="dempet">Dette er deg. Du har ${k.respektIgjen} respekt igjen å dele ut i dag.</p>` : `<div class="h-kortknapper">
            <button class="knapp" type="button" data-h-respekt ${k.gittIDag || k.respektIgjen <= 0 ? "disabled" : ""}>${k.gittIDag ? "Respekt gitt i dag" : `Gi respekt (${k.respektIgjen} igjen)`}</button>
            ${iRommet ? `<button class="knapp sekundar" type="button" data-h-hvisk>Hvisk</button>` : ""}
            <button class="knapp sekundar" type="button" data-h-besok>Besøk rommet</button>
            ${iRommet ? `<button class="knapp sekundar" type="button" data-h-slibrig>Gi en slibrig kommentar (${k.slibrigPris} oliven)</button>` : ""}
          </div>`}
          <p class="melding" id="h-kortmelding" hidden></p>
        </div>
      </div>
      <h3>Merker</h3>
      <ul class="h-merker">${k.merker.map((m) => `<li><strong>${esc(m.navn)}</strong><span>${esc(m.tekst)}</span></li>`).join("")}</ul>
      ${lager}`);
    const c = document.getElementById("h-kortbilde");
    if (c) { const g = c.getContext("2d"); g.translate(100, 215); g.scale(2.6, 2.6); figur(g, utseende(k.utseende, navn), { t: 1, gaar: false, sitter: false, gest: "vink", flip: false, bak: false }); }
  }
  const kortMelding = (tekst, feil) => { const m = document.getElementById("h-kortmelding"); if (m) { m.textContent = tekst; m.hidden = false; m.className = "melding" + (feil ? " feil" : " h-kvittering"); } };
  const lukkInfo = () => { const d = document.getElementById("infoboks"); if (d && d.open) d.close(); };
  function settHvisk(navn) {
    hviskTil = navn;
    const felt = document.getElementById("h-tekst"), merke = document.getElementById("h-hviskmerke");
    if (felt) { felt.placeholder = navn ? `Hvisk til ${vis(navn)} …` : "Si noe til rommet …"; if (navn) felt.focus(); }
    if (merke) { merke.hidden = !navn; merke.textContent = navn ? `Hvisker til ${vis(navn)} ✕` : ""; }
  }
  function visJukeboks() {
    visInfo("Jukeboksen", `<p>Velg en sang. Alle i baren hører den.</p><div class="h-kortvalg">${Object.entries(sanger).map(([id, navn]) => `<button type="button" class="knapp sekundar" data-h-sang="${id}">${esc(navn)}</button>`).join("")}</div>
      <p class="melding" id="h-kortmelding" hidden></p><p class="dempet">Hører du ingenting? Sjekk knappen «Lyd» under rommet.</p>`);
  }
  // Knappene i profilkortet og jukeboksen ligger i dialogen, utenfor hotellet
  document.addEventListener("click", async (e) => {
    const k = e.target.closest("#infoboks button");
    if (!k || !meg) return;
    const d = k.dataset;
    try {
      if (d.hRespekt !== undefined) { await api("hotell/respekt", post({ til: kortNavn })); lukkInfo(); hent(); }
      else if (d.hHvisk !== undefined) { lukkInfo(); settHvisk(kortNavn); }
      else if (d.hBesok !== undefined) { lukkInfo(); gaTil(`hjem:${kortNavn}`, null); }
      else if (d.hGave) { const s = await api("hotell/gave", post({ til: kortNavn, id: Number(d.hGave) })); if (erMitt() && hjem) oppdaterHjem(s.hjem); lukkInfo(); lastButikk(); hent(); }
      else if (d.hSang) { await api("hotell/musikk", post({ sang: d.hSang })); lukkInfo(); hent(); }
      else if (d.hSlibrig !== undefined) { const s = await api("hotell/slibrig", post({ til: kortNavn })); lukkInfo(); si(meg, s.tekst, performance.now() / 1000); leggILogg(MEG, s.tekst); lastButikk(); }
    } catch (err) { kortMelding(err.message, true); }
  });

  // Gjesteboka i rommene til folk
  let gjestebokNokkel = "";
  function visGjestebok() {
    const boks = document.getElementById("h-gjestebok");
    if (!boks) return;
    if (!hjem) { if (gjestebokNokkel) { boks.innerHTML = ""; gjestebokNokkel = ""; } return; }
    const nokkel = JSON.stringify([rom, hjem.gjestebok]);
    if (nokkel === gjestebokNokkel) return;
    gjestebokNokkel = nokkel;
    const liste = hjem.gjestebok || [];
    boks.innerHTML = `<section class="h-boks h-gjestebok">
      <p class="h-etikett">Gjesteboka${erMitt() ? "" : ` til ${esc(vis(hjem.eier))}`}</p>
      ${liste.length ? `<ul>${liste.map((g) => `<li><strong>${esc(vis(g.navn))}</strong> ${esc(g.tekst)} <span class="dempet">${esc(new Date(g.opprettet).toLocaleDateString("nb-NO", { day: "numeric", month: "short" }))}</span>${erMitt() || g.navn === MEG ? ` <button type="button" class="h-slett" data-slettbok="${g.id}" aria-label="Slett">✕</button>` : ""}</li>`).join("")}</ul>` : `<p class="dempet">Ingen har skrevet her ennå.</p>`}
      <form id="h-bokskjema" class="h-prat"><input id="h-boktekst" maxlength="200" placeholder="${erMitt() ? "Skriv en velkomst til gjestene …" : "Legg igjen en hilsen …"}" autocomplete="off" aria-label="Skriv i gjesteboka"><button class="knapp sekundar" type="submit">Skriv</button></form>
    </section>`;
  }
  async function gjestebokSend(kropp) {
    try { const s = await api("hotell/gjestebok", post(kropp)); if (s.hjem && hjem) { hjem.gjestebok = s.hjem.gjestebok; visGjestebok(); } }
    catch (e) { leggILogg(null, e.message, "info"); }
  }

  // Terningen over hodet på den som triller
  function tegnTerning(f, t) {
    if (!f.terning || f.terning.til < t) return;
    const [sx] = P(f.x + 0.5, f.y + 0.5), ruller = t < f.terning.fra + 0.9;
    const v = ruller ? 1 + Math.floor(t * 14 + f.x * 3) % 6 : f.terning.verdi, s = 26, x = sx + 16, y = f.topp - 4 - (ruller ? Math.abs(Math.sin(t * 16)) * 6 : 0);
    ctx.globalAlpha = Math.min(1, (f.terning.til - t) / 0.4);
    ctx.fillStyle = "#f5efe0"; ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, s, s, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8e2f52";
    const prikk = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[v];
    for (const [i, j] of prikk) { ctx.beginPath(); ctx.arc(x + 6.5 + i * 6.5, y + 6.5 + j * 6.5, 2.2, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // Skattekista som ligger og glitrer
  function tegnSkatt(t) {
    if (!skatt) return;
    const [a, b] = P(skatt.x + 0.5, skatt.y + 0.5);
    glod(a, b - 12, 44, 0.3 + Math.sin(t * 3) * 0.1);
    kloss(skatt.x, skatt.y, 0.26, 0.3, 0.74, 0.7, 0, 12, "#6b4a2a"); kloss(skatt.x, skatt.y, 0.26, 0.3, 0.74, 0.7, 12, 17, "#c9a24a");
    for (let i = 0; i < 4; i++) { const g = Math.max(0, Math.sin(t * 3 + i * 1.6)) * 2.2; ell(a + [-14, 12, -4, 8][i], b + [-24, -30, -38, -18][i], g, g, "#fffbe6"); }
  }

  // ---------- Bevegelse ----------
  function oppdater(dt) {
    for (const f of figurer.values()) {
      let igjen = FART * dt;
      while (f.sti.length && igjen > 0) {
        const [tx, ty] = f.sti[0];
        const dx = tx - f.x, dy = ty - f.y, lengde = Math.hypot(dx, dy);
        if (dx || dy) { f.flip = dx - dy < 0; f.bak = dx + dy < 0; f.rx = -Math.sign(dx) * 0.8; f.ry = -Math.sign(dy) * 0.8; }
        if (lengde <= igjen) { f.x = tx; f.y = ty; f.sti.shift(); igjen -= lengde; }
        else { f.x += (dx / lengde) * igjen; f.y += (dy / lengde) * igjen; igjen = 0; }
      }
      // Kjæledyret holder seg et skritt bak
      if (f.utseende && f.utseende.dyr && !f.npc) {
        const k = f.kjael || (f.kjael = { x: f.x, y: f.y, flip: false, gaar: false });
        const tx = Math.max(0, Math.min(R.b - 1, f.x + (f.rx ?? -0.7))), ty = Math.max(0, Math.min(R.d - 1, f.y + (f.ry ?? 0.4)));
        const dx = tx - k.x, dy = ty - k.y, l = Math.hypot(dx, dy);
        k.gaar = l > 0.06;
        if (k.gaar) { const s = Math.min(l, FART * 1.15 * dt); k.x += (dx / l) * s; k.y += (dy / l) * s; k.flip = dx - dy < 0; }
        else k.flip = f.flip;
      } else f.kjael = null;
      if (f === meg && !f.sti.length && !bytter) {
        if (skatt && !tarSkatt && Math.round(f.x) === skatt.x && Math.round(f.y) === skatt.y) {
          tarSkatt = true;
          api("hotell/skatt", post({})).then((s) => { plingLyd(); leggILogg(null, `Du fant skatten: ${s.antall} ${s.hva}! De ligger i lommeboka.`, "info"); lastButikk(); })
            .catch((e) => leggILogg(null, e.message, "info")).finally(() => { skatt = null; tarSkatt = false; hent(); });
        }
        // Opp på talerstolen: professoren hilser
        const pa = paTalerstolen();
        if (pa && !varPaStol) hilsProfessor();
        varPaStol = pa;
        const r = rute(Math.round(f.x), Math.round(f.y));
        if (r && r.dor) gaTil(r.dor.til, rom);
      }
    }
  }

  function ga(tx, ty) {
    if (!meg || bytter) return;
    const r = rute(tx, ty);
    if (!r) return;
    if (r.klikk === "jukeboks") return visJukeboks();
    if (r.npc) {
      const n = figurer.get(r.npc);
      if (n.npc.ai && R.talerstol && !paTalerstolen()) return ga(R.talerstol[0], R.talerstol[1]);
      si(n, n.npc.replikker[Math.floor(Math.random() * n.npc.replikker.length)], performance.now() / 1000);
      return;
    }
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
      settHvisk(null); skatt = null;
      if (erHjem) def = lagHjem(til, hjem);
      innred = false; valgt = null; melding = "";
      byggRom(til, def);
      meg = { navn: MEG, x: pos[0], y: pos[1], sti: [], utseende: look };
      figurer.set(MEG, meg);
      visRomliste(); visInnred(); visGjestebok(); butikkNokkel = ""; visButikk();
      leggILogg(null, ROM[til] ? `Du er i ${R.navn.toLowerCase()}.` : til === mittRom() ? "Du er i rommet ditt." : `Du er på besøk hos ${vis(til.slice(5))}.`, "info");
      if (til === "auditoriet") leggILogg(null, "Gå opp på talerstolen ved tavla, eller trykk på professoren, for å øve på disputas. Hele salen ser samtalen. Fra benkene svarer han når du nevner ham.", "info");
      varPaStol = false;
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
      if (s.hjem && hjem) { oppdaterHjem(s.hjem); visGjestebok(); }
      skatt = tarSkatt ? skatt : s.skatt || null; sanger = s.sanger || sanger;
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
        if (m.navn === MEG && !s.forste && !["terning", "musikk", "hendelse"].includes(m.type)) continue; // egne meldinger er allerede vist
        const f = figurer.get(m.navn);
        if (m.type === "hvisk") {
          const fraMeg = m.navn === MEG;
          if (!fraMeg && f && !s.forste) { si(f, m.tekst, t); f.boble.hvisk = true; }
          if (!fraMeg) leggILogg(m.navn, m.tekst, "hvisk");
        } else if (m.type === "terning") {
          if (f && !s.forste) f.terning = { verdi: Number(m.tekst) || 1, fra: t, til: t + 5 };
          if (!s.forste) leggILogg(m.navn, `triller terning og får ${m.tekst}`, "gest");
        } else if (m.type === "musikk") {
          if (!s.forste) { spillMelodi(m.tekst); leggILogg(m.navn, `setter på «${sanger[m.tekst] || m.tekst}» på jukeboksen`, "gest"); }
        } else if (m.type === "hendelse") { if (!s.forste) leggILogg(null, m.tekst, "info"); }
        else if (m.type === "gest") { if (f && !s.forste) { f.gest = m.tekst; f.gestTil = t + (m.tekst === "dans" ? 7 : 3); } if (!s.forste) leggILogg(m.navn, GESTER[m.tekst] || "", "gest"); }
        else { if (f && m.navn === PROFESSOR) f.tenker = 0; if (f && !s.forste) si(f, m.tekst, t); leggILogg(m.navn, m.tekst); }
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
    if (type === "terning") { api("hotell/terning", post({})).then(hent).catch((e) => leggILogg(null, e.message, "info")); return; }
    if (type === "si" && hviskTil) {
      const til = hviskTil;
      leggILogg(null, `Du hvisker til ${vis(til)}: ${tekst}`, "hvisk");
      try { await api("hotell/hvisk", post({ til, tekst })); } catch (e) { leggILogg(null, e.message, "info"); settHvisk(null); }
      return;
    }
    if (type === "gest") { meg.gest = tekst; meg.gestTil = t + (tekst === "dans" ? 7 : 3); leggILogg(MEG, GESTER[tekst], "gest"); }
    else { si(meg, tekst, t); leggILogg(MEG, tekst); }
    const tilProfessoren = type !== "gest" && rom === "auditoriet" && (paTalerstolen() || /professor/i.test(tekst));
    if (tilProfessoren) tenk(true);
    try { await api("hotell/si", post({ type, tekst })); hent(); }
    catch (e) { leggILogg(null, e.message, "info"); if (tilProfessoren) tenk(false); }
  }

  // ---------- Innredning av eget rom ----------
  const lagAv = (type) => (MOBEL[type] ? (MOBEL[type].vegg ? "vegg" : MOBEL[type].gulv ? "gulv" : "") : "");
  // Ett møbel per flis, pluss ett teppe under og én ting på veggen bak. Døra og flisa foran den holdes fri.
  function kanSettes(type, x, y) {
    if (!hjem || !rute(x, y) || (x === 1 && y <= 1)) return false;
    if (lagAv(type) === "vegg" && x !== 0 && y !== 0) return false;
    return !hjem.mobler.some((m) => m.x === x && m.y === y && lagAv(m.type) === lagAv(type));
  }
  function oppdaterHjem(h) {
    const nokkel = (x) => JSON.stringify([x.mobler, x.storrelse, x.niva, x.gulv, x.vegg]);
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
      if (s.butikk) butikk = s.butikk;
      oppdaterHjem(s.hjem);
      visButikk();
    } catch (e) { melding = e.message; visInnred(); }
  }
  function innredKlikk(x, y) {
    if (!rute(x, y)) return;
    const pa = hjem.mobler.filter((m) => m.x === x && m.y === y);
    const holder = valgt && hjem.lager.find((m) => m.id === valgt);
    if (holder && kanSettes(holder.type, x, y)) return innredning("hotell/mobel", { id: valgt, x, y }, () => { valgt = null; });
    const star = pa.find((m) => !lagAv(m.type)) || pa.find((m) => lagAv(m.type) === "gulv") || pa[0];
    if (star) innredning("hotell/mobel", { id: star.id, x: null }, () => { valgt = star.id; });
    else if (holder) { melding = lagAv(holder.type) === "vegg" ? "Veggpynt må henge på en flis inntil veggen." : "Der er det ikke plass."; visInnred(); }
  }
  const eide = (slag) => (butikk ? butikk.eid.filter((id) => butikk.katalog[id] && butikk.katalog[id].slag === slag) : []);
  const varenavn = (id) => (butikk && butikk.katalog[id] ? butikk.katalog[id].navn : id);
  function visInnred() {
    const boks = document.getElementById("h-innred");
    if (!boks) return;
    if (!erMitt() || !hjem || !hjem.lager) { if (innredNokkel) { boks.innerHTML = ""; innredNokkel = ""; } return; }
    const nokkel = JSON.stringify([hjem.lager, hjem.niva, hjem.storrelse, innred, valgt, melding, butikk && [butikk.eid, butikk.gulv, butikk.vegg]]);
    if (nokkel === innredNokkel) return;
    innredNokkel = nokkel;
    const stiler = (slag, tittel) => {
      const l = eide(slag);
      return l.length ? `<div class="h-rad"><span>${tittel}</span><div><button type="button" class="h-valg${butikk[slag] ? "" : " valgt"}" data-stil="${slag}" data-verdi="">følger villaen</button>${l.map((id) => `<button type="button" class="h-valg${butikk[slag] === id ? " valgt" : ""}" data-stil="${slag}" data-verdi="${id}">${esc(varenavn(id))}</button>`).join("")}</div></div>` : "";
    };
    boks.innerHTML = `<section class="h-boks h-innred">
      <div class="h-innredhode">
        <div><p class="h-etikett">Rommet ditt</p>
          <p>Rommet er ${hjem.storrelse} × ${hjem.storrelse} fliser. ${hjem.harGods ? `Villaen din i Symposion er på nivå ${hjem.niva}. <a href="symposion.html">Bygg ut villaen</a> eller kjøp en utvidelse i butikken for å få større rom.` : `Flytt inn i <a href="symposion.html">Symposion</a> og bygg villa, eller kjøp en utvidelse i butikken, for å få større rom.`}</p></div>
        <button class="knapp${innred ? "" : " sekundar"}" type="button" data-innred>${innred ? "Ferdig" : "Innred rommet"}</button>
      </div>
      ${melding ? `<p class="melding feil">${esc(melding)}</p>` : ""}
      ${innred ? `<p class="h-etikett">På lager</p>
        <div class="h-lager">${hjem.lager.length ? hjem.lager.map((m) => `<button type="button" class="h-valg${m.id === valgt ? " valgt" : ""}" data-velg="${m.id}">${esc(varenavn(m.type))}</button>`).join("") : `<span class="dempet">Tomt. Kjøp noe i butikken under.</span>`}</div>
        <p class="dempet h-hjelp">Velg noe og trykk på en ledig flis for å sette det ut. Veggpynt henger på flisene inntil veggen. Trykk på et møbel i rommet for å ta det ned igjen.</p>` : ""}
      ${stiler("gulv", "Gulv")}${stiler("vegg", "Vegger")}
    </section>`;
  }

  // ---------- Butikken ----------
  // Et lite bilde av varen, tegnet med de samme tegningene som i rommet.
  // Varen tegnes først på et prøvelerret, så måles den og skaleres til å fylle ruta.
  let prove = null;
  function ikon(lerretet, id) {
    const v = butikk.katalog[id], g = lerretet.getContext("2d"), ekte = ctx, N = 640;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 160, 152);
    if (v.slag === "utvidelse") {
      g.fillStyle = "#e2c174"; g.textAlign = "center"; g.font = "700 44px Cinzel, Georgia, serif"; g.fillText("+1", 80, 78); g.font = "600 17px Cinzel, Georgia, serif"; g.fillText("FLIS HVER VEI", 80, 108);
      return;
    }
    if (!prove) { prove = document.createElement("canvas"); prove.width = prove.height = N; }
    const pg = prove.getContext("2d", { willReadFrequently: true });
    pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, N, N); pg.setTransform(2, 0, 0, 2, N / 2, N * 0.75);
    ctx = pg;
    try {
      if (MOBEL[id]) MOBEL[id].tegn(0, 0, MOBEL[id].vegg ? "v" : "h", 1);
      else if (v.slag === "gulv") { for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) rombe(x, y - 3, 0, GULVSTIL[id](x, y, 1)); }
      else if (v.slag === "vegg") {
        const stil = VEGGSTIL[id];
        flate([P(0, 0), P(0, 2), P(0, 2, 112), P(0, 0, 112)], stil.farge[0]); flate([P(0, 0), P(2, 0), P(2, 0, 112), P(0, 0, 112)], stil.farge[1]);
        flate([P(0, 0), P(0, 2), P(0, 2, 34), P(0, 0, 34)], mork(stil.farge[0], 0.8)); flate([P(0, 0), P(2, 0), P(2, 0, 34), P(0, 0, 34)], mork(stil.farge[1], 0.8));
        stil.pynt({ b: 2, d: 2 }, 1);
      }
      else if (v.slag === "hode" || v.slag === "pynt") figur(pg, { ...look, hode: null, pynt: null, [v.slag]: id }, { t: 1, gaar: false, sitter: false, gest: null, flip: false, bak: false });
      else if (v.slag === "dyr") dyr(pg, id, 1, false);
    } catch (_) {}
    ctx = ekte;
    const d = pg.getImageData(0, 0, N, N).data;
    let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, s = Math.min(150 / w, 144 / h, v.slag === "dyr" ? 2 : 1.25);
    g.imageSmoothingEnabled = v.slag !== "dyr";
    const m = 70;   // tar med litt rundt, så lysskjær toner ut i stedet for å kuttes
    g.drawImage(prove, x0 - m, y0 - m, w + 2 * m, h + 2 * m, (160 - w * s) / 2 - m * s, (152 - h * s) / 2 - m * s, (w + 2 * m) * s, (h + 2 * m) * s);
  }
  function visButikk() {
    const boks = document.getElementById("h-butikk");
    if (!boks || !butikk) return;
    const nokkel = JSON.stringify([butikk.lommebok, butikk.eid, butikk.gulv, butikk.vegg, butikk.krav, butikk.mobler, fane, kvittering, look.hode, look.pynt, look.dyr]);
    if (nokkel === butikkNokkel) return;
    butikkNokkel = nokkel;
    const B = butikk.lommebok, V = butikk.valuta, K = butikk.katalog, tall = (n) => n.toLocaleString("nb-NO");
    const pris = (p) => Object.entries(p).map(([v, n]) => `<span class="h-pris${B[v] < n ? " mangler" : ""}"><i style="background:${V[v].farge}"></i>${tall(n)} ${V[v].navn}</span>`).join("");
    const kort = ([id, v]) => {
      const eid = butikk.eid.includes(id), rad = Object.entries(v.pris).every(([r, n]) => B[r] >= n), krav = v.krav && butikk.krav[v.krav];
      const laast = (krav && !krav.ok) || (v.etter && !butikk.eid.includes(v.etter));
      let knapp;
      if (!v.slag) knapp = `<button class="liten-knapp" type="button" data-kjop="${id}" ${rad && !laast ? "" : "disabled"}>Kjøp</button>`;
      else if (!eid) knapp = `<button class="liten-knapp" type="button" data-kjop="${id}" ${rad && !laast ? "" : "disabled"}>Kjøp</button>`;
      else if (v.slag === "utvidelse") knapp = `<span class="h-eid">Kjøpt</span>`;
      else if (v.slag === "gulv" || v.slag === "vegg") knapp = butikk[v.slag] === id ? `<span class="h-eid">I bruk</span>` : `<button class="liten-knapp" type="button" data-stil="${v.slag}" data-verdi="${id}">Bruk</button>`;
      else knapp = look[v.slag] === id ? `<button class="liten-knapp" type="button" data-felt="${v.slag}" data-verdi="">${v.slag === "dyr" ? "La bli hjemme" : "Ta av"}</button>` : `<button class="liten-knapp" type="button" data-felt="${v.slag}" data-verdi="${id}">${v.slag === "dyr" ? "Ta med" : "Ta på"}</button>`;
      return `<div class="h-vare${eid ? " eid" : ""}"><canvas class="h-ikon" width="160" height="152" data-ikon="${id}" aria-hidden="true"></canvas><strong>${esc(v.navn)}</strong>
        ${eid ? "" : `<div class="h-priser">${pris(v.pris)}</div>`}
        ${krav && !eid ? `<p class="h-krav${krav.ok ? " ok" : ""}">${krav.ok ? "Bragden er i boks" : esc(krav.tekst)}</p>` : ""}
        ${v.etter && !eid && !butikk.eid.includes(v.etter) ? `<p class="h-krav">Krever «${esc(K[v.etter].navn)}» først</p>` : ""}
        ${knapp}</div>`;
    };
    boks.innerHTML = `<section class="h-boks h-butikkboks">
      <p class="h-etikett">Butikken</p>
      <p class="h-butikktekst">Hvert spill gir sin egen premie, og alle brukes her. Dagens første spill i hvert spill gir dobbelt.</p>
      <div class="h-lommebok">${Object.entries(V).map(([id, v]) => `<a class="h-mynt" href="${v.side}" title="${esc(v.slik)}"><i style="background:${v.farge}"></i><strong>${tall(B[id])}</strong> ${v.navn}<span>${esc(v.fra)}</span></a>`).join("")}</div>
      ${kvittering ? `<p class="melding${kvittering.feil ? " feil" : " h-kvittering"}">${esc(kvittering.tekst)}</p>` : ""}
      <div class="h-faner" role="tablist">${Object.entries(butikk.kategorier).map(([id, navn]) => `<button type="button" role="tab" class="h-fane${id === fane ? " aktiv" : ""}" aria-selected="${id === fane}" data-fane="${id}">${esc(navn)}</button>`).join("")}</div>
      <div class="h-butikk">${Object.entries(K).filter(([, v]) => v.kat === fane).map(kort).join("")}</div>
      ${fane === "trofe" ? "" : ["mobler", "pynt", "gulv", "vegg"].includes(fane) ? `<p class="dempet h-hjelp">Du har ${butikk.mobler} av ${butikk.maksMobler} møbler. ${erMitt() ? "Det du kjøper, kan settes rett ut i rommet." : "Det du kjøper, legges på lageret. Gå til rommet ditt for å sette det ut."}</p>` : ""}
    </section>`;
    for (const c of boks.querySelectorAll("[data-ikon]")) ikon(c, c.dataset.ikon);
  }
  async function kjop(id) {
    try {
      const s = await api("hotell/kjop", post({ type: id }));
      butikk = s.butikk;
      const navn = varenavn(id);
      let tekst;
      if (s.slag === "mobel") {
        if (erMitt()) { innred = true; valgt = s.id; visRommet(); tekst = `${navn} er kjøpt. Trykk på en ledig flis i rommet for å sette den ut.`; }
        else tekst = `${navn} er kjøpt og ligger på lageret. Gå til rommet ditt for å sette den ut.`;
      } else if (BARES.includes(s.slag)) { baer(s.slag, id); tekst = s.slag === "dyr" ? `${navn} er din, og følger deg fra nå av.` : `${navn} er kjøpt og tatt på.`; }
      else tekst = s.slag === "utvidelse" ? "Rommet ditt er utvidet med en flis hver vei." : `${navn} er kjøpt og tatt i bruk i rommet ditt.`;
      kvittering = { tekst };
      if (erMitt() && hjem) oppdaterHjem(s.hjem);
    } catch (e) { kvittering = { tekst: e.message, feil: true }; }
    visButikk(); visGarderobe(); visInnred();
  }
  async function velgStil(slag, id) {
    try {
      const s = await api("hotell/stil", post({ [slag]: id }));
      butikk = s.butikk;
      if (erMitt() && hjem) oppdaterHjem(s.hjem);
    } catch (e) { kvittering = { tekst: e.message, feil: true }; }
    visButikk(); visInnred();
  }
  // Ta på eller av noe fra garderoben, og si fra til serveren
  function baer(felt, verdi) {
    look = { ...look, [felt]: verdi };
    if (meg) meg.utseende = look;
    visGarderobe(); visButikk();
    clearTimeout(lagreTid);
    if (meg) lagreTid = setTimeout(() => api("hotell/utseende", post(look)).catch(() => {}), 500);
  }
  async function lastButikk() {
    try { butikk = await api("hotell/butikk"); visButikk(); visGarderobe(); visInnred(); } catch (_) {}
  }

  // ---------- Det rundt lerretet ----------
  function leggILogg(navn, tekst, type) {
    logg.push({ navn, tekst, type });
    if (logg.length > 40) logg.shift();
    const l = document.getElementById("h-logg");
    if (!l) return;
    l.innerHTML = logg.map((m) => m.type === "info" ? `<li class="info">${esc(m.tekst)}</li>` : m.type === "gest" ? `<li class="gest">${esc(vis(m.navn))} ${esc(m.tekst)}</li>` : m.type === "hvisk" ? `<li class="hvisk">${m.navn ? `<strong>${esc(vis(m.navn))}</strong> hvisker: ` : ""}${esc(m.tekst)}</li>` : `<li><strong>${esc(vis(m.navn))}</strong> ${esc(m.tekst)}</li>`).join("");
    l.scrollTop = l.scrollHeight;
  }
  function visRomliste() {
    const l = document.getElementById("h-rom");
    if (!l) return;
    const nokkel = JSON.stringify([rom, antall, medlemmer, gjesterom]);
    if (nokkel === romNokkel) return;
    romNokkel = nokkel;
    const knapp = (id, navn) => `<button type="button" class="h-romknapp${id === rom ? " aktiv" : ""}" data-rom="${esc(id)}">${esc(navn)}<span>${antall[id] || 0}</span></button>`;
    const valg = (n) => `<option value="hjem:${esc(n)}"${rom === `hjem:${n}` ? " selected" : ""}>${esc(vis(n))}${antall[`hjem:${n}`] ? ` (${antall[`hjem:${n}`]} inne)` : ""}</option>`;
    // Brødre og gjester i én liste, sortert på navn
    const alle = [...medlemmer, ...gjesterom].filter((n) => n !== MEG).sort((a, b) => vis(a).localeCompare(vis(b), "nb"));
    l.innerHTML = Object.entries(ROM).map(([id, r]) => knapp(id, r.navn)).join("") + knapp(mittRom(), "Rommet mitt") +
      (alle.length ? `<select id="h-besok" class="h-besok${rom.startsWith("hjem:") && !erMitt() ? " aktiv" : ""}" aria-label="Besøk noen">
        <option value="">Besøk noen …</option>${alle.map(valg).join("")}</select>` : "");
  }
  function visGarderobe() {
    const g = document.getElementById("h-garderobe");
    if (!g || !look) return;
    const a = look;
    const farger = (felt, liste) => liste.map((f) => `<button type="button" class="h-farge${a[felt] === f ? " valgt" : ""}" data-felt="${felt}" data-verdi="${f}" style="background:${f}" aria-label="${felt}"></button>`).join("");
    const valg = (felt, liste) => liste.map((v) => `<button type="button" class="h-valg${a[felt] === v ? " valgt" : ""}" data-felt="${felt}" data-verdi="${v}">${v}</button>`).join("");
    // Det som er kjøpt i butikken
    const kjopt = (felt, tittel) => {
      const l = eide(felt);
      return l.length ? `<div class="h-rad"><span>${tittel}</span><div><button type="button" class="h-valg${a[felt] ? "" : " valgt"}" data-felt="${felt}" data-verdi="">ingen</button>${l.map((id) => `<button type="button" class="h-valg${a[felt] === id ? " valgt" : ""}" data-felt="${felt}" data-verdi="${id}">${esc(varenavn(id))}</button>`).join("")}</div></div>` : "";
    };
    g.innerHTML = `
      <div class="h-rad"><span>Toga</span><div>${farger("toga", TOGA)}</div></div>
      <div class="h-rad"><span>Hud</span><div>${farger("hud", HUD)}</div></div>
      <div class="h-rad"><span>Hår</span><div>${valg("har", HAR)}</div></div>
      <div class="h-rad"><span>Hårfarge</span><div>${farger("harfarge", HARFARGE)}</div></div>
      <div class="h-rad"><span>Skjegg</span><div>${valg("skjegg", ["ja", "nei"])}</div></div>
      ${kjopt("hode", "Hodeplagg")}${kjopt("pynt", "Tilbehør")}${kjopt("dyr", "Kjæledyr")}`;
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
    if (k.dataset.info !== undefined) visInfo("Slik fungerer Tafse Hotell", INFO);
    else if (k.dataset.gest) send("gest", k.dataset.gest);
    else if (k.dataset.terning !== undefined) send("terning", "");
    else if (k.dataset.lyd !== undefined) { lydPa = !lydPa; try { localStorage.setItem("tafse-hotell-lyd", lydPa ? "pa" : "av"); } catch (_) {} k.textContent = lydPa ? "Lyd på" : "Lyd av"; }
    else if (k.id === "h-hviskmerke") settHvisk(null);
    else if (k.dataset.slettbok) gjestebokSend({ slett: Number(k.dataset.slettbok) });
    else if (k.dataset.rom && k.dataset.rom !== rom) gaTil(k.dataset.rom, null);
    else if (k.dataset.felt && look) baer(k.dataset.felt, k.dataset.verdi);
    else if (k.dataset.fane) { fane = k.dataset.fane; kvittering = null; visButikk(); }
    else if (k.dataset.stil) velgStil(k.dataset.stil, k.dataset.verdi);
    else if (k.dataset.innred !== undefined) { innred = !innred; valgt = null; melding = ""; visInnred(); }
    else if (k.dataset.velg) { valgt = valgt === Number(k.dataset.velg) ? null : Number(k.dataset.velg); visInnred(); if (valgt) visRommet(); }
    else if (k.dataset.kjop) kjop(k.dataset.kjop);
  });
  rot.addEventListener("submit", (e) => {
    if (e.target.id !== "h-bokskjema") return;
    e.preventDefault();
    const felt = document.getElementById("h-boktekst"), tekst = felt.value.replace(/\s+/g, " ").trim();
    if (tekst) { gjestebokNokkel = ""; gjestebokSend({ tekst }); }
    felt.value = "";
  });
  rot.addEventListener("change", (e) => { if (e.target.id === "h-besok" && e.target.value) gaTil(e.target.value, null); });

  function bygg() {
    rot.innerHTML = `
      <div class="h-topplinje"><div class="h-rom" id="h-rom"></div><button class="liten-knapp" type="button" data-info>Slik fungerer hotellet</button></div>
      <div class="h-ramme"><canvas id="h-lerret" aria-label="Rommet. Trykk på gulvet for å gå."></canvas></div>
      <form class="h-prat" id="h-prat">
        <input id="h-tekst" maxlength="140" placeholder="Si noe til rommet …" autocomplete="off" aria-label="Si noe">
        <button class="knapp" type="submit">Si</button>
        <button class="h-hviskmerke" type="button" id="h-hviskmerke" hidden></button>
        <div class="h-gester">${Object.keys(GESTER).map((g) => `<button class="liten-knapp" type="button" data-gest="${g}">${{ vink: "Vink", skal: "Skål", dans: "Dans", klapp: "Klapp", ler: "Le" }[g]}</button>`).join("")}<button class="liten-knapp" type="button" data-terning>Terning</button><button class="liten-knapp" type="button" data-lyd>${lydPa ? "Lyd på" : "Lyd av"}</button></div>
      </form>
      <div id="h-innred"></div>
      <div id="h-gjestebok"></div>
      <div class="h-to">
        <section class="h-boks"><p class="h-etikett">Praten</p><ul class="h-logg" id="h-logg"></ul></section>
        <section class="h-boks"><p class="h-etikett">Garderoben</p><div id="h-garderobe"></div>
          <p class="dempet h-hjelp">Trykk på gulvet for å gå, på en stol for å sette deg og på en dør for å bytte rom.</p></section>
      </div>
      <div id="h-butikk"></div>`;
    lerret = document.getElementById("h-lerret");
    ctx = lerret.getContext("2d");
    tilpass();
    visGarderobe();

    lerret.addEventListener("click", (e) => {
      const [x, y] = tilFlis(e);
      if (innred && erMitt() && hjem) return innredKlikk(x, y);
      const f = figurVed(e);
      if (f) visKort(f.navn); else ga(x, y);
    });
    lerret.addEventListener("pointermove", (e) => { peker = tilFlis(e); });
    lerret.addEventListener("pointerleave", () => { peker = null; });
    document.getElementById("h-prat").addEventListener("submit", (e) => {
      e.preventDefault(); e.stopPropagation();
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
        ${new URLSearchParams(location.search).get("innsjekk") ? `<p><strong>Du må sjekke inn før du kan spille.</strong> Det gjør du bare én gang.</p>` : ""}
        <p>Bestem hvordan du ser ut. Når du sjekker inn, får du et rom her på hotellet og et hus i Symposion, og du blir synlig for de andre i spillene. Du kan bytte klær i garderoben senere.</p>
        <div id="h-garderobe"></div>
        <button class="knapp" type="button" id="h-sjekkinn">Sjekk inn som ${esc(vis(MEG))}</button>
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
      try {
        await api("hotell/utseende", post(look)); aktiv = false;
        // Kom man hit fra et annet spill, slipper man inn der nå
        const til = new URLSearchParams(location.search).get("til") || "";
        if (/^[\w-]+\.html(\?[^\s]*)?$/.test(til) && !til.startsWith("hotell.html")) { location.href = til; return; }
        start();
      }
      catch (err) { const f = document.getElementById("h-innfeil"); f.textContent = err.message; f.hidden = false; e.currentTarget.disabled = false; }
    });
  }

  function start() {
    bygg();
    lastButikk();
    const onsket = new URLSearchParams(location.search).get("rom") || "";
    gaTil(ROM[onsket] || onsket.startsWith("hjem:") ? onsket : "lobbyen", null);
  }

  (async () => {
    if (!(await hvemErJeg())) {
      rot.innerHTML = `<p class="tomt">Du må <a href="${SPILLSIDE ? "gjest.html" : "salongen.html"}">logge inn</a> for å sjekke inn på hotellet.</p>`;
      return;
    }
    let profil = null;
    try { profil = (await api("hotell/profil")).utseende; } catch (_) {}
    look = utseende(profil, MEG);
    if (!profil || profil.klar !== "ja") visInnsjekk(); else start();
  })();
})();
