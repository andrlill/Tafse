// TAFSE – Drømmelandet: veiviseren i åtte steg.

function byggLandEditor(boks, start, vedLagre) {
  let c = landOppsett(start);
  let steg = 0;
  const prosent = (v) => `${Math.round(v)} %`;

  const STEG = [
    {
      tittel: "Geografi og klima",
      ingress: "Breddegraden og havet bestemmer klimaet. Klimatypen regnes ut etter Köppen-systemet.",
      felt: [
        { k: "halvkule", type: "valg", etikett: "Halvkule" },
        { k: "lat", type: "glider", etikett: "Breddegrad", min: 0, max: 80, step: 1, vis: (v) => `${v}°` },
        { k: "areal", type: "logg", etikett: "Areal", min: 500, max: 3000000, vis: (v) => `${avrund(v)} km²` },
        { k: "form", type: "valg", etikett: "Form" },
        { k: "strom", type: "valg", etikett: "Havstrøm langs kysten", skjul: () => c.form === "innland" },
      ],
      innsikt: (a) => `<p><strong>${esc(a.koppen.navn)} (${a.koppen.kode}).</strong> ${esc(a.koppen.forklaring)}</p>
        <p class="dempet">Arealet tilsvarer ${a.norgeAreal >= 1 ? `${a.norgeAreal.toFixed(1).replace(".", ",")} ganger` : `${Math.round(a.norgeAreal * 100)} prosent av`} Norges areal (385 000 km²).</p>`,
    },
    {
      tittel: "Geologi",
      ingress: "Platetektonikken bestemmer fjellene, vulkanene og hvilke ressurser som kan finnes. Kombinasjonen vurderes etter hvor troverdig den er geologisk.",
      felt: [
        { k: "tektonikk", type: "valg", etikett: "Tektonisk setting" },
        { k: "istid", type: "valg", etikett: "Istider" },
        { k: "ressurser", type: "flervalg", etikett: "Naturressurser" },
      ],
      innsikt: (a) => `<p><strong>Geologisk troverdighet: ${a.geo.score} av 100.</strong></p>
        ${a.geo.merknader.length ? `<ul class="land-merknader">${a.geo.merknader.map((m) => `<li class="${m.type}">${esc(m.tekst)}</li>`).join("")}</ul>` : `<p class="dempet">Ingen merknader.</p>`}`,
    },
    {
      tittel: "Befolkning",
      ingress: "Folketall, bosetting og demografi former både økonomien og politikken.",
      felt: [
        { k: "folk", type: "logg", etikett: "Innbyggere", min: 20000, max: 300000000, vis: (v) => avrund(v) },
        { k: "urban", type: "glider", etikett: "Andel i byer", min: 5, max: 100, step: 1, vis: prosent },
        { k: "fraksjon", type: "valg", etikett: "Etnisk og språklig fraksjonalisering" },
        { k: "fase", type: "valg", etikett: "Demografisk overgang" },
      ],
      innsikt: (a) => `<p><strong>${a.tetthet < 10 ? a.tetthet.toFixed(1).replace(".", ",") : Math.round(a.tetthet)} innbyggere per km²</strong> (Norge har rundt 15).</p>
        <p>Samlet fruktbarhet rundt ${String(a.tfr).replace(".", ",")} barn per kvinne, medianalder omkring ${a.medianalder} år.</p>`,
    },
    {
      tittel: "Styresett",
      ingress: "Hvem er statsoverhode, hvordan henger regjeringen og parlamentet sammen, og hvor mange steder må et forslag igjennom før det blir lov?",
      felt: [
        { k: "statsform", type: "valg", etikett: "Statsform" },
        { k: "system", type: "valg", etikett: "Regjeringssystem", skjul: () => c.statsform === "absolutt" },
        { k: "struktur", type: "valg", etikett: "Statsstruktur" },
        { k: "kamre", type: "valg", etikett: "Nasjonalforsamlingen" },
        { k: "domstol", type: "valg", etikett: "Domstolenes prøvingsrett" },
        { k: "grunnlov", type: "valg", etikett: "Grunnlovsendringer" },
      ],
      innsikt: (a) => `<p><strong>${a.veto.length} vetospiller${a.veto.length === 1 ? "" : "e"}</strong>: ${esc(a.veto.join(", "))}.</p>
        <p class="dempet">Jo flere aktører som må si ja, desto vanskeligere er det å endre politikken, både til det bedre og det verre (Tsebelis 2002). Antallet koalisjonspartier anslås ut fra valgordningen i neste steg.</p>`,
    },
    {
      tittel: "Valgordning",
      ingress: "Valgordningen avgjør hvor mange partier som får plass. Tallene regnes ut med Taageperas setetproduktmodell.",
      felt: [
        { k: "valg", type: "valg", etikett: "Valgordning" },
        { k: "M", type: "glider", etikett: "Mandater per valgkrets", min: 2, max: 150, step: 1, vis: (v) => String(v), skjul: () => c.valg !== "pr" },
        { k: "sperre", type: "glider", etikett: "Sperregrense", min: 0, max: 12, step: 0.5, vis: (v) => `${String(v).replace(".", ",")} %`, skjul: () => !["pr", "mmp"].includes(c.valg) },
        { k: "S", type: "glider", etikett: "Antall representanter", min: 15, max: 700, step: 1, vis: (v) => String(v), knapp: ["Bruk kuberotsloven", () => { c.S = analyserLand(c).Skube; }] },
      ],
      innsikt: (a) => `<p><strong>${a.Ns.toFixed(1).replace(".", ",")} effektive partier</strong> i forsamlingen. Største parti får rundt ${Math.round(a.s1 * 100)} prosent av mandatene, så ${a.flertall ? "ettpartiflertall er mulig" : "regjeringene blir koalisjoner eller mindretallsregjeringer"}.</p>
        <p class="dempet">N = (M × S)<sup>1/6</sup> og største partis andel = (M × S)<sup>−1/8</sup>, der M er kretsstørrelsen og S forsamlingens størrelse${["pr", "mmp"].includes(c.valg) && c.sperre && a.Meff < (c.valg === "pr" ? c.M : c.S) ? `. Sperregrensen virker som en kretsstørrelse på ${Math.round(a.Meff)} (Taagepera: terskel = 75 % / (M + 1))` : ""}. Kuberotsloven tilsier ${a.Skube} representanter for dette folketallet.</p>`,
    },
    {
      tittel: "Økonomi",
      ingress: "Hvordan koordineres økonomien, og hva gjør dere med inntektene fra naturressursene?",
      felt: [
        { k: "modell", type: "valg", etikett: "Økonomisk modell" },
        { k: "handel", type: "valg", etikett: "Handelspolitikk" },
        { k: "forvaltning", type: "valg", etikett: "Forvaltning av ressursinntekter", skjul: () => !["olje", "kobber", "diamanter", "jern"].some((r) => c.ressurser.includes(r)) },
        { k: "sentralbank", type: "valg", etikett: "Sentralbanken" },
      ],
      innsikt: (a) => a.ressursrisiko
        ? `<p><strong>Risiko for ressursforbannelse: ${a.ressursrisiko.toLowerCase()}.</strong> Om rikdommen blir en velsignelse eller en forbannelse, avhenger mest av institusjonene (Mehlum, Moene og Torvik 2006).</p>`
        : `<p class="dempet">Uten store punktressurser som olje, metaller eller diamanter er ressursforbannelse ingen problemstilling.</p>`,
    },
    {
      tittel: "Symboler",
      ingress: "Gi landet navn, hovedstad, motto og flagg.",
      felt: [
        { k: "navn", type: "tekst", etikett: "Landets navn", maks: 40 },
        { k: "hovedstad", type: "tekst", etikett: "Hovedstad", maks: 40 },
        { k: "motto", type: "tekst", etikett: "Motto", maks: 80, hint: "For eksempel: Alt for fedrelandet" },
        { k: "flagg", type: "valg", etikett: "Flaggets mønster" },
        { k: "farger", type: "farger", etikett: "Flaggets farger" },
      ],
      innsikt: () => `<div class="land-flaggvisning">${tegnFlagg(c, { bredde: 240 })}</div>
        <p class="dempet">Emblemet følger statsformen: krone for monarki, stjerne for republikk, og en krans av stjerner for en føderasjon.</p>`,
    },
    { tittel: "Grunnloven", resultat: true },
  ];

  // ---------- Kontroller ----------
  const glid = {
    tilPos: (f, v) => Math.round((1000 * Math.log(v / f.min)) / Math.log(f.max / f.min)),
    fraPos: (f, p) => {
      const v = f.min * Math.pow(f.max / f.min, p / 1000);
      const m = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1));
      return Math.round(v / m) * m;
    },
  };

  function feltHtml(f) {
    if (f.skjul && f.skjul()) return "";
    const id = `le-${f.k}`;
    if (f.type === "valg" || f.type === "flervalg") {
      const valgte = f.type === "valg" ? [c[f.k]] : c[f.k];
      const tekster = LAND_VALG[f.k].filter(([v, , t]) => t && valgte.includes(v));
      return `<div class="le-felt"><span class="pe-etikett">${f.etikett}</span>
        <div class="pe-valg" role="group" aria-label="${f.etikett}">${LAND_VALG[f.k].map(([v, navn]) =>
          `<button type="button" data-k="${f.k}" data-v="${esc(v)}" data-type="${f.type}" aria-pressed="${valgte.includes(v)}">${esc(navn)}</button>`).join("")}</div>
        ${tekster.length ? `<div class="le-fag">${tekster.map(([, navn, t]) => `<p>${f.type === "flervalg" ? `<strong>${esc(navn)}:</strong> ` : ""}${esc(t)}</p>`).join("")}</div>` : ""}
      </div>`;
    }
    if (f.type === "glider" || f.type === "logg") {
      const pos = f.type === "logg" ? glid.tilPos(f, c[f.k]) : c[f.k];
      const [min, max, step] = f.type === "logg" ? [0, 1000, 1] : [f.min, f.max, f.step];
      return `<div class="le-felt"><label class="pe-etikett" for="${id}">${f.etikett}: <span class="le-verdi" id="${id}-v">${f.vis(c[f.k])}</span></label>
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${pos}" data-k="${f.k}" data-glider="${f.type}">
        ${f.knapp ? `<button type="button" class="liten-knapp" data-knapp="${f.k}" style="align-self:flex-start">${f.knapp[0]}</button>` : ""}</div>`;
    }
    if (f.type === "farger") {
      return `<div class="le-felt"><span class="pe-etikett">${f.etikett}</span>
        ${["f1", "f2", "f3"].map((k, n) => `<div class="pe-farger" role="group" aria-label="Farge ${n + 1}"><span class="le-fargenr">${n + 1}</span>${FLAGGFARGER.map(([h, navn]) =>
          `<button type="button" class="pe-prikk" style="background:${h}" data-k="${k}" data-v="${h}" data-type="valg" aria-pressed="${c[k] === h}" aria-label="Farge ${n + 1}: ${navn}"></button>`).join("")}</div>`).join("")}</div>`;
    }
    return `<div class="felt le-felt"><label for="${id}">${f.etikett}</label><input id="${id}" data-k="${f.k}" maxlength="${f.maks}" value="${esc(c[f.k])}" placeholder="${esc(f.hint || "")}"></div>`;
  }

  // ---------- Tegning ----------
  function tegn() {
    const s = STEG[steg];
    const nav = `<ol class="le-steg">${STEG.map((x, i) => `<li><button type="button" data-steg="${i}" aria-current="${i === steg ? "step" : "false"}"${i < steg ? ' class="ferdig"' : ""}><span>${i + 1}</span>${esc(x.tittel)}</button></li>`).join("")}</ol>`;
    const knapper = `<div class="le-knapper">
      ${steg > 0 ? `<button type="button" class="knapp sekundar" data-flytt="-1">Forrige</button>` : "<span></span>"}
      ${s.resultat
        ? `<div style="display:flex; gap:10px; flex-wrap:wrap"><button type="button" class="knapp sekundar" id="le-nytt-kart">Tegn kartet på nytt</button><button type="button" class="knapp" id="le-lagre">Vedta grunnloven</button></div>`
        : `<button type="button" class="knapp" data-flytt="1">${steg === STEG.length - 2 ? "Se landet" : "Neste"}</button>`}
    </div><div id="le-melding" role="status"></div>`;

    if (s.resultat) {
      boks.innerHTML = `<div class="le">${nav}<div class="le-resultat">${landKortHtml(c)}</div>${knapper}</div>`;
      tegnLandKartI(boks, c);
    } else {
      boks.innerHTML = `<div class="le">${nav}
        <div class="le-innhold">
          <div class="le-skjema"><h3>${esc(s.tittel)}</h3><p class="dempet">${esc(s.ingress)}</p><div id="le-felt">${s.felt.map(feltHtml).join("")}</div></div>
          <aside class="le-innsikt" aria-live="polite"><h4>Innsikt</h4><div id="le-innsikt">${s.innsikt(analyserLand(c))}</div></aside>
        </div>${knapper}</div>`;
    }
  }

  const oppdaterInnsikt = () => {
    const el = boks.querySelector("#le-innsikt");
    if (el) el.innerHTML = STEG[steg].innsikt(analyserLand(c));
  };
  const oppdaterFelt = () => {
    const el = boks.querySelector("#le-felt");
    if (el) el.innerHTML = STEG[steg].felt.map(feltHtml).join("");
    oppdaterInnsikt();
  };

  boks.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b || !boks.contains(b)) return;
    if (b.dataset.steg !== undefined) { steg = Number(b.dataset.steg); tegn(); boks.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (b.dataset.flytt) { steg = Math.max(0, Math.min(STEG.length - 1, steg + Number(b.dataset.flytt))); tegn(); boks.scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (b.dataset.type) {
      const { k, v, type } = b.dataset;
      if (type === "flervalg") c[k] = c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v];
      else c[k] = v;
      if (k === "statsform" && v === "absolutt") c.system = "parlamentarisme";
      oppdaterFelt();
      return;
    }
    if (b.dataset.knapp) {
      const f = STEG[steg].felt.find((x) => x.k === b.dataset.knapp);
      f.knapp[1]();
      oppdaterFelt();
      return;
    }
    if (b.id === "le-nytt-kart") { c.fro = (c.fro % 99999) + 1; tegn(); return; }
    if (b.id === "le-lagre") {
      const melding = boks.querySelector("#le-melding");
      if (!c.navn.trim()) { melding.innerHTML = `<p class="melding feil">Landet må ha et navn. Gå tilbake til steg 7.</p>`; return; }
      b.disabled = true;
      try {
        await vedLagre({ ...c });
        melding.innerHTML = `<p class="melding">Grunnloven er vedtatt, og ${esc(c.navn)} er grunnlagt.</p>`;
      } catch (err) {
        melding.innerHTML = `<p class="melding feil">${esc(err.message)}</p>`;
      } finally {
        b.disabled = false;
      }
    }
  });

  boks.addEventListener("input", (e) => {
    const i = e.target.closest("input[data-k]");
    if (!i) return;
    const k = i.dataset.k;
    const f = STEG[steg].felt.find((x) => x.k === k);
    if (i.dataset.glider === "logg") c[k] = glid.fraPos(f, Number(i.value));
    else if (i.dataset.glider) c[k] = Number(i.value);
    else c[k] = i.value;
    const v = boks.querySelector(`#le-${k}-v`);
    if (v && f.vis) v.textContent = f.vis(c[k]);
    oppdaterInnsikt();
  });

  tegn();
}
