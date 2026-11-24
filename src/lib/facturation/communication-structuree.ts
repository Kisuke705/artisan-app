/**
 * Communication structurée belge (virement) : +++123/4567/89012+++
 *
 * 12 chiffres = 10 chiffres « de base » + 2 chiffres de contrôle.
 *   - base : 2 chiffres pour l'année (26) + 8 pour le numéro de facture
 *   - contrôle : base modulo 97 (si le reste vaut 0, on met 97)
 *
 * La banque du client refait ce calcul : une faute de frappe est détectée.
 * Même calcul côté SQL : fonction communication_structuree().
 */

export function genererCommunication(annee: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 99_999_999) {
    throw new Error(`Numéro de séquence hors limites : ${sequence}`);
  }
  // BigInt : nombres entiers sans limite de taille (10 chiffres, on reste prudent)
  const base = BigInt(annee % 100) * 100_000_000n + BigInt(sequence);
  const controle = Number(base % 97n) || 97;
  const chiffres = base.toString().padStart(10, "0") + controle.toString().padStart(2, "0");
  return formaterCommunication(chiffres);
}

/** « 260000000170 » → « +++260/0000/00170+++ » */
export function formaterCommunication(chiffres: string): string {
  return `+++${chiffres.slice(0, 3)}/${chiffres.slice(3, 7)}/${chiffres.slice(7, 12)}+++`;
}

/** Vérifie une communication tapée par quelqu'un (accepte +, / et espaces). */
export function estCommunicationValide(saisie: string): boolean {
  const chiffres = saisie.replace(/[+/\s*]/g, "");
  if (!/^\d{12}$/.test(chiffres)) return false;
  const base = BigInt(chiffres.slice(0, 10));
  const controle = Number(chiffres.slice(10));
  return (Number(base % 97n) || 97) === controle;
}
