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

// Gjester ser bare spillhallen. Et lite merke i nettleseren gjør at menyen og
// omdirigeringen er på plass før siden tegnes; serveren stenger uansett alt annet.
const herSide = () => (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
// Rollen huskes i et lite merke («bror» eller «gjest») så menyen blir riktig med en gang.
// Serveren (functions/_middleware.js) stenger uansett alle andre sider enn spillhallen for ikke-brødre.
const rolle = () => (document.cookie.match(/(?:^|;\s*)tafserolle=(bror|gjest)/) || [])[1] || "";
const erGjestemerke = () => rolle() === "gjest";
function settRolle(r) {
  document.cookie = r ? `tafserolle=${r}; Path=/; Max-Age=31536000; SameSite=Lax` : "tafserolle=; Path=/; Max-Age=0; SameSite=Lax";
}
const settGjestemerke = (pa) => settRolle(pa ? "gjest" : "");
// Navn slik de vises. De som har registrert seg selv, heter «Navn (gjest)» i databasen, men det vises ikke.
const visningsnavn = (navn) => String(navn || "").replace(/ \(gjest\)$/, "");
// Det samme for ferdig tekst der navn står inne i setningen, som i varsler og loggen i Symposion
const utenGjest = (tekst) => String(tekst || "").replace(/ \(gjest\)/g, "");
// Spillsiden (tafsespill) er et eget nettsted med samme kode. Porten (functions/_middleware.js)
// setter et merke, så siden vet hvor den er før noe er lastet.
const SPILLSIDE = /(?:^|;\s*)tafsenettsted=spill/.test(document.cookie);
if (SPILLSIDE) { document.documentElement.classList.add("spillside"); document.title = document.title.replace(/· TAFSE$/, "· Tafse-spill"); }
const gjestTillatt = () => herSide() === "gjest" || GJESTESPILL.some(([s]) => s === herSide());
// Full meny bare for brødre. Sider utenfor spillhallen slipper serveren bare brødre inn på.
const visBrorside = () => !SPILLSIDE && (rolle() === "bror" || (!gjestTillatt() && rolle() !== "gjest"));

function menyHtml() {
  const her = herSide();
  const sider = !visBrorside() ? [["gjest.html", "Spillhallen"], ...GJESTESPILL.map(([s, n]) => [`${s}.html`, n])] : SIDER;
  return sider.map(([fil, navn]) => {
    const stamme = fil.replace(/\.html$/, "");
    const aktiv = stamme === her || (visBrorside() && ((her === "mote" && stamme === "moter") || (["spill", "honningfella", "2048", "murbrekker", "tetris", "snake", "hotell", "tartaros", "kaos", "gjest"].includes(her) && stamme === "symposion") || (her === "bror" && stamme === "medlemmer")));
    return `<a href="${fil}"${aktiv ? ' class="aktiv" aria-current="page"' : ""}>${navn}</a>`;
  }).join("");
}

function oppdaterMeny() {
  const nav = document.getElementById("hovedmeny");
  if (nav) nav.innerHTML = menyHtml();
  const merke = document.querySelector(".topp .merke");
  if (merke) merke.href = visBrorside() ? "index.html" : "gjest.html";
  const bunntekst = document.querySelector(".bunn .bunn-tekst");
  if (bunntekst && !bunntekst.classList.contains("bunn-status")) bunntekst.textContent = bunnTekst();
}

const bunnTekst = () => (visBrorside() ? "Taffelakademiet for Samvær og Etegilder" : "");
// Hvor man logger inn: spillhallen på spillsiden, salongen på hovedsiden
const loggInnSide = () => (SPILLSIDE ? "gjest.html" : "salongen.html");
const merkeTekst = () => (SPILLSIDE ? `TAFSE<em>SPILL</em>` : "TAFSE");

function byggRamme() {
  const meny = menyHtml();
  const topp = document.createElement("header");
  topp.className = "topp";
  topp.innerHTML = `<div class="meander" aria-hidden="true"></div>
  <div class="topp-inner">
    <a class="merke" href="${visBrorside() ? "index.html" : "gjest.html"}">${LOGO}<span>${merkeTekst()}</span></a>
    <nav class="meny" id="hovedmeny" aria-label="Hovedmeny">${meny}</nav>
    <button class="varsel-knapp post-knapp" id="post-knapp" type="button" aria-label="Innboks" hidden><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg><span class="varsel-tall" hidden></span></button>
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
  <p class="bunn-tekst">${bunnTekst()}</p>
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
let GJEST = false; // gjester er bare innlogget på spillsidene, som «Navn (gjest)»
const GJESTESPILL = [["tartaros", "Tartaros"], ["kaos", "Kaos"], ["symposion", "Symposion"], ["spill", "Idus Martiae"], ["2048", "2048"], ["murbrekker", "Murbrekker"], ["tetris", "Tetris"], ["snake", "Snake"], ["hotell", "Tafse Hotell"]];
const SPILLSIDER_STAMMER = ["gjest", "honningfella", ...GJESTESPILL.map(([s]) => s)];
const paaGjesteside = () => GJESTESPILL.some(([s]) => s === (location.pathname.split("/").pop() || "").replace(/\.html$/, ""));

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
    const gjestOkt = !m.innlogget && !!m.gjest;
    if (gjestOkt && !gjestTillatt()) { settGjestemerke(true); location.replace("gjest.html"); return null; }
    const ny = m.innlogget ? "bror" : gjestOkt ? "gjest" : "";
    if (ny !== rolle()) { settRolle(ny); oppdaterMeny(); }
    GJEST = gjestOkt && paaGjesteside();
    MEG = m.innlogget || GJEST ? m.navn : null;
    ADMIN = !!m.admin;
  } catch (_) { MEG = null; ADMIN = false; GJEST = false; }
  visInnloggetLinje();
  const pk = document.getElementById("post-knapp");
  // Innboksen finnes bare på spillsiden, for både brødre og gjester
  if (pk) {
    pk.hidden = !(SPILLSIDE && MEG);
    if (!pk.dataset.klar) { pk.dataset.klar = "1"; pk.addEventListener("click", () => visPost()); setInterval(tellPost, 45000); }
    tellPost();
  }
  return MEG;
}

// ---------- Varsler ----------

let varselStartet = false;
let varslene = [];

async function hentVarsler() {
  if (!MEG || document.hidden) return;
  try {
    const svar = await api("varsler");
    // Spillsiden viser bare varsler fra spillene
    const erSpill = (v) => SPILLSIDER_STAMMER.includes(String(v.lenke || "").replace(/^\//, "").split(/[.?#]/)[0]);
    const varsler = SPILLSIDE ? svar.varsler.filter(erSpill) : svar.varsler;
    const uleste = SPILLSIDE ? varsler.filter((v) => !v.lest).length : svar.uleste;
    varslene = varsler;
    const tall = document.querySelector("#varsel .varsel-tall");
    tall.hidden = !uleste;
    tall.textContent = uleste > 9 ? "9+" : uleste;
    document.querySelector("#varsel .varsel-knapp").setAttribute("aria-label", uleste ? `Varsler, ${uleste} uleste` : "Varsler");
    tegnVarsler();
  } catch (_) {}
}

function tegnVarsler() {
  const liste = document.querySelector(".varsel-liste");
  liste.innerHTML = varslene.length
    ? varslene.map((v) => `<li><a href="${esc(v.lenke)}" data-varsel="${v.id}" class="${v.lest ? "" : "ulest"}">
        <span><strong>${esc(visningsnavn(v.avsender))}</strong> ${esc(utenGjest(v.tekst))}</span>
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
  if (MEG && !GJEST) startVarsler();
  const p = document.querySelector(".bunn-status");
  if (!p) return;
  p.innerHTML = GJEST
    ? `Innlogget som <strong>${esc(visningsnavn(MEG))}</strong> · <a href="#" id="loggut">Logg ut</a>`
    : MEG
    ? `Innlogget som <strong>${esc(MEG)}</strong>${paaGjesteside() ? ` · <a href="gjest.html">Inviter en gjest</a>` : ""}${ADMIN ? (SPILLSIDE ? ` · <a href="gjester.html">Gjestene</a>` : ` · <a href="invitasjoner.html">Invitasjoner</a>`) : ""} · <a href="#" id="loggut">Logg ut</a>`
    : paaGjesteside() ? `<a href="gjest.html">Logg inn i spillhallen</a>` : "";
  const l = document.getElementById("loggut");
  if (l) l.addEventListener("click", async (e) => {
    e.preventDefault();
    await api("loggut", { method: "POST" });
    settRolle("");
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
// Titler fra Symposion (rådsmann, senator …) ved navnet i Salongen
let TITLER = null;
const tittelMerke = (navn) => `<span class="tittel" data-tittel="${esc(navn)}"></span>`;
async function pyntTitler(rot) {
  if (!TITLER) TITLER = api("symposion/titler").catch(() => ({}));
  const t = await TITLER;
  rot.querySelectorAll("[data-tittel]").forEach((el) => {
    const x = t[el.dataset.tittel];
    el.textContent = x && x !== "Borger" ? x : "";
  });
}

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
        <div><strong>${esc(p.navn)}</strong>${tittelMerke(p.navn)}<div class="dempet post-tid">${esc(tidTekst(p.opprettet))}${merke ? " · " + merke : ""}</div></div>
        ${p.navn === MEG ? `<button class="liten-knapp" style="margin-left:auto" data-slett-post="${p.id}">Slett</button>` : ""}
      </div>
      ${p.tekst ? `<p class="post-tekst">${esc(p.tekst)}</p>` : ""}
      ${p.bilde_id ? `<button class="post-bilde" type="button" data-bilde="${p.bilde_id}" aria-label="Vis bildet større"><img src="/api/bilder/${p.bilde_id}" alt="Bilde fra ${esc(p.navn)}" loading="lazy"></button>` : ""}
      <div class="post-handlinger">
        <button class="liten-knapp${skalt ? " skalt" : ""}" data-skal="${p.id}" aria-pressed="${skalt}">Skål${p.skal.length ? ` · ${p.skal.length}` : ""}</button>
        ${p.skal.length ? `<span class="dempet" style="font-size:15px">${esc(p.skal.join(", "))}</span>` : ""}
      </div>
      <div class="svar-liste">
        ${p.svar.map((s) => `<div class="svar"><strong>${esc(s.navn)}</strong>${tittelMerke(s.navn)} <span class="post-tekst">${esc(s.tekst)}</span>
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
    pyntTitler(strom);
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

if (erGjestemerke() && !gjestTillatt()) location.replace("gjest.html");
byggRamme();
hvemErJeg();

// ---------- Infoboks: «Slik spiller du» ----------
// Viser en forklaring over siden. Lukkes med knappen, Escape eller ved å trykke utenfor.
// Premien et spill ga, til sluttskjermen. svar er det serveren sendte da resultatet ble lagret.
function premieTekst(svar) {
  const p = svar && svar.premie;
  if (!p) return "";
  return ` Du fikk <strong>${p.antall.toLocaleString("nb-NO")} ${esc(p.navn)}</strong> til <a href="hotell.html">Tafse Hotell</a>${p.dobbel ? ", dobbelt opp for dagens første spill" : ""}.`;
}

// Velkomstplakaten på spillsiden: hvordan hotellet, Symposion og spillene henger sammen.
// Vises etter innsjekken og fra spillhallen. vedLukk kjøres når plakaten lukkes.
// ENDRINGSLOGGEN («Hva er nytt»). Nyeste først. Legg til en ny oppføring øverst når noe er endret.
// id må være unik og øke, så knappen kan vise at det er noe nytt siden sist.
const ENDRINGER = [
  { id: 8, dato: "20. november", tittel: "Hotellet og Symposion henger sammen", punkter: [
    "Hotellet har fått sin egen mynt, denarer. Åpne «Kontoret» under rommet i hotellet.",
    "Rommet ditt tjener leie hele døgnet. Jo bedre innredet og jo flere stjerner fra gjestene, jo mer. Hent leien på rommet.",
    "Baren kjøper råvarer fra godset ditt, også honning, sølv, krydder og purpur. Hver dag ønsker den seg én vare og betaler dobbelt.",
    "I resepsjonen kjøper du avtaler som varer en uke: 10 % mer av alt på godset, større lager eller raskere tokt.",
  ] },
  { id: 7, dato: "20. november", tittel: "Bedre handel i Symposion", punkter: [
    "Festen går i pluss: hele godset jobber 15 % bedre i 8 timer, og det koster bare en times produksjon. Knappen viser hva festen gir.",
    "Lange fingre koster nå 50 vin, og gir et blindt grep: du tar mellom 0 og 50 % av en tilfeldig råvare fra naboens lager, og ser først etterpå hva det ble. Store grep er sjeldne.",
    "Gaver til byggverkene gir dobbelt så mye ære som før.",
    "Krydder og purpur er verdt mer når du gir dem til byggverkene.",
    "Ansatte er dyrere å ansette og forfremme. De du allerede har, beholder nivået.",
    "Festen gir litt mindre ære: 10 pluss 1 for hvert nivå de ansatte har.",
    "Ny knapp: «Hva er nytt», den du leser nå.",
  ] },
  { id: 6, dato: "20. november", tittel: "Rettelser", punkter: [
    "Alle titler følger nå dagens rangstige.",
    "Knappene for å ansette og forfremme folk på godset virket ikke. Nå gjør de det.",
  ] },
  { id: 5, dato: "20. november", tittel: "Nytt spill og levende kart", punkter: [
    "Kaos: et nytt sandkassespill med stoffer, oppdagelser, dagens oppdrag og galleri.",
    "Symposion: kartet lever, og mye kan gjøres rett på kartet.",
  ] },
  { id: 4, dato: "19. november", tittel: "Nabolag og rettelser i Symposion", punkter: [
    "Byen er delt i nabolag etter ære: de fire med mest ære bor på Akropolis, så Midtbyen og Utkanten.",
    "Praktfest med krydder og purpur, og Fyrtårnet er flyttet fram, rett etter tempelet.",
    "Varsel i bjella når skipet ditt er hjemme.",
    "Skjenking krever at du har råd til gaven, og vanlige skjenker fyller ikke lenger opp Byens røst.",
    "Spillhallen viser de siste ti spillene.",
  ] },
  { id: 3, dato: "19. november", tittel: "Ære og rang", punkter: [
    "Ære får du bare for å gi: skjenke naboene, ta dagens runde, gi til byggverkene og holde fest. Den kan ikke brukes på noe.",
    "Ti ranger fra Borger til Heros, med ny pynt på godset for hver.",
    "Æresbutikken er blitt Torget, der varene koster råvarer.",
    "Skjenking er en ekte gave på 10 % av det godset ditt lager i timen, og dagens runde gir en bonus for fem skjenk på én dag.",
  ] },
  { id: 2, dato: "19. november", tittel: "Havn, ansatte og nye råvarer", punkter: [
    "Nye bygg: bigård (honning), sølvgruve (sølv) og havn. Skipet henter krydder og purpur fra Kreta, Tyros og Egypt.",
    "Ansatte som gjør godset mer effektivt, og fest for folkene.",
    "Kartet kan zoomes og dras, og byggkortene viser hva neste nivå gir.",
    "Råvarene står i en stolpe til venstre som følger med når du blar.",
  ] },
  { id: 1, dato: "18. november", tittel: "Hotellet og spillhallen", punkter: [
    "Tafse Hotell: garderobe med faner, nye figurer og møbler som kan snus.",
    "Spillhallen: ukens topp tre i hvert spill, innboks og lager.",
    "Tartaros: ny bane, Flegeton.",
  ] },
];
const SETT_ENDRINGER = "tafse-endringer-sett";
function nyeEndringer() {
  try { return ENDRINGER[0].id > Number(localStorage.getItem(SETT_ENDRINGER) || 0); } catch (_) { return false; }
}
function endringsknapp() {
  return `<button class="liten-knapp sy-nyttknapp${nyeEndringer() ? " ny" : ""}" type="button" onclick="visEndringer()">Hva er nytt</button>`;
}
function visEndringer() {
  visInfo("Hva er nytt", `<div class="endringer">${ENDRINGER.map((e) => `<section><p class="overline">${esc(e.dato)}</p><h3>${esc(e.tittel)}</h3>
    <ul>${e.punkter.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>`).join("")}</div>`);
  try { localStorage.setItem(SETT_ENDRINGER, String(ENDRINGER[0].id)); } catch (_) {}
  document.querySelectorAll(".sy-nyttknapp.ny").forEach((k) => k.classList.remove("ny"));
}

const PREMIER = [
  ["Symposion", "symposion", "oliven, vin og marmor", "#9db36a", "Høstes på godset ditt, også mens du er borte"],
  ["Tartaros", "tartaros", "drakmer", "#e2c174", "Mynter, bosser og tid i hvert tokt"],
  ["Kaos", "kaos", "gnister", "#6ea8ff", "Oppdagelser, dagens oppdrag og stjerner i galleriet"],
  ["2048", "2048", "mosaikkbiter", "#6fc3c9", "1 for hver 100 poeng"],
  ["Murbrekker", "murbrekker", "teglstein", "#c8683f", "1 for hver 50 poeng"],
  ["Tetris", "tetris", "steinblokker", "#9a8fd0", "1 for hver 300 poeng"],
  ["Snake", "snake", "slangeskinn", "#7fb04f", "1 for hver 5 poeng"],
  ["Idus Martiae", "spill", "dolker", "#c9c9d2", "1 for hver 2 poeng"],
];
function visPlakat(vedLukk) {
  visInfo("Velkommen til Tafse-spill", `
    <div class="plakat">
      <p class="plakat-ingress">Alle spillene henger sammen. Det du vinner i ett spill, kan du bruke på hotellet.</p>
      <div class="plakat-to">
        <section><p class="overline">Tafse Hotell</p>
          <p>Her møtes alle. Gå rundt, prat, skål og besøk rommene til de andre. Du har fått ditt eget rom, og under det ligger butikken med møbler, klær og kjæledyr. På «Kontoret» tjener du denarer på leie og salg til baren, og bruker dem på avtaler som får godset ditt til å gå bedre.</p></section>
        <section><p class="overline">Symposion</p>
          <p>Du har fått et hus i byen. Høst råvarer, bygg ut godset, ansett folk og send skip på tokt. Skjenk naboene og gi til byens byggverk, så får du ære og stiger i rang. Jo større villa, jo større blir rommet ditt på hotellet.</p></section>
      </div>
      <p class="overline">Slik tjener du til butikken</p>
      <table class="tavle plakat-tabell"><thead><tr><th>Spill</th><th>Du får</th><th>Slik</th></tr></thead><tbody>
        ${PREMIER.map(([navn, side, premie, farge, slik]) => `<tr><td><a href="${side}.html">${navn}</a></td><td><i class="plakat-prikk" style="background:${farge}"></i>${premie}<span class="plakat-slik">${slik}</span></td><td>${slik}</td></tr>`).join("")}
      </tbody></table>
      <ul class="plakat-tips">
        <li>Dagens første spill i hvert spill gir <strong>dobbel premie</strong>.</li>
        <li>Noen møbler koster flere slags premier, andre bare én. Trofeene krever i tillegg en bragd i spillet, for eksempel brikken 2048.</li>
        <li>Drakmene fra Tartaros kan også brukes på varige oppgraderinger i leiren der.</li>
      </ul>
      <p><button class="knapp" type="button" data-lukk>Sett i gang</button></p>
    </div>`);
  const d = document.getElementById("infoboks");
  if (vedLukk) d.addEventListener("close", vedLukk, { once: true });
}

// ---------- Innboksen på spillsiden: private meldinger mellom spillerne (lib/innboks.js) ----------
const ROMNAVN = { lobbyen: "Lobbyen", baren: "Baren", terrassen: "Terrassen", auditoriet: "Auditoriet" };
const romTekst = (rom) => ROMNAVN[rom] || (rom && rom.startsWith("hjem:") ? (rom.slice(5) === MEG ? "rommet ditt" : `rommet til ${visningsnavn(rom.slice(5))}`) : "hotellet");
let postMed = null, postTid = null, postNokkel = "";
function postTall(n) {
  const k = document.getElementById("post-knapp");
  if (!k) return;
  const tall = k.querySelector(".varsel-tall");
  tall.hidden = !n; tall.textContent = n > 9 ? "9+" : n;
  k.setAttribute("aria-label", n ? `Innboks, ${n} uleste` : "Innboks");
}
async function tellPost() {
  if (!SPILLSIDE || !MEG || document.hidden) return;
  try { postTall((await api("innboks?tell=1")).uleste); } catch (_) {}
}
async function tegnPost() {
  const boks = document.getElementById("post");
  if (!boks) return;
  try {
    if (postMed) {
      const s = await api(`innboks/${encodeURIComponent(postMed)}`);
      postTall(s.uleste);
      const nokkel = JSON.stringify([postMed, s.meldinger.length, s.meldinger.at(-1)?.id]);
      if (nokkel === postNokkel) return;
      postNokkel = nokkel;
      const utkast = document.getElementById("post-tekst")?.value || "";
      boks.innerHTML = `<p><button class="lenkeknapp" type="button" data-post-tilbake>← Alle samtaler</button></p>
        <h3 class="post-med">${esc(visningsnavn(postMed))}</h3>
        <ol class="post-traad">${s.meldinger.length ? s.meldinger.map((m) => `<li class="${m.min ? "min" : ""}"><p>${esc(m.tekst)}</p><time>${esc(tidTekst(m.tid))}</time></li>`).join("") : `<li class="tom">Ingen meldinger ennå. Skriv den første.</li>`}</ol>
        <form class="post-skjema" id="post-skjema"><textarea id="post-tekst" maxlength="500" rows="2" placeholder="Skriv til ${esc(visningsnavn(postMed))} …" aria-label="Melding"></textarea><button class="knapp" type="submit">Send</button></form>
        <p class="melding feil" id="post-feil" hidden></p>`;
      const felt = document.getElementById("post-tekst"); felt.value = utkast; felt.focus();
      const traad = boks.querySelector(".post-traad"); traad.scrollTop = traad.scrollHeight;
    } else {
      const s = await api("innboks");
      postTall(s.uleste);
      const nokkel = JSON.stringify(s);
      if (nokkel === postNokkel) return;
      postNokkel = nokkel;
      const inne = s.folk.filter((f) => f.rom), harSamtale = new Set(s.samtaler.map((x) => x.med));
      const rom = Object.fromEntries(s.folk.map((f) => [f.navn, f.rom]));
      boks.innerHTML = `
        <p class="overline">På hotellet nå</p>
        ${inne.length ? `<ul class="post-inne">${inne.map((f) => `<li><span class="post-prikk"></span><strong>${esc(visningsnavn(f.navn))}</strong> er i ${esc(romTekst(f.rom))} <a href="hotell.html?rom=${encodeURIComponent(f.rom)}">Gå dit</a></li>`).join("")}</ul>` : `<p class="dempet">Ingen andre er inne akkurat nå.</p>`}
        <p class="overline">Samtaler</p>
        ${s.samtaler.length ? `<ul class="post-liste">${s.samtaler.map((x) => `<li><button type="button" data-post-med="${esc(x.med)}" class="${x.uleste ? "ulest" : ""}"><strong>${rom[x.med] ? `<span class="post-prikk"></span>` : ""}${esc(visningsnavn(x.med))}${x.uleste ? `<em>${x.uleste}</em>` : ""}</strong><span>${x.min ? "Du: " : ""}${esc(x.tekst.slice(0, 80))}</span><time>${esc(tidTekst(x.tid))}</time></button></li>`).join("")}</ul>` : `<p class="dempet">Du har ingen samtaler ennå.</p>`}
        <p class="overline">Skriv til noen</p>
        <div class="post-folk">${s.folk.filter((f) => !harSamtale.has(f.navn)).map((f) => `<button type="button" class="liten-knapp" data-post-med="${esc(f.navn)}">${esc(visningsnavn(f.navn))}</button>`).join("") || `<span class="dempet">Du har en samtale med alle som har sjekket inn.</span>`}</div>`;
    }
  } catch (e) { boks.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`; }
}
// Åpner innboksen. Med et navn åpnes samtalen med den personen.
function visPost(med) {
  postMed = med || null; postNokkel = "";
  visInfo("Innboks", `<div class="post" id="post"><p class="dempet">Laster …</p></div>`);
  const d = document.getElementById("infoboks"), boks = document.getElementById("post");
  boks.addEventListener("click", (e) => {
    const k = e.target.closest("button");
    if (!k) return;
    if (k.dataset.postMed) { postMed = k.dataset.postMed; postNokkel = ""; tegnPost(); }
    else if (k.dataset.postTilbake !== undefined) { postMed = null; postNokkel = ""; tegnPost(); }
  });
  const sendPost = async () => {
    const felt = document.getElementById("post-tekst"), tekst = felt.value.trim();
    if (!tekst) return;
    try { await api("innboks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ til: postMed, tekst }) }); felt.value = ""; postNokkel = ""; tegnPost(); }
    catch (err) { const f = document.getElementById("post-feil"); f.textContent = err.message; f.hidden = false; }
  };
  boks.addEventListener("submit", (e) => { e.preventDefault(); sendPost(); });
  boks.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && e.target.id === "post-tekst") { e.preventDefault(); sendPost(); } });
  clearInterval(postTid);
  postTid = setInterval(() => { if (d.open && document.getElementById("post")) tegnPost(); else { clearInterval(postTid); tellPost(); } }, 5000);
  tegnPost();
}

function visInfo(tittel, innhold) {
  let d = document.getElementById("infoboks");
  if (!d) {
    d = document.createElement("dialog");
    d.id = "infoboks";
    d.className = "infoboks";
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-lukk]")) d.close(); });
    document.body.append(d);
  }
  d.innerHTML = `<div class="infoboks-innhold"><div class="infoboks-hode"><h2>${esc(tittel)}</h2><button class="liten-knapp" type="button" data-lukk>Lukk</button></div>${innhold}</div>`;
  d.showModal();
  d.querySelector(".infoboks-innhold").scrollTop = 0;
}
