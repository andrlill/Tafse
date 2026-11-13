// TAFSE – Drømmepartneren: tegner og editor.
// tegnPartner(oppsett) gir en SVG-streng. byggPartnerEditor(boks, oppsett, vedLagre) lager editoren.

const PARTNER_STANDARD = {
  kjonn: "kvinne",
  hud: "#e6bf98",
  hoyde: 1,
  bygning: 1,
  har: "langt",
  harfarge: "#4a2a17",
  oyne: "#4b6f8f",
  antrekk: "kjole",
  antrekksfarge: "#8c1c2c",
  tilbehor: [],
  bakgrunn: "middag",
  navn: "",
  yrke: "",
  interesser: "",
  kjennetegn: "",
};

const PARTNER_VALG = {
  kjonn: [["kvinne", "Kvinne"], ["mann", "Mann"]],
  har: [["langt", "Langt"], ["pannelugg", "Pannelugg"], ["hestehale", "Hestehale"], ["knute", "Knute"], ["bob", "Page"], ["krøller", "Krøller"], ["kort", "Kort"], ["sidelugg", "Sideskill"], ["skallet", "Skallet"]],
  antrekk: [["kjole", "Kjole"], ["aftenkjole", "Aftenkjole"], ["bunad", "Bunad"], ["dress", "Dress"], ["genser", "Genser og jeans"], ["skjorte", "Skjorte og chinos"], ["trening", "Treningstøy"]],
  tilbehor: [["briller", "Briller"], ["solbriller", "Solbriller"], ["hatt", "Hatt"], ["blomst", "Blomst i håret"], ["oredobber", "Øredobber"], ["perler", "Perlekjede"], ["leppestift", "Leppestift"], ["skjegg", "Skjegg"], ["bart", "Bart"], ["klokke", "Armbåndsur"], ["veske", "Veske"]],
  bakgrunn: [["middag", "Middag"], ["fjellet", "Fjellet"], ["stranden", "Stranden"], ["operaen", "Operaen"], ["akademiet", "Akademiet"]],
};

const PARTNER_PALETT = {
  hud: ["#f6dcc4", "#ecc7a3", "#e0b088", "#c98f62", "#a86b42", "#7c4a2b", "#553220"],
  harfarge: ["#1c1410", "#4a2a17", "#7a4a26", "#b0743c", "#d9b46b", "#efe0b4", "#9b9b9b", "#8f2a1c", "#3d5a8a"],
  oyne: ["#4b6f8f", "#3d7a5a", "#6b4a2e", "#2c2018", "#7d8a96"],
  antrekksfarge: ["#8c1c2c", "#1d2a5a", "#20402e", "#c9a24a", "#111111", "#f2ede2", "#7a3f8f", "#d96b4a", "#3f7fbf"],
};

function partnerOppsett(o) {
  const c = { ...PARTNER_STANDARD, ...(o || {}) };
  if (!Array.isArray(c.tilbehor)) c.tilbehor = [];
  c.hoyde = Math.max(0.88, Math.min(1.08, Number(c.hoyde) || 1));
  c.bygning = Math.max(0.85, Math.min(1.22, Number(c.bygning) || 1));
  return c;
}

// Gjør en farge mørkere (f < 1) eller lysere (f > 1)
function skygge(hex, f) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const k = (v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => k(v).toString(16).padStart(2, "0")).join("");
}

