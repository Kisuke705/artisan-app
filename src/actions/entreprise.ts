"use server";
/**
 * Server Actions de la fiche entreprise :
 *  - creerEntreprise   : au premier lancement (page /bienvenue)
 *  - modifierEntreprise : ensuite (page /entreprise), avec le logo
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEntreprise, lireSession } from "@/lib/auth";
import { numeroTvaDepuisBce, schemaEntreprise } from "@/lib/validation/entreprise";
import {
  erreursParChamp,
  lireFormulaire,
  texteOptionnel,
  type EtatFormulaire,
} from "@/lib/validation/formulaire";

export async function creerEntreprise(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaEntreprise.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const d = verif.data;
  const { supabase } = await lireSession();

  // Appel de la fonction SQL creer_entreprise() (voir migration 2)
  const { error } = await supabase.rpc("creer_entreprise", {
    p_nom: d.nom,
    p_numero_bce: d.numero_bce,
    p_numero_tva: numeroTvaDepuisBce(d.numero_bce),
    p_regime_tva: d.regime_tva,
    p_rue: d.rue,
    p_code_postal: d.code_postal,
    p_ville: d.ville,
    p_email: d.email,
    p_telephone: d.telephone,
    p_iban: d.iban,
    p_bic: d.bic,
    p_mentions_legales: d.mentions_legales,
    p_nom_complet: texteOptionnel.parse(valeurs.nom_complet),
    p_delai_paiement_jours: d.delai_paiement_jours,
  });
  if (error) {
    console.error("creer_entreprise :", error);
    return { message: error.message.includes("déjà lié") ? error.message : "Impossible d'enregistrer. Réessayez.", valeurs };
  }

  redirect("/");
}

// ---------------------------------------------------------------------------

const TYPES_LOGO: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg" };
const TAILLE_MAX_LOGO = 2 * 1024 * 1024; // 2 Mo

export async function modifierEntreprise(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaEntreprise.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase, entreprise } = await exigerEntreprise();
  const d = verif.data;
  const modifications: Record<string, unknown> = {
    ...d,
    numero_tva: numeroTvaDepuisBce(d.numero_bce),
  };

  // --- Logo -----------------------------------------------------------------
  const logo = formData.get("logo");
  const supprimerLogo = formData.get("supprimer_logo") === "on";

  if (logo instanceof File && logo.size > 0) {
    const extension = TYPES_LOGO[logo.type];
    if (!extension) return { erreurs: { logo: "Le logo doit être une image PNG ou JPEG." }, valeurs };
    if (logo.size > TAILLE_MAX_LOGO) return { erreurs: { logo: "Le logo ne doit pas dépasser 2 Mo." }, valeurs };

    // Le chemin commence par l'id de l'entreprise : c'est ce que vérifie la règle de stockage
    const chemin = `${entreprise.id}/logo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("logos")
      .upload(chemin, logo, { contentType: logo.type });
    if (error) {
      console.error("Envoi du logo :", error);
      return { erreurs: { logo: "Le logo n'a pas pu être envoyé." }, valeurs };
    }
    modifications.logo_chemin = chemin;
  } else if (supprimerLogo) {
    modifications.logo_chemin = null;
  }

  const { error } = await supabase.from("entreprise").update(modifications).eq("id", entreprise.id);
  if (error) {
    console.error("Mise à jour entreprise :", error);
    return { message: "Impossible d'enregistrer. Réessayez.", valeurs };
  }

  // L'ancien logo n'est plus utilisé : on le supprime du stockage
  if (entreprise.logo_chemin && "logo_chemin" in modifications) {
    await supabase.storage.from("logos").remove([entreprise.logo_chemin]);
  }

  revalidatePath("/", "layout"); // rafraîchit le nom de l'entreprise affiché partout
  return { succes: true, message: "Fiche entreprise enregistrée." };
}
