// 2048 for brødrene. Skyv brikkene, to like blir én. Resultatet lagres når spillet er over.

(() => {
  const N = 4;
  const LAGRING = "tafse-2048";
  const brett = document.getElementById("t-brett");
  const poengEl = document.getElementById("t-poeng");
  const rekordEl = document.getElementById("t-rekord");
  const tavle = document.getElementById("t-tavle");

  let ruter, poeng, trekk, over, vunnet, fortsett, lagret, nesteId = 1, rekord = 0;
  let fane = "uke", data = null;

  const tall = (n) => n.toLocaleString("nb-NO");

  // ---------- Tilstand ----------
  function tomme() {
    const l = [];
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) if (!ruter[r][k]) l.push([r, k]);
    return l;
  }
  function leggTil() {
    const l = tomme();
    if (!l.length) return;
    const [r, k] = l[Math.floor(Math.random() * l.length)];
    ruter[r][k] = { id: nesteId++, v: Math.random() < 0.9 ? 2 : 4, ny: true };
  }
  function nyttSpill() {
    ruter = Array.from({ length: N }, () => Array(N).fill(null));
    poeng = 0; trekk = 0; over = false; vunnet = false; fortsett = false; lagret = false;
    leggTil(); leggTil();
    tegn();
    lagreLokalt();
  }
  function lagreLokalt() {
    try {
      localStorage.setItem(LAGRING, JSON.stringify({ ruter: ruter.map((rad) => rad.map((c) => (c ? c.v : 0))), poeng, trekk, over, vunnet, fortsett, lagret, rekord }));
    } catch (_) {}
  }
  function hentLokalt() {
    try {
      const d = JSON.parse(localStorage.getItem(LAGRING) || "null");
      if (!d || !Array.isArray(d.ruter)) return false;
      rekord = d.rekord || 0;
      ruter = d.ruter.map((rad) => rad.map((v) => (v ? { id: nesteId++, v } : null)));
      ({ poeng, trekk, over, vunnet, fortsett, lagret } = d);
      return true;
    } catch (_) { return false; }
  }

  // ---------- Trekk ----------
  // Skyver én rad mot venstre. Returnerer nye celler og poeng.
  function skyvRad(rad) {
    const fulle = rad.filter(Boolean);
    const ut = [];
    let p = 0;
    for (let i = 0; i < fulle.length; i++) {
      const a = fulle[i], b = fulle[i + 1];
      if (b && a.v === b.v) {
        const ny = { id: nesteId++, v: a.v * 2, slatt: true, fra: [a, b] };
        ut.push(ny);
        p += ny.v;
        i++;
      } else ut.push(a);
    }
    while (ut.length < N) ut.push(null);
    return { ut, p };
  }

  function linje(retning, i) {
    // Gir koordinatene til linje i, i den rekkefølgen brikkene skal skyves mot
    return Array.from({ length: N }, (_, j) => {
      if (retning === "venstre") return [i, j];
      if (retning === "hoyre") return [i, N - 1 - j];
      if (retning === "opp") return [j, i];
      return [N - 1 - j, i];
    });
  }

  function flytt(retning) {
    if (over && !(vunnet && !fortsett)) return;
    if (vunnet && !fortsett) return;
    let endret = false, p = 0;
    const nye = Array.from({ length: N }, () => Array(N).fill(null));
    for (const rad of ruter) for (const c of rad) if (c) { delete c.ny; delete c.slatt; delete c.fra; }
    for (let i = 0; i < N; i++) {
      const koord = linje(retning, i);
      const celler = koord.map(([r, k]) => ruter[r][k]);
      const { ut, p: lp } = skyvRad(celler);
      p += lp;
      ut.forEach((c, j) => {
        const [r, k] = koord[j];
        nye[r][k] = c;
        if (c !== celler[j]) endret = true;
      });
    }
    if (!endret) return;
    ruter = nye;
    poeng += p;
    trekk++;
    if (poeng > rekord) rekord = poeng;
    leggTil();
    if (!vunnet && ruter.some((rad) => rad.some((c) => c && c.v >= 2048))) vunnet = true;
    if (!kanFlytte()) over = true;
    tegn();
    lagreLokalt();
    if (over) slutt();
  }

  function kanFlytte() {
    if (tomme().length) return true;
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const v = ruter[r][k].v;
      if ((k < N - 1 && ruter[r][k + 1].v === v) || (r < N - 1 && ruter[r + 1][k].v === v)) return true;
    }
    return false;
  }
  const storst = () => Math.max(...ruter.flat().filter(Boolean).map((c) => c.v));

  // ---------- Tegning ----------
  const bakgrunn = Array.from({ length: N * N }, () => `<div class="t-celle"></div>`).join("");
  function tegn() {
    const eksisterende = new Map([...brett.querySelectorAll(".t-brikke")].map((el) => [el.dataset.id, el]));
    if (!brett.querySelector(".t-rutenett")) brett.innerHTML = `<div class="t-rutenett">${bakgrunn}</div><div class="t-lag"></div><div class="t-melding" id="t-melding" hidden></div>`;
    const lag = brett.querySelector(".t-lag");
    const behold = new Set();
    const plasser = (el, r, k) => { el.style.setProperty("--r", r); el.style.setProperty("--k", k); };
    for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
      const c = ruter[r][k];
      if (!c) continue;
      if (c.fra) {
        // De to som slo seg sammen glir inn mot samme rute og forsvinner
        for (const f of c.fra) {
          const el = eksisterende.get(String(f.id));
          if (el) { plasser(el, r, k); el.classList.add("borte"); setTimeout(() => el.remove(), 140); behold.add(String(f.id)); }
        }
      }
      let el = eksisterende.get(String(c.id));
      if (!el) {
        el = document.createElement("div");
        el.dataset.id = c.id;
        lag.append(el);
      }
      el.className = `t-brikke v${Math.min(c.v, 8192)}${c.v >= 1024 ? " t-fire" : ""}${c.v >= 100 && c.v < 1000 ? " t-tre" : ""}${c.ny ? " ny" : ""}${c.slatt ? " slatt" : ""}`;
      el.textContent = c.v;
      plasser(el, r, k);
      behold.add(String(c.id));
    }
    for (const [id, el] of eksisterende) if (!behold.has(id)) el.remove();
    poengEl.textContent = tall(poeng);
    rekordEl.textContent = tall(Math.max(rekord, minRekordServer()));
    melding();
  }

  function melding() {
    const m = document.getElementById("t-melding");
    if (!m) return;
    if (vunnet && !fortsett) {
      m.innerHTML = `<p class="t-stor">2048!</p><p>Du klarte det på ${tall(trekk)} trekk.</p><div class="t-knapper"><button class="knapp" type="button" data-fortsett>Spill videre</button><button class="knapp sekundar" type="button" data-ny>Nytt spill</button></div>`;
      m.hidden = false;
    } else if (over) {
      m.innerHTML = `<p class="t-stor">Tomt for trekk</p><p>${tall(poeng)} poeng · største brikke ${storst()}</p><p class="dempet" id="t-lagret">${lagret ? "Ført i protokollen." : ""}</p><div class="t-knapper"><button class="knapp" type="button" data-ny>Prøv igjen</button></div>`;
      m.hidden = false;
    } else m.hidden = true;
  }

  // ---------- Lagring på serveren ----------
  async function slutt() {
    if (lagret || poeng <= 0) return;
    if (typeof MEG === "undefined" || !MEG) {
      const l = document.getElementById("t-lagret");
      if (l) l.innerHTML = `<a href="salongen.html">Logg inn</a> for å komme på tavlen.`;
      return;
    }
    lagret = true;
    lagreLokalt();
    try {
      await api("2048", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poeng, brikke: storst(), trekk }) });
      const l = document.getElementById("t-lagret");
      if (l) l.textContent = "Ført i protokollen.";
      lastTavle();
    } catch (_) {
      lagret = false;
      lagreLokalt();
    }
  }

  // Et spill som avbrytes med «Nytt spill» teller også, hvis det er verdt noe
  async function avbryt() {
    if (!over && poeng >= 500 && !lagret && typeof MEG !== "undefined" && MEG) {
      lagret = true;
      try { await api("2048", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poeng, brikke: storst(), trekk }) }); lastTavle(); } catch (_) {}
    }
    nyttSpill();
  }

  // ---------- Tavlen ----------
  function minRekordServer() {
    if (!data || typeof MEG === "undefined" || !MEG) return 0;
    const r = data.alle.find((x) => x.navn === MEG);
    return r ? r.poeng : 0;
  }
  function visTavle() {
    if (!data) return;
    const rader = data[fane];
    tavle.innerHTML = rader.length
      ? `<table class="tavle t-tavle"><thead><tr><th>#</th><th>Bror</th><th>Poeng</th><th>Brikke</th></tr></thead><tbody>${rader.map((r, i) =>
          `<tr${r.navn === MEG ? ' class="meg"' : ""}><td>${i + 1}</td><td>${esc(r.navn)}</td><td>${tall(r.poeng)}</td><td><span class="t-mini v${Math.min(r.brikke, 8192)}">${r.brikke}</span></td></tr>`).join("")}</tbody></table>
         <p class="dempet t-fot">${fane === "uke" ? "Uka starter mandag." : `${tall(data.antall)} spill totalt.`}</p>`
      : `<p class="tomt">${fane === "uke" ? "Ingen har spilt denne uka. Ledig førsteplass." : "Ingen har spilt ennå."}</p>`;
  }
  async function lastTavle() {
    if (!(await hvemErJeg())) {
      tavle.innerHTML = `<p class="dempet">Tavlen er bare for brødrene. <a href="salongen.html">Logg inn</a> for å se den og komme på den.</p>`;
      return;
    }
    try {
      data = await api("2048");
      visTavle();
      rekordEl.textContent = tall(Math.max(rekord, minRekordServer()));
    } catch (e) {
      tavle.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`;
    }
  }
  document.querySelectorAll(".t-fane").forEach((b) => b.addEventListener("click", () => {
    fane = b.dataset.fane;
    document.querySelectorAll(".t-fane").forEach((x) => { x.classList.toggle("aktiv", x === b); x.setAttribute("aria-selected", x === b); });
    visTavle();
  }));

  // ---------- Styring ----------
  const TASTER = { ArrowLeft: "venstre", ArrowRight: "hoyre", ArrowUp: "opp", ArrowDown: "ned", a: "venstre", d: "hoyre", w: "opp", s: "ned" };
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    const r = TASTER[e.key];
    if (!r) return;
    e.preventDefault();
    flytt(r);
  });
  let start = null;
  brett.addEventListener("touchstart", (e) => { if (e.touches.length === 1) start = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  brett.addEventListener("touchmove", (e) => { if (start) e.preventDefault(); }, { passive: false });
  brett.addEventListener("touchend", (e) => {
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start[0], dy = e.changedTouches[0].clientY - start[1];
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    flytt(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "hoyre" : "venstre") : dy > 0 ? "ned" : "opp");
  });
  brett.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.fortsett !== undefined) { fortsett = true; tegn(); lagreLokalt(); }
    else if (b.dataset.ny !== undefined) nyttSpill();
  });
  document.getElementById("t-ny").addEventListener("click", avbryt);

  if (hentLokalt()) tegn(); else nyttSpill();
  lastTavle();
})();
