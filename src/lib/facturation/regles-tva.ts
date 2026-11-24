/**
 * Règles TVA belges appliquées à un document.
 *
 * Ces vérifications existent DEUX fois :
 *   - ici, pour prévenir l'artisan AVANT qu'il ne clique sur « Émettre »
 *   - dans la base (emettre_document), qui a toujours le dernier mot
 *
 * ⚠️ Les textes des mentions légales sont regroupés dans MENTIONS
 * pour être faciles à faire valider (et corriger) par un comptable.
 */
import type { TauxTva } from "./calculs";

export type RegimeTvaEntreprise = "assujetti" | "franchise";
export type RegimeTvaDocument = "normal" | "autoliquidation" | "franchise";

export const LIBELLES_REGIME: Record<RegimeTvaDocument, string> = {
  normal: "TVA normale (6 % / 21 %)",
  autoliquidation: "Autoliquidation (client assujetti)",
  franchise: "Franchise des petites entreprises",
};

export const MENTIONS = {
  autoliquidation:
    "Autoliquidation – TVA due par le cocontractant (article 20 de l'AR n° 1).",
  franchise: "Régime particulier de franchise des petites entreprises.",
  tva6:
    "TVA 6 % : travaux de rénovation d'un logement privé de plus de 10 ans, sur base de l'attestation remise par le client.",
} as const;

export type DonneesVerification = {
  regimeEntreprise: RegimeTvaEntreprise;
  regimeDocument: RegimeTvaDocument;
  lignes: { tauxTva: TauxTva }[];
  client: { type: "particulier" | "entreprise"; numeroTva: string | null };
  adresse: { logementPlus10Ans: boolean | null } | null;
  attestationTva6: boolean;
};

/** Quel régime proposer par défaut pour un nouveau document ? */
export function regimeParDefaut(
  regimeEntreprise: RegimeTvaEntreprise,
  client: DonneesVerification["client"],
): RegimeTvaDocument {
  if (regimeEntreprise === "franchise") return "franchise";
  // Un client entreprise avec un n° de TVA → l'artisan devra confirmer
  // qu'il s'agit bien de travaux immobiliers ; on propose l'autoliquidation.
  if (client.type === "entreprise" && client.numeroTva) return "autoliquidation";
  return "normal";
}

/** Taux possibles pour une ligne, selon le régime du document. */
export function tauxAutorises(regime: RegimeTvaDocument): TauxTva[] {
  return regime === "normal" ? [21, 6] : [0];
}

/** Renvoie la liste des problèmes (liste vide = le document peut être émis). */
export function verifierDocument(d: DonneesVerification): string[] {
  const erreurs: string[] = [];

  if (d.lignes.length === 0) {
    erreurs.push("Le document ne contient aucune ligne.");
  }

  if (d.regimeEntreprise === "franchise" && d.regimeDocument !== "franchise") {
    erreurs.push("Votre entreprise est en régime de franchise : le document doit l'être aussi.");
  }
  if (d.regimeEntreprise === "assujetti" && d.regimeDocument === "franchise") {
    erreurs.push("Le régime de franchise est réservé aux entreprises en franchise.");
  }

  if (
    d.regimeDocument === "autoliquidation" &&
    (d.client.type !== "entreprise" || !d.client.numeroTva)
  ) {
    erreurs.push("L'autoliquidation exige un client entreprise avec un numéro de TVA.");
  }

  const autorises = tauxAutorises(d.regimeDocument);
  if (d.lignes.some((l) => !autorises.includes(l.tauxTva))) {
    erreurs.push(
      d.regimeDocument === "normal"
        ? "En régime normal, chaque ligne doit être à 6 % ou 21 %."
        : "En autoliquidation ou en franchise, toutes les lignes doivent être à 0 %.",
    );
  }

  if (d.lignes.some((l) => l.tauxTva === 6)) {
    if (d.adresse?.logementPlus10Ans !== true) {
      erreurs.push("TVA 6 % : l'adresse du chantier doit être un logement de plus de 10 ans.");
    }
    if (!d.attestationTva6) {
      erreurs.push("TVA 6 % : cochez l'attestation signée par le client.");
    }
  }

  return erreurs;
}

/** Mentions TVA à imprimer sur le document. */
export function mentionsTva(regime: RegimeTvaDocument, contientTaux6: boolean): string[] {
  const mentions: string[] = [];
  if (regime === "autoliquidation") mentions.push(MENTIONS.autoliquidation);
  if (regime === "franchise") mentions.push(MENTIONS.franchise);
  if (regime === "normal" && contientTaux6) mentions.push(MENTIONS.tva6);
  return mentions;
}
