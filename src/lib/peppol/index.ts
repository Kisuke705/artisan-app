/**
 * Point d'entrée du module Peppol. Le reste de l'application importe
 * UNIQUEMENT ce fichier : `import { peppol } from "@/lib/peppol"`.
 *
 * Au MVP, c'est une version « désactivée » : elle répond que Peppol
 * n'est pas disponible, et refuse proprement tout envoi.
 */
import type { ServicePeppol } from "./types";

export type * from "./types";

export class PeppolNonDisponible extends Error {
  constructor() {
    super("L'envoi par Peppol n'est pas encore disponible. Envoyez la facture en PDF.");
    this.name = "PeppolNonDisponible";
  }
}

const peppolDesactive: ServicePeppol = {
  estDisponible: () => false,
  verifierDestinataire: async () => ({ joignable: false, raison: "Module Peppol non activé." }),
  envoyerFacture: async () => {
    throw new PeppolNonDisponible();
  },
  statutEnvoi: async () => {
    throw new PeppolNonDisponible();
  },
};

export const peppol: ServicePeppol = peppolDesactive;
