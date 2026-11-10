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
  ["index.html", "Forside"],
  ["kalender.html", "Kalender"],
  ["vedtekter.html", "Vedtekter"],
  ["forslag.html", "Forslag"],
  ["moter.html", "Møtene"],
  ["medlemmer.html", "Brødrene"],
  ["fortellingen.html", "Fortellingen"],
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
    const aktiv = stamme === her || (her === "mote" && stamme === "moter");
    return `<a href="${fil}"${aktiv ? ' class="aktiv" aria-current="page"' : ""}>${navn}</a>`;
  }).join("");
  const topp = document.createElement("header");
  topp.className = "topp";
  topp.innerHTML = `<div class="meander" aria-hidden="true"></div>
  <div class="topp-inner">
    <a class="merke" href="index.html">${LOGO}<span>TAFSE</span></a>
    <button class="meny-knapp" aria-expanded="false" aria-controls="hovedmeny">Meny</button>
    <nav class="meny" id="hovedmeny" aria-label="Hovedmeny">${meny}</nav>
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
  <p class="bunn-tekst">Taffelakademiet for Samvær og Etegilder · Gyldig forfall krever noe minst like viktig som en konfirmasjon.</p>`;
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

function lagretNavn() {
  try { return localStorage.getItem("tafse-navn") || ""; } catch (_) { return ""; }
}
function lagreNavn(n) {
  try { localStorage.setItem("tafse-navn", n); } catch (_) {}
}

async function navnValg(valgt) {
  const { medlemmer } = await hentData();
  const v = valgt || lagretNavn();
  return `<option value="">Velg navn</option>` + medlemmer.map((n) => `<option${n === v ? " selected" : ""}>${esc(n)}</option>`).join("");
}

// Viser innloggingsport i `boks` til man er logget inn, og kjører `vedInnlogget` etterpå.
async function kreverInnlogging(boks, vedInnlogget) {
  let ok = false;
  try { ok = (await api("meg")).innlogget; } catch (_) { ok = false; }
  if (ok) return vedInnlogget();
  boks.innerHTML = `<form class="port skjema" id="port">
    <p class="overline">Kun for Tafsebrødre</p>
    <p>Skriv inn akademiets passord for å se og legge til innhold her.</p>
    <div class="felt"><label for="passord">Passord</label><input id="passord" type="password" autocomplete="current-password" required></div>
    <button class="knapp" type="submit">Gå inn</button>
    <div id="port-melding" role="status"></div>
  </form>`;
  boks.querySelector("#port").addEventListener("submit", async (e) => {
    e.preventDefault();
    const melding = boks.querySelector("#port-melding");
    melding.innerHTML = "";
    try {
      await api("logginn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passord: boks.querySelector("#passord").value }),
      });
      boks.innerHTML = "";
      vedInnlogget();
    } catch (err) {
      melding.innerHTML = `<p class="melding feil">${esc(err.status === 401 ? "Feil passord. Prøv igjen, eller spør en Tafsemester." : err.message)}</p>`;
    }
  });
}

function tidTekst(iso) {
  const d = new Date(iso);
  return `${d.getDate()}. ${MANEDER_KORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

byggRamme();
