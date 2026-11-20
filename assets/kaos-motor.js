// KAOS: motoren. Stoffene, fysikken, reaksjonene, oppdagelsene og dagens oppdrag.
// Her er det ingen tegning av siden: den ligger i assets/kaos.js. Fila brukes også av
// testene (scripts/kaos-test.mjs), så den må kunne kjøre uten nettleser.
//
// Brettet er et rutenett på 200 × 150 celler. Hver celle har ett stoff. Stoffene er
// pulver (faller og hoper seg opp), væske (renner utover), gass (stiger) eller fast.
// Alt som kan justeres står i tabellene øverst: STOFFER, REAKSJONER og FUNN.

(function (rot) {
  "use strict";
  const B = 200, H = 150, N = B * H;
  const TOM_F = 0, FAST = 1, PULVER = 2, VASKE = 3, GASS_F = 4;

  // ---------- Stoffene ----------
  // fase: fast, pulver, væske eller gass. tetthet: tyngre synker gjennom lettere væske.
  // brenn: sjansen for å ta fyr hver gang ild er borti. syre: sjansen for å tæres av syre.
  // styrke: sjansen for å tåle en eksplosjon. treg: sjansen for å stå stille et øyeblikk.
  // flyt: hvor langt en væske renner sidelengs per steg. gruppe: hvor stoffet står i menyen.
  // start: tilgjengelig fra første stund. De andre må oppdages (se FUNN) eller låses opp (LAASER).
  const EL = [], E = {};
  function stoff(nokkel, navn, fase, tetthet, farge, mer) {
    const id = EL.length;
    E[nokkel.toUpperCase()] = id;
    EL.push({ id, nokkel, navn, fase, tetthet, farge, spenn: 10, brenn: 0, syre: 0, styrke: 0, treg: 0, flyt: 0, gruppe: null, start: false, ...mer });
    return id;
  }
  const TOM = stoff("tom", "Tomt", TOM_F, 0, [0, 0, 0]);
  const SAND = stoff("sand", "Sand", PULVER, 25, [214, 184, 120], { spenn: 14, syre: 0.05, gruppe: "pulver", start: true });
  const VANN = stoff("vann", "Vann", VASKE, 10, [52, 110, 200], { spenn: 7, flyt: 5, gruppe: "vaske", start: true });
  const JORD = stoff("jord", "Jord", PULVER, 22, [112, 80, 50], { spenn: 12, syre: 0.1, treg: 0.2, gruppe: "pulver", start: true });
  const STEIN = stoff("stein", "Stein", FAST, 0, [128, 126, 122], { spenn: 9, syre: 0.04, styrke: 0.35, gruppe: "fast", start: true });
  const ILD = stoff("ild", "Ild", GASS_F, 1, [255, 150, 40], { treg: 0.3, gruppe: "kraft", start: true });
  const FRO = stoff("fro", "Frø", PULVER, 9, [196, 170, 90], { spenn: 8, brenn: 0.2, syre: 0.3, gruppe: "pulver", start: true });
  const OLJE = stoff("olje", "Olje", VASKE, 8, [128, 116, 44], { spenn: 6, flyt: 3, brenn: 0.6, gruppe: "vaske", start: true });
  const TRE = stoff("tre", "Tre", FAST, 0, [124, 86, 50], { spenn: 10, brenn: 0.25, syre: 0.15, gruppe: "fast", start: true });
  const IS = stoff("is", "Is", FAST, 0, [170, 214, 238], { spenn: 8, syre: 0.1, gruppe: "fast", start: true });
  const SALT = stoff("salt", "Salt", PULVER, 21, [236, 236, 230], { spenn: 8, gruppe: "pulver", start: true });
  const METALL = stoff("metall", "Metall", FAST, 0, [150, 158, 170], { spenn: 6, syre: 0.1, styrke: 0.6, gruppe: "fast", start: true });
  const DAMP = stoff("damp", "Damp", GASS_F, 2, [186, 198, 212], { spenn: 8, treg: 0.45, gruppe: "gass" });
  const GLASS = stoff("glass", "Glass", FAST, 0, [112, 160, 158], { spenn: 6, gruppe: "fast" });
  const GJORME = stoff("gjorme", "Gjørme", PULVER, 16, [86, 62, 42], { spenn: 8, syre: 0.1, treg: 0.55, gruppe: "pulver" });
  const TEGL = stoff("tegl", "Tegl", FAST, 0, [178, 90, 60], { spenn: 10, syre: 0.03, styrke: 0.5, gruppe: "fast" });
  const PLANTE = stoff("plante", "Plante", FAST, 0, [70, 150, 60], { spenn: 18, brenn: 0.25, syre: 0.3, gruppe: "fast" });
  const BLOMST = stoff("blomst", "Blomst", FAST, 0, [232, 120, 170], { spenn: 0, brenn: 0.25, syre: 0.3, gruppe: "fast" });
  const DRUE = stoff("drue", "Drue", PULVER, 11, [116, 54, 126], { spenn: 12, brenn: 0.1, syre: 0.3, gruppe: "pulver" });
  const VIN = stoff("vin", "Vin", VASKE, 10, [124, 26, 62], { spenn: 8, flyt: 4, gruppe: "vaske" });
  const SPRIT = stoff("sprit", "Sprit", VASKE, 7, [196, 222, 232], { spenn: 6, flyt: 5, brenn: 0.8, gruppe: "vaske" });
  const ASKE = stoff("aske", "Aske", PULVER, 9, [150, 146, 140], { spenn: 14, syre: 0.3, treg: 0.3, gruppe: "pulver" });
  const KULL = stoff("kull", "Kull", PULVER, 13, [42, 40, 38], { spenn: 8, brenn: 0.1, syre: 0.1, gruppe: "pulver" });
  const ROYK = stoff("royk", "Røyk", GASS_F, 3, [92, 90, 88], { spenn: 12, treg: 0.4, gruppe: "gass" });
  const LAVA = stoff("lava", "Lava", VASKE, 30, [240, 100, 20], { spenn: 0, flyt: 1, treg: 0.5, gruppe: "vaske" });
  const OBSIDIAN = stoff("obsidian", "Obsidian", FAST, 0, [38, 30, 50], { spenn: 6, styrke: 0.7, gruppe: "fast" });
  const SALTVANN = stoff("saltvann", "Saltvann", VASKE, 11, [72, 142, 190], { spenn: 7, flyt: 5, gruppe: "vaske" });
  const SVOVEL = stoff("svovel", "Svovel", PULVER, 20, [222, 208, 62], { spenn: 10, brenn: 0.15, gruppe: "pulver" });
  const KRUTT = stoff("krutt", "Krutt", PULVER, 17, [72, 72, 80], { spenn: 14, brenn: 1, syre: 0.2, gruppe: "pulver" });
  const SYRE = stoff("syre", "Syre", VASKE, 12, [150, 230, 40], { spenn: 10, flyt: 4, gruppe: "vaske" });
  const GASS = stoff("gass", "Gass", GASS_F, 1, [150, 200, 160], { spenn: 8, treg: 0.3, brenn: 0.9, gruppe: "gass" });
  const RUST = stoff("rust", "Rust", PULVER, 24, [152, 76, 38], { spenn: 12, syre: 0.2, gruppe: "pulver" });
  const SNO = stoff("sno", "Snø", PULVER, 5, [240, 244, 250], { spenn: 6, syre: 0.2, treg: 0.6, gruppe: "pulver" });
  const DIAMANT = stoff("diamant", "Diamant", FAST, 0, [190, 240, 250], { spenn: 6, styrke: 1, gruppe: "fast" });
  const GULL = stoff("gull", "Gull", FAST, 0, [232, 190, 70], { spenn: 12, styrke: 0.8, gruppe: "fast" });
  const GRESK = stoff("greskild", "Gresk ild", VASKE, 9, [60, 140, 90], { spenn: 8, flyt: 3, brenn: 0.7, gruppe: "vaske" });
  const KILDE = stoff("kilde", "Kilde", FAST, 0, [200, 160, 255], { spenn: 0, styrke: 1, gruppe: "saer" });
  const SLUK = stoff("sluk", "Sluk", FAST, 0, [24, 12, 36], { spenn: 0, styrke: 1, gruppe: "saer" });
  const MIDAS = stoff("midas", "Midasstøv", PULVER, 30, [255, 222, 112], { spenn: 0, gruppe: "saer" });
  // Stoffer som bare finnes underveis og ikke står i menyen
  const GLO = stoff("glo", "Glør", FAST, 0, [200, 70, 20], { spenn: 0 });
  const LYNSPOR = stoff("lynspor", "Lyn", GASS_F, 1, [255, 255, 255], { spenn: 0, treg: 1 });
  const TENT = stoff("tent", "Tent krutt", FAST, 0, [255, 255, 230], { spenn: 0 });
  // Naturen. Nye stoffer legges alltid til sist, så numrene i lagrede brett og verk i galleriet står seg.
  const GRESS = stoff("gress", "Gress", FAST, 0, [96, 168, 64], { spenn: 16, brenn: 0.35, syre: 0.3, gruppe: "fast" });
  const MOSE = stoff("mose", "Mose", FAST, 0, [92, 122, 70], { spenn: 12, syre: 0.1, styrke: 0.35, gruppe: "fast" });
  const OLIVEN = stoff("oliven", "Oliven", PULVER, 11, [84, 96, 44], { spenn: 10, brenn: 0.1, syre: 0.3, gruppe: "pulver" });
  const FISK = stoff("fisk", "Fisk", PULVER, 10, [240, 140, 50], { spenn: 14, syre: 0.5, gruppe: "saer" });
  const NT = EL.length;

  // Redskaper som ikke er stoffer
  const REDSKAP = {
    lyn: { nokkel: "lyn", navn: "Lyn", gruppe: "kraft", start: true, farge: [255, 244, 170] },
    vind: { nokkel: "vind", navn: "Vind", gruppe: "kraft", start: true, farge: [170, 190, 200] },
    visk: { nokkel: "visk", navn: "Viskelær", gruppe: "kraft", start: true, farge: [60, 56, 50] },
    menneske: { nokkel: "menneske", navn: "Menneske", gruppe: "saer", farge: [236, 228, 210] },
  };
  const GRUPPER = [["pulver", "Pulver"], ["vaske", "Væsker"], ["fast", "Faste stoffer"], ["gass", "Gasser"], ["kraft", "Krefter"], ["saer", "Særlige"]];

  // ---------- Oppdagelsene ----------
  // nokkel er stoffet (eller fenomenet) som oppdages. oppskrift vises etter at det er funnet, hint før.
  const FUNN = [
    { nokkel: "royk", navn: "Røyk", oppskrift: "Stiger opp når noe brenner", hint: "Ingen ild uten …" },
    { nokkel: "damp", navn: "Damp", oppskrift: "Vann som møter ild eller lava", hint: "Hva skjer når vann blir varmt nok?" },
    { nokkel: "aske", navn: "Aske", oppskrift: "Det som ligger igjen når tre har brent ut", hint: "Det som ligger igjen etter bålet" },
    { nokkel: "gjorme", navn: "Gjørme", oppskrift: "Jord og vann", hint: "Jord tåler ikke regn" },
    { nokkel: "saltvann", navn: "Saltvann", oppskrift: "Salt løst i vann", hint: "Slik smaker havet" },
    { nokkel: "kull", navn: "Kull", oppskrift: "Brennende tre som slukkes med vann", hint: "Slukk bålet før det har brent ut" },
    { nokkel: "plante", navn: "Plante", oppskrift: "Et frø i fuktig jord", hint: "Frøet trenger jord og vann" },
    { nokkel: "blomst", navn: "Blomst", oppskrift: "Springer ut på planter som vokser", hint: "Tålmodighet og vann får det til å springe ut" },
    { nokkel: "drue", navn: "Drue", oppskrift: "Vokser på planter som får nok vann", hint: "Godt vannede planter bærer frukt" },
    { nokkel: "vin", navn: "Vin", oppskrift: "Druer som blir liggende i vann", hint: "La frukten ligge og godgjøre seg i vann" },
    { nokkel: "sprit", navn: "Sprit", oppskrift: "Vin som varmes opp over ild", hint: "Varm opp gaven fra Dionysos" },
    { nokkel: "glass", navn: "Glass", oppskrift: "Sand truffet av lynet, eller smeltet av lava", hint: "Himmelen slår ned i sanden" },
    { nokkel: "tegl", navn: "Tegl", oppskrift: "Gjørme som brennes", hint: "Brenn det våte og brune" },
    { nokkel: "lava", navn: "Lava", oppskrift: "Stein truffet av lynet", hint: "Selv stein smelter når Zevs blir sint" },
    { nokkel: "obsidian", navn: "Obsidian", oppskrift: "Lava som møter vann", hint: "Kjøl ned det som renner fra vulkanen" },
    { nokkel: "svovel", navn: "Svovel", oppskrift: "Dukker opp når lava størkner", hint: "Vent ved vulkanen til den har roet seg" },
    { nokkel: "syre", navn: "Syre", oppskrift: "Svovel i vann", hint: "Det gule pulveret gjør vannet farlig" },
    { nokkel: "gass", navn: "Gass", oppskrift: "Syre på metall, eller strøm i vann", hint: "Noe bobler når metall tæres bort" },
    { nokkel: "rust", navn: "Rust", oppskrift: "Metall som står i vann", hint: "Metall liker ikke å stå vått" },
    { nokkel: "sno", navn: "Snø", oppskrift: "Damp som møter is", hint: "Damp i kulda" },
    { nokkel: "krutt", navn: "Krutt", oppskrift: "Kull og svovel", hint: "Det svarte og det gule" },
    { nokkel: "greskild", navn: "Gresk ild", oppskrift: "Olje og svovel. Brenner også på vann", hint: "Bysants' hemmelige våpen: det fete og det gule" },
    { nokkel: "diamant", navn: "Diamant", oppskrift: "Kull omgitt av lava", hint: "Det svarte under voldsomt press og varme" },
    { nokkel: "menneske", navn: "Menneske", oppskrift: "Lyn i gjørme", hint: "Prometevs formet oss av leire. Bare gnisten mangler" },
    { nokkel: "gull", navn: "Gull", oppskrift: "Alt Midas tar på", hint: "Kong Midas' ønske" },
    { nokkel: "gress", navn: "Gress", oppskrift: "Fuktig jord med luft over", hint: "Jord som får vann, blir ikke liggende bar" },
    { nokkel: "mose", navn: "Mose", oppskrift: "Stein som står i vann", hint: "Stein som står vått lenge nok, blir grønn" },
    { nokkel: "oliven", navn: "Oliven", oppskrift: "Modnes i kronen på trær som står i fuktig jord", hint: "Athenes gave vokser på trær" },
    { nokkel: "fisk", navn: "Fisk", oppskrift: "Lyn i saltvann", hint: "Livet begynte i havet, en stormfull natt" },
    { nokkel: "regn", navn: "Regn", fenomen: true, oppskrift: "Damp som blir til vann igjen", hint: "Det som går opp, kommer ned" },
    { nokkel: "frost", navn: "Frost", fenomen: true, oppskrift: "Vann som fryser inntil is", hint: "Is smitter" },
    { nokkel: "strom", navn: "Strøm", fenomen: true, oppskrift: "Lyn som slår ned i metall", hint: "Gi lynet en vei å gå" },
    { nokkel: "eksplosjon", navn: "Eksplosjon", fenomen: true, oppskrift: "Krutt som antennes", hint: "Tenn på det svarte pulveret" },
    { nokkel: "rus", navn: "Rus", fenomen: true, oppskrift: "Et menneske som finner vin", hint: "Hva gjør et menneske som finner vin?" },
    { nokkel: "lovverk", navn: "Løvverk", fenomen: true, oppskrift: "Tre som står i fuktig jord, slår rot og får krone", hint: "Selv en død stokk slår rot i fuktig jord" },
    { nokkel: "pressing", navn: "Olivenpresse", fenomen: true, oppskrift: "Et menneske som tråkker på oliven", hint: "Athenes gave må tråkkes før den kan brenne i lampa" },
    { nokkel: "gullstatue", navn: "Gullstatue", fenomen: true, oppskrift: "Et menneske som møter Midas", hint: "Slik gikk det med datteren til kong Midas" },
  ];
  // Disse låses opp etter et visst antall oppdagelser
  const LAASER = { sluk: 5, kilde: 10, midas: 18 };

  // ---------- Oppslagstabeller ----------
  const FASE = new Uint8Array(NT), TETT = new Uint8Array(NT);
  const BRENN = new Float32Array(NT), SYREP = new Float32Array(NT), STYRKE = new Float32Array(NT), TREG = new Float32Array(NT), FLYT = new Uint8Array(NT);
  for (const e of EL) { FASE[e.id] = e.fase; TETT[e.id] = e.tetthet; BRENN[e.id] = e.brenn; SYREP[e.id] = e.syre; STYRKE[e.id] = e.styrke; TREG[e.id] = e.treg; FLYT[e.id] = e.flyt; }
  const LEDER = new Uint8Array(NT); LEDER[METALL] = 1; LEDER[GULL] = 1;
  const KLONBAR = new Uint8Array(NT);
  for (const e of EL) if (e.id && (e.fase === PULVER || e.fase === VASKE || e.fase === GASS_F) && e.id !== LYNSPOR && e.id !== MIDAS) KLONBAR[e.id] = 1;
  const FARLIG = new Uint8Array(NT); for (const t of [ILD, LAVA, GLO, SYRE, TENT, LYNSPOR]) FARLIG[t] = 1;
  const GLODSPREDNING = 0.03;   // hvor fort glør brer seg i tre og kull, per nabo per steg
  const FUKT = 90;    // så mange celler trekker fukten inn i jorda fra vann
  const SAFT = 130;   // så mange celler opp fra jorda holder et tre seg levende
  const FERDIG = 0x400;   // merke i L på en tretopp som er ferdig utvokst
  const LADET = 12;   // et ladet metallstykke lyser, og kan ikke lades på nytt før det har falmet

  // ---------- Reaksjoner ved berøring ----------
  // [a, b, a blir til, b blir til, sjanse per berøring]. -1 betyr uendret. Gjelder begge veier.
  const REGLER = new Array(NT * NT);
  function regel(a, b, na, nb, p, fen) {
    REGLER[a * NT + b] = { p, a: na, b: nb, fen };
    REGLER[b * NT + a] = { p, a: nb, b: na, fen };
  }
  regel(ILD, VANN, TOM, DAMP, 0.25);
  regel(ILD, SALTVANN, TOM, DAMP, 0.25);
  regel(ILD, IS, TOM, VANN, 0.5);
  regel(ILD, SNO, TOM, VANN, 0.6);
  regel(ILD, VIN, TOM, SPRIT, 0.3);
  regel(ILD, GJORME, -1, TEGL, 0.15);
  regel(VANN, SALT, SALTVANN, TOM, 0.1);
  regel(VANN, JORD, TOM, GJORME, 0.004);
  regel(VANN, IS, IS, -1, 0.003, "frost");
  regel(VANN, SNO, -1, VANN, 0.03);
  regel(VANN, SVOVEL, SYRE, TOM, 0.012);
  regel(VANN, DRUE, VIN, VIN, 0.02);
  regel(VANN, METALL, -1, RUST, 0.0003);
  regel(VANN, SYRE, -1, VANN, 0.01);
  regel(SALTVANN, METALL, -1, RUST, 0.002);
  regel(SALT, IS, TOM, SALTVANN, 0.05);
  regel(SALT, SNO, TOM, SALTVANN, 0.1);
  regel(SALT, SYRE, TOM, SALTVANN, 0.2);
  regel(DAMP, IS, SNO, -1, 0.15);
  regel(LAVA, VANN, OBSIDIAN, DAMP, 0.4);
  regel(LAVA, SALTVANN, OBSIDIAN, DAMP, 0.4);
  regel(LAVA, IS, OBSIDIAN, VANN, 0.3);
  regel(LAVA, SNO, OBSIDIAN, DAMP, 0.3);
  regel(LAVA, SAND, -1, GLASS, 0.01);
  regel(LAVA, GJORME, -1, TEGL, 0.1);
  regel(GLO, VANN, KULL, DAMP, 0.4);
  regel(GLO, SALTVANN, KULL, DAMP, 0.4);
  regel(GLO, SNO, KULL, VANN, 0.4);
  regel(GLO, IS, -1, VANN, 0.3);
  regel(KULL, SVOVEL, KRUTT, KRUTT, 0.05);
  regel(OLJE, SVOVEL, GRESK, TOM, 0.05);
  for (const t of [STEIN, TRE, METALL, SAND, JORD, IS, GLASS, TEGL, OBSIDIAN, PLANTE, BLOMST, KULL, RUST, DRUE, SALT, ASKE, FRO, SNO, SVOVEL, GJORME, KRUTT, GRESS, MOSE, OLIVEN, FISK]) regel(MIDAS, t, TOM, GULL, 0.5);

  // ---------- Hjelpere ----------
  function prng(fro) {
    let a = fro >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const b64 = (bytes) => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  const fraB64 = (s) => { const bin = atob(s), ut = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) ut[i] = bin.charCodeAt(i); return ut; };

  // Paletten: 16 nyanser per stoff, pakket som ABGR slik bildet lagres i minnet
  const PAL = new Uint32Array(NT * 16);
  const abgr = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;
  const klem = (n) => (n < 0 ? 0 : n > 255 ? 255 : n | 0);
  for (const e of EL) for (let k = 0; k < 16; k++) {
    const d = ((k / 15) - 0.5) * 2 * e.spenn;
    PAL[e.id * 16 + k] = abgr(klem(e.farge[0] + d), klem(e.farge[1] + d), klem(e.farge[2] + d));
  }
  const VAATJORD = new Uint32Array(16);
  for (let k = 0; k < 16; k++) { const d = ((k / 15) - 0.5) * 24; VAATJORD[k] = abgr(klem(84 + d), klem(58 + d), klem(38 + d)); }
  const BLOMSTER = [[236, 120, 170], [246, 214, 90], [244, 240, 232], [170, 120, 220], [236, 96, 80]].map(([r, g, b]) => abgr(r, g, b));
  // Flammer: fra hvitt via gult og oransje til rødt. Tre fargesett: vanlig, blå (sprit og svovel) og grønn (gresk ild).
  const FLAMME = [0, 1, 2].map((sett) => {
    const ut = new Uint32Array(32);
    for (let k = 0; k < 32; k++) {
      const f = k / 31;   // 0 = døende, 1 = nytent
      let r = 255 * Math.min(1, 0.55 + f), g = 255 * Math.pow(f, 0.8), b = 255 * Math.pow(f, 3) * 0.8;
      if (sett === 1) [r, g, b] = [80 + 150 * f * f, 120 + 110 * f, 255];
      if (sett === 2) [r, g, b] = [60 + 180 * f * f, 255 * Math.min(1, 0.6 + f), 90 + 100 * f * f];
      ut[k] = abgr(klem(r), klem(g), klem(b));
    }
    return ut;
  });

  // ---------- Verden ----------
  function lagVerden(fro) {
    const T = new Uint8Array(N), D = new Uint8Array(N), X = new Uint8Array(N), S = new Uint8Array(N), L = new Uint16Array(N);
    let rnd = prng(fro === undefined ? (Math.random() * 2 ** 32) >>> 0 : fro);
    let tikk = 0, st = 1, hoder = [];
    const folk = [];
    const ukjent = new Uint8Array(NT);   // stoffer som ennå ikke er oppdaget
    const v = { T, D, X, L, folk, B, H, vedFunn: null, vedLyd: null, funnAv: false, blink: 0, rystelse: 0 };

    const lyd = (navn) => { if (v.vedLyd) v.vedLyd(navn); };
    function oppdag(nokkel) { if (!v.funnAv && v.vedFunn) v.vedFunn(nokkel); }
    function liv(t) {
      switch (t) {
        case ILD: return 20 + ((rnd() * 30) | 0);
        case DAMP: return 260 + ((rnd() * 260) | 0);
        case ROYK: return 80 + ((rnd() * 120) | 0);
        case GLO: return 150 + ((rnd() * 200) | 0);
        case LYNSPOR: return 5;
        case TENT: return 1 + ((rnd() * 4) | 0);
        default: return 0;
      }
    }
    // sett: legger et stoff i en celle. lag: det samme, men teller som oppdagelse hvis stoffet er nytt.
    function sett(i, t) { T[i] = t; D[i] = (rnd() * 256) | 0; L[i] = liv(t); X[i] = 0; S[i] = st; }
    function lag(i, t) { sett(i, t); if (ukjent[t]) { ukjent[t] = 0; oppdag(EL[t].nokkel); } }
    function bytt(i, j) {
      const t = T[i], d = D[i], l = L[i], x = X[i];
      T[i] = T[j]; D[i] = D[j]; L[i] = L[j]; X[i] = X[j];
      T[j] = t; D[j] = d; L[j] = l; X[j] = x; S[j] = st;
    }
    const NABO = [-B, 1, B, -1];
    // Naboen i retning r (0 opp, 1 høyre, 2 ned, 3 venstre), eller -1 utenfor brettet
    function nabo(i, x, y, r) {
      if (r === 0) return y > 0 ? i - B : -1;
      if (r === 1) return x < B - 1 ? i + 1 : -1;
      if (r === 2) return y < H - 1 ? i + B : -1;
      return x > 0 ? i - 1 : -1;
    }

    // ---------- Ild ----------
    // Tenner på cellen j. farge er flammefargen som følger med videre.
    function tenn(j) {
      const t = T[j];
      switch (t) {
        case TRE: lag(j, GLO); break;
        case KULL: lag(j, GLO); L[j] = 400 + ((rnd() * 300) | 0); X[j] = 1; break;
        case OLJE: sett(j, ILD); L[j] = 40 + ((rnd() * 50) | 0); break;
        case SPRIT: sett(j, ILD); L[j] = 25 + ((rnd() * 25) | 0); X[j] = 1; break;
        case SVOVEL: sett(j, ILD); L[j] = 50 + ((rnd() * 40) | 0); X[j] = 1; break;
        case GASS: sett(j, ILD); L[j] = 8 + ((rnd() * 10) | 0); break;
        case GRESK: if (!X[j]) { X[j] = 1; L[j] = 250 + ((rnd() * 200) | 0); } break;
        case KRUTT: sett(j, TENT); break;
        case PLANTE: case BLOMST: case FRO: case DRUE: case GRESS: case OLIVEN:
          if (rnd() < (t === GRESS ? 0.05 : 0.15)) lag(j, ASKE); else { sett(j, ILD); L[j] = 30 + ((rnd() * 30) | 0); }
          break;
      }
    }
    function eksploder(cx, cy, r) {
      oppdag("eksplosjon");
      lyd("smell");
      v.rystelse = Math.max(v.rystelse, 6);
      const r2 = r * r, indre = r2 * 0.4;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= B || y >= H) continue;
        const i = y * B + x, t = T[i];
        if (t === KRUTT) { sett(i, TENT); continue; }
        if (t === TENT) continue;
        if (STYRKE[t] > 0 && rnd() < STYRKE[t]) continue;
        if (t === TOM) { if (d2 < indre || rnd() < 0.4) { sett(i, ILD); L[i] = 8 + ((rnd() * 14) | 0); } continue; }
        if (d2 < indre) { sett(i, ILD); L[i] = 10 + ((rnd() * 16) | 0); continue; }
        if (FASE[t] === FAST) { if (t === STEIN || t === TEGL || t === GLASS) sett(i, rnd() < 0.5 ? SAND : TOM); else if (rnd() < 0.5) T[i] = TOM; continue; }
        // Pulver og væske i ytterkanten kastes utover
        const len = Math.sqrt(d2) || 1, kast = 3 + ((rnd() * 7) | 0);
        const tx = Math.round(x + (dx / len) * kast), ty = Math.round(y + (dy / len) * kast - 2);
        if (tx >= 0 && ty >= 0 && tx < B && ty < H && T[ty * B + tx] === TOM) bytt(i, ty * B + tx);
      }
      for (const m of folk) { const ax = m.x - cx, ay = m.y - 2 - cy; if (ax * ax + ay * ay < r2 * 2.5) m.dod = true; }
    }

    // ---------- Lyn og strøm ----------
    function lad(i) {
      if (LEDER[T[i]] && L[i] === 0) { L[i] = LADET; hoder.push(i); oppdag("strom"); }
    }
    function stromSteg() {
      if (!hoder.length) return;
      const gamle = hoder;
      hoder = [];
      for (const i of gamle) {
        if (!LEDER[T[i]] || L[i] !== LADET) continue;
        const x = i % B, y = (i / B) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= B || ny >= H) continue;
          const j = ny * B + nx, b = T[j];
          if (LEDER[b]) { if (L[j] === 0) { L[j] = LADET; hoder.push(j); } }
          else if (b === KRUTT) sett(j, TENT);
          else if (BRENN[b] > 0) { if (rnd() < 0.5) tenn(j); }
          else if ((b === VANN || b === SALTVANN) && rnd() < 0.12) lag(j, GASS);
        }
        L[i] = LADET - 1;
      }
    }
    function klatt(cx, cy, r, fra, til) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + 1) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= B || y >= H) continue;
        const i = y * B + x;
        if (T[i] === fra) lag(i, til);
      }
    }
    function treff(i, x, y) {
      const t = T[i];
      if (LEDER[t]) { lad(i); return; }
      switch (t) {
        case SAND: klatt(x, y, 2, SAND, GLASS); break;
        case STEIN: klatt(x, y, 2, STEIN, LAVA); break;
        case VANN: klatt(x, y, 2, VANN, DAMP); break;
        case SALTVANN: {
          klatt(x, y, 3, SALTVANN, DAMP);
          // Ursuppa: en gnist i havet gir liv
          for (let k = 0, n = 0; k < 40 && n < 3; k++) {
            const xx = x + ((rnd() * 15) | 0) - 7, yy = y + ((rnd() * 9) | 0);
            if (xx >= 0 && xx < B && yy >= 0 && yy < H && T[yy * B + xx] === SALTVANN) { lag(yy * B + xx, FISK); n++; }
          }
          break;
        }
        case VIN: klatt(x, y, 2, VIN, SPRIT); break;
        case IS: klatt(x, y, 2, IS, VANN); break;
        case SNO: klatt(x, y, 2, SNO, VANN); break;
        case KRUTT: sett(i, TENT); break;
        case GJORME: {
          // Prometevs: nok leire og en gnist gir et menneske
          const celler = [];
          for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < B && yy < H && T[yy * B + xx] === GJORME) celler.push(yy * B + xx);
          }
          if (celler.length >= 10 && folk.length < MAKS_FOLK) {
            for (let k = 0; k < 10; k++) T[celler[k]] = TOM;
            let fy = y;
            while (fy > HOYDE && sperrer(T[fy * B + x])) fy--;
            folk.push(nyttMenneske(x, fy));
            oppdag("menneske");
            lyd("liv");
          }
          break;
        }
        default:
          if (BRENN[t] > 0) { tenn(i); for (let r = 0; r < 4; r++) { const j = nabo(i, x, y, r); if (j >= 0 && BRENN[T[j]] > 0) tenn(j); } }
          else if (y > 0 && T[i - B] === TOM) sett(i - B, ILD);
      }
    }
    function lyn(x, y) {
      x = Math.max(0, Math.min(B - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0));
      v.blink = 4;
      lyd("lyn");
      for (let n = 0; n < 400 && y < H; n++) {
        const i = y * B + x, t = T[i];
        if (t !== TOM && FASE[t] !== GASS_F) { treff(i, x, y); return; }
        if (t === GASS) { sett(i, ILD); L[i] = 12; } else if (t !== ILD) sett(i, LYNSPOR);
        y++;
        x = Math.max(0, Math.min(B - 1, x + ((rnd() * 3) | 0) - 1));
      }
    }

    // ---------- Bevegelse ----------
    function kanSynke(tt, b) {
      if (b === TOM) return true;
      const f = FASE[b];
      if (f === GASS_F) return true;
      return f === VASKE && TETT[b] < tt && rnd() < 0.6;
    }
    const sperrer = (b) => FASE[b] === FAST || FASE[b] === PULVER;
    function pulver(i, x, y, t) {
      if (y === H - 1 || (TREG[t] && rnd() < TREG[t])) return;
      const ned = i + B, tt = TETT[t];
      if (kanSynke(tt, T[ned])) { bytt(i, ned); return; }
      const d = rnd() < 0.5 ? -1 : 1;
      for (let k = 0; k < 2; k++) {
        const s = k ? -d : d, nx = x + s;
        if (nx < 0 || nx >= B) continue;
        if (!sperrer(T[i + s]) && kanSynke(tt, T[ned + s])) { bytt(i, ned + s); return; }
      }
    }
    function vaske(i, x, y, t) {
      if (TREG[t] && rnd() < TREG[t]) return;
      const tt = TETT[t];
      const d = rnd() < 0.5 ? -1 : 1;
      if (y < H - 1) {
        const ned = i + B;
        if (kanSynke(tt, T[ned])) { bytt(i, ned); return; }
        for (let k = 0; k < 2; k++) {
          const s = k ? -d : d, nx = x + s;
          if (nx < 0 || nx >= B) continue;
          if (!sperrer(T[i + s]) && kanSynke(tt, T[ned + s])) { bytt(i, ned + s); return; }
        }
      }
      // Renner sidelengs så langt det er fritt, og stopper der det kan falle videre
      for (let k = 0; k < 2; k++) {
        const s = k ? -d : d;
        let til = -1;
        for (let n = 1; n <= FLYT[t]; n++) {
          const nx = x + s * n;
          if (nx < 0 || nx >= B) break;
          const j = i + s * n, b = T[j];
          if (b !== TOM && FASE[b] !== GASS_F) {
            // En tyngre væske presser seg inn under en lettere, så de legger seg lagvis
            if (n === 1 && FASE[b] === VASKE && TETT[b] < tt && rnd() < 0.5) til = j;
            break;
          }
          til = j;
          if (y < H - 1 && T[j + B] === TOM) break;
        }
        if (til >= 0) { bytt(i, til); return; }
      }
    }
    function gass(i, x, y, t) {
      if (TREG[t] && rnd() < TREG[t]) return;
      const r = rnd();
      let dx = 0, dy = -1;
      if (r < 0.2) dx = -1; else if (r < 0.4) dx = 1; else if (r > 0.9) { dy = 0; dx = r < 0.95 ? -1 : 1; }
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < B && ny >= 0) {
        const j = ny * B + nx, b = T[j];
        if (b === TOM) { bytt(i, j); return; }
        if (dy < 0 && dx === 0 && FASE[b] === VASKE && rnd() < 0.5) { bytt(i, j); return; }   // bobler opp
        if (FASE[b] === GASS_F && TETT[b] > TETT[t] && rnd() < 0.3) { bytt(i, j); return; }
      }
      const s = rnd() < 0.5 ? -1 : 1;
      if (x + s >= 0 && x + s < B && T[i + s] === TOM) bytt(i, i + s);
    }

    // ---------- Trær som vokser ----------
    // Spissen på et ungt tre har et budsjett (de laveste åtte bitene i L) og en retning (resten):
    // 0 er stammen, 1 en gren mot venstre, 2 en gren mot høyre. Når budsjettet er brukt opp, får toppen løv.
    function voksTre(i, x, y) {
      const budsjett = L[i] & 255, ret = L[i] >> 8, r = rnd();
      let dx = 0, dy = -1;
      if (ret === 0) { if (r < 0.1) dx = -1; else if (r < 0.2) dx = 1; }
      else { dx = ret === 1 ? -1 : 1; if (r < 0.4) dy = 0; else if (r < 0.55) dx = 0; }
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= B || ny < 0) { L[i] = FERDIG; return; }
      const j = ny * B + nx, t = T[j];
      if (t !== TOM && t !== PLANTE && t !== GRESS && FASE[t] !== GASS_F) { if (rnd() < 0.05) L[i] = FERDIG; return; }
      sett(j, TRE);
      X[j] = Math.max(1, X[i] - 1);
      L[j] = budsjett > 1 ? (ret << 8) | (budsjett - 1) : FERDIG;
      L[i] = FERDIG;
      // Den nedre delen av stammen blir to celler tykk
      if (ret === 0 && dx === 0 && budsjett > 20 && x + 1 < B && (T[i + 1] === TOM || T[i + 1] === GRESS)) { sett(i + 1, TRE); X[i + 1] = X[i]; L[i + 1] = FERDIG; }
      // Grener i den øvre delen
      if (ret === 0 && budsjett >= 4 && budsjett <= 20 && rnd() < 0.3) L[i] = ((rnd() < 0.5 ? 1 : 2) << 8) | (3 + (budsjett >> 1));
    }

    // ---------- Én celle ----------
    function oppdater(i, x, y, t) {
      // Reaksjon med en tilfeldig nabo
      const j = nabo(i, x, y, (rnd() * 4) | 0);
      const b = j >= 0 ? T[j] : TOM;
      if (b !== TOM) {
        const r = REGLER[t * NT + b];
        if (r !== undefined && rnd() < r.p) {
          if (r.a >= 0) lag(i, r.a);
          if (r.b >= 0) lag(j, r.b);
          if (r.fen) oppdag(r.fen);
          if (r.a >= 0) return;
        }
      }
      switch (t) {
        case ILD: {
          for (let r = 0; r < 4; r++) { const n = nabo(i, x, y, r); if (n >= 0) { const nt = T[n]; if (BRENN[nt] > 0 && rnd() < BRENN[nt]) { tenn(n); if (X[i] && T[n] === ILD) X[n] = X[n] || X[i]; } } }
          if (L[i] <= 1) { if (rnd() < 0.3) lag(i, ROYK); else T[i] = TOM; return; }
          L[i]--;
          gass(i, x, y, t);
          return;
        }
        case GLO: {
          for (let r = 0; r < 4; r++) {
            const n = nabo(i, x, y, r);
            if (n < 0) continue;
            const nt = T[n];
            if (nt === TOM) { if (rnd() < 0.1) { sett(n, ILD); L[n] = 10 + ((rnd() * 16) | 0); } }
            else if (BRENN[nt] > 0 && rnd() < (nt === TRE || nt === KULL ? GLODSPREDNING : BRENN[nt] * 0.6)) tenn(n);
          }
          if (L[i] <= 1) { const aske = rnd() < (X[i] ? 0.3 : 0.6); lag(i, aske ? ASKE : ROYK); return; }
          L[i]--;
          return;
        }
        case TENT:
          if (L[i] <= 1) { T[i] = TOM; eksploder(x, y, 5); } else L[i]--;
          return;
        case LYNSPOR:
          if (L[i] <= 1) T[i] = TOM; else L[i]--;
          return;
        case DAMP:
          if (L[i] <= 1) { lag(i, VANN); oppdag("regn"); return; }
          L[i]--;
          break;
        case ROYK:
          if (L[i] <= 1) { T[i] = TOM; return; }
          L[i]--;
          break;
        case LAVA:
          if (b !== TOM && b !== KULL && BRENN[b] > 0 && rnd() < Math.max(0.05, BRENN[b])) tenn(j);
          // Lava som ligger åpent, størkner etter hvert, og etterlater av og til svovel
          if (rnd() < 0.0004 && (y === 0 || T[i - B] === TOM || FASE[T[i - B]] === GASS_F)) { lag(i, rnd() < 0.1 ? SVOVEL : STEIN); return; }
          break;
        case KULL: {
          // Kull under press: lava på minst tre sider gir en diamant
          if (b === LAVA) {
            let n = 0;
            for (let r = 0; r < 4; r++) { const k = nabo(i, x, y, r); if (k >= 0 && T[k] === LAVA) n++; }
            if (n >= 3) { if (rnd() < 0.05) { lag(i, DIAMANT); return; } }
            else if (rnd() < 0.03) { tenn(i); return; }
          }
          break;
        }
        case JORD:
          // Fukt trekker inn i jorda fra vann og gjørme, og tørker sakte ut igjen
          if (b === VANN) X[i] = FUKT;
          else if (b === GJORME) { if (X[i] < FUKT - 1) X[i] = FUKT - 1; }
          else if (b === JORD && X[j] > X[i] + 1) X[i] = X[j] - 1;
          else if (X[i] > 0 && rnd() < 0.003) X[i]--;
          // Gress spirer på fuktig jord som ligger i ro med luft over
          if (X[i] > 0 && y > 0 && T[i - B] === TOM && rnd() < 0.002 && (y === H - 1 || sperrer(T[i + B]))) { lag(i - B, GRESS); L[i - B] = (rnd() * 3) | 0; }
          break;
        case GJORME:
          if (y > 0 && T[i - B] === TOM && rnd() < 0.001 && (y === H - 1 || sperrer(T[i + B]))) { lag(i - B, GRESS); L[i - B] = (rnd() * 3) | 0; }
          // Gjørme som ikke lenger står i vann, tørker til fuktig jord
          if (rnd() < 0.0006) {
            let vaat = false;
            for (let r = 0; r < 4 && !vaat; r++) { const k = nabo(i, x, y, r); vaat = k >= 0 && T[k] === VANN; }
            if (!vaat) { lag(i, JORD); X[i] = FUKT; return; }
          }
          break;
        case GRESS: {
          const u = y < H - 1 ? T[i + B] : STEIN;
          if (u !== JORD && u !== GJORME && u !== GRESS) { if (rnd() < 0.1) T[i] = TOM; return; }
          if (b === VANN && rnd() < 0.03) {
            // Gresset drikker vannet og holder jorda under fuktig
            T[j] = TOM;
            for (let k = 1; k <= 4 && y + k < H; k++) if (T[i + k * B] === JORD) { X[i + k * B] = FUKT; break; }
          }
          if (y > 0 && T[i - B] === TOM) {
            if (L[i] > 0 && rnd() < 0.003) { sett(i - B, GRESS); L[i - B] = L[i] - 1; L[i] = 0; }
            else if (rnd() < 0.000004) lag(i - B, BLOMST);   // markblomster
          }
          return;
        }
        case BLOMST:
          // Blomster slipper av og til et frø
          if (b === TOM && rnd() < 0.0002) sett(j, FRO);
          return;
        case STEIN:
          if (b === VANN && rnd() < 0.0002) { lag(i, MOSE); L[i] = 4; }
          return;
        case MOSE:
          // Mosen kryper et lite stykke videre langs stein som ligger åpent
          if (b === STEIN && L[i] > 1 && rnd() < 0.002) {
            const jx = j % B, jy = (j / B) | 0;
            for (let r = 0; r < 4; r++) { const k = nabo(j, jx, jy, r); if (k >= 0 && (T[k] === TOM || T[k] === VANN)) { sett(j, MOSE); L[j] = L[i] - 1; break; } }
          }
          return;
        case TRE: {
          // Tre som står i fuktig jord, lever: saften stiger et stykke oppover i veden
          if (b === GJORME || (b === JORD && X[j] > 0)) X[i] = SAFT;
          else if (b === TRE && X[j] > X[i] + 1) X[i] = X[j] - 1;
          else if (X[i] > 0 && rnd() < 0.004) X[i]--;
          if (X[i] === 0) return;
          if (L[i] & 255) { if (rnd() < 0.05) voksTre(i, x, y); return; }
          // En bar topp skyter først nye skudd, og får så løv
          if (X[i] <= SAFT - 6 && y > 0 && T[i - B] === TOM && rnd() < 0.01 && (x === 0 || T[i - B - 1] !== TRE) && (x === B - 1 || T[i - B + 1] !== TRE)) {
            if (L[i] & FERDIG) { sett(i - B, PLANTE); L[i - B] = 6; }
            else L[i] = 10 + ((rnd() * 9) | 0);
            oppdag("lovverk");
          }
          return;
        }
        case FISK: {
          // Svømmer rett fram til noe stenger, og snur da en annen vei. På land spreller den en stund.
          // Fisk beiter på planter under vann, og da blir det av og til flere av dem
          if (b === PLANTE && rnd() < 0.02) lag(j, rnd() < 0.25 ? FISK : VANN);
          const n = nabo(i, x, y, X[i] & 3), nt = n >= 0 ? T[n] : STEIN;
          if (nt === VANN || nt === SALTVANN) { L[i] = 0; if (rnd() < 0.45) bytt(i, n); else if (rnd() < 0.03) X[i] = rnd() < 0.75 ? (rnd() < 0.5 ? 1 : 3) : (rnd() < 0.5 ? 0 : 2); return; }
          X[i] = rnd() < 0.75 ? (rnd() < 0.5 ? 1 : 3) : (rnd() < 0.5 ? 0 : 2);
          let vann = false;
          for (let r = 0; r < 4 && !vann; r++) { const k = nabo(i, x, y, r); vann = k >= 0 && (T[k] === VANN || T[k] === SALTVANN); }
          if (vann) return;
          if (++L[i] > 300) { T[i] = TOM; return; }
          break;
        }
        case VANN:
          // Planter drikker vannet og vokser inn i det. Av og til blir det en blomst eller en drue.
          if (b === PLANTE && rnd() < 0.05) {
            const r = rnd();
            const over = y > 0 ? T[i - B] : STEIN;
            lag(i, r < 0.05 && over !== PLANTE ? BLOMST : r < 0.11 ? DRUE : PLANTE);
            return;
          }
          break;
        case PLANTE:
          // Spiren fra et frø vokser oppover et stykke
          if (X[i] > 0 && rnd() < 0.08) {
            const s = rnd() < 0.7 ? 0 : rnd() < 0.5 ? -1 : 1;
            if (y > 0 && x + s >= 0 && x + s < B && T[i - B + s] === TOM) {
              const n = i - B + s, igjen = X[i] - 1;
              if (igjen === 0 && rnd() < 0.6) lag(n, BLOMST); else { lag(n, PLANTE); X[n] = igjen; }
            }
            X[i] = 0;
          }
          // Løv brer seg ut fra toppen av et levende tre, og bærer av og til oliven
          if (L[i] > 0) {
            if (b === TOM) {
              if (L[i] > 1 && rnd() < 0.03) { sett(j, PLANTE); L[j] = L[i] - 1; }
              else if (j === i + B && rnd() < 0.00025) lag(j, OLIVEN);
            }
          }
          return;
        case FRO:
          if (y < H - 1) {
            const u = T[i + B];
            let fuktig = u === GJORME || u === GRESS || (u === JORD && X[i + B] > 0);
            if (u === JORD) for (let r = 0; r < 4 && !fuktig; r++) { const k = nabo(i, x, y, r), k2 = nabo(i + B, x, y + 1, r); fuktig = (k >= 0 && T[k] === VANN) || (k2 >= 0 && (T[k2] === VANN || T[k2] === GJORME)); }
            // Frø som flyter på vann, råtner. Og ingenting spirer tett inntil en annen plante.
            if ((u === VANN || u === SALTVANN) && rnd() < 0.002) { T[i] = TOM; return; }
            if (fuktig) for (let d = -2; d <= 2 && fuktig; d++) if (d && x + d >= 0 && x + d < B && (T[i + d] === PLANTE || T[i + d] === TRE)) fuktig = false;
            if (fuktig && rnd() < 0.05) {
              if (u !== GRESS && rnd() < 0.3) { sett(i, TRE); X[i] = SAFT; L[i] = 26 + ((rnd() * 25) | 0); }   // et frø kan også bli et tre
              else { lag(i, PLANTE); X[i] = 6 + ((rnd() * 10) | 0); }
              return;
            }
          }
          break;
        case SYRE:
          if (b !== TOM && SYREP[b] > 0 && rnd() < SYREP[b]) {
            if ((b === METALL || b === RUST) && rnd() < 0.7) lag(j, GASS); else T[j] = TOM;
            if (rnd() < 0.5) { if (rnd() < 0.2) lag(i, ROYK); else T[i] = TOM; return; }
          }
          break;
        case GRESK:
          if (X[i]) {
            // Brenner lenge, også under vann, og koker vannet rundt seg
            for (let r = 0; r < 4; r++) {
              const n = nabo(i, x, y, r);
              if (n < 0) continue;
              const nt = T[n];
              if (nt === TOM) { if (rnd() < 0.15) { sett(n, ILD); L[n] = 12 + ((rnd() * 16) | 0); X[n] = 2; } }
              else if (nt === VANN || nt === SALTVANN) { if (rnd() < 0.04) lag(n, DAMP); }
              else if (BRENN[nt] > 0 && rnd() < BRENN[nt]) tenn(n);
            }
            if (L[i] <= 1) { lag(i, ROYK); return; }
            L[i]--;
          }
          break;
        case METALL: case GULL:
          if (L[i] > 0 && L[i] < LADET) L[i]--;
          return;
        case KILDE:
          if (j >= 0) {
            if (X[i] === 0) { if (KLONBAR[b]) X[i] = b; }
            else if (b === TOM && rnd() < 0.5) { sett(j, X[i]); }
          }
          return;
        case SLUK:
          if (b !== TOM && FASE[b] !== FAST) T[j] = TOM;
          return;
      }
      const f = FASE[t];
      if (f === PULVER) pulver(i, x, y, t);
      else if (f === VASKE) vaske(i, x, y, t);
      else if (f === GASS_F) gass(i, x, y, t);
    }

    // ---------- Mennesker ----------
    // Små figurer som går rundt på brettet. De klatrer over små hindre, flyter i vann,
    // tåler ikke ild, lava eller syre, og blir fulle av vin. Høyst tretten om gangen.
    const MAKS_FOLK = 13, HOYDE = 5;
    function nyttMenneske(x, y) { return { x: x | 0, y: y | 0, dir: rnd() < 0.5 ? -1 : 1, full: 0, kvalt: 0, alder: 0, dod: false }; }
    const tett = (t) => sperrer(t) && t !== GRESS && t !== BLOMST;   // gress og blomster går de rett gjennom
    const baerer = (x, y) => y >= H || (x >= 0 && x < B && y >= 0 && tett(T[y * B + x]));
    function friKolonne(x, y) {   // kan kroppen stå med føttene i (x, y)?
      if (x < 0 || x >= B || y >= H) return false;
      for (let k = 0; k < HOYDE; k++) { const yy = y - k; if (yy >= 0 && tett(T[yy * B + x])) return false; }
      return true;
    }
    function folkSteg() {
      for (let n = folk.length - 1; n >= 0; n--) {
        const m = folk[n];
        m.alder++;
        let borte = false, gull = false;
        for (let k = 0; k < HOYDE && !m.dod; k++) for (let dx = -1; dx <= 1; dx++) {
          const xx = m.x + dx, yy = m.y - k;
          if (xx < 0 || xx >= B || yy < 0 || yy >= H) continue;
          const i = yy * B + xx, t = T[i];
          if (t === TOM) continue;
          if (dx === 0 && (FARLIG[t] || (t === GRESK && X[i]))) { if (m.alder > 20 || t !== LYNSPOR) m.dod = true; }
          else if (t === VIN) { T[i] = TOM; m.full = Math.min(1800, m.full + 400); oppdag("rus"); lyd("hikk"); }
          else if (t === MIDAS) { T[i] = TOM; gull = true; }
          else if (t === SLUK) borte = true;
        }
        if (gull) {
          // Kong Midas' datter: mennesket blir stående igjen som en statue av gull
          for (const [dx, dy] of FIGUR) {
            const xx = m.x + dx, yy = m.y - dy;
            if (xx >= 0 && xx < B && yy >= 0 && yy < H && !sperrer(T[yy * B + xx])) sett(yy * B + xx, GULL);
          }
          if (ukjent[GULL]) { ukjent[GULL] = 0; oppdag("gull"); }
          oppdag("gullstatue");
          folk.splice(n, 1);
          continue;
        }
        if (m.y >= 4 && tett(T[(m.y - 4) * B + m.x]) && tett(T[(m.y - 2) * B + m.x])) { if (++m.kvalt > 90) borte = true; } else m.kvalt = 0;
        if (m.dod) {
          const i = m.y * B + m.x;
          if (m.y < H && T[i] === TOM) lag(i, ASKE);
          if (m.y >= 3 && T[i - 3 * B] === TOM) sett(i - 3 * B, ROYK);
          lyd("dod");
          borte = true;
        }
        if (borte) { folk.splice(n, 1); continue; }
        // Oliven under føttene tråkkes til olje
        if (m.y + 1 < H && T[(m.y + 1) * B + m.x] === OLIVEN && rnd() < 0.15) { lag((m.y + 1) * B + m.x, OLJE); oppdag("pressing"); }
        // Tyngdekraft og flyting
        const fot = T[m.y * B + m.x], iVann = FASE[fot] === VASKE;
        if (!baerer(m.x, m.y + 1)) {
          if (!iVann) m.y++;
          else if (m.y >= 2 && FASE[T[(m.y - 2) * B + m.x]] === VASKE) { if ((m.alder & 1) === 0 && m.y > HOYDE && friKolonne(m.x, m.y - 1)) m.y--; }
        } else if (iVann && m.y >= 2 && FASE[T[(m.y - 2) * B + m.x]] === VASKE && (m.alder & 1) === 0 && m.y > HOYDE && friKolonne(m.x, m.y - 1)) m.y--;
        // Gange
        if (m.full > 0) { m.full--; if (rnd() < 0.04) m.dir = -m.dir; }
        else if (rnd() < 0.004) m.dir = -m.dir;
        const takt = iVann ? 8 : m.full > 0 ? 3 : 5;
        if (m.alder % takt === 0) {
          const nx = m.x + m.dir;
          if (nx < 0 || nx >= B) m.dir = -m.dir;
          else if (friKolonne(nx, m.y)) m.x = nx;
          else if (friKolonne(nx, m.y - 1) && friKolonne(m.x, m.y - 1)) { m.x = nx; m.y--; }
          else if (friKolonne(nx, m.y - 2) && friKolonne(m.x, m.y - 2)) { m.x = nx; m.y -= 2; }
          else m.dir = -m.dir;
        }
      }
    }
    // Figuren: [dx, dy over føttene, del]. del: 0 hud, 1 toga, 2 bein
    const FIGUR = [[0, 4, 0], [-1, 3, 1], [0, 3, 1], [1, 3, 1], [0, 2, 1], [0, 1, 1], [-1, 0, 2], [1, 0, 2]];

    // ---------- Ett steg ----------
    function steg() {
      tikk++;
      st = (tikk % 250) + 1;
      stromSteg();
      const fraVenstre = (tikk & 1) === 0;
      for (let y = H - 1; y >= 0; y--) {
        const rad = y * B;
        for (let k = 0; k < B; k++) {
          const x = fraVenstre ? k : B - 1 - k, i = rad + x, t = T[i];
          if (t === TOM || S[i] === st) continue;
          oppdater(i, x, y, t);
        }
      }
      if (folk.length) folkSteg();
      if (v.blink > 0) v.blink--;
      if (v.rystelse > 0) v.rystelse--;
    }

    // ---------- Tegning ----------
    // p er bildet (200 × 150), g er gløden som legges oppå. Begge som 32-bits ABGR.
    function tegn(p, g) {
      for (let i = 0; i < N; i++) {
        const t = T[i];
        if (t === TOM) { p[i] = 0; g[i] = 0; continue; }
        let c = PAL[t * 16 + (D[i] >> 4)], gl = 0;
        switch (t) {
          case ILD: { const k = Math.min(31, L[i]); c = FLAMME[X[i]][k]; gl = c; break; }
          case LAVA: { const k = ((D[i] + (tikk >> 2)) & 31); const f = k < 16 ? k : 31 - k; c = abgr(255, 70 + f * 8, 10 + f * 2); gl = c; break; }
          case GLO: { const f = (D[i] + tikk * 3) & 63; c = abgr(190 + (f & 31), 50 + (f >> 1), 10); gl = c; break; }
          case LYNSPOR: case TENT: c = 0xffffffff; gl = abgr(200, 220, 255); break;
          case VANN: case SALTVANN: if (((D[i] + (tikk >> 3) + i) & 31) === 0) c = PAL[t * 16 + 15]; break;
          case METALL: case GULL:
            if (L[i] > 0) { const f = L[i] / LADET; c = abgr(klem(150 + 105 * f), klem(170 + 85 * f), 255); gl = abgr(klem(90 * f), klem(170 * f), klem(255 * f)); }
            else if (t === GULL && ((D[i] + tikk) & 127) === 0) c = 0xffffffff;
            break;
          case DIAMANT: case MIDAS: if (((D[i] + tikk * 2) & 63) === 0) c = 0xffffffff; break;
          case BLOMST: c = BLOMSTER[D[i] % BLOMSTER.length]; break;
          case JORD: if (X[i] > 0) c = VAATJORD[D[i] >> 4]; break;
          case PLANTE: if (L[i] > 0) c = PAL[t * 16 + (D[i] >> 5)]; break;   // løv er litt mørkere
          case FISK: if (((D[i] + (tikk >> 2)) & 15) === 0) c = abgr(255, 214, 150); break;
          case TEGL: { const x = i % B, y = (i / B) | 0; if (y % 4 === 3 || (x + ((y >> 2) & 1) * 3) % 6 === 5) c = PAL[t * 16]; break; }
          case TRE: { const x = i % B; c = PAL[t * 16 + ((x * 5 + (D[i] >> 6)) & 15)]; break; }
          case SYRE: gl = abgr(40, 70, 10); break;
          case GRESK: if (X[i]) { c = abgr(120, 255, 150); gl = c; } break;
          case KILDE: { const s = X[i] ? EL[X[i]].farge : [200, 160, 255]; const f = 0.6 + 0.4 * Math.sin(tikk * 0.15 + i); c = abgr(klem(s[0] * f + 60), klem(s[1] * f + 40), klem(s[2] * f + 80)); gl = abgr(60, 40, 90); break; }
          case SLUK: { const f = (tikk * 4 + i * 7) & 63; c = abgr(20 + (f >> 2), 8, 36 + (f >> 1)); break; }
        }
        p[i] = c; g[i] = gl;
      }
      for (const m of folk) {
        const steg2 = ((m.x + (m.alder >> 3)) & 1) === 0;
        for (const [dx, dy, del] of FIGUR) {
          let xx = m.x + dx;
          if (del === 2 && steg2) xx = m.x + (dx < 0 ? 0 : dx);
          const yy = m.y - dy;
          if (xx < 0 || xx >= B || yy < 0 || yy >= H) continue;
          p[yy * B + xx] = del === 0 ? (m.full > 0 ? abgr(236, 120, 104) : abgr(226, 176, 134)) : del === 1 ? abgr(236, 228, 210) : abgr(150, 112, 84);
        }
      }
    }

    // ---------- Maling ----------
    // Maler en rund flekk. Gir tilbake hvor mange celler som ble lagt (eller visket).
    function mal(cx, cy, r, t, valg = {}) {
      const tetthet = valg.tetthet === undefined ? 1 : valg.tetthet, maks = valg.maks === undefined ? Infinity : valg.maks;
      let n = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + (r > 1 ? r * 0.8 : 0)) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= B || y >= H) continue;
        const i = y * B + x;
        if (t === TOM) { if (T[i] !== TOM) { sett(i, TOM); n++; } continue; }
        if (T[i] !== TOM && !valg.erstatt) continue;
        if (n >= maks) return n;
        if (tetthet < 1 && rnd() > tetthet) continue;
        sett(i, t);
        n++;
      }
      if (t === TOM) for (let k = folk.length - 1; k >= 0; k--) { const m = folk[k]; if (Math.abs(m.x - cx) <= r + 1 && Math.abs(m.y - 2 - cy) <= r + 2) folk.splice(k, 1); }
      return n;
    }
    function vind(cx, cy, r, dx, dy) {
      const sx = Math.sign(dx), sy = Math.sign(dy);
      if (!sx && !sy) return;
      for (let a = -r; a <= r; a++) for (let b2 = -r; b2 <= r; b2++) {
        // Går mot vindretningen, så cellene foran flyttes først
        const ox = sx > 0 ? -a : a, oy = sy > 0 ? -b2 : b2;
        if (ox * ox + oy * oy > r * r) continue;
        const x = cx + ox, y = cy + oy, nx = x + sx, ny = y + sy;
        if (x < 0 || y < 0 || x >= B || y >= H || nx < 0 || ny < 0 || nx >= B || ny >= H) continue;
        const i = y * B + x, t = T[i];
        if (t === TOM || FASE[t] === FAST) continue;
        if (T[ny * B + nx] === TOM && rnd() < 0.8) bytt(i, ny * B + nx);
      }
      for (const m of folk) if (Math.abs(m.x - cx) <= r && Math.abs(m.y - 2 - cy) <= r + 2) { const nx = m.x + sx, ny = m.y + (sy < 0 ? -1 : 0); if (friKolonne(nx, ny)) { m.x = nx; m.y = ny; } }
    }
    function menneske(x, y) {
      if (folk.length >= MAKS_FOLK) return false;
      x = Math.max(0, Math.min(B - 1, x | 0)); y = Math.max(HOYDE, Math.min(H - 1, y | 0));
      if (!friKolonne(x, y)) return false;
      folk.push(nyttMenneske(x, y));
      return true;
    }

    // ---------- Lagring ----------
    function tom() { T.fill(0); D.fill(0); X.fill(0); L.fill(0); S.fill(0); folk.length = 0; hoder = []; }
    function kod() {
      const ut = [];
      let i = 0;
      while (i < N) {
        let t = T[i];
        if (t === LYNSPOR || t === TENT) t = TOM;
        let n = 1;
        while (i + n < N && n < 255) { let u = T[i + n]; if (u === LYNSPOR || u === TENT) u = TOM; if (u !== t) break; n++; }
        ut.push(n, t);
        i += n;
      }
      const k = [];
      for (i = 0; i < N; i++) if (T[i] === KILDE && X[i]) k.push(i, X[i]);
      return JSON.stringify({ v: 1, t: b64(Uint8Array.from(ut)), k, f: folk.map((m) => [m.x, m.y, m.dir]) });
    }
    function les(tekst) {
      let o;
      try { o = typeof tekst === "string" ? JSON.parse(tekst) : tekst; } catch (_) { return false; }
      if (!o || o.v !== 1 || typeof o.t !== "string") return false;
      let rle;
      try { rle = fraB64(o.t); } catch (_) { return false; }
      let sum = 0;
      for (let k = 0; k < rle.length; k += 2) sum += rle[k];
      if (sum !== N) return false;
      tom();
      let i = 0;
      for (let k = 0; k < rle.length; k += 2) {
        const n = rle[k], t = rle[k + 1] < NT ? rle[k + 1] : TOM;
        for (let m = 0; m < n; m++, i++) if (t !== TOM) { T[i] = t; D[i] = (rnd() * 256) | 0; L[i] = liv(t); }
      }
      if (Array.isArray(o.k)) for (let k = 0; k + 1 < o.k.length; k += 2) { const idx = o.k[k] | 0, t = o.k[k + 1] | 0; if (idx >= 0 && idx < N && T[idx] === KILDE && KLONBAR[t]) X[idx] = t; }
      if (Array.isArray(o.f)) for (const f of o.f.slice(0, MAKS_FOLK)) if (Array.isArray(f)) { const m = nyttMenneske(Math.max(0, Math.min(B - 1, f[0] | 0)), Math.max(0, Math.min(H - 1, f[1] | 0))); m.dir = f[2] < 0 ? -1 : 1; folk.push(m); }
      return true;
    }
    function tell(t) { let n = 0; for (let i = 0; i < N; i++) if (T[i] === t) n++; return n; }
    function tellOmraade(t, x0, y0, x1, y1) { let n = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (T[y * B + x] === t) n++; return n; }
    // Hvilke oppdagelser som alt er gjort (så de ikke meldes på nytt)
    function settKjent(nokler) {
      const kjent = new Set(nokler);
      for (const f of FUNN) if (!f.fenomen && E[f.nokkel.toUpperCase()] !== undefined) ukjent[E[f.nokkel.toUpperCase()]] = kjent.has(f.nokkel) ? 0 : 1;
    }
    // Til bygging av brett: fyller et rektangel, uansett hva som lå der
    function fyll(x0, y0, x1, y1, t) {
      for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(B - 1, x1); x++) sett(y * B + x, t);
    }
    function settKilde(x, y, t) { const i = y * B + x; sett(i, KILDE); X[i] = t; }

    Object.assign(v, { steg, tegn, mal, vind, lyn, menneske, tom, kod, les, tell, tellOmraade, settKjent, fyll, settKilde, sett: (x, y, t) => sett(y * B + x, t), hent: (x, y) => T[y * B + x], tikk: () => tikk, eksploder });
    return v;
  }

  // ---------- Dagens oppdrag ----------
  // Fem maler på rundgang. Brettet lages av datoen, så alle får det samme.
  // Hvert oppdrag har: bygg (legger ut brettet), tillatt (stoffer og hvor mange korn man har),
  // maal (hvor langt man er kommet), tid (antall steg) og par (grensene for tre og to stjerner).
  const dagNummer = (dag) => Math.round(Date.parse(dag + "T00:00:00Z") / 86400000);
  const hel = (r, a, b) => a + Math.floor(r() * (b - a + 1));

  function flaaten(r) {
    const hav = 122, n = hel(r, 4, 5);
    const skip = [], gap = [];
    for (let k = 0; k < n; k++) { skip.push({ b: hel(r, n === 4 ? 20 : 17, n === 4 ? 26 : 21), mast: hel(r, 14, 21) }); if (k) gap.push(hel(r, n === 4 ? 12 : 10, n === 4 ? 26 : 20)); }
    let x = Math.floor((B - skip.reduce((s, k) => s + k.b, 0) - gap.reduce((s, g) => s + g, 0)) / 2);
    skip.forEach((s, k) => { s.x = x; x += s.b + (gap[k] || 0); });
    // Med to gnister kan man hoppe over den bredeste åpningen
    const sum = gap.reduce((s, g) => s + g, 0) - Math.max(...gap);
    let start = 0;
    return {
      mal: "flaaten", navn: "Brenn flåten",
      ingress: "Perserflåten ligger for anker. Du har to gnister. Få fyr på alle skipene.",
      hjelp: "Olje flyter på vann og brenner godt. Legg en lunte fra skip til skip.",
      tillatt: [["olje", 260], ["ild", 2]], tid: 2400, par: [Math.round(sum * 1.25) + 2, Math.round(sum * 2.6) + 2],
      info: { skip, gap, hav },
      bygg(v) {
        v.fyll(0, 142, B - 1, H - 1, SAND);
        v.fyll(0, hav, B - 1, 141, VANN);
        for (const s of skip) {
          for (let k = 0; k < 8; k++) { const inn = Math.round(k * 0.7); v.fyll(s.x + inn, hav - 7 + k, s.x + s.b - 1 - inn, hav - 7 + k, TRE); }
          const m = s.x + (s.b >> 1);
          v.fyll(m, hav - 8 - s.mast, m + 1, hav - 8, TRE);
          v.fyll(m - 5, hav - 5 - s.mast, m + 6, hav - 5 - s.mast, TRE);
          v.fyll(m - 4, hav - 4 - s.mast, m + 5, hav - 9 - Math.floor(s.mast / 3), TRE);
        }
        start = v.tell(TRE);
      },
      maal(v) { const andel = 1 - (v.tell(TRE) + v.tell(GLO)) / start; return { andel: Math.min(1, andel / 0.9), klart: andel >= 0.9, tekst: `${Math.round(andel * 100)} % av flåten er brent (mål: 90 %)` }; },
    };
  }

  function akvedukten(r) {
    const y0 = hel(r, 50, 58), y1 = y0 + hel(r, 10, 16), y2 = y1 + hel(r, 10, 16);
    const k1 = hel(r, 40, 46), b1 = hel(r, 30, 44), midt = hel(r, 16, 24), b2 = hel(r, 22, 34);
    const k2 = k1 + b1 + midt, hoyre = k2 + b2;
    const cx0 = B - 34, cx1 = B - 6, cy0 = y2 + 14, cy1 = cy0 + 16;   // cisternen innvendig
    const krav = 180;
    // I hver kløft står en klippe som kan brukes som brokar, og av og til en som ligger for lavt
    function klipper(x0, b, ya, yb) {
      const ut = [], bk = hel(r, 7, Math.min(13, b - 14)), venstre = r() < 0.5;
      const halv = b >> 1;
      const x = venstre ? x0 + hel(r, 5, Math.max(5, halv - bk)) : x0 + halv + hel(r, 0, Math.max(0, halv - bk - 5));
      ut.push({ x, b: bk, y: hel(r, ya + 2, yb - 2), god: true });
      if (r() < 0.6) { const b3 = hel(r, 6, 9), x3 = venstre ? x0 + halv + hel(r, 2, Math.max(2, halv - b3 - 4)) : x0 + hel(r, 4, Math.max(4, halv - b3 - 2)); ut.push({ x: x3, b: b3, y: yb + hel(r, 4, 10), god: false }); }
      return ut;
    }
    const kl1 = klipper(k1, b1, y0, y1), kl2 = klipper(k2, b2, y1, y2);
    const best = b1 + b2 - kl1[0].b - kl2[0].b;
    return {
      mal: "akvedukten", navn: "Akvedukten",
      ingress: "Byen tørster. Kilden ligger i fjellet, og mellom dere er det to kløfter. Før vannet fram til cisternen.",
      hjelp: "Vann renner bare nedover, og fritt fall koster ingenting. Bygg bruer av stein, og bruk klippene som brokar.",
      tillatt: [["stein", 200]], tid: 3000, par: [Math.ceil(best * 1.06) + 2, b1 + b2 + 6],
      info: { y0, y1, y2, k1, b1, k2, b2, hoyre, kl1, kl2, best, cisterne: [cx0, cy0, cx1, cy1] },
      merk: [cx0, cy0, cx1, cy1],
      bygg(v) {
        v.fyll(0, y0, k1 - 1, H - 1, STEIN);
        v.fyll(k1 + b1, y1, k2 - 1, H - 1, STEIN);
        v.fyll(hoyre, y2, B - 1, H - 1, STEIN);
        v.fyll(k1, H - 3, hoyre - 1, H - 1, STEIN);
        for (const k of [...kl1, ...kl2]) { v.fyll(k.x, k.y, k.x + k.b - 1, k.y + 2, STEIN); v.fyll(k.x + 1, k.y + 3, k.x + k.b - 2, k.y + 4, STEIN); }
        // Kilden: en liten brønn øverst til venstre
        v.fyll(2, y0 - 12, 14, y0 - 11, STEIN);
        v.fyll(2, y0 - 10, 3, y0 - 1, STEIN);
        for (let k = 0; k < 3; k++) v.settKilde(6 + k * 2, y0 - 10, VANN);
        // Renne ned til cisternen, og cisternen selv
        v.fyll(hoyre + 6, y2, cx0 - 2, cy0 - 2, TOM);
        v.fyll(cx0, y2, cx1, cy1, TOM);
        v.fyll(cx0 - 6, cy0 - 12, cx0 - 1, cy0 - 3, TOM);
      },
      maal(v) { const n = v.tellOmraade(VANN, cx0, cy0, cx1, cy1); return { andel: Math.min(1, n / krav), klart: n >= krav, tekst: `${n} av ${krav} korn vann i cisternen` }; },
    };
  }

  function zevs(r) {
    const xs = hel(r, 14, 34), tx = hel(r, 150, 180), ty = hel(r, 112, 126);
    let hinder = [], lengde = 0;
    const iSone = (x0, y0, x1, y1, sx0, sy0, sx1, sy1) => x0 <= sx1 && x1 >= sx0 && y0 <= sy1 && y1 >= sy0;
    // Korteste vei gjennom luften fra stanga til lageret (åtte retninger), for å sette par
    function vei() {
      const fast = new Uint8Array(N);
      for (const [x0, y0, x1, y1] of hinder) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fast[y * B + x] = 1;
      for (let y = 136; y < H; y++) for (let x = 0; x < B; x++) fast[y * B + x] = 1;
      for (let y = ty - 1; y <= ty + 8; y++) for (let x = tx - 1; x <= tx + 10; x++) fast[y * B + x] = 1;
      const avst = new Int32Array(N).fill(-1), ko = [34 * B + xs];
      avst[ko[0]] = 1;
      const maalI = (ty - 6) * B + tx + 4;
      for (let h = 0; h < ko.length; h++) {
        const i = ko[h];
        if (i === maalI) return avst[i];
        const x = i % B, y = (i / B) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= B || ny >= H) continue;
          const j = ny * B + nx;
          if (fast[j] || avst[j] >= 0) continue;
          avst[j] = avst[i] + 1;
          ko.push(j);
        }
      }
      return 0;
    }
    for (let forsok = 0; forsok < 40 && !lengde; forsok++) {
      hinder = [];
      const antall = hel(r, 5, 8);
      for (let k = 0; k < 60 && hinder.length < antall; k++) {
        const b = hel(r, 6, 46), h = hel(r, 6, 46), x0 = hel(r, 2, B - 3 - b), y0 = hel(r, 16, 130 - h);
        if (b * h > 1100) continue;
        if (iSone(x0, y0, x0 + b, y0 + h, xs - 9, 0, xs + 9, 42) || iSone(x0, y0, x0 + b, y0 + h, tx - 6, ty - 14, tx + 15, ty + 12)) continue;
        hinder.push([x0, y0, x0 + b, y0 + h]);
      }
      lengde = vei();
    }
    let start = 0;
    return {
      mal: "zevs", navn: "Zevs' vrede",
      ingress: "Zevs slår ned i stanga på fjelltoppen. Led lynet fram til kruttlageret.",
      hjelp: "Strøm går gjennom metall. Tegn en ledning fra stanga til lageret, så kort som mulig. Lynet slår ned like etter start.",
      tillatt: [["metall", 420]], tid: 1100, par: [Math.ceil(lengde * 1.08) + 2, Math.ceil(lengde * 1.6) + 4],
      info: { xs, tx, ty, hinder, lengde },
      bygg(v) {
        v.fyll(0, 136, B - 1, H - 1, STEIN);
        for (const [x0, y0, x1, y1] of hinder) v.fyll(x0, y0, x1, y1, STEIN);
        v.fyll(xs - 5, 8, xs + 5, 8, METALL);
        v.fyll(xs, 9, xs, 33, METALL);
        // Kruttlageret: et steinhus med krutt, og en metallstang opp gjennom taket
        v.fyll(tx - 1, ty - 1, tx + 10, ty + 8, STEIN);
        v.fyll(tx + 1, ty + 1, tx + 8, ty + 6, KRUTT);
        v.fyll(tx + 4, ty - 5, tx + 4, ty, METALL);
        start = v.tell(KRUTT);
      },
      vedSteg(v, t) { if (t === 45 || (t > 45 && (t - 45) % 320 === 0)) v.lyn(xs, 4); },
      maal(v) { const andel = 1 - (v.tell(KRUTT) + v.tell(TENT)) / start; return { andel, klart: andel >= 0.95, tekst: andel > 0 ? "Lageret går i lufta" : "Kruttet ligger urørt" }; },
    };
  }

  function vesuv(r) {
    const topp = hel(r, 44, 52), tx = hel(r, 26, 34), gulv = 128;
    const lavaB = hel(r, 22, 28), lavaH = hel(r, 14, 18);
    const fot = tx + Math.round((gulv - topp) * 0.8);
    const kloft = hel(r, 160, 168);
    const hus = [];
    let x = fot + hel(r, 8, 14);
    while (x + 11 < kloft - 3 && hus.length < 4) { hus.push({ x, b: hel(r, 8, 11), h: hel(r, 6, 9) }); x += hus[hus.length - 1].b + hel(r, 5, 12); }
    let start = 0;
    return {
      mal: "vesuv", navn: "Vesuv våkner",
      ingress: "Lavaen er på vei ned fjellsiden mot byen. Redd husene.",
      hjelp: "Bygg med stein: en mur, en renne eller et tak. Lavaen må et sted. Husene må stå når tiden er ute.",
      tillatt: [["stein", 180]], tid: 1700, par: [26, 60], overlev: 0.75,
      info: { topp, tx, gulv, fot, kloft, hus, lavaB, lavaH },
      bygg(v) {
        v.fyll(0, gulv, kloft - 1, H - 1, STEIN);
        v.fyll(kloft, H - 4, B - 1, H - 1, STEIN);
        v.fyll(kloft, H - 12, B - 1, H - 5, VANN);
        // Fjellet: en kjegle med et lavakammer som åpner seg mot høyre
        for (let y = topp; y < gulv; y++) { const d = y - topp; v.fyll(Math.max(0, tx - 6 - Math.round(d * 0.8)), y, tx + 6 + Math.round(d * 0.8), y, STEIN); }
        const kx = tx - (lavaB >> 1), ky = topp + 6;
        v.fyll(kx, ky, kx + lavaB - 1, ky + lavaH - 1, LAVA);
        v.fyll(kx, topp, kx + lavaB - 1, ky - 1, TOM);
        v.fyll(kx + lavaB, ky + lavaH - 3, kx + lavaB + 40, ky + lavaH - 1, TOM);
        for (const h of hus) {
          v.fyll(h.x, gulv - h.h, h.x + h.b - 1, gulv - 1, TRE);
          v.fyll(h.x + 2, gulv - h.h + 2, h.x + h.b - 3, gulv - 1, TOM);
          v.fyll(h.x + 3, gulv - 3, h.x + h.b - 4, gulv - 1, TRE);
          for (let k = 0; k < 4; k++) v.fyll(h.x - 1 + k, gulv - h.h - 1 - k, h.x + h.b - k, gulv - h.h - 1 - k, TRE);
        }
        start = v.tell(TRE);
      },
      maal(v, t) {
        const andel = (v.tell(TRE)) / start;
        return { andel: Math.min(1, t / this.tid), klart: t >= this.tid && andel >= this.overlev, tapt: andel < this.overlev, tekst: `${Math.round(andel * 100)} % av byen står (må være minst ${Math.round(this.overlev * 100)} % når tiden er ute)` };
      },
    };
  }

  function muren(r) {
    const gulv = 134, x0 = hel(r, 44, 58), taarn = hel(r, 12, 14);
    const romB = hel(r, 6, 9), romH = hel(r, 5, 7), kol = hel(r, 7, 9), rader = hel(r, 4, 5);
    const murB = kol * (romB + 2) + 2, hoyde = rader * (romH + 2) + 2, topp = gulv - hoyde;
    const x1 = Math.min(B - 4, x0 + taarn * 2 + murB), mx = x0 + taarn;
    const rom = [];
    for (let k = 0; k < kol; k++) for (let j = 0; j < rader; j++) { const x = mx + 2 + k * (romB + 2), y = topp + 2 + j * (romH + 2); if (x + romB + 1 < x1 - taarn + 1) rom.push([x, y]); }
    let start = 0;
    return {
      mal: "muren", navn: "Trojas murer",
      ingress: "Ti år har dere ligget utenfor murene. Nå har dere krutt. Riv halve festningen.",
      hjelp: "Krutt virker best innestengt. Legg ladninger i rommene, nær nok hverandre til at smellet går videre, og tenn på.",
      tillatt: [["krutt", 500], ["ild", 2]], tid: 900, par: [Math.round(rom.length * romB * 0.5), Math.round(rom.length * romB * 0.9)], krav: 0.5,
      info: { gulv, x0, x1, topp, taarn, rom, romB, romH },
      bygg(v) {
        v.fyll(0, gulv, B - 1, H - 1, STEIN);
        v.fyll(mx, topp, x1 - taarn - 1, gulv - 1, TEGL);
        for (const [x, y] of rom) v.fyll(x, y, x + romB - 1, y + romH - 1, TOM);
        for (let x = mx; x < x1 - taarn; x += 4) v.fyll(x, topp - 3, x + 1, topp - 1, TEGL);
        // Et tårn i hver ende, hule innvendig
        for (const tx of [x0, x1 - taarn]) {
          v.fyll(tx, topp - 10, tx + taarn - 1, gulv - 1, TEGL);
          v.fyll(tx + 3, topp - 6, tx + taarn - 4, gulv - 4, TOM);
          for (let k = 0; k < taarn; k += 4) v.fyll(tx + k, topp - 13, tx + k + 1, topp - 11, TEGL);
        }
        start = v.tell(TEGL);
      },
      maal(v) { const andel = 1 - v.tell(TEGL) / start; return { andel: Math.min(1, andel / this.krav), klart: andel >= this.krav, tekst: `${Math.round(andel * 100)} % av festningen er revet (mål: ${Math.round(this.krav * 100)} %)` }; },
    };
  }

  const MALER = [flaaten, akvedukten, zevs, vesuv, muren];
  function lagOppdrag(dag) {
    const o = MALER[((dagNummer(dag) % MALER.length) + MALER.length) % MALER.length](prng(hash("kaos" + dag)));
    o.dag = dag;
    return o;
  }
  const stjerner = (o, korn) => (korn <= o.par[0] ? 3 : korn <= o.par[1] ? 2 : 1);

  rot.KAOS = { B, H, EL, E, NT, REDSKAP, GRUPPER, FUNN, LAASER, MALER, lagVerden, lagOppdrag, stjerner, prng, hash, FASE };
})(typeof window !== "undefined" ? window : globalThis);
