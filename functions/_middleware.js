// Port for begge nettstedene, som bygges fra den samme koden og deler databasen.
//
// Hovedsiden (tafse.pages.dev): bare innloggede brødre ser Tafse-sidene. Spillene og spillhallen
// sendes over til spillsiden, med innloggingen på kjøpet.
//
// Spillsiden (variabelen NETTSTED=spill): man må være logget inn, som bror eller gjest, for å
// komme inn. Første gang sjekker man inn på hotellet (lager figur og får hus i Symposion) før man
// kan spille noe annet. Alt som ikke er spill, sendes tilbake til hovedsiden.
import { GJESTESPILL, hvemErInnlogget, hvemErGjest, gjesteNavn, innsjekket, erSpillside, annenSide } from "./api/[[sti]].js";

const SPILLSIDER = new Set(["gjest", "gjester", "honningfella", ...GJESTESPILL]);
const APNE_SIDER = new Set(["gjest", "velkommen", "nyttpassord", ...SPILLSIDER]);
const MERKE = "tafsenettsted=spill; Path=/; Max-Age=31536000; SameSite=Lax";   // så siden vet hvor den er før noe er lastet

const alltidApen = (sti) => sti.startsWith("/api/") || sti.startsWith("/assets/") || sti === "/favicon.ico" || sti === "/robots.txt";
const sideAv = (sti) => sti.replace(/^\//, "").replace(/\/$/, "").replace(/\.html$/, "") || "index";
const videre = (til) => new Response(null, { status: 302, headers: { Location: til, "Cache-Control": "no-store" } });
const billett = (url) => videre(`/api/billett?til=${encodeURIComponent((url.pathname + url.search).replace(/^\//, ""))}`);
async function privat(next, cookie) {
  const svar = await next();
  const ny = new Response(svar.body, svar);
  ny.headers.set("Cache-Control", "private, no-cache");
  if (cookie) ny.headers.append("Set-Cookie", cookie);
  return ny;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (alltidApen(url.pathname)) return next();
  const side = sideAv(url.pathname);
  const data = url.pathname.startsWith("/data/");

  let bror = null, gjest = null;
  try {
    if (env.DB && env.TAFSE_PASSORD) {
      bror = await hvemErInnlogget(request, env, env.DB);
      if (!bror) gjest = await hvemErGjest(request, env, env.DB);
    }
  } catch (_) {}

  if (erSpillside(env)) {
    if (side === "index") return videre("/gjest.html");
    if (side === "nyttpassord") return privat(next, MERKE);
    if (data) return bror ? privat(next) : videre("/gjest.html");
    if (!SPILLSIDER.has(side)) return billett(url);                       // over til hovedsiden
    if (side === "gjest") return privat(next, MERKE);                     // spillhallen: innlogging og invitasjoner
    if (!bror && !gjest) return videre("/gjest.html");
    if (side !== "hotell" && side !== "gjester" && !(await innsjekket(env.DB, bror || gjesteNavn(gjest)))) return videre(`/hotell.html?innsjekk=1&til=${encodeURIComponent(url.pathname.replace(/^\//, "") + url.search)}`);
    return privat(next, MERKE);
  }

  // Hovedsiden
  if (annenSide(env) && SPILLSIDER.has(side)) {
    // Spillhallen her er bare innloggingssiden for den som ikke er logget inn
    const blirHer = side === "gjest" && !bror && !gjest && !url.searchParams.get("fra");
    if (!blirHer) return billett(url);
  }
  if (APNE_SIDER.has(side) || bror) return bror ? privat(next) : next();
  return videre("/gjest");
}
