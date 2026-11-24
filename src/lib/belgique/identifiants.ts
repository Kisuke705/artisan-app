/**
 * Numéros officiels belges : BCE, TVA et IBAN.
 *
 * Numéro d'entreprise (BCE) : 10 chiffres, commence par 0 ou 1.
 * Les 2 derniers chiffres sont un contrôle : 97 − (8 premiers chiffres modulo 97).
 *   ex. 0123.456.749 → 01234567 mod 97 = 48 → 97 − 48 = 49 ✔
 * Le numéro de TVA belge est « BE » suivi du numéro BCE.
 */

/** Garde uniquement les chiffres : « BE 0123.456.749 » → « 0123456749 » */
export function normaliserBce(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "");
  // Les anciens numéros à 9 chiffres prennent un 0 devant
  return chiffres.length === 9 ? `0${chiffres}` : chiffres;
}

export function estBceValide(saisie: string): boolean {
  const bce = normaliserBce(saisie);
  if (!/^[01]\d{9}$/.test(bce)) return false;
  const debut = Number(bce.slice(0, 8));
  const controle = Number(bce.slice(8));
  return 97 - (debut % 97) === controle;
}

/** « 0123456749 » → « 0123.456.749 » */
export function formaterBce(bce: string): string {
  const n = normaliserBce(bce);
  return `${n.slice(0, 4)}.${n.slice(4, 7)}.${n.slice(7)}`;
}

/** « be 0123.456.749 » → « BE0123456749 » (format stocké en base) */
export function normaliserTva(saisie: string): string {
  return `BE${normaliserBce(saisie.replace(/^\s*BE/i, ""))}`;
}

export function estTvaBelgeValide(saisie: string): boolean {
  if (!/^\s*BE/i.test(saisie)) return false;
  return estBceValide(saisie.replace(/^\s*BE/i, ""));
}

/** « BE0123456749 » → « BE 0123.456.749 » (format affiché) */
export function formaterTva(tva: string): string {
  return `BE ${formaterBce(tva.slice(2))}`;
}

/** IBAN : supprime espaces, met en majuscules */
export function normaliserIban(saisie: string): string {
  return saisie.replace(/\s/g, "").toUpperCase();
}

/**
 * Contrôle IBAN international (ISO 13616) :
 * on déplace les 4 premiers caractères à la fin, on remplace les lettres
 * par des nombres (A=10 … Z=35) et le résultat modulo 97 doit valoir 1.
 */
export function estIbanValide(saisie: string): boolean {
  const iban = normaliserIban(saisie);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  if (iban.startsWith("BE") && iban.length !== 16) return false;
  const deplace = iban.slice(4) + iban.slice(0, 4);
  const enChiffres = deplace.replace(/[A-Z]/g, (lettre) => String(lettre.charCodeAt(0) - 55));
  return BigInt(enChiffres) % 97n === 1n;
}

/** « BE68539007547034 » → « BE68 5390 0754 7034 » */
export function formaterIban(iban: string): string {
  return normaliserIban(iban).replace(/(.{4})/g, "$1 ").trim();
}
