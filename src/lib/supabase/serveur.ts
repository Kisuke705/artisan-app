/**
 * Client Supabase utilisé CÔTÉ SERVEUR (pages, Server Actions, routes API).
 * La session de l'utilisateur est lue dans les cookies de la requête :
 * toutes les requêtes passent donc avec SES droits, et la RLS s'applique.
 *
 * Un nouveau client par requête : ne jamais le partager entre utilisateurs.
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function creerClientServeur() {
  const magasinCookies = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return magasinCookies.getAll();
        },
        setAll(cookiesAEcrire) {
          try {
            for (const { name, value, options } of cookiesAEcrire) {
              magasinCookies.set(name, value, options);
            }
          } catch {
            // Appelé depuis une page (Server Component) : on ne peut pas y
            // écrire de cookie. Ce n'est pas grave, proxy.ts rafraîchit la
            // session à chaque requête.
          }
        },
      },
    },
  );
}
