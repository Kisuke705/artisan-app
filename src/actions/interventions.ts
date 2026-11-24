"use server";
/**
 * Server Actions des interventions.
 *
 * Le parcours : 1. Où ? → 2. Travaux → 3. Photos → 4. Lignes → Terminer
 * L'intervention est créée en BROUILLON dès l'étape 1 et chaque étape
 * l'enregistre : si le téléphone s'éteint, rien n'est perdu.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEntreprise } from "@/lib/auth";
import { aujourdhuiIso } from "@/lib/format";
import { erreursParChamp, lireFormulaire, type EtatFormulaire } from "@/lib/validation/formulaire";
import { schemaLignes, schemaTravaux, type DonneesLigne } from "@/lib/validation/intervention";

const ERREUR_CLE_ETRANGERE = "23503";

/** Étape 1 : l'artisan a choisi l'adresse → on crée le brouillon. */
export async function creerIntervention(adresseId: string) {
  const { supabase, entreprise, utilisateur } = await exigerEntreprise();

  // Domaine proposé : celui de la dernière intervention de l'entreprise
  // (un plombier fait surtout de la plomberie). Modifiable à l'étape 2.
  const { data: derniere } = await supabase
    .from("intervention")
    .select("domaine")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("intervention")
    .insert({
      entreprise_id: entreprise.id,
      adresse_chantier_id: adresseId,
      technicien_id: utilisateur.id,
      date_intervention: aujourdhuiIso(),
      domaine: derniere?.domaine ?? "plomberie",
    })
    .select("id")
    .single();
  if (error) {
    console.error("Création intervention :", error);
    throw new Error("Impossible de créer l'intervention.");
  }

  revalidatePath("/interventions");
  redirect(`/interventions/${data.id}/travaux`);
}

/** Étape 2 : domaine, heures, problème et travaux. */
export async function enregistrerTravaux(
  interventionId: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaTravaux.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase } = await exigerEntreprise();
  const { error } = await supabase.from("intervention").update(verif.data).eq("id", interventionId);
  if (error) {
    console.error("Travaux :", error);
    return { message: messageErreur(error.message), valeurs };
  }

  revalidatePath(`/interventions/${interventionId}`);
  redirect(valeurs.suite === "fiche" ? `/interventions/${interventionId}` : `/interventions/${interventionId}/photos`);
}

/**
 * Étape 4 : toutes les lignes d'un coup (enregistrement automatique).
 * Appelée directement par le composant, pas par un formulaire.
 */
export async function enregistrerLignes(
  interventionId: string,
  lignes: DonneesLigne[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const verif = schemaLignes.safeParse(lignes);
  if (!verif.success) return { ok: false, message: verif.error.issues[0]?.message ?? "Lignes invalides." };

  const { supabase } = await exigerEntreprise();
  const { error } = await supabase.rpc("remplacer_lignes_intervention", {
    p_intervention_id: interventionId,
    p_lignes: verif.data,
  });
  if (error) {
    console.error("Lignes :", error);
    return { ok: false, message: messageErreur(error.message) };
  }
  revalidatePath(`/interventions/${interventionId}`);
  return { ok: true };
}

export async function terminerIntervention(interventionId: string) {
  const { supabase } = await exigerEntreprise();
  await supabase
    .from("intervention")
    .update({ statut: "terminee" })
    .eq("id", interventionId)
    .eq("statut", "brouillon");
  revalidatePath("/interventions");
  redirect(`/interventions/${interventionId}`);
}

/** Enregistre la photo envoyée par le navigateur (le fichier est déjà dans le stockage). */
export async function ajouterPhoto(interventionId: string, moment: "avant" | "apres", chemin: string) {
  const { supabase, entreprise } = await exigerEntreprise();
  // Sécurité : le chemin doit être rangé dans le dossier de CETTE intervention
  if (!chemin.startsWith(`${entreprise.id}/${interventionId}/`)) {
    return { ok: false as const, message: "Chemin de photo invalide." };
  }
  const { error } = await supabase
    .from("photo")
    .insert({ entreprise_id: entreprise.id, intervention_id: interventionId, moment, chemin });
  if (error) {
    console.error("Photo :", error);
    await supabase.storage.from("photos").remove([chemin]);
    return { ok: false as const, message: "La photo n'a pas pu être enregistrée." };
  }
  revalidatePath(`/interventions/${interventionId}`);
  return { ok: true as const };
}

export async function supprimerPhoto(interventionId: string, photoId: string) {
  const { supabase } = await exigerEntreprise();
  const { data: photo } = await supabase.from("photo").delete().eq("id", photoId).select("chemin").maybeSingle();
  if (photo) await supabase.storage.from("photos").remove([photo.chemin]);
  revalidatePath(`/interventions/${interventionId}`);
}

export async function supprimerIntervention(interventionId: string): Promise<EtatFormulaire> {
  const { supabase } = await exigerEntreprise();
  const { data: photos } = await supabase.from("photo").select("chemin").eq("intervention_id", interventionId);

  const { error } = await supabase.from("intervention").delete().eq("id", interventionId);
  if (error?.code === ERREUR_CLE_ETRANGERE) {
    return { message: "Un devis ou une facture a été établi pour cette intervention : elle est conservée." };
  }
  if (error) return { message: messageErreur(error.message) };

  // Les lignes et les fiches photos sont supprimées en cascade ; reste les fichiers
  if (photos?.length) await supabase.storage.from("photos").remove(photos.map((p) => p.chemin));

  revalidatePath("/interventions");
  redirect("/interventions");
}

/** Les messages levés par nos triggers SQL sont déjà en français : on les garde. */
function messageErreur(message: string): string {
  return message.includes("facturée") ? message : "Impossible d'enregistrer. Réessayez.";
}
