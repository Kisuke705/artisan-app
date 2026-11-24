/**
 * Règles de validation des clients et des adresses de chantier.
 */
import { z } from "zod";
import { estTvaBelgeValide, normaliserTva } from "@/lib/belgique/identifiants";
import { estTelephoneValide } from "@/lib/belgique/telephone";
import { texteObligatoire, texteOptionnel } from "./formulaire";

const codePostalBelge = z
  .string()
  .trim()
  .regex(/^[1-9]\d{3}$/, "Un code postal belge a 4 chiffres.");

/**
 * Numéro de TVA d'un client entreprise :
 *  - belge (« BE… ») : on vérifie le chiffre de contrôle ;
 *  - étranger (« FR… », « NL… ») : on vérifie seulement la forme.
 */
function verifierTva(tva: string): boolean {
  const compact = tva.replace(/[\s.-]/g, "").toUpperCase();
  if (compact.startsWith("BE")) return estTvaBelgeValide(compact);
  return /^[A-Z]{2}[A-Z0-9]{2,13}$/.test(compact);
}

function normaliserTvaClient(tva: string): string {
  const compact = tva.replace(/[\s.-]/g, "").toUpperCase();
  return compact.startsWith("BE") ? normaliserTva(compact) : compact;
}

export const schemaClient = z
  .object({
    type: z.enum(["particulier", "entreprise"], { error: "Choisissez le type de client." }),
    nom: texteObligatoire("Indiquez le nom du client."),
    telephone: texteOptionnel.refine(
      (v) => v === null || estTelephoneValide(v),
      "Ce numéro de téléphone ne semble pas correct.",
    ),
    email: texteOptionnel.refine(
      (v) => v === null || z.email().safeParse(v).success,
      "Cette adresse email n'est pas valide.",
    ),
    numero_tva: texteOptionnel
      .refine((v) => v === null || verifierTva(v), "Ce numéro de TVA n'est pas valide (ex. BE 0123.456.749).")
      .transform((v) => (v ? normaliserTvaClient(v) : null)),
    // Adresse de facturation : tout ou rien
    rue: texteOptionnel,
    code_postal: texteOptionnel,
    ville: texteOptionnel,
    pays: z.string().trim().toUpperCase().length(2).optional().default("BE"),
    notes: texteOptionnel,
  })
  .superRefine((client, ctx) => {
    const remplis = [client.rue, client.code_postal, client.ville].filter(Boolean).length;
    if (remplis > 0 && remplis < 3) {
      for (const champ of ["rue", "code_postal", "ville"] as const) {
        if (!client[champ]) {
          ctx.addIssue({ code: "custom", path: [champ], message: "Complétez l'adresse de facturation." });
        }
      }
    }
    if (client.pays === "BE" && client.code_postal && !codePostalBelge.safeParse(client.code_postal).success) {
      ctx.addIssue({ code: "custom", path: ["code_postal"], message: "Un code postal belge a 4 chiffres." });
    }
  })
  // Un particulier n'a pas de numéro de TVA : on l'efface s'il en reste un
  .transform((client) => ({
    ...client,
    numero_tva: client.type === "particulier" ? null : client.numero_tva,
  }));

export type DonneesClient = z.infer<typeof schemaClient>;

export const schemaAdresse = z.object({
  libelle: texteOptionnel,
  rue: texteObligatoire("Indiquez la rue et le numéro."),
  code_postal: codePostalBelge,
  ville: texteObligatoire("Indiquez la commune."),
  // Trois réponses possibles : oui / non / je ne sais pas
  logement_plus_10_ans: z
    .enum(["oui", "non", "inconnu"])
    .optional()
    .transform((v) => (v === "oui" ? true : v === "non" ? false : null)),
  notes: texteOptionnel,
});

export type DonneesAdresse = z.infer<typeof schemaAdresse>;

/**
 * Le formulaire « nouveau client » contient aussi l'adresse du chantier,
 * avec des champs préfixés (« chantier_rue »…). Cette fonction extrait
 * ces champs et retire le préfixe : { chantier_rue: "x" } → { rue: "x" }.
 */
export function champsAvecPrefixe(valeurs: Record<string, string>, prefixe: string): Record<string, string> {
  const resultat: Record<string, string> = {};
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (cle.startsWith(prefixe)) resultat[cle.slice(prefixe.length)] = valeur;
  }
  return resultat;
}

/** Ajoute un préfixe aux clés d'erreurs : { rue: "…" } → { chantier_rue: "…" } */
export function prefixerErreurs(erreurs: Record<string, string>, prefixe: string): Record<string, string> {
  return Object.fromEntries(Object.entries(erreurs).map(([cle, message]) => [prefixe + cle, message]));
}
