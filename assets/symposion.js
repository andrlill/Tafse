// SYMPOSION: den felles greske byen. Hver bror har et gods som gir oliven, vin og marmor.
// Reglene og all utregning ligger på serveren (lib/symposion.js). Denne fila tegner byen.

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

  const RESS = ["oliven", "vin", "marmor"];
  const tall = (n) => Math.floor(n).toLocaleString("nb-NO");
  const IKON = {
    oliven: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><ellipse cx="8" cy="9.6" rx="4.4" ry="5.4" fill="#93a85c"/><ellipse cx="6.6" cy="8" rx="1.3" ry="2" fill="#c3d28e" opacity=".7"/><path d="M8 4.4 Q10 1 13.4 2 Q11.4 5.4 8 4.4" fill="#5f7339"/></svg>`,
    vin: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><g fill="#a8527c"><circle cx="5.4" cy="6.6" r="2.4"/><circle cx="10.6" cy="6.6" r="2.4"/><circle cx="8" cy="8.6" r="2.4"/><circle cx="6.6" cy="11.4" r="2.2"/><circle cx="9.6" cy="11.4" r="2.2"/><circle cx="8" cy="13.6" r="1.8"/></g><path d="M8 5 L8 1.6 Q11 1 12 3" fill="none" stroke="#5f7339" stroke-width="1.2"/></svg>`,
    marmor: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M8 1.6 L14.4 4.8 L8 8 L1.6 4.8 Z" fill="#f4efe3"/><path d="M1.6 4.8 L8 8 L8 14.6 L1.6 11.4 Z" fill="#cfc8b6"/><path d="M14.4 4.8 L8 8 L8 14.6 L14.4 11.4 Z" fill="#a9a290"/></svg>`,
    aere: `<svg viewBox="0 0 16 16" class="sy-ikon" aria-hidden="true"><path d="M8 14 Q2 12 2.6 4.4 M8 14 Q14 12 13.4 4.4" fill="none" stroke="#c9a24a" stroke-width="1.2"/><g fill="#e2c174"><ellipse cx="3" cy="5.4" rx="1.2" ry="2"/><ellipse cx="3.4" cy="9" rx="1.2" ry="2" transform="rotate(-25 3.4 9)"/><ellipse cx="5.4" cy="12" rx="1.2" ry="2" transform="rotate(-55 5.4 12)"/><ellipse cx="13" cy="5.4" rx="1.2" ry="2"/><ellipse cx="12.6" cy="9" rx="1.2" ry="2" transform="rotate(25 12.6 9)"/><ellipse cx="10.6" cy="12" rx="1.2" ry="2" transform="rotate(55 10.6 12)"/></g></svg>`,
  };
  const pris = (k) => Object.entries(k).map(([r, n]) => `<span class="sy-pris">${tall(n)}${IKON[r]}</span>`).join(" ");
  const gave = (k) => Object.entries(k).map(([r, n]) => `+${tall(n)} ${r}`).join(", ");
  const eier = (navn) => (/[sxz]$/i.test(navn) ? `${navn}'` : `${navn}s`);

  // Lageret fylles mellom hver gang vi spør serveren
  function lager(r) {
    const m = T.meg;
    return Math.min(m.tak[r], m.lager[r] + (m.rater[r] * (Date.now() - hentet)) / 3600000);
  }
  const lagerSum = () => RESS.reduce((s, r) => s + Math.floor(lager(r)), 0);
  const harRad = (k) => k && Object.entries(k).every(([r, n]) => T.meg.beholdning[r] >= n);

  // ---------- Bykartet ----------
  const W = 1000, H = 640, TOPP = 44;
  function plass(i, n) {
    const v = ((-90 + ((i + 0.5) * 360) / n) * Math.PI) / 180;
    const x = 500 + Math.cos(v) * 388, y = 404 + Math.sin(v) * 150;
    return { x, y, s: 1.0 + (0.36 * (y - 250)) / 304 };
  }

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

  function tomt(sp, navn, i, n) {
    const { x, y, s } = plass(i, n);
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
      const trinn = b.villa <= 2 ? 0 : b.villa <= 4 ? 1 : b.villa <= 7 ? 2 : 3;
      const tak = [-28, -35, -43, -62][trinn];
      const hoyde = [-44, -52, -60, -80][trinn] - (sp.rang >= 1 ? 16 : 0);
      const merke = mitt
        ? `<g class="sy-dupp sy-klar" data-klar hidden><circle cy="${hoyde - 6}" r="11" fill="#141310" stroke="#c9a24a"/><g transform="translate(-8 ${hoyde - 14})">${IKON.oliven.replace('class="sy-ikon"', 'width="16" height="16"')}</g></g>`
        : !sp.skjenket && T.meg ? `<g class="sy-dupp"><path d="M-4 ${hoyde - 12} h8 l-1 4 q4 5 0 11 h-6 q-4 -6 0 -11 z" fill="#c9a24a" stroke="#14130d" stroke-width="1"/></g>` : "";
      inn = `${sp.rang >= 4 ? `<ellipse rx="78" ry="24" fill="url(#sy-glod)"/>` : ""}<ellipse rx="64" ry="17" fill="#3b3824"/><ellipse rx="64" ry="17" class="sy-ring" fill="none"/>${stein}${tre}<g>${villa(b.villa, sp.hjemme)}</g>${vin}${pynt(sp.rang, tak)}${taggSvg(sp.tagg, mitt)}${merke}`;
    }
    return `<g class="${klasse}" data-navn="${esc(navn)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})" tabindex="0" role="button" aria-label="${esc(sp ? `${eier(navn)} gods` : `Ledig tomt: ${navn}`)}">
      <ellipse rx="70" ry="60" cy="-22" fill="transparent"/>${inn}
      <text y="34" text-anchor="middle" class="sy-navn">${esc(navn)}${mitt ? " (deg)" : ""}</text>
      ${sp && sp.rang ? `<text y="47" text-anchor="middle" class="sy-tittel">${esc(T.regler.ranger[sp.rang].tittel)}</text>` : ""}</g>`;
  }

  // Rangpynt: flagg (rådsmann), laurbærkrans (senator), statue (arkont), fakler (symposiark)
  function pynt(r, tak) {
    if (!r) return "";
    let s = "";
    if (r >= 1) s += `<g class="sy-flagg"><path d="M0 ${tak} v-17" stroke="#c9a24a" stroke-width="1.6"/><path d="M0.8 ${tak - 17} q7 -2 13 2 q-6 3 -13 6 z" fill="#8e2f52"/><path d="M0.8 ${tak - 17} q7 -2 13 2" fill="none" stroke="#c9a24a" stroke-width=".8"/></g>`;
    if (r >= 2) s += [-1, 1].map((side) => `<g transform="scale(${side} 1)">${[0, 1, 2, 3, 4].map((k) => {
      const v = (Math.PI * (0.16 + k * 0.1));
      const x = -Math.cos(v) * 46, y = 12 + Math.sin(v) * 7 - k * 0.6;
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="1.8" fill="#e2c174" transform="rotate(${(-30 + k * 12) * 1} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join("")}<path d="M-47 11 Q-30 22 -6 20" fill="none" stroke="#c9a24a" stroke-width="1"/></g>`).join("");
    if (r >= 3) s += `<g transform="translate(-62 8)"><rect x="-6" y="-4" width="12" height="6" fill="#bdb49d"/><rect x="-5" y="-6" width="10" height="2" fill="#ece5d3"/><circle cy="-21" r="3" fill="#ece5d3"/><path d="M-3 -18 h6 l1 12 h-8 z" fill="#ece5d3"/><path d="M3 -16 l5 -6" stroke="#ece5d3" stroke-width="2" stroke-linecap="round"/></g>`;
    if (r >= 4) s += [-48, 48].map((x) => `<g transform="translate(${x} 14)"><path d="M-3 0 h6 l-1 -7 h-4 z" fill="#5a4630"/><path d="M-4 -7 h8 l-1 -2 h-6 z" fill="#c9a24a"/><path d="M0 -9 q-4 -5 0 -11 q4 6 0 11" fill="#f2c14e" class="sy-flamme"/></g>`).join("");
    return s;
  }

  // Statuer som brødrene har kjøpt, i en ring rundt agoraen
  function statuer() {
    const l = T.statuer || [];
    return l.map((navn, i) => {
      const v = Math.PI * (1.08 + (i + 0.5) * (0.84 / Math.max(l.length, 1)));
      const x = 500 + Math.cos(v) * 178, y = 432 + Math.sin(v) * 78;
      return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><title>${esc(navn)}</title>
        <rect x="-7" y="-5" width="14" height="7" fill="#bdb49d"/><rect x="-6" y="-7" width="12" height="2" fill="#ece5d3"/>
        <circle cy="-26" r="3.6" fill="#ece5d3"/><path d="M-4 -22 h8 l1.5 15 h-11 z" fill="#ece5d3"/><path d="M-4 -22 h3 l-1 15 h-3.5 z" fill="#bdb49d"/><path d="M4 -20 l6 -7" stroke="#ece5d3" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.5" cy="-27.5" r="1.8" fill="#c9a24a"/>
        <text y="12" text-anchor="middle" class="sy-statuenavn">${esc(navn)}</text></g>`;
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
    return m ? RESS.reduce((s, r) => s + Math.min(1, m.gitt[r] / m.krav[r]), 0) / 3 : 1;
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
    const bat = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" class="sy-bat"><path d="M-16 0 Q0 9 16 0 L12 5 H-12 Z" fill="#3a2a18"/><path d="M0 0 V-20" stroke="#3a2a18" stroke-width="1.6"/><path d="M1 -19 Q12 -12 1 -4 Z" fill="#ece5d3"/></g>`;
    const n = T.medlemmer.length;
    const tomter = T.medlemmer.map((navn, i) => ({ y: plass(i, n).y, svg: tomt(T.spillere.find((s) => s.navn === navn), navn, i, n) }));
    const veier = T.medlemmer.map((_, i) => { const p = plass(i, n); return `<path d="M500 418 Q${((500 + p.x) / 2).toFixed(0)} ${((418 + p.y) / 2 + 14).toFixed(0)} ${p.x.toFixed(0)} ${p.y.toFixed(0)}"/>`; }).join("");
    const grad = monumentGrad();
    const mon = T.regler.monumenter.map(({ id }) => ({ id, svg: monument(id, T.ferdige.includes(id) ? 1 : T.monument && T.monument.id === id ? grad : null) }));
    const rekke = { tempel: 0, agora: 1, teater: 2, koloss: 3 };
    mon.sort((a, b) => rekke[a.id] - rekke[b.id]);
    const bak = tomter.filter((t) => t.y < 400).sort((a, b) => a.y - b.y).map((t) => t.svg).join("");
    const foran = tomter.filter((t) => t.y >= 400).sort((a, b) => a.y - b.y).map((t) => t.svg).join("");
    return `<svg viewBox="0 ${TOPP} ${W} ${H - TOPP}" class="sy-kart" role="group" aria-label="Kart over byen">
      <defs>
        <linearGradient id="sy-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07080d"/><stop offset=".62" stop-color="#151a2a"/><stop offset="1" stop-color="#4a3a22"/></linearGradient>
        <linearGradient id="sy-hav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3138"/><stop offset=".25" stop-color="#121c22"/><stop offset="1" stop-color="#0a0f12"/></linearGradient>
        <radialGradient id="sy-land" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#4a4830"/><stop offset=".7" stop-color="#2f2e1e"/><stop offset="1" stop-color="#23221a"/></radialGradient>
        <radialGradient id="sy-glod" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2c14e" stop-opacity=".35"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></radialGradient>
        <radialGradient id="sy-mane" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2e3b4" stop-opacity=".5"/><stop offset="1" stop-color="#f2e3b4" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="${W}" height="232" fill="url(#sy-himmel)"/>
      <g class="sy-stjerner" fill="#f2e3b4">${stjerner}</g>
      <circle cx="838" cy="74" r="62" fill="url(#sy-mane)"/><circle cx="838" cy="74" r="21" fill="#f2e3b4"/><circle cx="846" cy="68" r="19" fill="#151a2a" opacity=".35"/>
      <path d="M0 232 L0 206 L70 178 L130 200 L210 162 L300 204 L360 190 L420 214 L560 216 L640 186 L720 208 L800 170 L880 202 L950 184 L1000 204 L1000 232 Z" fill="#12141a"/>
      <rect y="224" width="${W}" height="${H - 224}" fill="url(#sy-hav)"/>
      <path d="M770 232 L800 300 L900 300 L850 232 Z" fill="#f2e3b4" opacity=".06"/>
      <g class="sy-glitter" stroke="#f2e3b4" stroke-width="1.2" stroke-linecap="round">${glitter}</g>
      ${bat(64, 262, 0.8)}${bat(948, 590, 1.2)}
      <path d="${kystlinje}" fill="#1c2a30" transform="translate(0 7)" opacity=".8"/>
      <path d="${kystlinje}" fill="#9a8552"/>
      <path d="${kystlinje}" fill="url(#sy-land)" transform="translate(500 412) scale(.975 .955) translate(-500 -412)"/>
      <g class="sy-veier" fill="none" stroke="#7a6d49" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" opacity=".7">${veier}</g>
      ${bak}
      ${mon.map((m) => m.svg).join("")}
      ${statuer()}
      ${foran}
    </svg>`;
  }

  // ---------- Toppen: ressurser og dagens offer ----------
  function topp() {
    const m = T.meg;
    const brikker = [...RESS, "aere"].map((r) => `<div class="sy-brikke" data-brikke="${r}" title="${r === "aere" ? "Ære du kan bruke i æresbutikken" : r}">${IKON[r]}<strong>${tall(r === "aere" ? m.aereIgjen : m.beholdning[r])}</strong><span>${r === "aere" ? "ære" : r}</span></div>`).join("");
    const prikker = Array.from({ length: 7 }, (_, i) => `<i class="${i < (m.kanOfre ? m.streak % 7 === 0 && m.streak ? 0 : Math.min(m.streak, 6) : m.streak) ? "full" : ""}"></i>`).join("");
    const offer = m.kanOfre
      ? `<button class="knapp sy-offer" type="button" data-gjor="offer">Ofre til gudene<small>${gave(m.nesteOffer)}</small></button>`
      : `<div class="sy-ofret"><span class="sy-etikett">Ofret i dag · dag ${m.streak} av 7</span><span class="sy-prikker">${prikker}</span><small>I morgen: ${gave(m.nesteOffer)}</small></div>`;
    return `<div class="sy-topp"><div class="sy-brikker">${brikker}</div>${offer}</div>`;
  }

  function tips() {
    const m = T.meg;
    const andre = T.spillere.filter((s) => s.navn !== m.navn);
    if (T.spillere.find((s) => s.navn === m.navn)?.tagg) return "Noen har tagget huset ditt! Skrubb det bort, ellers går det ut over avlingen.";
    if (m.kanOfre) return "Gudene venter på dagens offer. Kom innom hver dag, så vokser gaven.";
    if (lagerSum() >= 15) return "Avlingen er klar. Trykk på «Høst».";
    const rad = Object.keys(T.regler.bygg).find((id) => m.apen[id] && harRad(m.kost[id]));
    if (rad) return `Du har råd til å ${m.bygg[rad] ? "utvide" : "anlegge"} ${T.regler.bygg[rad].navn.toLowerCase()}.`;
    if (andre.some((s) => !s.skjenket)) return "Trykk på godset til en bror og skjenk ham et glass. Dere tjener begge på det.";
    if (!andre.length) return "Du er første mann i byen. Få med deg brødrene!";
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
      ? niva ? `<p class="sy-rate">${IKON[r]} ${tall(m.rater[r])} ${r} i timen</p><div class="sy-lager"><span data-lagerstrek="${r}"></span></div><p class="sy-lagertall"><span data-lagertall="${r}"></span> av ${tall(m.tak[r])} på lager</p>`
             : `<p class="dempet">Gir ${r}. ${r === "vin" ? "Trengs til større bygg og til monumentet." : "Trengs til villaen og til monumentet."}</p>`
      : `<p class="sy-rate">Lageret rommer ${m.takTimer} timer</p><p class="dempet">Hvert nivå gir én time til, og et staseligere hus.</p>`;
    const knapp = k
      ? `<button class="liten-knapp sy-utvid${harRad(k) ? " sy-rad" : ""}" type="button" data-bygg="${id}" ${harRad(k) ? "" : "disabled"}>${niva ? "Utvid" : "Anlegg"} · ${pris(k)}</button>`
      : `<p class="sy-etikett">Høyeste nivå</p>`;
    return `<article class="sy-bygg"><h4>${regel.navn} <span>${niva ? `nivå ${niva}` : ""}</span></h4>${info}${knapp}</article>`;
  }

  function rangOgButikk() {
    const m = T.meg, R = T.regler.ranger;
    const neste = R[m.rang + 1];
    const fra = R[m.rang].fra;
    const andel = neste ? Math.min(100, ((m.aere - fra) / (neste.fra - fra)) * 100) : 100;
    const PYNT = { flagg: "et flagg på taket", krans: "en laurbærkrans rundt godset", statue: "en statue i hagen", fakler: "fakler og gullglød" };
    const vare = (id) => {
      const v = T.regler.butikk[id];
      let status = "", sperret = m.aereIgjen < v.pris;
      if (v.perDag) { const n = m.kjopt[id]; status = `${n} av ${v.perDag} kjøpt i dag`; if (n >= v.perDag) sperret = true; }
      if (id === "slave" && m.slaveTil) status = `Jobber til ${new Date(m.slaveTil).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}`;
      if (id === "statue" && m.kjopt.statue) { status = "Står på agoraen"; sperret = true; }
      return `<article class="sy-vare"><h4>${esc(v.navn)}</h4><p>${esc(v.tekst)}</p>${status ? `<p class="sy-varestatus">${esc(status)}</p>` : ""}
        <button class="liten-knapp sy-utvid${sperret ? "" : " sy-rad"}" type="button" data-kjop="${id}" ${sperret ? "disabled" : ""}>${id === "slave" && m.slaveTil ? "Forleng" : "Kjøp"} · ${v.pris} ${IKON.aere}</button></article>`;
    };
    return `<div class="sy-rangboks">
      <div class="sy-rangtopp"><div><p class="sy-etikett">Din rang</p><h3>${esc(R[m.rang].tittel)}</h3>
        <p class="dempet">${tall(m.aere)} ære tjent totalt${neste ? ` · ${tall(neste.fra - m.aere)} til ${neste.tittel.toLowerCase()}, som gir ${PYNT[neste.pynt]}` : " · Høyeste rang i byen"}</p></div></div>
      <div class="sy-lager sy-rangstrek"><span style="width:${andel}%"></span></div>
      <p class="sy-etikett" style="margin-top:18px">Æresbutikken · du har ${tall(m.aereIgjen)} ${IKON.aere} å bruke</p>
      <p class="dempet sy-butikkfot">Det du bruker her, trekkes ikke fra rangen din.</p>
      <div class="sy-butikk">${Object.keys(T.regler.butikk).map(vare).join("")}</div></div>`;
  }

  function minTagg() {
    const t = T.spillere.find((s) => s.navn === T.meg.navn)?.tagg;
    if (!t) return "";
    return `<div class="sy-taggvarsel"><div><p class="sy-etikett">Huset ditt er tagget</p>
      <p><strong>${esc(t.fra)}</strong> sprayet <span class="sy-taggsitat" style="color:${t.farge}">${esc(t.tekst)}</span> på villaen din. Godset produserer ${Math.round(T.regler.taggStraff * 100)} % mindre til det er vasket bort.</p></div>
      <button class="knapp" type="button" data-skrubb>${skrubb ? `Skrubb videre (${skrubb} av ${SKRUBB})` : "Skrubb det bort"}</button></div>`;
  }

  function taggSkjema(sp) {
    const m = T.meg;
    if (sp.tagg) return `<div class="sy-taggboks"><p class="sy-etikett">Spraybøksa</p><p>Huset er allerede tagget av <strong>${esc(sp.tagg.fra)}</strong>: <span class="sy-taggsitat" style="color:${sp.tagg.farge}">${esc(sp.tagg.tekst)}</span>. ${esc(sp.navn)} må vaske før noen kan tagge igjen.</p></div>`;
    const tom = m.taggIgjen <= 0 || sp.tagget;
    return `<form class="sy-taggboks" data-taggskjema="${esc(sp.navn)}"><p class="sy-etikett">Spraybøksa · ${m.taggIgjen} av ${T.regler.taggPerDag} tagger igjen i dag</p>
      <div class="sy-taggrad"><input type="text" name="tekst" maxlength="${T.regler.taggMaks}" placeholder="Skriv noe på veggen hans" autocomplete="off" ${tom ? "disabled" : ""} required>
      <div class="sy-farger" role="radiogroup" aria-label="Farge">${FARGER.map((f) => `<button type="button" class="sy-farge${f === taggFarge ? " valgt" : ""}" data-farge="${f}" style="background:${f}" aria-label="Farge" aria-checked="${f === taggFarge}" role="radio" ${tom ? "disabled" : ""}></button>`).join("")}</div>
      <button class="knapp" type="submit" ${tom ? "disabled" : ""}>${sp.tagget ? "Tagget i dag" : m.taggIgjen <= 0 ? "Tom for maling" : "Tagg huset"}</button></div>
      <p class="dempet sy-taggfot">Huset hans produserer ${Math.round(T.regler.taggStraff * 100)} % mindre til han vasker. Du får +3 ære, og han får beskjed.</p></form>`;
  }

  function panel() {
    const m = T.meg;
    if (!valgt || valgt === m.navn) {
      const synlige = ["lund", "vingard", ...(m.bygg.vingard ? ["brudd"] : []), "villa"];
      return `<section class="sy-panel">
        <div class="sy-panelhode"><div><p class="sy-etikett">Godset ditt</p><p class="sy-fullt" data-fullt></p></div>
          <button class="knapp sy-host" type="button" data-gjor="host" data-host>Høst</button></div>
        ${minTagg()}
        <div class="sy-byggliste">${synlige.map(byggKort).join("")}</div>
        ${rangOgButikk()}</section>`;
    }
    const sp = T.spillere.find((s) => s.navn === valgt);
    if (!sp) return `<section class="sy-panel"><p class="sy-etikett">Ledig tomt</p><p>${esc(valgt)} har ikke flyttet inn ennå. <a href="salongen.html">Mas på ham i Salongen.</a></p><button class="liten-knapp" type="button" data-hjem>Til godset mitt</button></section>`;
    const b = sp.bygg;
    const nask = sp.nasket ? "Nasket i dag" : m.naskIgjen <= 0 ? "Ikke flere nask i dag" : sp.bytte < 5 ? "Nyhøstet, ingenting å naske" : `Nask ca. ${tall(sp.bytte)} oliven`;
    return `<section class="sy-panel">
      <div class="sy-panelhode"><div><p class="sy-etikett">På besøk</p><h3>${esc(eier(sp.navn))} gods</h3>
        <p class="dempet">Villa nivå ${b.villa} · olivenlund ${b.lund}${b.vingard ? ` · vingård ${b.vingard}` : ""}${b.brudd ? ` · marmorbrudd ${b.brudd}` : ""} · ${tall(sp.aere)} ære${sp.hjemme ? "" : " · ikke hjemme på en stund"}</p></div>
        <button class="liten-knapp" type="button" data-hjem>Til godset mitt</button></div>
      <div class="sy-besok">
        <button class="knapp" type="button" data-skjenk="${esc(sp.navn)}" ${sp.skjenket ? "disabled" : ""}>${sp.skjenket ? "Skjenket i dag" : "Skjenk et glass vin"}<small>${sp.skjenket ? "Kom igjen i morgen" : `Han får vin, du får +10 oliven og +5 ære`}</small></button>
        <button class="knapp sekundar" type="button" data-nask="${esc(sp.navn)}" ${sp.nasket || m.naskIgjen <= 0 || sp.bytte < 5 ? "disabled" : ""}>${nask}<small>${m.naskIgjen} av ${T.regler.naskPerDag} nask igjen i dag. Han får beskjed.</small></button>
      </div>
      ${taggSkjema(sp)}</section>`;
  }

  function monumentPanel() {
    const m = T.monument;
    if (!m) return `<section class="sy-boks"><p class="sy-etikett">Byens monumenter</p><h3>Alt er reist</h3><p class="dempet">Byen er fullført, og alle produserer ${Math.round((T.bonus - 1) * 100)} % mer. Nye byggverk kommer.</p></section>`;
    const nr = T.regler.monumenter.findIndex((x) => x.id === m.id) + 1;
    const rader = RESS.map((r) => {
      const igjen = m.krav[r] - m.gitt[r], har = Math.floor(T.meg.beholdning[r]);
      const knapper = igjen <= 0 ? `<span class="sy-etikett">Fullt</span>` : [50, 250].filter((n) => n < Math.min(har, igjen)).map((n) => `<button class="liten-knapp" type="button" data-gi="${r}" data-antall="${n}">Gi ${n}</button>`).join("") +
        `<button class="liten-knapp" type="button" data-gi="${r}" data-antall="${Math.min(har, igjen)}" ${har > 0 ? "" : "disabled"}>Gi ${har > 0 ? tall(Math.min(har, igjen)) : "alt"}</button>`;
      return `<div class="sy-krav"><div class="sy-kravtekst">${IKON[r]}<span>${tall(m.gitt[r])} av ${tall(m.krav[r])} ${r}</span></div><div class="sy-lager"><span style="width:${Math.min(100, (m.gitt[r] / m.krav[r]) * 100)}%"></span></div><div class="sy-giknapper">${knapper}</div></div>`;
    }).join("");
    const topp3 = T.bidrag.slice(0, 5).map((b, i) => `<li><span>${i + 1}. ${esc(b.navn)}</span><span>${tall(b.verdi)}</span></li>`).join("");
    return `<section class="sy-boks" id="sy-monument"><p class="sy-etikett">Felles byggverk ${nr} av ${T.regler.monumenter.length}</p><h3>${esc(m.navn)}</h3>
      <p class="dempet">${esc(m.tekst)} Når det står ferdig, produserer alle 10 % mer. Hver gave gir deg ære.</p>${rader}
      ${topp3 ? `<p class="sy-etikett" style="margin-top:16px">Største givere</p><ol class="sy-givere">${topp3}</ol>` : ""}</section>`;
  }

  function tidSiden(iso) {
    const min = Math.max(0, Math.round((Date.parse(T.naa) - Date.parse(iso)) / 60000));
    return min < 1 ? "nå" : min < 60 ? `${min} min` : min < 1440 ? `${Math.floor(min / 60)} t` : `${Math.floor(min / 1440)} d`;
  }

  function sidefelt() {
    const rang = T.spillere.slice().sort((a, b) => b.aere - a.aere);
    return `<section class="sy-boks"><p class="sy-etikett">Ærestavlen</p>
        <ol class="sy-givere sy-rang">${rang.map((s, i) => `<li class="${s.navn === T.meg.navn ? "meg" : ""}"><button type="button" class="lenkeknapp" data-velg="${esc(s.navn)}">${i + 1}. ${esc(s.navn)}</button>${s.rang ? `<span class="sy-litentittel">${esc(T.regler.ranger[s.rang].tittel)}</span>` : ""}<span class="sy-rangpoeng">${tall(s.aere)} ${IKON.aere}</span></li>`).join("")}</ol>
        <p class="sy-etikett" style="margin-top:20px">Byens røst</p>
        <ul class="sy-logg">${T.logg.map((l) => `<li><strong>${esc(l.navn)}</strong> ${esc(l.tekst)} <span>${tidSiden(l.opprettet)}</span></li>`).join("") || `<li class="dempet">Stille i gatene.</li>`}</ul></section>`;
  }

  // ---------- Tegn alt ----------
  function tegn() {
    if (!T.meg) {
      rot.innerHTML = `<div class="sy-kartboks">${kart()}<div class="sy-velkommen"><p class="overline">En ny by reiser seg</p><h2>Brødrene bygger Symposion</h2>
        <p>Du får et lite gods med en olivenlund. Høst, bygg ut og hjelp de andre. Sammen reiser dere byens monumenter.</p>
        <button class="knapp" type="button" data-gjor="flytt-inn">Flytt inn</button>
        <p class="dempet">${T.spillere.length ? `${T.spillere.length} av ${T.medlemmer.length} brødre har flyttet inn.` : "Bli første mann i byen."}</p></div></div>`;
      return;
    }
    rot.innerHTML = `${topp()}
      <div class="sy-kartboks"><div class="sy-kartrull">${kart()}</div><div class="sy-toast" id="sy-toast" role="status"></div></div>
      <p class="sy-tips" id="sy-tips"></p>
      <div id="sy-panel">${panel()}</div>
      <div class="sy-to">${monumentPanel()}${sidefelt()}</div>`;
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
    const host = rot.querySelector("[data-host]");
    if (host) {
      const deler = RESS.filter((r) => Math.floor(lager(r)) > 0).map((r) => `${tall(lager(r))} ${r}`);
      host.innerHTML = sum > 0 ? `Høst<small>${deler.join(", ")}</small>` : `Høst<small>Ingenting ennå</small>`;
      host.disabled = sum <= 0 || opptatt;
      host.classList.toggle("klar", sum >= 15);
    }
    const klar = rot.querySelector("[data-klar]");
    if (klar) klar.toggleAttribute("hidden", sum < 15);
    const f = rot.querySelector("[data-fullt]");
    if (f) f.textContent = fulltOm();
    const tp = document.getElementById("sy-tips");
    if (tp) tp.textContent = tips();
  }

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
    const i = T.medlemmer.indexOf(T.meg.navn);
    if (!boks || i < 0) return;
    const p = plass(i, T.medlemmer.length);
    const d = document.createElement("div");
    d.className = "sy-sprett";
    d.textContent = tekst;
    d.style.left = `${(p.x / W) * 100}%`;
    d.style.top = `${((p.y - 70 - TOPP) / (H - TOPP)) * 100}%`;
    boks.append(d);
    setTimeout(() => d.remove(), 1600);
  }

  function etterHandling() {
    const s = T.sist;
    if (!s) return;
    if (s.type === "host") { if (Object.keys(s.fikk).length) { sprett(gave(s.fikk)); } }
    else if (s.type === "offer") { sprett(gave(s.fikk)); toast(`Gudene er fornøyde. Dag ${s.streak} av 7 på rad.`); }
    else if (s.type === "bygg") toast(`${T.regler.bygg[s.bygg].navn} er nå på nivå ${s.niva}. +${10 * s.niva} ære.`);
    else if (s.type === "skjenk") toast(`Skål, ${s.til}! +10 oliven og +5 ære.`);
    else if (s.type === "nask") toast(`Du nasket ${s.fikk.oliven} oliven fra ${s.til}. Han har fått beskjed.`);
    else if (s.type === "gi") toast(s.ferdig ? `${s.ferdig} står ferdig! Alle produserer 10 % mer.` : `Takk! +${s.aere} ære.`);
    else if (s.type === "tagg") toast(`Huset til ${s.til} har fått ny utsmykning. +${s.aere} ære.`);
    else if (s.type === "vask") toast(`Rent igjen. ${s.fra} får prøve seg på nytt en annen dag.`);
    else if (s.type === "kjop") toast(s.vare === "statue" ? "Statuen din står nå på agoraen." : s.vare === "slave" ? "Vaskeslaven er ansatt. Han tar tagger etter en time." : `${s.navn} kjøpt.`);
    else if (s.type === "flytt-inn") toast("Velkommen til byen. Godset ditt er merket med gull.");
    if (s.nyRang) setTimeout(() => toast(`Du er utnevnt til ${s.nyRang.toLowerCase()}! Se på huset ditt.`), 1800);
    for (const r of Object.keys(s.fikk || {})) {
      const b = rot.querySelector(`[data-brikke="${r}"]`);
      if (b) { b.classList.remove("blink"); void b.offsetWidth; b.classList.add("blink"); }
    }
  }

  function taImot(svar) {
    const forste = !T;
    T = svar;
    hentet = Date.now();
    tegn();
    if (forste && T.meg) {
      const rull = rot.querySelector(".sy-kartrull");
      const p = plass(T.medlemmer.indexOf(T.meg.navn), T.medlemmer.length);
      if (rull && rull.scrollWidth > rull.clientWidth) rull.scrollLeft = (p.x / W) * rull.scrollWidth - rull.clientWidth / 2;
    }
  }

  async function gjor(handling, kropp) {
    if (opptatt) return;
    opptatt = true;
    try {
      const rull = rot.querySelector(".sy-kartrull");
      const x = rull ? rull.scrollLeft : 0;
      taImot(await api(`symposion/${handling}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kropp || {}) }));
      const ny = rot.querySelector(".sy-kartrull");
      if (ny) ny.scrollLeft = x;
      etterHandling();
    } catch (e) {
      toast(e.message, true);
    } finally {
      opptatt = false;
      tikk();
    }
  }

  function velg(navn) {
    valgt = navn === T.meg?.navn ? null : navn;
    rot.querySelectorAll(".sy-tomt").forEach((g) => g.classList.toggle("valgt", g.dataset.navn === (valgt || "")));
    document.getElementById("sy-panel").innerHTML = panel();
    tikk();
  }

  rot.addEventListener("click", (e) => {
    const k = e.target.closest("button, .sy-tomt, [data-monument]");
    if (!k || k.disabled) return;
    if (k.dataset.gjor) gjor(k.dataset.gjor);
    else if (k.dataset.bygg) gjor("bygg", { bygg: k.dataset.bygg });
    else if (k.dataset.skjenk) gjor("skjenk", { til: k.dataset.skjenk });
    else if (k.dataset.nask) gjor("nask", { til: k.dataset.nask });
    else if (k.dataset.kjop) gjor("kjop", { vare: k.dataset.kjop });
    else if (k.dataset.gi) gjor("gi", { ressurs: k.dataset.gi, antall: Number(k.dataset.antall) });
    else if (k.dataset.hjem !== undefined) velg(T.meg.navn);
    else if (k.dataset.farge) {
      taggFarge = k.dataset.farge;
      rot.querySelectorAll(".sy-farge").forEach((x) => { x.classList.toggle("valgt", x === k); x.setAttribute("aria-checked", x === k); });
      const inp = rot.querySelector("[data-taggskjema] input");
      if (inp) inp.style.color = taggFarge;
    }
    else if (k.dataset.skrubb !== undefined) {
      skrubb += 1;
      const tg = rot.querySelector(".sy-tomt.mitt .sy-taggen");
      if (tg) tg.setAttribute("opacity", (1 - skrubb / SKRUBB).toFixed(2));
      k.classList.remove("skrubber"); void k.offsetWidth; k.classList.add("skrubber");
      if (skrubb >= SKRUBB) { skrubb = 0; gjor("vask"); }
      else k.textContent = `Skrubb videre (${skrubb} av ${SKRUBB})`;
    }
    else if (k.dataset.velg) { velg(k.dataset.velg); document.getElementById("sy-panel").scrollIntoView({ behavior: "smooth", block: "nearest" }); }
    else if (k.dataset.monument !== undefined) document.getElementById("sy-monument")?.scrollIntoView({ behavior: "smooth", block: "center" });
    else if (k.dataset.navn && T.meg) { velg(k.dataset.navn); document.getElementById("sy-panel").scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  });
  rot.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-taggskjema]");
    if (!f) return;
    e.preventDefault();
    const tekst = f.tekst.value.trim();
    if (tekst) gjor("tagg", { til: f.dataset.taggskjema, tekst, farge: taggFarge });
  });
  rot.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("sy-tomt") && T.meg) { e.preventDefault(); velg(e.target.dataset.navn); }
  });

  async function hent() {
    if (opptatt || document.hidden) return;
    try {
      const rull = rot.querySelector(".sy-kartrull");
      const x = rull ? rull.scrollLeft : null;
      const aktiv = document.activeElement && rot.contains(document.activeElement);
      if (T && aktiv) return; // ikke tegn om mens noen holder på
      taImot(await api("symposion"));
      const ny = rot.querySelector(".sy-kartrull");
      if (ny && x !== null) ny.scrollLeft = x;
    } catch (e) {
      if (!T) rot.innerHTML = `<p class="melding feil">${esc(e.message)}</p>`;
    }
  }

  (async () => {
    if (!(await hvemErJeg())) {
      rot.innerHTML = `<p class="tomt">Byen er bare for brødrene. <a href="salongen.html">Logg inn</a> for å flytte inn.</p>`;
      return;
    }
    await hent();
    setInterval(tikk, 1000);
    setInterval(hent, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) hent(); });
  })();
})();
