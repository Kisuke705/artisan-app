/**
 * Format des numéros de documents : F-2026-0001, D-2026-0001, NC-2026-0001.
 *
 * ATTENTION : ce fichier ne fait que FORMATER / LIRE un numéro.
 * L'attribution du numéro (le compteur sans trou) se fait UNIQUEMENT dans
 * la base, par la fonction SQL emettre_document(). Le navigateur ne doit
 * jamais choisir lui-même un numéro de facture.
 */

export type TypeDocument = "devis" | "facture" | "note_credit";

export const PREFIXES: Record<TypeDocument, string> = {
  devis: "D",
  facture: "F",
  note_credit: "NC",
};

export const LIBELLES_TYPE: Record<TypeDocument, string> = {
  devis: "Devis",
  facture: "Facture",
  note_credit: "Note de crédit",
};

export function formaterNumero(type: TypeDocument, annee: number, sequence: number): string {
  // Au-delà de 9999, le numéro s'allonge simplement : F-2026-10000
  return `${PREFIXES[type]}-${annee}-${String(sequence).padStart(4, "0")}`;
}

export function lireNumero(
  numero: string,
): { type: TypeDocument; annee: number; sequence: number } | null {
  const morceaux = /^(D|F|NC)-(\d{4})-(\d{4,})$/.exec(numero);
  if (!morceaux) return null;
  const type = (Object.keys(PREFIXES) as TypeDocument[]).find(
    (t) => PREFIXES[t] === morceaux[1],
  )!;
  return { type, annee: Number(morceaux[2]), sequence: Number(morceaux[3]) };
}

/**
 * Vérifie qu'une liste de numéros d'une même année ne contient aucun trou.
 * Renvoie les numéros manquants (liste vide = tout va bien).
 * Utile pour un contrôle visuel dans l'application ou pour le comptable.
 */
export function numerosManquants(sequences: number[]): number[] {
  if (sequences.length === 0) return [];
  const presents = new Set(sequences);
  const max = Math.max(...sequences);
  const manquants: number[] = [];
  for (let n = 1; n <= max; n++) {
    if (!presents.has(n)) manquants.push(n);
  }
  return manquants;
}
