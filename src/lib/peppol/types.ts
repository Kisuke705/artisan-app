/**
 * Module Peppol – INTERFACE SEULEMENT (non implémenté au MVP).
 *
 * Depuis le 1er janvier 2026, la facture électronique structurée via le
 * réseau Peppol est obligatoire entre entreprises assujetties en Belgique
 * (B2B). Les factures aux particuliers (B2C) ne sont pas concernées.
 *
 * Ce fichier décrit CE QUE le reste de l'application attendra du module,
 * sans dire COMMENT il le fera. Le jour où on l'implémente (avec un
 * fournisseur « Access Point » certifié), aucun autre fichier ne change.
 */

/** Résultat de la vérification : le client est-il joignable sur Peppol ? */
export type DestinatairePeppol =
  | { joignable: true; identifiantPeppol: string } // ex. « 0208:0123456749 »
  | { joignable: false; raison: string };

/** Suivi d'une facture envoyée sur le réseau. */
export type StatutEnvoiPeppol =
  | { etat: "en_attente" }
  | { etat: "livre"; livreLe: string }
  | { etat: "refuse"; raison: string };

export interface ServicePeppol {
  /** Le module est-il configuré et actif ? */
  estDisponible(): boolean;

  /** Cherche le client dans l'annuaire Peppol à partir de son numéro de TVA. */
  verifierDestinataire(numeroTva: string): Promise<DestinatairePeppol>;

  /**
   * Convertit une facture émise au format UBL (XML Peppol BIS Billing 3.0)
   * et l'envoie. Renvoie l'identifiant de l'envoi chez l'Access Point.
   */
  envoyerFacture(documentId: string): Promise<{ idEnvoi: string }>;

  /** Interroge l'Access Point sur l'état d'un envoi. */
  statutEnvoi(idEnvoi: string): Promise<StatutEnvoiPeppol>;
}
