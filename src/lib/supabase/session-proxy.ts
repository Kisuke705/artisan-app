/**
 * Rafraîchissement de la session, appelé par src/proxy.ts à chaque requête.
 *
 * Le « jeton » de connexion Supabase expire après une heure. Ce code le
 * renouvelle automatiquement et réécrit les cookies, pour que l'artisan
 * ne soit pas déconnecté en plein chantier.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages accessibles sans être connecté
const PAGES_PUBLIQUES = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/auth"];

export async function mettreAJourSession(requete: NextRequest) {
  let reponse = NextResponse.next({ request: requete });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(cookiesAEcrire, entetes) {
          for (const { name, value } of cookiesAEcrire) requete.cookies.set(name, value);
          reponse = NextResponse.next({ request: requete });
          for (const { name, value, options } of cookiesAEcrire) {
            reponse.cookies.set(name, value, options);
          }
          // Empêche un cache intermédiaire de servir la session à quelqu'un d'autre
          for (const [cle, valeur] of Object.entries(entetes)) reponse.headers.set(cle, valeur);
        },
      },
    },
  );

  // getClaims() vérifie le jeton (et le renouvelle si besoin).
  // Ne rien mettre entre la création du client et cet appel.
  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims);

  const chemin = requete.nextUrl.pathname;
  const estPublique = PAGES_PUBLIQUES.some((p) => chemin === p || chemin.startsWith(`${p}/`));

  if (!connecte && !estPublique) {
    const url = requete.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (connecte && (chemin === "/connexion" || chemin === "/inscription")) {
    const url = requete.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return reponse;
}
