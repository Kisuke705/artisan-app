/**
 * Client Supabase utilisé DANS LE NAVIGATEUR (composants « use client »).
 * Il sert surtout à envoyer les photos directement vers le stockage.
 */
import { createBrowserClient } from "@supabase/ssr";

export function creerClientNavigateur() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
