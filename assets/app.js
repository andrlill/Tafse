// TAFSE – felles skript: meny, bunn, møtedata og innlogging.

const LOGO = `<svg viewBox="0 0 88 68" aria-hidden="true"><path d="M8 18 Q44 52 80 18 Z" fill="#c9a24a"/><path d="M8 18 Q0 10 4 4 M80 18 Q88 10 84 4" fill="none" stroke="#c9a24a" stroke-width="3"/><rect x="41" y="38" width="6" height="16" fill="#c9a24a"/><rect x="28" y="54" width="32" height="6" rx="3" fill="#c9a24a"/></svg>`;

const LOGO_STOR = `<svg class="logo-stor" viewBox="0 0 200 150" aria-hidden="true">
<path d="M30 120 Q10 80 28 40" fill="none" stroke="#c9a24a" stroke-width="2"/>
<path d="M170 120 Q190 80 172 40" fill="none" stroke="#c9a24a" stroke-width="2"/>
<ellipse cx="22" cy="100" rx="9" ry="4" transform="rotate(-60 22 100)" fill="#c9a24a"/>
<ellipse cx="18" cy="78" rx="9" ry="4" transform="rotate(-80 18 78)" fill="#c9a24a"/>
<ellipse cx="22" cy="56" rx="9" ry="4" transform="rotate(-110 22 56)" fill="#c9a24a"/>
<ellipse cx="178" cy="100" rx="9" ry="4" transform="rotate(60 178 100)" fill="#c9a24a"/>
<ellipse cx="182" cy="78" rx="9" ry="4" transform="rotate(80 182 78)" fill="#c9a24a"/>
<ellipse cx="178" cy="56" rx="9" ry="4" transform="rotate(110 178 56)" fill="#c9a24a"/>
<path d="M52 52 Q100 100 148 52 Z" fill="#c9a24a"/>
<path d="M52 52 Q38 40 44 30 M148 52 Q162 40 156 30" fill="none" stroke="#c9a24a" stroke-width="4"/>
<rect x="96" y="80" width="8" height="24" fill="#c9a24a"/>
<rect x="76" y="104" width="48" height="8" rx="4" fill="#c9a24a"/>
</svg>`;

const SIDER = [
  ["salongen.html", "Salongen"],
  ["moter.html", "Møtene"],
  ["vedtekter.html", "Vedtekter"],
  ["saker.html", "Saker"],
  ["medlemmer.html", "Brødrene"],
  ["verden.html", "Hva skjer?"],
  ["fortellingen.html", "Fortellingen"],
  ["symposion.html", "Spill"],
];

const MANEDER = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const MANEDER_KORT = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
const DAGER = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function byggRamme() {
  const her = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
  const meny = SIDER.map(([fil, navn]) => {
    const stamme = fil.replace(/\.html$/, "");
    const aktiv = stamme === her || (her === "mote" && stamme === "moter") || (["spill", "honningfella", "2048"].includes(her) && stamme === "symposion") || (her === "bror" && stamme === "medlemmer");
    return `<a href="${fil}"${aktiv ? ' class="aktiv" aria-current="page"' : ""}>${navn}</a>`;
  }).join("");
  const topp = document.createElement("header");
  topp.className = "topp";
  topp.innerHTML = `<div class="meander" aria-hidden="true"></div>
  <div class="topp-inner">
    <a class="merke" href="index.html">${LOGO}<span>TAFSE</span></a>
    <nav class="meny" id="hovedmeny" aria-label="Hovedmeny">${meny}</nav>
    <div class="varsel" id="varsel" hidden>
      <button class="varsel-knapp" type="button" aria-expanded="false" aria-controls="varsel-panel" aria-label="Varsler"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg><span class="varsel-tall" hidden></span></button>
      <div class="varsel-panel" id="varsel-panel" hidden>
        <div class="varsel-hode"><strong>Varsler</strong><button class="lenkeknapp" type="button" id="les-alle">Merk alle som lest</button></div>
        <ol class="varsel-liste"></ol>
      </div>
    </div>
    <button class="meny-knapp" aria-expanded="false" aria-controls="hovedmeny">Meny</button>
  </div>`;
  document.body.prepend(topp);
  const knapp = topp.querySelector(".meny-knapp");
  const nav = topp.querySelector(".meny");
  knapp.addEventListener("click", () => {
    const apen = nav.classList.toggle("apen");
    knapp.setAttribute("aria-expanded", apen);
  });

  const bunn = document.createElement("footer");
  bunn.className = "bunn";
  bunn.innerHTML = `<div class="meander" aria-hidden="true"></div>
  <p class="bunn-tekst">Taffelakademiet for Samvær og Etegilder</p>
  <p class="bunn-tekst bunn-status" style="padding-top:0; font-style:normal"></p>`;
  document.body.append(bunn);
}

