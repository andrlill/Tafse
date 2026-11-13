// TAFSE – Drømmelandet: prosedyrisk kart (canvas) og flagg (SVG).
// Terrenget følger valgene: form og kyst, tektonikk, istid, klima, folketall og hovedstad.

function landHash(str) {
  let h = 2166136261;
  for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function lagTilfeldig(frø) {
  let a = frø >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gitterHash(x, y, s) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function verdistoy(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = gitterHash(xi, yi, s), b = gitterHash(xi + 1, yi, s), c = gitterHash(xi, yi + 1, s), d = gitterHash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, s, oktaver = 4) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oktaver; i++) { sum += amp * verdistoy(x * f, y * f, s + i * 17); norm += amp; amp *= 0.5; f *= 2; }
  return sum / norm;
}

function avstandTilLinje(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const qx = ax + t * dx, qy = ay + t * dy;
  return { d: Math.hypot(px - qx, py - qy), side: dx * (py - ay) - dy * (px - ax) };
}

const hexTilRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const bland = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const glatt = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const BIOMFARGER = {
  Af: "#2f6b3a", Aw: "#8c9a4f", BWh: "#d6be88", BWk: "#c9b58c", BSh: "#b7a96c", BSk: "#a7a379",
  Csa: "#93a362", Cfa: "#5f9150", Cfb: "#6a9a5c", Cfc: "#5f8a64", Dfb: "#6c935c", Dfc: "#4f7556",
  ET: "#a9b09a", EF: "#eef1f3",
};

