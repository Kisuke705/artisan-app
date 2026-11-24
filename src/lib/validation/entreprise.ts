/**
 * Règles de validation de la fiche entreprise.
 */
import { z } from "zod";
import {
  estBceValide,
  estIbanValide,
  normaliserBce,
  normaliserIban,
} from "@/lib/belgique/identifiants";
import { texteObligatoire, texteOptionnel } from "./formulaire";

export const schemaEntreprise = z.object({
  nom: texteObligatoire("Indiquez le nom de votre entreprise."),

  numero_bce: texteObligatoire("Indiquez votre numéro d'entreprise (BCE).")
    .refine(estBceValide, "Ce numéro d'entreprise n'est pas valide (ex. 0123.456.749).")
    .transform(normaliserBce),

  regime_tva: z.enum(["assujetti", "franchise"], {
    error: "Choisissez votre régime TVA.",
  }),

  rue: texteObligatoire("Indiquez la rue et le numéro."),
  code_postal: texteObligatoire("Indiquez le code postal.").regex(
    /^[1-9]\d{3}$/,
    "Un code postal belge a 4 chiffres.",
  ),
  ville: texteObligatoire("Indiquez la commune."),

  email: texteOptionnel.refine(
    (v) => v === null || z.email().safeParse(v).success,
    "Cette adresse email n'est pas valide.",
  ),
  telephone: texteOptionnel,

  iban: texteOptionnel
    .refine((v) => v === null || estIbanValide(v), "Cet IBAN n'est pas valide.")
    .transform((v) => (v ? normaliserIban(v) : null)),
  bic: texteOptionnel.transform((v) => (v ? v.replace(/\s/g, "").toUpperCase() : null)),

  mentions_legales: texteOptionnel,
  delai_paiement_jours: z.coerce
    .number({ error: "Indiquez un nombre de jours." })
    .int("Indiquez un nombre entier de jours.")
    .min(0, "Le délai ne peut pas être négatif.")
    .max(120, "120 jours maximum."),
});

export type DonneesEntreprise = z.infer<typeof schemaEntreprise>;

/**
 * En Belgique, le numéro de TVA est le numéro d'entreprise précédé de « BE ».
 * On le déduit donc automatiquement plutôt que de le faire retaper.
 */
export function numeroTvaDepuisBce(numeroBce: string): string {
  return `BE${numeroBce}`;
}