// ---------- Møtedata ----------

let _data;
async function hentData() {
  if (!_data) {
    const r = await fetch("data/moter.json", { cache: "no-cache" });
    _data = await r.json();
  }
  return _data;
}

function iDag() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function tilDato(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function datoTekst(m) {
  const d = tilDato(m.dato);
  if (!d) return m.periode || "Dato ikke fastsatt";
  return `${DAGER[d.getDay()]} ${d.getDate()}. ${MANEDER[d.getMonth()]} ${d.getFullYear()}`;
}

function status(m) {
  const d = tilDato(m.dato);
  if (!d) return "kommende";
  return d < iDag() ? "forbi" : "kommende";
}

function nesteMote(moter) {
  return moter.find((m) => status(m) === "kommende") || null;
}

function dagerTil(m) {
  const d = tilDato(m.dato);
  if (!d) return null;
  return Math.round((d - iDag()) / 86400000);
}

function mesterTekst(m) {
  return m.tafsemestere.join(" og ");
}

// ---------- Innlogging og API ----------

let MEG = null; // navnet til den som er logget inn
let ADMIN = false;

async function api(sti, valg = {}) {
  const r = await fetch(`/api/${sti}`, { credentials: "same-origin", ...valg });
  let svar = null;
  try { svar = await r.json(); } catch (_) {}
  if (!r.ok) {
    const feil = new Error((svar && svar.feil) || `Noe gikk galt (${r.status})`);
    feil.status = r.status;
    throw feil;
  }
  return svar;
}

async function hvemErJeg() {
  try {
    const m = await api("meg");
    MEG = m.innlogget ? m.navn : null;
    ADMIN = !!m.admin;
  } catch (_) { MEG = null; ADMIN = false; }
  visInnloggetLinje();
  return MEG;
}

// ---------- Varsler ----------

let varselStartet = false;
let varslene = [];

async function hentVarsler() {
  if (!MEG || document.hidden) return;
  try {
    const { varsler, uleste } = await api("varsler");
    varslene = varsler;
    const tall = document.querySelector(".varsel-tall");
    tall.hidden = !uleste;
    tall.textContent = uleste > 9 ? "9+" : uleste;
    document.querySelector(".varsel-knapp").setAttribute("aria-label", uleste ? `Varsler, ${uleste} uleste` : "Varsler");
    tegnVarsler();
  } catch (_) {}
}

function tegnVarsler() {
  const liste = document.querySelector(".varsel-liste");
  liste.innerHTML = varslene.length
    ? varslene.map((v) => `<li><a href="${esc(v.lenke)}" data-varsel="${v.id}" class="${v.lest ? "" : "ulest"}">
        <span><strong>${esc(v.avsender)}</strong> ${esc(v.tekst)}</span>
        <span class="varsel-tid">${esc(tidTekst(v.opprettet))}</span></a></li>`).join("")
    : `<li class="varsel-tomt">Ingen varsler ennå.</li>`;
}

function startVarsler() {
  const boks = document.getElementById("varsel");
  if (!boks || varselStartet) return;
  varselStartet = true;
  boks.hidden = false;
  const knapp = boks.querySelector(".varsel-knapp");
  const panel = boks.querySelector(".varsel-panel");
  const lukk = () => { panel.hidden = true; knapp.setAttribute("aria-expanded", "false"); };
  knapp.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    knapp.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) hentVarsler();
  });
  document.addEventListener("click", (e) => { if (!boks.contains(e.target)) lukk(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { lukk(); knapp.focus(); } });
  boks.querySelector("#les-alle").addEventListener("click", async () => {
    await api("varsler/lest", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    hentVarsler();
  });
  panel.addEventListener("click", (e) => {
    const a = e.target.closest("[data-varsel]");
    if (!a) return;
    // Marker som lest uten å holde igjen navigeringen
    fetch("/api/varsler/lest", { method: "POST", credentials: "same-origin", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: Number(a.dataset.varsel) }) });
    lukk();
    setTimeout(hentVarsler, 400);
  });
  hentVarsler();
  setInterval(hentVarsler, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) hentVarsler(); });
}

