// HONNINGFELLA: et samtalespill om forførende tilbud og halve sannheter.
// Du er Jens Hvang, toppsjef i Nvideo. Folk oppsøker deg ett og ett, og hver samtale har tre runder.
// I de to første sonderer du, i den tredje bestemmer du deg. Oppdragene ligger i data/honningfella/oppdrag.json.

(() => {
  const rot = document.getElementById("hf");
  const tavle = document.getElementById("hf-tavle");

  // ---------- Regler (endres her) ----------
  const RAPPORT_PRIS = 150;        // bakgrunnssjekk
  const FALSK_ALARM = 300;         // å anklage en ærlig person
  const PINLIG = 300;              // å prøve seg på en ærlig person
  const MIN_FELLESTRAFF = 600;     // minste tap når du går i fella
  const FRISTELSE_GANGER = 1.5;    // å falle for fristelsen er verre enn å bare godta
  const FORSIKTIG_ANDEL = 0.7;     // forsiktig ja til en ærlig: 70 % av tilbudet
  const FORSIKTIG_FELLE = 100;     // forsiktig ja til en felle: fella trekker seg
  const AVVIS_FELLE_ANDEL = 0.4;   // høflig nei til en felle: 40 % av bonusen
  const GRANSKING = 1000;          // advokatregning ved tre prikker
  const MAKS_PRIKKER = 3;
  const MULT_STEG = 0.25;
  const MULT_MAKS = 2.5;
  const LOKAL_NOKKEL = "tafse-honningfella-beste";

  const VALGNAVN = { godta: "Godtok", forsiktig: "Forsiktig ja", avslor: "Avslørte", avvis: "Avviste", fristelse: "Falt for fristelsen" };
  const STANDARD = {
    forsiktig: { aerlig: "Det tok litt lenger tid med advokater og papirer, men avtalen kom i havn.", felle: "Da det ble snakk om advokater og papirer, mistet de plutselig all interesse." },
    avvis: { aerlig: "Avtalen gikk til konkurrenten. Ingen skade skjedd, bortsett fra på kvartalstallene.", felle: "Du takket høflig nei. Fella lukket seg om en annen toppsjef i stedet." },
    fristelse: { aerlig: "Det ble pinlig. Svært pinlig. Og avtalen glapp." },
  };

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
    s = null;
    const beste = { ...lesLokal(), ...mineBeste };
    const p = (n) => `${n.toLocaleString("nb-NO")} %`;
    rot.innerHTML = `
      <div class="hf-meny">
        <p class="overline">Kontraspionasje for nybegynnere</p>
        <h2>Ikke alle som smiler, vil deg vel</h2>
        <p class="hf-ingress">Du er Jens Hvang, toppsjef i brikkegiganten Nvideo. Folk kommer bort til deg med tilbud du nesten ikke kan si nei til. Hver samtale har tre runder: i de to første sonderer du terrenget, i den tredje bestemmer du deg. Noen er ærlige. Andre er honningfeller.</p>
        <h3 class="hf-regeltittel">Slik får du poeng</h3>
        <div class="tabell-boks"><table class="tavle hf-regeltabell">
          <thead><tr><th>Ditt svar i siste runde</th><th>Hvis personen er ærlig</th><th>Hvis det er en honningfelle</th></tr></thead>
          <tbody>
            <tr><td><strong>Godta</strong></td><td class="pluss">Hele tilbudet × multiplikator</td><td class="minus">Du taper tilbudet (minst ${MIN_FELLESTRAFF}) og får en prikk</td></tr>
            <tr><td><strong>Forsiktig ja</strong><br><span class="dempet">via advokater og papirer</span></td><td class="pluss">${p(FORSIKTIG_ANDEL * 100)} av tilbudet × multiplikator</td><td>+${FORSIKTIG_FELLE}, fella trekker seg</td></tr>
            <tr><td><strong>Avslør</strong></td><td class="minus">−${FALSK_ALARM}, falsk alarm</td><td class="pluss">Bonus × multiplikator</td></tr>
            <tr><td><strong>Avvis høflig</strong></td><td>0, avtalen ryker</td><td>${p(AVVIS_FELLE_ANDEL * 100)} av bonusen</td></tr>
            <tr><td><strong>Fristelsen</strong><br><span class="dempet">rommet, baren, terrassen</span></td><td class="minus">−${PINLIG}, det blir pinlig</td><td class="minus">${FRISTELSE_GANGER.toLocaleString("nb-NO")} × tapet, og en prikk</td></tr>
          </tbody>
        </table></div>
        <ul class="spill-regler hf-regler">
          <li><strong>Samtalen teller også.</strong> Gode spørsmål gir poeng, uforsiktige svar koster. Regnskapet ser du først når møtet er over.</li>
          <li><strong>Multiplikatoren</strong> starter på ×1 og øker med ${MULT_STEG.toLocaleString("nb-NO")} for hver riktige avgjørelse på rad, opp til ×${MULT_MAKS.toLocaleString("nb-NO")}. En bom setter den tilbake til ×1.</li>
          <li><strong>Tre prikker</strong>, og styret åpner gransking. Det koster ${tall(GRANSKING)} i advokatregning.</li>
          <li><strong>Bakgrunnssjekk</strong> koster ${RAPPORT_PRIS} og kan brukes én gang per person. Tastatur: 1 til 6 for svar, B for sjekk.</li>
        </ul>
        <div class="hf-oppdragsliste">
          ${OPPDRAG.map((o) => `
            <article class="hf-oppdrag">
              <p class="overline">Oppdrag ${o.nummer} · <span title="Vanskelighet">${stjerner(o.vanskelighet || 1)}</span></p>
              <h3>${esc(o.tittel)}</h3>
              <p class="dempet hf-under">${esc(o.undertittel || "")}</p>
              <p class="hf-oppdrag-meta">${o.moter} samtaler · bonus for avsløring: ${o.avslorBonus}</p>
              <p class="hf-beste">${beste[o.id] !== undefined ? `Din beste: <strong>${skarTekst(beste[o.id])}</strong>` : "Ikke spilt ennå"}</p>
              <button class="knapp" type="button" data-start="${esc(o.id)}">Start oppdraget</button>
            </article>`).join("")}
        </div>
      </div>`;
  }

  rot.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.start) startOppdrag(b.dataset.start);
    else if (b.dataset.svar !== undefined) velgSvar(Number(b.dataset.svar));
    else if (b.dataset.sjekk !== undefined) sjekk();
    else if (b.dataset.neste !== undefined) neste();
    else if (b.dataset.meny !== undefined) visMeny();
    else if (b.dataset.igjen) startOppdrag(b.dataset.igjen);
  });

  // ---------- Spillet ----------
  function trekkPersoner(o) {
    const n = Math.min(o.moter, o.personer.length);
    const feller = bland(o.personer.filter((p) => p.felle));
    const ekte = bland(o.personer.filter((p) => !p.felle));
    const lav = Math.round(n * 0.4), hoy = Math.round(n * 0.6);
    let antall = lav + Math.floor(Math.random() * (hoy - lav + 1));
    antall = Math.max(n - ekte.length, Math.min(antall, feller.length));
    return bland([...feller.slice(0, antall), ...ekte.slice(0, n - antall)]);
  }

  function perfektSkar(o, personer) {
    let m = 1, sum = 0;
    for (const p of personer) {
      for (const r of p.runder.slice(0, 2)) sum += Math.max(0, ...r.svar.map((x) => x.poeng || 0));
      sum += (p.felle ? o.avslorBonus : p.tilbud) * m;
      m = Math.min(MULT_MAKS, m + MULT_STEG);
    }
    return sum;
  }

  function startOppdrag(id) {
    const o = OPPDRAG.find((x) => x.id === id);
    if (!o) return;
    const personer = trekkPersoner(o);
    s = { o, personer, i: 0, skar: 0, mult: 1, prikker: 0, riktige: 0, logg: [], perfekt: perfektSkar(o, personer) };
    visPerson();
  }

  function hud() {
    return `<div class="hf-hud">
      <div><span class="hf-etikett">Skår</span><strong class="${s.skar < 0 ? "minus" : ""}">${skarTekst(s.skar)}</strong></div>
      <div><span class="hf-etikett">Multiplikator</span><strong>×${s.mult.toLocaleString("nb-NO")}</strong></div>
      <div><span class="hf-etikett">Prikker</span><strong class="hf-prikker">${Array.from({ length: MAKS_PRIKKER }, (_, i) => `<span class="${i < s.prikker ? "full" : ""}"></span>`).join("")}</strong></div>
      <div><span class="hf-etikett">Samtale</span><strong>${s.i + 1} av ${s.personer.length}</strong></div>
    </div>`;
  }
  function oppdaterHud() {
    const h = rot.querySelector(".hf-hud");
    if (h) h.outerHTML = hud();
  }

  function visPerson() {
    const p = s.personer[s.i];
    s.runde = 0;
    s.samtale = 0;
    s.kostnad = 0;
    s.sjekket = false;
    s.ferdig = false;
    rot.innerHTML = `
      ${hud()}
      <article class="hf-samtale">
        <aside class="hf-person">
          <div class="hf-bilde">${portrett(p.utseende)}</div>
          <div class="hf-person-tekst">
            <h3 class="hf-navn">${esc(p.navn)}</h3>
            <p class="hf-rolle">${esc(p.rolle)}</p>
            <p class="hf-tilbud"><span class="hf-etikett">Tilbudet</span>${esc(p.tilbudTekst)} <strong>${mill(p.tilbud)}</strong></p>
            <button class="liten-knapp hf-sjekk" type="button" data-sjekk>Bakgrunnssjekk (−${RAPPORT_PRIS})</button>
            <div class="hf-rapport" id="hf-rapport" hidden></div>
          </div>
        </aside>
        <div class="hf-chat">
          <p class="overline hf-runde" id="hf-runde"></p>
          <div class="hf-replikker" id="hf-replikker" aria-live="polite"></div>
          <div class="hf-valg" id="hf-valg"></div>
        </div>
      </article>`;
    visRunde();
  }

  function boble(hvem, tekst) {
    const boks = document.getElementById("hf-replikker");
    const d = document.createElement("div");
    d.className = `hf-boble ${hvem}`;
    d.innerHTML = tekst;
    boks.append(d);
    return d;
  }

  function visRunde() {
    const p = s.personer[s.i];
    const r = p.runder[s.runde];
    document.getElementById("hf-runde").textContent = `Runde ${s.runde + 1} av ${p.runder.length}${s.runde === p.runder.length - 1 ? " · Avgjørelsen" : ""}`;
    boble("dem", `<span class="hf-hvem">${esc(p.navn.split(" ")[0] === "Bror" ? p.navn : p.navn.split(" ")[0])}</span>${esc(r.replikk)}`);
    s.rekkefolge = bland(r.svar.map((_, i) => i));
    document.getElementById("hf-valg").innerHTML = `<ol class="hf-svarliste">${s.rekkefolge.map((idx, n) =>
      `<li><button type="button" class="hf-svar" data-svar="${idx}"><span class="hf-nr">${n + 1}</span><span>${esc(r.svar[idx].tekst)}</span></button></li>`).join("")}</ol>`;
  }

  function sjekk() {
    if (!s || s.ferdig || s.sjekket) return;
    const p = s.personer[s.i];
    s.sjekket = true;
    s.kostnad = RAPPORT_PRIS;
    s.skar -= RAPPORT_PRIS;
    const r = document.getElementById("hf-rapport");
    r.innerHTML = `<span class="hf-etikett">Bakgrunnssjekk</span><p>${esc(p.rapport)}</p>`;
    r.hidden = false;
    rot.querySelector("[data-sjekk]").disabled = true;
    oppdaterHud();
  }

  function velgSvar(idx) {
    if (!s || s.ferdig) return;
    const p = s.personer[s.i];
    const r = p.runder[s.runde];
    const svar = r.svar[idx];
    if (!svar) return;
    boble("meg", esc(svar.tekst));
    if (s.runde < p.runder.length - 1) {
      s.samtale += svar.poeng || 0;
      boble("dem", esc(svar.reaksjon));
      s.runde += 1;
      visRunde();
      const sisteSvar = rot.querySelector(".hf-svar");
      if (sisteSvar) sisteSvar.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    avgjor(svar);
  }

  function avgjor(svar) {
    const p = s.personer[s.i];
    const type = svar.type || "godta";
    const m = s.mult;
    const tap = Math.max(MIN_FELLESTRAFF, p.tilbud);
    let delta = 0, riktig = false, prikk = false, tittel = "", tekst = "", klasse = "noytral";
    if (p.felle) {
      if (type === "godta") { delta = -tap; prikk = true; tittel = "Du gikk rett i honningfella"; tekst = p.godta; klasse = "feil"; }
      else if (type === "fristelse") { delta = -Math.round(tap * FRISTELSE_GANGER); prikk = true; tittel = "Du falt pladask for fristelsen"; tekst = p.godta; klasse = "feil"; }
      else if (type === "avslor") { delta = s.o.avslorBonus * m; riktig = true; tittel = "Avslørt! Det var en honningfelle"; tekst = p.avslor; klasse = "riktig"; }
      else if (type === "forsiktig") { delta = FORSIKTIG_FELLE; tittel = "Fella trakk seg"; tekst = STANDARD.forsiktig.felle; }
      else { delta = Math.round(s.o.avslorBonus * AVVIS_FELLE_ANDEL); tittel = "Du slapp unna"; tekst = STANDARD.avvis.felle; }
    } else {
      if (type === "godta") { delta = p.tilbud * m; riktig = true; tittel = "En ærlig avtale"; tekst = p.godta; klasse = "riktig"; }
      else if (type === "forsiktig") { delta = Math.round(p.tilbud * FORSIKTIG_ANDEL) * m; riktig = true; tittel = "Trygt og ærlig"; tekst = STANDARD.forsiktig.aerlig; klasse = "riktig"; }
      else if (type === "avslor") { delta = -FALSK_ALARM; tittel = "Falsk alarm"; tekst = p.avslor; klasse = "feil"; }
      else if (type === "fristelse") { delta = -PINLIG; tittel = "Det ble pinlig"; tekst = STANDARD.fristelse.aerlig; klasse = "feil"; }
      else { delta = 0; tittel = "Tapt avtale"; tekst = STANDARD.avvis.aerlig; klasse = "feil"; }
    }
    if (svar.utfall) tekst = svar.utfall;
    if (prikk) s.prikker += 1;
    if (riktig) { s.riktige += 1; s.mult = Math.min(MULT_MAKS, s.mult + MULT_STEG); }
    else if (klasse === "feil") s.mult = 1;
    delta = Math.round(delta);
    s.skar += s.samtale + delta;
    s.ferdig = true;
    const totalt = s.samtale + delta - s.kostnad;
    s.logg.push({ navn: p.navn, felle: p.felle, type, samtale: s.samtale, totalt, riktig, klasse });

    rot.querySelector("[data-sjekk]").disabled = true;
    const rap = document.getElementById("hf-rapport");
    if (!s.sjekket) { rap.innerHTML = `<span class="hf-etikett">Det bakgrunnssjekken ville vist</span><p>${esc(p.rapport)}</p>`; rap.hidden = false; }
    document.getElementById("hf-runde").textContent = "Utfallet";
    const sist = s.i === s.personer.length - 1 || s.prikker >= MAKS_PRIKKER;
    const deler = [`Samtalen ${pluss(s.samtale)}`, `Avgjørelsen ${pluss(delta)}`];
    if (s.kostnad) deler.push(`Bakgrunnssjekk ${pluss(-s.kostnad)}`);
    document.getElementById("hf-valg").innerHTML = `
      <div class="hf-dom ${klasse}" role="status">
        <p class="hf-sannhet">${p.felle ? "Honningfelle" : "Ærlig"}</p>
        <p class="hf-dom-tittel">${tittel}</p>
        <p>${esc(tekst)}</p>
        <p class="hf-regnskap">${deler.join(" · ")} = <strong>${mill(totalt)}</strong></p>
        ${prikk ? `<p class="hf-prikk-melding">Prikk ${s.prikker} av ${MAKS_PRIKKER}.</p>` : ""}
      </div>
      <button class="knapp" type="button" data-neste>${sist ? (s.prikker >= MAKS_PRIKKER ? "Møt styret" : "Se resultatet") : "Neste samtale"}</button>`;
    oppdaterHud();
    const nesteKnapp = rot.querySelector("[data-neste]");
    if (nesteKnapp) { nesteKnapp.focus({ preventScroll: true }); nesteKnapp.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  }

  function neste() {
    if (!s || !s.ferdig) return;
    if (s.prikker >= MAKS_PRIKKER || s.i >= s.personer.length - 1) return avslutt();
    s.i += 1;
    visPerson();
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

    rot.innerHTML = `
      <div class="hf-slutt">
        <p class="overline">${esc(s.o.tittel)} · ${gransket ? "Avbrutt" : "Fullført"}</p>
        <h2>${esc(tittel)}</h2>
        <p class="hf-ingress">${esc(tekst)}</p>
        <p class="hf-sluttskar">${skarTekst(skar)} <span>mill. $</span></p>
        <p class="dempet">${s.riktige} riktige avgjørelser av ${s.logg.length} · ${rekord ? "Ny personlig rekord på dette oppdraget!" : `Din beste er ${skarTekst(tidligere)}.`}</p>
        <p class="dempet" id="hf-lagret"></p>
        <div class="tabell-boks"><table class="tavle hf-logg">
          <thead><tr><th>Hvem</th><th>Sannheten</th><th>Ditt valg</th><th>Samtalen</th><th>Totalt</th></tr></thead>
          <tbody>${s.logg.map((l) => `<tr class="${l.klasse === "feil" ? "bom" : ""}">
            <td>${esc(l.navn)}</td><td>${l.felle ? "Honningfelle" : "Ærlig"}</td>
            <td>${VALGNAVN[l.type] || l.type}</td><td>${pluss(l.samtale)}</td><td>${pluss(l.totalt)}</td></tr>`).join("")}</tbody>
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
    if (!s || e.ctrlKey || e.metaKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    if (!s.ferdig) {
      if (/^[1-6]$/.test(k) && s.rekkefolge && s.rekkefolge[Number(k) - 1] !== undefined) { e.preventDefault(); velgSvar(s.rekkefolge[Number(k) - 1]); }
      else if (k === "b") { e.preventDefault(); sjekk(); }
    } else if (k === "enter" && !(document.activeElement && document.activeElement.matches("[data-neste]"))) {
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
