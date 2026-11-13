// HONNINGFELLA: et spill om forførende tilbud og halve sannheter.
// Du er Jens Hvang, toppsjef i Nvideo. Folk oppsøker deg ett og ett. Godta tilbudet,
// eller avslør at det er en honningfelle. Oppdragene ligger i data/honningfella/oppdrag.json.

(() => {
  const rot = document.getElementById("hf");
  const tavle = document.getElementById("hf-tavle");

  // ---------- Regler (endres her) ----------
  const RAPPORT_PRIS = 150;   // bakgrunnssjekk
  const NOLE_STRAFF = 100;    // når tiden går ut
  const FALSK_ALARM = 250;    // når du anklager en ærlig person
  const MIN_FELLESTRAFF = 600; // minste tap når du går i fella
  const GRANSKING = 1000;     // advokatregning ved tre prikker
  const MAKS_PRIKKER = 3;
  const MULT_STEG = 0.25;
  const MULT_MAKS = 2.5;
  const LOKAL_NOKKEL = "tafse-honningfella-beste";

  let OPPDRAG = [];
  let mineBeste = {};
  let s = null; // tilstanden i et pågående oppdrag

  const tall = (n) => Math.round(Math.abs(n)).toLocaleString("nb-NO");
  const pluss = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + tall(n);
  const mill = (n) => `${pluss(n)} mill. $`;
  const skarTekst = (n) => (n < 0 ? "−" : "") + tall(n);
  const stjerner = (n) => "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
  const bland = (liste) => {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ---------- Portretter ----------
  function portrett(u = {}) {
    const hud = u.hud || "#efcfb0";
    const har = u.harfarge || "#3a2416";
    const kl = u.antrekksfarge || "#1f2937";
    const t = new Set(u.tilbehor || []);
    const stil = u.har || "kort";
    const antrekk = u.antrekk || "dress";
    const gull = "#c9a24a";
    const deler = [];

    // Hår bak hodet
    if (stil === "langt") deler.push(`<path d="M34 58 Q32 30 60 28 Q88 30 86 58 L92 112 Q60 122 28 112 Z" fill="${har}"/>`);
    if (stil === "krøller") deler.push([[38, 46], [34, 62], [38, 80], [82, 46], [86, 62], [82, 80], [46, 34], [60, 30], [74, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${har}"/>`).join(""));
    if (stil === "knute") deler.push(`<circle cx="60" cy="27" r="11" fill="${har}"/>`);

    // Kropp og antrekk
    const skuldre = "M14 140 Q16 106 44 100 L76 100 Q104 106 106 140 Z";
    if (antrekk === "kjole") {
      deler.push(`<path d="${skuldre}" fill="${hud}"/>`);
      deler.push(`<path d="M22 140 Q24 118 40 112 Q60 128 80 112 Q96 118 98 140 Z" fill="${kl}"/>`);
      deler.push(`<path d="M40 112 Q60 128 80 112" fill="none" stroke="${gull}" stroke-opacity=".35" stroke-width="1"/>`);
    } else {
      deler.push(`<path d="${skuldre}" fill="${kl}"/>`);
      if (antrekk === "dress") {
        deler.push(`<path d="M50 100 L60 124 L70 100 Z" fill="#ece4d2"/>`);
        deler.push(`<path d="M44 100 L58 126 L52 140 M76 100 L62 126 L68 140" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`);
      }
      if (antrekk === "skinnjakke") {
        deler.push(`<path d="M44 100 L54 114 L48 118 Z M76 100 L66 114 L72 118 Z" fill="#000" fill-opacity=".45"/>`);
        deler.push(`<line x1="60" y1="108" x2="60" y2="140" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="2 2"/>`);
        deler.push(`<path d="M30 118 Q36 112 44 112" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`);
      }
      if (antrekk === "genser") deler.push(`<path d="M46 100 Q60 110 74 100" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="3"/>`);
      if (antrekk === "uniform") {
        deler.push(`<rect x="22" y="104" width="18" height="5" fill="${gull}"/><rect x="80" y="104" width="18" height="5" fill="${gull}"/>`);
        deler.push([116, 126, 136].map((y) => `<circle cx="60" cy="${y}" r="2" fill="${gull}"/>`).join(""));
        deler.push(`<path d="M50 100 L60 110 L70 100" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`);
      }
    }
    if (t.has("slips")) deler.push(`<path d="M58 106 L62 106 L64 128 L60 134 L56 128 Z" fill="${gull}"/>`);
    if (t.has("perler")) deler.push(Array.from({ length: 9 }, (_, i) => {
      const v = Math.PI * (0.15 + 0.7 * (i / 8));
      return `<circle cx="${60 - Math.cos(v) * 17}" cy="${100 + Math.sin(v) * 10}" r="2.2" fill="#f5f0e6"/>`;
    }).join(""));
    if (t.has("startnummer")) deler.push(`<rect x="46" y="116" width="28" height="18" fill="#f5f0e6"/><text x="60" y="130" text-anchor="middle" font-family="Cinzel, serif" font-size="11" fill="#111">42</text>`);

    // Hals og hode
    deler.push(`<rect x="52" y="82" width="16" height="20" fill="${hud}"/>`);
    deler.push(`<path d="M52 96 Q60 102 68 96" fill="#000" fill-opacity=".12"/>`);
    deler.push(`<ellipse cx="38" cy="62" rx="4" ry="6" fill="${hud}"/><ellipse cx="82" cy="62" rx="4" ry="6" fill="${hud}"/>`);
    deler.push(`<ellipse cx="60" cy="60" rx="22" ry="27" fill="${hud}"/>`);

    // Hår foran
    if (stil === "kort") deler.push(`<path d="M37 56 Q36 30 60 30 Q84 30 83 56 Q80 42 60 40 Q40 42 37 56 Z" fill="${har}"/>`);
    if (stil === "pannelugg") deler.push(`<path d="M37 58 Q34 28 60 30 Q86 28 83 58 Q78 46 68 48 Q60 44 50 48 Q42 46 37 58 Z" fill="${har}"/>`);
    if (stil === "langt") deler.push(`<path d="M38 70 Q32 30 60 31 Q88 30 82 70 Q80 46 66 40 Q50 42 42 52 Q38 60 38 70 Z" fill="${har}"/>`);
    if (stil === "knute") deler.push(`<path d="M38 56 Q38 32 60 32 Q82 32 82 56 Q78 40 60 38 Q42 40 38 56 Z" fill="${har}"/>`);
    if (stil === "krøller") deler.push(`<path d="M38 54 Q40 34 60 33 Q80 34 82 54 Q74 44 60 44 Q46 44 38 54 Z" fill="${har}"/>`);
    if (stil === "skallet") deler.push(`<path d="M37 60 Q36 50 40 46 L40 60 Z M83 60 Q84 50 80 46 L80 60 Z" fill="${har}"/>`);

    // Ansikt
    deler.push(`<path d="M46 52 Q51 49 55 52 M65 52 Q69 49 74 52" fill="none" stroke="${har}" stroke-width="2" stroke-linecap="round"/>`);
    deler.push(`<ellipse cx="51" cy="59" rx="2.4" ry="2.8" fill="#1a1410"/><ellipse cx="69" cy="59" rx="2.4" ry="2.8" fill="#1a1410"/>`);
    deler.push(`<path d="M60 62 Q58 68 61 70" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.5"/>`);
    if (t.has("leppestift")) deler.push(`<path d="M46 56 L44 54 M48 55 L47 53 M74 56 L76 54 M72 55 L73 53" stroke="#1a1410" stroke-width="1.2" stroke-linecap="round"/>`);
    if (t.has("leppestift")) deler.push(`<path d="M52 76 Q60 72 68 76 Q60 82 52 76 Z" fill="#b4121b"/>`);
    else deler.push(`<path d="M53 76 Q60 80 67 76" fill="none" stroke="#5a2e22" stroke-width="2" stroke-linecap="round"/>`);

    // Tilbehør
    if (t.has("briller")) deler.push(`<g fill="none" stroke="${gull}" stroke-width="1.8"><circle cx="51" cy="59" r="7"/><circle cx="69" cy="59" r="7"/><path d="M58 59 L62 59 M44 58 L38 56 M76 58 L82 56"/></g>`);
    if (t.has("solbriller")) deler.push(`<g><rect x="42" y="53" width="16" height="11" rx="4" fill="#0b0b0a"/><rect x="62" y="53" width="16" height="11" rx="4" fill="#0b0b0a"/><path d="M58 57 L62 57" stroke="${gull}" stroke-width="2"/></g>`);
    if (t.has("monokkel")) deler.push(`<g fill="none" stroke="${gull}" stroke-width="1.8"><circle cx="69" cy="59" r="7"/><path d="M75 63 Q84 80 78 98"/></g>`);
    if (t.has("oredobb")) deler.push(`<circle cx="38" cy="71" r="2.6" fill="${gull}"/><circle cx="82" cy="71" r="2.6" fill="${gull}"/>`);
    if (t.has("blomst")) deler.push(`<g transform="translate(40 40)">${[0, 72, 144, 216, 288].map((v) => `<ellipse cx="0" cy="-6" rx="3.5" ry="6" fill="#f472b6" transform="rotate(${v})"/>`).join("")}<circle r="3" fill="${gull}"/></g>`);
    if (t.has("hatt")) deler.push(`<ellipse cx="60" cy="36" rx="38" ry="7" fill="${kl}"/><path d="M42 36 Q44 14 60 14 Q76 14 78 36 Z" fill="${kl}"/><path d="M43 31 L77 31" stroke="${gull}" stroke-width="3"/>`);
    if (t.has("headset")) deler.push(`<path d="M36 62 Q36 26 60 26 Q84 26 84 62" fill="none" stroke="#111" stroke-width="4"/><rect x="31" y="56" width="8" height="14" rx="3" fill="#111"/><rect x="81" y="56" width="8" height="14" rx="3" fill="#111"/><path d="M35 70 Q40 82 52 80" fill="none" stroke="#111" stroke-width="2"/>`);
    if (t.has("champagne")) deler.push(`<g transform="translate(96 96)"><path d="M-7 -20 L7 -20 Q6 -4 0 -2 Q-6 -4 -7 -20 Z" fill="#e2c174" fill-opacity=".8" stroke="${gull}"/><line x1="0" y1="-2" x2="0" y2="14" stroke="${gull}" stroke-width="1.5"/><line x1="-6" y1="14" x2="6" y2="14" stroke="${gull}" stroke-width="1.5"/><circle cx="-2" cy="-14" r="1" fill="#fff"/><circle cx="2" cy="-9" r="1" fill="#fff"/></g>`);

    return `<svg viewBox="0 0 120 140" class="hf-portrett" aria-hidden="true">
      <defs><radialGradient id="hfbg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#2a261e"/><stop offset="1" stop-color="#0b0b0a"/></radialGradient>
      <clipPath id="hfklipp"><rect x="0" y="0" width="120" height="140"/></clipPath></defs>
      <rect width="120" height="140" fill="url(#hfbg)"/>
      <g clip-path="url(#hfklipp)">${deler.join("")}</g>
      <rect x="1" y="1" width="118" height="138" fill="none" stroke="${gull}" stroke-width="1.5"/>
    </svg>`;
  }

  // ---------- Lagring av egne rekorder ----------
  function lesLokal() {
    try { return JSON.parse(localStorage.getItem(LOKAL_NOKKEL) || "{}"); } catch (_) { return {}; }
  }
  function lagreLokal(id, skar) {
    try {
      const d = lesLokal();
      if (d[id] === undefined || skar > d[id]) d[id] = skar;
      localStorage.setItem(LOKAL_NOKKEL, JSON.stringify(d));
    } catch (_) {}
  }

  // ---------- Menyen ----------
  function visMeny() {
    stoppKlokke();
    s = null;
    const beste = { ...lesLokal(), ...mineBeste };
    rot.innerHTML = `
      <div class="hf-meny">
        <p class="overline">Kontraspionasje for nybegynnere</p>
        <h2>Ikke alle som smiler, vil deg vel</h2>
        <p class="hf-ingress">Du er Jens Hvang, toppsjef i brikkegiganten Nvideo. Ett og ett kommer folk bort til deg med tilbud du nesten ikke kan si nei til. Noen er ekte. Andre er honningfeller.</p>
        <ul class="spill-regler hf-regler">
          <li><strong>Godta</strong> et ekte tilbud, så får du det som loves. <strong>Avslør</strong> en felle, så får du bonus.</li>
          <li>Riktige valg på rad øker multiplikatoren, helt opp til ×${MULT_MAKS.toLocaleString("nb-NO")}.</li>
          <li>Går du i fella, taper du stort og får en prikk. ${MAKS_PRIKKER} prikker, og styret åpner gransking.</li>
          <li>Anklager du en ærlig person, ryker avtalen og ${FALSK_ALARM} til. Nøler du, koster det ${NOLE_STRAFF}.</li>
          <li>En <strong>bakgrunnssjekk</strong> koster ${RAPPORT_PRIS}, men kan redde deg. Tastatur: ← avslør, → godta, B sjekk.</li>
        </ul>
        <div class="hf-oppdragsliste">
          ${OPPDRAG.map((o) => `
            <article class="hf-oppdrag">
              <p class="overline">Oppdrag ${o.nummer} · <span title="Vanskelighet">${stjerner(o.vanskelighet || 1)}</span></p>
              <h3>${esc(o.tittel)}</h3>
              <p class="dempet hf-under">${esc(o.undertittel || "")}</p>
              <p class="hf-oppdrag-meta">${o.moter} møter · ${o.sekunder} sekunder per møte</p>
              <p class="hf-beste">${beste[o.id] !== undefined ? `Din beste: <strong>${skarTekst(beste[o.id])}</strong>` : "Ikke spilt ennå"}</p>
              <button class="knapp" type="button" data-start="${esc(o.id)}">Start oppdraget</button>
            </article>`).join("")}
        </div>
      </div>`;
  }

  rot.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.start) startOppdrag(b.dataset.start);
    else if (b.dataset.valg) velg(b.dataset.valg);
    else if (b.dataset.sjekk !== undefined) sjekk();
    else if (b.dataset.neste !== undefined) neste();
    else if (b.dataset.meny !== undefined) visMeny();
    else if (b.dataset.igjen) startOppdrag(b.dataset.igjen);
  });

  // ---------- Spillet ----------
  function trekkKort(o) {
    const n = Math.min(o.moter, o.kort.length);
    const feller = bland(o.kort.filter((k) => k.felle));
    const ekte = bland(o.kort.filter((k) => !k.felle));
    const lav = Math.round(n * 0.35), hoy = Math.round(n * 0.55);
    let antall = lav + Math.floor(Math.random() * (hoy - lav + 1));
    antall = Math.max(n - ekte.length, Math.min(antall, feller.length));
    return bland([...feller.slice(0, antall), ...ekte.slice(0, n - antall)]);
  }

  function perfektSkar(o, kort) {
    let m = 1, sum = 0;
    for (const k of kort) {
      sum += (k.felle ? o.avslorBonus : k.tilbud) * m;
      m = Math.min(MULT_MAKS, m + MULT_STEG);
    }
    return sum;
  }

  function startOppdrag(id) {
    const o = OPPDRAG.find((x) => x.id === id);
    if (!o) return;
    const kort = trekkKort(o);
    s = { o, kort, i: 0, skar: 0, mult: 1, prikker: 0, riktige: 0, logg: [], sjekket: false, svart: false, perfekt: perfektSkar(o, kort) };
    visKort();
  }

  function hud() {
    return `<div class="hf-hud">
      <div><span class="hf-etikett">Skår</span><strong class="${s.skar < 0 ? "minus" : ""}">${skarTekst(s.skar)}</strong></div>
      <div><span class="hf-etikett">Multiplikator</span><strong>×${s.mult.toLocaleString("nb-NO")}</strong></div>
      <div><span class="hf-etikett">Prikker</span><strong class="hf-prikker">${Array.from({ length: MAKS_PRIKKER }, (_, i) => `<span class="${i < s.prikker ? "full" : ""}"></span>`).join("")}</strong></div>
      <div><span class="hf-etikett">Møte</span><strong>${s.i + 1} av ${s.kort.length}</strong></div>
    </div>`;
  }

  function visKort() {
    const k = s.kort[s.i];
    s.sjekket = false;
    s.svart = false;
    s.kostnad = 0;
    rot.innerHTML = `
      ${hud()}
      <div class="hf-klokke" aria-hidden="true"><span id="hf-klokke"></span></div>
      <article class="hf-kort">
        <div class="hf-bilde">${portrett(k.utseende)}</div>
        <div class="hf-innhold">
          <p class="overline">${esc(s.o.tittel)}</p>
          <h3 class="hf-navn">${esc(k.navn)}</h3>
          <p class="hf-rolle">${esc(k.rolle)}</p>
          <blockquote class="hf-replikk">«${esc(k.replikk)}»</blockquote>
          <p class="hf-tilbud"><span class="hf-etikett">Tilbudet</span> ${esc(k.tilbudTekst)} <strong>${mill(k.tilbud)}</strong></p>
          <div class="hf-detaljer">
            <span class="hf-etikett">Du legger merke til</span>
            <ul>${k.detaljer.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
          </div>
          <div class="hf-rapport" id="hf-rapport" hidden></div>
        </div>
      </article>
      <div class="hf-handlinger" id="hf-handlinger">
        <button class="knapp hf-avslor" type="button" data-valg="avslor">Avslør fella</button>
        <button class="liten-knapp hf-sjekk" type="button" data-sjekk>Bakgrunnssjekk (−${RAPPORT_PRIS})</button>
        <button class="knapp" type="button" data-valg="godta">Godta tilbudet</button>
      </div>`;
    startKlokke(s.o.sekunder);
  }

  let klokke = null;
  function startKlokke(sek) {
    stoppKlokke();
    let igjen = sek * 1000;
    let forrige = performance.now();
    const strek = document.getElementById("hf-klokke");
    klokke = setInterval(() => {
      const nå = performance.now();
      if (!document.hidden) igjen -= nå - forrige;
      forrige = nå;
      const andel = Math.max(0, igjen / (sek * 1000));
      if (strek) {
        strek.style.width = `${andel * 100}%`;
        strek.classList.toggle("lite", andel < 0.3);
      }
      if (igjen <= 0) velg("tid");
    }, 80);
  }
  function stoppKlokke() {
    if (klokke) clearInterval(klokke);
    klokke = null;
  }

  function sjekk() {
    if (!s || s.svart || s.sjekket) return;
    s.sjekket = true;
    s.skar -= RAPPORT_PRIS;
    s.kostnad = RAPPORT_PRIS;
    const k = s.kort[s.i];
    const r = document.getElementById("hf-rapport");
    r.innerHTML = `<span class="hf-etikett">Bakgrunnssjekk</span><p>${esc(k.rapport)}</p>`;
    r.hidden = false;
    const knapp = rot.querySelector("[data-sjekk]");
    if (knapp) knapp.disabled = true;
    const sk = rot.querySelector(".hf-hud strong");
    if (sk) { sk.textContent = skarTekst(s.skar); sk.classList.toggle("minus", s.skar < 0); }
  }

  function velg(valg) {
    if (!s || s.svart) return;
    s.svart = true;
    stoppKlokke();
    const k = s.kort[s.i];
    let delta = 0, riktig = false, tittel = "", tekst = "", klasse = "";
    if (valg === "tid") {
      delta = -NOLE_STRAFF;
      s.mult = 1;
      tittel = "Du nølte";
      tekst = `Mens du tenkte, gikk ${esc(k.navn.split(" ")[0])} videre. ${k.felle ? "Det var for øvrig en honningfelle." : "Det var for øvrig et ærlig tilbud."}`;
      klasse = "noytral";
    } else if (k.felle && valg === "godta") {
      delta = -Math.max(MIN_FELLESTRAFF, k.tilbud);
      s.prikker += 1;
      s.mult = 1;
      tittel = "Du gikk rett i honningfella";
      tekst = esc(k.godta);
      klasse = "feil";
    } else if (k.felle) {
      delta = s.o.avslorBonus * s.mult;
      riktig = true;
      tittel = "Avslørt! Det var en honningfelle";
      tekst = esc(k.avslor);
      klasse = "riktig";
    } else if (valg === "godta") {
      delta = k.tilbud * s.mult;
      riktig = true;
      tittel = "En ærlig avtale";
      tekst = esc(k.godta);
      klasse = "riktig";
    } else {
      delta = -FALSK_ALARM;
      s.mult = 1;
      tittel = "Falsk alarm";
      tekst = esc(k.avslor);
      klasse = "feil";
    }
    if (riktig) {
      s.riktige += 1;
      s.mult = Math.min(MULT_MAKS, s.mult + MULT_STEG);
    }
    s.skar += delta;
    s.logg.push({ navn: k.navn, felle: k.felle, valg, delta: delta - (s.kostnad || 0), riktig });

    const sist = s.i === s.kort.length - 1 || s.prikker >= MAKS_PRIKKER;
    const r = document.getElementById("hf-rapport");
    if (r && !s.sjekket) {
      r.innerHTML = `<span class="hf-etikett">Det bakgrunnssjekken ville vist</span><p>${esc(k.rapport)}</p>`;
      r.hidden = false;
    }
    document.getElementById("hf-handlinger").innerHTML = `
      <div class="hf-dom ${klasse}" role="status">
        <p class="hf-dom-tittel">${tittel} <span class="hf-delta">${mill(delta)}</span></p>
        <p>${tekst}</p>
        ${klasse === "feil" && k.felle ? `<p class="hf-prikk-melding">Prikk ${s.prikker} av ${MAKS_PRIKKER}.</p>` : ""}
      </div>
      <button class="knapp" type="button" data-neste>${sist ? (s.prikker >= MAKS_PRIKKER ? "Møt styret" : "Se resultatet") : "Neste møte"}</button>`;
    const hudBoks = rot.querySelector(".hf-hud");
    if (hudBoks) hudBoks.outerHTML = hud();
    const nesteKnapp = rot.querySelector("[data-neste]");
    if (nesteKnapp) nesteKnapp.focus({ preventScroll: true });
  }

  function neste() {
    if (!s || !s.svart) return;
    if (s.prikker >= MAKS_PRIKKER || s.i >= s.kort.length - 1) return avslutt();
    s.i += 1;
    visKort();
    rot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function sluttTittel(andel) {
    if (andel >= 0.8) return ["Kontraspionasjens stolthet", "Etterretningstjenestene vil ha deg som foredragsholder. Skinnjakka er plettfri."];
    if (andel >= 0.6) return ["Skinnjakke med skarpt blikk", "Du så gjennom de fleste. Noen få smil slapp likevel forbi."];
    if (andel >= 0.4) return ["Lovende, men lettlurt", "Du klarer deg, men pressetalspersonen din har fått grå hår."];
    if (andel >= 0.2) return ["Har lest om honningfeller på Wikipedia", "Teorien sitter. Praksisen gjør ikke det."];
    return ["Eier nå tre datasentre fulle av uåpnede esker", "Styret har spørsmål. Kongressen har flere."];
  }

  async function avslutt() {
    stoppKlokke();
    const gransket = s.prikker >= MAKS_PRIKKER;
    if (gransket) s.skar -= GRANSKING;
    const skar = Math.round(s.skar);
    const andel = s.perfekt > 0 ? skar / s.perfekt : 0;
    const [tittel, tekst] = gransket
      ? ["Styret åpner en uavhengig gransking", `Med bistand fra eksterne advokater. Regningen på ${tall(GRANSKING)} mill. $ er trukket fra skåren din.`]
      : sluttTittel(andel);
    const tidligere = { ...lesLokal(), ...mineBeste }[s.o.id];
    const rekord = tidligere === undefined || skar > tidligere;
    lagreLokal(s.o.id, skar);
    if (rekord) mineBeste[s.o.id] = skar;
    const valgTekst = { godta: "Godtok", avslor: "Avslørte", tid: "Nølte" };

    rot.innerHTML = `
      <div class="hf-slutt">
        <p class="overline">${esc(s.o.tittel)} · ${gransket ? "Avbrutt" : "Fullført"}</p>
        <h2>${esc(tittel)}</h2>
        <p class="hf-ingress">${esc(tekst)}</p>
        <p class="hf-sluttskar">${skarTekst(skar)} <span>mill. $</span></p>
        <p class="dempet">${s.riktige} riktige av ${s.logg.length} møter · ${rekord ? "Ny personlig rekord på dette oppdraget!" : `Din beste er ${skarTekst(tidligere)}.`}</p>
        <p class="dempet" id="hf-lagret"></p>
        <div class="tabell-boks"><table class="tavle hf-logg">
          <thead><tr><th>Hvem</th><th>Sannheten</th><th>Ditt valg</th><th>Skår</th></tr></thead>
          <tbody>${s.logg.map((l) => `<tr class="${l.riktig ? "" : "bom"}">
            <td>${esc(l.navn)}</td><td>${l.felle ? "Honningfelle" : "Ærlig"}</td>
            <td>${valgTekst[l.valg]}</td><td>${pluss(l.delta)}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="hf-tips"><span class="hf-etikett">Fra kontraspionasjen</span> En flørt er ikke et rødt flagg i seg selv. Se etter hva de vil ha: tilgang, hemmelighold, utstyret ditt og alt som slipper unna advokatene.</p>
        <div class="hf-handlinger">
          <button class="knapp sekundar" type="button" data-meny>Alle oppdrag</button>
          <button class="knapp" type="button" data-igjen="${esc(s.o.id)}">Prøv igjen</button>
        </div>
      </div>`;
    rot.scrollIntoView({ behavior: "smooth", block: "start" });

    const lagret = document.getElementById("hf-lagret");
    if (typeof MEG !== "undefined" && MEG) {
      try {
        await api("honningfella", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oppdrag: s.o.id, skar, riktige: s.riktige, moter: s.logg.length, prikker: s.prikker, fullfort: !gransket }),
        });
        lagret.textContent = `Resultatet er ført i protokollen for ${MEG}.`;
        lastTavle();
      } catch (_) {
        lagret.textContent = "Klarte ikke å lagre resultatet.";
      }
    } else {
      lagret.innerHTML = `<a href="salongen.html">Logg inn</a> for å komme på tavlen. Skåren er lagret i denne nettleseren.`;
    }
  }

  // ---------- Tastatur ----------
  window.addEventListener("keydown", (e) => {
    if (!s || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    if (!s.svart) {
      if (k === "arrowright" || k === "g") { e.preventDefault(); velg("godta"); }
      else if (k === "arrowleft" || k === "a") { e.preventDefault(); velg("avslor"); }
      else if (k === "b") { e.preventDefault(); sjekk(); }
    } else if (k === "enter" || k === " " || k === "arrowright") {
      if (document.activeElement && document.activeElement.matches("[data-neste]") && k !== "arrowright") return; // knappen tar seg av det
      if (rot.querySelector("[data-neste]")) { e.preventDefault(); neste(); }
    }
  });

  // ---------- Tavlen ----------
  async function lastTavle() {
    if (!(await hvemErJeg())) {
      tavle.innerHTML = `<p class="dempet">Tavlen er bare for brødrene. <a href="salongen.html">Logg inn</a> for å se den og komme på den.</p>`;
      return;
    }
    try {
      const { resultater, antallSpill } = await api("honningfella");
      const kjente = new Set(OPPDRAG.map((o) => o.id));
      const brodre = {};
      for (const r of resultater) {
        if (!kjente.has(r.oppdrag)) continue;
        const b = (brodre[r.navn] ||= { navn: r.navn, sum: 0, per: {} });
        b.per[r.oppdrag] = r.beste;
        b.sum += r.beste;
        if (r.navn === MEG) mineBeste[r.oppdrag] = r.beste;
      }
      if (s === null && rot.querySelector(".hf-meny")) visMeny();
      const rader = Object.values(brodre).sort((a, b) => b.sum - a.sum);
      if (!rader.length) { tavle.innerHTML = `<p class="tomt">Ingen har spilt ennå. Bli den første som ikke går i fella.</p>`; return; }
      tavle.innerHTML = `<div class="tabell-boks"><table class="tavle">
        <thead><tr><th>#</th><th>Bror</th><th>Karriereskår</th>${OPPDRAG.map((o) => `<th>${esc(o.tittel)}</th>`).join("")}</tr></thead>
        <tbody>${rader.map((r, i) => `<tr${r.navn === MEG ? ' class="meg"' : ""}>
          <td>${i + 1}</td><td>${esc(r.navn)}</td><td><strong>${skarTekst(r.sum)}</strong></td>
          ${OPPDRAG.map((o) => `<td>${r.per[o.id] !== undefined ? skarTekst(r.per[o.id]) : "·"}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>
      <p class="dempet" style="font-size:15px">${antallSpill} oppdrag spilt totalt.</p>`;
    } catch (err) {
      tavle.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`;
    }
  }

  // ---------- Oppstart ----------
  (async () => {
    try {
      const r = await fetch("data/honningfella/oppdrag.json", { cache: "no-cache" });
      OPPDRAG = (await r.json()).oppdrag.sort((a, b) => a.nummer - b.nummer);
      visMeny();
    } catch (_) {
      rot.innerHTML = `<p class="melding feil">Klarte ikke å laste oppdragene.</p>`;
    }
    lastTavle();
  })();
})();
