/**
 * Validation des interventions, de leurs lignes et du catalogue.
 */
import { z } from "zod";
import { lireNombre } from "@/lib/interventions";
import { texteObligatoire, texteOptionnel } from "./formulaire";

// Liste écrite en toutes lettres : zod en déduit le type exact
const domaines = ["plomberie", "electricite", "chauffage", "autre"] as const;

const heure = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Heure invalide (ex. 08:30).");

/** Écran « Travaux » */
export const schemaTravaux = z
  .object({
    domaine: z.enum(domaines, { error: "Choisissez un domaine." }),
    date_intervention: z.iso.date("Date invalide."),
    heure_debut: heure,
    heure_fin: heure,
    probleme_constate: texteOptionnel,
    travaux_effectues: texteOptionnel,
    probleme_resolu: z
      .enum(["oui", "non"])
      .optional()
      .transform((v) => (v === "oui" ? true : v === "non" ? false : null)),
  })
  .refine((d) => !d.heure_debut || !d.heure_fin || d.heure_fin > d.heure_debut, {
    path: ["heure_fin"],
    message: "L'heure de fin doit être après l'heure de début.",
  });

/** Nombre décimal tapé à la belge (« 12,50 ») */
const nombre = (message: string) =>
  z.union([z.string(), z.number()]).transform((v, ctx) => {
    const n = lireNombre(v);
    if (Number.isNaN(n)) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100; // deux décimales maximum, comme en base
  });

/** Une ligne de prestation (écran « Lignes ») */
export const schemaLigne = z.object({
  description: texteObligatoire("Décrivez la prestation."),
  quantite: nombre("Quantité invalide.").pipe(
    z.number().gt(0, "La quantité doit être positive.").max(99999, "Quantité trop grande."),
  ),
  unite: texteObligatoire("Indiquez l'unité."),
  prix_unitaire_htva: nombre("Prix invalide.").pipe(
    z.number().min(0, "Le prix ne peut pas être négatif.").max(999999, "Prix trop élevé."),
  ),
  taux_tva: z.union([z.literal(0), z.literal(6), z.literal(21)]),
});

export const schemaLignes = z.array(schemaLigne).max(100, "100 lignes maximum.");
export type DonneesLigne = z.infer<typeof schemaLigne>;

/** Une prestation du catalogue */
export const schemaPrestation = z.object({
  description: texteObligatoire("Décrivez la prestation."),
  unite: texteObligatoire("Indiquez l'unité."),
  prix_unitaire_htva: nombre("Prix invalide.").pipe(z.number().min(0, "Le prix ne peut pas être négatif.")),
  domaine: z
    .enum([...domaines, ""])
    .optional()
    .transform((v) => (v ? v : null)),
});
