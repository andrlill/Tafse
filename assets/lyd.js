// Lydeffekter for spillene, laget med Web Audio. Ingen lydfiler trengs.
// Bruk: LYD.spill("navn", ...) og LYD.knapp(element) for en lyd av/på-knapp.

window.LYD = (() => {
  const NOKKEL = "tafse-lyd";
  let ctx = null, hoved = null, stoy = null;
  let pa = (() => { try { return localStorage.getItem(NOKKEL) !== "av"; } catch (_) { return true; } })();
  const knapper = new Set();

  function start() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      hoved = ctx.createGain();
      hoved.gain.value = 0.55;
      const komp = ctx.createDynamicsCompressor();
      hoved.connect(komp).connect(ctx.destination);
      stoy = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = stoy.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // Nettlesere krever en brukerhandling før lyd kan spilles
  ["pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, () => { if (pa) start(); }, { capture: true, passive: true }));

  // ---------- Byggeklosser ----------
  function tone({ f = 440, til = null, type = "sine", start: s = 0, varighet = 0.15, volum = 0.3, angrep = 0.005 }) {
    const t = ctx.currentTime + s;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (til) o.frequency.exponentialRampToValueAtTime(til, t + varighet);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volum, t + angrep);
    g.gain.exponentialRampToValueAtTime(0.0001, t + varighet);
    o.connect(g).connect(hoved);
    o.start(t);
    o.stop(t + varighet + 0.05);
  }
  function sus({ start: s = 0, varighet = 0.2, volum = 0.3, filter = "bandpass", f = 1000, til = null, q = 1 }) {
    const t = ctx.currentTime + s;
    const k = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    k.buffer = stoy;
    fl.type = filter;
    fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t);
    if (til) fl.frequency.exponentialRampToValueAtTime(til, t + varighet);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volum, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + varighet);
    k.connect(fl).connect(g).connect(hoved);
    k.start(t, Math.random() * 0.5);
    k.stop(t + varighet + 0.05);
  }
  const akkord = (toner, s, varighet, volum, type = "triangle") => toner.forEach((f) => tone({ f, start: s, varighet, volum, type }));

  // ---------- Lydene ----------
  const LYDER = {
    // 2048
    skyv: () => sus({ varighet: 0.07, volum: 0.07, f: 1800, til: 700, q: 0.8 }),
    slatt: (verdi = 4) => {
      const trinn = Math.log2(verdi) - 2; // 4 gir 0, 2048 gir 9
      const f = 330 * Math.pow(2, (trinn * 2) / 12 + Math.floor(trinn / 3) / 12);
      tone({ f, varighet: 0.16, volum: 0.18, type: "triangle" });
      tone({ f: f * 2, varighet: 0.1, volum: 0.05, start: 0.01 });
    },
    rekord: () => [784, 988, 1175].forEach((f, i) => tone({ f, start: i * 0.06, varighet: 0.14, volum: 0.08, type: "sine" })),
    vant: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ f, start: i * 0.11, varighet: 0.3, volum: 0.16, type: "triangle" })); akkord([523, 659, 784, 1047], 0.5, 0.9, 0.07); },
    tapt: () => [392, 330, 262, 196].forEach((f, i) => tone({ f, start: i * 0.16, varighet: 0.32, volum: 0.13, type: "triangle" })),
    // Idus Martiae
    stikk: () => {
      sus({ varighet: 0.09, volum: 0.35, filter: "highpass", f: 2500, q: 0.7 });
      tone({ f: 150, til: 55, type: "sine", varighet: 0.2, volum: 0.45 });
      sus({ start: 0.02, varighet: 0.16, volum: 0.18, filter: "lowpass", f: 500 });
    },
    kollega: () => {
      tone({ f: 1320, type: "square", varighet: 0.07, volum: 0.05 });
      tone({ f: 1980, type: "sine", start: 0.01, varighet: 0.25, volum: 0.07 });
      tone({ f: 200, til: 90, varighet: 0.16, volum: 0.25, start: 0.02 });
      sus({ start: 0.03, varighet: 0.1, volum: 0.08, f: 3000, q: 2 });
    },
    sidesteg: () => sus({ varighet: 0.22, volum: 0.22, f: 500, til: 2600, q: 1.5 }),
    klar: () => { tone({ f: 1175, varighet: 0.1, volum: 0.06 }); tone({ f: 1568, start: 0.06, varighet: 0.14, volum: 0.06 }); },
    brutus: () => {
      tone({ f: 73, type: "sawtooth", varighet: 1.6, volum: 0.12, angrep: 0.2 });
      tone({ f: 110, type: "sawtooth", varighet: 1.6, volum: 0.08, angrep: 0.2 });
      tone({ f: 104, type: "sawtooth", start: 0.7, varighet: 1.0, volum: 0.07, angrep: 0.1 });
      sus({ varighet: 1.2, volum: 0.06, filter: "lowpass", f: 300 });
    },
    tikk: (siste = false) => tone({ f: siste ? 1047 : 784, type: "square", varighet: 0.05, volum: 0.04 }),
    dod: () => { tone({ f: 220, til: 55, type: "sawtooth", varighet: 1.1, volum: 0.13 }); sus({ varighet: 0.5, volum: 0.15, filter: "lowpass", f: 400 }); },
    seier: () => {
      [392, 392, 523, 659, 784].forEach((f, i) => tone({ f, type: "sawtooth", start: [0, 0.12, 0.24, 0.42, 0.6][i], varighet: i === 4 ? 0.7 : 0.14, volum: 0.08 }));
      akkord([523, 659, 784], 0.6, 0.9, 0.06);
    },
  };

  function spill(navn, ...arg) {
    if (!pa || !LYDER[navn]) return;
    if (!start()) return;
    try { LYDER[navn](...arg); } catch (_) {}
  }

  function settPa(v) {
    pa = v;
    try { localStorage.setItem(NOKKEL, v ? "pa" : "av"); } catch (_) {}
    if (v) start();
    knapper.forEach(oppdater);
  }
  function oppdater(b) {
    b.textContent = pa ? "Lyd på" : "Lyd av";
    b.setAttribute("aria-pressed", pa ? "true" : "false");
    b.classList.toggle("av", !pa);
  }
  function knapp(b) {
    if (!b) return;
    knapper.add(b);
    oppdater(b);
    b.addEventListener("click", () => { settPa(!pa); if (pa) spill("klar"); });
  }

  return { spill, knapp, get pa() { return pa; } };
})();