// Ruller til og markerer elementet i adressens #-del (f.eks. #post-12 eller #sak-3)
function fremhevAnker() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("fremhevet");
  void el.offsetWidth;
  el.classList.add("fremhevet");
  return true;
}
window.addEventListener("hashchange", () => fremhevAnker());

function visInnloggetLinje() {
  if (MEG) startVarsler();
  const p = document.querySelector(".bunn-status");
  if (!p) return;
  p.innerHTML = MEG
    ? `Innlogget som <strong>${esc(MEG)}</strong>${ADMIN ? ` · <a href="invitasjoner.html">Invitasjoner</a>` : ""} · <a href="#" id="loggut">Logg ut</a>`
    : "";
  const l = document.getElementById("loggut");
  if (l) l.addEventListener("click", async (e) => {
    e.preventDefault();
    await api("loggut", { method: "POST" });
    location.reload();
  });
}

// Viser innloggingsport i `boks` til man er logget inn, og kjører `vedInnlogget` etterpå.
async function kreverInnlogging(boks, vedInnlogget) {
  if (await hvemErJeg()) return vedInnlogget(MEG);
  const [{ medlemmer }, registrerte] = await Promise.all([hentData(), api("brukere").catch(() => [])]);
  boks.innerHTML = `<form class="port skjema" id="port">
    <p class="overline">Kun for Tafsebrødre</p>
    <div class="felt"><label for="port-navn">Hvem er du?</label>
      <select id="port-navn" required><option value="">Velg navn</option>${medlemmer.map((n) => `<option>${esc(n)}</option>`).join("")}</select></div>
    <div id="port-felt"></div>
    <button class="knapp" type="submit" id="port-knapp">Gå inn</button>
    <div id="port-melding" role="status"></div>
  </form>`;
  const navn = boks.querySelector("#port-navn");
  const felt = boks.querySelector("#port-felt");
  const knapp = boks.querySelector("#port-knapp");
  let forsteGang = false;
  function oppdater() {
    forsteGang = navn.value && !registrerte.includes(navn.value);
    felt.innerHTML = !navn.value ? "" : forsteGang
      ? `<p style="text-align:left">${esc(navn.value)} har ikke laget bruker ennå. Åpne den personlige invitasjonslenken du har fått, eller <a href="velkommen.html?navn=${encodeURIComponent(navn.value)}">registrer deg med akademipassordet</a>.</p>`
      : `<div class="felt"><label for="passord">Ditt passord</label><input id="passord" type="password" autocomplete="current-password" required></div>`;
    knapp.hidden = !!forsteGang;
  }
  navn.addEventListener("change", oppdater);
  boks.querySelector("#port").addEventListener("submit", async (e) => {
    e.preventDefault();
    const melding = boks.querySelector("#port-melding");
    melding.innerHTML = "";
    knapp.disabled = true;
    try {
      const svar = await api("logginn", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ navn: navn.value, passord: boks.querySelector("#passord").value }) });
      MEG = svar.navn;
      await hvemErJeg();
      boks.innerHTML = "";
      vedInnlogget(MEG);
    } catch (err) {
      melding.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`;
    } finally {
      knapp.disabled = false;
    }
  });
}

function tidTekst(iso) {
  const d = new Date(iso);
  const sek = (Date.now() - d) / 1000;
  if (sek < 60) return "akkurat nå";
  if (sek < 3600) return `${Math.floor(sek / 60)} min siden`;
  if (sek < 86400) return `${Math.floor(sek / 3600)} t siden`;
  return `${d.getDate()}. ${MANEDER_KORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Beskjærer et profilbilde til et kvadrat og skalerer det ned.
async function krympProfilbilde(fil, str = 640) {
  let bilde;
  try {
    bilde = await createImageBitmap(fil, { imageOrientation: "from-image" });
  } catch (_) {
    throw new Error(`Klarte ikke å lese «${fil.name}». Prøv JPG eller PNG.`);
  }
  const side = Math.min(bilde.width, bilde.height);
  const lerret = document.createElement("canvas");
  lerret.width = lerret.height = Math.min(str, side);
  lerret.getContext("2d").drawImage(bilde, (bilde.width - side) / 2, (bilde.height - side) / 2, side, side, 0, 0, lerret.width, lerret.height);
  return await new Promise((ok) => lerret.toBlob(ok, "image/jpeg", 0.85));
}

// Rundt portrett: profilbilde hvis det finnes, ellers forbokstav i gull.
function avatar(navn, bildeId, liten = false) {
  const klasse = `medaljong${liten ? " liten" : ""}${bildeId ? " med-bilde" : ""}`;
  return bildeId
    ? `<div class="${klasse}"><img src="/api/bilder/${bildeId}" alt="" loading="lazy"></div>`
    : `<div class="${klasse}" aria-hidden="true">${esc((navn || "?")[0])}</div>`;
}

let _profiler;
async function hentProfiler() {
  if (!_profiler) {
    _profiler = {};
    try { (await api("profiler")).forEach((p) => (_profiler[p.navn] = p)); } catch (_) {}
  }
  return _profiler;
}

// Skalerer ned bilder i nettleseren før opplasting, så de blir raske og små.
async function krympBilde(fil) {
  let bilde;
  try {
    bilde = await createImageBitmap(fil, { imageOrientation: "from-image" });
  } catch (_) {
    throw new Error(`Klarte ikke å lese «${fil.name}». Prøv JPG eller PNG.`);
  }
  for (const [maks, kvalitet] of [[1800, 0.82], [1600, 0.72], [1280, 0.68]]) {
    const skala = Math.min(1, maks / Math.max(bilde.width, bilde.height));
    const lerret = document.createElement("canvas");
    lerret.width = Math.round(bilde.width * skala);
    lerret.height = Math.round(bilde.height * skala);
    lerret.getContext("2d").drawImage(bilde, 0, 0, lerret.width, lerret.height);
    const blob = await new Promise((ok) => lerret.toBlob(ok, "image/jpeg", kvalitet));
    if (blob && blob.size < 1_800_000) return blob;
  }
  throw new Error(`«${fil.name}» er for stort selv etter nedskalering.`);
}

// ---------- Lysboks for bilder ----------

function visBilde(src, tekst) {
  let boks = document.getElementById("lysboks");
  if (!boks) {
    boks = document.createElement("div");
    boks.id = "lysboks";
    boks.className = "lysboks";
    boks.setAttribute("role", "dialog");
    boks.setAttribute("aria-modal", "true");
    boks.innerHTML = `<button class="knapp sekundar lukk" type="button">Lukk</button><img alt=""><p class="dempet" style="margin:0"></p>`;
    document.body.append(boks);
    const lukk = () => boks.classList.remove("apen");
    boks.querySelector(".lukk").addEventListener("click", lukk);
    boks.addEventListener("click", (e) => { if (e.target === boks) lukk(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lukk(); });
  }
  boks.querySelector("img").src = src;
  boks.querySelector("img").alt = tekst || "";
  boks.querySelector("p").textContent = tekst || "";
  boks.classList.add("apen");
  boks.querySelector(".lukk").focus();
}

// ---------- Salongen: postestrøm ----------
// Bygger en strøm med poster i `boks`. Med `mote` vises og knyttes bare poster til det møtet.

async function byggStrom(boks, { mote = null, plassholder } = {}) {
  const { moter } = await hentData();
  const moteNavn = Object.fromEntries(moter.map((m) => [m.id, m.navn]));
  const profiler = await hentProfiler();
  const bildeAv = (n) => (profiler[n] || {}).bilde_id;
  const neste = nesteMote(moter);
  const valg = mote ? "" : `<div class="felt" style="flex:1 1 220px"><label for="p-mote">Knytt til møte (valgfritt)</label>
      <select id="p-mote"><option value="">Ingen</option>${moter.map((m) => `<option value="${esc(m.id)}">${esc(m.navn)}</option>`).join("")}</select></div>`;

  boks.innerHTML = `
    <form class="skjema skriv-post" id="ny-post">
      <div class="post-hode">${avatar(MEG, bildeAv(MEG), true)}<strong>${esc(MEG)}</strong></div>
      <div class="felt"><label for="p-tekst" class="skjult">Ny post</label>
        <textarea id="p-tekst" maxlength="5000" placeholder="${esc(plassholder || `Hva tenker du på, ${MEG}?`)}"></textarea></div>
      <div style="display:flex; gap:18px; flex-wrap:wrap; align-items:flex-end">
        <div class="felt" style="flex:1 1 220px"><label for="p-fil">Bilde (valgfritt)</label><input id="p-fil" type="file" accept="image/*"></div>
        ${valg}
        <button class="knapp" type="submit">Publiser</button>
      </div>
      <div id="p-melding" role="status"></div>
    </form>
    <div class="strom" id="strom"></div>
    <div style="text-align:center; margin-top:20px"><button class="knapp sekundar" type="button" id="flere" hidden>Vis eldre poster</button></div>`;

  const strom = boks.querySelector("#strom");
  const flere = boks.querySelector("#flere");
  let poster = [];

  function postHtml(p) {
    const skalt = p.skal.includes(MEG);
    const merke = p.mote && !mote ? `<a class="post-mote" href="mote.html?id=${encodeURIComponent(p.mote)}">${esc(moteNavn[p.mote] || p.mote)}</a>` : "";
    return `<article class="post" id="post-${p.id}" data-id="${p.id}">
      <div class="post-hode">
        ${avatar(p.navn, bildeAv(p.navn), true)}
        <div><strong>${esc(p.navn)}</strong><div class="dempet post-tid">${esc(tidTekst(p.opprettet))}${merke ? " · " + merke : ""}</div></div>
        ${p.navn === MEG ? `<button class="liten-knapp" style="margin-left:auto" data-slett-post="${p.id}">Slett</button>` : ""}
      </div>
      ${p.tekst ? `<p class="post-tekst">${esc(p.tekst)}</p>` : ""}
      ${p.bilde_id ? `<button class="post-bilde" type="button" data-bilde="${p.bilde_id}" aria-label="Vis bildet større"><img src="/api/bilder/${p.bilde_id}" alt="Bilde fra ${esc(p.navn)}" loading="lazy"></button>` : ""}
      <div class="post-handlinger">
        <button class="liten-knapp${skalt ? " skalt" : ""}" data-skal="${p.id}" aria-pressed="${skalt}">Skål${p.skal.length ? ` · ${p.skal.length}` : ""}</button>
        ${p.skal.length ? `<span class="dempet" style="font-size:15px">${esc(p.skal.join(", "))}</span>` : ""}
      </div>
      <div class="svar-liste">
        ${p.svar.map((s) => `<div class="svar"><strong>${esc(s.navn)}</strong> <span class="post-tekst">${esc(s.tekst)}</span>
          <span class="dempet post-tid">${esc(tidTekst(s.opprettet))}${s.navn === MEG ? ` · <button class="lenkeknapp" data-slett-svar="${s.id}">slett</button>` : ""}</span></div>`).join("")}
        <form class="svar-skjema" data-svar="${p.id}">
          <label class="skjult" for="svar-${p.id}">Svar</label>
          <input id="svar-${p.id}" maxlength="3000" placeholder="Skriv et svar …">
          <button class="liten-knapp" type="submit">Svar</button>
        </form>
      </div>
    </article>`;
  }

  function tegn() {
    strom.innerHTML = poster.length
      ? poster.map(postHtml).join("")
      : `<p class="tomt">Ingen poster ennå.</p>`;
  }

  async function last(eldre = false) {
    try {
      const sti = `poster?${mote ? `mote=${encodeURIComponent(mote)}&` : ""}${eldre && poster.length ? `for=${poster[poster.length - 1].id}` : ""}`;
      const nye = await api(sti);
      poster = eldre ? poster.concat(nye) : nye;
      flere.hidden = nye.length < 30;
      tegn();
    } catch (err) {
      strom.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`;
    }
  }

  async function oppfrisk(id) {
    // Henter strømmen på nytt, men beholder hvor mange som er lastet
    const antall = poster.length;
    await last();
    while (poster.length < antall && !flere.hidden) await last(true);
  }

  boks.querySelector("#ny-post").addEventListener("submit", async (e) => {
    e.preventDefault();
    const knapp = e.target.querySelector("button[type=submit]");
    const melding = boks.querySelector("#p-melding");
    const t = boks.querySelector("#p-tekst").value.trim();
    const fil = boks.querySelector("#p-fil").files[0];
    if (!t && !fil) { melding.innerHTML = `<p class="melding feil">Skriv noe eller velg et bilde.</p>`; return; }
    knapp.disabled = true;
    melding.innerHTML = fil ? `<p class="melding">Laster opp bildet …</p>` : "";
    try {
      const fd = new FormData();
      fd.append("tekst", t);
      const m = mote || (boks.querySelector("#p-mote") || {}).value;
      if (m) fd.append("mote", m);
      if (fil) fd.append("fil", await krympBilde(fil), "bilde.jpg");
      await api("poster", { method: "POST", body: fd });
      e.target.reset();
      melding.innerHTML = "";
      await last();
    } catch (err) {
      melding.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`;
    } finally {
      knapp.disabled = false;
    }
  });

  strom.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    try {
      if (b.dataset.skal) { await api(`poster/${b.dataset.skal}/skal`, { method: "POST" }); await oppfrisk(); }
      else if (b.dataset.slettPost) { if (confirm("Slette posten?")) { await api(`poster/${b.dataset.slettPost}`, { method: "DELETE" }); await oppfrisk(); } }
      else if (b.dataset.slettSvar) { if (confirm("Slette svaret?")) { await api(`svar/${b.dataset.slettSvar}`, { method: "DELETE" }); await oppfrisk(); } }
      else if (b.dataset.bilde) {
        const p = poster.find((x) => String(x.bilde_id) === b.dataset.bilde);
        visBilde(`/api/bilder/${b.dataset.bilde}`, p ? `${p.navn}${p.tekst ? ": " + p.tekst : ""}` : "");
      }
    } catch (err) { alert(err.message); }
  });

  strom.addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-svar]");
    if (!f) return;
    e.preventDefault();
    const inn = f.querySelector("input");
    if (!inn.value.trim()) return;
    try {
      await api(`poster/${f.dataset.svar}/svar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tekst: inn.value }) });
      await oppfrisk();
    } catch (err) { alert(err.message); }
  });

  flere.addEventListener("click", () => last(true));
  await last();
  fremhevAnker();
}

// ---------- Aktivitetsskår og rang ----------

const RANGER = [
  [0, "Tiro", "rekrutt"],
  [10, "Kvestor", ""],
  [25, "Ædil", ""],
  [50, "Pretor", ""],
  [80, "Konsul", ""],
  [130, "Pater Patriae", "fedrelandets far"],
];
const HANDLINGER = {
  poster: ["Post i Salongen", "poster"],
  bilder: ["Bilder fra et møte (per møte)", "møter med bilder"],
  svar: ["Svar eller kommentar", "svar"],
  saker: ["Sak meldt inn", "saker"],
  stemmer: ["Stemme avgitt", "stemmer"],
  skalMottatt: ["Skål fra en annen bror", "skåler"],
  profil: ["Presentasjon skrevet (én gang)", "presentasjon"],
  seier: ["Overlevde Idus Martiae (én gang)", "seier"],
};
function rang(skar) {
  let i = 0;
  while (i + 1 < RANGER.length && skar >= RANGER[i + 1][0]) i++;
  const neste = RANGER[i + 1];
  const fra = RANGER[i][0];
  return { navn: RANGER[i][1], neste, andel: neste ? (skar - fra) / (neste[0] - fra) : 1 };
}
function skarHtml(a, vekt) {
  if (!a) return "";
  const r = rang(a.skar);
  const deler = Object.entries(a.detaljer).filter(([, v]) => v > 0)
    .map(([k, v]) => `<li><span>${HANDLINGER[k][0]}</span><span>${v} × ${vekt[k]} = ${v * vekt[k]}</span></li>`).join("");
  return `<div class="skar">
    <div class="skar-topp"><span class="skar-tall">${a.skar}</span><span class="skar-rang">${esc(r.navn)}</span></div>
    <div class="skar-stolpe" role="img" aria-label="${r.neste ? `${r.neste[0] - a.skar} poeng til ${r.neste[1]}` : "Høyeste rang"}"><span style="width:${Math.round(r.andel * 100)}%"></span></div>
    <p class="skar-neste">${r.neste ? `${r.neste[0] - a.skar} poeng til ${esc(r.neste[1])}` : "Høyeste rang er nådd"}</p>
    ${deler ? `<details class="skar-detaljer"><summary>Slik er skåren regnet ut</summary><ul>${deler}</ul></details>` : ""}
  </div>`;
}

byggRamme();
hvemErJeg();
