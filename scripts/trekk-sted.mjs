// Trekker et tilfeldig sted til «Hva skjer?».
// Først trekkes et land (alle land har lik sjanse), så et sted i landet.
// Steder som allerede har hatt en utgave, eller som er forkastet, trekkes ikke på nytt.
//
// Bruk:  node scripts/trekk-sted.mjs            -> skriver ett sted som JSON
//        node scripts/trekk-sted.mjs 5          -> skriver fem kandidater (til reserve)

import { readFileSync, existsSync } from "node:fs";
import { randomInt } from "node:crypto";

const rot = new URL("../data/steder/", import.meta.url);
const { felt, land, steder } = JSON.parse(readFileSync(new URL("kandidater.json", rot), "utf8"));
const indeks = existsSync(new URL("index.json", rot)) ? JSON.parse(readFileSync(new URL("index.json", rot), "utf8")) : { utgaver: [], forkastet: [] };

const brukt = new Set([...(indeks.utgaver || []), ...(indeks.forkastet || [])].map((u) => `${u.sted}|${u.landkode}`));
const tilObjekt = (r) => Object.fromEntries(felt.map((f, i) => [f, r[i]]));
const ledige = steder.map(tilObjekt).filter((s) => !brukt.has(`${s.navn}|${s.land}`));

const perLand = {};
for (const s of ledige) (perLand[s.land] ||= []).push(s);
const landkoder = Object.keys(perLand);

const antall = Math.max(1, Number(process.argv[2]) || 1);
const valgt = [];
for (let i = 0; i < antall && landkoder.length; i++) {
  const lk = landkoder.splice(randomInt(landkoder.length), 1)[0];
  const s = perLand[lk][randomInt(perLand[lk].length)];
  valgt.push({ sted: s.navn, landkode: s.land, land: land[s.land] || s.land, lat: s.lat, lon: s.lon, innbyggere: s.innbyggere });
}
console.log(JSON.stringify(antall === 1 ? valgt[0] : valgt, null, 2));
