"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerEntreprise } from "@/lib/auth";
import { erreursParChamp, lireFormulaire, type EtatFormulaire } from "@/lib/validation/formulaire";
import { schemaPrestation } from "@/lib/validation/intervention";

export async function creerPrestation(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaPrestation.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase, entreprise } = await exigerEntreprise();
  const { error } = await supabase.from("prestation_catalogue").insert({ ...verif.data, entreprise_id: entreprise.id });
  if (error) {
    console.error("Catalogue :", error);
    return { message: "Impossible d'enregistrer. Réessayez.", valeurs };
  }
  revalidatePath("/catalogue");
  redirect("/catalogue");
}

export async function modifierPrestation(
  prestationId: string,
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = schemaPrestation.safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const { supabase } = await exigerEntreprise();
  const { error } = await supabase.from("prestation_catalogue").update(verif.data).eq("id", prestationId);
  if (error) return { message: "Impossible d'enregistrer. Réessayez.", valeurs };
  revalidatePath("/catalogue");
  redirect("/catalogue");
}

/**
 * On ne supprime pas une prestation : on la désactive. Elle disparaît des
 * suggestions mais les anciennes lignes qui l'ont utilisée restent intactes.
 */
export async function basculerPrestation(prestationId: string, actif: boolean) {
  const { supabase } = await exigerEntreprise();
  await supabase.from("prestation_catalogue").update({ actif }).eq("id", prestationId);
  revalidatePath("/catalogue");
}
