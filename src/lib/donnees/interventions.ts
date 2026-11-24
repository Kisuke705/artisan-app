/**
 * Lecture des interventions (côté serveur).
 */
import "server-only";
import { notFound } from "next/navigation";
import { exigerEntreprise } from "@/lib/auth";
import type { InterventionComplete, Photo } from "@/types/modeles";

// Ce que l'on demande à Supabase : l'intervention, son adresse, le client
// de cette adresse, ses lignes et ses photos (en une seule requête).
const SELECTION = "*, adresse_chantier(*, client(*)), intervention_ligne(*), photo(*)";

export async function lireIntervention(id: string): Promise<InterventionComplete> {
  const { supabase } = await exigerEntreprise();
  const { data } = await supabase
    .from("intervention")
    .select(SELECTION)
    .eq("id", id)
    .order("position", { referencedTable: "intervention_ligne" })
    .order("created_at", { referencedTable: "photo" })
    .maybeSingle<InterventionComplete>();
  if (!data) notFound();
  // Postgres renvoie les « numeric » en texte pour ne rien perdre en précision
  data.intervention_ligne = data.intervention_ligne.map((l) => ({
    ...l,
    quantite: Number(l.quantite),
    prix_unitaire_htva: Number(l.prix_unitaire_htva),
  }));
  return data;
}

export async function listerInterventions(limite = 50): Promise<InterventionComplete[]> {
  const { supabase } = await exigerEntreprise();
  const { data, error } = await supabase
    .from("intervention")
    .select(SELECTION)
    .order("date_intervention", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) console.error("Liste interventions :", error);
  return (data ?? []) as InterventionComplete[];
}

/**
 * Le stockage est privé : pour afficher une photo, on crée un lien
 * temporaire signé (valable 1 heure). Un seul appel pour toutes les photos.
 */
export async function liensPhotos(photos: Photo[]): Promise<Record<string, string>> {
  if (photos.length === 0) return {};
  const { supabase } = await exigerEntreprise();
  const { data } = await supabase.storage.from("photos").createSignedUrls(
    photos.map((p) => p.chemin),
    3600,
  );
  const liens: Record<string, string> = {};
  for (const lien of data ?? []) {
    if (lien.path && lien.signedUrl) liens[lien.path] = lien.signedUrl;
  }
  return liens;
}
