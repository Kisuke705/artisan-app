/**
 * Arrivée depuis un lien reçu par email (confirmation d'inscription ou
 * mot de passe oublié). Supabase ajoute un « code » à l'adresse : on
 * l'échange contre une session, puis on redirige vers la bonne page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/serveur";

export async function GET(requete: NextRequest) {
  const { searchParams, origin } = requete.nextUrl;
  const code = searchParams.get("code");
  const suite = searchParams.get("suite") ?? "/";
  // Sécurité : on ne redirige que vers une page de NOTRE site
  const destination = suite.startsWith("/") && !suite.startsWith("//") ? suite : "/";

  if (code) {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destination}`);
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
}