function lagTerreng(o) {
  const c = landOppsett(o);
  const a = analyserLand(c);
  const GW = 240, GH = 160;
  const s = landHash(`${c.navn}|${c.fro}`) % 100000;
  const rnd = lagTilfeldig(s + 7);
  const N = GW * GH;
  const land = new Uint8Array(N), stat = new Uint8Array(N), sjo = new Uint8Array(N), innsjo = new Uint8Array(N);
  const hoyde = new Float32Array(N), havdyp = new Float32Array(N);

  // Geometri etter form (U i 0–1,5, V i 0–1)
  const form = c.form;
  const cx = form === "kyststat" ? 0.66 : 0.75, cy = 0.5;
  const r = form === "oy" ? 0.36 : form === "kyststat" ? 0.5 : 0.4;
  const vinkel = rnd() * Math.PI;
  const istid = c.istid === "ja";
  const kystU = (v) => 1.1 + (fbm(v * 3, 7.3, s + 3) - 0.5) * 0.32;

  // Tektoniske linjer
  const t = c.tektonikk;
  const lx = Math.cos(vinkel), ly = Math.sin(vinkel);
  const linje = t === "kollisjon"
    ? [cx - lx * 0.42, cy - ly * 0.3, cx + lx * 0.42, cy + ly * 0.3]
    : t === "rift" ? [cx + 0.06, 0.02, cx - 0.06, 0.98]
    : form === "oy" ? [cx - lx * 0.3, cy - ly * 0.22, cx + lx * 0.3, cy + ly * 0.22]
    : [cx - 0.18, 0.05, cx - 0.12, 0.95];
  const vulkaner = [];
  for (let i = 0; i < 4; i++) vulkaner.push([linje[0] + (linje[2] - linje[0]) * (0.2 + i * 0.2), linje[1] + (linje[3] - linje[1]) * (0.2 + i * 0.2)]);

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      const U = (x / GW) * 1.5, V = y / GH;
      const d = Math.hypot(U - cx, V - cy);
      const maske = 1 - d / r + (fbm(U * 2.2, V * 2.2, s + 5) - 0.5) * 0.9;
      const tagget = (fbm(U * 11, V * 11, s + 11) - 0.5) * (istid ? 0.34 : 0.1);
      let dC;
      if (form === "oy") {
        const holmer = maske > -0.22 && maske < 0.08 && fbm(U * 16, V * 16, s + 21) > (istid ? 0.62 : 0.7);
        land[i] = maske + tagget > 0 || holmer ? 1 : 0;
        stat[i] = land[i];
        dC = Math.max(0, maske) * r;
        havdyp[i] = Math.max(0, -maske);
      } else if (form === "kyststat") {
        const k = kystU(V) + tagget;
        const holme = U > k && U < k + 0.09 && istid && fbm(U * 18, V * 18, s + 23) > 0.66;
        land[i] = U < k || holme ? 1 : 0;
        stat[i] = land[i] && (maske > 0 || (holme && Math.abs(V - cy) < r * 0.8)) ? 1 : 0;
        dC = Math.max(0, k - U);
        havdyp[i] = Math.max(0, U - k);
      } else {
        land[i] = 1;
        stat[i] = maske > 0 ? 1 : 0;
        dC = 0.5;
      }
      sjo[i] = land[i] ? 0 : 1;
      if (!land[i]) continue;

      // Høyde
      let e = 0.08 + 0.3 * fbm(U * 3, V * 3, s + 2) + 0.2 * Math.min(dC, 0.3) / 0.3;
      // Fjellkjeder: varierende høyde og bredde langs kjeden, og taggete topper
      const takket = 1 - Math.abs(2 * fbm(U * 9, V * 9, s + 9) - 1);
      const fjelldetalj = (0.45 + 0.9 * fbm(U * 3.5, V * 3.5, s + 19)) * (0.5 + 0.7 * takket);
      const bredde = 0.7 + 0.7 * fbm(U * 3, V * 3, s + 29);
      if (t === "passiv") e = e * 0.65 + 0.04;
      if (t === "subduksjon") {
        const rygg = form === "innland" ? Math.exp(-((avstandTilLinje(U, V, ...linje).d / (0.07 * bredde)) ** 2)) : Math.exp(-(((dC - 0.13) / (0.07 * bredde)) ** 2));
        e += 0.85 * rygg * fjelldetalj;
      }
      if (t === "kollisjon") {
        const { d: dl0, side } = avstandTilLinje(U, V, ...linje);
        const dl = Math.abs(dl0 + (fbm(U * 1.8, V * 1.8, s + 41) - 0.5) * 0.16 * Math.sign(side || 1));
        e += 0.85 * Math.exp(-((dl / (0.1 * bredde)) ** 2)) * fjelldetalj;
        if (side > 0) e += 0.14 * Math.exp(-((dl / 0.28) ** 2));
      }
      if (t === "rift") {
        const dl = avstandTilLinje(U, V, ...linje).d;
        e += 0.55 * Math.exp(-(((dl - 0.075) / (0.035 * bredde)) ** 2)) * fjelldetalj - 0.35 * Math.exp(-((dl / 0.03) ** 2));
        if (dl < 0.022 && fbm(U * 5, V * 5, s + 31) > 0.48) innsjo[i] = 1;
      }
      if (t === "hotspot") {
        const kx = form === "oy" ? cx : cx + 0.05;
        e += 0.95 * Math.exp(-((Math.hypot(U - kx, V - cy) / 0.1) ** 2));
        e += 0.4 * Math.exp(-((Math.hypot(U - kx + 0.18, V - cy + 0.12) / 0.08) ** 2));
      }
      if (t === "subduksjon" || t === "rift" || t === "hotspot")
        for (const [vx, vy] of vulkaner) e += 0.22 * Math.exp(-((Math.hypot(U - vx, V - vy) / 0.018) ** 2));
      const fin = 1 - Math.abs(2 * fbm(U * 22, V * 22, s + 14) - 1);
      e += (fin - 0.5) * 0.22 * glatt(0.25, 0.6, e) + (fbm(U * 30, V * 30, s + 15) - 0.5) * 0.04;
      hoyde[i] = Math.max(0, e);
      if (istid && stat[i] && e < 0.5 && fbm(U * 19, V * 19, s + 33) > 0.79) innsjo[i] = 1;
      if (form === "innland" && t !== "rift" && stat[i] && e < 0.32 && fbm(U * 2.6, V * 2.6, s + 44) > 0.74) innsjo[i] = 1;
    }
  }

  // Fast skala, slik at flate land forblir lave og høye fjell blir høye
  // (myk kurve i toppen, så relieffet i høyfjellet ikke flates ut)
  for (let i = 0; i < N; i++) hoyde[i] = Math.tanh(hoyde[i] * 1.05);

  // Elver: følger bratteste fall fra høye punkter
  const elveKilder = { vat: 8, sesong: 6, torr: 1, kald: 3 }[a.koppen.gruppe];
  const kandidater = [];
  for (let i = 0; i < N; i++) if (stat[i] && !innsjo[i] && hoyde[i] > 0.45) kandidater.push(i);
  const elver = [];
  const elvecelle = new Uint8Array(N);
  for (let k = 0; k < elveKilder * 3 && elver.length < elveKilder && kandidater.length; k++) {
    let i = kandidater[Math.floor(rnd() * kandidater.length)];
    const sti = [i];
    const sett = new Set([i]);
    for (let steg = 0; steg < 500; steg++) {
      const x = i % GW, y = (i / GW) | 0;
      let beste = -1, lavest = hoyde[i];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const j = ny * GW + nx;
        if (sett.has(j)) continue;
        const h = sjo[j] ? -1 : hoyde[j] - (dx && dy ? 0.0005 : 0);
        if (h < lavest) { lavest = h; beste = j; }
      }
      if (beste < 0) { if (sti.length > 14) innsjo[i] = 1; break; }
      i = beste; sti.push(i); sett.add(i);
      if (sjo[i] || innsjo[i] || elvecelle[i] || i % GW === 0 || i % GW === GW - 1 || i < GW || i >= N - GW) break;
    }
    if (sti.length > 14) { elver.push(sti); sti.forEach((j) => (elvecelle[j] = 1)); }
  }

  // Byer
  const nesten = (i, sjekk, r = 3) => {
    const x = i % GW, y = (i / GW) | 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < GW && ny < GH && sjekk[ny * GW + nx]) return true;
    }
    return false;
  };
  const byKandidater = [];
  for (let i = 0; i < N; i += 2) {
    if (!stat[i] || innsjo[i] || hoyde[i] > 0.5) continue;
    const x = i % GW, y = (i / GW) | 0;
    if (x < 8 || y < 8 || x > GW - 8 || y > GH - 8) continue;
    const poeng = (1 - hoyde[i]) + (nesten(i, sjo) ? 0.7 : 0) + (nesten(i, elvecelle, 2) ? 0.8 : 0) + (nesten(i, innsjo, 2) ? 0.3 : 0) + rnd() * 0.5;
    byKandidater.push([poeng, i]);
  }
  byKandidater.sort((p, q) => q[0] - p[0]);
  const antallByer = Math.max(2, Math.min(8, Math.round(Math.log10(c.folk) - 3 + c.urban / 35)));
  const byer = [];
  for (const [, i] of byKandidater) {
    const x = i % GW, y = (i / GW) | 0;
    if (byer.every((b) => Math.hypot(b.x - x, b.y - y) > 26)) byer.push({ x, y });
    if (byer.length >= antallByer) break;
  }

  let statCeller = 0;
  for (let i = 0; i < N; i++) if (stat[i]) statCeller++;

  return { c, a, GW, GH, land, stat, sjo, innsjo, hoyde, havdyp, elver, byer, statCeller };
}

