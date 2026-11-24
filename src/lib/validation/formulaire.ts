/**
 * Outils communs à tous les formulaires.
 *
 * Un formulaire envoie un FormData (que des textes). On le transforme en
 * objet, puis zod vérifie chaque champ et produit des messages d'erreur
 * en français, champ par champ.
 */
import { z } from "zod";

/** Ce que renvoie une Server Action à son formulaire. */
export type EtatFormulaire = {
  erreurs?: Record<string, string>; // message d'erreur par champ
  message?: string; // message général (en haut du formulaire)
  succes?: boolean;
  valeurs?: Record<string, string>; // pour re-remplir le formulaire après une erreur
};

/** FormData → objet { nom: "valeur" } (les fichiers sont ignorés) */
export function lireFormulaire(formData: FormData): Record<string, string> {
  const valeurs: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string") valeurs[cle] = valeur;
  }
  return valeurs;
}

/** Transforme les erreurs zod en { champ: "premier message" } */
export function erreursParChamp(erreur: z.ZodError): Record<string, string> {
  const erreurs: Record<string, string> = {};
  for (const probleme of erreur.issues) {
    const champ = String(probleme.path[0] ?? "formulaire");
    erreurs[champ] ??= probleme.message;
  }
  return erreurs;
}

/** Texte obligatoire */
export const texteObligatoire = (message = "Ce champ est obligatoire.") =>
  z.string({ error: message }).trim().min(1, message);

/** Texte facultatif : une chaîne vide devient null en base */
export const texteOptionnel = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));
