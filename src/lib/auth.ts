/**
 * « Couche d'accès aux données » pour l'utilisateur connecté.
 *
 * Toutes les pages privées passent par exigerEntreprise() : on est sûr
 * d'avoir un utilisateur connecté ET une fiche entreprise remplie.
 * cache() (de React) évite de refaire les requêtes plusieurs fois
 * pendant l'affichage d'une même page.
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Entreprise, Utilisateur } from "@/types/modeles";

export const lireSession = cache(async () => {
  const supabase = await creerClientServeur();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/connexion");

  const { data: utilisateur } = await supabase
    .from("utilisateur")
    .select("*, entreprise(*)")
    .eq("id", data.claims.sub)
    .maybeSingle<Utilisateur & { entreprise: Entreprise }>();

  return {
    supabase,
    userId: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? "",
    utilisateur: utilisateur ?? null,
  };
});

/** Pour les pages de l'application : connecté + entreprise créée. */
export async function exigerEntreprise() {
  const session = await lireSession();
  if (!session.utilisateur) redirect("/bienvenue");
  const { entreprise, ...utilisateur } = session.utilisateur;
  return { supabase: session.supabase, email: session.email, utilisateur, entreprise };
}