function tegnLandKart(lerret, o) {
  const T = lagTerreng(o);
  const { c, a, GW, GH, land, stat, sjo, innsjo, hoyde, havdyp } = T;
  const CELLE = 3, B = GW * CELLE, H = GH * CELLE;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  lerret.width = B * dpr;
  lerret.height = H * dpr;
  const ctx = lerret.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const biom = hexTilRgb(BIOMFARGER[a.koppen.kode]);
  const fjell = hexTilRgb("#8b7d68"), sno = hexTilRgb("#dfe4e8"), sand = hexTilRgb("#e3cf9c");
  const nabo = hexTilRgb("#3d3a33"), grunt = hexTilRgb("#2f6f8f"), dypt = hexTilRgb("#13304a"), innsjoF = hexTilRgb("#3d7ea6");
  // Snøgrensen ligger høyt i tropene og synker mot polene
  const snogrense = a.koppen.kode === "EF" ? -1 : 1.1 - Math.pow(c.lat / 90, 1.3) * 0.6;
  const orken = a.koppen.gruppe === "torr";

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const i = y * GW + x;
      let farge;
      if (sjo[i]) {
        farge = bland(grunt, dypt, Math.min(1, havdyp[i] / 0.3 + fbm(x * 0.05, y * 0.05, 91) * 0.15));
      } else if (innsjo[i] && stat[i]) {
        farge = innsjoF;
      } else {
        const e = hoyde[i];
        let f = biom;
        if (orken) f = bland(f, sand, fbm(x * 0.08, y * 0.08, 55) * 0.5);
        else f = bland(f, bland(biom, [40, 60, 30], 0.5), fbm(x * 0.06, y * 0.06, 57) * 0.35);
        f = bland(f, fjell, glatt(0.42, 0.78, e));
        const sg = snogrense + 0.04 + (fbm(x * 0.16, y * 0.16, 61) - 0.5) * 0.24;
        if (snogrense > 0) f = bland(f, sno, glatt(sg, sg + 0.16, e) * 0.9);
        else f = sno;
        const ex = hoyde[Math.min(N(x + 1, y), GW * GH - 1)] - hoyde[Math.max(N(x - 1, y), 0)];
        const ey = hoyde[N(x, Math.min(GH - 1, y + 1))] - hoyde[N(x, Math.max(0, y - 1))];
        const skygge = Math.max(0.55, Math.min(1.4, 1 + (ex + ey) * 5.5));
        f = f.map((v) => v * skygge);
        farge = stat[i] ? f : bland(f, nabo, 0.72);
      }
      ctx.fillStyle = `rgb(${farge[0] | 0},${farge[1] | 0},${farge[2] | 0})`;
      ctx.fillRect(x * CELLE, y * CELLE, CELLE + 0.5, CELLE + 0.5);
    }
  }
  function N(x, y) { return y * GW + x; }

  // Kystlinje og riksgrense
  ctx.lineWidth = 1;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x;
    const sjekk = (j, x0, y0, x1, y1) => {
      if (land[i] !== land[j]) { ctx.strokeStyle = "rgba(15,30,40,.55)"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      else if (land[i] && stat[i] !== stat[j]) { ctx.strokeStyle = "rgba(240,224,180,.9)"; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); }
    };
    if (x < GW - 1) sjekk(i + 1, (x + 1) * CELLE, y * CELLE, (x + 1) * CELLE, (y + 1) * CELLE);
    if (y < GH - 1) sjekk(i + GW, x * CELLE, (y + 1) * CELLE, (x + 1) * CELLE, (y + 1) * CELLE);
  }

  // Elver
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const elv of T.elver) {
    for (let k = 1; k < elv.length; k++) {
      const p = elv[k - 1], q = elv[k];
      ctx.strokeStyle = "rgba(78,140,180,.95)";
      ctx.lineWidth = 0.8 + 2 * (k / elv.length);
      ctx.beginPath();
      ctx.moveTo((p % GW) * CELLE + 1.5, ((p / GW) | 0) * CELLE + 1.5);
      ctx.lineTo((q % GW) * CELLE + 1.5, ((q / GW) | 0) * CELLE + 1.5);
      ctx.stroke();
    }
  }

  // Byer
  T.byer.forEach((b, n) => {
    const px = b.x * CELLE + 1.5, py = b.y * CELLE + 1.5;
    if (n === 0) {
      ctx.fillStyle = "#c8102e";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 3.4 : 8, v = -Math.PI / 2 + (k * Math.PI) / 5;
        ctx.lineTo(px + Math.cos(v) * r, py + Math.sin(v) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const navn = c.hovedstad || "Hovedstaden";
      ctx.font = "600 15px Cinzel, Georgia, serif";
      ctx.textAlign = px > B * 0.7 ? "right" : "left";
      const tx = px + (px > B * 0.7 ? -12 : 12);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(10,10,10,.75)";
      ctx.strokeText(navn, tx, py + 5);
      ctx.fillStyle = "#fff8e6";
      ctx.fillText(navn, tx, py + 5);
    } else {
      ctx.fillStyle = "#fff8e6";
      ctx.strokeStyle = "rgba(10,10,10,.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  // Ramme, kartusj, målestokk og nordpil
  ctx.strokeStyle = "#c9a24a";
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, B - 10, H - 10);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(10, 10, B - 20, H - 20);

  const navn = (c.navn || "Uten navn").toUpperCase();
  ctx.font = "700 20px Cinzel, Georgia, serif";
  const bredde = Math.max(ctx.measureText(navn).width, 120) + 32;
  ctx.fillStyle = "rgba(11,11,10,.82)";
  ctx.fillRect(18, 18, bredde, 54);
  ctx.strokeStyle = "#c9a24a";
  ctx.strokeRect(18, 18, bredde, 54);
  ctx.fillStyle = "#e2c174";
  ctx.textAlign = "left";
  ctx.fillText(navn, 34, 46);
  ctx.font = "500 10px Cinzel, Georgia, serif";
  ctx.fillStyle = "#b3a991";
  ctx.fillText(`${Math.round(c.lat)}° ${c.halvkule === "S" ? "S" : "N"} · ${a.koppen.kode} · ${valgNavn("tektonikk", c.tektonikk).toUpperCase()}`, 34, 62);

  const kmPerCelle = Math.sqrt(c.areal / Math.max(1, T.statCeller));
  const kartKm = GW * kmPerCelle;
  const mal = kartKm / 5;
  const p10 = Math.pow(10, Math.floor(Math.log10(mal)));
  const rund = [1, 2, 5, 10].map((m) => m * p10).reduce((b, v) => (Math.abs(v - mal) < Math.abs(b - mal) ? v : b));
  const px = (rund / kartKm) * B;
  ctx.fillStyle = "rgba(11,11,10,.82)";
  ctx.fillRect(18, H - 48, px + 24, 30);
  ctx.fillStyle = "#e2c174";
  ctx.fillRect(30, H - 30, px / 2, 4);
  ctx.strokeStyle = "#e2c174";
  ctx.lineWidth = 1;
  ctx.strokeRect(30 + px / 2, H - 30, px / 2, 4);
  ctx.font = "500 10px Cinzel, Georgia, serif";
  ctx.fillText(`${rund.toLocaleString("nb-NO")} km`, 30, H - 35);

  const nx = B - 34, ny = 40;
  ctx.fillStyle = "rgba(11,11,10,.82)";
  ctx.beginPath(); ctx.arc(nx, ny, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e2c174";
  ctx.beginPath(); ctx.moveTo(nx, ny - 13); ctx.lineTo(nx + 5, ny + 4); ctx.lineTo(nx, ny); ctx.lineTo(nx - 5, ny + 4); ctx.closePath(); ctx.fill();
  ctx.font = "700 9px Cinzel, Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("N", nx, ny + 13);
  return T;
}

// ---------- Flagg ----------
function tegnFlagg(o, { bredde = 180 } = {}) {
  const c = landOppsett(o);
  const [f1, f2, f3] = [c.f1, c.f2, c.f3];
  const monarki = c.statsform !== "republikk";
  const W = 300, H = 200;
  const stjerne = (x, y, r, farge) => {
    let p = "";
    for (let k = 0; k < 10; k++) {
      const rr = k % 2 ? r * 0.42 : r, v = -Math.PI / 2 + (k * Math.PI) / 5;
      p += `${k ? "L" : "M"}${(x + Math.cos(v) * rr).toFixed(1)} ${(y + Math.sin(v) * rr).toFixed(1)}`;
    }
    return `<path d="${p}Z" fill="${farge}"/>`;
  };
  const krone = (x, y, s, farge) =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="${farge}"><path d="M-20 10 L-24 -10 L-12 0 L0 -16 L12 0 L24 -10 L20 10 Z"/><rect x="-20" y="12" width="40" height="6"/><circle cx="-24" cy="-12" r="3"/><circle cx="0" cy="-18" r="3"/><circle cx="24" cy="-12" r="3"/></g>`;
  const emblem = (x, y, s, farge) => {
    if (c.struktur === "foderasjon") {
      let ut = "";
      for (let k = 0; k < 8; k++) { const v = (k / 8) * Math.PI * 2; ut += stjerne(x + Math.cos(v) * 26 * s, y + Math.sin(v) * 26 * s, 6 * s, farge); }
      return ut + (monarki ? krone(x, y, 0.6 * s, farge) : stjerne(x, y, 10 * s, farge));
    }
    return monarki ? krone(x, y, s, farge) : stjerne(x, y, 22 * s, farge);
  };
  const kontrast = (bak, a, b) => (bak.toLowerCase() === a.toLowerCase() ? b : a);
  let innhold;
  switch (c.flagg) {
    case "kors":
      innhold = `<rect width="${W}" height="${H}" fill="${f1}"/><rect x="82" width="56" height="${H}" fill="${f2}"/><rect y="72" width="${W}" height="56" fill="${f2}"/>
        <rect x="96" width="28" height="${H}" fill="${f3}"/><rect y="86" width="${W}" height="28" fill="${f3}"/>`;
      break;
    case "loddrett":
      innhold = `<rect width="100" height="${H}" fill="${f1}"/><rect x="100" width="100" height="${H}" fill="${f2}"/><rect x="200" width="100" height="${H}" fill="${f3}"/>${emblem(150, 100, 1, kontrast(f2, "#c9a24a", f1))}`;
      break;
    case "vannrett":
      innhold = `<rect width="${W}" height="67" fill="${f1}"/><rect y="67" width="${W}" height="66" fill="${f2}"/><rect y="133" width="${W}" height="67" fill="${f3}"/>${emblem(150, 100, 0.9, kontrast(f2, "#c9a24a", f1))}`;
      break;
    case "kanton":
      innhold = `<rect width="${W}" height="${H}" fill="${f1}"/><rect width="150" height="100" fill="${f2}"/>${emblem(75, 50, 0.9, f3)}<rect y="150" width="${W}" height="18" fill="${f3}" opacity=".9"/>`;
      break;
    default:
      innhold = `<rect width="${W}" height="${H}" fill="${f1}"/><path d="M${W} 0 L${W} ${H} L0 ${H} Z" fill="${f2}"/><path d="M0 ${H} L0 ${H - 34} L${W - 51} 0 L${W} 0 L${W} 34 L51 ${H} Z" fill="${f3}"/>${emblem(60, 50, 0.7, kontrast(f1, "#c9a24a", f2))}`;
  }
  return `<svg class="flagg" viewBox="0 0 ${W} ${H}" width="${bredde}" role="img" aria-label="Flagget til ${esc(c.navn || "landet")}"><g>${innhold}</g><rect width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.35)"/></svg>`;
}

// ---------- Hele resultatkortet ----------
function landKortHtml(o, { kort = false } = {}) {
  const c = landOppsett(o);
  const a = analyserLand(c);
  const statsnavn = c.statsform === "republikk" ? "republikk" : "kongerike";
  const paragraf1 = `${esc(c.navn || "Landet")} er et fritt og selvstendig ${statsnavn}${c.struktur === "foderasjon" ? ", organisert som en føderasjon" : ""}. Dets regjeringsform er ${c.statsform === "konstitusjonelt" ? "innskrenket og arvelig monarkisk" : c.statsform === "absolutt" ? "arvelig og uinnskrenket monarkisk" : "republikansk"}${c.statsform !== "absolutt" ? `, med ${valgNavn("system", c.system).toLowerCase()}` : ""}.`;
  const fakta = [
    ["Hovedstad", c.hovedstad || "Ikke navngitt"],
    ["Areal", `${avrund(c.areal)} km²`],
    ["Innbyggere", avrund(c.folk)],
    ["Tetthet", `${a.tetthet < 10 ? a.tetthet.toFixed(1).replace(".", ",") : Math.round(a.tetthet)} per km²`],
    ["Klima", `${a.koppen.navn} (${a.koppen.kode})`],
    ["Geologi", valgNavn("tektonikk", c.tektonikk)],
    ["Statsform", valgNavn("statsform", c.statsform)],
    ["Styreform", c.statsform === "absolutt" ? "Monarkens regjering" : valgNavn("system", c.system)],
    ["Statsstruktur", valgNavn("struktur", c.struktur)],
    ["Valgordning", valgNavn("valg", c.valg)],
    ["Forsamling", `${c.S} representanter`],
    ["Effektive partier", a.Ns.toFixed(1).replace(".", ",")],
    ["Vetospillere", String(a.veto.length)],
    ["Økonomi", valgNavn("modell", c.modell)],
    ...(c.ressurser.length ? [["Ressurser", c.ressurser.map((r) => valgNavn("ressurser", r)).join(", ")]] : []),
    ["Geologisk troverdighet", `${a.geo.score} av 100`],
  ];
  const lx = (v) => 100 + v * 40, ly = (v) => 100 - v * 40;
  const lijphart = `<svg class="lijphart" viewBox="0 0 200 200" role="img" aria-label="Plassering i Lijpharts todimensjonale modell">
    <rect x="20" y="20" width="160" height="160" fill="none" stroke="#2c2820"/>
    <line x1="100" y1="20" x2="100" y2="180" stroke="#2c2820"/><line x1="20" y1="100" x2="180" y2="100" stroke="#2c2820"/>
    <text x="100" y="14" text-anchor="middle" font-size="8" fill="#b3a991">FØDERAL</text>
    <text x="100" y="194" text-anchor="middle" font-size="8" fill="#b3a991">ENHETLIG</text>
    <text x="16" y="104" text-anchor="end" font-size="8" fill="#b3a991" transform="rotate(-90 12 100)">MAJORITÆR</text>
    <text x="188" y="100" text-anchor="middle" font-size="8" fill="#b3a991" transform="rotate(90 188 100)">KONSENSUS</text>
    <text x="26" y="174" font-size="7" fill="#6f6756">Westminster-modellen</text>
    <text x="174" y="30" text-anchor="end" font-size="7" fill="#6f6756">Konsensusmodellen</text>
    <circle cx="${lx(a.lijphart.x)}" cy="${ly(a.lijphart.y)}" r="14" fill="#c9a24a" opacity=".18"/>
    <circle cx="${lx(a.lijphart.x)}" cy="${ly(a.lijphart.y)}" r="5" fill="#e2c174"/>
  </svg>`;

  return `<div class="land-kort">
    <div class="land-hode">
      ${tegnFlagg(c, { bredde: 150 })}
      <div>
        <p class="overline" style="margin:0">${c.statsform === "republikk" ? "Republikken" : "Kongeriket"}</p>
        <h3 class="land-navn">${esc(c.navn || "Uten navn")}</h3>
        ${c.motto ? `<p class="land-motto">«${esc(c.motto)}»</p>` : ""}
      </div>
    </div>
    <div class="land-kart-ramme"><canvas class="land-kart" aria-label="Kart over ${esc(c.navn || "landet")}"></canvas></div>
    <p class="land-paragraf"><span>§ 1</span> ${paragraf1}</p>
    <dl class="fakta land-fakta">${fakta.map(([t, v]) => `<div><dt>${t}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${kort ? "" : `
    <div class="land-analyse">
      <div class="land-lijphart">
        <h4>Lijpharts demokratimodeller</h4>
        ${lijphart}
        <p class="dempet" style="font-size:14px; margin:0">Plasseringen er et anslag ut fra valgene, etter Lijphart (2012).</p>
      </div>
      <div>
        <h4>Faglig vurdering</h4>
        <ul class="land-merknader">${a.merknader.map((m) => `<li><strong>${esc(m.tittel)}.</strong> ${esc(m.tekst)} <span class="dempet">(${esc(m.kilde)})</span></li>`).join("")}</ul>
        ${a.geo.merknader.length ? `<h4>Geologi</h4><ul class="land-merknader">${a.geo.merknader.map((m) => `<li class="${m.type}">${esc(m.tekst)}</li>`).join("")}</ul>` : ""}
      </div>
    </div>
    <details class="land-kilder"><summary>Litteratur</summary><ul>${LAND_KILDER.map((k) => `<li>${esc(k)}</li>`).join("")}</ul></details>`}
  </div>`;
}

// Tegner alle kart i et element etter at skriftene er lastet
function tegnLandKartI(rot, o) {
  const tegn = () => rot.querySelectorAll("canvas.land-kart").forEach((k) => tegnLandKart(k, o));
  tegn();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(tegn);
}
