// SYMPOSION: den felles greske byen. Hvert gods gir oliven, vin, marmor, honning og sølv,
// og skipene i havnen henter hjem purpur og krydder.
// Reglene og all utregning ligger på serveren (lib/symposion.js). Denne fila tegner byen.
// Avtalene med Tafse Hotell står på pause. Skru på med true, og PAUSE = false i lib/hotellokonomi.js.
const KONTOR_PA = false;
const HOTELLHJELP = `      <h3>Tafse Hotell</h3>
      <p>Hotellet har sin egen mynt, denarer. Du tjener dem på leie fra rommet ditt og ved å selge råvarer til baren, og bruker dem i resepsjonen på avtaler som varer en uke: handelsavtalen gir godset 10 % mer av alt, lagerleien tre timer større lager, og losen 25 % raskere tokt. Åpne «Kontoret» i hotellet.</p>
`;

(() => {
  const rot = document.getElementById("sy");
  let T = null;        // tilstanden fra serveren
  let hentet = 0;      // når den kom
  let valgt = null;    // hvilket gods som er åpent i panelet
  let opptatt = false;
  let skrubb = 0;      // hvor mange tak man har skrubbet på taggen
  const SKRUBB = 6;
  const FARGER = ["#e0533d", "#4fc3a1", "#f2c14e", "#b07cf0", "#5fa8f0", "#f07cb8"];
  let taggFarge = FARGER[0];

  let RESS = ["oliven", "vin", "marmor"];   // det godset produserer (fylles fra serveren)
  let ALLE = RESS;                           // alt man kan eie, også det skipene henter
  const rn = (r) => (T && T.regler.navn[r]) || r;
  const tall = (n) => Math.floor(n).toLocaleString("nb-NO");
  const IKON = {
    oliven: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><ellipse cx="8" cy="9.6" rx="4.4" ry="5.4" fill="#93a85c"/><ellipse cx="6.6" cy="8" rx="1.3" ry="2" fill="#c3d28e" opacity=".7"/><path d="M8 4.4 Q10 1 13.4 2 Q11.4 5.4 8 4.4" fill="#5f7339"/></svg>`,
    vin: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><g fill="#a8527c"><circle cx="5.4" cy="6.6" r="2.4"/><circle cx="10.6" cy="6.6" r="2.4"/><circle cx="8" cy="8.6" r="2.4"/><circle cx="6.6" cy="11.4" r="2.2"/><circle cx="9.6" cy="11.4" r="2.2"/><circle cx="8" cy="13.6" r="1.8"/></g><path d="M8 5 L8 1.6 Q11 1 12 3" fill="none" stroke="#5f7339" stroke-width="1.2"/></svg>`,
    marmor: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M8 1.6 L14.4 4.8 L8 8 L1.6 4.8 Z" fill="#f4efe3"/><path d="M1.6 4.8 L8 8 L8 14.6 L1.6 11.4 Z" fill="#cfc8b6"/><path d="M14.4 4.8 L8 8 L8 14.6 L14.4 11.4 Z" fill="#a9a290"/></svg>`,
    honning: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M8 1.5 L13.6 4.75 V11.25 L8 14.5 L2.4 11.25 V4.75 Z" fill="#d99a2b"/><path d="M8 4.6 L10.9 6.3 V9.7 L8 11.4 L5.1 9.7 V6.3 Z" fill="#f2cf6b"/></svg>`,
    solv: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="#c9ccd4"/><circle cx="8" cy="8" r="4.2" fill="none" stroke="#8d919c" stroke-width="1"/><path d="M5.2 6.4 Q6 4.8 7.8 4.4" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></svg>`,
    purpur: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M2.6 3 H13.4 V10.4 Q8 15.4 2.6 10.4 Z" fill="#8e3fa8"/><path d="M2.6 3 H13.4 V5.2 H2.6 Z" fill="#c084d8"/><path d="M5.4 5.2 V11.6 M8 5.2 V12.6 M10.6 5.2 V11.6" stroke="#6c2c82" stroke-width=".9"/></svg>`,
    krydder: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M4 6.2 Q8 3.6 12 6.2 L13.2 12.8 Q8 15.6 2.8 12.8 Z" fill="#a8602a"/><path d="M5.6 5.4 Q8 1.6 10.4 5.4" fill="none" stroke="#6f3c14" stroke-width="1.3"/><circle cx="8" cy="9.8" r="2" fill="#e8913a"/></svg>`,
    aere: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M8 14 Q2 12 2.6 4.4 M8 14 Q14 12 13.4 4.4" fill="none" stroke="#c9a24a" stroke-width="1.2"/><g fill="#e2c174"><ellipse cx="3" cy="5.4" rx="1.2" ry="2"/><ellipse cx="3.4" cy="9" rx="1.2" ry="2" transform="rotate(-25 3.4 9)"/><ellipse cx="5.4" cy="12" rx="1.2" ry="2" transform="rotate(-55 5.4 12)"/><ellipse cx="13" cy="5.4" rx="1.2" ry="2"/><ellipse cx="12.6" cy="9" rx="1.2" ry="2" transform="rotate(25 12.6 9)"/><ellipse cx="10.6" cy="12" rx="1.2" ry="2" transform="rotate(55 10.6 12)"/></g></svg>`,
  };
  const pris = (k) => Object.entries(k).map(([r, n]) => `<span class="sy-pris">${tall(n)}${IKON[r]}</span>`).join(" ");
  const gave = (k) => Object.entries(k).map(([r, n]) => `+${tall(n)} ${rn(r)}`).join(", ");
  const eier = (navn) => (/[sxz]$/i.test(navn) ? `${navn}'` : `${navn}s`);
  const godsNavn = (navn) => `${eier(visningsnavn(navn))} gods`;

  // Lageret fylles mellom hver gang vi spør serveren
  function lager(r) {
    const m = T.meg;
    return Math.min(m.tak[r], m.lager[r] + (m.rater[r] * (Date.now() - hentet)) / 3600000);
  }
  const lagerSum = () => RESS.reduce((s, r) => s + Math.floor(lager(r)), 0);
  const harRad = (k) => k && Object.entries(k).every(([r, n]) => T.meg.beholdning[r] >= n);

  // ---------- Døgnet på øya ----------
  // Kartet følger klokka i Oslo: natt, morgen, dag og kveld har hver sin himmel, sitt hav og sitt lys.
  // (?tid=natt|morgen|dag|kveld i adressen overstyrer, til testing.)
  const PALETT = {
    natt:   { himmel: ["#07080d", "#151a2a", "#4a3a22"], hav: ["#2a3138", "#121c22", "#0a0f12"], land: ["#4a4830", "#2f2e1e", "#23221a"], strand: "#9a8552", fjell: "#12141a", bakke: "#3b3824", vei: "#7a6d49", sky: .1, stjerner: 1 },
    morgen: { himmel: ["#2b2a4a", "#a8687a", "#f2c08a"], hav: ["#9a8088", "#3d5563", "#16262e"], land: ["#75703f", "#504e30", "#38371f"], strand: "#c9ad72", fjell: "#3a3550", bakke: "#5b562f", vei: "#a39160", sky: .55, stjerner: .3 },
    dag:    { himmel: ["#4587bd", "#93c2de", "#e6eedc"], hav: ["#86b8c8", "#2f7389", "#184c5e"], land: ["#98995a", "#737746", "#565c36"], strand: "#e3cf97", fjell: "#6c83a1", bakke: "#80814a", vei: "#d3c28d", sky: .9, stjerner: 0 },
    kveld:  { himmel: ["#191a36", "#7a3d5c", "#e88f4c"], hav: ["#a06c50", "#3a3a4e", "#141a24"], land: ["#6b5f3a", "#474029", "#2f2b1c"], strand: "#b9965e", fjell: "#2a2238", bakke: "#514a2b", vei: "#96835a", sky: .5, stjerner: .35 },
  };
  const osloTime = () => {
    const [t, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()).split(":").map(Number);
    return (t % 24) + m / 60;
  };
  const TVUNGEN_FASE = new URLSearchParams(location.search).get("tid");
  function fase() {
    if (PALETT[TVUNGEN_FASE]) return TVUNGEN_FASE;
    const t = osloTime();
    return t < 5.5 ? "natt" : t < 8.5 ? "morgen" : t < 17.5 ? "dag" : t < 21 ? "kveld" : "natt";
  }
  const FASENAVN = { natt: "Natt på øya", morgen: "Morgen på øya", dag: "Dag på øya", kveld: "Kveld på øya" };
  const roligBevegelse = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Bykartet ----------
  const W = 1000, H = 640, TOPP = 44, HH = H - TOPP;
  // BYEN ER DELT I NABOLAG ETTER ÆRE. De fire med mest ære bor på Akropolis, på hver side av
  // tempelet. De neste bor i Midtbyen, gata rett nedenfor agoraen, og resten i gatene bak. I hver
  // gate står de med mest ære nærmest midten. Får man mer ære enn en nabo, bytter man plass.
  // Alle hus har samme størrelse (k), og k velges så alle får plass på øya.
  const LOFT = 52;            // så mye høyere agoraen og byggverkene står enn før, for å gi plass til gatene
  const AKROPOLIS = 4;
  const GATENAVN = ["Midtbyen", "Utkanten", "Strandkanten", "Fjæra"];
  const BYPLAN = new Map();
  function byplan(n) {
    if (BYPLAN.has(n)) return BYPLAN.get(n);
    let plan = null;
    for (const k of [0.7, 0.62, 0.54, 0.47, 0.41, 0.36, 0.31, 0.27, 0.23]) {
      const bredde = 170 * k, radhoyde = 148 * k, gater = [];
      // Første gate ligger så tett under agoraen som husene tillater
      for (let y = 392 + 95 * k; y + 30 * k < 606 && gater.length < GATENAVN.length; y += radhoyde) {
        // Så langt ut fra midten et hus kan stå i denne høyden uten å havne i fjæra eller på kaia
        const u = (y + 28 * k - 412) / 204;
        const halv = Math.min(330, 488 * Math.sqrt(Math.max(0, 1 - u * u)) - 62 * k - 22);
        if (halv < bredde / 2) break;
        gater.push({ y, plass: Math.floor((2 * halv) / bredde) + 1 });
      }
      plan = { k, bredde, gater };
      if (AKROPOLIS + gater.reduce((a, g) => a + g.plass, 0) >= n) break;
    }
    BYPLAN.set(n, plan);
    return plan;
  }
  function plasser() {
    const ut = new Map();
    // Mest ære først. Står to likt, går den som flyttet inn først, foran.
    const rekke = T.spillere.map((s, i) => ({ navn: s.navn, aere: s.aere, i })).sort((a, b) => b.aere - a.aere || a.i - b.i);
    const { k, bredde, gater } = byplan(rekke.length);
    ut.k = k; ut.krymp = 1; ut.gater = [];
    rekke.slice(0, AKROPOLIS).forEach((r, i) => {
      const side = i % 2 ? 1 : -1, ytre = i >= 2 ? bredde : 0;
      ut.set(r.navn, { x: 500 + side * (292 + ytre), y: 318, s: k, nabolag: "på Akropolis", plass: i + 1 });
    });
    let fra = AKROPOLIS;
    gater.forEach((g, j) => {
      const folk = rekke.slice(fra, fra + g.plass);
      if (!folk.length) return;
      // Plassene i gata, sortert fra midten og utover, så de med mest ære står nærmest midten
      const xs = folk.map((_, i) => 500 + (i - (folk.length - 1) / 2) * bredde).sort((a, b) => Math.abs(a - 500) - Math.abs(b - 500) || a - b);
      folk.forEach((r, i) => ut.set(r.navn, { x: xs[i], y: g.y, s: k, nabolag: `i ${GATENAVN[j]}`, plass: fra + i + 1 }));
      ut.gater.push({ navn: GATENAVN[j], y: g.y, x1: Math.min(...xs), x2: Math.max(...xs) });
      fra += g.plass;
    });
    ut.akropolis = rekke.slice(0, AKROPOLIS).map((r) => ut.get(r.navn).x);
    // Så mye ære som skal til for å flytte opp til nabolaget over
    ut.grense = (navn) => {
      const p = ut.get(navn);
      if (!p || p.plass <= AKROPOLIS) return null;
      const over = rekke.filter((r) => ut.get(r.navn).y < p.y).pop();
      return over ? { nabolag: ut.get(over.navn).nabolag, mangler: Math.max(1, over.aere - T.spillere.find((s) => s.navn === navn).aere + 1) } : null;
    };
    return ut;
  }
  // Fra byens koordinater til kartets, etter krympingen
  const paKart = (p, k) => ({ x: 500 + (p.x - 500) * k, y: 404 + (p.y - 404) * k });

  function villa(niva, lys) {
    const vindu = lys ? "#f2c14e" : "#191610";
    const marmor = "#ece5d3", skygge = "#bdb49d", tegl = "#a9603c";
    const trinn = niva <= 2 ? 0 : niva <= 4 ? 1 : niva <= 7 ? 2 : 3;
    if (trinn === 0) return `<path d="M-13 0 V-15 H13 V0 Z" fill="#cdbf9f"/><path d="M-17 -15 L0 -28 L17 -15 Z" fill="#8a6a45"/><rect x="-3.5" y="-9" width="7" height="9" fill="${vindu}"/>`;
    if (trinn === 1) return `<path d="M-20 0 V-20 H20 V0 Z" fill="${marmor}"/><path d="M-20 0 V-20 H-12 V0 Z" fill="${skygge}" opacity=".5"/><path d="M-24 -20 L0 -35 L24 -20 Z" fill="${tegl}"/><path d="M-24 -20 H24" stroke="#7d4429" stroke-width="2"/><rect x="-4" y="-11" width="8" height="11" fill="#3a2a18"/><rect x="-15" y="-15" width="6" height="6" fill="${vindu}"/><rect x="9" y="-15" width="6" height="6" fill="${vindu}"/>`;
    const sokler = (xs, topp) => xs.map((x) => `<rect x="${x - 2}" y="${topp}" width="4" height="${-3 - topp}" fill="${marmor}"/><rect x="${x - 2}" y="${topp}" width="1.4" height="${-3 - topp}" fill="${skygge}" opacity=".7"/>`).join("");
    if (trinn === 2) return `<rect x="-24" y="-24" width="48" height="21" fill="#221d14"/><rect x="-5" y="-17" width="10" height="14" fill="${vindu}"/>${sokler([-21, -11, 11, 21], -25)}<rect x="-27" y="-3" width="54" height="3" fill="${marmor}"/><rect x="-27" y="-29" width="54" height="4" fill="${marmor}"/><path d="M-29 -29 L0 -43 L29 -29 Z" fill="${marmor}" stroke="#c9a24a" stroke-width="1"/><circle cx="0" cy="-34" r="2.4" fill="#c9a24a"/>`;
    return `<path d="M-50 0 V-18 H-32 V0 Z M32 0 V-18 H50 V0 Z" fill="${marmor}"/><path d="M-53 -18 L-41 -26 L-29 -18 Z M29 -18 L41 -26 L53 -18 Z" fill="${tegl}"/><rect x="-44" y="-12" width="6" height="7" fill="${vindu}"/><rect x="38" y="-12" width="6" height="7" fill="${vindu}"/>
      <rect x="-30" y="-30" width="60" height="24" fill="#221d14"/><rect x="-6" y="-22" width="12" height="16" fill="${vindu}"/>${sokler([-28, -19, -10, 10, 19, 28], -31)}
      <rect x="-36" y="-3" width="72" height="3" fill="${skygge}"/><rect x="-33" y="-6" width="66" height="3" fill="${marmor}"/><rect x="-33" y="-36" width="66" height="5" fill="${marmor}"/>
      <path d="M-36 -36 L0 -54 L36 -36 Z" fill="${marmor}" stroke="#c9a24a" stroke-width="1.2"/><circle cx="0" cy="-42" r="3.4" fill="#c9a24a"/><path d="M0 -54 V-62 M-36 -36 V-41 M36 -36 V-41" stroke="#c9a24a" stroke-width="1.6"/><circle cx="0" cy="-63" r="2" fill="#e2c174"/>`;
  }

  // Graffiti over huset, med et par renn under
  function taggSvg(t, mitt) {
    if (!t) return "";
    const lengde = [...t.tekst].length;
    const bredde = Math.min(150, 14 + lengde * 8.5);
    const renn = [-0.32, 0.05, 0.28].map((x, i) => `<path d="M${(x * bredde).toFixed(0)} 3 v${6 + i * 3}" stroke="${t.farge}" stroke-width="1.6" stroke-linecap="round"/>`).join("");
    const op = mitt && skrubb ? (1 - skrubb / SKRUBB).toFixed(2) : 1;
    return `<g class="sy-taggen" transform="translate(0 -14) rotate(-7)" opacity="${op}">${renn}
      <text text-anchor="middle" class="sy-taggtekst" fill="${t.farge}" ${lengde > 8 ? `textLength="${bredde.toFixed(0)}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(t.tekst)}</text></g>`;
  }

  function tomt(sp, pos, krymp) {
    const tekstskala = (1 / Math.sqrt(krymp || 1)).toFixed(2);
    const { x, y, s } = pos, navn = sp.navn;
    const mitt = T.meg && navn === T.meg.navn;
    const klasse = `sy-tomt${mitt ? " mitt" : ""}${valgt === navn ? " valgt" : ""}${sp ? "" : " ledig"}`;
    let inn = "";
    if (!sp) {
      inn = `<ellipse rx="40" ry="12" fill="none" stroke="#6b6248" stroke-dasharray="4 5"/><path d="M-6 -2 V-14 M6 -2 V-14 M-9 -14 H9" stroke="#6b6248" stroke-width="1.5" fill="none"/>`;
    } else {
      const b = sp.bygg;
      const tre = [[-40, -1], [-52, 5], [-31, 7], [-46, -8], [-60, -2]].slice(0, Math.min(5, Math.ceil(b.lund / 2)))
        .map(([tx, ty]) => `<path d="M${tx} ${ty} v-9" stroke="#5a4630" stroke-width="2"/><circle cx="${tx}" cy="${ty - 12}" r="7" fill="#5f7339"/><circle cx="${tx - 2}" cy="${ty - 14}" r="3.4" fill="#8fa65a"/>`).join("");
      const vin = Array.from({ length: b.vingard ? Math.min(4, Math.ceil(b.vingard / 2.5)) : 0 }, (_, k) => {
        const vx = 30 + k * 9, vy = 6 - k * 3;
        return `<path d="M${vx} ${vy} v-10" stroke="#5a4630" stroke-width="1.4"/><circle cx="${vx}" cy="${vy - 10}" r="3.6" fill="#5f7339"/><circle cx="${vx - 1}" cy="${vy - 6}" r="2.2" fill="#a8527c"/><circle cx="${vx + 1.6}" cy="${vy - 4}" r="1.8" fill="#a8527c"/>`;
      }).join("");
      const stein = Array.from({ length: b.brudd ? Math.min(3, Math.ceil(b.brudd / 3)) : 0 }, (_, k) =>
        `<rect x="${34 + k * 9}" y="${-13 - (k % 2) * 3}" width="8" height="6" fill="#ece5d3"/><rect x="${34 + k * 9}" y="${-9 - (k % 2) * 3}" width="8" height="2" fill="#a9a290"/>`).join("");
      const kuber = Array.from({ length: b.bigard ? Math.min(3, Math.ceil(b.bigard / 3)) : 0 }, (_, k) =>
        `<g transform="translate(${-24 + k * 10} ${13 + (k % 2) * 2})"><path d="M-4 0 Q-4.6 -8 0 -8.6 Q4.6 -8 4 0 Z" fill="#d99a2b"/><path d="M-3.6 -3 H3.6 M-3 -5.6 H3" stroke="#a36f17" stroke-width=".8"/><rect x="-1" y="-2.2" width="2" height="2.2" fill="#3a2a18"/></g>`).join("");
      const gruve = b.gruve ? `<g transform="translate(63 3)"><path d="M-11 0 Q-10 -15 0 -16 Q10 -15 11 0 Z" fill="#5d5a4c"/><path d="M-6 0 V-6 Q0 -12 6 -6 V0 Z" fill="#14130d"/><path d="M-6 -6 Q0 -12 6 -6" fill="none" stroke="#8a6a45" stroke-width="1.4"/>${b.gruve >= 4 ? `<circle cx="-7" cy="-11" r="1.2" fill="#e6e8ee"/>` : ""}<circle cx="5" cy="-13" r="1.2" fill="#e6e8ee" class="sy-flamme"/></g>` : "";
      const trinn = b.villa <= 2 ? 0 : b.villa <= 4 ? 1 : b.villa <= 7 ? 2 : 3;
      const tak = [-28, -35, -43, -62][trinn];
      const hp = harPynt(sp.rang);
      const hoyde = [-44, -52, -60, -80][trinn] - (hp.has("flagg") ? 16 : 0) - (hp.has("stjerne") ? 14 : 0);
      const mosaikk = hp.has("mosaikk") ? `<ellipse rx="57" ry="14.4" fill="none" stroke="#6fc3c9" stroke-width="2.4" stroke-dasharray="3 3" opacity=".85"/><ellipse rx="51" ry="12.4" fill="none" stroke="#c9a24a" stroke-width="1.1" stroke-dasharray="1.5 4"/>` : "";
      // Merkene over husene er knapper: boblen over ditt eget høster, og begeret over en nabo skjenker.
      const merke = mitt
        ? `<g class="sy-dupp sy-klar sy-hurtig" data-klar data-hurtig="host" hidden><title>Høst avlingen</title><circle cy="${hoyde - 6}" r="17" fill="transparent"/><circle cy="${hoyde - 6}" r="11" fill="#141310" stroke="#c9a24a"/><g transform="translate(-8 ${hoyde - 14})">${IKON.oliven.replace('class="sy-ikon"', 'width="16" height="16"')}</g></g>`
        : !sp.skjenket && T.meg ? `<g class="sy-dupp sy-hurtig${sp.skjenketMeg ? " sy-gjengjeld" : ""}" data-hurtig="skjenk" data-til="${esc(navn)}"><title>Skjenk ${esc(visningsnavn(navn))} et glass</title><circle cy="${hoyde - 2}" r="16" fill="transparent"/><path d="M-4 ${hoyde - 12} h8 l-1 4 q4 5 0 11 h-6 q-4 -6 0 -11 z" fill="${sp.skjenketMeg ? "#c2557f" : "#c9a24a"}" stroke="${sp.skjenketMeg ? "#f2e3b4" : "#14130d"}" stroke-width="1"/>${sp.skjenketMeg ? `<circle cx="7" cy="${hoyde - 13}" r="3.2" fill="#f2c14e" stroke="#14130d" stroke-width=".8"/>` : ""}</g>` : "";
      inn = `${hp.has("fakler") ? `<ellipse rx="78" ry="24" fill="url(#sy-glod)"/>` : ""}<ellipse rx="64" ry="17" fill="${PALETT[fase()].bakke}"/>${mosaikk}<ellipse rx="64" ry="17" class="sy-ring" fill="none"/>${stein}${gruve}${tre}${sp.hjemme ? royk(trinn, tak) : ""}<g>${villa(b.villa, sp.hjemme)}</g>${vin}${kuber}${pynt(sp.rang, tak)}${taggSvg(sp.tagg, mitt)}${merke}`;
    }
    return `<g class="${klasse}" data-navn="${esc(navn)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})" tabindex="0" role="button" aria-label="${esc(godsNavn(navn))}">
      <ellipse rx="70" ry="60" cy="-22" fill="transparent"/>${inn}
      <g transform="translate(0 22) scale(${tekstskala})"><text y="12" text-anchor="middle" class="sy-navn">${esc(visningsnavn(navn))}${mitt ? " (deg)" : ""}</text>
      ${sp && sp.rang ? `<text y="25" text-anchor="middle" class="sy-tittel">${esc(T.regler.ranger[sp.rang].tittel)}</text>` : ""}</g></g>`;
  }

  // Røyk fra pipa hos dem som har vært innom det siste døgnet
  function royk(trinn, tak) {
    const x = [7, 12, 0, 0][trinn], y = trinn >= 2 ? tak + 8 : tak + 6;
    return `<g class="sy-royk" transform="translate(${x} ${y})">${[0, 1, 2].map((i) => `<circle r="${3 + i * 0.6}" fill="#d8d2c2" style="animation-delay:${(-i * 1.3).toFixed(1)}s"/>`).join("")}</g>`;
  }

  // Rangpynt: hver rang legger til én ting på godset, og man beholder alt fra rangene under
  const PYNT = { flagg: "et flagg på taket", amforaer: "amforaer ved døra", krans: "en laurbærkrans rundt godset", mosaikk: "mosaikk rundt huset", statue: "en statue i hagen",
    fontene: "en fontene foran huset", orn: "en gullørn på flaggstanga", fakler: "fakler og gullglød", stjerne: "en stjerne over huset" };
  const harPynt = (r) => new Set(T.regler.ranger.slice(0, r + 1).map((x) => x.pynt).filter(Boolean));
  function pynt(r, tak) {
    if (!r) return "";
    const har = harPynt(r);
    let s = "";
    if (har.has("amforaer")) s += [-10, 10].map((x) => `<path transform="translate(${x} 5)" d="M-2 -8 h4 l-.6 2 q2.6 2.6 0 6 h-2.8 q-2.6 -3.4 0 -6 z" fill="#b5651d" stroke="#14130d" stroke-width=".5"/>`).join("");
    if (har.has("fontene")) s += `<g transform="translate(19 14)"><ellipse rx="7.4" ry="2.8" fill="#bdb49d"/><ellipse rx="5.6" ry="1.9" fill="#5fa8f0"/><path d="M0 0 v-6" stroke="#ece5d3" stroke-width="1.8"/><ellipse cy="-6" rx="3.2" ry="1.1" fill="#ece5d3"/><path d="M0 -7 q-3 -4.4 -4.4 1 M0 -7 q3 -4.4 4.4 1" fill="none" stroke="#9fd0ff" stroke-width="1" class="sy-flamme"/></g>`;
    if (har.has("orn")) s += `<g transform="translate(0 ${tak - 19})"><path d="M0 0 q-4 -5 -9 -1.4 q4.4 -.2 5.6 3.4 z M0 0 q4 -5 9 -1.4 q-4.4 -.2 -5.6 3.4 z" fill="#e2c174" stroke="#14130d" stroke-width=".4"/><circle r="1.7" fill="#e2c174"/></g>`;
    if (har.has("stjerne")) s += `<path transform="translate(0 ${tak - 33})" d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" fill="#f2e3b4" stroke="#c9a24a" stroke-width=".5" class="sy-flamme"/>`;
    if (har.has("flagg")) s += `<g class="sy-flagg"><path d="M0 ${tak} v-17" stroke="#c9a24a" stroke-width="1.6"/><path d="M0.8 ${tak - 17} q7 -2 13 2 q-6 3 -13 6 z" fill="#8e2f52"/><path d="M0.8 ${tak - 17} q7 -2 13 2" fill="none" stroke="#c9a24a" stroke-width=".8"/></g>`;
    if (har.has("krans")) s += [-1, 1].map((side) => `<g transform="scale(${side} 1)">${[0, 1, 2, 3, 4].map((k) => {
      const v = (Math.PI * (0.16 + k * 0.1));
      const x = -Math.cos(v) * 46, y = 12 + Math.sin(v) * 7 - k * 0.6;
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="1.8" fill="#e2c174" transform="rotate(${(-30 + k * 12) * 1} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join("")}<path d="M-47 11 Q-30 22 -6 20" fill="none" stroke="#c9a24a" stroke-width="1"/></g>`).join("");
    if (har.has("statue")) s += `<g transform="translate(-62 8)"><rect x="-6" y="-4" width="12" height="6" fill="#bdb49d"/><rect x="-5" y="-6" width="10" height="2" fill="#ece5d3"/><circle cy="-21" r="3" fill="#ece5d3"/><path d="M-3 -18 h6 l1 12 h-8 z" fill="#ece5d3"/><path d="M3 -16 l5 -6" stroke="#ece5d3" stroke-width="2" stroke-linecap="round"/></g>`;
    if (har.has("fakler")) s += [-48, 48].map((x) => `<g transform="translate(${x} 14)"><path d="M-3 0 h6 l-1 -7 h-4 z" fill="#5a4630"/><path d="M-4 -7 h8 l-1 -2 h-6 z" fill="#c9a24a"/><path d="M0 -9 q-4 -5 0 -11 q4 6 0 11" fill="#f2c14e" class="sy-flamme"/></g>`).join("");
    return s;
  }

  // Statuer som brødrene har kjøpt, i en ring rundt agoraen
  function statuer() {
    const l = T.statuer || [];
    return l.map((navn, i) => {
      const v = Math.PI * (1.08 + (i + 0.5) * (0.84 / Math.max(l.length, 1)));
      const x = 500 + Math.cos(v) * 178, y = 432 + Math.sin(v) * 78;
      return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><title>${esc(visningsnavn(navn))}</title>
        <rect x="-7" y="-5" width="14" height="7" fill="#bdb49d"/><rect x="-6" y="-7" width="12" height="2" fill="#ece5d3"/>
        <circle cy="-26" r="3.6" fill="#ece5d3"/><path d="M-4 -22 h8 l1.5 15 h-11 z" fill="#ece5d3"/><path d="M-4 -22 h3 l-1 15 h-3.5 z" fill="#bdb49d"/><path d="M4 -20 l6 -7" stroke="#ece5d3" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.5" cy="-27.5" r="1.8" fill="#c9a24a"/>
        <text y="12" text-anchor="middle" class="sy-statuenavn">${esc(visningsnavn(navn))}</text></g>`;
    }).join("");
  }

  function monument(id, grad) {
    // grad: 1 = ferdig, 0 til 1 = under bygging, null = ikke påbegynt
    if (grad === null) return "";
    const m = "#ece5d3", sk = "#bdb49d", g = "#c9a24a";
    const kol = (x, topp, bunn) => `<rect x="${x - 2.5}" y="${topp}" width="5" height="${bunn - topp}" fill="${m}"/><rect x="${x - 2.5}" y="${topp}" width="1.8" height="${bunn - topp}" fill="${sk}" opacity=".7"/>`;
    let s = "", boks = [0, 0, 0, 0];
    if (id === "agora") {
      boks = [396, 366, 208, 78];
      s = `<ellipse cx="500" cy="420" rx="104" ry="27" fill="#7a7054"/><ellipse cx="500" cy="420" rx="104" ry="27" fill="none" stroke="${m}" stroke-opacity=".5"/><ellipse cx="500" cy="420" rx="70" ry="17" fill="none" stroke="${m}" stroke-opacity=".3"/><ellipse cx="500" cy="420" rx="36" ry="8" fill="none" stroke="${m}" stroke-opacity=".3"/>
        ${[412, 428, 444, 556, 572, 588].map((x) => kol(x, 384, 404)).join("")}<rect x="406" y="379" width="44" height="5" fill="${m}"/><rect x="550" y="379" width="44" height="5" fill="${m}"/><rect x="406" y="404" width="44" height="2.5" fill="${sk}"/><rect x="550" y="404" width="44" height="2.5" fill="${sk}"/>
        <circle cx="500" cy="420" r="5" fill="${g}"/><path d="M500 415 v-12" stroke="${g}" stroke-width="2"/><circle cx="500" cy="401" r="3" fill="#f2c14e" class="sy-flamme"/>`;
    } else if (id === "tempel") {
      boks = [440, 296, 120, 92];
      s = `<ellipse cx="500" cy="388" rx="86" ry="16" fill="#46422b"/><rect x="446" y="378" width="108" height="5" fill="${sk}"/><rect x="450" y="373" width="100" height="5" fill="${m}"/><rect x="454" y="336" width="92" height="37" fill="#221d14"/><rect x="493" y="348" width="14" height="25" fill="#f2c14e"/>
        ${[456, 470, 484, 516, 530, 544].map((x) => kol(x, 336, 373)).join("")}<rect x="450" y="329" width="100" height="7" fill="${m}"/><path d="M446 329 L500 300 L554 329 Z" fill="${m}" stroke="${g}" stroke-width="1.4"/><circle cx="500" cy="318" r="5" fill="${g}"/><path d="M500 300 v-9" stroke="${g}" stroke-width="2"/>`;
    } else if (id === "teater") {
      boks = [286, 384, 108, 62];
      s = [0, 1, 2, 3].map((k) => `<path d="M${296 + k * 9} ${404 + k * 9} A${44 - k * 9} ${20 - k * 4} 0 0 0 ${384 - k * 9} ${404 + k * 9}" fill="none" stroke="${k % 2 ? sk : m}" stroke-width="7" transform="translate(0 -6)"/>`).join("") + `<ellipse cx="340" cy="434" rx="15" ry="5" fill="${g}" opacity=".8"/>`;
    } else if (id === "fyr") {
      boks = [860, 524, 64, 96];
      s = `${grad >= 1 ? `<path d="M892 544 L1010 508 L1010 590 Z" fill="#f2e3b4" opacity=".06"/>` : ""}<ellipse cx="892" cy="612" rx="36" ry="9" fill="#3f3d31"/><ellipse cx="892" cy="610" rx="27" ry="6" fill="#57533f"/>
        <path d="M879 610 L884 556 H900 L905 610 Z" fill="${m}"/><path d="M879 610 L884 556 H889.5 L887 610 Z" fill="${sk}"/><path d="M881 590 H903 M882.6 574 H901.4" stroke="${sk}" stroke-width="1.6"/>
        <rect x="880" y="550" width="24" height="6" fill="${sk}"/><rect x="886" y="537" width="12" height="13" fill="#221d14"/><circle cx="892" cy="544" r="4.4" fill="#f2c14e" class="sy-flamme"/><path d="M883 537 L892 527 L901 537 Z" fill="${g}"/>`;
    } else if (id === "orakel") {
      boks = [353, 299, 64, 56];
      s = `<g transform="translate(-115 -153)"><ellipse cx="500" cy="500" rx="31" ry="7" fill="${sk}"/><ellipse cx="500" cy="498" rx="27" ry="5.6" fill="${m}"/><rect x="489" y="478" width="22" height="20" fill="#221d14"/><circle cx="500" cy="491" r="3.4" fill="#b07cf0" class="sy-flamme"/>
        ${[480, 489, 511, 520].map((x) => kol(x, 477, 498)).join("")}<rect x="475" y="472" width="50" height="5" fill="${m}"/><path d="M476 472 Q500 446 524 472 Z" fill="${m}" stroke="${g}" stroke-width="1.2"/><circle cx="500" cy="457" r="2.4" fill="${g}"/></g>`;
    } else {
      boks = [636, 348, 60, 92];
      s = `<rect x="650" y="420" width="34" height="14" fill="${m}"/><rect x="646" y="432" width="42" height="5" fill="${sk}"/><g fill="#b08d57"><path d="M660 420 L662 392 L672 392 L674 420 Z"/><rect x="659" y="372" width="16" height="22" rx="3"/><circle cx="667" cy="365" r="6.5"/><path d="M675 376 L688 362 L685 359 L673 371 Z"/><path d="M659 376 L652 392 L655 394 L662 380 Z"/></g><path d="M683 359 h10 l-1.5 -7 h-7 z" fill="${g}"/><circle cx="688" cy="350" r="2" fill="#f2c14e" class="sy-flamme"/>`;
    }
    if (grad >= 1) return `<g class="sy-monument" data-monument>${s}</g>`;
    const [bx, by, bw, bh] = boks;
    return `<g class="sy-monument bygges" data-monument><g opacity="${(0.22 + grad * 0.6).toFixed(2)}">${s}</g>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#c9a24a" stroke-dasharray="5 5" stroke-opacity=".7"/>
      <text x="${bx + bw / 2}" y="${by + bh / 2 + 5}" text-anchor="middle" class="sy-prosent">${Math.floor(grad * 100)} %</text></g>`;
  }

  function monumentGrad() {
    const m = T.monument;
    const krav = m ? Object.keys(m.krav) : [];
    return m ? krav.reduce((s, r) => s + Math.min(1, m.gitt[r] / m.krav[r]), 0) / krav.length : 1;
  }

  function kart() {
    let fro = 7;
    const tilf = () => (fro = (fro * 16807) % 2147483647) / 2147483647;
    const stjerner = Array.from({ length: 46 }, () => `<circle cx="${(tilf() * W).toFixed(0)}" cy="${(tilf() * 190).toFixed(0)}" r="${(0.5 + tilf() * 1.1).toFixed(1)}" style="animation-delay:${(tilf() * 5).toFixed(1)}s"/>`).join("");
    const glitter = Array.from({ length: 26 }, () => {
      const y = 222 + tilf() * 400, x = tilf() * W;
      return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} h${(14 + tilf() * 30).toFixed(0)}" style="animation-delay:${(tilf() * 6).toFixed(1)}s"/>`;
    }).join("");
    const kyst = (rx, ry) => {
      const pk = Array.from({ length: 30 }, (_, i) => { const v = (i / 30) * Math.PI * 2, f = 0.965 + tilf() * 0.07; return [500 + Math.cos(v) * rx * f, 412 + Math.sin(v) * ry * f]; });
      const midt = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let d = `M${midt(pk[29], pk[0]).map((x) => x.toFixed(0)).join(" ")}`;
      pk.forEach((pt, i) => { const m = midt(pt, pk[(i + 1) % 30]); d += ` Q${pt[0].toFixed(0)} ${pt[1].toFixed(0)} ${m[0].toFixed(0)} ${m[1].toFixed(0)}`; });
      return d + " Z";
    };
    const kystlinje = kyst(488, 204);
    const f = fase(), P = PALETT[f];
    const bat = (x, y, s, seil = "#ece5d3", tittel = "", vent = 0, merkelapp = "") => `<g transform="translate(${x} ${y}) scale(${s})">${tittel ? `<title>${esc(tittel)}</title>` : ""}${merkelapp ? `<text y="19" text-anchor="middle" class="sy-statuenavn">${esc(merkelapp)}</text>` : ""}<g class="sy-bat" style="animation-delay:${vent}s"><path d="M-16 0 Q0 9 16 0 L12 5 H-12 Z" fill="#3a2a18"/><path d="M0 0 V-20" stroke="#3a2a18" stroke-width="1.6"/><path d="M1 -19 Q12 -12 1 -4 Z" fill="${seil}"/></g></g>`;
    const pl = plasser();
    const tomter = T.spillere.map((sp) => ({ y: pl.get(sp.navn).y, svg: tomt(sp, pl.get(sp.navn), pl.k) })).sort((a, b) => a.y - b.y).map((t) => t.svg).join("");
    // Havnen ligger fast på østkysten. Skip som er på tokt, er borte fra kaia.
    const flaate = T.spillere.filter((sp) => sp.skip);
    const KAI = [[956, 500], [934, 524], [975, 517], [955, 545], [990, 540], [925, 548], [978, 566], [948, 572]];
    const vedKai = flaate.filter((sp) => sp.skip === "kai").slice(0, KAI.length);
    const havna = flaate.length ? `<g class="sy-havn" data-havnkart><title>Havnen</title><path d="M908 498 L966 536" stroke="#3a2a18" stroke-width="9" stroke-linecap="round"/><path d="M908 498 L966 536" stroke="#8a6a45" stroke-width="6" stroke-linecap="round"/><path d="M921 507 v9 M936 517 v9 M951 527 v9" stroke="#3a2a18" stroke-width="2.4"/><ellipse cx="950" cy="535" rx="60" ry="52" fill="transparent"/>
      ${vedKai.map((sp, i) => bat(KAI[i][0], KAI[i][1], 0.62, T.meg && sp.navn === T.meg.navn ? "#e2c174" : "#ece5d3", visningsnavn(sp.navn), (i * 0.7).toFixed(1))).join("")}</g>` : "";
    // Gatene: en allé fra agoraen og ned gjennom byen, en gate per nabolag og to veier opp til Akropolis
    const sisteGate = pl.gater[pl.gater.length - 1];
    const veier = `${sisteGate ? `<path d="M500 ${418 - LOFT} V${sisteGate.y}"/>` : ""}
      ${pl.gater.map((g) => `<path d="M${(g.x1 - 62 * pl.k).toFixed(0)} ${g.y} H${(g.x2 + 62 * pl.k).toFixed(0)}"/>`).join("")}
      ${pl.akropolis.length ? [-1, 1].map((side) => { const ytterst = Math.max(...pl.akropolis.map((x) => (x - 500) * side)); return `<path d="M${500 + side * 104} ${420 - LOFT} Q${500 + side * 190} ${330} ${500 + side * 250} 318 H${(500 + side * (ytterst + 40 * pl.k)).toFixed(0)}"/>`; }).join("") : ""}`;
    const skilt = `<text x="500" y="${296 - LOFT - 12}" text-anchor="middle" class="sy-nabolag">Akropolis</text>
      ${pl.gater.map((g) => `<text x="${(g.x1 - 62 * pl.k - 8).toFixed(0)}" y="${g.y + 3}" text-anchor="end" class="sy-nabolag">${g.navn}</text>`).join("")}`;
    // Skip på tokt seiler ute på havet, med navnet til rederen
    const HAVET = [[64, 262], [120, 600], [936, 262], [30, 318], [236, 626], [968, 318], [770, 624]];
    const ute = flaate.filter((sp) => sp.skip === "ute").slice(0, HAVET.length);
    const paTokt = ute.length
      ? ute.map((sp, i) => { const min = T.meg && sp.navn === T.meg.navn; return `<g class="sy-seiler${min ? " sy-havn" : ""}" ${min ? "data-havnkart" : ""} style="animation-delay:${(-i * 7).toFixed(0)}s">${bat(HAVET[i][0], HAVET[i][1], 0.85, min ? "#e2c174" : "#ece5d3", `${visningsnavn(sp.navn)} er på tokt`, (i * 0.9).toFixed(1), visningsnavn(sp.navn))}</g>`; }).join("")
      : `${bat(64, 262, 0.8)}${bat(120, 600, 1.1)}`;
    // Sol eller måne
    const t = osloTime();
    const solX = f === "dag" ? 150 + Math.min(1, Math.max(0, (t - 8.5) / 9)) * 700 : f === "morgen" ? 170 : 830;
    const solY = f === "dag" ? 150 - Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 8.5) / 9))) * 86 : 204;
    const himmellys = f === "natt"
      ? `<circle cx="838" cy="74" r="62" fill="url(#sy-mane)"/><circle cx="838" cy="74" r="21" fill="#f2e3b4"/><circle cx="846" cy="68" r="19" fill="#151a2a" opacity=".35"/>`
      : `<circle cx="${solX.toFixed(0)}" cy="${solY.toFixed(0)}" r="${f === "dag" ? 70 : 96}" fill="url(#sy-sol)"/><circle cx="${solX.toFixed(0)}" cy="${solY.toFixed(0)}" r="${f === "dag" ? 19 : 24}" fill="${f === "dag" ? "#fff3c4" : "#ffc978"}"/>`;
    const sky = (x, y, s, sek) => `<g class="sy-sky" style="animation-duration:${sek}s; animation-delay:${(-((Date.now() / 1000 + x * 0.4) % sek)).toFixed(0)}s"><g transform="translate(0 ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="46" ry="11"/><ellipse cx="-22" cy="-7" rx="22" ry="10"/><ellipse cx="14" cy="-10" rx="26" ry="13"/></g></g>`;
    const skyer = `<g fill="${f === "dag" ? "#ffffff" : f === "natt" ? "#8d93a8" : "#f4d9c2"}" opacity="${P.sky}">${sky(0, 96, 1, 190)}${sky(260, 150, 0.7, 250)}${sky(520, 70, 1.25, 310)}</g>`;
    const fugler = f === "dag" || f === "morgen"
      ? `<g class="sy-fugler" fill="none" stroke="${f === "dag" ? "#2b3a48" : "#1d1a2a"}" stroke-width="1.6" stroke-linecap="round">${[[150, 70, 0], [118, 46, -11], [205, 96, -23]].map(([y, sek, vent]) => `<g class="sy-fugl" style="animation-duration:${sek}s; animation-delay:${vent}s"><path transform="translate(0 ${y})" d="M-7 0 Q-3.5 -5 0 0 Q3.5 -5 7 0"/></g>`).join("")}</g>` : "";
    // Folk i gatene: de går fram og tilbake langs gatene og opp alleen til agoraen
    const KLAER = ["#8e2f52", "#3f6f8a", "#b5651d", "#5f7339", "#6b4a8a", "#c9a24a", "#9a4a3a"];
    const figur = (i) => `<g transform="scale(${(pl.k * 1.25).toFixed(2)})"><g class="sy-gange"><ellipse cy=".6" rx="3.6" ry="1.1" fill="#000" opacity=".25"/><path d="M-2.4 -7 h4.8 l1.2 7 h-7.2 z" fill="${KLAER[i % KLAER.length]}"/><circle cy="-9.4" r="2.4" fill="#e3c9a4"/>${f === "natt" || f === "kveld" ? `<path d="M3.4 -6 v-5" stroke="#5a4630" stroke-width=".9"/><circle cx="3.4" cy="-12" r="1.5" fill="#f2c14e" class="sy-flamme"/>` : ""}</g></g>`;
    const turer = [];
    pl.gater.forEach((g) => { if (g.x2 - g.x1 > 10) { turer.push([g.x1 - 40 * pl.k, g.y + 2, g.x2 + 40 * pl.k, g.y + 2]); if (g.x2 - g.x1 > 300) turer.push([g.x2 + 30 * pl.k, g.y + 3, g.x1 - 30 * pl.k, g.y + 3]); } });
    if (sisteGate) turer.push([500, 424 - LOFT, 500, sisteGate.y - 4]);
    const antallFolk = roligBevegelse() ? 0 : Math.min(turer.length, f === "natt" ? 2 : 7, Math.max(1, T.spillere.length - 1));
    const folk = turer.slice(0, antallFolk).map(([x1, y1, x2, y2], i) => {
      const sek = Math.max(24, Math.round(Math.hypot(x2 - x1, y2 - y1) / 4.5)) + i * 3;
      return `<g>${figur(i)}<animateMotion dur="${sek}s" repeatCount="indefinite" begin="${(-((Date.now() / 1000 + i * 17) % sek)).toFixed(1)}s" path="M${x1.toFixed(0)} ${y1.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)} L${x1.toFixed(0)} ${y1.toFixed(0)}"/></g>`;
    }).join("");
    // Dagens offer: en flamme over Akropolis som man kan trykke på
    const offermerke = T.meg && T.meg.kanOfre ? `<g class="sy-hurtig" data-hurtig="offer" transform="translate(500 ${296 - LOFT - 50})"><title>Ofre til gudene</title><g class="sy-dupp"><circle r="20" fill="transparent"/><circle r="13" fill="#141310" stroke="#c9a24a" stroke-width="1.4"/><path d="M0 7 q-7 -6 -1.5 -15 q1 4 3.4 4.6 q-.6 -4 2 -6.6 q5.6 9 -3.9 17 z" fill="#f2c14e" class="sy-flamme"/></g></g>` : "";
    const grad = monumentGrad();
    const mon = T.regler.monumenter.map(({ id }) => ({ id, svg: monument(id, T.ferdige.includes(id) ? 1 : T.monument && T.monument.id === id ? grad : null) }));
    const rekke = { orakel: -1, tempel: 0, agora: 1, teater: 2, koloss: 3 };
    const fyret = mon.find((x) => x.id === "fyr");
    mon.splice(mon.indexOf(fyret), 1);
    mon.sort((a, b) => rekke[a.id] - rekke[b.id]);
    return `<svg viewBox="0 ${TOPP} ${W} ${H - TOPP}" preserveAspectRatio="xMidYMid slice" class="sy-kart sy-${f}" role="group" aria-label="Kart over byen">
      <defs>
        <linearGradient id="sy-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.himmel[0]}"/><stop offset=".62" stop-color="${P.himmel[1]}"/><stop offset="1" stop-color="${P.himmel[2]}"/></linearGradient>
        <linearGradient id="sy-hav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.hav[0]}"/><stop offset=".25" stop-color="${P.hav[1]}"/><stop offset="1" stop-color="${P.hav[2]}"/></linearGradient>
        <radialGradient id="sy-land" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="${P.land[0]}"/><stop offset=".7" stop-color="${P.land[1]}"/><stop offset="1" stop-color="${P.land[2]}"/></radialGradient>
        <radialGradient id="sy-sol" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
        <radialGradient id="sy-glod" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2c14e" stop-opacity=".35"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></radialGradient>
        <radialGradient id="sy-mane" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2e3b4" stop-opacity=".5"/><stop offset="1" stop-color="#f2e3b4" stop-opacity="0"/></radialGradient>
      </defs>
      <rect x="-200" y="-900" width="${W + 400}" height="902" fill="${P.himmel[0]}"/><rect x="-200" y="${H - 2}" width="${W + 400}" height="900" fill="${P.hav[2]}"/>
      <rect width="${W}" height="232" fill="url(#sy-himmel)"/>
      ${P.stjerner ? `<g class="sy-stjerner" fill="#f2e3b4" opacity="${P.stjerner}">${stjerner}</g>` : ""}
      ${himmellys}${skyer}${fugler}
      <path d="M0 232 L0 206 L70 178 L130 200 L210 162 L300 204 L360 190 L420 214 L560 216 L640 186 L720 208 L800 170 L880 202 L950 184 L1000 204 L1000 232 Z" fill="${P.fjell}"/>
      <rect y="224" width="${W}" height="${H - 224}" fill="url(#sy-hav)"/>
      ${f === "natt" ? `<path d="M770 232 L800 300 L900 300 L850 232 Z" fill="#f2e3b4" opacity=".06"/>` : f !== "dag" ? `<path d="M${solX - 46} 232 L${solX - 80} 330 L${solX + 80} 330 L${solX + 46} 232 Z" fill="#ffc978" opacity=".1"/>` : ""}
      <g class="sy-glitter" stroke="${f === "dag" ? "#ffffff" : "#f2e3b4"}" stroke-width="1.2" stroke-linecap="round">${glitter}</g>
      ${paTokt}
      <path d="${kystlinje}" fill="#1c2a30" transform="translate(0 7)" opacity="${f === "dag" ? ".35" : ".8"}"/>
      <path d="${kystlinje}" fill="${P.strand}"/>
      <path d="${kystlinje}" fill="url(#sy-land)" transform="translate(500 412) scale(.975 .955) translate(-500 -412)"/>
      <g class="sy-veier" fill="none" stroke="${P.vei}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" opacity=".7">${veier}</g>
      ${skilt}
      <g transform="translate(0 ${-LOFT})">${mon.map((m) => m.svg).join("")}${statuer()}</g>
      ${offermerke}
      <g class="sy-folk">${folk}</g>
      ${tomter}
      <g id="sy-luft"></g>
      ${havna}${fyret ? fyret.svg : ""}
    </svg>`;
  }

  // ---------- Zoom og panorering ----------
  // Visningen er et utsnitt av kartet: z er forstørrelsen (1 = hele øyas bredde), cx og cy er midten.
  let vis = null;
  const ZMAKS = 4;
  const smal = () => window.innerWidth < 760;
  const ramme = () => { const b = rot.querySelector(".sy-kartrull, .sy-kartboks"); return b ? b.getBoundingClientRect() : { width: W, height: HH, left: 0, top: 0 }; };
  function utsnitt(v = vis) {
    const r = ramme(), w = W / v.z, h = w * ((r.height / r.width) || HH / W);
    const x = Math.min(Math.max(v.cx - w / 2, 0), W - w);
    const y = h >= HH ? TOPP + (HH - h) / 2 : Math.min(Math.max(v.cy - h / 2, TOPP), H - h);
    return { x, y, w, h };
  }
  function settVisning() {
    const svg = rot.querySelector(".sy-kart");
    if (!svg) return;
    if (!vis) vis = { z: 1, cx: W / 2, cy: TOPP + HH / 2 };
    const u = utsnitt();
    vis.cx = u.x + u.w / 2;
    if (u.h < HH) vis.cy = u.y + u.h / 2;
    svg.setAttribute("viewBox", `${u.x.toFixed(1)} ${u.y.toFixed(1)} ${u.w.toFixed(1)} ${u.h.toFixed(1)}`);
    svg.classList.toggle("zoomet", vis.z > 1.01);
    const ut = rot.querySelector('[data-zoom="ut"]'), inn = rot.querySelector('[data-zoom="inn"]');
    if (ut) ut.disabled = vis.z <= 1.01;
    if (inn) inn.disabled = vis.z >= ZMAKS - 0.01;
  }
  let glid = 0;
  function zoomTil(z, cx, cy) {
    if (!vis) return;
    z = Math.min(ZMAKS, Math.max(1, z));
    const fra = { ...vis }, start = performance.now(), nr = ++glid;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { vis = { z, cx, cy }; settVisning(); return; }
    const steg = (t) => {
      if (nr !== glid) return;
      const k = Math.min(1, (t - start) / 320), e = 1 - Math.pow(1 - k, 3);
      vis = { z: fra.z + (z - fra.z) * e, cx: fra.cx + (cx - fra.cx) * e, cy: fra.cy + (cy - fra.cy) * e };
      settVisning();
      if (k < 1) requestAnimationFrame(steg);
    };
    requestAnimationFrame(steg);
  }
  // Zoomer med et punkt på skjermen som fast punkt (musepekeren eller midt mellom to fingre)
  function zoomVed(z, klientX, klientY) {
    z = Math.min(ZMAKS, Math.max(1, z));
    const r = ramme(), u = utsnitt(), fx = (klientX - r.left) / r.width, fy = (klientY - r.top) / r.height;
    const wx = u.x + fx * u.w, wy = u.y + fy * u.h, w = W / z, h = w * (r.height / r.width);
    glid++;
    vis = { z, cx: wx - fx * w + w / 2, cy: wy - fy * h + h / 2 };
    settVisning();
  }
  function zoomTilGods(navn) {
    const pl = plasser();
    if (!pl.has(navn)) return;
    const p = paKart(pl.get(navn), pl.krymp);
    const z = Math.max(vis ? vis.z : 1, smal() ? 2.6 : 1.9);
    // På bred skjerm ligger kortet til høyre på kartet, så godset legges litt til venstre for midten
    const w = W / z;
    zoomTil(z, p.x + (kort && !smal() ? w * 0.2 : 0), p.y - 14);
  }
  const zoomknapper = () => `<div class="sy-zoom" role="group" aria-label="Kartvisning">
    <button type="button" data-zoom="inn" aria-label="Zoom inn" title="Zoom inn">+</button>
    <button type="button" data-zoom="ut" aria-label="Zoom ut" title="Zoom ut">&minus;</button>
    <button type="button" data-zoom="alt" aria-label="Vis hele øya" title="Hele øya"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6 V2 H6 M10 2 H14 V6 M14 10 V14 H10 M6 14 H2 V10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
    ${T.meg ? `<button type="button" data-zoom="meg" aria-label="Vis godset mitt" title="Godset mitt"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8 L8 2.6 L14 8 M4 7 V13.4 H12 V7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>` : ""}</div>`;

  // ---------- Kortet på kartet ----------
  // Trykker man på et gods, åpnes et kort oppå kartet med det man kan gjøre der. Da slipper man å bla.
  let kort = null;         // navnet på godset kortet viser
  let sprayApen = false;
  function kortHtml() {
    if (!kort || !T.meg) return "";
    const m = T.meg, sp = T.spillere.find((x) => x.navn === kort), pl = plasser();
    if (!sp || !pl.has(kort)) return "";
    const plass = pl.get(kort), rangtittel = T.regler.ranger[sp.rang] ? T.regler.ranger[sp.rang].tittel : "";
    const hode = (etikett, tittel) => `<button type="button" class="sy-kortlukk" data-lukkkort aria-label="Lukk">&times;</button>
      <p class="sy-etikett">${esc(etikett)}</p><h3>${esc(tittel)}</h3>
      <p class="sy-kortfakta">${IKON.aere}<strong>${tall(sp.aere)}</strong> ære · nr. ${plass.plass} i byen · villa nivå ${sp.bygg.villa}</p>`;
    if (kort === m.navn) {
      const g = pl.grense(kort);
      return `<div class="sy-kort" id="sy-kort">${hode(`Godset ditt · ${plass.nabolag}`, rangtittel || "Godset ditt")}
        ${g ? `<p class="dempet sy-kortnote">${tall(g.mangler)} ære til, så flytter du opp ${esc(g.nabolag)}.</p>` : `<p class="dempet sy-kortnote">Du bor i byens fineste strøk.</p>`}
        ${sp.tagg ? `<p class="sy-kortnote">Tagget av ${esc(visningsnavn(sp.tagg.fra))}: <span class="sy-taggsitat" style="color:${sp.tagg.farge}">${esc(sp.tagg.tekst)}</span></p><button class="knapp sekundar" type="button" data-skrubb>${skrubb ? `Skrubb videre (${skrubb} av ${SKRUBB})` : "Skrubb det bort"}</button>` : ""}
        <button class="knapp sy-host" type="button" data-gjor="host" data-host>Høst</button>
        <div class="sy-kortrad"><a class="liten-knapp" href="hotell.html?rom=${encodeURIComponent(`hjem:${m.navn}`)}">Gå inn i huset</a><button class="liten-knapp" type="button" data-tilpanel>Bygg ut</button></div></div>`;
    }
    return `<div class="sy-kort" id="sy-kort">${hode(`${rangtittel || "Nybygger"} · bor ${plass.nabolag}`, godsNavn(sp.navn))}
      <p class="dempet sy-kortnote">${sp.hjemme ? "Det ryker fra pipa. Noen er hjemme." : "Ingen har vært hjemme det siste døgnet."}${sp.skip === "ute" ? " Skipet er på tokt." : ""}</p>
      ${sp.tagg ? `<p class="sy-kortnote">Tagget av ${esc(visningsnavn(sp.tagg.fra))}: <span class="sy-taggsitat" style="color:${sp.tagg.farge}">${esc(sp.tagg.tekst)}</span></p>` : ""}
      <button class="knapp${sp.skjenketMeg && !sp.skjenket && m.skjenk.kan ? " sy-offer" : ""}" type="button" data-skjenk="${esc(sp.navn)}" ${sp.skjenket || !m.skjenk.kan ? "disabled" : ""}>${sp.skjenket ? "Skjenket i dag" : sp.skjenketMeg ? "Skål tilbake" : "Skjenk et glass"}<small>${sp.skjenket ? "Kom tilbake i morgen" : !m.skjenk.kan ? `For lite ${rn(m.skjenk.hoved)}. Høst først.` : `+${m.skjenk.aere + (sp.skjenketMeg ? m.skjenk.gjengjeldAere : 0)} ære${sp.skjenketMeg ? `, ${esc(visningsnavn(sp.navn))} skjenket deg i dag` : ""}`}</small></button>
      ${naskKnapp(sp, true)}
      <div class="sy-kortrad"><a class="liten-knapp" href="hotell.html?rom=${encodeURIComponent(`hjem:${sp.navn}`)}">Gå inn i huset</a><button class="liten-knapp" type="button" data-spray aria-expanded="${sprayApen}">Spraybøksa</button></div>
      ${sprayApen ? taggSkjema(sp) : ""}</div>`;
  }
  // Nask-knappen: de gratis naskene viser hva man får, de kjøpte er et blindt grep
  // Gratis nask er ett per nabo. Er de brukt opp, eller er naboen allerede nasket, blir det et blindt
  // grep, og det kan tas hos hvem som helst så lenge man har kjøpte nask igjen.
  const blindt = (sp) => T.meg.naskGratis <= 0 || !!(sp && sp.nasket);
  const naskStengt = (sp) => (blindt(sp) ? T.meg.naskKjopt <= 0 : sp.bytte < 5);
  function naskKnapp(sp, kort) {
    const m = T.meg;
    const tekst = blindt(sp) && m.naskKjopt <= 0 ? (sp.nasket ? "Nasket i dag" : "Ikke flere nask i dag") : blindt(sp) ? "Blindt grep"
      : sp.vaktet ? "Nattevakten passer på" : sp.bytte < 5 ? (kort ? "Ingenting å naske" : "Nyhøstet, ingenting å naske") : `Nask ca. ${tall(sp.bytte)} oliven`;
    const under = blindt(sp) && m.naskKjopt > 0 ? `Du ser først etterpå hva du fikk. ${m.naskKjopt} ${m.naskKjopt === 1 ? "kjøpt grep" : "kjøpte grep"} igjen.`
      : `${m.naskIgjen} av ${T.regler.naskPerDag} nask igjen${kort ? "" : " i dag. Eieren får beskjed."}`;
    return `<button class="knapp sekundar" type="button" data-nask="${esc(sp.navn)}" ${naskStengt(sp) ? "disabled" : ""}>${tekst}<small>${under}</small></button>`;
  }
  function tegnKort() {
    const boks = rot.querySelector(".sy-kartboks");
    if (!boks) return;
    boks.querySelector("#sy-kort")?.remove();
    boks.classList.toggle("harkort", !!kort);
    if (kort) boks.insertAdjacentHTML("beforeend", kortHtml());
  }

  // Gjøremål øverst på kartet: hvem som venter på et glass, og hva som ellers er klart
  function neste() {
    const m = T.meg;
    const venter = T.spillere.filter((x) => x.navn !== m.navn && !x.skjenket).sort((a, b) => Number(b.skjenketMeg) - Number(a.skjenketMeg));
    return venter.find((x) => x.navn !== kort) || venter[0] || null;
  }
  function gjoremal() {
    const m = T.meg, igjen = T.spillere.filter((x) => x.navn !== m.navn && !x.skjenket).length;
    const tilbake = T.spillere.filter((x) => x.navn !== m.navn && !x.skjenket && x.skjenketMeg).length;
    const skipHjemme = m.tokt && (m.tokt.hjemme || Date.parse(m.tokt.hjem) <= Date.now());
    return `<div class="sy-gjoremal" aria-label="Dette kan du gjøre nå">
      ${igjen ? `<button type="button" class="sy-brikkeknapp${tilbake ? " viktig" : ""}" data-neste><svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M5 2 h6 l-.8 3 q3 3.6 0 8.4 h-4.4 q-3 -4.8 0 -8.4 z" fill="#c9a24a"/></svg>${igjen} ${igjen === 1 ? "nabo" : "naboer"} venter på et glass</button>` : ""}
      ${skipHjemme ? `<button type="button" class="sy-brikkeknapp viktig" data-havnkart>${IKON.krydder}Skipet er hjemme</button>` : ""}
      <span class="sy-fasemerke">${FASENAVN[fase()]}</span></div>`;
  }

  // ---------- Liv på kartet: snakkebobler og ting som flyr ----------
  const svgNS = "http://www.w3.org/2000/svg";
  const luft = () => rot.querySelector("#sy-luft");
  const godsPunkt = (navn) => { const pl = plasser(); return pl.has(navn) ? { ...paKart(pl.get(navn), pl.krymp), k: pl.k } : null; };
  // Det siste som har skjedd i byen, vises som snakkebobler over huset til den det gjelder
  let bobleNr = 0;
  function boble() {
    const lag = luft();
    if (!lag || !T || !T.logg || document.hidden) return;
    const ferske = T.logg.filter((l) => Date.parse(T.naa) - Date.parse(l.opprettet) < 36 * 3600000 && godsPunkt(l.navn));
    if (!ferske.length) return;
    const l = ferske[bobleNr++ % ferske.length], p = godsPunkt(l.navn);
    let tekst = utenGjest(l.tekst).replace(/^./, (c) => c.toUpperCase());
    if (tekst.length > 40) tekst = `${tekst.slice(0, 38).trimEnd()}…`;
    const tid = tidSiden(l.opprettet), b = Math.max(60, tekst.length * 4.7 + 16);
    const x = Math.min(W - b / 2 - 6, Math.max(b / 2 + 6, p.x)), y = p.y - 96 * p.k - 8;
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "sy-boble");
    g.setAttribute("transform", `translate(${x.toFixed(0)} ${y.toFixed(0)})`);
    g.innerHTML = `<g class="sy-bobleinn"><path d="M${(-b / 2).toFixed(0)} -26 h${b.toFixed(0)} a4 4 0 0 1 4 4 v18 a4 4 0 0 1 -4 4 h${(-(b / 2 - 5) - (x - p.x)).toFixed(0)} l-5 7 l-5 -7 h${(-(b / 2 - 5) + (x - p.x)).toFixed(0)} a4 4 0 0 1 -4 -4 v-18 a4 4 0 0 1 4 -4 z" fill="#f4efe3" stroke="#14130d" stroke-width=".8"/>
      <text y="-14" text-anchor="middle" class="sy-bobletekst">${esc(tekst)}</text><text y="-4.5" text-anchor="middle" class="sy-bobletid">${esc(tid === "nå" ? "akkurat nå" : `for ${tid} siden`)}</text></g>`;
    lag.querySelectorAll(".sy-boble").forEach((x) => x.remove());
    lag.append(g);
    setTimeout(() => g.remove(), 5200);
  }
  // Noe flyr i en bue fra ett gods til et annet (et beger når man skjenker, oliven når man nasker)
  function fly(fra, til, hva) {
    const lag = luft(), a = godsPunkt(fra), b = godsPunkt(til);
    if (!lag || !a || !b || roligBevegelse()) return;
    const ting = hva === "beger" ? `<path d="M-5 -8 h10 l-1.4 5 q5 6 0 14 h-7.2 q-5 -8 0 -14 z" fill="#c9a24a" stroke="#14130d" stroke-width="1"/><path d="M-3 -6 h6" stroke="#8e2f52" stroke-width="2"/>`
      : `<g transform="translate(-9 -9) scale(1.15)">${IKON.oliven.replace('class="sy-ikon"', 'width="16" height="16"')}</g>`;
    const g = document.createElementNS(svgNS, "g");
    g.innerHTML = ting;
    lag.append(g);
    const start = performance.now(), ms = 900, topp = 60 + Math.hypot(b.x - a.x, b.y - a.y) * 0.18;
    const steg = (t) => {
      const k = Math.min(1, (t - start) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const x = a.x + (b.x - a.x) * e, y = a.y - 40 * a.k + (b.y - 40 * b.k - (a.y - 40 * a.k)) * e - Math.sin(Math.PI * e) * topp;
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(e * 360).toFixed(0)}) scale(${(0.9 + Math.sin(Math.PI * e) * 0.5).toFixed(2)})`);
      if (k < 1) requestAnimationFrame(steg);
      else { g.remove(); gnist(b.x, b.y - 40 * b.k); }
    };
    requestAnimationFrame(steg);
  }
  function gnist(x, y) {
    const lag = luft();
    if (!lag || roligBevegelse()) return;
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("transform", `translate(${x.toFixed(0)} ${y.toFixed(0)})`);
    g.setAttribute("class", "sy-gnist");
    g.innerHTML = Array.from({ length: 8 }, (_, i) => `<circle r="2" fill="#f2c14e" style="--dx:${(Math.cos(i * 0.785) * 26).toFixed(0)}px; --dy:${(Math.sin(i * 0.785) * 18 - 8).toFixed(0)}px"/>`).join("");
    lag.append(g);
    setTimeout(() => g.remove(), 800);
  }

  // ---------- Toppen: ressurser og dagens offer ----------
  const brikke = (r) => { const m = T.meg; return `<div class="sy-brikke" data-brikke="${r}" title="${r === "aere" ? "All ære du har fått for å gi til andre" : rn(r)}">${IKON[r]}<strong>${tall(r === "aere" ? m.aere : m.beholdning[r])}</strong><span>${r === "aere" ? "ære" : rn(r)}</span></div>`; };
  function topp() {
    const m = T.meg;
    const prikker = Array.from({ length: 7 }, (_, i) => `<i class="${i < (m.kanOfre ? m.streak % 7 === 0 && m.streak ? 0 : Math.min(m.streak, 6) : m.streak) ? "full" : ""}"></i>`).join("");
    const offer = m.kanOfre
      ? `<button class="knapp sy-offer" type="button" data-gjor="offer">Ofre til gudene<small>${gave(m.nesteOffer)}</small></button>`
      : `<div class="sy-ofret"><span class="sy-etikett">Ofret i dag · dag ${m.streak} av 7</span><span class="sy-prikker">${prikker}</span><small>I morgen: ${gave(m.nesteOffer)}</small></div>`;
    return `<div class="sy-topp"><div class="sy-brikker">${brikke("aere")}</div><div class="sy-toppvenstre"><button class="liten-knapp sy-infoknapp" type="button" data-info>Slik spiller du</button>${endringsknapp()}${offer}</div></div>`;
  }
  // Råvarene står i en stolpe til venstre som følger med når man blar (på mobil: en stripe øverst).
  // Råvarer man ikke har kommet til ennå, vises ikke.
  function beholdning() {
    const m = T.meg;
    const kilde = { honning: "bigard", solv: "gruve", purpur: "havn", krydder: "havn" };
    const kjent = ALLE.filter((r) => !kilde[r] || m.bygg[kilde[r]] > 0 || m.beholdning[r] >= 1);
    return `<aside class="sy-side" aria-label="Råvarene dine"><p class="sy-etikett">Du har</p>${kjent.map(brikke).join("")}</aside>`;
  }

  // ---------- «Slik spiller du» ----------
  function info() {
    const R = T.regler, b = R.bygg;
    const kreves = (id) => `${b[b[id].krever[0]].navn.toLowerCase()} på nivå ${b[id].krever[1]}`;
    const rader = (l) => l.map((c) => `<tr>${c.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("");
    return `
      <p>Symposion er en felles by på en øy. Hver spiller har et gods som produserer råvarer, også når man er borte. Med dem bygger man ut godset, ansetter folk, sender skip på tokt, reiser byens monumenter og innreder rommet sitt i Tafse Hotell.</p>
      <h3>Kartet</h3>
      <p>Zoom med knappene nede til høyre, med to fingre eller ved å dobbelttrykke. Dra i kartet for å flytte deg når du har zoomet inn. Trykk på et gods, så åpnes et kort med alt du kan gjøre der.</p>
      <p>Merkene over husene er snarveier: begeret over en nabo skjenker med ett trykk, olivenboblen over ditt eget gods høster, og flammen over Akropolis er dagens offer. Knappen øverst på kartet tar deg til neste nabo som venter på et glass. Snakkeboblene viser det siste som har skjedd i byen, det ryker fra pipa hos dem som har vært innom det siste døgnet, og skip på tokt seiler ute på havet. Kartet følger klokka, med morgen, dag, kveld og natt.</p>
      <h3>Nabolagene</h3>
      <p>Byen er delt i nabolag etter ære. De fire med mest ære bor på Akropolis, ved tempelet. De neste bor i Midtbyen, rett nedenfor agoraen, og resten i gatene bak. I hver gate står de med mest ære nærmest midten. Får du mer ære enn en nabo, bytter dere plass.</p>
      <h3>Høsting</h3>
      <p>Godset produserer hele tiden, men lageret rommer bare noen timer (3 timer pluss villanivået). Trykk «Høst» før det blir fullt, ellers går resten tapt. Gullringen på kartet viser hvor godset ditt ligger, og en olivenboble dukker opp over det når det er noe å høste.</p>
      <h3>Bygging</h3>
      <ul>
        <li><strong>${b.lund.navn}</strong> gir oliven.</li>
        <li><strong>${b.vingard.navn}</strong> gir vin. Krever ${kreves("vingard")}.</li>
        <li><strong>${b.brudd.navn}</strong> gir marmor. Krever ${kreves("brudd")}.</li>
        <li><strong>${b.bigard.navn}</strong> gir honning. Krever ${kreves("bigard")}.</li>
        <li><strong>${b.gruve.navn}</strong> gir sølv. Krever ${kreves("gruve")}.</li>
        <li><strong>${b.villa.navn}</strong> gjør lageret større og huset staseligere. Fra nivå 2 koster den vin, fra nivå 3 også marmor.</li>
        <li><strong>${b.havn.navn}</strong> gir deg et skip. Krever ${kreves("havn")}.</li>
      </ul>
      <p>Hvert nivå koster 65 % mer enn det forrige. Høyeste nivå er ${R.maksNiva}, og ${b.havn.maks} for havnen.</p>
      <h3>Folkene på godset</h3>
      <p>Ansett folk under «Folkene på godset». Hver arbeider gir ${Math.round(R.ansattProd * 100)} % mer i bygget sitt for hvert nivå, forvalteren gir én time større lager per nivå, og nattevakten gjør at naskere får med seg ${Math.round(R.vaktAndel * 100)} % mindre per nivå. Alle kan forfremmes til nivå ${R.ansattMaks}. De dyreste vil ha lønn i honning og sølv.</p>
      <p>Én gang om dagen kan du holde fest for folkene dine. Den koster en times produksjon av oliven og vin, og honning hvis du har bigård. Festen gir ære, mer jo flere og bedre folk du har, og etterpå jobber hele godset ${Math.round(R.fest.bonus * 100)} % bedre i ${R.fest.varer} timer. Har du havn, kan du holde praktfest i stedet: den koster ${Object.entries(R.fest.prakt.pris).map(([r, n]) => `${n} ${rn(r)}`).join(" og ")} i tillegg, gir dobbel ære og varer dobbelt så lenge.</p>
      <h3>Havnen og toktene</h3>
      <p>Skipet seiler til ${Object.values(T.meg ? T.meg.reisemal : {}).map((x) => `${x.navn} (${x.timer >= 1 ? `${Math.round(x.timer * 10) / 10} t` : `${Math.round(x.timer * 60)} min`})`).join(", ").replace(/, ([^,]*)$/, " eller $1") || "Kreta, Tyros eller Egypt"} og kommer hjem med krydder og purpur, som du ikke kan lage selv. Du betaler lasten når skipet legger fra, og losser det selv når det er hjemme. Velg tokt etter når du kommer innom neste gang. Lasten blir ${Math.round(R.toktLast * 100)} % større for hvert havnenivå. Av og til møter skipet storm eller medvind.</p>
      <h3>Villaen og rommet ditt</h3>
      <table class="tavle"><thead><tr><th>Villanivå</th><th>På kartet</th><th>Rommet i Tafse Hotell</th></tr></thead><tbody>
        ${rader([["1–2", "Hytte", "5 × 5, tregulv"], ["3–4", "Hus med tegltak", "6 × 6, terrakotta"], ["5–7", "Villa med søyler", "7 × 7, marmor"], ["8–10", "Palass", "8 × 8, marmor med gull"]])}
      </tbody></table>
      <p>Møblene til rommet kjøpes for oliven, vin og marmor herfra. Trykk «Gå inn i huset» for å komme dit.</p>
      <h3>Daglig offer</h3>
      <p>Trykk «Ofre til gudene» én gang om dagen. Det koster ingenting, og gaven blir større for hver dag på rad, opp til sju dager. Fra dag tre får du vin, fra dag fem marmor, og dag sju gir dobbelt. Hopper du over en dag, starter rekken på nytt. Dagen skifter ved midnatt.</p>
      <h3>Felles byggverk</h3>
      <p>Alle reiser sammen ${R.monumenter.map((m) => m.navn).join(", ").replace(/, ([^,]*)$/, " og $1")}, ett om gangen. Gi det byggverket trenger under «Felles byggverk». Fyrtårnet og Orakelet krever sølv, krydder og purpur. Hvert ferdige byggverk gir alle 10 % mer produksjon, og hver gave gir deg ære.</p>
      ${KONTOR_PA ? HOTELLHJELP : ""}
      <h3>Naboene</h3>
      <ul>
        <li><strong>Skjenk:</strong> én gang om dagen per nabo. Du gir bort 10 % av det godset ditt produserer i timen, av hver råvare du har nok av, og minst ${R.skjenkMinst} av det godset lager mest av. Du får ${R.skjenkAere} ære. Har naboen allerede skjenket deg i dag (vinrød krukke på kartet), gir det ${R.skjenkAere + R.gjengjeldAere} ære å skjenke tilbake.</li>
        <li><strong>Dagens runde:</strong> skjenk ${R.rundeMal} naboer på én dag, så får du én times avling av alt godset ditt lager, og ${R.rundeAere} ære.</li>
        <li><strong>Nask:</strong> ta litt av en nabos uhøstede oliven, ${R.naskPerDag} ganger om dagen. Eieren får beskjed. Kjøper du «lange fingre» på torget, får du et blindt grep i tillegg: det kan tas hos hvem du vil, også naboer du allerede har nasket fra i dag. Du tar mellom 0 og 50 % av én tilfeldig råvare, og ser først etterpå hva det ble. Det meste er små grep, og bare et fåtall blir et kupp.</li>
        <li><strong>Tagg:</strong> spray en tekst på en nabos hus, ${R.taggPerDag} ganger om dagen. Huset produserer ${Math.round(R.taggStraff * 100)} % mindre til eieren har skrubbet det bort.</li>
      </ul>
      <p>Trykk på et gods på kartet eller et navn på ærestavlen for å besøke.</p>
      <h3>Ære og rang</h3>
      <p>Ære får du bare for å gi: skjenke naboene, ta dagens runde, gi til byggverkene og holde fest for folkene dine. Ære kan ikke brukes på noe, men all ære du har fått, gir rang og pynt på godset. Hver rang legger til noe nytt, og du beholder alt du har fått før:</p>
      <table class="tavle"><thead><tr><th>Rang</th><th>Ære</th><th>Pynt</th></tr></thead><tbody>
        ${rader(R.ranger.map((r) => [r.tittel, r.fra.toLocaleString("nb-NO"), (PYNT[r.pynt] ? PYNT[r.pynt].replace(/^(en|et) /, "").replace(/^./, (c) => c.toUpperCase()) : "") || "·"]))}
      </tbody></table>
      <h3>Torget</h3>
      <p>Under godset ditt kan du kjøpe ${Object.values(R.butikk).map((v) => `${v.navn.toLowerCase()} (${Object.entries(v.pris).map(([r, n]) => `${tall(n)} ${rn(r)}`).join(" og ")})`).join(", ").replace(/, ([^,]*)$/, " og $1")}.</p>`;
  }

  function tips() {
    const m = T.meg;
    const andre = T.spillere.filter((s) => s.navn !== m.navn);
    if (T.spillere.find((s) => s.navn === m.navn)?.tagg) return "Noen har tagget huset ditt! Skrubb det bort, ellers går det ut over avlingen.";
    if (m.tokt && (m.tokt.hjemme || Date.parse(m.tokt.hjem) <= Date.now())) return `Skipet er hjemme fra ${m.tokt.navn}. Loss det i havnen.`;
    const venter = andre.filter((s) => s.skjenketMeg && !s.skjenket);
    if (venter.length && !m.kanOfre) return `${venter.map((s) => visningsnavn(s.navn)).slice(0, 3).join(", ").replace(/, ([^,]*)$/, " og $1")}${venter.length > 3 ? " og flere" : ""} har skjenket deg i dag. Skjenk tilbake for ekstra ære.`;
    if (m.kanOfre) return "Gudene venter på dagens offer. Kom innom hver dag, så vokser gaven.";
    if (lagerSum() >= 15) return "Avlingen er klar. Trykk på «Høst».";
    const rad = Object.keys(T.regler.bygg).find((id) => m.apen[id] && harRad(m.kost[id]));
    if (rad) return `Du har råd til å ${m.bygg[rad] ? "utvide" : "anlegge"} ${T.regler.bygg[rad].navn.toLowerCase()}.`;
    if (m.bygg.havn && !m.tokt) return "Skipet ligger til kai. Send det på tokt.";
    if (andre.some((s) => !s.skjenket)) return m.skjenk.runde.gjort < m.skjenk.runde.mal ? `Skjenk ${m.skjenk.runde.mal - m.skjenk.runde.gjort} naboer til, så tar du dagens runde og får én times avling.` : "Trykk på godset til en av de andre og skjenk et glass. Det gir mye ære.";
    if (!andre.length) return "Du er den første i byen. Få med deg de andre!";
    return "Godset jobber for deg mens du er borte. Kom tilbake før lageret er fullt.";
  }

  function fulltOm() {
    const m = T.meg;
    const t = Math.max(...RESS.filter((r) => m.rater[r] > 0).map((r) => (m.tak[r] - lager(r)) / m.rater[r]));
    if (!(t > 0.01)) return "Lageret er fullt. Høst nå!";
    const min = Math.ceil(t * 60);
    return `Lageret er fullt om ${min >= 60 ? `${Math.floor(min / 60)} t ${min % 60} min` : `${min} min`}`;
  }

  // ---------- Panelet under kartet ----------
  function byggKort(id) {
    const m = T.meg, regel = T.regler.bygg[id], niva = m.bygg[id];
    const k = m.kost[id];
    if (!m.apen[id]) {
      const [kr, nv] = regel.krever;
      return `<article class="sy-bygg last"><h4>${regel.navn}</h4><p class="dempet">Låses opp når ${T.regler.bygg[kr].navn.toLowerCase()} er på nivå ${nv}.</p></article>`;
    }
    const r = regel.gir;
    const info = r
      ? niva ? `<p class="sy-rate">${IKON[r]} ${tall(m.rater[r])} ${rn(r)} i timen</p><div class="sy-lager"><span data-lagerstrek="${r}"></span></div><p class="sy-lagertall"><span data-lagertall="${r}"></span> av ${tall(m.tak[r])} på lager</p>`
             : `<p class="dempet">Gir ${rn(r)}. ${{ vin: "Trengs til større bygg og til monumentet.", marmor: "Trengs til villaen og til monumentet.", honning: "Trengs til tokt, lønninger og havn.", solv: "Trengs til lønninger, havn og de siste byggverkene." }[r]}</p>`
      : id === "havn"
        ? niva ? `<p class="sy-rate">Lasten er ${Math.round(T.regler.toktLast * 100 * (niva - 1))} % større</p><p class="dempet">Hvert nivå gir ${Math.round(T.regler.toktLast * 100)} % mer last.${niva < 2 ? " Nivå 2 åpner Egypt." : ""}</p>`
               : `<p class="dempet">Gir deg et skip. Toktene henter hjem krydder og purpur.</p>`
        : `<p class="sy-rate">Lageret rommer ${m.takTimer} timer</p><p class="dempet">Hvert nivå gir én time til, og et staseligere hus.</p>`;
    const nesteRate = r && k && m.nesteRater[r] !== undefined ? m.nesteRater[r] : null;
    const neste = !k ? "" : nesteRate !== null
      ? `<p class="sy-neste">${niva ? "Neste nivå" : "Nivå 1"}: ${IKON[r]} ${tall(nesteRate)} i timen${niva ? ` (+${tall(nesteRate - m.rater[r]) === "0" ? "1" : tall(Math.round(nesteRate - m.rater[r]))})` : ""}</p>`
      : id === "villa" ? `<p class="sy-neste">Neste nivå: lageret rommer ${m.takTimer + 1} timer</p>`
      : id === "havn" && niva ? `<p class="sy-neste">Neste nivå: ${Math.round(T.regler.toktLast * 100 * niva)} % større last</p>` : "";
    const knapp = k
      ? `${neste}<button class="liten-knapp sy-utvid${harRad(k) ? " sy-rad" : ""}" type="button" data-bygg="${id}" ${harRad(k) ? "" : "disabled"}>${niva ? "Utvid" : "Anlegg"} · ${pris(k)}</button>`
      : `<p class="sy-etikett">Høyeste nivå</p>`;
    return `<article class="sy-bygg"><h4>${regel.navn} <span>${niva ? `nivå ${niva}` : ""}</span></h4>${info}${knapp}</article>`;
  }

  function rangOgButikk() {
    const m = T.meg, R = T.regler.ranger;
    const neste = R[m.rang + 1];
    const fra = R[m.rang].fra;
    const andel = neste ? Math.min(100, ((m.aere - fra) / (neste.fra - fra)) * 100) : 100;
    const vare = (id) => {
      const v = T.regler.butikk[id];
      let status = "", sperret = !harRad(v.pris);
      if (v.perDag) { const n = m.kjopt[id]; status = `${n} av ${v.perDag} kjøpt i dag`; if (n >= v.perDag) sperret = true; }
      if (id === "slave" && m.slaveTil) status = `Jobber til ${new Date(m.slaveTil).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}`;
      if (id === "statue" && m.kjopt.statue) { status = "Står på agoraen"; sperret = true; }
      return `<article class="sy-vare"><h4>${esc(v.navn)}</h4><p>${esc(v.tekst)}</p>${status ? `<p class="sy-varestatus">${esc(status)}</p>` : ""}
        <button class="liten-knapp sy-utvid${sperret ? "" : " sy-rad"}" type="button" data-kjop="${id}" ${sperret ? "disabled" : ""}>${id === "slave" && m.slaveTil ? "Forleng" : "Kjøp"} · ${pris(v.pris)}</button></article>`;
    };
    return `<div class="sy-rangboks">
      <div class="sy-rangtopp"><div><p class="sy-etikett">Din rang</p><h3>${esc(R[m.rang].tittel)}</h3>
        <p class="dempet">${tall(m.aere)} ære${neste ? ` · ${tall(neste.fra - m.aere)} til ${neste.tittel.toLowerCase()}, som gir ${PYNT[neste.pynt]}` : " · Høyeste rang i byen"}</p>
        <p class="dempet sy-butikkfot">Ære får du for å gi: skjenke naboene, gi til byggverkene og holde fest for folkene dine.</p>
        <p class="dempet sy-butikkfot">${(() => { const pl = plasser(), p = pl.get(m.navn), g = pl.grense(m.navn); return `Du bor ${p.nabolag}${g ? `, og mangler ${tall(g.mangler)} ære på å flytte opp ${g.nabolag === "på Akropolis" ? "til Akropolis" : g.nabolag.replace(/^i /, "til ")}` : ""}. Nabolagene følger æren: de fire med mest ære bor på Akropolis.`; })()}</p></div></div>
      <div class="sy-lager sy-rangstrek"><span style="width:${andel}%"></span></div>
      <p class="sy-etikett" style="margin-top:18px">Torget</p>
      <div class="sy-butikk">${Object.keys(T.regler.butikk).map(vare).join("")}</div></div>`;
  }

  // Avtalene fra Tafse Hotell som gjelder godset. De kjøpes for denarer i hotellet.
  function hotellet() {
    const a = T.meg.avtaler || [], aktive = a.filter((x) => x.til);
    const dag = (iso) => new Date(iso).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
    return `<div class="sy-rangboks sy-hotellet"><div class="sy-fest${aktive.length ? " paa" : ""}"><div><h4>Avtaler med Tafse Hotell</h4>
      ${aktive.length ? `<ul class="sy-avtaler">${aktive.map((x) => `<li><strong>${esc(x.navn)}</strong> til ${dag(x.til)}. ${esc(x.tekst)}</li>`).join("")}</ul>`
        : `<p class="dempet">Ingen avtaler nå. I hotellet tjener du denarer på leie fra rommet og salg til baren, og bruker dem på avtaler som gir godset 10 % mer av alt, større lager eller raskere tokt.</p>`}</div>
      <a class="knapp sekundar" href="hotell.html">Gå til hotellet</a></div></div>`;
  }

  function folkene() {
    const m = T.meg, R = T.regler;
    const kort = Object.entries(R.ansatte).map(([id, a]) => {
      const x = m.ansatte[id];
      if (!x.apen) return a.bygg ? "" : `<article class="sy-vare sy-folk last"><h4>${esc(a.navn)}</h4><p>Vil ha ${R.bygg[x.krever[0]].navn.toLowerCase()} på nivå ${x.krever[1]} før han tar jobben.</p></article>`;
      const ress = a.bygg ? R.bygg[a.bygg].gir : null;
      const virk = (n) => ress ? `+${Math.round(R.ansattProd * 100 * n)} % ${rn(ress)}` : id === "forvalter" ? `+${n} t lager` : `Naskere får ${Math.round(R.vaktAndel * 100 * n)} % mindre`;
      const prikker = Array.from({ length: R.ansattMaks }, (_, i) => `<i class="${i < x.niva ? "full" : ""}"></i>`).join("");
      const knapp = x.kost
        ? `<button class="liten-knapp sy-utvid${harRad(x.kost) ? " sy-rad" : ""}" type="button" data-ansett="${id}" ${harRad(x.kost) ? "" : "disabled"}>${x.niva ? "Forfrem" : "Ansett"} · ${pris(x.kost)}</button>`
        : `<p class="sy-etikett">Kan ikke forfremmes mer</p>`;
      return `<article class="sy-vare sy-folk${x.niva ? " ansatt" : ""}"><h4>${esc(a.navn)}<span class="sy-prikker">${prikker}</span></h4><p>${esc(a.tekst)}</p>
        <p class="sy-varestatus">${x.niva ? `Nå: ${virk(x.niva)}` : "Ikke ansatt"}${x.kost ? ` · neste nivå: ${virk(x.niva + 1)}` : ""}</p>${knapp}</article>`;
    }).join("");
    const F = m.fest;
    const festknapp = (f, prakt) => `<button class="knapp${!F.holdt && harRad(f.pris) ? "" : " sekundar"}" type="button" data-fest="${prakt ? "prakt" : "vanlig"}" ${F.holdt || !harRad(f.pris) ? "disabled" : ""}>${prakt ? "Hold praktfest" : "Hold fest"}<small>+${f.aere} ære · koster ${pris(f.pris)}</small><small class="sy-festgevinst">Gir ca. ${gave(f.gevinst)} over ${f.timer} t</small></button>`;
    const festen = !F.ansatte ? "" : F.til
      ? `<div class="sy-fest paa"><div><h4>Det er fest på godset</h4><p class="dempet">Alle jobber ${Math.round(F.bonus * 100)} % bedre til ${new Date(F.til).toLocaleString("nb-NO", { weekday: "long", hour: "2-digit", minute: "2-digit" })}.</p></div></div>`
      : `<div class="sy-fest"><div><h4>Hold fest for folkene</h4><p class="dempet">${F.holdt ? "Folkene har festet nok for i dag. Ny fest i morgen." : `Festen gir ære, og hele godset jobber ${Math.round(F.bonus * 100)} % bedre etterpå. Den betaler seg hvis du høster før lageret blir fullt.${F.prakt ? " Praktfesten byr på krydder og purpur, og gir dobbelt." : ""}`}</p></div>
        ${F.holdt ? "" : `<div class="sy-festknapper">${festknapp(F, false)}${F.prakt ? festknapp(F.prakt, true) : ""}</div>`}</div>`;
    return `<div class="sy-rangboks" id="sy-folk"><p class="sy-etikett">Folkene på godset</p>
      <p class="dempet sy-butikkfot">Ansatte gjør godset mer effektivt. De kan forfremmes fem ganger.</p>${festen}<div class="sy-butikk">${kort}</div></div>`;
  }

  const varighet = (timer) => (timer >= 1 ? `${Math.round(timer * 10) / 10} t`.replace(".", ",") : `${Math.round(timer * 60)} min`);
  function klokke(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000)), t = Math.floor(s / 3600), min = Math.floor((s % 3600) / 60);
    return t ? `${t} t ${min} min` : min ? `${min} min ${s % 60} s` : `${s} s`;
  }
  function havnen() {
    const m = T.meg;
    if (!m.bygg.havn) return "";
    let inn;
    if (m.tokt) {
      const hjemme = m.tokt.hjemme || Date.parse(m.tokt.hjem) <= Date.now();
      inn = `<div class="sy-tokt-ute"><div><h4>${hjemme ? `Skipet er hjemme fra ${esc(m.tokt.navn)}` : `Skipet er på tokt til ${esc(m.tokt.navn)}`}</h4>
        <p class="dempet" data-tokttid>${hjemme ? "Lasten venter på kaia." : ""}</p></div>
        <button class="knapp${hjemme ? " sy-offer" : ""}" type="button" data-gjor="loss" data-loss ${hjemme ? "" : "disabled"}>Loss skipet</button></div>`;
    } else {
      inn = `<div class="sy-butikk">${Object.entries(m.reisemal).map(([id, x]) => {
        if (!x.apen) return `<article class="sy-vare last"><h4>${esc(x.navn)}</h4><p>Krever havn på nivå ${x.havn}.</p></article>`;
        const far = Object.entries(x.gir).map(([r, [a, b]]) => `<span class="sy-pris">${a}–${b}${IKON[r]}</span>`).join(" ");
        return `<article class="sy-vare"><h4>${esc(x.navn)}<span class="sy-toktvarighet">${varighet(x.timer)}</span></h4><p>Hjem med ${far}</p>
          <button class="liten-knapp sy-utvid${harRad(x.pris) ? " sy-rad" : ""}" type="button" data-tokt="${id}" ${harRad(x.pris) ? "" : "disabled"}>Send skipet · ${pris(x.pris)}</button></article>`;
      }).join("")}</div>`;
    }
    return `<div class="sy-rangboks" id="sy-havn"><p class="sy-etikett">Havnen</p>
      <p class="dempet sy-butikkfot">Skipet henter krydder og purpur. Velg tokt etter når du kommer innom neste gang.</p>${inn}</div>`;
  }

  function minTagg() {
    const t = T.spillere.find((s) => s.navn === T.meg.navn)?.tagg;
    if (!t) return "";
    return `<div class="sy-taggvarsel"><div><p class="sy-etikett">Huset ditt er tagget</p>
      <p><strong>${esc(visningsnavn(t.fra))}</strong> sprayet <span class="sy-taggsitat" style="color:${t.farge}">${esc(t.tekst)}</span> på villaen din. Godset produserer ${Math.round(T.regler.taggStraff * 100)} % mindre til det er vasket bort.</p></div>
      <button class="knapp" type="button" data-skrubb>${skrubb ? `Skrubb videre (${skrubb} av ${SKRUBB})` : "Skrubb det bort"}</button></div>`;
  }

  function taggSkjema(sp) {
    const m = T.meg;
    if (sp.tagg) return `<div class="sy-taggboks"><p class="sy-etikett">Spraybøksa</p><p>Huset er allerede tagget av <strong>${esc(visningsnavn(sp.tagg.fra))}</strong>: <span class="sy-taggsitat" style="color:${sp.tagg.farge}">${esc(sp.tagg.tekst)}</span>. ${esc(visningsnavn(sp.navn))} må vaske før noen kan tagge igjen.</p></div>`;
    const tom = m.taggIgjen <= 0 || sp.tagget;
    return `<form class="sy-taggboks" data-taggskjema="${esc(sp.navn)}"><p class="sy-etikett">Spraybøksa · ${m.taggIgjen} av ${T.regler.taggPerDag} tagger igjen i dag</p>
      <div class="sy-taggrad"><input type="text" name="tekst" maxlength="${T.regler.taggMaks}" placeholder="Skriv noe på veggen" autocomplete="off" ${tom ? "disabled" : ""} required>
      <div class="sy-farger" role="radiogroup" aria-label="Farge">${FARGER.map((f) => `<button type="button" class="sy-farge${f === taggFarge ? " valgt" : ""}" data-farge="${f}" style="background:${f}" aria-label="Farge" aria-checked="${f === taggFarge}" role="radio" ${tom ? "disabled" : ""}></button>`).join("")}</div>
      <button class="knapp" type="submit" ${tom ? "disabled" : ""}>${sp.tagget ? "Tagget i dag" : m.taggIgjen <= 0 ? "Tom for maling" : "Tagg huset"}</button></div>
      <p class="dempet sy-taggfot">Huset produserer ${Math.round(T.regler.taggStraff * 100)} % mindre til eieren vasker. Eieren får beskjed.</p></form>`;
  }

  const skjenkTekst = () => Object.entries(T.meg.skjenk.gave).map(([r, n]) => `${tall(n)} ${rn(r)}`).join(", ").replace(/, ([^,]*)$/, " og $1");

  // Dagens runde: framdrift mot bonusen for å skjenke mange nok på én dag
  function runde() {
    const r = T.meg.skjenk.runde;
    if (!r.mal) return "";
    const ferdig = r.gjort >= r.mal;
    const prikker = Array.from({ length: r.mal }, (_, i) => `<i class="${i < r.gjort ? "full" : ""}"></i>`).join("");
    return `<div class="sy-runde${ferdig ? " ferdig" : ""}"><span class="sy-etikett">Dagens runde</span><span class="sy-prikker">${prikker}</span>
      <span class="dempet">${ferdig ? "Runden er tatt i dag. Ny runde i morgen." : `Skjenk ${r.mal - r.gjort} ${r.mal - r.gjort === 1 ? "nabo" : "naboer"} til og få ${gave(r.fikk)} og +${r.aere} ære.`}</span></div>`;
  }

  function panel() {
    const m = T.meg;
    if (!valgt || valgt === m.navn) {
      // Et bygg vises når det er åpent, eller når bygget det krever, er anlagt
      const synlige = Object.keys(T.regler.bygg).filter((id) => { const k = T.regler.bygg[id].krever; return !k || m.apen[id] || m.bygg[id] || (k[0] === "villa" ? m.bygg.villa >= k[1] - 2 : m.bygg[k[0]] > 0); });
      return `<section class="sy-panel">
        <div class="sy-panelhode"><div><p class="sy-etikett">Godset ditt</p><p class="sy-fullt" data-fullt></p></div>
          <div class="sy-hodeknapper"><a class="liten-knapp" href="hotell.html?rom=${encodeURIComponent(`hjem:${m.navn}`)}">Gå inn i huset</a>
          <button class="knapp sy-host" type="button" data-gjor="host" data-host>Høst</button></div></div>
        ${minTagg()}
        <div class="sy-byggliste">${synlige.map(byggKort).join("")}</div>
        ${KONTOR_PA ? hotellet() : ""}${havnen()}${folkene()}${rangOgButikk()}</section>`;
    }
    const sp = T.spillere.find((s) => s.navn === valgt);
    if (!sp) return `<section class="sy-panel"><p class="sy-etikett">Ledig tomt</p><p>${esc(valgt)} har ikke sjekket inn ennå.</p><button class="liten-knapp" type="button" data-hjem>Til godset mitt</button></section>`;
    const b = sp.bygg;
    return `<section class="sy-panel">
      <div class="sy-panelhode"><div><p class="sy-etikett">På besøk</p><h3>${esc(godsNavn(sp.navn))}</h3>
        <p class="dempet">Bor ${plasser().get(sp.navn).nabolag} · villa nivå ${b.villa} · olivenlund ${b.lund}${b.vingard ? ` · vingård ${b.vingard}` : ""}${b.brudd ? ` · marmorbrudd ${b.brudd}` : ""}${b.bigard ? ` · bigård ${b.bigard}` : ""}${b.gruve ? ` · sølvgruve ${b.gruve}` : ""}${b.havn ? ` · havn ${b.havn}${sp.skip === "ute" ? " (skipet er ute)" : ""}` : ""}${sp.ansatte ? ` · ${sp.ansatte} ansatte` : ""} · ${tall(sp.aere)} ære${sp.hjemme ? "" : " · ikke hjemme på en stund"}</p></div>
        <div class="sy-hodeknapper"><a class="liten-knapp" href="hotell.html?rom=${encodeURIComponent(`hjem:${sp.navn}`)}">Gå inn i huset</a>
        <button class="liten-knapp" type="button" data-hjem>Til godset mitt</button></div></div>
      <div class="sy-besok">
        <button class="knapp${sp.skjenketMeg && !sp.skjenket && m.skjenk.kan ? " sy-offer" : ""}" type="button" data-skjenk="${esc(sp.navn)}" ${sp.skjenket || !m.skjenk.kan ? "disabled" : ""}>${sp.skjenket ? "Skjenket i dag" : sp.skjenketMeg ? "Skjenk tilbake" : "Skjenk et glass vin"}<small>${sp.skjenket ? "Kom igjen i morgen"
          : !m.skjenk.kan ? `Du har for lite ${rn(m.skjenk.hoved)} til å skjenke. Høst først.`
          : sp.skjenketMeg ? `${esc(visningsnavn(sp.navn))} skjenket deg i dag. Du gir ${skjenkTekst()} og får +${m.skjenk.aere + m.skjenk.gjengjeldAere} ære`
          : `Du gir ${skjenkTekst()} og får +${m.skjenk.aere} ære`}</small></button>
        ${naskKnapp(sp, false)}
      </div>
      ${runde()}
      ${taggSkjema(sp)}</section>`;
  }

  function monumentPanel() {
    const m = T.monument;
    if (!m) return `<section class="sy-boks"><p class="sy-etikett">Byens monumenter</p><h3>Alt er reist</h3><p class="dempet">Byen er fullført, og alle produserer ${Math.round((T.bonus - 1) * 100)} % mer. Nye byggverk kommer.</p></section>`;
    const nr = T.regler.monumenter.findIndex((x) => x.id === m.id) + 1;
    const rader = Object.keys(m.krav).map((r) => {
      const igjen = m.krav[r] - m.gitt[r], har = Math.floor(T.meg.beholdning[r] || 0);
      const knapper = igjen <= 0 ? `<span class="sy-etikett">Fullt</span>` : [50, 250].filter((n) => n < Math.min(har, igjen)).map((n) => `<button class="liten-knapp" type="button" data-gi="${r}" data-antall="${n}">Gi ${n}</button>`).join("") +
        `<button class="liten-knapp" type="button" data-gi="${r}" data-antall="${Math.min(har, igjen)}" ${har > 0 ? "" : "disabled"}>Gi ${har > 0 ? tall(Math.min(har, igjen)) : "alt"}</button>`;
      return `<div class="sy-krav"><div class="sy-kravtekst">${IKON[r]}<span>${tall(m.gitt[r])} av ${tall(m.krav[r])} ${rn(r)}</span></div><div class="sy-lager"><span style="width:${Math.min(100, (m.gitt[r] / m.krav[r]) * 100)}%"></span></div><div class="sy-giknapper">${knapper}</div></div>`;
    }).join("");
    const topp3 = T.bidrag.slice(0, 5).map((b, i) => `<li><span>${i + 1}. ${esc(visningsnavn(b.navn))}</span><span>${tall(b.verdi)}</span></li>`).join("");
    return `<section class="sy-boks" id="sy-monument"><p class="sy-etikett">Felles byggverk ${nr} av ${T.regler.monumenter.length}</p><h3>${esc(m.navn)}</h3>
      <p class="dempet">${esc(T.monument.tekst)} Når det står ferdig, produserer alle 10 % mer. Hver gave gir deg ære.</p>${rader}
      ${topp3 ? `<p class="sy-etikett" style="margin-top:16px">Største givere</p><ol class="sy-givere">${topp3}</ol>` : ""}</section>`;
  }

  function tidSiden(iso) {
    const min = Math.max(0, Math.round((Date.parse(T.naa) - Date.parse(iso)) / 60000));
    return min < 1 ? "nå" : min < 60 ? `${min} min` : min < 1440 ? `${Math.floor(min / 60)} t` : `${Math.floor(min / 1440)} d`;
  }

  function sidefelt() {
    const rang = T.spillere.slice().sort((a, b) => b.aere - a.aere);
    return `<section class="sy-boks"><p class="sy-etikett">Ærestavlen</p>
        <ol class="sy-givere sy-rang">${rang.map((s, i) => `<li class="${s.navn === T.meg.navn ? "meg" : ""}"><button type="button" class="lenkeknapp" data-velg="${esc(s.navn)}">${i + 1}. ${esc(visningsnavn(s.navn))}</button>${s.rang ? `<span class="sy-litentittel">${esc(T.regler.ranger[s.rang].tittel)}</span>` : ""}<span class="sy-rangpoeng">${tall(s.aere)} ${IKON.aere}</span></li>`).join("")}</ol>
        <p class="sy-etikett" style="margin-top:20px">Byens røst</p>
        <ul class="sy-logg">${T.logg.map((l) => `<li><strong>${esc(visningsnavn(l.navn))}</strong> ${esc(utenGjest(l.tekst))} <span>${tidSiden(l.opprettet)}</span></li>`).join("") || `<li class="dempet">Stille i gatene.</li>`}</ul></section>`;
  }

  // ---------- Tegn alt ----------
  function tegn() {
    if (!T.meg) {
      rot.innerHTML = `<div class="sy-kartboks sy-kartrull">${kart()}<div class="sy-velkommen"><p class="overline">En ny by reiser seg</p><h2>Bygg Symposion sammen</h2>
        <p>Flytt inn, så får du et lite gods med en olivenlund på øya. Høst, bygg ut og hjelp de andre. Sammen reiser dere byens monumenter.</p>
        <div class="sy-velkomstknapper"><button class="knapp" type="button" data-gjor="flytt-inn">Flytt inn</button><button class="liten-knapp" type="button" data-info>Slik spiller du</button></div>
        <p class="dempet">${T.spillere.length ? `${T.spillere.length} har flyttet inn så langt.` : "Bli første mann i byen."}</p></div></div>`;
      vis = null; settVisning();
      return;
    }
    rot.innerHTML = `<div class="sy-oppsett">${beholdning()}<div class="sy-hoved">${topp()}
      <div class="sy-kartboks${kort ? " harkort" : ""}"><div class="sy-kartflate"><div class="sy-kartrull">${kart()}</div>${gjoremal()}${zoomknapper()}<div class="sy-toast" id="sy-toast" role="status"></div></div>${kortHtml()}</div>
      <p class="sy-tips" id="sy-tips"></p>
      <div id="sy-panel">${panel()}</div>
      <div class="sy-to">${monumentPanel()}${sidefelt()}</div></div></div>`;
    settVisning();
    tikk();
  }

  // Oppdaterer det som endrer seg hvert sekund, uten å tegne alt på nytt
  function tikk() {
    if (!T || !T.meg) return;
    for (const r of RESS) {
      const l = lager(r), tak = T.meg.tak[r];
      const strek = rot.querySelector(`[data-lagerstrek="${r}"]`);
      if (strek) { strek.style.width = `${tak ? Math.min(100, (l / tak) * 100) : 0}%`; strek.classList.toggle("full", tak > 0 && l >= tak - 0.5); }
      const t = rot.querySelector(`[data-lagertall="${r}"]`);
      if (t) t.textContent = tall(l);
    }
    const sum = lagerSum();
    const deler = RESS.filter((r) => Math.floor(lager(r)) > 0).map((r) => `${tall(lager(r))} ${rn(r)}`);
    rot.querySelectorAll("[data-host]").forEach((host) => {
      host.innerHTML = sum > 0 ? `Høst<small>${deler.join(", ")}</small>` : `Høst<small>Ingenting ennå</small>`;
      host.disabled = sum <= 0 || opptatt;
      host.classList.toggle("klar", sum >= 15);
    });
    const klar = rot.querySelector("[data-klar]");
    if (klar) klar.toggleAttribute("hidden", sum < 15);
    const f = rot.querySelector("[data-fullt]");
    if (f) f.textContent = fulltOm();
    const tk = T.meg.tokt;
    if (tk && !tk.hjemme) {
      const igjen = Date.parse(tk.hjem) - (Date.parse(T.naa) + (Date.now() - hentet));
      const tt = rot.querySelector("[data-tokttid]");
      if (tt) tt.textContent = igjen > 0 ? `Hjemme om ${klokke(igjen)}` : "Legger til kai …";
      if (igjen <= 0 && !opptatt && !toktSjekk) { toktSjekk = true; hent(true).finally(() => (toktSjekk = false)); }
    }
    const tp = document.getElementById("sy-tips");
    if (tp) tp.textContent = tips();
  }

  let toktSjekk = false;
  let toastTid = null;
  function toast(tekst, feil) {
    const t = document.getElementById("sy-toast");
    if (!t) return;
    t.textContent = tekst;
    t.className = `sy-toast vis${feil ? " feil" : ""}`;
    clearTimeout(toastTid);
    toastTid = setTimeout(() => (t.className = "sy-toast"), 3200);
  }

  function sprett(tekst) {
    const boks = rot.querySelector(".sy-kartrull");
    const pl = plasser();
    if (!boks || !pl.has(T.meg.navn)) return;
    const p = paKart(pl.get(T.meg.navn), pl.krymp);
    const d = document.createElement("div");
    d.className = "sy-sprett";
    d.textContent = tekst;
    const u = utsnitt();
    d.style.left = `${Math.min(92, Math.max(8, ((p.x - u.x) / u.w) * 100))}%`;
    d.style.top = `${Math.min(85, Math.max(4, ((p.y - 70 * pl.k - u.y) / u.h) * 100))}%`;
    boks.append(d);
    setTimeout(() => d.remove(), 1600);
  }

  function etterHandling() {
    const s = T.sist;
    if (!s) return;
    if (s.type === "host") { if (Object.keys(s.fikk).length) { sprett(gave(s.fikk)); } }
    else if (s.type === "offer") { sprett(gave(s.fikk)); toast(`Gudene er fornøyde. Dag ${s.streak} av 7 på rad.`); }
    else if (s.type === "bygg") toast(`${T.regler.bygg[s.bygg].navn} er nå på nivå ${s.niva}.`);
    else if (s.type === "skjenk") {
      fly(T.meg.navn, s.til, "beger");
      toast(`${s.gjengjeld ? "Gjengjeldt skål" : "Skål"}, ${visningsnavn(s.til)}! +${s.aere} ære.`);
      if (s.runde) setTimeout(() => { sprett(gave(s.runde.fikk)); toast(`Dagens runde er tatt! ${gave(s.runde.fikk)} og +${s.runde.aere} ære.`); }, 1800);
    }
    else if (s.type === "grep") {
      const ting = gave(s.fikk);
      if (s.utfall === "tomt") toast(`Du rotet i lageret til ${visningsnavn(s.til)}, men fikk ikke med deg noe.`, true);
      else { fly(s.til, T.meg.navn, Object.keys(s.fikk)[0]); sprett(ting); toast(s.utfall === "kupp" ? `Kupp! ${s.prosent} % av lageret: ${ting} fra ${visningsnavn(s.til)}.` : `Blindt grep hos ${visningsnavn(s.til)}: ${ting} (${s.prosent} % av lageret).`); }
    }
    else if (s.type === "nask") { fly(s.til, T.meg.navn, "oliven"); toast(`Du nasket ${s.fikk.oliven} oliven fra ${s.til}. Han har fått beskjed.`); }
    else if (s.type === "gi") toast(s.ferdig ? `${s.ferdig} står ferdig! Alle produserer 10 % mer.` : `Takk! +${s.aere} ære.`);
    else if (s.type === "tagg") toast(`Huset til ${visningsnavn(s.til)} har fått ny utsmykning.`);
    else if (s.type === "vask") toast(`Rent igjen. ${s.fra} får prøve seg på nytt en annen dag.`);
    else if (s.type === "kjop") toast(s.vare === "statue" ? "Statuen din står nå på agoraen." : s.vare === "slave" ? "Vaskeslaven er ansatt. Han tar tagger etter en time." : `${s.navn} kjøpt.`);
    else if (s.type === "ansett") toast(s.niva === 1 ? `${s.navn} er ansatt.` : `${s.navn} er forfremmet til nivå ${s.niva}.`);
    else if (s.type === "fest") toast(`${s.prakt ? "For en praktfest!" : "Skål for folkene!"} +${s.aere} ære, og godset jobber bedre i ${s.timer} timer.`);
    else if (s.type === "tokt") toast(`Skipet har lagt fra mot ${s.mal}. God vind!`);
    else if (s.type === "loss") { sprett(gave(s.fikk)); toast(`${s.hendelse === "storm" ? "Skipet kom gjennom en storm og mistet halve lasten." : s.hendelse === "medvind" ? "Medvind hele veien! Skipet kom hjem med ekstra last." : `Skipet er losset etter toktet til ${s.mal}.`}`); }
    else if (s.type === "flytt-inn") { toast("Velkommen til byen. Godset ditt er merket med gull."); zoomTilGods(T.meg.navn); }
    if (s.nyRang) setTimeout(() => toast(`Du er utnevnt til ${s.nyRang.toLowerCase()}! Se på huset ditt.`), 1800);
    for (const r of Object.keys(s.fikk || {})) {
      const b = rot.querySelector(`[data-brikke="${r}"]`);
      if (b) { b.classList.remove("blink"); void b.offsetWidth; b.classList.add("blink"); }
    }
  }

  function taImot(svar) {
    const forste = !T;
    T = svar;
    RESS = T.regler.produsert;
    ALLE = T.regler.alle;
    hentet = Date.now();
    if (forste && T.meg && smal()) {
      // På smal skjerm starter man inne på sitt eget gods i stedet for å se en bitteliten øy
      const pl = plasser();
      const p = paKart(pl.get(T.meg.navn) || { x: 500, y: 404 }, pl.krymp);
      vis = { z: 2.2, cx: p.x, cy: p.y - 14 };
    }
    tegn();
  }

  async function gjor(handling, kropp) {
    if (opptatt) return;
    opptatt = true;
    try {
      taImot(await api(`symposion/${handling}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kropp || {}) }));
      etterHandling();
    } catch (e) {
      toast(utenGjest(e.message), true);
    } finally {
      opptatt = false;
      tikk();
    }
  }

  function velg(navn, utenKort) {
    valgt = navn === T.meg?.navn ? null : navn;
    if (kort !== navn) sprayApen = false;
    kort = utenKort ? null : navn;
    rot.querySelectorAll(".sy-tomt").forEach((g) => g.classList.toggle("valgt", g.dataset.navn === (valgt || "")));
    document.getElementById("sy-panel").innerHTML = panel();
    tegnKort();
    zoomTilGods(navn);
    tikk();
  }
  function lukkKort() { kort = null; sprayApen = false; tegnKort(); }
  const tilKartet = () => { const b = rot.querySelector(".sy-kartboks"); if (b && (b.getBoundingClientRect().top < 0 || b.getBoundingClientRect().bottom > window.innerHeight)) b.scrollIntoView({ behavior: "smooth", block: "start" }); };

  rot.addEventListener("click", (e) => {
    // Merkene over husene og flammen over Akropolis virker med ett trykk
    const h = e.target.closest("[data-hurtig]");
    if (h && T.meg) {
      if (h.dataset.hurtig === "host") gjor("host");
      else if (h.dataset.hurtig === "offer") gjor("offer");
      else if (!T.meg.skjenk.kan) { toast(`Du har for lite ${rn(T.meg.skjenk.hoved)} til å skjenke. Høst først.`, true); velg(h.dataset.til); }
      else gjor("skjenk", { til: h.dataset.til });
      return;
    }
    const k = e.target.closest("button, .sy-tomt, [data-monument], [data-havnkart]");
    if (!k) { if (kort && e.target.closest(".sy-kart")) lukkKort(); return; }
    if (k.disabled) return;
    if (k.dataset.lukkkort !== undefined) lukkKort();
    else if (k.dataset.spray !== undefined) { sprayApen = !sprayApen; tegnKort(); if (sprayApen) rot.querySelector("#sy-kort input")?.focus(); }
    else if (k.dataset.tilpanel !== undefined) { lukkKort(); document.getElementById("sy-panel").scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (k.dataset.neste !== undefined) { const n = neste(); if (n) { velg(n.navn); tilKartet(); } }
    else if (k.dataset.zoom) {
      if (k.dataset.zoom === "alt") zoomTil(1, W / 2, TOPP + HH / 2);
      else if (k.dataset.zoom === "meg") velg(T.meg.navn);
      else zoomTil(vis.z * (k.dataset.zoom === "inn" ? 1.6 : 1 / 1.6), vis.cx, vis.cy);
    }
    else if (k.dataset.info !== undefined) visInfo("Slik spiller du Symposion", info());
    else if (k.dataset.ansett) gjor("ansett", { hvem: k.dataset.ansett });
    else if (k.dataset.fest) gjor("fest", { prakt: k.dataset.fest === "prakt" });
    else if (k.dataset.tokt) gjor("tokt", { mal: k.dataset.tokt });
    else if (k.dataset.havnkart !== undefined) (document.getElementById("sy-havn") || document.getElementById("sy-panel")).scrollIntoView({ behavior: "smooth", block: "center" });
    else if (k.dataset.gjor) gjor(k.dataset.gjor);
    else if (k.dataset.bygg) gjor("bygg", { bygg: k.dataset.bygg });
    else if (k.dataset.skjenk) gjor("skjenk", { til: k.dataset.skjenk });
    else if (k.dataset.nask) gjor("nask", { til: k.dataset.nask });
    else if (k.dataset.kjop) gjor("kjop", { vare: k.dataset.kjop });
    else if (k.dataset.gi) gjor("gi", { ressurs: k.dataset.gi, antall: Number(k.dataset.antall) });
    else if (k.dataset.hjem !== undefined) velg(T.meg.navn, true);
    else if (k.dataset.farge) {
      taggFarge = k.dataset.farge;
      rot.querySelectorAll(".sy-farge").forEach((x) => { x.classList.toggle("valgt", x === k); x.setAttribute("aria-checked", x === k); });
      rot.querySelectorAll("[data-taggskjema] input").forEach((inp) => (inp.style.color = taggFarge));
    }
    else if (k.dataset.skrubb !== undefined) {
      skrubb += 1;
      const tg = rot.querySelector(".sy-tomt.mitt .sy-taggen");
      if (tg) tg.setAttribute("opacity", (1 - skrubb / SKRUBB).toFixed(2));
      k.classList.remove("skrubber"); void k.offsetWidth; k.classList.add("skrubber");
      if (skrubb >= SKRUBB) { skrubb = 0; gjor("vask"); }
      else k.textContent = `Skrubb videre (${skrubb} av ${SKRUBB})`;
    }
    else if (k.dataset.velg) { velg(k.dataset.velg); tilKartet(); }
    else if (k.dataset.monument !== undefined) document.getElementById("sy-monument")?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (k.dataset.navn && T.meg) velg(k.dataset.navn);
  });
  // Dra for å flytte kartet, to fingre for å zoome. Et drag skal ikke telle som et trykk på et gods.
  const pekere = new Map();
  let dra = null, dro = false;
  const startDra = () => {
    const p = [...pekere.values()];
    if (p.length === 1) dra = { x: p[0].x, y: p[0].y, cx: vis.cx, cy: vis.cy };
    else if (p.length === 2) dra = { klyp: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, z: vis.z };
    else dra = null;
  };
  rot.addEventListener("pointerdown", (e) => {
    if (!vis || !e.target.closest(".sy-kart") || (e.pointerType === "mouse" && e.button !== 0)) return;
    pekere.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pekere.size === 1) dro = false;
    startDra();
  });
  window.addEventListener("pointermove", (e) => {
    if (!pekere.has(e.pointerId) || !dra) return;
    pekere.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pekere.values()];
    if (dra.klyp && p.length === 2) {
      dro = true;
      zoomVed(dra.z * (Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / dra.klyp), (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
      return;
    }
    const dx = e.clientX - dra.x, dy = e.clientY - dra.y;
    if (!dro && Math.hypot(dx, dy) < 7) return;
    dro = true;
    if (vis.z <= 1.01) return;
    const k = W / vis.z / ramme().width;
    glid++;
    vis.cx = dra.cx - dx * k; vis.cy = dra.cy - dy * k;
    settVisning();
  });
  const slipp = (e) => { if (pekere.delete(e.pointerId) && vis) startDra(); };
  window.addEventListener("pointerup", slipp);
  window.addEventListener("pointercancel", slipp);
  rot.addEventListener("click", (e) => {
    if (dro && e.target.closest(".sy-kart")) { e.stopPropagation(); e.preventDefault(); }
    dro = false;
  }, true);
  rot.addEventListener("wheel", (e) => {
    if (!vis || !e.target.closest(".sy-kart") || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    zoomVed(vis.z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
  }, { passive: false });
  rot.addEventListener("dblclick", (e) => {
    if (!vis || !e.target.closest(".sy-kart") || e.target.closest(".sy-tomt")) return;
    const r = ramme(), u = utsnitt();
    zoomTil(vis.z >= ZMAKS - 0.1 ? 1 : vis.z * 1.8, u.x + ((e.clientX - r.left) / r.width) * u.w, u.y + ((e.clientY - r.top) / r.height) * u.h);
  });
  window.addEventListener("resize", () => settVisning());

  rot.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-taggskjema]");
    if (!f) return;
    e.preventDefault();
    const tekst = f.tekst.value.trim();
    if (tekst) gjor("tagg", { til: f.dataset.taggskjema, tekst, farge: taggFarge });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && kort) lukkKort(); });
  rot.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("sy-tomt") && T.meg) { e.preventDefault(); velg(e.target.dataset.navn); }
  });

  async function hent(tving) {
    if (opptatt || document.hidden) return;
    try {
      const aktiv = document.activeElement && rot.contains(document.activeElement) && document.activeElement.matches("input, textarea");
      if (T && aktiv && !tving) return; // ikke tegn om mens noen skriver
      if (T && pekere.size) return;      // eller drar i kartet
      taImot(await api("symposion"));
    } catch (e) {
      if (!T) rot.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`;
    }
  }

  (async () => {
    if (!(await hvemErJeg())) {
      rot.innerHTML = `<p class="tomt"><a href="${loggInnSide()}">Logg inn</a> for å flytte inn i byen.</p>`;
      return;
    }
    await hent();
    setInterval(tikk, 1000);
    setInterval(hent, 60000);
    setTimeout(boble, 2500);
    setInterval(boble, 8000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) hent(); });
  })();
})();
