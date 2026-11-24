/**
 * proxy.ts (anciennement « middleware.ts ») : exécuté AVANT chaque page.
 * Il rafraîchit la session et redirige vers /connexion si besoin.
 */
import type { NextRequest } from "next/server";
import { mettreAJourSession } from "@/lib/supabase/session-proxy";

export async function proxy(requete: NextRequest) {
  return mettreAJourSession(requete);
}

export const config = {
  // Toutes les pages, sauf les fichiers statiques, les images et le manifeste PWA
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|hors-ligne.html|icons/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