function tegnPartner(oppsett, { bredde = 260 } = {}) {
  const c = partnerOppsett(oppsett);
  const X = 130;
  const har = (t) => c.tilbehor.includes(t);
  const mann = c.kjonn === "mann";
  const b = c.bygning;
  const hud = c.hud, hudM = skygge(hud, 0.86);
  const hf = c.harfarge, hfM = skygge(hf, 0.75);
  const af = c.antrekksfarge, afM = skygge(af, 0.78), afL = skygge(af, 1.18);

  // Mål
  const sw = (mann ? 46 : 38) * b;          // skuldre
  const ww = (mann ? 37 : 27) * b;          // midje
  const hw = (mann ? 38 : 41) * b;          // hofter
  const lw = (mann ? 21 : 19) * Math.pow(b, 0.8); // beinbredde
  const lx = (mann ? 15 : 14) * b;          // avstand mellom bein
  const aw = (mann ? 15 : 12.5) * Math.pow(b, 0.8); // armbredde

  const ut = [];
  const p = (s) => ut.push(s);

  // ---------- Bakgrunn ----------
  const bg = {
    middag: `<rect width="260" height="440" fill="#2a1a14"/><rect y="300" width="260" height="140" fill="#3a2419"/>
      <circle cx="40" cy="90" r="40" fill="#f2b45a" opacity=".12"/><circle cx="225" cy="70" r="30" fill="#f2b45a" opacity=".1"/>
      <rect x="18" y="250" width="6" height="30" fill="#f2ede2" opacity=".7"/><path d="M21 244 q4 -8 0 -14 q-4 6 0 14z" fill="#f5c26b"/>
      <path d="M222 248 l12 0 l-4 16 l-4 0 z M228 264 l0 14 M222 278 l12 0" stroke="#c9a24a" stroke-width="1.5" fill="#6e1424" opacity=".8"/>`,
    fjellet: `<rect width="260" height="440" fill="#b9d3e6"/><path d="M0 250 L60 150 L110 230 L170 120 L260 240 L260 440 L0 440Z" fill="#7a8a96"/>
      <path d="M150 154 L170 120 L190 152 L178 146 L170 156 L160 146Z" fill="#fff"/><rect y="330" width="260" height="110" fill="#5f7a4a"/>`,
    stranden: `<rect width="260" height="440" fill="#f5d9a8"/><rect width="260" height="230" fill="#9fd0e8"/><rect y="230" width="260" height="70" fill="#3f8fbf"/>
      <circle cx="210" cy="70" r="26" fill="#ffe08a"/><rect y="300" width="260" height="140" fill="#ecd3a0"/>`,
    operaen: `<rect width="260" height="440" fill="#26355a"/><path d="M0 300 L120 230 L260 280 L260 330 L0 330Z" fill="#e9eef2"/>
      <rect x="150" y="240" width="60" height="50" fill="#9fb4c8" opacity=".6"/><rect y="330" width="260" height="110" fill="#1b2744"/>
      <circle cx="50" cy="60" r="2" fill="#fff"/><circle cx="90" cy="35" r="1.5" fill="#fff"/><circle cx="200" cy="50" r="2" fill="#fff"/>`,
    akademiet: `<rect width="260" height="440" fill="#0b0b0a"/><circle cx="130" cy="210" r="150" fill="none" stroke="#c9a24a" stroke-opacity=".35"/>
      <circle cx="130" cy="210" r="138" fill="none" stroke="#c9a24a" stroke-opacity=".2" stroke-dasharray="2 6"/><rect y="400" width="260" height="40" fill="#141310"/>`,
  }[c.bakgrunn] || "";
  p(bg);
  p(`<ellipse cx="${X}" cy="412" rx="${52 * b}" ry="7" fill="#000" opacity=".22"/>`);

  // Alt som er figuren, skaleres rundt føttene
  p(`<g transform="translate(${X} 410) scale(${c.hoyde}) translate(${-X} -410)">`);

  // ---------- Hår bak ----------
  const langtBak = ["langt", "pannelugg"].includes(c.har);
  if (langtBak) p(`<path d="M${X - 34} 92 Q${X - 40} 160 ${X - 42} 205 Q${X} 222 ${X + 42} 205 Q${X + 40} 160 ${X + 34} 92 Z" fill="${hf}"/>`);
  if (c.har === "hestehale") p(`<path d="M${X + 22} 70 Q${X + 58} 92 ${X + 46} 170 Q${X + 40} 128 ${X + 26} 98 Z" fill="${hf}"/>`);
  if (c.har === "bob") p(`<path d="M${X - 35} 88 Q${X - 40} 126 ${X - 30} 134 L${X + 30} 134 Q${X + 40} 126 ${X + 35} 88 Z" fill="${hf}"/>`);

  // ---------- Bein og sko ----------
  const bukser = { dress: af, genser: "#3a5a85", skjorte: "#c8b48a" }[c.antrekk];
  const shorts = c.antrekk === "trening";
  [-1, 1].forEach((s) => {
    const x0 = X + s * lx - lw / 2;
    p(`<rect x="${x0}" y="262" width="${lw}" height="140" rx="${lw / 2.4}" fill="${hud}"/>`);
    if (bukser) p(`<rect x="${x0 - 1}" y="262" width="${lw + 2}" height="136" rx="4" fill="${bukser}"/>`);
    if (shorts) p(`<rect x="${x0 - 2}" y="262" width="${lw + 4}" height="48" rx="4" fill="#1f1f24"/>`);
  });
  const sko = c.antrekk === "trening" ? "#f2f2f2" : c.antrekk === "bunad" ? "#1a1a1a" : mann ? "#2a1a12" : skygge(af, 0.6);
  [-1, 1].forEach((s) => p(`<ellipse cx="${X + s * (lx + 3)}" cy="402" rx="${lw / 2 + 5}" ry="7" fill="${sko}"/>`));

  // ---------- Hals ----------
  p(`<rect x="${X - 8}" y="118" width="16" height="34" rx="6" fill="${hudM}"/>`);

  // ---------- Overkropp ----------
  const torso = `M${X - sw} 152 Q${X - sw - 3} 182 ${X - ww} 215 L${X - hw} 268 L${X + hw} 268 L${X + ww} 215 Q${X + sw + 3} 182 ${X + sw} 152 Q${X} 140 ${X - sw} 152 Z`;
  const skjort = (lengde, flare) =>
    `M${X - ww} 212 L${X - hw - flare} ${lengde} Q${X} ${lengde + 10} ${X + hw + flare} ${lengde} L${X + ww} 212 Z`;

  let erme = "hud"; // hud | lang | kort
  let ermefarge = af;

  switch (c.antrekk) {
    case "kjole":
      p(`<path d="${torso}" fill="${hud}"/>`);
      p(`<path d="M${X - sw + 8} 168 Q${X} 178 ${X + sw - 8} 168 L${X + ww} 214 L${X - ww} 214 Z" fill="${af}"/>`);
      p(`<path d="M${X - sw + 12} 168 L${X - sw + 14} 150 M${X + sw - 12} 168 L${X + sw - 14} 150" stroke="${af}" stroke-width="3"/>`);
      p(`<path d="${skjort(330, 14)}" fill="${af}"/>`);
      p(`<path d="M${X - ww} 214 L${X + ww} 214" stroke="${afM}" stroke-width="3"/>`);
      break;
    case "aftenkjole":
      p(`<path d="${torso}" fill="${hud}"/>`);
      p(`<path d="M${X - sw + 6} 164 Q${X} 186 ${X + sw - 6} 164 L${X + ww} 214 L${X - ww} 214 Z" fill="${af}"/>`);
      p(`<path d="${skjort(400, 8)}" fill="${af}"/>`);
      p(`<path d="M${X + 6} 260 L${X + 14} 400" stroke="${afM}" stroke-width="2" opacity=".6"/>`);
      break;
    case "bunad": {
      const liv = af;
      p(`<path d="${torso}" fill="#f4f1ea"/>`);
      p(`<path d="M${X - ww - 3} 176 L${X + ww + 3} 176 L${X + ww} 216 L${X - ww} 216 Z" fill="${liv}"/>`);
      for (let i = -2; i <= 2; i++) p(`<circle cx="${X + i * 9}" cy="196" r="2.2" fill="${skygge(liv, 1.6)}"/>`);
      p(`<path d="${skjort(382, 10)}" fill="#1b1b22"/>`);
      p(`<rect x="${X - ww + 6}" y="216" width="${(ww - 6) * 2}" height="140" fill="${skygge(liv, 1.35)}" opacity=".9"/>`);
      p(`<path d="M${X - ww - 10} 372 L${X + ww + 10} 372" stroke="${liv}" stroke-width="6"/>`);
      p(`<circle cx="${X}" cy="152" r="6" fill="#d9dde2" stroke="#9aa3ad"/><circle cx="${X}" cy="152" r="2" fill="#c9a24a"/>`);
      erme = "lang"; ermefarge = "#f4f1ea";
      break;
    }
    case "dress":
      p(`<path d="${torso}" fill="${af}"/>`);
      p(`<path d="M${X - 12} 146 L${X} 196 L${X + 12} 146 Z" fill="#f4f1ea"/>`);
      p(`<path d="M${X - 4} 152 L${X + 4} 152 L${X + 5} 186 L${X} 194 L${X - 5} 186 Z" fill="${mann ? "#7a1a22" : afL}"/>`);
      p(`<path d="M${X - 13} 146 L${X - 4} 205 L${X - 18} 176 Z M${X + 13} 146 L${X + 4} 205 L${X + 18} 176 Z" fill="${afM}"/>`);
      p(`<circle cx="${X}" cy="226" r="2.5" fill="${afM}"/><circle cx="${X}" cy="244" r="2.5" fill="${afM}"/>`);
      erme = "lang";
      break;
    case "genser":
      p(`<path d="${torso}" fill="${af}"/>`);
      p(`<path d="M${X - 14} 146 Q${X} 160 ${X + 14} 146" stroke="${afM}" stroke-width="5" fill="none"/>`);
      p(`<path d="M${X - hw + 2} 262 L${X + hw - 2} 262" stroke="${afM}" stroke-width="6"/>`);
      erme = "lang";
      break;
    case "skjorte":
      p(`<path d="${torso}" fill="${af}"/>`);
      p(`<path d="M${X - 12} 146 L${X - 4} 162 L${X} 150 L${X + 4} 162 L${X + 12} 146" stroke="${afM}" stroke-width="2" fill="${afL}"/>`);
      for (let y = 172; y < 262; y += 18) p(`<circle cx="${X}" cy="${y}" r="1.8" fill="${afM}"/>`);
      p(`<rect x="${X - hw}" y="256" width="${hw * 2}" height="10" fill="#7a5a34"/>`);
      erme = "kort";
      break;
    case "trening":
      p(`<path d="${torso}" fill="${hud}"/>`);
      p(`<path d="M${X - sw + 12} 152 Q${X} 172 ${X + sw - 12} 152 L${X + ww} 214 L${X + hw} 268 L${X - hw} 268 L${X - ww} 214 Z" fill="${af}"/>`);
      p(`<path d="M${X - hw + 4} 238 L${X + hw - 4} 238" stroke="${afL}" stroke-width="3"/>`);
      break;
  }

  // ---------- Armer ----------
  [-1, 1].forEach((s) => {
    const a0 = `${X + s * (sw - 5)} 158`, a1 = `${X + s * (sw + 9)} 208`, a2 = `${X + s * (hw + 7)} 258`;
    const sti = `M${a0} Q${a1} ${a2}`;
    p(`<path d="${sti}" stroke="${hud}" stroke-width="${aw}" stroke-linecap="round" fill="none"/>`);
    if (erme === "lang") p(`<path d="${sti}" stroke="${ermefarge}" stroke-width="${aw + 2}" stroke-linecap="round" fill="none"/>`);
    if (erme === "kort") p(`<path d="M${a0} L${X + s * (sw + 6)} 192" stroke="${ermefarge}" stroke-width="${aw + 3}" stroke-linecap="round" fill="none"/>`);
    p(`<circle cx="${X + s * (hw + 7)}" cy="262" r="${aw / 2 + 1.5}" fill="${hud}"/>`);
  });
  if (har("klokke")) p(`<rect x="${X - hw - 14}" y="246" width="14" height="7" rx="2" fill="#c9a24a"/>`);
  if (har("veske")) p(`<path d="M${X + hw} 262 q8 -16 18 0" stroke="${afM}" stroke-width="2.5" fill="none"/><rect x="${X + hw - 4}" y="262" width="30" height="24" rx="4" fill="${skygge(af, 0.5)}"/>`);

  // ---------- Hode ----------
  p(`<ellipse cx="${X - 30}" cy="98" rx="5" ry="8" fill="${hudM}"/><ellipse cx="${X + 30}" cy="98" rx="5" ry="8" fill="${hudM}"/>`);
  p(`<ellipse cx="${X}" cy="92" rx="29" ry="${mann ? 34 : 33}" fill="${hud}"/>`);
  if (mann) p(`<path d="M${X - 26} 104 Q${X} 132 ${X + 26} 104" fill="${hud}"/>`);

  // Ansikt
  const leppe = har("leppestift") ? "#b3263a" : skygge(hud, 0.62);
  [-1, 1].forEach((s) => {
    p(`<ellipse cx="${X + s * 11}" cy="94" rx="5.2" ry="4" fill="#fff"/>`);
    p(`<circle cx="${X + s * 11}" cy="94" r="3.1" fill="${c.oyne}"/><circle cx="${X + s * 11}" cy="94" r="1.4" fill="#141414"/><circle cx="${X + s * 11 + 1}" cy="93" r=".8" fill="#fff"/>`);
    p(`<path d="M${X + s * 5} 84 Q${X + s * 11} ${mann ? 81 : 80} ${X + s * 17} 84" stroke="${hfM}" stroke-width="${mann ? 2.6 : 1.8}" fill="none" stroke-linecap="round"/>`);
    if (!mann || har("leppestift")) p(`<ellipse cx="${X + s * 17}" cy="104" rx="5" ry="3" fill="#e0786e" opacity=".22"/>`);
  });
  p(`<path d="M${X} 96 Q${X - 3} 104 ${X + 1} 106" stroke="${skygge(hud, 0.75)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
  p(har("leppestift")
    ? `<path d="M${X - 9} 113 Q${X} 121 ${X + 9} 113 Q${X} 116 ${X - 9} 113 Z" fill="${leppe}"/>`
    : `<path d="M${X - 8} 113 Q${X} 119 ${X + 8} 113" stroke="${leppe}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  if (har("skjegg")) p(`<path d="M${X - 29} 98 Q${X - 28} 128 ${X} 134 Q${X + 28} 128 ${X + 29} 98 Q${X + 22} 112 ${X + 12} 116 Q${X} 124 ${X - 12} 116 Q${X - 22} 112 ${X - 29} 98 Z" fill="${hf}"/>`);
  if (har("bart") || har("skjegg")) p(`<path d="M${X - 12} 110 Q${X} 104 ${X + 12} 110 Q${X} 108 ${X - 12} 110 Z" fill="${hf}" stroke="${hf}" stroke-width="2.5"/>`);

  // ---------- Hår foran ----------
  if (langtBak) [-1, 1].forEach((s) => p(`<path d="M${X + s * 31} 92 Q${X + s * 42} 140 ${X + s * 38} 186 Q${X + s * 31} 194 ${X + s * 24} 184 Q${X + s * 28} 146 ${X + s * 23} 104 Z" fill="${hf}"/>`));
  const kalott = `M${X - 31} 96 Q${X - 34} 54 ${X} 52 Q${X + 34} 54 ${X + 31} 96 Q${X + 26} 72 ${X} 68 Q${X - 26} 72 ${X - 31} 96 Z`;
  switch (c.har) {
    case "langt":
      p(`<path d="M${X - 32} 100 Q${X - 36} 52 ${X + 2} 52 Q${X + 36} 54 ${X + 32} 104 Q${X + 22} 70 ${X - 6} 66 Q${X - 22} 74 ${X - 32} 100 Z" fill="${hf}"/>`);
      break;
    case "pannelugg":
      p(`<path d="M${X - 32} 100 Q${X - 34} 52 ${X} 52 Q${X + 34} 52 ${X + 32} 100 L${X + 28} 82 L${X - 28} 82 Z" fill="${hf}"/>`);
      break;
    case "hestehale":
    case "knute":
      p(`<path d="${kalott}" fill="${hf}"/>`);
      if (c.har === "knute") p(`<circle cx="${X}" cy="48" r="13" fill="${hf}"/><path d="M${X - 10} 48 Q${X} 42 ${X + 10} 48" stroke="${hfM}" stroke-width="1.5" fill="none"/>`);
      break;
    case "bob":
      p(`<path d="M${X - 34} 110 Q${X - 38} 52 ${X} 52 Q${X + 38} 52 ${X + 34} 110 Q${X + 28} 78 ${X + 6} 70 Q${X - 20} 76 ${X - 26} 96 Z" fill="${hf}"/>`);
      break;
    case "krøller":
      for (const [dx, dy, r] of [[-30, 82, 10], [-26, 64, 11], [-14, 54, 11], [0, 50, 11], [14, 54, 11], [26, 64, 11], [30, 82, 10], [-34, 102, 9], [34, 102, 9], [-34, 120, 8], [34, 120, 8]])
        p(`<circle cx="${X + dx}" cy="${dy}" r="${r}" fill="${hf}"/>`);
      break;
    case "kort":
      p(`<path d="M${X - 30} 92 Q${X - 32} 56 ${X} 55 Q${X + 32} 56 ${X + 30} 92 Q${X + 28} 74 ${X} 70 Q${X - 28} 74 ${X - 30} 92 Z" fill="${hf}"/>`);
      break;
    case "sidelugg":
      p(`<path d="M${X - 31} 94 Q${X - 34} 52 ${X + 4} 53 Q${X + 34} 56 ${X + 31} 92 Q${X + 26} 70 ${X + 8} 72 Q${X - 12} 64 ${X - 31} 94 Z" fill="${hf}"/>`);
      break;
    case "skallet":
      p(`<path d="M${X - 31} 100 Q${X - 32} 86 ${X - 28} 80 M${X + 31} 100 Q${X + 32} 86 ${X + 28} 80" stroke="${hf}" stroke-width="5" fill="none" stroke-linecap="round"/>`);
      break;
  }

  // ---------- Tilbehør på hodet ----------
  if (har("oredobber")) p(`<circle cx="${X - 30}" cy="109" r="3" fill="#c9a24a"/><circle cx="${X + 30}" cy="109" r="3" fill="#c9a24a"/>`);
  if (har("perler")) for (let i = -5; i <= 5; i++) p(`<circle cx="${X + i * 4.2}" cy="${150 + (25 - i * i) * 0.35}" r="2.3" fill="#f6f2ea" stroke="#d8d0c0" stroke-width=".5"/>`);
  if (har("briller")) p(`<g fill="none" stroke="#2a2a2a" stroke-width="2"><circle cx="${X - 11}" cy="94" r="8"/><circle cx="${X + 11}" cy="94" r="8"/><path d="M${X - 3} 93 Q${X} 90 ${X + 3} 93 M${X - 19} 92 L${X - 29} 90 M${X + 19} 92 L${X + 29} 90"/></g>`);
  if (har("solbriller")) p(`<g fill="#141414"><rect x="${X - 21}" y="88" width="18" height="12" rx="4"/><rect x="${X + 3}" y="88" width="18" height="12" rx="4"/></g><path d="M${X - 3} 92 L${X + 3} 92 M${X - 21} 92 L${X - 29} 90 M${X + 21} 92 L${X + 29} 90" stroke="#141414" stroke-width="2"/>`);
  if (har("blomst")) {
    for (let i = 0; i < 5; i++) {
      const v = (i / 5) * Math.PI * 2;
      p(`<circle cx="${X + 26 + Math.cos(v) * 5}" cy="${62 + Math.sin(v) * 5}" r="4" fill="#f2a0b4"/>`);
    }
    p(`<circle cx="${X + 26}" cy="62" r="3" fill="#f5d36b"/>`);
  }
  if (har("hatt")) p(`<ellipse cx="${X}" cy="62" rx="52" ry="10" fill="${skygge(af, 0.55)}"/><path d="M${X - 26} 62 Q${X - 26} 30 ${X} 30 Q${X + 26} 30 ${X + 26} 62 Z" fill="${skygge(af, 0.55)}"/><path d="M${X - 26} 56 L${X + 26} 56" stroke="${af}" stroke-width="5"/>`);

  p(`</g>`);

  return `<svg viewBox="0 0 260 440" width="${bredde}" class="partner-figur" role="img" aria-label="Tegning av drømmepartneren${c.navn ? ", " + esc(c.navn) : ""}">${ut.join("")}</svg>`;
}

// ---------- Editor ----------
function byggPartnerEditor(boks, start, vedLagre) {
  let c = partnerOppsett(start);
  const seksjoner = [
    ["Kropp", [
      { k: "kjonn", type: "valg" },
      { k: "hud", type: "farge", etikett: "Hudfarge" },
      { k: "hoyde", type: "glider", etikett: "Høyde", min: 0.88, max: 1.08, ender: ["Lav", "Høy"] },
      { k: "bygning", type: "glider", etikett: "Kroppsbygning", min: 0.85, max: 1.22, ender: ["Spinkel", "Kraftig"] },
    ]],
    ["Hår og ansikt", [
      { k: "har", type: "valg", etikett: "Frisyre" },
      { k: "harfarge", type: "farge", etikett: "Hårfarge" },
      { k: "oyne", type: "farge", etikett: "Øyefarge" },
    ]],
    ["Antrekk", [
      { k: "antrekk", type: "valg" },
      { k: "antrekksfarge", type: "farge", etikett: "Farge" },
    ]],
    ["Tilbehør", [{ k: "tilbehor", type: "flervalg" }]],
    ["Omgivelser", [{ k: "bakgrunn", type: "valg" }]],
    ["Om partneren", [
      { k: "navn", type: "tekst", etikett: "Navn", maks: 60 },
      { k: "yrke", type: "tekst", etikett: "Yrke", maks: 80 },
      { k: "interesser", type: "tekst", etikett: "Interesser", maks: 160 },
      { k: "kjennetegn", type: "tekst", etikett: "Må tåle", maks: 160, hint: "For eksempel: fire Tafsemøter i året" },
    ]],
  ];

  const kontroll = (f) => {
    const id = `pe-${f.k}`;
    const etikett = f.etikett ? `<span class="pe-etikett">${f.etikett}</span>` : "";
    if (f.type === "valg" || f.type === "flervalg") {
      return `<div class="pe-felt">${etikett}<div class="pe-valg" role="group">${PARTNER_VALG[f.k].map(([v, navn]) => {
        const valgt = f.type === "valg" ? c[f.k] === v : c[f.k].includes(v);
        return `<button type="button" data-k="${f.k}" data-v="${v}" data-type="${f.type}" aria-pressed="${valgt}">${navn}</button>`;
      }).join("")}</div></div>`;
    }
    if (f.type === "farge") {
      return `<div class="pe-felt">${etikett}<div class="pe-farger">${PARTNER_PALETT[f.k].map((h) =>
        `<button type="button" class="pe-prikk" style="background:${h}" data-k="${f.k}" data-v="${h}" data-type="farge" aria-pressed="${c[f.k] === h}" aria-label="${f.etikett} ${h}"></button>`).join("")}
        <label class="pe-egen" title="Egen farge"><input type="color" data-k="${f.k}" value="${c[f.k]}"><span>Egen</span></label></div></div>`;
    }
    if (f.type === "glider") {
      return `<div class="pe-felt"><label class="pe-etikett" for="${id}">${f.etikett}</label>
        <div class="pe-glider"><span>${f.ender[0]}</span><input id="${id}" type="range" min="${f.min}" max="${f.max}" step="0.01" value="${c[f.k]}" data-k="${f.k}"><span>${f.ender[1]}</span></div></div>`;
    }
    return `<div class="felt pe-felt"><label for="${id}">${f.etikett}</label><input id="${id}" maxlength="${f.maks}" data-k="${f.k}" value="${esc(c[f.k])}" placeholder="${esc(f.hint || "")}"></div>`;
  };

  boks.innerHTML = `<div class="pe">
    <div class="pe-forhånd"><div id="pe-figur"></div>
      <div class="pe-knapper">
        <button class="knapp sekundar" type="button" id="pe-tilfeldig">Tilfeldig</button>
        <button class="knapp" type="button" id="pe-lagre">Lagre</button>
      </div>
      <div id="pe-melding" role="status"></div>
    </div>
    <div class="pe-kontroller">
      ${seksjoner.map(([tittel, felt], i) => `<details class="pe-seksjon"${i < 2 ? " open" : ""}><summary>${tittel}</summary>${felt.map(kontroll).join("")}</details>`).join("")}
    </div>
  </div>`;

  const figur = boks.querySelector("#pe-figur");
  const tegn = () => (figur.innerHTML = tegnPartner(c, { bredde: 260 }));
  tegn();

  const oppdaterKnapper = () => {
    boks.querySelectorAll("[data-type]").forEach((b) => {
      const { k, v, type } = b.dataset;
      b.setAttribute("aria-pressed", type === "flervalg" ? c[k].includes(v) : c[k] === v);
    });
    boks.querySelectorAll('input[type="color"]').forEach((i) => (i.value = c[i.dataset.k]));
    boks.querySelectorAll('input[type="range"]').forEach((i) => (i.value = c[i.dataset.k]));
    boks.querySelectorAll('.pe-felt input:not([type])').forEach((i) => (i.value = c[i.dataset.k] || ""));
  };

  boks.addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]");
    if (!b) return;
    const { k, v, type } = b.dataset;
    if (type === "flervalg") c[k] = c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v];
    else c[k] = v;
    oppdaterKnapper();
    tegn();
  });
  boks.addEventListener("input", (e) => {
    const i = e.target.closest("input[data-k]");
    if (!i) return;
    c[i.dataset.k] = i.type === "range" ? Number(i.value) : i.value;
    if (i.type === "color") oppdaterKnapper();
    tegn();
  });

  boks.querySelector("#pe-tilfeldig").addEventListener("click", () => {
    const tilf = (l) => l[Math.floor(Math.random() * l.length)];
    const kvinne = c.kjonn === "kvinne";
    c = {
      ...c,
      hud: tilf(PARTNER_PALETT.hud),
      har: tilf(kvinne ? ["langt", "pannelugg", "hestehale", "knute", "bob", "krøller"] : ["kort", "sidelugg", "krøller", "skallet", "langt"]),
      harfarge: tilf(PARTNER_PALETT.harfarge.slice(0, 7)),
      oyne: tilf(PARTNER_PALETT.oyne),
      antrekk: tilf(kvinne ? ["kjole", "aftenkjole", "bunad", "genser", "skjorte", "trening", "dress"] : ["dress", "genser", "skjorte", "trening"]),
      antrekksfarge: tilf(PARTNER_PALETT.antrekksfarge),
      hoyde: +(0.9 + Math.random() * 0.16).toFixed(2),
      bygning: +(0.88 + Math.random() * 0.3).toFixed(2),
      tilbehor: PARTNER_VALG.tilbehor.map(([v]) => v).filter((v) => (kvinne ? !["skjegg", "bart"].includes(v) : !["leppestift", "perler", "blomst"].includes(v)) && Math.random() < 0.18),
      bakgrunn: tilf(PARTNER_VALG.bakgrunn).at(0),
    };
    oppdaterKnapper();
    tegn();
  });

  boks.querySelector("#pe-lagre").addEventListener("click", async (e) => {
    const knapp = e.currentTarget;
    const melding = boks.querySelector("#pe-melding");
    knapp.disabled = true;
    try {
      await vedLagre({ ...c });
      melding.innerHTML = `<p class="melding">Lagret.</p>`;
    } catch (err) {
      melding.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`;
    } finally {
      knapp.disabled = false;
    }
  });
}
