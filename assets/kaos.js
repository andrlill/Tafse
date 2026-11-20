// KAOS: siden rundt motoren. Brettet, penselen, menyen med stoffer, oppdagelsesboka,
// dagens oppdrag og galleriet. Stoffene og fysikken ligger i assets/kaos-motor.js,
// serveren i lib/kaos.js.

(() => {
  const K = window.KAOS, { B, H, E, EL } = K;
  const $ = (id) => document.getElementById(id);
  const tall = (n) => Number(n).toLocaleString("nb-NO");
  const post = (data) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const lagret = (nokkel, reserve) => { try { const s = localStorage.getItem(nokkel); return s === null ? reserve : JSON.parse(s); } catch (_) { return reserve; } };
  const lagre = (nokkel, verdi) => { try { localStorage.setItem(nokkel, JSON.stringify(verdi)); } catch (_) {} };

  // ---------- Regler for siden (endres her) ----------
  const PENSLER = [0, 1, 3, 6, 10];      // radius i celler
  const HELLETETTHET = 0.4;              // hvor tett pulver, væske og gass legges mens man holder inne
  const LYN_HVER = 7;                    // rammer mellom hvert lyn mens man holder inne
  const ANGRE_MAKS = 12;
  const LAGRE_HVER = 4000;               // millisekunder mellom hver gang sandkassa lagres i nettleseren
  const NOKKEL_BRETT = "tafse-kaos-brett", NOKKEL_FUNN = "tafse-kaos-funn", NOKKEL_VALG = "tafse-kaos-valg", NOKKEL_SETT = "tafse-kaos-sett";

  // ---------- Tilstand ----------
  const sand = K.lagVerden(), opp = K.lagVerden();
  let v = sand;                          // verdenen som vises
  let fane = "sandkasse";
  let valg = lagret(NOKKEL_VALG, { stoff: "sand", pensel: 2 });
  if (!PENSLER[valg.pensel] && valg.pensel !== 0) valg.pensel = 2;
  let gaar = true, fart = 1, skitten = false, laant = false;
  const funnet = new Set(lagret(NOKKEL_FUNN, []));
  let forste = {}, oppdagere = [], gnister = 0, serverDag = null, regler = null;
  const angre = [];
  // Dagens oppdrag
  let o = null, fase = "plan", korn = 0, brukt = 0, budsjett = {}, oppdragTavle = [], rekke = 0, mittBeste = null;

  const stoffAv = (nokkel) => EL[E[nokkel.toUpperCase()]] || K.REDSKAP[nokkel];
  const erRedskap = (nokkel) => !!K.REDSKAP[nokkel];
  const antallFunn = () => K.FUNN.filter((f) => funnet.has(f.nokkel)).length;
  function tilgjengelig(nokkel) {
    const s = stoffAv(nokkel);
    if (!s) return false;
    if (s.start) return true;
    if (K.LAASER[nokkel] !== undefined) return antallFunn() >= K.LAASER[nokkel];
    return funnet.has(nokkel);
  }

  // ---------- Lerretet ----------
  const lerret = $("k-lerret"), ctx = lerret.getContext("2d");
  const lagLerret = (b, h) => { const c = document.createElement("canvas"); c.width = b; c.height = h; return c; };
  const liten = lagLerret(B, H), lctx = liten.getContext("2d"), bilde = lctx.createImageData(B, H), p32 = new Uint32Array(bilde.data.buffer);
  const glod = lagLerret(B, H), gctx = glod.getContext("2d"), gbilde = gctx.createImageData(B, H), g32 = new Uint32Array(gbilde.data.buffer);
  const dis = lagLerret(B >> 2, H >> 2), dctx = dis.getContext("2d");
  let skala = 4;
  // Utsnittet: zoom er forstørrelsen, (vx, vy) cellen øverst til venstre
  let zoom = 1, vx = 0, vy = 0;
  const ZOOM_MAKS = 4;
  function settZoom(z, cx = vx + B / zoom / 2, cy = vy + H / zoom / 2) {
    z = Math.max(1, Math.min(ZOOM_MAKS, z));
    const fx = (cx - vx) / (B / zoom), fy = (cy - vy) / (H / zoom);
    zoom = z;
    flytt(cx - (fx * B) / z - vx, cy - (fy * H) / z - vy);
    const k = document.getElementById("k-zoomtall");
    if (k) k.textContent = `${Math.round(zoom * 100)} %`;
  }
  function flytt(dx, dy) {
    vx = Math.max(0, Math.min(B - B / zoom, vx + dx));
    vy = Math.max(0, Math.min(H - H / zoom, vy + dy));
  }
  function tilpass() {
    const b = lerret.clientWidth || 800, dpr = Math.min(window.devicePixelRatio || 1, 2);
    skala = Math.max(2, Math.min(6, Math.round((b * dpr) / B)));
    lerret.width = B * skala;
    lerret.height = H * skala;
  }
  let peker = null;   // { x, y, fx, fy, nede }
  function tegn() {
    v.tegn(p32, g32);
    lctx.putImageData(bilde, 0, 0);
    gctx.putImageData(gbilde, 0, 0);
    const W = lerret.width, Hh = lerret.height;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0d0c0a";
    ctx.fillRect(0, 0, W, Hh);
    const ox = v.rystelse ? (Math.random() - 0.5) * v.rystelse * skala * 0.5 : 0, oy = v.rystelse ? (Math.random() - 0.5) * v.rystelse * skala * 0.5 : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(liten, vx, vy, B / zoom, H / zoom, ox, oy, W, Hh);
    // Glød: det som lyser tegnes en gang til, uskarpt, oppå bildet
    dctx.clearRect(0, 0, dis.width, dis.height);
    dctx.drawImage(glod, 0, 0, dis.width, dis.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.75;
    ctx.drawImage(dis, vx / 4, vy / 4, B / zoom / 4, H / zoom / 4, ox, oy, W, Hh);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (v.blink) { ctx.fillStyle = `rgba(215, 228, 255, ${0.05 * v.blink})`; ctx.fillRect(0, 0, W, Hh); }
    if (fane === "oppdrag" && o && o.merk) {
      const [x0, y0, x1, y1] = o.merk, s = skala * zoom;
      ctx.strokeStyle = "rgba(226, 193, 116, .7)"; ctx.lineWidth = Math.max(1, skala / 2); ctx.setLineDash([skala * 2, skala * 2]);
      ctx.strokeRect((x0 - vx) * s, (y0 - vy) * s, (x1 - x0 + 1) * s, (y1 - y0 + 1) * s);
      ctx.setLineDash([]);
    }
    if (peker && !peker.beroring) {
      const r = valg.stoff === "lyn" || valg.stoff === "menneske" ? 0.5 : PENSLER[valg.pensel] + 0.5;
      ctx.strokeStyle = "rgba(236, 228, 210, .55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc((peker.x + 0.5 - vx) * skala * zoom, (peker.y + 0.5 - vy) * skala * zoom, r * skala * zoom, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ---------- Lyd ----------
  let sisteSmell = 0;
  const LYDNAVN = { lyn: "lyn", liv: "niva", dod: "mistet", hikk: "hikk" };
  function vedLyd(navn) {
    if (navn === "smell") { const na = performance.now(); if (na - sisteSmell < 140) return; sisteSmell = na; LYD.spill("smell"); return; }
    if (LYDNAVN[navn]) LYD.spill(LYDNAVN[navn]);
  }
  sand.vedLyd = vedLyd; opp.vedLyd = vedLyd;

  // ---------- Oppdagelser ----------
  const toastBoks = $("k-toast");
  function toast(html, klasse = "") {
    const d = document.createElement("div");
    d.className = "k-toastlinje " + klasse;
    d.innerHTML = html;
    toastBoks.append(d);
    while (toastBoks.children.length > 3) toastBoks.firstChild.remove();
    setTimeout(() => d.classList.add("ut"), 4200);
    setTimeout(() => d.remove(), 4800);
  }
  function settGnister(n) { gnister = n; $("k-gnister").textContent = tall(n); }
  function oppdaterFunnTall() { $("k-funn-tall").textContent = `${antallFunn()}/${K.FUNN.length}`; }
  async function meldFunn(nokkel) {
    if (funnet.has(nokkel)) return;
    const f = K.FUNN.find((x) => x.nokkel === nokkel);
    if (!f) return;
    const for_ = antallFunn();
    funnet.add(nokkel);
    lagre(NOKKEL_FUNN, [...funnet]);
    LYD.spill("kiste");
    oppdaterFunnTall();
    tegnPalett();
    // Redskaper som låses opp ved et visst antall oppdagelser
    for (const [red, grense] of Object.entries(K.LAASER)) if (for_ < grense && antallFunn() >= grense) toast(`<strong>Nytt i menyen: ${esc(stoffAv(red).navn)}</strong><span>Låst opp ved ${grense} oppdagelser</span>`, "gull");
    let ekstra = "";
    if (typeof MEG !== "undefined" && MEG) {
      try {
        const svar = await api("kaos/funn", post({ id: nokkel }));
        settGnister(svar.saldo);
        if (svar.ny) ekstra = `+${svar.gnister} gnister${svar.forst ? ". Du er den første som har funnet dette" : ""}`;
        if (svar.forsteNavn) forste[nokkel] = svar.forsteNavn;
      } catch (_) {}
    }
    toast(`<strong>${f.fenomen ? "Nytt fenomen" : "Ny oppdagelse"}: ${esc(f.navn)}</strong><span>${esc(f.oppskrift)}${ekstra ? ". " + ekstra : ""}</span>`, "gull");
    if (fane === "bok") tegnBok();
  }
  sand.vedFunn = (nokkel) => { if (!laant) meldFunn(nokkel); };
  opp.funnAv = true;

  // ---------- Menyen med stoffer ----------
  const palett = $("k-palett");
  const rgb = (f) => `rgb(${f[0]}, ${f[1]}, ${f[2]})`;
  function velg(nokkel) {
    valg.stoff = nokkel;
    lagre(NOKKEL_VALG, valg);
    palett.querySelectorAll(".k-stoff").forEach((b) => b.classList.toggle("aktiv", b.dataset.stoff === nokkel));
  }
  function tegnPalett() {
    if (fane === "oppdrag" && o) {
      if (!o.tillatt.some(([n]) => n === valg.stoff)) valg.stoff = o.tillatt[0][0];
      palett.innerHTML = `<h3 class="k-gruppe">Du har</h3><div class="k-stoffer">${o.tillatt.map(([n]) => {
        const s = stoffAv(n);
        return `<button class="k-stoff${valg.stoff === n ? " aktiv" : ""}" type="button" data-stoff="${n}"><i style="background:${rgb(s.farge)}"></i>${esc(s.navn)} <b data-igjen="${n}">${tall(budsjett[n])}</b></button>`;
      }).join("")}</div><p class="t-hjelp">Tallet viser hvor mange korn du har igjen. Færrest brukte korn vinner.</p>`;
      return;
    }
    if (!tilgjengelig(valg.stoff)) valg.stoff = "sand";
    const alle = [...EL.filter((e) => e.gruppe), ...Object.values(K.REDSKAP)];
    palett.innerHTML = K.GRUPPER.map(([gruppe, navn]) => {
      const stoffer = alle.filter((s) => s.gruppe === gruppe);
      const apne = stoffer.filter((s) => tilgjengelig(s.nokkel)), laast = stoffer.length - apne.length;
      return `<h3 class="k-gruppe">${navn}</h3><div class="k-stoffer">${apne.map((s) =>
        `<button class="k-stoff${valg.stoff === s.nokkel ? " aktiv" : ""}" type="button" data-stoff="${s.nokkel}"><i style="background:${rgb(s.farge)}"></i>${esc(s.navn)}</button>`).join("")}${
        laast ? `<span class="k-stoff laast" title="Ikke oppdaget ennå">${"?".repeat(Math.min(3, laast))}${laast > 3 ? ` +${laast - 3}` : ""}</span>` : ""}</div>`;
    }).join("");
  }
  palett.addEventListener("click", (e) => { const b = e.target.closest("[data-stoff]"); if (b) velg(b.dataset.stoff); });

  // ---------- Verktøylinja ----------
  const verktoy = $("k-verktoy");
  function tegnVerktoy() {
    const zoomknapper = `<span class="k-pensler k-zoom" role="group" aria-label="Forstørrelse"><button class="k-pensel" type="button" data-gjor="ut" aria-label="Zoom ut">−</button><span id="k-zoomtall">${Math.round(zoom * 100)} %</span><button class="k-pensel" type="button" data-gjor="inn" aria-label="Zoom inn">+</button></span>`;
    const pensler = `<span class="k-pensler" role="group" aria-label="Penselstørrelse">${PENSLER.map((r, i) =>
      `<button class="k-pensel${valg.pensel === i ? " aktiv" : ""}" type="button" data-pensel="${i}" aria-label="Pensel ${i + 1}"><i style="width:${4 + i * 4}px;height:${4 + i * 4}px"></i></button>`).join("")}</span>`;
    if (fane === "oppdrag") {
      const ferdig = fase === "klart" || fase === "tapt";
      verktoy.innerHTML = `<button class="knapp" type="button" data-gjor="start"${ferdig ? " disabled" : ""}>${fase === "plan" || ferdig ? "Slipp løs" : gaar ? "Pause" : "Fortsett"}</button>
        ${pensler}
        <button class="liten-knapp" type="button" data-gjor="fart">${fart === 1 ? "Fart 1×" : "Fart 3×"}</button>
        <button class="liten-knapp" type="button" data-gjor="angre"${angre.length && fase === "plan" ? "" : " disabled"}>Angre</button>
        <button class="liten-knapp" type="button" data-gjor="omstart">Start på nytt</button>
        ${zoomknapper}`;
    } else {
      verktoy.innerHTML = `<button class="liten-knapp" type="button" data-gjor="pause">${gaar ? "Pause" : "Fortsett"}</button>
        <button class="liten-knapp" type="button" data-gjor="steg"${gaar ? " disabled" : ""}>Ett steg</button>
        <button class="liten-knapp" type="button" data-gjor="fart">${fart === 1 ? "Fart 1×" : "Fart 3×"}</button>
        ${pensler}
        <button class="liten-knapp" type="button" data-gjor="angre"${angre.length ? "" : " disabled"}>Angre</button>
        <button class="liten-knapp" type="button" data-gjor="tom">Tøm</button>
        <button class="liten-knapp" type="button" data-gjor="del">Del i galleriet</button>
        ${zoomknapper}`;
    }
  }
  LYD.knapp($("k-lyd"));
  const oppdaterAngre = () => { const b = verktoy.querySelector('[data-gjor="angre"]'); if (b) b.disabled = !(angre.length && (fane === "sandkasse" || fase === "plan")); };
  verktoy.addEventListener("click", (e) => {
    const p = e.target.closest("[data-pensel]");
    if (p) { valg.pensel = Number(p.dataset.pensel); lagre(NOKKEL_VALG, valg); tegnVerktoy(); return; }
    const b = e.target.closest("[data-gjor]");
    if (!b) return;
    b.blur();
    const gjor = b.dataset.gjor;
    if (gjor === "inn" || gjor === "ut") { settZoom(gjor === "inn" ? zoom * 2 : zoom / 2); return; }
    if (gjor === "pause") gaar = !gaar;
    else if (gjor === "steg") v.steg();
    else if (gjor === "fart") fart = fart === 1 ? 3 : 1;
    else if (gjor === "angre") angreSiste();
    else if (gjor === "tom") { husk(); sand.tom(); laant = false; sand.funnAv = false; $("k-laant").hidden = true; skitten = true; }
    else if (gjor === "del") delVerk();
    else if (gjor === "start") { if (fase === "plan") { fase = "gaar"; gaar = true; angre.length = 0; } else if (fase === "gaar") gaar = !gaar; }
    else if (gjor === "omstart") startOppdrag();
    tegnVerktoy();
  });

  // ---------- Angre ----------
  function husk() {
    angre.push({ kode: v.kod(), korn, budsjett: { ...budsjett } });
    if (angre.length > ANGRE_MAKS) angre.shift();
  }
  function angreSiste() {
    const a = angre.pop();
    if (!a) return;
    v.les(a.kode);
    if (fane === "oppdrag") { korn = a.korn; budsjett = a.budsjett; tegnPalett(); tegnOppdragslinje(); }
    skitten = true;
  }

  // ---------- Pensel ----------
  function celle(e) {
    const r = lerret.getBoundingClientRect();
    return [Math.max(0, Math.min(B - 1, Math.floor(vx + (((e.clientX - r.left) / r.width) * B) / zoom))), Math.max(0, Math.min(H - 1, Math.floor(vy + (((e.clientY - r.top) / r.height) * H) / zoom)))];
  }
  const kanMale = () => fane === "sandkasse" || (fane === "oppdrag" && (fase === "plan" || fase === "gaar"));
  function punkt(x, y, holdt) {
    const n = valg.stoff;
    if (erRedskap(n)) {
      if (n === "visk") v.mal(x, y, Math.max(1, PENSLER[valg.pensel]), E.TOM);
      return;
    }
    const t = E[n.toUpperCase()], fast = K.FASE[t] === 1, r = PENSLER[valg.pensel];
    if (fane === "oppdrag") {
      if (holdt && fast) return;
      const igjen = budsjett[n] || 0;
      if (igjen <= 0) return;
      const lagt = v.mal(x, y, r, t, { maks: igjen });
      if (lagt) { budsjett[n] -= lagt; korn += lagt; const b = palett.querySelector(`[data-igjen="${n}"]`); if (b) b.textContent = tall(budsjett[n]); }
      return;
    }
    if (holdt && fast) return;
    v.mal(x, y, r, t, { tetthet: fast || r === 0 ? 1 : HELLETETTHET });
  }
  function strek(x0, y0, x1, y1) {
    const lengde = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), hopp = Math.max(1, PENSLER[valg.pensel]);
    const n = Math.max(1, Math.ceil(lengde / hopp));
    for (let k = 1; k <= n; k++) punkt(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), false);
  }
  let lynTeller = 0;
  // To fingre flytter og zoomer utsnittet. Det samme gjør høyre museknapp (flytt) og musehjulet (zoom).
  const fingre = new Map();
  let grep = null;   // { x, y, avstand } for to fingre, { x, y } for høyre museknapp
  const cellerPerPiksel = () => B / zoom / lerret.getBoundingClientRect().width;
  function toFingre() {
    const [a, b] = [...fingre.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, avstand: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
  }
  lerret.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [x, y] = celle(e);
    settZoom(zoom * (e.deltaY < 0 ? 1.25 : 0.8), x + 0.5, y + 0.5);
  }, { passive: false });
  lerret.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") {
      fingre.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingre.size === 2) {
        // Den første fingeren rakk kanskje å sette en flekk: ta den bort igjen
        if (peker && peker.nede && (fane === "sandkasse" || fase === "plan")) { angreSiste(); oppdaterAngre(); }
        peker = null;
        grep = toFingre();
        return;
      }
      if (fingre.size > 2) return;
    }
    if (e.button === 2 || e.button === 1) { e.preventDefault(); try { lerret.setPointerCapture(e.pointerId); } catch (_) {} grep = { x: e.clientX, y: e.clientY, mus: true }; return; }
    if (e.button > 0) return;
    e.preventDefault();
    lerret.focus({ preventScroll: true });
    try { lerret.setPointerCapture(e.pointerId); } catch (_) {}
    const [x, y] = celle(e);
    peker = { x, y, fx: x, fy: y, nede: kanMale(), beroring: e.pointerType === "touch" };
    if (!peker.nede) return;
    if (fane === "sandkasse" || fase === "plan") husk();
    skitten = true;
    if (valg.stoff === "lyn") { v.lyn(x, y); lynTeller = 0; }
    else if (valg.stoff === "menneske") { if (!v.menneske(x, y)) toast("<strong>Ikke plass</strong><span>Høyst tretten mennesker om gangen, og de må ha plass til å stå.</span>"); }
    else punkt(x, y, false);
    oppdaterAngre();
  });
  lerret.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" && fingre.has(e.pointerId)) {
      fingre.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (fingre.size === 2 && grep) {
        const na = toFingre(), r = lerret.getBoundingClientRect();
        flytt(-(na.x - grep.x) * cellerPerPiksel(), -(na.y - grep.y) * cellerPerPiksel());
        settZoom(zoom * (na.avstand / grep.avstand), vx + (((na.x - r.left) / r.width) * B) / zoom, vy + (((na.y - r.top) / r.height) * H) / zoom);
        grep = na;
        return;
      }
    }
    if (grep && grep.mus) { flytt(-(e.clientX - grep.x) * cellerPerPiksel(), -(e.clientY - grep.y) * cellerPerPiksel()); grep.x = e.clientX; grep.y = e.clientY; return; }
    const [x, y] = celle(e);
    if (!peker) { peker = { x, y, fx: x, fy: y, nede: false, beroring: e.pointerType === "touch" }; return; }
    if (peker.nede) {
      if (valg.stoff === "vind") v.vind(x, y, Math.max(3, PENSLER[valg.pensel] + 2), x - peker.x, y - peker.y);
      else if (valg.stoff !== "lyn" && valg.stoff !== "menneske") strek(peker.x, peker.y, x, y);
    }
    peker.x = x; peker.y = y;
  });
  const slipp = (e) => {
    if (e.pointerType === "touch") { fingre.delete(e.pointerId); if (fingre.size < 2 && grep && !grep.mus) grep = null; }
    else if (grep && grep.mus) grep = null;
    if (peker) { peker.nede = false; if (peker.beroring) peker = null; }
  };
  lerret.addEventListener("pointerup", slipp);
  lerret.addEventListener("pointercancel", slipp);
  lerret.addEventListener("pointerleave", () => { if (peker && !peker.nede) peker = null; });
  lerret.addEventListener("contextmenu", (e) => e.preventDefault());
  // Mens man holder inne, renner det ut mer for hver ramme
  function hold() {
    if (!peker || !peker.nede || !kanMale()) return;
    skitten = true;
    if (valg.stoff === "lyn") { if (++lynTeller % LYN_HVER === 0) v.lyn(peker.x, peker.y); }
    else if (valg.stoff !== "menneske" && valg.stoff !== "vind") punkt(peker.x, peker.y, true);
  }

  // ---------- Dagens oppdrag ----------
  const oppdragBoks = $("k-oppdrag"), melding = $("k-melding");
  const stjerneTegn = (n) => "★".repeat(n) + "☆".repeat(3 - n);
  const idag = () => serverDag || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(new Date());
  function startOppdrag() {
    o = K.lagOppdrag(idag());
    opp.tom();
    o.bygg(opp);
    fase = "plan"; korn = 0; brukt = 0; gaar = false; fart = 1;
    budsjett = Object.fromEntries(o.tillatt);
    angre.length = 0;
    melding.hidden = true;
    tegnPalett(); tegnVerktoy(); tegnOppdragslinje(); tegnTavle();
  }
  function tegnOppdragslinje() {
    if (!o) return;
    const m = o.maal(opp, brukt);
    oppdragBoks.innerHTML = `<div class="k-oppdrag-hode"><h2>${esc(o.navn)}</h2><p>${esc(o.ingress)}</p></div>
      <p class="k-oppdrag-hjelp">${esc(o.hjelp)}</p>
      <div class="k-maalere">
        <div class="k-maaler"><span>Korn brukt</span><strong id="k-korn">${tall(korn)}</strong><em>${stjerneTegn(3)} til og med ${tall(o.par[0])} · ${stjerneTegn(2)} til og med ${tall(o.par[1])}</em></div>
        <div class="k-maaler bred"><span id="k-maaltekst">${esc(m.tekst)}</span><div class="k-strek"><i id="k-maalstrek" style="width:${Math.round(m.andel * 100)}%"></i></div>
          <div class="k-strek tid"><i id="k-tidstrek" style="width:${Math.round((brukt / o.tid) * 100)}%"></i></div></div>
      </div>`;
  }
  function oppdaterOppdragslinje(m) {
    const k = $("k-korn");
    if (!k) return;
    k.textContent = tall(korn);
    $("k-maaltekst").textContent = m.tekst;
    $("k-maalstrek").style.width = Math.round(m.andel * 100) + "%";
    $("k-tidstrek").style.width = Math.round((brukt / o.tid) * 100) + "%";
  }
  function tegnTavle() {
    const boks = $("k-tavle");
    if (fane !== "oppdrag") { boks.innerHTML = ""; return; }
    const meg = typeof MEG !== "undefined" ? MEG : null;
    boks.innerHTML = `<h3 class="t-undertittel">Dagens tavle</h3>${oppdragTavle.length
      ? `<table class="tavle t-tavle k-tavle"><thead><tr><th>#</th><th>Spiller</th><th>Korn</th><th></th></tr></thead><tbody>${oppdragTavle.map((r, i) =>
        `<tr${r.navn === meg ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(visningsnavn(r.navn))}</td><td>${tall(r.korn)}</td><td class="k-stjerner">${stjerneTegn(r.stjerner)}</td></tr>`).join("")}</tbody></table>`
      : `<p class="tomt">Ingen har løst dagens oppdrag. Førsteplassen er ledig.</p>`}
      <p class="dempet t-fot">${rekke > 1 ? `Du har løst oppdraget ${rekke} dager på rad. ` : ""}Nytt oppdrag hver dag ved midnatt. Færrest korn vinner.</p>`;
  }
  function oppdaterMerke() {
    const m = $("k-oppdrag-merke");
    m.textContent = mittBeste ? stjerneTegn(mittBeste.stjerner) : "ny";
    m.classList.toggle("ny", !mittBeste);
  }
  async function oppdragSlutt(klart, m) {
    fase = klart ? "klart" : "tapt";
    gaar = false;
    tegnVerktoy();
    if (!klart) {
      LYD.spill("tapt");
      melding.innerHTML = `<p class="t-stor">${brukt >= o.tid ? "Tiden er ute" : "Det gikk ikke"}</p><p>${esc(m.tekst)}</p><div class="t-knapper"><button class="knapp" type="button" data-omstart>Prøv igjen</button></div>`;
      melding.hidden = false;
      return;
    }
    LYD.spill("seier");
    const stjerner = K.stjerner(o, korn);
    melding.innerHTML = `<p class="t-stor">${stjerneTegn(stjerner)}</p><p>Løst med ${tall(korn)} korn${stjerner < 3 ? `. ${stjerner === 2 ? "Tre" : "To"} stjerner krever høyst ${tall(o.par[stjerner === 2 ? 0 : 1])}` : ""}.</p><p class="dempet" id="k-oppdrag-lagret"></p><div class="t-knapper"><button class="knapp" type="button" data-omstart>Prøv å slå det</button><button class="knapp sekundar" type="button" data-sandkasse>Til sandkassa</button></div>`;
    melding.hidden = false;
    if (typeof MEG === "undefined" || !MEG) return;
    try {
      const svar = await api("kaos/oppdrag", post({ dag: o.dag, korn, tikk: brukt, stjerner }));
      settGnister(svar.saldo);
      oppdragTavle = svar.tavle; rekke = svar.rekke;
      mittBeste = oppdragTavle.find((r) => r.navn === MEG) || mittBeste;
      oppdaterMerke(); tegnTavle();
      const l = $("k-oppdrag-lagret");
      if (l) l.innerHTML = svar.gnister ? `Ført i protokollen. Du fikk <strong>${tall(svar.gnister)} gnister</strong> til <a href="hotell.html">Tafse Hotell</a>${svar.forste && svar.rekke > 1 ? `, medregnet tillegget for ${svar.rekke} dager på rad` : ""}.` : svar.forbedret ? "Ført i protokollen. Ny bestenotering." : "Du har et bedre forsøk fra før i dag.";
    } catch (err) {
      const l = $("k-oppdrag-lagret");
      if (l) l.textContent = err.message;
    }
  }
  melding.addEventListener("click", (e) => {
    if (e.target.closest("[data-omstart]")) startOppdrag();
    else if (e.target.closest("[data-sandkasse]")) byttFane("sandkasse");
  });

  // ---------- Galleriet ----------
  const galleri = $("k-galleri");
  let gallerisort = "nye";
  function miniatyr() {
    const c = lagLerret(B, H), k = c.getContext("2d");
    k.fillStyle = "#0d0c0a"; k.fillRect(0, 0, B, H);
    sand.tegn(p32, g32);
    lctx.putImageData(bilde, 0, 0);
    k.drawImage(liten, 0, 0);
    for (const q of [0.8, 0.6, 0.4]) { const url = c.toDataURL("image/jpeg", q); if (url.length < 58000) return url; }
    return null;
  }
  function delVerk() {
    if (typeof MEG === "undefined" || !MEG) { toast(`<strong>Logg inn</strong><span>Du må være logget inn for å dele i galleriet.</span>`); return; }
    if (laant) { toast("<strong>Lånt verk</strong><span>Tøm brettet og lag noe eget før du deler.</span>"); return; }
    visInfo("Del i galleriet", `<form id="k-delskjema"><p>Verket lagres slik brettet ser ut akkurat nå. De andre kan åpne det, la det gå og gi det stjerner. Hver stjerne gir deg ${regler ? regler.stjerne : 5} gnister.</p>
      <p><label>Tittel<br><input type="text" id="k-tittel" maxlength="40" required autocomplete="off" style="width:100%"></label></p>
      <p class="melding feil" id="k-delfeil" hidden></p>
      <p><button class="knapp" type="submit">Del</button></p></form>`);
    const skjema = $("k-delskjema");
    $("k-tittel").focus();
    skjema.addEventListener("submit", async (e) => {
      e.preventDefault();
      const knapp = skjema.querySelector("button[type=submit]");
      knapp.disabled = true;
      try {
        await api("kaos/verk", post({ tittel: $("k-tittel").value, data: sand.kod(), bilde: miniatyr() }));
        $("infoboks").close();
        toast("<strong>Delt i galleriet</strong><span>De andre kan nå åpne verket ditt.</span>", "gull");
      } catch (err) { const f = $("k-delfeil"); f.textContent = err.message; f.hidden = false; knapp.disabled = false; }
    });
  }
  async function tegnGalleri() {
    const meg = typeof MEG !== "undefined" ? MEG : null;
    galleri.innerHTML = `<div class="k-galleri-hode"><div class="t-faner">${[["nye", "Nyeste"], ["topp", "Flest stjerner"], ["mine", "Mine"]].map(([s, n]) =>
      `<button class="t-fane${gallerisort === s ? " aktiv" : ""}" type="button" data-sort="${s}">${n}</button>`).join("")}</div></div><div id="k-verkliste"><p class="dempet">Laster …</p></div>`;
    const liste = $("k-verkliste");
    if (!meg) { liste.innerHTML = `<p class="dempet"><a href="${loggInnSide()}">Logg inn</a> for å se galleriet.</p>`; return; }
    try {
      const { verk } = await api(`kaos/galleri?sort=${gallerisort}`);
      liste.innerHTML = verk.length ? `<div class="k-verk">${verk.map((w) => `<article class="k-verkkort" data-verk="${w.id}">
          <button class="k-verkbilde" type="button" data-apne="${w.id}" aria-label="Åpne ${esc(w.tittel)}">${w.bilde ? `<img src="${esc(w.bilde)}" alt="" loading="lazy">` : ""}</button>
          <h3>${esc(w.tittel)}</h3>
          <p class="dempet">${esc(visningsnavn(w.navn))} · ${esc(tidTekst(w.opprettet))}</p>
          <div class="k-verkknapper">
            <button class="liten-knapp k-stjerneknapp${w.gitt ? " skalt" : ""}" type="button" data-stjerne="${w.id}"${w.navn === meg || w.gitt ? " disabled" : ""}>★ <span>${w.stjerner}</span></button>
            <button class="liten-knapp" type="button" data-apne="${w.id}">Åpne</button>
            ${w.navn === meg || ADMIN ? `<button class="liten-knapp" type="button" data-slett="${w.id}">Slett</button>` : ""}
          </div></article>`).join("")}</div>`
        : `<p class="tomt">${gallerisort === "mine" ? "Du har ikke delt noe ennå. Lag noe i sandkassa og trykk «Del i galleriet»." : "Galleriet er tomt. Bli den første som deler noe."}</p>`;
    } catch (err) { liste.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`; }
  }
  galleri.addEventListener("click", async (e) => {
    const sort = e.target.closest("[data-sort]");
    if (sort) { gallerisort = sort.dataset.sort; tegnGalleri(); return; }
    const apne = e.target.closest("[data-apne]"), stjerne = e.target.closest("[data-stjerne]"), slett = e.target.closest("[data-slett]");
    try {
      if (apne) {
        const w = await api(`kaos/verk?id=${apne.dataset.apne}`);
        const egen = w.navn === MEG;
        angre.length = 0;
        if (!sand.les(w.data)) throw new Error("Verket lot seg ikke åpne.");
        laant = !egen; sand.funnAv = laant; $("k-laant").hidden = !laant;
        skitten = egen; gaar = true;
        byttFane("sandkasse");
        toast(`<strong>${esc(w.tittel)}</strong><span>Av ${esc(visningsnavn(w.navn))}</span>`);
      } else if (stjerne) {
        stjerne.disabled = true;
        const svar = await api("kaos/stjerne", post({ id: Number(stjerne.dataset.stjerne) }));
        stjerne.classList.add("skalt");
        stjerne.querySelector("span").textContent = svar.stjerner;
      } else if (slett) {
        if (!confirm("Slette verket fra galleriet?")) return;
        await api("kaos/slett", post({ id: Number(slett.dataset.slett) }));
        tegnGalleri();
      }
    } catch (err) { toast(`<strong>Det gikk ikke</strong><span>${esc(err.message)}</span>`); }
  });

  // ---------- Oppdagelsesboka ----------
  const bok = $("k-bok");
  function tegnBok() {
    const n = antallFunn(), meg = typeof MEG !== "undefined" ? MEG : null;
    const kort = (f) => {
      const har = funnet.has(f.nokkel), s = stoffAv(f.nokkel);
      const farge = s && s.farge ? rgb(s.farge) : "var(--gull)";
      return `<li class="k-funn${har ? "" : " ukjent"}${f.fenomen ? " fenomen" : ""}">
        <i style="background:${har ? farge : "transparent"}">${har ? "" : "?"}</i>
        <div><strong>${har ? esc(f.navn) : f.fenomen ? "Ukjent fenomen" : "Ukjent stoff"}</strong>
        <span>${esc(har ? f.oppskrift : f.hint)}</span>
        ${forste[f.nokkel] ? `<em>Først: ${esc(visningsnavn(forste[f.nokkel]))}</em>` : har ? "" : `<em>Ingen har funnet dette ennå</em>`}</div></li>`;
    };
    const laaser = Object.entries(K.LAASER).map(([red, grense]) => `<li class="${n >= grense ? "apen" : ""}"><strong>${esc(stoffAv(red).navn)}</strong> ${n >= grense ? "er låst opp" : `låses opp ved ${grense} oppdagelser`}</li>`).join("");
    bok.innerHTML = `<div class="k-bok-hode">
        <div class="t-krone"><span>Dine oppdagelser</span><strong>${n} av ${K.FUNN.length}</strong><em>${n === K.FUNN.length ? "Du har funnet alt" : "Resten må du finne ut av selv"}</em></div>
        <ul class="k-laaser">${laaser}</ul>
      </div>
      <p class="t-hjelp">Du oppdager et stoff første gang det oppstår i sandkassa di. Hver oppdagelse gir ${regler ? regler.funn : 10} gnister, og ${regler ? regler.forst : 15} ekstra til den som finner noe først av alle.</p>
      <h3 class="t-undertittel">Stoffer</h3><ul class="k-funnliste">${K.FUNN.filter((f) => !f.fenomen).map(kort).join("")}</ul>
      <h3 class="t-undertittel">Fenomener</h3><ul class="k-funnliste">${K.FUNN.filter((f) => f.fenomen).map(kort).join("")}</ul>
      ${oppdagere.length ? `<h3 class="t-undertittel">Oppdagerne</h3><table class="tavle t-tavle k-tavle"><thead><tr><th>#</th><th>Spiller</th><th>Oppdagelser</th></tr></thead><tbody>${oppdagere.map((r, i) =>
        `<tr${r.navn === meg ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(visningsnavn(r.navn))}</td><td>${r.antall}</td></tr>`).join("")}</tbody></table>` : ""}`;
  }

  // ---------- Faner ----------
  function byttFane(ny) {
    if (fane === "sandkasse" && ny !== "sandkasse") lagreBrett(true);
    fane = ny;
    document.querySelectorAll(".k-faner .t-fane").forEach((b) => { const pa = b.dataset.fane === ny; b.classList.toggle("aktiv", pa); b.setAttribute("aria-selected", pa ? "true" : "false"); });
    const brett = ny === "sandkasse" || ny === "oppdrag";
    $("k-spill").hidden = !brett;
    galleri.hidden = ny !== "galleri";
    bok.hidden = ny !== "bok";
    oppdragBoks.hidden = ny !== "oppdrag";
    $("k-laant").hidden = !(ny === "sandkasse" && laant);
    melding.hidden = true;
    angre.length = 0;
    if (ny === "sandkasse") { v = sand; gaar = true; fart = 1; }
    if (ny === "oppdrag") { v = opp; if (!o || o.dag !== idag() || fase === "klart" || fase === "tapt") startOppdrag(); else { gaar = fase === "gaar"; } }
    if (brett) { tegnPalett(); tegnVerktoy(); tegnTavle(); if (ny === "oppdrag") tegnOppdragslinje(); tilpass(); }
    if (ny === "galleri") tegnGalleri();
    if (ny === "bok") { tegnBok(); hentOversikt().then(() => { if (fane === "bok") tegnBok(); }); }
  }
  document.querySelector(".k-faner").addEventListener("click", (e) => { const b = e.target.closest("[data-fane]"); if (b) byttFane(b.dataset.fane); });

  // ---------- Lagring av sandkassa ----------
  function lagreBrett(tving) {
    if (!skitten && !tving) return;
    if (laant) return;
    skitten = false;
    try { localStorage.setItem(NOKKEL_BRETT, sand.kod()); } catch (_) {}
  }
  setInterval(() => { if (fane === "sandkasse") lagreBrett(false); }, LAGRE_HVER);
  window.addEventListener("pagehide", () => lagreBrett(false));
  // Et lite landskap å begynne med, så det er noe å tenne på
  function velkomst() {
    sand.fyll(0, 140, B - 1, H - 1, E.STEIN);
    for (let x = 0; x < B; x++) { const h = Math.max(3, Math.round(5 + 3 * Math.sin(x / 17) + 2 * Math.sin(x / 7))); sand.fyll(x, 140 - h, x, 139, E.JORD); }
    sand.fyll(118, 131, 160, 139, E.TOM);
    sand.fyll(118, 134, 160, 139, E.VANN);
    for (const [x, h] of [[40, 22], [62, 17], [84, 25]]) {
      sand.fyll(x, 136 - h, x + 2, 136, E.TRE);
      for (let dy = -7; dy <= 3; dy++) for (let dx = -8; dx <= 8; dx++) if (dx * dx + dy * dy * 2 < 64) sand.sett(x + 1 + dx, 132 - h + dy, E.PLANTE);
    }
    sand.fyll(176, 128, 190, 133, E.SAND);
  }

  // ---------- Hjelp ----------
  function visHjelp() {
    visInfo("Slik spiller du Kaos", `
      <p>I begynnelsen var Kaos. Velg et stoff i menyen og tegn i boksen. Stoffene faller, renner, brenner og reagerer med hverandre.</p>
      <h3>Sandkassa</h3>
      <p>Her er alt lov, og brettet lever: fuktig jord får gress, frø spirer til blomster og trær, og en stokk som står i fuktig jord, slår rot og får krone. Du begynner med noen få stoffer. Resten må du oppdage: et stoff låses opp første gang det oppstår på brettet ditt. Tenn på et tre og se hva som stiger opp og hva som ligger igjen. Oppdagelsesboka har et hint for hvert stoff du mangler.</p>
      <h3>Dagens oppdrag</h3>
      <p>Hver dag får alle det samme brettet og de samme stoffene. Legg ut det du trenger, trykk «Slipp løs», og se om det holder. Færrest brukte korn vinner, og det gir opptil tre stjerner. Du kan prøve så mange ganger du vil.</p>
      <h3>Galleriet</h3>
      <p>Har du laget noe du er fornøyd med, kan du dele det. De andre kan åpne verket, la det gå og gi det en stjerne.</p>
      <h3>Gnister</h3>
      <table class="tavle"><tbody>
        <tr><td>En ny oppdagelse</td><td>${regler ? regler.funn : 10} gnister</td></tr>
        <tr><td>Først av alle til å finne noe</td><td>${regler ? regler.forst : 15} ekstra</td></tr>
        <tr><td>Dagens oppdrag</td><td>${regler ? regler.oppdrag.slice(1).join(", ") : "15, 25, 40"} for én, to og tre stjerner</td></tr>
        <tr><td>Flere dager på rad</td><td>${regler ? regler.rekke : 3} ekstra per dag, opptil ${regler ? regler.rekkeMaks : 21}</td></tr>
        <tr><td>En stjerne på verket ditt</td><td>${regler ? regler.stjerne : 5} gnister</td></tr>
      </tbody></table>
      <p>Gnistene bruker du i butikken på <a href="hotell.html">Tafse Hotell</a>.</p>
      <h3>Taster</h3>
      <p>Mellomrom: pause. Z: angre. Tallene 1 til 5: penselstørrelse. Musehjulet zoomer, og høyre museknapp flytter utsnittet. På mobil zoomer og flytter du med to fingre.</p>
      <p><button class="knapp" type="button" data-lukk>Sett i gang</button></p>`);
  }
  $("k-hjelp").addEventListener("click", visHjelp);

  // ---------- Taster ----------
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.querySelector("dialog[open]")) return;
    if (fane !== "sandkasse" && fane !== "oppdrag") return;
    if (e.key === " ") {
      e.preventDefault();
      if (fane === "oppdrag") { if (fase === "plan") { fase = "gaar"; gaar = true; angre.length = 0; } else if (fase === "gaar") gaar = !gaar; }
      else gaar = !gaar;
      tegnVerktoy();
    } else if (e.key === "z" || e.key === "Z") { if (fane === "sandkasse" || fase === "plan") { angreSiste(); tegnVerktoy(); } }
    else if (/^[1-5]$/.test(e.key)) { valg.pensel = Number(e.key) - 1; lagre(NOKKEL_VALG, valg); tegnVerktoy(); }
  });

  // ---------- Løkka ----------
  function ramme() {
    requestAnimationFrame(ramme);
    if (document.hidden || (fane !== "sandkasse" && fane !== "oppdrag")) return;
    hold();
    if (fane === "oppdrag") {
      if (fase === "gaar" && gaar) {
        let m = null;
        for (let k = 0; k < fart && fase === "gaar"; k++) {
          brukt++;
          if (o.vedSteg) o.vedSteg(opp, brukt);
          opp.steg();
          if (brukt % 6 === 0 || brukt >= o.tid) {
            m = o.maal(opp, brukt);
            if (m.klart) { oppdaterOppdragslinje(m); oppdragSlutt(true, m); break; }
            if (m.tapt || brukt >= o.tid) { oppdaterOppdragslinje(m); oppdragSlutt(false, m); break; }
          }
        }
        if (m && fase === "gaar") oppdaterOppdragslinje(m);
      } else if (fase === "plan") { const k = $("k-korn"); if (k) k.textContent = tall(korn); }
    } else if (gaar) for (let k = 0; k < fart; k++) sand.steg();
    tegn();
  }

  // ---------- Oppstart ----------
  async function hentOversikt() {
    if (!(await hvemErJeg())) return;
    try {
      const d = await api("kaos");
      // Oppdagelser gjort uten nett sendes inn nå
      const mangler = [...funnet].filter((n) => !d.funn.includes(n));
      d.funn.forEach((n) => funnet.add(n));
      lagre(NOKKEL_FUNN, [...funnet]);
      forste = d.forste; oppdagere = d.oppdagere; serverDag = d.dag; regler = d.regler;
      oppdragTavle = d.oppdrag.tavle; rekke = d.oppdrag.rekke;
      mittBeste = oppdragTavle.find((r) => r.navn === MEG) || null;
      settGnister(d.gnister);
      for (const n of mangler) { try { const s = await api("kaos/funn", post({ id: n })); settGnister(s.saldo); } catch (_) {} }
      sand.settKjent([...funnet]);
      oppdaterFunnTall(); oppdaterMerke();
      if (fane === "sandkasse") tegnPalett();
      if (fane === "oppdrag") tegnTavle();
    } catch (_) {}
  }
  let lagretBrett = null;
  try { lagretBrett = localStorage.getItem(NOKKEL_BRETT); } catch (_) {}
  if (!lagretBrett || !sand.les(lagretBrett)) velkomst();
  sand.settKjent([...funnet]);
  oppdaterFunnTall();
  oppdaterMerke();
  tegnPalett();
  tegnVerktoy();
  tilpass();
  window.addEventListener("resize", tilpass);
  requestAnimationFrame(ramme);
  hentOversikt().then(() => {
    if (!lagret(NOKKEL_SETT, false)) { lagre(NOKKEL_SETT, true); visHjelp(); }
    if (new URLSearchParams(location.search).get("fane") === "oppdrag") byttFane("oppdrag");
  });
})();
