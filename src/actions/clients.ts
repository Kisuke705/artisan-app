"use server";
/**
 * Server Actions des clients et de leurs adresses de chantier.
 *
 * Rappel sécurité : on ne vérifie JAMAIS ici que le client appartient à
 * l'entreprise de l'utilisateur. Ce n'est pas un oubli : la RLS de Postgres
 * le fait pour nous. Une requête sur le client d'une autre entreprise ne
 * trouve simplement rien.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEntreprise } from "@/lib/auth";
import {
  champsAvecPrefixe,
  prefixerErreurs,
  schemaAdresse,
  schemaClient,
} from "@/lib/validation/client";
import { erreursParChamp, lireFormulaire, type EtatFormulaire } from "@/lib/validation/formulaire";

// Code d'erreur Postgres : « une autre ligne dépend de celle-ci » (clé étrangère)
const ERREUR_CLE_ETRANGERE = "23503";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function creerClient(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);

  // 1. Vérifier le client
  const verifClient = schemaClient.safeParse(valeurs);

  // 2. Vérifier l'adresse du chantier, seulement si l'artisan a commencé à la remplir
  const champsChantier = champsAvecPrefixe(valeurs, "chantier_");
  const adresseRemplie = Boolean(champsChantier.rue || champsChantier.code_postal || champsChantier.ville);
  const verifAdresse = adresseRemplie ? schemaAdresse.safeParse(champsChantier) : null;

  // On affiche toutes les erreurs d'un coup (client + adresse)
  if (!verifClient.success || (verifAdresse && !verifAdresse.success)) {
    return {
      erreurs: {
        ...(verifClient.success ? {} : erreursParChamp(verifClient.error)),
        ...(verifAdresse && !verifAdresse.success
          ? prefixerErreurs(erreursParChamp(verifAdresse.error), "chantier_")
          : {}),
      },
      valeurs,
    };
  }

  const { supabase, entreprise } = await exigerEntreprise();

  // 3. Enregistrer le client
  const { data: client, error } = await supabase
    .from("client")
    .insert({ ...verifClient.data, entreprise_id: entreprise.id })
    .select("id")
    .single();
  if (error) {
    console.error("Création client :", error);
    return { message: "Impossible d'enregistrer le client. Réessayez.", valeurs };
  }

  // 4. Enregistrer l'adresse. Si cela échoue, on supprime le client qu'on
  //    vient de créer pour ne pas laisser une fiche à moitié remplie.
  if (verifAdresse?.success) {
    const { error: erreurAdresse } = await supabase
      .from("adresse_chantier")
      .insert({ ...verifAdresse.data, client_id: client.id, entreprise_id: entreprise.id });
    if (erreurAdresse) {
      console.error("Création adresse :", erreurAdresse);
      await supabase.from("client").delete().eq("id", client.id);
      return { message: "Impossible d'enregistrer l'adresse. Réessayez.", valeurs };
    }
  }

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function modifierClient(
  clientId: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaClient.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase } = await exigerEntreprise();
  const { error } = await supabase.from("client").update(verif.data).eq("id", clientId);
  if (error) {
    console.error("Modification client :", error);
    return { message: "Impossible d'enregistrer. Réessayez.", valeurs };
  }

  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function supprimerClient(clientId: string): Promise<EtatFormulaire> {
  const { supabase } = await exigerEntreprise();
  const { error } = await supabase.from("client").delete().eq("id", clientId);

  if (error?.code === ERREUR_CLE_ETRANGERE) {
    return {
      message:
        "Ce client a déjà des interventions, devis ou factures : il ne peut pas être supprimé (la loi impose de conserver l'historique).",
    };
  }
  if (error) {
    console.error("Suppression client :", error);
    return { message: "Impossible de supprimer. Réessayez." };
  }

  revalidatePath("/clients");
  redirect("/clients");
}

// ---------------------------------------------------------------------------
// Adresses de chantier
// ---------------------------------------------------------------------------

export async function creerAdresse(
  clientId: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaAdresse.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase, entreprise } = await exigerEntreprise();
  const { error } = await supabase
    .from("adresse_chantier")
    .insert({ ...verif.data, client_id: clientId, entreprise_id: entreprise.id });
  if (error) {
    console.error("Création adresse :", error);
    return { message: "Impossible d'enregistrer l'adresse. Réessayez.", valeurs };
  }

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function modifierAdresse(
  clientId: string,
  adresseId: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaAdresse.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase } = await exigerEntreprise();
  const { error } = await supabase
    .from("adresse_chantier")
    .update(verif.data)
    .eq("id", adresseId)
    .eq("client_id", clientId);
  if (error) {
    console.error("Modification adresse :", error);
    return { message: "Impossible d'enregistrer. Réessayez.", valeurs };
  }

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function supprimerAdresse(clientId: string, adresseId: string): Promise<EtatFormulaire> {
  const { supabase } = await exigerEntreprise();
  const { error } = await supabase
    .from("adresse_chantier")
    .delete()
    .eq("id", adresseId)
    .eq("client_id", clientId);

  if (error?.code === ERREUR_CLE_ETRANGERE) {
    return {
      message: "Des interventions ont eu lieu à cette adresse : elle est conservée pour l'historique.",
    };
  }
  if (error) {
    console.error("Suppression adresse :", error);
    return { message: "Impossible de supprimer. Réessayez." };
  }

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
