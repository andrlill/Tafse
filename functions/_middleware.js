// Port for hele nettstedet. Bare innloggede brødre ser Tafse-sidene.
// Alle andre (gjester og ukjente) slipper bare inn i spillhallen og sendes dit fra alt annet.
import { GJESTESPILL, hvemErInnlogget } from "./api/[[sti]].js";

const APNE_SIDER = new Set(["gjest", "velkommen", ...GJESTESPILL]);

function apen(sti) {
  if (sti.startsWith("/api/") || sti.startsWith("/assets/") || sti === "/favicon.ico" || sti === "/robots.txt") return true;
  const side = sti.replace(/^\//, "").replace(/\/$/, "").replace(/\.html$/, "");
  return APNE_SIDER.has(side);
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (apen(url.pathname)) return next();

  let bror = null;
  try { if (env.DB && env.TAFSE_PASSORD) bror = await hvemErInnlogget(request, env, env.DB); } catch (_) {}
  if (bror) {
    const svar = await next();
    const ny = new Response(svar.body, svar);
    ny.headers.set("Cache-Control", "private, no-cache");
    return ny;
  }
  return new Response(null, { status: 302, headers: { Location: "/gjest", "Cache-Control": "no-store" } });
}
